// Standard ITU-T G.711 Mu-law tables and conversions (Ponytail Ultra: standard algorithms, zero dependencies)

const MU_LAW_BIAS = 0x84;
const CLIP = 32635;

// Precompute mu-law decode table for maximum speed
const MU_LAW_TO_LINEAR = new Int16Array(256);
for (let i = 0; i < 256; i++) {
  let byte = ~i & 0xff;
  let sign = byte & 0x80;
  let exponent = (byte >> 4) & 0x07;
  let mantissa = byte & 0x0f;
  let sample = ((mantissa << 3) + MU_LAW_BIAS) << exponent;
  sample -= MU_LAW_BIAS;
  MU_LAW_TO_LINEAR[i] = sign !== 0 ? -sample : sample;
}

export function muLawToLinear16(muLawByte: number): number {
  return MU_LAW_TO_LINEAR[muLawByte & 0xff];
}

export function linear16ToMuLaw(sample: number): number {
  let sign = (sample >> 8) & 0x80;
  if (sign !== 0) sample = -sample;
  if (sample > CLIP) sample = CLIP;
  sample += MU_LAW_BIAS;

  let exponent = 7;
  for (let expMask = 0x4000; (sample & expMask) === 0 && exponent > 0; expMask >>= 1) {
    exponent--;
  }

  let mantissa = (sample >> (exponent + 3)) & 0x0f;
  let byte = ~(sign | (exponent << 4) | mantissa);
  return byte & 0xff;
}

export function muLawToLinear16Buffer(muLawBuf: Buffer): Buffer {
  const pcm = Buffer.alloc(muLawBuf.length * 2);
  for (let i = 0; i < muLawBuf.length; i++) {
    pcm.writeInt16LE(MU_LAW_TO_LINEAR[muLawBuf[i]], i * 2);
  }
  return pcm;
}

export function linear16ToMuLawBuffer(pcmBuf: Buffer): Buffer {
  const numSamples = Math.floor(pcmBuf.length / 2);
  const muLaw = Buffer.alloc(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const sample = pcmBuf.readInt16LE(i * 2);
    muLaw[i] = linear16ToMuLaw(sample);
  }
  return muLaw;
}

// Linear interpolation upsampling from 8kHz 16-bit PCM to 16kHz 16-bit PCM
export function resample8kTo16k(pcm8k: Buffer): Buffer {
  const samples8k = Math.floor(pcm8k.length / 2);
  const pcm16k = Buffer.alloc(samples8k * 4); // 2x samples * 2 bytes

  for (let i = 0; i < samples8k; i++) {
    const current = pcm8k.readInt16LE(i * 2);
    const next = i + 1 < samples8k ? pcm8k.readInt16LE((i + 1) * 2) : current;
    const interpolated = Math.round((current + next) / 2);

    pcm16k.writeInt16LE(current, i * 4);
    pcm16k.writeInt16LE(interpolated, i * 4 + 2);
  }
  return pcm16k;
}

// Create standard 44-byte RIFF WAV container for raw 16-bit PCM
export function createWavBuffer(pcmData: Buffer, sampleRate = 16000): Buffer {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmData.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // Linear PCM
  header.writeUInt16LE(1, 22); // Mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); // byte rate (sampleRate * 1 channel * 2 bytes/sample)
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(pcmData.length, 40);

  return Buffer.concat([header, pcmData]);
}

// Convert Sarvam TTS output WAV (typically 16kHz or 24kHz) to 8kHz mu-law for telephony
export function wavToTelephonyMuLaw(wavBuffer: Buffer): Buffer {
  // Parse WAV header to find data chunk
  let offset = 12;
  let sampleRate = 16000;

  while (offset + 8 <= wavBuffer.length) {
    const chunkId = wavBuffer.toString('ascii', offset, offset + 4);
    const chunkSize = wavBuffer.readUInt32LE(offset + 4);

    if (chunkId === 'fmt ') {
      sampleRate = wavBuffer.readUInt32LE(offset + 12);
    } else if (chunkId === 'data') {
      const dataOffset = offset + 8;
      const dataLength = Math.min(chunkSize, wavBuffer.length - dataOffset);
      const pcmData = wavBuffer.subarray(dataOffset, dataOffset + dataLength);

      // Downsample to 8kHz if needed
      const downsampleRatio = Math.max(1, Math.round(sampleRate / 8000));
      const numInputSamples = Math.floor(pcmData.length / 2);
      const numOutputSamples = Math.floor(numInputSamples / downsampleRatio);
      const muLaw = Buffer.alloc(numOutputSamples);

      for (let i = 0; i < numOutputSamples; i++) {
        const sample = pcmData.readInt16LE(i * downsampleRatio * 2);
        muLaw[i] = linear16ToMuLaw(sample);
      }
      return muLaw;
    }
    offset += 8 + chunkSize;
  }

  // Fallback: treat whole buffer as raw PCM
  return linear16ToMuLawBuffer(wavBuffer);
}

// Split buffer into 20ms frames (160 bytes for 8kHz mu-law)
export function chunkMuLawFrames(muLawBuffer: Buffer, frameSize = 160): Buffer[] {
  const frames: Buffer[] = [];
  for (let i = 0; i < muLawBuffer.length; i += frameSize) {
    frames.push(muLawBuffer.subarray(i, Math.min(i + frameSize, muLawBuffer.length)));
  }
  return frames;
}

// Simple Root Mean Square (RMS) energy calculation for Voice Activity Detection (VAD)
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
