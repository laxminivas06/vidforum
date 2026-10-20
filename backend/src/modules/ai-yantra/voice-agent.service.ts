import { WebSocket } from 'ws';
import { db } from '../../config/database';
import { env } from '../../config/env';
import { muLawToLinear16Buffer } from './audio/mulaw';
import { resample8kTo16k, createWavBuffer, StereoCallRecorder } from './audio/wav';
import { SessionVadTracker } from './audio/vad';
import { getComfortNoiseFrame, ACOUSTIC_FILLER_SCRIPTS } from './audio/comfortNoise';
import { maskPhoneNumber } from './telephony';
import { prefetchStudentContext } from './intelligence/tools';
import { synthesizeToMuLawFrames } from './intelligence/sarvamTtsStream';
import { transcribeWithSarvam } from './intelligence/sarvamStt';
import { processConversationalTurn } from './intelligence/groqBrain';

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
  comfortNoiseTimer?: NodeJS.Timeout;
  inboundAudioChunks: Buffer[];
  isProcessingTurn: boolean;
  ws: WebSocket;
  provider: 'twilio' | 'exotel';
  vadTracker: SessionVadTracker;
  recorder: StereoCallRecorder;
  studentContext?: any;
}

export class VoiceSessionManager {
  private sessions = new Map<string, VoiceSessionState>();

  // Sarvam Saaras STT API Caller (delegates to transcribeWithSarvam)
  async transcribeAudio(wavBuffer: Buffer, language: string): Promise<string> {
    return await transcribeWithSarvam(wavBuffer, {
      language,
      mode: 'codemix',
    });
  }

  // Handle WebSocket Connection from Carrier Gateway
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
            studentName: custom.studentName ? decodeURIComponent(custom.studentName) : 'Sai Teja Chary',
            guardianId: custom.guardianId,
            guardianName: custom.guardianName ? decodeURIComponent(custom.guardianName) : 'Parent',
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
            vadTracker: new SessionVadTracker(),
            recorder: new StereoCallRecorder(),
          };

          this.sessions.set(streamSid, currentSession);

          // Pre-fetch student academic & fee dossier in the background
          prefetchStudentContext(currentSession.institutionId, currentSession.studentId)
            .then((dossier) => {
              if (dossier && currentSession) {
                currentSession.studentContext = dossier;
                if (dossier.studentName) currentSession.studentName = dossier.studentName;
                if (dossier.guardianName) currentSession.guardianName = dossier.guardianName;
                console.log(`[VOICE WS:DOSSIER] Pre-warmed academic report card loaded for ${dossier.studentName}`);
              }
            })
            .catch(() => {});

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

          // Record inbound audio on Left Channel
          currentSession.recorder.recordLeft(pcmLinear);

          // Voice Activity & Barge-In Evaluation
          const { isSpeech, bargeInTriggered, energy } = currentSession.vadTracker.processFrame(
            pcmLinear,
            currentSession.isAgentSpeaking
          );

          currentSession.lastAudioReceivedAt = Date.now();

          // INSTANT BARGE-IN: If caller speaks with vocal energy while assistant is speaking
          if (bargeInTriggered && currentSession.isAgentSpeaking) {
            console.log(
              `[VOICE WS:BARGE-IN] Interruption detected (energy: ${energy.toFixed(0)}). Clearing outbound audio queue.`
            );
            this.interruptAssistant(currentSession);
          }

          // Accumulate audio when agent is not speaking
          if (!currentSession.isAgentSpeaking) {
            if (isSpeech) {
              currentSession.inboundAudioChunks.push(rawMuLaw);
              currentSession.silenceCount = 0; // Reset silence counter on active speech
            } else if (currentSession.inboundAudioChunks.length > 0) {
              // Caller has spoken and is currently pausing
              currentSession.inboundAudioChunks.push(rawMuLaw);
              currentSession.silenceCount = (currentSession.silenceCount || 0) + 1;

              // Natural turn completion requires:
              // 1. Continuous silence for at least 600ms (30 consecutive frames)
              // 2. Total accumulated speech of at least 500ms (25 frames)
              // This guarantees the caller is never cut off mid-thought!
              if (
                currentSession.silenceCount >= 30 &&
                currentSession.inboundAudioChunks.length >= 25 &&
                !currentSession.isProcessingTurn
              ) {
                console.log(
                  `[VOICE WS:VAD] Natural end-of-turn detected. Processing ${currentSession.inboundAudioChunks.length} frames (${currentSession.inboundAudioChunks.length * 20}ms audio).`
                );
                const audioToProcess = Buffer.concat(currentSession.inboundAudioChunks);
                currentSession.inboundAudioChunks = [];
                currentSession.silenceCount = 0;
                this.processCallerUtterance(currentSession, audioToProcess);
              }
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
      session.ws.send(
        JSON.stringify({
          event: 'clear',
          streamSid: session.streamSid,
        })
      );
    }

    // Mark previous assistant turn with [Agent Interrupted] so the LLM brain knows it was cut short
    for (let i = session.transcript.length - 1; i >= 0; i--) {
      if (session.transcript[i].role === 'assistant') {
        if (!session.transcript[i].content.includes('[Agent Interrupted]')) {
          session.transcript[i].content += ' [Agent Interrupted]';
        }
        break;
      }
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

      // 2. Call Sarvam Saaras v3 STT in 'codemix' mode
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

      // 3. Conversational Reasoning via Groq LPU with Counselor Persona
      const chatHistory = session.transcript.map((t) => ({ role: t.role, content: t.content }));

      const aiResponse = await processConversationalTurn(chatHistory, {
        institutionId: session.institutionId,
        studentId: session.studentId,
        studentName: session.studentName,
        guardianName: session.guardianName,
        language: session.language,
        useCase: session.useCase,
        studentDossier: session.studentContext?.dossierSummary,
        onToolStart: (toolName) => {
          console.log(`[VOICE WS:TOOL] Live lookup triggered: ${toolName}`);
          // Send pre-cached acoustic filler clip so caller never hears dead air
          const filler =
            ACOUSTIC_FILLER_SCRIPTS[session.language as keyof typeof ACOUSTIC_FILLER_SCRIPTS] ||
            ACOUSTIC_FILLER_SCRIPTS['te-IN'];
          this.speakText(session, filler).catch(() => {});
        },
      });

      const replyText =
        aiResponse.reply ||
        (session.language === 'te-IN'
          ? 'సరేనండి, వివరాలు సరిచూసి మీకు త్వరలోనే సమాచారం తెలియజేస్తాము.'
          : 'Thank you, I will confirm the details and update you.');

      console.log(`[VOICE WS:AGENT] Spoken response: "${replyText}"`);
      session.transcript.push({
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toISOString(),
      });

      // 4. Synthesize & Stream Back in Native 8kHz Frames (Zero Pitch Distortion)
      await this.speakText(session, replyText);
    } catch (err: any) {
      console.error('[VOICE WS UTTERANCE ERROR]', err.message);
    } finally {
      session.isProcessingTurn = false;
    }
  }

  // Speak Text Aloud via Sarvam Bulbul and Stream with Pre-buffered Jitter-free Cadence @ 8kHz
  async speakText(session: VoiceSessionState, text: string) {
    if (!text || !text.trim()) return;

    // 1. Immediately cancel any prior audio playback timer to prevent stream overlap/clashing
    if (session.audioPlaybackTimer) {
      clearTimeout(session.audioPlaybackTimer);
      clearInterval(session.audioPlaybackTimer);
      session.audioPlaybackTimer = undefined;
    }

    try {
      // 2. Synthesize directly to native 8kHz mu-law frames (zero 7350Hz decimation pitch-warp)
      const frames = await synthesizeToMuLawFrames(text, {
        language: session.language,
        speaker: 'priya',
        sampleRate: 8000,
      });

      if (!frames || frames.length === 0) return;

      session.isAgentSpeaking = true;

      // 3. Initial Pre-Buffer Burst (300ms = 15 frames)
      // Immediately primes Twilio's carrier jitter buffer, completely eliminating stutter and micro-drops!
      const PREBUFFER_FRAMES = Math.min(15, frames.length);
      let frameIndex = 0;

      for (let i = 0; i < PREBUFFER_FRAMES; i++) {
        const frame = frames[frameIndex++];
        session.recorder.recordRight(muLawToLinear16Buffer(frame));

        if (session.ws.readyState === WebSocket.OPEN) {
          session.ws.send(
            JSON.stringify({
              event: 'media',
              streamSid: session.streamSid,
              media: {
                payload: frame.toString('base64'),
              },
            })
          );
        }
      }

      if (frameIndex >= frames.length) {
        session.isAgentSpeaking = false;
        return;
      }

      // 4. Drift-Compensated High-Resolution Pacer for Remaining Frames
      const startTime = Date.now();
      const intervalMs = 20;

      const scheduleNextFrame = () => {
        if (!session.isAgentSpeaking || frameIndex >= frames.length) {
          session.audioPlaybackTimer = undefined;
          session.isAgentSpeaking = false;
          return;
        }

        const frame = frames[frameIndex++];
        session.recorder.recordRight(muLawToLinear16Buffer(frame));

        if (session.ws.readyState === WebSocket.OPEN) {
          session.ws.send(
            JSON.stringify({
              event: 'media',
              streamSid: session.streamSid,
              media: {
                payload: frame.toString('base64'),
              },
            })
          );
        }

        // Calculate expected elapsed time relative to frames paced
        const framesPaced = frameIndex - PREBUFFER_FRAMES;
        const expectedElapsed = framesPaced * intervalMs;
        const actualElapsed = Date.now() - startTime;
        const delay = Math.max(0, expectedElapsed - actualElapsed);

        session.audioPlaybackTimer = setTimeout(scheduleNextFrame, delay);
      };

      session.audioPlaybackTimer = setTimeout(scheduleNextFrame, intervalMs);
    } catch (err: any) {
      console.error('[VOICE WS SPEAK ERROR]', err.message);
      session.isAgentSpeaking = false;
    }
  }

  // Polite Goodbye and Hangup
  private async speakAndHangup(session: VoiceSessionState, reason: string) {
    const goodbye =
      session.language === 'te-IN'
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
      if (s.comfortNoiseTimer) clearInterval(s.comfortNoiseTimer);
      this.sessions.delete(streamSid);
    }
  }
}

export const voiceSessionManager = new VoiceSessionManager();
