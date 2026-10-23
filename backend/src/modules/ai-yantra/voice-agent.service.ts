/**
 * VID Platform Voice Agent (AI Yantra v3.0) Real-Time Voice Session Manager
 * Orchestrates:
 * 1. WebSocket Streaming TTS (bulbul:v4-flash / bulbul:v3) @ 8000 Hz mu-law
 * 2. Neural VAD (Silero v5 ONNX) with 120ms Instant Barge-In & Semantic Turn Detection
 * 3. Saaras v3 Code-Mixed STT (mode: 'codemix')
 * 4. Ring-State Context Pre-Fetching & Pre-Cached Acoustic Fillers
 * 5. Comfort Noise Generation (CNG @ -55 dBFS) during thinking gaps
 * 6. Dual-Channel Stereo Call Recording (L = Parent, R = Counselor)
 */

import { WebSocket } from 'ws';
import { db } from '../../config/database';
import { env } from '../../config/env';
import { muLawToLinear16Buffer } from './audio/mulaw';
import { resample8kTo16k, createWavBuffer, StereoCallRecorder } from './audio/wav';
import { SessionVadTracker, isSemanticCompleteClause } from './audio/vad';
import {
  getComfortNoiseFrame,
  ACOUSTIC_FILLER_SCRIPTS,
  fillerAudioCache,
  prewarmAcousticFillers,
} from './audio/comfortNoise';
import { maskPhoneNumber } from './telephony';
import { prefetchStudentContext } from './intelligence/tools';
import {
  synthesizeToMuLawFrames,
  SarvamTtsStreamClient,
} from './intelligence/sarvamTtsStream';
import { transcribeWithSarvam } from './intelligence/sarvamStt';
import { processConversationalTurn } from './intelligence/groqBrain';

// In-memory cache for dual-channel stereo call recordings (keyed by callId and callSid)
const callRecordingsCache = new Map<string, Buffer>();

// In-memory cache for ring-state pre-fetched student contexts (keyed by callSid or phone)
const prefetchedCallContexts = new Map<string, any>();

// In-memory cache for pre-synthesized opening greetings (keyed by callSid, phone, or studentId)
const precomputedGreetingCache = new Map<string, Buffer[]>();

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
  initialGreeting?: string;
  transcript: Array<{ role: 'assistant' | 'user'; content: string; timestamp: string }>;
  startedAt: Date;
  lastAudioReceivedAt: number;
  isAgentSpeaking: boolean;
  isInitialTurnDelivered: boolean;
  silenceCount: number;
  silenceTimer?: NodeJS.Timeout;
  maxCallTimer?: NodeJS.Timeout;
  audioPlaybackTimer?: NodeJS.Timeout;
  comfortNoiseTimer?: NodeJS.Timeout;
  inboundAudioChunks: Buffer[];
  preRollBuffer: Buffer[];
  isProcessingTurn: boolean;
  ws: WebSocket;
  provider: 'twilio' | 'exotel';
  vadTracker: SessionVadTracker;
  recorder: StereoCallRecorder;
  studentContext?: any;
  activeTtsClient?: SarvamTtsStreamClient | null;
}

export class VoiceSessionManager {
  private sessions = new Map<string, VoiceSessionState>();

  constructor() {
    // Pre-warm acoustic fillers in RAM on startup
    prewarmAcousticFillers(synthesizeToMuLawFrames).catch(() => {});
  }

  /**
   * Pre-fetches student report card during the call's "initiated" / "ringing" state
   * (invoked before parent picks up the line)
   */
  async prefetchCallContext(key: string, institutionId: string, studentId: string) {
    try {
      const dossier = await prefetchStudentContext(institutionId, studentId);
      if (dossier) {
        prefetchedCallContexts.set(key, dossier);
        console.log(`[VOICE WS:PREFETCH] Pre-fetched report card for ${dossier.studentName} (Key: ${key})`);
      }
    } catch (err: any) {
      console.warn(`[VOICE WS:PREFETCH ERROR] Key: ${key}:`, err.message);
    }
  }

  /**
   * Pre-synthesizes opening counselor greeting during ring-state (0ms latency on pickup)
   */
  async prewarmGreetingAudio(key: string, text: string, language = 'te-IN') {
    try {
      const frames = await synthesizeToMuLawFrames(text, { language, model: 'bulbul:v4-flash' });
      if (frames && frames.length > 0) {
        precomputedGreetingCache.set(key, frames);
        console.log(`[VOICE WS:PREWARM] Pre-warmed ${frames.length} opening greeting frames for key: ${key}`);
      }
    } catch (err: any) {
      console.warn(`[VOICE WS:PREWARM ERROR] Key: ${key}:`, err.message);
    }
  }

  /**
   * Returns in-memory dual-channel stereo recording WAV buffer
   */
  getCallAudio(callIdentifier: string): Buffer | null {
    return callRecordingsCache.get(callIdentifier) || null;
  }

  /**
   * Sarvam Saaras v3 STT in 'codemix' mode
   */
  async transcribeAudio(wavBuffer: Buffer, language: string): Promise<string> {
    return await transcribeWithSarvam(wavBuffer, {
      language,
      mode: 'codemix',
    });
  }

  // Handle WebSocket Connection from Telephony Carrier Gateway
  handleConnection(ws: WebSocket) {
    let currentSession: VoiceSessionState | null = null;

    ws.on('message', async (data: Buffer | string) => {
      try {
        const raw = typeof data === 'string' ? data : data.toString('utf8');
        let msg: any;
        try {
          msg = JSON.parse(raw);
        } catch (_) {
          return;
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

          const instId = custom.institutionId || env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001';
          const studentIdentifier = custom.studentId || 'SIA-2026-0101';

          // Check if pre-fetched context was cached during ring-state
          const ringStateContext =
            prefetchedCallContexts.get(callSid) ||
            prefetchedCallContexts.get(custom.phone) ||
            prefetchedCallContexts.get(studentIdentifier);

          currentSession = {
            callSid,
            streamSid,
            institutionId: instId,
            studentId: studentIdentifier,
            studentName: ringStateContext?.studentName || (custom.studentName ? decodeURIComponent(custom.studentName) : 'Sai Teja Chary'),
            guardianId: custom.guardianId,
            guardianName: ringStateContext?.guardianName || (custom.guardianName ? decodeURIComponent(custom.guardianName) : 'Parent'),
            phone: custom.phone,
            language: custom.language || 'te-IN',
            useCase: custom.useCase || 'event_notice',
            initialGreeting: custom.initialGreeting ? decodeURIComponent(custom.initialGreeting) : undefined,
            transcript: [],
            startedAt: new Date(),
            lastAudioReceivedAt: Date.now(),
            isAgentSpeaking: false,
            isInitialTurnDelivered: false,
            silenceCount: 0,
            inboundAudioChunks: [],
            preRollBuffer: [],
            isProcessingTurn: false,
            ws,
            provider: msg.start?.accountSid ? 'twilio' : 'exotel',
            vadTracker: new SessionVadTracker(),
            recorder: new StereoCallRecorder(),
            studentContext: ringStateContext || null,
          };

          this.sessions.set(streamSid, currentSession);

          // Start comfort noise immediately so carrier and caller never experience dead air
          this.startComfortNoise(currentSession);

          // If not already in ring-state cache, pre-fetch student context immediately
          if (!currentSession.studentContext) {
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
          }

          // Setup Hard Limits: 5 min max call duration
          currentSession.maxCallTimer = setTimeout(() => {
            console.log(`[VOICE WS] 5-minute hard call limit reached for ${callSid}`);
            this.speakAndHangup(currentSession!, 'max_duration_reached');
          }, 300000);

          // Deliver First Turn Opening Greeting
          await this.deliverFirstTurn(currentSession);
          return;
        }

        // 3. Audio Media Frame Received (20ms G.711 mu-law @ 8kHz)
        if (msg.event === 'media' && currentSession) {
          const payload = msg.media?.payload;
          if (!payload) return;

          const rawMuLaw = Buffer.from(payload, 'base64');
          const pcmLinear8k = muLawToLinear16Buffer(rawMuLaw);
          const pcmLinear16k = resample8kTo16k(pcmLinear8k);

          // Record inbound audio on Left Channel (Parent)
          currentSession.recorder.recordLeft(pcmLinear8k);

          // Maintain rolling pre-roll buffer (last 8 frames = 160ms)
          currentSession.preRollBuffer.push(rawMuLaw);
          if (currentSession.preRollBuffer.length > 8) {
            currentSession.preRollBuffer.shift();
          }

          // Neural Voice Activity & Barge-In Evaluation (Silero VAD v5 ONNX)
          const { isSpeech, bargeInTriggered, turnCompleted } =
            await currentSession.vadTracker.processFrameAsync(
              pcmLinear8k,
              pcmLinear16k,
              currentSession.isAgentSpeaking
            );

          currentSession.lastAudioReceivedAt = Date.now();

          // 1. INSTANT BARGE-IN: If caller speaks for >= 120ms while assistant is speaking
          if (bargeInTriggered && currentSession.isAgentSpeaking) {
            console.log(`[VOICE WS:BARGE-IN] Interruption detected (>= 120ms speech). Halting assistant immediately.`);
            this.interruptAssistant(currentSession);
            currentSession.vadTracker.notifyBargeIn();

            // Collect pre-roll audio so initial syllable is never clipped
            if (currentSession.inboundAudioChunks.length === 0 && currentSession.preRollBuffer.length > 0) {
              currentSession.inboundAudioChunks.push(...currentSession.preRollBuffer);
            }
            currentSession.inboundAudioChunks.push(rawMuLaw);
            currentSession.silenceCount = 0;
            return;
          }

          // 2. Accumulate audio when agent is not speaking
          if (!currentSession.isAgentSpeaking) {
            if (isSpeech) {
              this.stopComfortNoise(currentSession);

              if (currentSession.inboundAudioChunks.length === 0 && currentSession.preRollBuffer.length > 1) {
                currentSession.inboundAudioChunks.push(...currentSession.preRollBuffer.slice(0, -1));
              }
              currentSession.inboundAudioChunks.push(rawMuLaw);
              currentSession.silenceCount = 0;
            } else if (currentSession.inboundAudioChunks.length > 0) {
              currentSession.inboundAudioChunks.push(rawMuLaw);
              currentSession.silenceCount = (currentSession.silenceCount || 0) + 1;

              // Turn completion evaluated by Neural VAD with semantic cutoff (400ms / 1000ms)
              if (turnCompleted && !currentSession.isProcessingTurn && currentSession.isInitialTurnDelivered) {
                console.log(
                  `[VOICE WS:VAD] Natural end-of-turn detected. Processing ${currentSession.inboundAudioChunks.length} frames (${currentSession.inboundAudioChunks.length * 20}ms audio).`
                );
                const audioToProcess = Buffer.concat(currentSession.inboundAudioChunks);
                currentSession.inboundAudioChunks = [];
                currentSession.silenceCount = 0;
                currentSession.vadTracker.resetTurn();
                this.processCallerUtterance(currentSession, audioToProcess);
              } else if (currentSession.silenceCount > 40 && currentSession.vadTracker.speechFramesCount < 4) {
                // False trigger filter: drop clicks/line pops under 80ms
                currentSession.inboundAudioChunks = [];
                currentSession.silenceCount = 0;
                currentSession.vadTracker.resetTurn();
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
    if (!session.isAgentSpeaking && !session.audioPlaybackTimer && !session.activeTtsClient) return;

    console.log(`[VOICE WS:BARGE-IN] Halting assistant audio playback for Call SID ${session.callSid}`);
    session.isAgentSpeaking = false;

    // 1. Close/flush active TTS stream
    if (session.activeTtsClient) {
      session.activeTtsClient.close();
      session.activeTtsClient = null;
    }

    // 2. Clear outbound frame pacing timer
    if (session.audioPlaybackTimer) {
      clearTimeout(session.audioPlaybackTimer);
      clearInterval(session.audioPlaybackTimer);
      session.audioPlaybackTimer = undefined;
    }

    // 3. Send Twilio/Exotel "clear" event to empty carrier audio buffer immediately
    if (session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(
        JSON.stringify({
          event: 'clear',
          streamSid: session.streamSid,
        })
      );
    }

    // 4. Preserve caller speech that triggered barge-in so initial words are never lost
    if (session.preRollBuffer && session.preRollBuffer.length > 0 && session.inboundAudioChunks.length === 0) {
      session.inboundAudioChunks = [...session.preRollBuffer];
      session.silenceCount = 0;
    }

    // 5. Mark previous assistant turn with [Agent Interrupted] so the LLM brain knows it was cut short
    for (let i = session.transcript.length - 1; i >= 0; i--) {
      if (session.transcript[i].role === 'assistant') {
        if (!session.transcript[i].content.includes('[Agent Interrupted]')) {
          session.transcript[i].content += ' [Agent Interrupted]';
        }
        break;
      }
    }
  }

  // Comfort Noise Generator: streams -55 dBFS warm room-tone frame every 20ms during thinking gaps
  private startComfortNoise(session: VoiceSessionState) {
    if (session.comfortNoiseTimer || session.isAgentSpeaking) return;

    session.comfortNoiseTimer = setInterval(() => {
      if (session.isAgentSpeaking || session.inboundAudioChunks.length > 0) {
        this.stopComfortNoise(session);
        return;
      }

      if (session.ws.readyState === WebSocket.OPEN) {
        const cngFrame = getComfortNoiseFrame();
        session.ws.send(
          JSON.stringify({
            event: 'media',
            streamSid: session.streamSid,
            media: {
              payload: cngFrame.toString('base64'),
            },
          })
        );
      }
    }, 20);
  }

  private stopComfortNoise(session: VoiceSessionState) {
    if (session.comfortNoiseTimer) {
      clearInterval(session.comfortNoiseTimer);
      session.comfortNoiseTimer = undefined;
    }
  }

  // Deliver First Turn Greeting & Notice
  private async deliverFirstTurn(session: VoiceSessionState) {
    const greetingText = session.initialGreeting || this.getOpeningScript(session);
    session.transcript.push({
      role: 'assistant',
      content: greetingText,
      timestamp: new Date().toISOString(),
    });

    const prewarmed =
      precomputedGreetingCache.get(session.callSid) ||
      (session.phone ? precomputedGreetingCache.get(session.phone) : undefined) ||
      precomputedGreetingCache.get(session.studentId);

    if (prewarmed && prewarmed.length > 0) {
      console.log(`[VOICE WS:DELIVER] Instant 0ms playback of ${prewarmed.length} pre-warmed opening frames`);
      await this.streamFrames(session, prewarmed, { isInitialTurn: true });
    } else {
      await this.speakText(session, greetingText, { isInitialTurn: true });
    }

    session.isInitialTurnDelivered = true;
  }

  // Get Spoken Opening Script (Natural Conversational Tenglish)
  private getOpeningScript(session: VoiceSessionState): string {
    const student = session.studentName || 'Student';

    if (session.language === 'te-IN') {
      if (session.useCase === 'fee_reminder') {
        return `నమస్కారం అండి! నేను Narayana School నుండి Priya ని మాట్లాడుతున్నాను. ${student} Term-2 tuition fee installment due date దగ్గరపడుతోంది అండి. Pending fee balance లేదా payment details కోసం మీరు నన్ను అడగవచ్చు.`;
      }
      if (session.useCase === 'attendance_alert') {
        return `నమస్కారం అండి! Narayana School నుండి Priya ని మాట్లాడుతున్నాను. ${student} ఈ రోజు morning school prayer కి absent అయ్యారు. Student leave లో ఉన్నారా అని ఒకసారి confirm చేయండి అండి.`;
      }
      if (session.useCase === 'exam_announcement') {
        return `నమస్కారం అండి! Narayana School quarterly exam results release అయ్యాయి. ${student} marks మరియు grades వివరాలు తెలుసుకోవడానికి మీరు నన్ను అడగవచ్చు అండి.`;
      }
      return `నమస్కారం అండి! నేను Narayana School నుండి Priya ని మాట్లాడుతున్నాను. వచ్చే శనివారం మన school లో Annual Sports Day celebration ఉంది అండి. Parents అందరికీ hearty welcome. ఈ event గురించి లేదా మీ student గురించి ఏమైనా తెలుసుకోవాలంటే నన్ను అడగవచ్చు.`;
    }

    if (session.language === 'hi-IN') {
      return `नमस्ते! मैं Narayana School से Priya बोल रही हूँ। आगामी शनिवार को हमारे school में Annual Sports Day का आयोजन किया जा रहा है। ${student} के बारे में आप मुझसे पूछ सकते हैं।`;
    }

    return `Good morning! This is Priya calling from Narayana High School. We are celebrating our Annual Sports Day this upcoming Saturday. Please let me know if you have any questions regarding the event or ${student}.`;
  }

  // Process Caller Utterance: STT -> Groq Tool Calling -> TTS -> Stream Out
  private async processCallerUtterance(session: VoiceSessionState, muLawBuffer: Buffer) {
    session.isProcessingTurn = true;
    // Start comfort noise immediately while STT & LLM think
    this.startComfortNoise(session);

    try {
      // 1. Resample 8kHz mu-law -> 16kHz linear PCM WAV
      const pcm8k = muLawToLinear16Buffer(muLawBuffer);
      const pcm16k = resample8kTo16k(pcm8k);
      const wav = createWavBuffer(pcm16k, 16000);

      // 2. Call Sarvam Saaras v3 STT in 'codemix' mode
      const userText = await this.transcribeAudio(wav, session.language);
      if (!userText || userText.trim().length === 0) {
        session.isProcessingTurn = false;
        this.stopComfortNoise(session);
        return;
      }

      console.log(`[VOICE WS:CALLER] Transcribed (${session.language}): "${userText}"`);

      // Update semantic complete clause status for future turn detection
      session.vadTracker.setSemanticClauseStatus(isSemanticCompleteClause(userText));

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
          console.log(`[VOICE WS:TOOL] Live lookup triggered: ${toolName}. Streaming acoustic filler from RAM.`);
          this.stopComfortNoise(session);
          // Stream pre-synthesized acoustic filler clip from RAM so caller never hears dead air
          const fillerFrames = fillerAudioCache.get(session.language);
          this.streamPreCachedFrames(session, fillerFrames);
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

      // Stop comfort noise before streaming agent speech
      this.stopComfortNoise(session);

      // 4. Synthesize & Stream Back in Native 8kHz Frames (Zero Pitch Distortion)
      await this.speakText(session, replyText);
    } catch (err: any) {
      console.error('[VOICE WS UTTERANCE ERROR]', err.message);
      this.stopComfortNoise(session);
    } finally {
      session.isProcessingTurn = false;
    }
  }

  // Stream pre-cached frames directly from RAM (e.g. acoustic filler clips)
  private streamPreCachedFrames(session: VoiceSessionState, frames: Buffer[]) {
    if (!frames || frames.length === 0 || session.isAgentSpeaking) return;

    for (const frame of frames) {
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
  }

  /**
   * Paces and streams 8kHz G.711 mu-law frames out to Twilio/Exotel with drift-compensated 20ms cadence
   */
  async streamFrames(session: VoiceSessionState, frames: Buffer[], options?: { isInitialTurn?: boolean }) {
    if (!frames || frames.length === 0) return;

    if (!options?.isInitialTurn && (session.vadTracker.isSpeakingNow || session.inboundAudioChunks.length > 0)) {
      console.log(`[VOICE WS:BARGE-IN] Caller started speaking before frame streaming. Dropping playback.`);
      return;
    }

    this.stopComfortNoise(session);

    if (session.audioPlaybackTimer) {
      clearTimeout(session.audioPlaybackTimer);
      clearInterval(session.audioPlaybackTimer);
      session.audioPlaybackTimer = undefined;
    }

    if (options?.isInitialTurn) {
      session.inboundAudioChunks = [];
      session.vadTracker.resetTurn();
    }

    session.isAgentSpeaking = true;

    // 1. Initial Pre-Buffer Burst (300ms = 15 frames)
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

    // 2. Drift-Compensated High-Resolution Pacer for Remaining Frames
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

      const framesPaced = frameIndex - PREBUFFER_FRAMES;
      const expectedElapsed = framesPaced * intervalMs;
      const actualElapsed = Date.now() - startTime;
      const delay = Math.max(0, expectedElapsed - actualElapsed);

      session.audioPlaybackTimer = setTimeout(scheduleNextFrame, delay);
    };

    session.audioPlaybackTimer = setTimeout(scheduleNextFrame, intervalMs);
  }

  // Speak Text Aloud via Sarvam Bulbul and Stream with Pre-buffered Jitter-free Cadence @ 8kHz
  async speakText(session: VoiceSessionState, text: string, options?: { isInitialTurn?: boolean }) {
    if (!text || !text.trim()) return;

    // Check if caller is already speaking before synthesis starts
    if (!options?.isInitialTurn && (session.vadTracker.isSpeakingNow || session.inboundAudioChunks.length > 0)) {
      console.log(`[VOICE WS:BARGE-IN] Caller is already speaking. Aborting outgoing speech turn.`);
      return;
    }

    this.stopComfortNoise(session);

    try {
      // 1. Synthesize directly to native 8kHz mu-law frames (zero 7350Hz decimation pitch-warp)
      const frames = await synthesizeToMuLawFrames(text, {
        language: session.language,
        sampleRate: 8000,
        model: 'bulbul:v4-flash',
      });

      if (!frames || frames.length === 0) return;

      await this.streamFrames(session, frames, options);
    } catch (err: any) {
      console.error('[VOICE WS SPEAK ERROR]', err.message);
      session.isAgentSpeaking = false;
    }
  }

  // Polite Goodbye and Hangup
  private async speakAndHangup(session: VoiceSessionState, reason: string) {
    const goodbye =
      session.language === 'te-IN'
        ? 'Narayana School కి సమయం ఇచ్చినందుకు థ్యాంక్స్ అండి. Have a great day!'
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

  // Persist Call Ledger to PostgreSQL & Cache Stereo Recording
  async finalizeCallSession(session: VoiceSessionState, outcome: string) {
    try {
      this.stopComfortNoise(session);
      const duration = Math.max(1, Math.round((Date.now() - session.startedAt.getTime()) / 1000));
      const maskedPhone = session.phone ? maskPhoneNumber(session.phone) : '+91XXXXXX0000';

      // 1. Finalize Dual-Channel Stereo WAV (Left = Parent, Right = Counselor)
      const stereoWav = session.recorder.finalizeWav();
      callRecordingsCache.set(session.callSid, stereoWav);

      const payload = {
        callSid: session.callSid,
        streamSid: session.streamSid,
        student_id: session.studentId,
        student_name: session.studentName,
        guardian_name: session.guardianName,
        use_case: session.useCase,
        language: session.language,
        transcript: session.transcript,
        call_outcome: outcome,
        has_stereo_audio: true,
        audio_size_bytes: stereoWav.length,
      };

      const insertRes = await db.query(
        `INSERT INTO ai_voice_calls (status, duration_seconds, conversation_payload, started_at, ended_at)
         VALUES ($1, $2, $3, $4, now())
         RETURNING id`,
        [
          duration < 25 ? 'interrupted' : outcome === 'completed' ? 'completed' : 'failed',
          duration,
          JSON.stringify(payload),
          session.startedAt,
        ]
      );

      const callId = insertRes.rows[0]?.id;
      if (callId) {
        callRecordingsCache.set(callId, stereoWav);
      }

      console.log(`[VOICE WS:PERSIST] Saved call ledger for ${session.callSid} (${duration}s, status: ${outcome}, audio: ${stereoWav.length} bytes)`);

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
      if (s.audioPlaybackTimer) clearTimeout(s.audioPlaybackTimer);
      if (s.comfortNoiseTimer) clearInterval(s.comfortNoiseTimer);
      if (s.activeTtsClient) s.activeTtsClient.close();
      this.sessions.delete(streamSid);
    }
  }
}

export const voiceSessionManager = new VoiceSessionManager();
