/**
 * Voice Activity Detector (VAD) & Real-Time Barge-In Engine
 * Combines calibrated RMS energy, dynamic noise floor adaptation, and semantic turn timing.
 */

export interface VadConfig {
  speechRmsThreshold: number; // default: 650 RMS
  bargeInFramesRequired: number; // 6 consecutive frames (120ms) of vocal energy
  completedQuestionSilenceMs: number; // 400ms dynamic cutoff
  incompleteThoughtSilenceMs: number; // 1000ms dynamic cutoff
}

export const DEFAULT_VAD_CONFIG: VadConfig = {
  speechRmsThreshold: 650,
  bargeInFramesRequired: 6,
  completedQuestionSilenceMs: 400,
  incompleteThoughtSilenceMs: 1000,
};

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
 * State container for per-call Voice Activity & Barge-In tracking
 */
export class SessionVadTracker {
  private config: VadConfig;
  private noiseFloor = 150;
  private consecutiveSpeechFrames = 0;
  private consecutiveSilenceFrames = 0;
  private isSpeaking = false;
  private lastSpeechTimestamp = 0;

  constructor(customConfig?: Partial<VadConfig>) {
    this.config = { ...DEFAULT_VAD_CONFIG, ...customConfig };
  }

  /**
   * Evaluates a single 20ms frame of 16-bit linear PCM audio.
   * Returns whether human vocal energy is active and whether a barge-in is triggered.
   */
  processFrame(pcmFrame: Buffer, isAgentSpeaking: boolean): {
    isSpeech: boolean;
    bargeInTriggered: boolean;
    energy: number;
  } {
    const energy = calculatePcmEnergy(pcmFrame);

    // Slowly track background noise floor during quiet periods
    if (energy < this.config.speechRmsThreshold) {
      this.noiseFloor = this.noiseFloor * 0.95 + energy * 0.05;
    }

    const effectiveThreshold = Math.max(this.config.speechRmsThreshold, this.noiseFloor * 2.2);
    const isSpeech = energy > effectiveThreshold;

    let bargeInTriggered = false;

    if (isSpeech) {
      this.consecutiveSpeechFrames++;
      this.consecutiveSilenceFrames = 0;
      this.isSpeaking = true;
      this.lastSpeechTimestamp = Date.now();

      // If the caller speaks with vocal energy for >= 120ms (6 frames) while agent is speaking
      if (isAgentSpeaking && this.consecutiveSpeechFrames >= this.config.bargeInFramesRequired) {
        bargeInTriggered = true;
      }
    } else {
      this.consecutiveSilenceFrames++;
      if (this.consecutiveSilenceFrames > 3) {
        this.consecutiveSpeechFrames = 0;
      }
    }

    return { isSpeech, bargeInTriggered, energy };
  }

  /**
   * Determines if silence has lasted long enough to finalize caller's utterance.
   * Semantic End-of-Turn (EoT): 400ms if query ended with a question mark / closed phrase,
   * 1000ms if trailing off mid-sentence.
   */
  isTurnComplete(partialText: string): boolean {
    if (!this.isSpeaking || this.lastSpeechTimestamp === 0) return false;

    const silenceDuration = Date.now() - this.lastSpeechTimestamp;
    const trimmed = (partialText || '').trim();

    // Check if partial text ends with complete question or terminal punctuation
    const isQuestionOrTerminal =
      trimmed.endsWith('?') ||
      trimmed.endsWith('।') ||
      trimmed.endsWith('.') ||
      trimmed.endsWith('ఎంత') ||
      trimmed.endsWith('ఏమిటి') ||
      trimmed.endsWith('ఉన్నాయా') ||
      trimmed.endsWith('చెప్పండి') ||
      trimmed.endsWith('వచ్చాయి');

    const threshold = isQuestionOrTerminal
      ? this.config.completedQuestionSilenceMs
      : this.config.incompleteThoughtSilenceMs;

    return silenceDuration >= threshold;
  }

  reset() {
    this.consecutiveSpeechFrames = 0;
    this.consecutiveSilenceFrames = 0;
    this.isSpeaking = false;
    this.lastSpeechTimestamp = 0;
  }
}
