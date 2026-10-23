/**
 * Neural Voice Activity Detector (VAD) & Real-Time Barge-In Engine
 * Primary: Silero VAD v5 ONNX Runtime via @ricky0123/vad-node (16kHz PCM, speech prob > 0.65)
 * Secondary: Adaptive noise-floor RMS fallback
 * Real-Time Barge-In: 6 consecutive speech frames (120ms) while assistant is speaking
 * Semantic Turn Detection: 400ms on complete clause / 1000ms on mid-thought trail-off
 */

import { Silero } from '@ricky0123/vad-node/dist/_common/models';
import * as ort from 'onnxruntime-node';
import * as fs from 'fs/promises';

export interface VadConfig {
  speechProbabilityThreshold: number; // 0.65 Silero speech probability
  bargeInFramesRequired: number; // 6 consecutive frames (120ms) of human speech to interrupt
  minSpeechFramesRequired: number; // 4 frames (80ms) of real voice required to avoid click/pop triggers
  completeClauseSilenceMs: number; // 400ms silence after complete clause / question
  trailingSilenceMs: number; // 1000ms silence when trailing off mid-thought
  rmsSpeechThreshold: number; // RMS fallback threshold
  rmsBargeInThreshold: number; // RMS fallback barge-in threshold
}

export const DEFAULT_VAD_CONFIG: VadConfig = {
  speechProbabilityThreshold: 0.65,
  bargeInFramesRequired: 6, // 120ms (6 * 20ms frames)
  minSpeechFramesRequired: 4, // 80ms
  completeClauseSilenceMs: 400, // 20 frames @ 20ms
  trailingSilenceMs: 1000, // 50 frames @ 20ms
  rmsSpeechThreshold: 90,
  rmsBargeInThreshold: 260,
};

// Singleton Silero instance loader
let sileroInstance: any = null;
let sileroLoadingPromise: Promise<any> | null = null;
let sileroAvailable = false;

async function getSileroInstance(): Promise<any> {
  if (sileroInstance) return sileroInstance;
  if (sileroLoadingPromise) return sileroLoadingPromise;

  sileroLoadingPromise = (async () => {
    try {
      const modelPath = require.resolve('@ricky0123/vad-node/dist/silero_vad.onnx');
      const modelBuffer = await fs.readFile(modelPath);
      const modelFetcher = async () => modelBuffer.buffer;

      const model = await Silero.new(ort, modelFetcher);
      sileroInstance = model;
      sileroAvailable = true;
      console.log('[VAD:SILERO] Silero VAD v5 ONNX initialized successfully');
      return model;
    } catch (err: any) {
      console.warn('[VAD:SILERO] Failed to initialize Silero ONNX runtime. Using adaptive RMS fallback:', err.message);
      sileroAvailable = false;
      return null;
    }
  })();

  return sileroLoadingPromise;
}

// Trigger early background load
getSileroInstance().catch(() => {});

/**
 * Calculates Root Mean Square (RMS) energy on a 16-bit linear PCM buffer
 */
export function calculatePcmEnergy(pcmBuffer: Buffer): number {
  const numSamples = Math.floor(pcmBuffer.length / 2);
  if (numSamples === 0) return 0;

  let sumSquares = 0;
  for (let i = 0; i < numSamples; i++) {
    const s = pcmBuffer.readInt16LE(i * 2);
    sumSquares += s * s;
  }
  return Math.sqrt(sumSquares / numSamples);
}

/**
 * Converts 16-bit linear PCM buffer to Float32Array in range [-1.0, 1.0]
 */
export function pcm16ToFloat32(pcmBuffer: Buffer): Float32Array {
  const numSamples = Math.floor(pcmBuffer.length / 2);
  const float32 = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    float32[i] = pcmBuffer.readInt16LE(i * 2) / 32768.0;
  }
  return float32;
}

/**
 * Tests whether partial text ends with a complete grammatical clause, question, or natural Indian honorific
 */
export function isSemanticCompleteClause(partialText: string): boolean {
  if (!partialText || !partialText.trim()) return false;
  const clean = partialText.trim();

  // 1. Punctuation boundaries
  if (/[?.!।]$/.test(clean)) return true;

  // 2. Telugu complete clause markers & questions
  // "అండి", "కదా", "చెప్పండి", "ఎంత", "ఏమిటి", "అవునా", "వచ్చాయి", "సరే", "ధన్యవాదాలు"
  if (/(అండి|కదా|చెప్పండి|ఎంత|ఏమిటి|అవునా|వచ్చాయి|సరే|ధన్యవాదాలు|చూడండి|చేయండి|నమస్కారం)$/.test(clean)) {
    return true;
  }

  // 3. Hindi complete clause markers & questions
  // "जी", "क्या", "बताइए", "है", "हैं", "धन्यवाद", "नमस्ते"
  if (/(जी|क्या|बताइए|है|हैं|धन्यवाद|नमस्ते|दीजिए|होगा|हो गई)$/.test(clean)) {
    return true;
  }

  // 4. English question markers
  if (/\b(please|thanks|thank you|marks|sir|madam|okay|sure)\b$/i.test(clean)) {
    return true;
  }

  return false;
}

/**
 * State container for per-call Neural Voice Activity & Barge-In tracking
 */
export class SessionVadTracker {
  private config: VadConfig;
  private noiseFloor = 50;
  private consecutiveSpeechFrames = 0;
  private consecutiveSilenceFrames = 0;
  private speechFramesInCurrentTurn = 0;
  private isSpeaking = false;
  private lastSpeechTimestamp = 0;
  private pcmAccumulator: number[] = [];
  private lastSpeechProbability = 0;
  private isCompleteClause = false;

  constructor(customConfig?: Partial<VadConfig>) {
    this.config = { ...DEFAULT_VAD_CONFIG, ...customConfig };
  }

  /**
   * Sets whether caller's latest transcript ends with a complete clause
   */
  setSemanticClauseStatus(complete: boolean) {
    this.isCompleteClause = complete;
  }

  /**
   * Evaluates a 20ms frame of 16-bit linear PCM audio (8kHz or 16kHz).
   * Automatically executes Silero ONNX VAD if 16kHz Float32 samples are available,
   * falling back to adaptive noise-floor RMS.
   */
  async processFrameAsync(
    pcmFrame8k: Buffer,
    pcmFrame16k: Buffer,
    isAgentSpeaking: boolean
  ): Promise<{
    isSpeech: boolean;
    bargeInTriggered: boolean;
    turnCompleted: boolean;
    speechProbability: number;
    energy: number;
  }> {
    const energy = calculatePcmEnergy(pcmFrame8k);

    // Slowly track background noise floor during quiet periods
    if (energy < this.config.rmsSpeechThreshold) {
      this.noiseFloor = this.noiseFloor * 0.95 + energy * 0.05;
    }

    let isSpeech = false;
    let speechProbability = 0;

    // Try Silero VAD v5 ONNX if initialized
    if (sileroAvailable && sileroInstance) {
      try {
        const float32Chunk = pcm16ToFloat32(pcmFrame16k);
        // Silero expects chunks of 512 samples (32ms @ 16kHz)
        for (let i = 0; i < float32Chunk.length; i++) {
          this.pcmAccumulator.push(float32Chunk[i]);
        }

        if (this.pcmAccumulator.length >= 512) {
          const window512 = new Float32Array(this.pcmAccumulator.slice(0, 512));
          this.pcmAccumulator = this.pcmAccumulator.slice(512);

          const result = await sileroInstance.process(window512);
          speechProbability = result?.isSpeech || 0;
          this.lastSpeechProbability = speechProbability;

          isSpeech = speechProbability > this.config.speechProbabilityThreshold;
        } else {
          isSpeech = this.lastSpeechProbability > this.config.speechProbabilityThreshold;
          speechProbability = this.lastSpeechProbability;
        }
      } catch (err: any) {
        // Fallback to adaptive RMS on Silero inference error
        const effectiveThreshold = isAgentSpeaking
          ? Math.max(this.config.rmsBargeInThreshold, this.noiseFloor * 2.2)
          : Math.max(this.config.rmsSpeechThreshold, this.noiseFloor * 1.3);
        isSpeech = energy > effectiveThreshold;
      }
    } else {
      // Adaptive RMS Fallback
      const effectiveThreshold = isAgentSpeaking
        ? Math.max(this.config.rmsBargeInThreshold, this.noiseFloor * 2.2)
        : Math.max(this.config.rmsSpeechThreshold, this.noiseFloor * 1.3);
      isSpeech = energy > effectiveThreshold;
      speechProbability = isSpeech ? 0.75 : 0.15;
    }

    let bargeInTriggered = false;
    let turnCompleted = false;

    if (isSpeech) {
      this.consecutiveSpeechFrames++;
      this.consecutiveSilenceFrames = 0;
      this.speechFramesInCurrentTurn++;
      this.isSpeaking = true;
      this.lastSpeechTimestamp = Date.now();

      // Instant barge-in: If caller speaks for >= 120ms (6 consecutive 20ms frames) while agent is speaking
      if (isAgentSpeaking && this.consecutiveSpeechFrames >= this.config.bargeInFramesRequired) {
        bargeInTriggered = true;
      }
    } else {
      this.consecutiveSilenceFrames++;

      // Only reset consecutive speech burst counter after 6 frames (120ms) of silence
      if (this.consecutiveSilenceFrames > 6) {
        this.consecutiveSpeechFrames = 0;
        this.isSpeaking = false;
      }

      // Dynamic Semantic Turn Detection:
      // 400ms (20 frames) if complete clause / question, 1000ms (50 frames) if trailing off mid-thought
      const dynamicSilenceCutoffFrames = this.isCompleteClause
        ? Math.round(this.config.completeClauseSilenceMs / 20) // 20 frames = 400ms
        : Math.round(this.config.trailingSilenceMs / 20); // 50 frames = 1000ms

      if (
        !isAgentSpeaking &&
        this.speechFramesInCurrentTurn >= this.config.minSpeechFramesRequired &&
        this.consecutiveSilenceFrames >= dynamicSilenceCutoffFrames
      ) {
        turnCompleted = true;
      }
    }

    return {
      isSpeech,
      bargeInTriggered,
      turnCompleted,
      speechProbability,
      energy,
    };
  }

  /**
   * Synchronous fallback processFrame for compatibility
   */
  processFrame(
    pcmFrame8k: Buffer,
    isAgentSpeaking: boolean
  ): {
    isSpeech: boolean;
    bargeInTriggered: boolean;
    turnCompleted: boolean;
    energy: number;
  } {
    const energy = calculatePcmEnergy(pcmFrame8k);
    if (energy < this.config.rmsSpeechThreshold) {
      this.noiseFloor = this.noiseFloor * 0.95 + energy * 0.05;
    }

    const effectiveThreshold = isAgentSpeaking
      ? Math.max(this.config.rmsBargeInThreshold, this.noiseFloor * 2.2)
      : Math.max(this.config.rmsSpeechThreshold, this.noiseFloor * 1.3);

    const isSpeech = energy > effectiveThreshold;
    let bargeInTriggered = false;
    let turnCompleted = false;

    if (isSpeech) {
      this.consecutiveSpeechFrames++;
      this.consecutiveSilenceFrames = 0;
      this.speechFramesInCurrentTurn++;
      this.isSpeaking = true;
      this.lastSpeechTimestamp = Date.now();

      // 6 consecutive frames = 120ms
      if (isAgentSpeaking && this.consecutiveSpeechFrames >= this.config.bargeInFramesRequired) {
        bargeInTriggered = true;
      }
    } else {
      this.consecutiveSilenceFrames++;
      if (this.consecutiveSilenceFrames > 6) {
        this.consecutiveSpeechFrames = 0;
        this.isSpeaking = false;
      }

      const dynamicSilenceCutoffFrames = this.isCompleteClause ? 20 : 50;

      if (
        !isAgentSpeaking &&
        this.speechFramesInCurrentTurn >= this.config.minSpeechFramesRequired &&
        this.consecutiveSilenceFrames >= dynamicSilenceCutoffFrames
      ) {
        turnCompleted = true;
      }
    }

    return { isSpeech, bargeInTriggered, turnCompleted, energy };
  }

  notifyBargeIn() {
    this.isSpeaking = true;
    this.consecutiveSilenceFrames = 0;
  }

  resetTurn() {
    this.consecutiveSpeechFrames = 0;
    this.consecutiveSilenceFrames = 0;
    this.speechFramesInCurrentTurn = 0;
    this.isSpeaking = false;
    this.lastSpeechTimestamp = 0;
    this.pcmAccumulator = [];
    this.isCompleteClause = false;
  }

  get isSpeakingNow(): boolean {
    return this.isSpeaking;
  }

  get speechFramesCount(): number {
    return this.speechFramesInCurrentTurn;
  }

  get silenceFramesCount(): number {
    return this.consecutiveSilenceFrames;
  }
}
