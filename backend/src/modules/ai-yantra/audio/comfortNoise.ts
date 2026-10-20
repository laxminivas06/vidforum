/**
 * Comfort Noise Generator (CNG) & Pre-Cached Acoustic Fillers
 * Injects -55 dBFS warm room tone during thinking gaps to eliminate digital-zero dead air.
 */

import { linear16ToMuLaw } from './mulaw';

const FRAME_SIZE = 160; // 20ms @ 8000 Hz mu-law

// Pre-computed -55 dBFS warm pink noise frame (gentle low-pass shaped room tone)
const COMFORT_NOISE_FRAME = Buffer.alloc(FRAME_SIZE);

// Pink noise approximation filter state
let b0 = 0, b1 = 0, b2 = 0;
for (let i = 0; i < FRAME_SIZE; i++) {
  const white = Math.random() * 2 - 1;
  b0 = 0.99886 * b0 + white * 0.0555179;
  b1 = 0.99332 * b1 + white * 0.0750759;
  b2 = 0.96900 * b2 + white * 0.1538520;
  const pink = b0 + b1 + b2 + white * 0.5362;
  // Scale to -55 dBFS: peak amplitude ~60 on 16-bit signed scale (-32768 to 32767)
  const sample = Math.round(pink * 25);
  COMFORT_NOISE_FRAME[i] = linear16ToMuLaw(sample);
}

/**
 * Returns a static 160-byte (20ms) mu-law comfort noise frame
 */
export function getComfortNoiseFrame(): Buffer {
  return COMFORT_NOISE_FRAME;
}

/**
 * In-memory acoustic filler clips for zero-latency thinking masks
 */
export interface AcousticFillerClips {
  'te-IN': string; // "ఒక్క నిమిషం అండి, రికార్డులు చూసి చెప్తాను..."
  'hi-IN': string; // "एक मिनट जी, मैं अभी देखकर बताती हूँ..."
  'en-IN': string; // "One moment please, let me check that for you..."
}

export const ACOUSTIC_FILLER_SCRIPTS: AcousticFillerClips = {
  'te-IN': 'ఒక్క నిమిషం అండి, చూసి చెప్తాను.',
  'hi-IN': 'एक मिनट जी, मैं अभी देखकर बताती हूँ।',
  'en-IN': 'One moment please, let me verify that for you.',
};

/**
 * In-memory pre-synthesized audio buffers for instant filler delivery
 */
class FillerAudioCache {
  private cache = new Map<string, Buffer[]>();

  store(language: string, frames: Buffer[]) {
    this.cache.set(language, frames);
  }

  get(language: string): Buffer[] | null {
    return this.cache.get(language) || null;
  }

  has(language: string): boolean {
    return this.cache.has(language);
  }
}

export const fillerAudioCache = new FillerAudioCache();
