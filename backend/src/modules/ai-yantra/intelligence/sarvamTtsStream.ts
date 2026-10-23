/**
 * Sarvam AI Bulbul Speech Synthesis Client
 * 1. WebSocket Streaming TTS (bulbul:v4-flash / bulbul:v3 fallback)
 * 2. Directly requests native 8000 Hz G.711 mu-law audio to eliminate resampling distortion
 * 3. Slices egress audio into exact 160-byte (20ms) frames for Twilio/Exotel PSTN streams
 */

import { WebSocket } from 'ws';
import { env } from '../../../config/env';
import { chunkMuLawFrames, linear16ToMuLaw } from '../audio/mulaw';
import { normalizeSpokenText } from '../audio/normalizer';

export interface TtsSynthesisOptions {
  language?: string;
  speaker?: string;
  sampleRate?: number;
  model?: 'bulbul:v4-flash' | 'bulbul:v3';
}

/**
 * Resolves the appropriate speaker identifier for the requested model and language.
 * bulbul:v4-flash requires conversational regional voices (e.g. kavitha_te_conversation).
 * bulbul:v3 requires legacy voice names (e.g. priya, shubh).
 */
export function getSpeakerForModel(
  model: 'bulbul:v4-flash' | 'bulbul:v3' | string,
  language: string,
  requestedSpeaker?: string
): string {
  if (model === 'bulbul:v4-flash') {
    if (requestedSpeaker && requestedSpeaker.includes('_')) {
      return requestedSpeaker;
    }
    if (language === 'te-IN') return 'kavitha_te_conversation';
    if (language === 'hi-IN') return 'kavya_hi_conversational';
    if (language === 'en-IN') return 'aparna_en_companion';
    return 'kavitha_te_conversation';
  }

  // bulbul:v3 legacy speakers
  if (requestedSpeaker && !requestedSpeaker.includes('_')) {
    return requestedSpeaker;
  }
  return language === 'hi-IN' ? 'shubh' : 'priya';
}

/**
 * WebSocket Streaming Session for Sarvam Bulbul TTS
 * Allows streaming incremental text clauses and receiving 8000 Hz mu-law audio chunks in real-time.
 */
export class SarvamTtsStreamClient {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private isConfigured = false;
  private language: string;
  private speaker: string;
  private model: string;
  private onAudioFrameCallback?: (frame: Buffer) => void;
  private onCompleteCallback?: () => void;
  private onErrorCallback?: (err: Error) => void;
  private audioRemainder = Buffer.alloc(0);

  constructor(options: TtsSynthesisOptions = {}) {
    this.language = options.language || env.SARVAM_DEFAULT_LANGUAGE || 'te-IN';
    this.model = options.model || 'bulbul:v4-flash';
    this.speaker = options.speaker || getSpeakerForModel(this.model, this.language);
  }

  /**
   * Establishes WebSocket connection to Sarvam TTS streaming endpoint
   */
  async connect(): Promise<boolean> {
    if (!env.SARVAM_API_KEY) {
      console.warn('[SARVAM TTS WS] SARVAM_API_KEY missing');
      return false;
    }

    return new Promise((resolve) => {
      try {
        const wsUrl = `wss://api.sarvam.ai/text-to-speech/ws?model=${encodeURIComponent(this.model)}`;
        this.ws = new WebSocket(wsUrl, {
          headers: {
            'api-subscription-key': env.SARVAM_API_KEY,
          },
          handshakeTimeout: 5000,
        });

        const timeout = setTimeout(() => {
          if (!this.isConnected) {
            console.warn('[SARVAM TTS WS] Connection timed out after 5s');
            this.close();
            resolve(false);
          }
        }, 5000);

        this.ws.on('open', () => {
          clearTimeout(timeout);
          this.isConnected = true;
          this.sendConfig();
          resolve(true);
        });

        this.ws.on('message', (data: Buffer | string) => {
          this.handleServerMessage(data);
        });

        this.ws.on('error', (err) => {
          clearTimeout(timeout);
          console.warn('[SARVAM TTS WS ERROR]', err.message);
          if (this.onErrorCallback) {
            this.onErrorCallback(err);
          }
          resolve(false);
        });

        this.ws.on('close', () => {
          clearTimeout(timeout);
          this.isConnected = false;
          this.isConfigured = false;
        });
      } catch (err: any) {
        console.warn('[SARVAM TTS WS EXCEPTION]', err.message);
        resolve(false);
      }
    });
  }

  private sendConfig() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const configMsg = {
      type: 'config',
      data: {
        model: this.model,
        target_language_code: this.language,
        speaker: this.speaker,
        speech_sample_rate: 8000,
        output_audio_codec: 'mulaw',
        pace: 1.0,
      },
    };

    this.ws.send(JSON.stringify(configMsg));
    this.isConfigured = true;
  }

  /**
   * Streams an incremental text clause into the synthesis engine
   */
  sendClause(rawClause: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const normalized = normalizeSpokenText(rawClause, this.language);
    if (!normalized.trim()) return;

    const textMsg = {
      type: 'text',
      data: {
        text: normalized,
      },
    };

    this.ws.send(JSON.stringify(textMsg));
  }

  /**
   * Flushes current utterance to signal end of turn
   */
  flush() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'flush' }));
  }

  onAudioFrame(callback: (frame: Buffer) => void) {
    this.onAudioFrameCallback = callback;
  }

  onComplete(callback: () => void) {
    this.onCompleteCallback = callback;
  }

  onError(callback: (err: Error) => void) {
    this.onErrorCallback = callback;
  }

  private handleServerMessage(data: Buffer | string) {
    try {
      const raw = typeof data === 'string' ? data : data.toString('utf8');
      const msg = JSON.parse(raw);

      if (msg.type === 'audio' && msg.data?.audio) {
        const audioBuffer = Buffer.from(msg.data.audio, 'base64');
        const fullAudio = this.audioRemainder.length > 0
          ? Buffer.concat([this.audioRemainder, audioBuffer])
          : audioBuffer;

        const FRAME_SIZE = 160;
        const completeFrameCount = Math.floor(fullAudio.length / FRAME_SIZE);

        for (let i = 0; i < completeFrameCount; i++) {
          const frame = fullAudio.subarray(i * FRAME_SIZE, (i + 1) * FRAME_SIZE);
          if (this.onAudioFrameCallback) {
            this.onAudioFrameCallback(frame);
          }
        }

        const remainingBytes = fullAudio.length % FRAME_SIZE;
        this.audioRemainder = remainingBytes > 0
          ? fullAudio.subarray(completeFrameCount * FRAME_SIZE)
          : Buffer.alloc(0);
      } else if (msg.type === 'event' && msg.data?.event_type === 'final') {
        if (this.audioRemainder.length > 0) {
          const padded = Buffer.alloc(160, 0xff);
          this.audioRemainder.copy(padded, 0);
          this.audioRemainder = Buffer.alloc(0);
          if (this.onAudioFrameCallback) {
            this.onAudioFrameCallback(padded);
          }
        }
        if (this.onCompleteCallback) {
          this.onCompleteCallback();
        }
      }
    } catch (_) {
      // In case binary frames are received directly
      if (Buffer.isBuffer(data)) {
        const frames = chunkMuLawFrames(data, 160);
        for (const frame of frames) {
          if (this.onAudioFrameCallback) {
            this.onAudioFrameCallback(frame);
          }
        }
      }
    }
  }

  close() {
    if (this.ws) {
      try {
        this.ws.removeAllListeners();
        this.ws.close();
      } catch (_) {}
      this.ws = null;
    }
    this.isConnected = false;
    this.isConfigured = false;
    this.audioRemainder = Buffer.alloc(0);
  }
}

/**
 * Synthesizes text to speech using Sarvam AI Bulbul (v4-flash with v3 fallback).
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

  // 1. Spoken normalization (currencies, fractions, abbreviations, honorifics)
  const normalizedText = normalizeSpokenText(rawText, language);
  if (!normalizedText.trim()) return [];

  // Models to attempt: primary bulbul:v4-flash, fallback bulbul:v3
  const modelsToAttempt: Array<'bulbul:v4-flash' | 'bulbul:v3'> = ['bulbul:v4-flash', 'bulbul:v3'];

  for (const model of modelsToAttempt) {
    try {
      const targetSpeaker = getSpeakerForModel(model, language, options.speaker);
      const res = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-subscription-key': env.SARVAM_API_KEY,
        },
        body: JSON.stringify({
          inputs: [normalizedText],
          target_language_code: language,
          speaker: targetSpeaker,
          model: model,
          speech_sample_rate: 8000,
          enable_preprocessing: true,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[TTS ${model} ERROR ${res.status}]`, errText);
        continue; // Try next model
      }

      const data: any = await res.json();
      const base64Audio = data.audios && data.audios[0] ? data.audios[0] : null;
      if (!base64Audio) continue;

      const wavBuffer = Buffer.from(base64Audio, 'base64');
      const pcmData = extractPcmFromWav(wavBuffer);
      const muLawAudio = Buffer.alloc(Math.floor(pcmData.length / 2));

      for (let i = 0; i < muLawAudio.length; i++) {
        const sample = pcmData.readInt16LE(i * 2);
        muLawAudio[i] = linear16ToMuLaw(sample);
      }

      return chunkMuLawFrames(muLawAudio, 160);
    } catch (err: any) {
      console.warn(`[TTS ${model} EXCEPTION]`, err.message);
    }
  }

  return [];
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

  return wavBuffer.subarray(Math.min(44, wavBuffer.length));
}
