import { WebSocket } from 'ws';
import { db } from '../../config/database';
import { env } from '../../config/env';
import {
  muLawToLinear16Buffer,
  resample8kTo16k,
  createWavBuffer,
  wavToTelephonyMuLaw,
  chunkMuLawFrames,
  calculatePcmEnergy,
} from './audio-codec';
import { maskPhoneNumber } from './telephony';

export interface VoiceSessionState {
  callSid: string;
  streamSid: string;
  institutionId: string;
  studentId: string;
  studentName?: string;
  guardianId?: string;
  guardianName?: string;
  phone?: string;
  language: 'te-IN' | 'en-IN' | 'hi-IN' | string;
  useCase: string;
  transcript: Array<{ role: 'assistant' | 'user'; content: string; timestamp: string }>;
  startedAt: Date;
  lastAudioReceivedAt: number;
  isAgentSpeaking: boolean;
  silenceCount: number;
  silenceTimer?: NodeJS.Timeout;
  maxCallTimer?: NodeJS.Timeout;
  audioPlaybackTimer?: NodeJS.Timeout;
  inboundAudioChunks: Buffer[];
  isProcessingTurn: boolean;
  ws: WebSocket;
  provider: 'twilio' | 'exotel';
}

export class VoiceSessionManager {
  private sessions = new Map<string, VoiceSessionState>();

  // Sarvam Saaras STT API Caller
  async transcribeAudio(wavBuffer: Buffer, language: string): Promise<string> {
    if (!env.SARVAM_API_KEY) {
      console.warn('[STT] SARVAM_API_KEY missing, skipping transcription');
      return '';
    }

    try {
      const formData = new FormData();
      formData.append('file', new Blob([new Uint8Array(wavBuffer)], { type: 'audio/wav' }), 'audio.wav');
      formData.append('model', 'saaras:v3');
      formData.append('language_code', language || 'te-IN');

      const res = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: {
          'api-subscription-key': env.SARVAM_API_KEY,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.text();
        console.warn(`[STT ERROR ${res.status}]`, err);
        return '';
      }

      const data: any = await res.json();
      return data.transcript?.trim() || '';
    } catch (err: any) {
      console.error('[STT EXCEPTION]', err.message);
      return '';
    }
  }

  // Handle WebSocket Connection
  handleConnection(ws: WebSocket) {
    let currentSession: VoiceSessionState | null = null;

    ws.on('message', async (data: Buffer | string) => {
      try {
        const raw = typeof data === 'string' ? data : data.toString('utf8');
        let msg: any;
        try {
          msg = JSON.parse(raw);
        } catch (_) {
          return; // Ignore non-json frames
        }

        // 1. Twilio Stream Connected
        if (msg.event === 'connected') {
          console.log('[VOICE WS] Telephony gateway connected');
          return;
        }

        // 2. Stream Started
        if (msg.event === 'start') {
          const startData = msg.start || {};
          const custom = startData.customParameters || {};

          const streamSid = msg.streamSid || startData.streamSid || `stream_${Date.now()}`;
          const callSid = startData.callSid || `call_${Date.now()}`;

          console.log(`[VOICE WS] Call session started. Stream SID: ${streamSid}, Call SID: ${callSid}`);

          currentSession = {
            callSid,
            streamSid,
            institutionId: custom.institutionId || env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001',
            studentId: custom.studentId || 'SIA-2026-0101',
            studentName: custom.studentName || 'Sai Teja Chary',
            guardianId: custom.guardianId,
            guardianName: custom.guardianName || 'Parent',
            phone: custom.phone,
            language: custom.language || 'te-IN',
            useCase: custom.useCase || 'event_notice',
            transcript: [],
            startedAt: new Date(),
            lastAudioReceivedAt: Date.now(),
            isAgentSpeaking: false,
            silenceCount: 0,
            inboundAudioChunks: [],
            isProcessingTurn: false,
            ws,
            provider: msg.start?.accountSid ? 'twilio' : 'exotel',
          };

          this.sessions.set(streamSid, currentSession);

          // Setup Hard Limits: 5 min max call duration
          currentSession.maxCallTimer = setTimeout(() => {
            console.log(`[VOICE WS] 5-minute hard call limit reached for ${callSid}`);
            this.speakAndHangup(currentSession!, 'max_duration_reached');
          }, 300000);

          // Deliver First Turn Opening Announcement
          await this.deliverFirstTurn(currentSession);
          return;
        }

        // 3. Audio Media Frame Received
        if (msg.event === 'media' && currentSession) {
          const payload = msg.media?.payload;
          if (!payload) return;

          const rawMuLaw = Buffer.from(payload, 'base64');
          const pcmLinear = muLawToLinear16Buffer(rawMuLaw);
          const energy = calculatePcmEnergy(pcmLinear);

          currentSession.lastAudioReceivedAt = Date.now();

          // BARGE-IN DETECTION: If caller speaks with significant energy while assistant is speaking
          if (currentSession.isAgentSpeaking && energy > 650) {
            console.log(`[VOICE WS:BARGE-IN] Interruption detected (energy: ${energy.toFixed(0)}). Clearing outbound audio queue.`);
            this.interruptAssistant(currentSession);
          }

          // Accumulate audio when not speaking
          if (!currentSession.isAgentSpeaking && energy > 250) {
            currentSession.inboundAudioChunks.push(rawMuLaw);
          } else if (!currentSession.isAgentSpeaking && currentSession.inboundAudioChunks.length > 0) {
            // Buffer trailing silence
            currentSession.inboundAudioChunks.push(rawMuLaw);

            // If we have accumulated at least ~1.2s of audio and now have silence -> process utterance
            if (currentSession.inboundAudioChunks.length >= 60 && !currentSession.isProcessingTurn) {
              const audioToProcess = Buffer.concat(currentSession.inboundAudioChunks);
              currentSession.inboundAudioChunks = [];
              this.processCallerUtterance(currentSession, audioToProcess);
            }
          }
          return;
        }

        // 4. Stream Stopped / Call Ended
        if (msg.event === 'stop' && currentSession) {
          console.log(`[VOICE WS] Stream stopped by carrier for Call SID ${currentSession.callSid}`);
          await this.finalizeCallSession(currentSession, 'completed');
          this.cleanupSession(currentSession.streamSid);
          return;
        }
      } catch (err: any) {
        console.error('[VOICE WS ERROR]', err.message);
      }
    });

    ws.on('close', async () => {
      if (currentSession) {
        console.log(`[VOICE WS] WebSocket disconnected for Call SID ${currentSession.callSid}`);
        await this.finalizeCallSession(currentSession, 'completed');
        this.cleanupSession(currentSession.streamSid);
      }
    });

    ws.on('error', (err) => {
      console.warn('[VOICE WS SOCKET ERROR]', err.message);
    });
  }

  // Interruption / Barge-in Handler
  private interruptAssistant(session: VoiceSessionState) {
    session.isAgentSpeaking = false;
    if (session.audioPlaybackTimer) {
      clearInterval(session.audioPlaybackTimer);
      session.audioPlaybackTimer = undefined;
    }

    // Send Twilio "clear" event to empty carrier audio buffer immediately
    if (session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(JSON.stringify({
        event: 'clear',
        streamSid: session.streamSid,
      }));
    }
  }

  // Deliver First Turn Greeting & Notice
  private async deliverFirstTurn(session: VoiceSessionState) {
    const greetingText = this.getOpeningScript(session);
    session.transcript.push({
      role: 'assistant',
      content: greetingText,
      timestamp: new Date().toISOString(),
    });

    await this.speakText(session, greetingText);
  }

  // Get Pure Language Opening Script
  private getOpeningScript(session: VoiceSessionState): string {
    const name = session.guardianName || 'తల్లిదండ్రులు';
    const student = session.studentName || 'మీ విద్యార్థి';

    if (session.language === 'te-IN') {
      if (session.useCase === 'fee_reminder') {
        return `నమస్కారం అండి! నేను నారాయణ పాఠశాల నుండి ప్రియను మాట్లాడుతున్నాను. ${student} రెండవ విడత ట్యూషన్ ఫీజు చెల్లింపు గడువు సమీపిస్తోంది అండి. మీ బకాయి ఫీజు వివరాలు లేదా చెల్లింపు విధానాలు తెలుసుకోవడానికి మీరు నన్ను అడగవచ్చు.`;
      }
      if (session.useCase === 'attendance_alert') {
        return `నమస్కారం అండి! నారాయణ పాఠశాల నుండి ప్రియను. ${student} ఈ రోజు ఉదయం పాఠశాల ప్రార్థన సమయానికి రాలేదు. విద్యార్థి సెలవులో ఉన్నారా అని దయచేసి ధృవీకరించండి.`;
      }
      if (session.useCase === 'exam_announcement') {
        return `నమస్కారం అండి! నారాయణ పాఠశాల త్రైమాసిక పరీక్షల ఫలితాలు విడుదలయ్యాయి. ${student} సాధించిన మార్కులు మరియు గ్రేడ్ వివరాలు తెలుసుకోవడానికి మీరు నన్ను అడగవచ్చు అండి.`;
      }
      return `నమస్కారం అండి! నేను నారాయణ పాఠశాల నుండి ప్రియను మాట్లాడుతున్నాను. రాబోయే శనివారం మన పాఠశాలలో వార్షిక క్రీడా దినోత్సవం నిర్వహించబడుతుంది. తల్లిదండ్రులందరికీ సాదర స్వాగతం అండి. మీకు ఏవైనా సందేహాలు ఉంటే నన్ను అడగవచ్చు.`;
    }

    if (session.language === 'hi-IN') {
      return `नमस्ते! मैं नारायण स्कूल से प्रिया बोल रही हूँ। आगामी शनिवार को हमारे स्कूल में वार्षिक खेल दिवस का आयोजन किया जा रहा है। ${student} के संबंध में यदि आपका कोई प्रश्न है तो आप मुझसे पूछ सकते हैं।`;
    }

    return `Good morning! This is Priya calling from Narayana High School. We are celebrating our Annual Sports Day this upcoming Saturday. Please let me know if you have any questions regarding ${student}'s academics or school events.`;
  }

  // Process Caller Utterance: STT -> Groq Tool Calling -> TTS -> Stream Out
  private async processCallerUtterance(session: VoiceSessionState, muLawBuffer: Buffer) {
    session.isProcessingTurn = true;
    try {
      // 1. Resample 8kHz mu-law -> 16kHz linear PCM WAV
      const pcm8k = muLawToLinear16Buffer(muLawBuffer);
      const pcm16k = resample8kTo16k(pcm8k);
      const wav = createWavBuffer(pcm16k, 16000);

      // 2. Call Sarvam Saaras STT
      const userText = await this.transcribeAudio(wav, session.language);
      if (!userText || userText.trim().length === 0) {
        session.isProcessingTurn = false;
        return;
      }

      console.log(`[VOICE WS:CALLER] Transcribed (${session.language}): "${userText}"`);
      session.transcript.push({
        role: 'user',
        content: userText,
        timestamp: new Date().toISOString(),
      });

      // 3. Dynamic Import of Groq Chat with Tools (circular avoidance)
      const { callGroqChatWithTools } = await import('./ai-yantra.routes');
      const chatHistory = session.transcript.map(t => ({ role: t.role, content: t.content }));

      const aiResponse = await callGroqChatWithTools(
        session.institutionId,
        chatHistory,
        session.studentId,
        session.language
      );

      const replyText = aiResponse.reply || (
        session.language === 'te-IN'
          ? 'సరేనండి, వివరాలు సరిచూసి మీకు త్వరలోనే సమాచారం తెలియజేస్తాము.'
          : 'Thank you, I will confirm the records and update you.'
      );

      console.log(`[VOICE WS:AGENT] Spoken response: "${replyText}"`);
      session.transcript.push({
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toISOString(),
      });

      // 4. Synthesize & Stream Back
      await this.speakText(session, replyText);
    } catch (err: any) {
      console.error('[VOICE WS UTTERANCE ERROR]', err.message);
    } finally {
      session.isProcessingTurn = false;
    }
  }

  // Speak Text Aloud via Sarvam Bulbul v2 and Stream in 20ms Frames
  async speakText(session: VoiceSessionState, text: string) {
    if (!text || !text.trim()) return;

    try {
      const { callSarvamTTS } = await import('./ai-yantra.routes');
      const base64Wav = await callSarvamTTS(text, session.language, 'priya');

      if (!base64Wav) return;

      const wavBuffer = Buffer.from(base64Wav, 'base64');
      const muLawAudio = wavToTelephonyMuLaw(wavBuffer);
      const frames = chunkMuLawFrames(muLawAudio, 160); // 20ms frames @ 8kHz

      session.isAgentSpeaking = true;
      let frameIndex = 0;

      session.audioPlaybackTimer = setInterval(() => {
        if (!session.isAgentSpeaking || frameIndex >= frames.length) {
          clearInterval(session.audioPlaybackTimer);
          session.audioPlaybackTimer = undefined;
          session.isAgentSpeaking = false;
          return;
        }

        const frame = frames[frameIndex++];
        if (session.ws.readyState === WebSocket.OPEN) {
          session.ws.send(JSON.stringify({
            event: 'media',
            streamSid: session.streamSid,
            media: {
              payload: frame.toString('base64'),
            },
          }));
        }
      }, 20); // 20ms cadence matches telephony packetizer
    } catch (err: any) {
      console.error('[VOICE WS SPEAK ERROR]', err.message);
      session.isAgentSpeaking = false;
    }
  }

  // Polite Goodbye and Hangup
  private async speakAndHangup(session: VoiceSessionState, reason: string) {
    const goodbye = session.language === 'te-IN'
      ? 'నారాయణ పాఠశాలకు సమయం ఇచ్చినందుకు ధన్యవాదాలు అండి. సెలవు.'
      : session.language === 'hi-IN'
      ? 'नारायण स्कूल को समय देने के लिए धन्यवाद। आपका दिन शुभ हो।'
      : 'Thank you for your time. Have a wonderful day.';

    await this.speakText(session, goodbye);

    setTimeout(() => {
      this.finalizeCallSession(session, reason);
      if (session.ws.readyState === WebSocket.OPEN) {
        session.ws.close();
      }
      this.cleanupSession(session.streamSid);
    }, 4000);
  }

  // Persist Call Ledger to PostgreSQL
  async finalizeCallSession(session: VoiceSessionState, outcome: string) {
    try {
      const duration = Math.max(1, Math.round((Date.now() - session.startedAt.getTime()) / 1000));
      const maskedPhone = session.phone ? maskPhoneNumber(session.phone) : '+91XXXXXX0000';

      const payload = {
        student_id: session.studentId,
        student_name: session.studentName,
        guardian_name: session.guardianName,
        use_case: session.useCase,
        language: session.language,
        transcript: session.transcript,
        call_outcome: outcome,
      };

      await db.query(
        `INSERT INTO ai_voice_calls (status, duration_seconds, conversation_payload, started_at, ended_at)
         VALUES ($1, $2, $3, $4, now())`,
        [
          duration < 25 ? 'interrupted' : outcome === 'completed' ? 'completed' : 'failed',
          duration,
          JSON.stringify(payload),
          session.startedAt,
        ]
      );

      console.log(`[VOICE WS:PERSIST] Saved call ledger for ${session.callSid} (${duration}s, status: ${outcome})`);

      // If call dropped early (<25s) or was interrupted, trigger WhatsApp recap
      if (duration < 25 || outcome === 'interrupted') {
        const { triggerPostCallRecovery } = await import('./ai-yantra.routes');
        await triggerPostCallRecovery(
          session.institutionId,
          session.phone || '+919701011223',
          session.guardianName || 'Parent',
          session.studentName || 'Student',
          duration,
          session.useCase
        );
      }
    } catch (err: any) {
      console.error('[VOICE WS FINALIZE ERROR]', err.message);
    }
  }

  private cleanupSession(streamSid: string) {
    const s = this.sessions.get(streamSid);
    if (s) {
      if (s.silenceTimer) clearTimeout(s.silenceTimer);
      if (s.maxCallTimer) clearTimeout(s.maxCallTimer);
      if (s.audioPlaybackTimer) clearInterval(s.audioPlaybackTimer);
      this.sessions.delete(streamSid);
    }
  }
}

export const voiceSessionManager = new VoiceSessionManager();
