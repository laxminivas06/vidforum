/**
 * AI Tutor provider adapter. The only file in the tutor that talks to an AI vendor.
 * Demo: Gemini free tier (Interactions API) with Groq as text fallback.
 * Paid later: add another implementation of these four functions and flip TUTOR_LLM_PROVIDER.
 */
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod/v4';
import { env } from '../../../config/env';

export class TutorUnavailableError extends Error {}

export const tutorConfigured = () => env.TUTOR_LLM_PROVIDER === 'gemini' && Boolean(env.GEMINI_API_KEY);

let client: GoogleGenAI | null = null;
function ai(): GoogleGenAI {
  if (!tutorConfigured()) throw new TutorUnavailableError('AI Tutor is not configured (set GEMINI_API_KEY)');
  return (client ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// The SDK's own retries hide a 429 for ~35s; we retry/fall back ourselves instead
const NO_SDK_RETRY = { maxRetries: 0 };

// Shared requests-per-minute pacer so the free quota is never burst past
const stamps: number[] = [];
async function pace(): Promise<void> {
  for (;;) {
    const now = Date.now();
    while (stamps.length && now - stamps[0] > 60_000) stamps.shift();
    if (stamps.length < env.TUTOR_RPM) {
      stamps.push(now);
      return;
    }
    await sleep(60_000 - (now - stamps[0]) + 50);
  }
}

/** A stalled request must not freeze the worker or a student's chat. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: NodeJS.Timeout;
  return Promise.race([
    p,
    new Promise<T>((_, reject) => {
      t = setTimeout(() => reject(Object.assign(new Error('AI request timed out'), { code: 'timeout' })), ms);
    }),
  ]).finally(() => clearTimeout(t));
}

function isRetryable(err: any): boolean {
  const code = err?.status ?? err?.code ?? err?.error?.code;
  return [429, 500, 503, 'too_many_requests', 'service_unavailable', 'resource_exhausted', 'internal', 'timeout'].includes(code)
    || /high demand|rate limit|overloaded|unavailable/i.test(String(err?.message ?? ''));
}

/** Tries each model in order, retrying transient errors (429/503) with backoff. */
async function withRetry<T>(models: string[], fn: (model: string) => Promise<T>): Promise<T> {
  let last: unknown;
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await pace();
        return await withTimeout(fn(model), 90_000);
      } catch (err) {
        last = err;
        if (!isRetryable(err)) throw err;
        if (/per day|daily/i.test(String((err as any)?.message ?? ''))) break; // quota gone for today: next model
        await sleep(800 * 2 ** attempt);
      }
    }
  }
  throw last;
}

const modelsFor = (tier: 'fast' | 'smart') =>
  tier === 'smart' ? [env.GEMINI_SMART_MODEL, env.GEMINI_FAST_MODEL] : [env.GEMINI_FAST_MODEL, env.GEMINI_SMART_MODEL];

export interface ChatTurn { role: 'student' | 'tutor'; text: string }

export interface Usage { provider: string; model: string; input_tokens?: number; output_tokens?: number }

/** Flattens history + the prepared prompt into one input; everything inside is data, not instructions. */
function chatInput(history: ChatTurn[], prompt: string): string {
  const past = history.map((t) => `<${t.role}>${t.text}</${t.role}>`).join('\n');
  return past ? `<conversation_history>\n${past}\n</conversation_history>\n\n${prompt}` : prompt;
}

/**
 * Streams the tutor answer. Falls back to Groq (non-streamed, one chunk) when Gemini stays busy.
 * `onUsage` receives token usage once the answer completes.
 */
export async function* streamAnswer(args: {
  system: string;
  history: ChatTurn[];
  prompt: string;
  onUsage?: (u: Usage) => void;
}): AsyncGenerator<string> {
  const input = chatInput(args.history, args.prompt);
  let opened: { model: string; iterator: AsyncIterator<any>; first: IteratorResult<any> } | null = null;
  try {
    opened = await withRetry(modelsFor('fast'), async (model) => {
      const stream: any = await ai().interactions.create({
        model,
        input,
        system_instruction: args.system,
        stream: true,
        generation_config: { temperature: 0.3, max_output_tokens: 4096, thinking_level: 'minimal' },
      }, NO_SDK_RETRY);
      const iterator = stream[Symbol.asyncIterator]() as AsyncIterator<any>;
      const first = await withTimeout(iterator.next(), 25_000); // surfaces 429/503/stalls before we commit to this model
      if (!first.done && first.value?.event_type === 'error') throw Object.assign(new Error(first.value.error?.message), { code: first.value.error?.code });
      return { model, iterator, first };
    });
  } catch (err) {
    if (err instanceof TutorUnavailableError || !isRetryable(err) || !env.GROQ_API_KEY) throw err;
    yield await groqAnswer(args.system, input, args.onUsage);
    return;
  }

  let result = opened.first;
  while (!result.done) {
    const ev = result.value;
    if (ev?.event_type === 'step.delta' && ev.delta?.type === 'text' && ev.delta.text) yield ev.delta.text;
    if (ev?.event_type === 'error') throw new Error(ev.error?.message || 'AI stream error');
    if (ev?.event_type === 'interaction.completed') {
      const u = ev.interaction?.usage;
      args.onUsage?.({ provider: 'gemini', model: opened.model, input_tokens: u?.total_input_tokens, output_tokens: u?.total_output_tokens });
    }
    result = await withTimeout(opened.iterator.next(), 60_000);
  }
}

async function groqAnswer(system: string, input: string, onUsage?: (u: Usage) => void): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(60_000),
    headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: env.GROQ_MODEL,
      temperature: 0.3,
      max_tokens: 2048,
      messages: [{ role: 'system', content: system }, { role: 'user', content: input }],
    }),
  });
  if (!res.ok) throw new Error(`Groq fallback failed: HTTP ${res.status}`);
  const json: any = await res.json();
  onUsage?.({ provider: 'groq', model: env.GROQ_MODEL, input_tokens: json.usage?.prompt_tokens, output_tokens: json.usage?.completion_tokens });
  return String(json.choices?.[0]?.message?.content ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

function jsonSchemaOf(schema: z.ZodType): Record<string, unknown> {
  const { $schema, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  return rest;
}

/** Structured output, validated server-side with the same zod schema (one repair retry). */
export async function generateJson<S extends z.ZodType>(args: {
  system: string;
  prompt: string;
  schema: S;
  tier: 'fast' | 'smart';
  images?: { data: string; mime: string }[];
}): Promise<z.infer<S>> {
  const schema = jsonSchemaOf(args.schema);
  const input: any = args.images?.length
    ? [{ type: 'text', text: args.prompt }, ...args.images.map((i) => ({ type: 'image', data: i.data, mime_type: i.mime }))]
    : args.prompt;
  for (let attempt = 0; attempt < 2; attempt++) {
    const interaction: any = await withRetry(modelsFor(args.tier), (model) =>
      ai().interactions.create({
        model,
        input,
        system_instruction: args.system,
        response_format: { type: 'text', mime_type: 'application/json', schema },
        generation_config: { temperature: 0.2, max_output_tokens: 8192, ...(args.tier === 'fast' ? { thinking_level: 'minimal' } : {}) },
      } as any, NO_SDK_RETRY),
    );
    try {
      return args.schema.parse(JSON.parse(interaction.output_text ?? ''));
    } catch (err) {
      if (attempt === 1) throw new Error(`AI returned invalid structured output: ${(err as Error).message}`);
    }
  }
  throw new Error('unreachable');
}

/** OCR / figure description for a rendered page image (JPEG). */
export async function describeImage(args: { imageJpeg: Buffer; instruction: string }): Promise<string> {
  const interaction: any = await withRetry(modelsFor('fast'), (model) =>
    ai().interactions.create({
      model,
      input: [
        { type: 'text', text: args.instruction },
        { type: 'image', data: args.imageJpeg.toString('base64'), mime_type: 'image/jpeg' },
      ],
      generation_config: { temperature: 0, max_output_tokens: 4096, thinking_level: 'minimal' },
    } as any, NO_SDK_RETRY),
  );
  return String(interaction.output_text ?? '').trim();
}

export const EMBEDDING_DIMS = 768;
export const embeddingModel = () => env.GEMINI_EMBED_MODEL;

/** Batched embeddings; `kind` picks the retrieval task type for better question↔passage matching. */
export async function embed(texts: string[], kind: 'document' | 'query'): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 50) {
    const batch = texts.slice(i, i + 50);
    const res = await withRetry([env.GEMINI_EMBED_MODEL], () =>
      ai().models.embedContent({
        model: env.GEMINI_EMBED_MODEL,
        contents: batch,
        config: { outputDimensionality: EMBEDDING_DIMS, taskType: kind === 'query' ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT' },
      }),
    );
    for (const e of res.embeddings ?? []) out.push(normalize(e.values ?? []));
  }
  if (out.length !== texts.length) throw new Error('Embedding count mismatch');
  return out;
}

// Truncated (768-d) Gemini embeddings must be re-normalised before cosine search
function normalize(v: number[]): number[] {
  const n = Math.hypot(...v) || 1;
  return v.map((x) => x / n);
}
