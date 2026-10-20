/**
 * Sarvam AI Saaras v3 Speech-to-Text (STT) Client
 * Configured with mode: "codemix" for natural Tenglish / Hinglish transcription.
 */

import { env } from '../../../config/env';

export interface SarvamSttOptions {
  language?: string;
  mode?: 'codemix' | 'formal';
}

export async function transcribeWithSarvam(
  wavBuffer: Buffer,
  options: SarvamSttOptions = {}
): Promise<string> {
  if (!env.SARVAM_API_KEY) {
    console.warn('[STT] SARVAM_API_KEY is not configured');
    return '';
  }

  const language = options.language || env.SARVAM_DEFAULT_LANGUAGE || 'te-IN';
  const mode = options.mode || 'codemix';

  try {
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([new Uint8Array(wavBuffer)], { type: 'audio/wav' }),
      'caller_audio.wav'
    );
    formData.append('model', 'saaras:v3');
    formData.append('language_code', language);
    formData.append('mode', mode);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': env.SARVAM_API_KEY,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errBody = await res.text();
      console.warn(`[STT ERROR ${res.status}]`, errBody);
      return '';
    }

    const json: any = await res.json();
    const transcript = (json.transcript || json.text || '').trim();
    return transcript;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.warn('[STT TIMEOUT] Sarvam STT request timed out (>8s)');
    } else {
      console.error('[STT EXCEPTION]', err.message);
    }
    return '';
  }
}
