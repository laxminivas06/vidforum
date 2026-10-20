/**
 * G.711 Mu-Law (PCMU) Audio Codec & 20ms Frame Packetizer
 * Standardized for PSTN Telephony (Twilio / Exotel Media Streams @ 8000 Hz)
 */

const BIAS = 0x84; // 132
const CLIP = 32635;

const EXPONENT_TABLE: number[] = [
  0, 0, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3,
  4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
  5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5,
  6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
  6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
  6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
  6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
  7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7,
];

// Precomputed lookup table for fast 8-bit mu-law -> 16-bit linear PCM decoding
const MULAW_TO_LINEAR_TABLE: Int16Array = new Int16Array(256);
for (let i = 0; i < 256; i++) {
  const comp = ~i;
  const sign = comp & 0x80;
  const exponent = (comp >> 4) & 0x07;
  const mantissa = comp & 0x0f;
  let sample = ((mantissa << 3) + BIAS) << exponent;
  sample -= BIAS;
  MULAW_TO_LINEAR_TABLE[i] = sign !== 0 ? -sample : sample;
}

/**
 * Encodes a single 16-bit linear PCM sample into an 8-bit G.711 mu-law byte
 */
export function linear16ToMuLaw(sample: number): number {
  let sign = 0;
  if (sample < 0) {
    sign = 0x80;
    sample = -sample;
  }
  if (sample > CLIP) {
    sample = CLIP;
  }
  sample = (sample + BIAS) >> 2;
  const exponent = EXPONENT_TABLE[(sample >> 5) & 0xff];
  const mantissa = (sample >> (exponent + 1)) & 0x0f;
  const muLaw = ~(sign | (exponent << 4) | mantissa) & 0xff;
  return muLaw;
}

/**
 * Decodes a single 8-bit G.711 mu-law byte into a 16-bit linear PCM sample
 */
export function muLawToLinear16(muLawByte: number): number {
  return MULAW_TO_LINEAR_TABLE[muLawByte & 0xff];
}

/**
 * Encodes a buffer of 16-bit Little-Endian linear PCM samples into 8-bit mu-law buffer
 */
export function linear16ToMuLawBuffer(pcmBuffer: Buffer): Buffer {
  const numSamples = Math.floor(pcmBuffer.length / 2);
  const muLawBuffer = Buffer.alloc(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const sample = pcmBuffer.readInt16LE(i * 2);
    muLawBuffer[i] = linear16ToMuLaw(sample);
  }
  return muLawBuffer;
}

/**
 * Decodes a buffer of 8-bit mu-law bytes into a buffer of 16-bit Little-Endian linear PCM samples
 */
export function muLawToLinear16Buffer(muLawBuffer: Buffer): Buffer {
  const pcmBuffer = Buffer.alloc(muLawBuffer.length * 2);
  for (let i = 0; i < muLawBuffer.length; i++) {
    const sample = muLawToLinear16(muLawBuffer[i]);
    pcmBuffer.writeInt16LE(sample, i * 2);
  }
  return pcmBuffer;
}

/**
 * Slices a continuous stream of 8kHz mu-law audio into exact 160-byte (20ms) frames
 * Telephony packetizer cadence: 160 bytes * 50 packets/sec = 8000 bytes/sec (64 kbps)
 */
export function chunkMuLawFrames(muLawBuffer: Buffer, frameSize = 160): Buffer[] {
  const frames: Buffer[] = [];
  for (let i = 0; i < muLawBuffer.length; i += frameSize) {
    const end = Math.min(i + frameSize, muLawBuffer.length);
    const chunk = muLawBuffer.subarray(i, end);
    if (chunk.length === frameSize) {
      frames.push(chunk);
    } else {
      // Pad trailing incomplete frame with mu-law silence (0xFF)
      const padded = Buffer.alloc(frameSize, 0xff);
      chunk.copy(padded, 0);
      frames.push(padded);
    }
  }
  return frames;
}
