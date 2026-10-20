/**
 * Sarvam AI Bulbul Speech Synthesis Client
 * Solves the pitch-distortion bug by requesting native 8000 Hz telephony audio directly.
 */

import { env } from '../../../config/env';
import { linear16ToMuLaw, chunkMuLawFrames } from '../audio/mulaw';
import { normalizeSpokenText } from '../audio/normalizer';

export interface TtsSynthesisOptions {
  language?: string;
  speaker?: string;
  sampleRate?: number;
}

/**
 * Synthesizes text to speech using Sarvam AI Bulbul.
 * Returns an array of exact 160-byte (20ms) 8kHz G.711 mu-law frames ready for Twilio/Exotel.
 */
export async function synthesizeToMuLawFrames(
  rawText: string,
  options: TtsSynthesisOptions = {}
): Promise<Buffer[]> {
  if (!env.SARVAM_API_KEY) {
    console.warn('[TTS] SARVAM_API_KEY missing');
    return [];
  }

  const language = options.language || env.SARVAM_DEFAULT_LANGUAGE || 'te-IN';
  const speaker = options.speaker || env.SARVAM_DEFAULT_VOICE || 'priya';

  // 1. Spoken normalization (currencies, fractions, abbreviations)
  const normalizedText = normalizeSpokenText(rawText, language);
  if (!normalizedText.trim()) return [];

  try {
    // 2. Request native 8000 Hz from Sarvam to eliminate client-side decimation pitch-warp
    const res = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': env.SARVAM_API_KEY,
      },
      body: JSON.stringify({
        inputs: [normalizedText],
        target_language_code: language,
        speaker: speaker,
        model: 'bulbul:v3',
        speech_sample_rate: 8000,
        enable_preprocessing: true,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[TTS ERROR ${res.status}]`, errText);
      return [];
    }

    const data: any = await res.json();
    const base64Audio = data.audios && data.audios[0] ? data.audios[0] : null;
    if (!base64Audio) return [];

    const wavBuffer = Buffer.from(base64Audio, 'base64');

    // 3. Extract PCM from RIFF WAV and convert to mu-law
    const pcmData = extractPcmFromWav(wavBuffer);
    const muLawAudio = Buffer.alloc(Math.floor(pcmData.length / 2));

    for (let i = 0; i < muLawAudio.length; i++) {
      const sample = pcmData.readInt16LE(i * 2);
      muLawAudio[i] = linear16ToMuLaw(sample);
    }

    // 4. Slice into exact 160-byte (20ms @ 8kHz) frames
    return chunkMuLawFrames(muLawAudio, 160);
  } catch (err: any) {
    console.error('[TTS EXCEPTION]', err.message);
    return [];
  }
}

/**
 * Extracts raw 16-bit linear PCM from standard RIFF WAV container
 */
function extractPcmFromWav(wavBuffer: Buffer): Buffer {
  let offset = 12;

  while (offset + 8 <= wavBuffer.length) {
    const chunkId = wavBuffer.toString('ascii', offset, offset + 4);
    const chunkSize = wavBuffer.readUInt32LE(offset + 4);

    if (chunkId === 'data') {
      const dataOffset = offset + 8;
      const dataLength = Math.min(chunkSize, wavBuffer.length - dataOffset);
      return wavBuffer.subarray(dataOffset, dataOffset + dataLength);
    }
    offset += 8 + chunkSize;
  }

  // Fallback if header is non-standard: strip 44 bytes
  return wavBuffer.subarray(Math.min(44, wavBuffer.length));
}
