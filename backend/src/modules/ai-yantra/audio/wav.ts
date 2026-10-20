/**
 * WAV Container Construction, Upsampling & Dual-Channel Stereo Call Recording
 */

/**
 * Creates a standard 44-byte RIFF WAV container for raw 16-bit Linear PCM audio
 */
export function createWavBuffer(pcmData: Buffer, sampleRate = 16000, channels = 1): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = sampleRate * channels * 2;
  const blockAlign = channels * 2;

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcmData.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size for PCM
  header.writeUInt16LE(1, 20); // AudioFormat (1 = Linear PCM)
  header.writeUInt16LE(channels, 22); // NumChannels
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34); // BitsPerSample
  header.write('data', 36);
  header.writeUInt32LE(pcmData.length, 40);

  return Buffer.concat([header, pcmData]);
}

/**
 * Clean linear interpolation upsampler from 8,000 Hz to 16,000 Hz
 * Necessary for speech-to-text models (Sarvam Saaras v3) requiring 16kHz audio input.
 */
export function resample8kTo16k(pcm8k: Buffer): Buffer {
  const numInputSamples = Math.floor(pcm8k.length / 2);
  const numOutputSamples = numInputSamples * 2;
  const pcm16k = Buffer.alloc(numOutputSamples * 2);

  for (let i = 0; i < numInputSamples - 1; i++) {
    const s0 = pcm8k.readInt16LE(i * 2);
    const s1 = pcm8k.readInt16LE((i + 1) * 2);

    pcm16k.writeInt16LE(s0, i * 4);
    pcm16k.writeInt16LE(Math.round((s0 + s1) / 2), i * 4 + 2);
  }

  // Handle last sample
  if (numInputSamples > 0) {
    const lastSample = pcm8k.readInt16LE((numInputSamples - 1) * 2);
    pcm16k.writeInt16LE(lastSample, (numInputSamples - 1) * 4);
    pcm16k.writeInt16LE(lastSample, (numInputSamples - 1) * 4 + 2);
  }

  return pcm16k;
}

/**
 * Dual-Channel (Stereo) Telephony Call Audio Recorder
 * Left Channel = Inbound Caller / Parent Audio
 * Right Channel = Outbound Assistant / Voice Agent Audio
 */
export class StereoCallRecorder {
  private leftPcmChunks: Buffer[] = [];
  private rightPcmChunks: Buffer[] = [];

  recordLeft(pcmChunk: Buffer) {
    this.leftPcmChunks.push(pcmChunk);
  }

  recordRight(pcmChunk: Buffer) {
    this.rightPcmChunks.push(pcmChunk);
  }

  /**
   * Generates a standard 8kHz 16-bit 2-channel stereo RIFF WAV buffer
   */
  finalizeWav(): Buffer {
    const leftBuffer = Buffer.concat(this.leftPcmChunks);
    const rightBuffer = Buffer.concat(this.rightPcmChunks);

    const leftSamples = Math.floor(leftBuffer.length / 2);
    const rightSamples = Math.floor(rightBuffer.length / 2);
    const maxSamples = Math.max(leftSamples, rightSamples);

    const stereoPcm = Buffer.alloc(maxSamples * 4); // 2 bytes left + 2 bytes right per sample

    for (let i = 0; i < maxSamples; i++) {
      const leftSample = i < leftSamples ? leftBuffer.readInt16LE(i * 2) : 0;
      const rightSample = i < rightSamples ? rightBuffer.readInt16LE(i * 2) : 0;

      stereoPcm.writeInt16LE(leftSample, i * 4);
      stereoPcm.writeInt16LE(rightSample, i * 4 + 2);
    }

    return createWavBuffer(stereoPcm, 8000, 2);
  }
}
