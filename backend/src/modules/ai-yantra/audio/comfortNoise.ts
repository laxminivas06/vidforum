/**
 * Comfort Noise Generator (CNG) & Pre-Cached Acoustic Fillers
 * Injects -55 dBFS warm room tone during thinking gaps to eliminate digital-zero dead air.
 * Caches pre-synthesized acoustic fillers in RAM for zero-latency tool-call coverage.
 */

import { linear16ToMuLaw, chunkMuLawFrames } from './mulaw';

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
 * In-memory acoustic filler scripts for zero-latency thinking masks
 */
export interface AcousticFillerClips {
  'te-IN': string; // "ఒక్క నిమిషం అండి, చూసి చెప్తాను..."
  'hi-IN': string; // "एक मिनट जी, मैं अभी देखकर बताती हूँ..."
  'en-IN': string; // "One moment please, let me check that for you..."
}

export const ACOUSTIC_FILLER_SCRIPTS: AcousticFillerClips = {
  'te-IN': 'ఒక్క నిమిషం అండి, చూసి చెప్తాను.',
  'hi-IN': 'एक मिनट जी, मैं अभी देखकर बताती हूँ।',
  'en-IN': 'One moment please, let me check that for you.',
};

/**
 * Generates an acoustic vocalized filler tone (gentle human "umm/hmm" resonance)
 * as an instantaneous zero-latency fallback if network TTS has not pre-warmed
 */
function generateSyntheticFillerFrames(durationSeconds = 1.2): Buffer[] {
  const sampleRate = 8000;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const pcm = Buffer.alloc(totalSamples * 2);

  // 180Hz fundamental with 360Hz & 540Hz harmonics shaped with a Hann window
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / totalSamples));
    const wave =
      0.6 * Math.sin(2 * Math.PI * 180 * t) +
      0.25 * Math.sin(2 * Math.PI * 360 * t) +
      0.15 * Math.sin(2 * Math.PI * 540 * t);
    const sample = Math.round(wave * 4000 * window);
    pcm.writeInt16LE(sample, i * 2);
  }

  const muLaw = Buffer.alloc(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    muLaw[i] = linear16ToMuLaw(pcm.readInt16LE(i * 2));
  }

  return chunkMuLawFrames(muLaw, 160);
}

const DEFAULT_FALLBACK_FILLER = generateSyntheticFillerFrames(1.2);

/**
 * In-memory pre-synthesized audio buffers for instant filler delivery from RAM
 */
class FillerAudioCache {
  private cache = new Map<string, Buffer[]>();

  constructor() {
    // Populate default synthetic fillers immediately
    this.cache.set('te-IN', DEFAULT_FALLBACK_FILLER);
    this.cache.set('hi-IN', DEFAULT_FALLBACK_FILLER);
    this.cache.set('en-IN', DEFAULT_FALLBACK_FILLER);
  }

  store(language: string, frames: Buffer[]) {
    if (frames && frames.length > 0) {
      this.cache.set(language, frames);
    }
  }

  get(language: string): Buffer[] {
    return this.cache.get(language) || this.cache.get('te-IN') || DEFAULT_FALLBACK_FILLER;
  }

  has(language: string): boolean {
    return this.cache.has(language);
  }
}

export const fillerAudioCache = new FillerAudioCache();

/**
 * Pre-warms acoustic filler clips from Sarvam TTS at server startup
 */
export async function prewarmAcousticFillers(synthesizer: (text: string, options: any) => Promise<Buffer[]>) {
  for (const [lang, script] of Object.entries(ACOUSTIC_FILLER_SCRIPTS)) {
    try {
      const frames = await synthesizer(script, { language: lang, speaker: 'priya' });
      if (frames && frames.length > 0) {
        fillerAudioCache.store(lang, frames);
        console.log(`[ACOUSTIC FILLER] Pre-warmed ${frames.length} frames (${frames.length * 20}ms) for ${lang}`);
      }
    } catch (err: any) {
      console.warn(`[ACOUSTIC FILLER] Pre-warm failed for ${lang}:`, err.message);
    }
  }
}
