import { env } from '../config/env';

export const storageConfigured = () => Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

const base = () => `${env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1`;

function objectUrl(key: string, bucket = env.FACE_PHOTO_BUCKET) {
  return `${base()}/object/${bucket}/${key}`;
}

function authHeaders() {
  return { Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, apikey: env.SUPABASE_SERVICE_ROLE_KEY };
}

/** Uploads to the private bucket. Fail-open: returns null when storage is unconfigured or unreachable. */
export async function putPrivateObject(key: string, body: Buffer, contentType: string, bucket = env.FACE_PHOTO_BUCKET): Promise<string | null> {
  if (!storageConfigured()) return null;
  try {
    const res = await fetch(objectUrl(key, bucket), {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': contentType, 'x-upsert': 'true' },
      body: new Uint8Array(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return key;
  } catch (err: any) {
    console.warn('[object-storage] upload skipped:', err.message);
    return null;
  }
}

export async function deletePrivateObject(key: string, bucket = env.FACE_PHOTO_BUCKET): Promise<void> {
  if (!storageConfigured()) return;
  try {
    await fetch(objectUrl(key, bucket), { method: 'DELETE', headers: authHeaders() });
  } catch (err: any) {
    console.warn('[object-storage] delete skipped:', err.message);
  }
}

/** Downloads a private object (null when unconfigured or missing). */
export async function getPrivateObject(key: string, bucket = env.FACE_PHOTO_BUCKET): Promise<Buffer | null> {
  if (!storageConfigured()) return null;
  try {
    const res = await fetch(`${base()}/object/authenticated/${bucket}/${key}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } catch (err: any) {
    console.warn('[object-storage] download failed:', err.message);
    return null;
  }
}

/** Creates the private bucket if missing (idempotent). */
export async function ensureBucket(bucket: string): Promise<void> {
  if (!storageConfigured()) return;
  const res = await fetch(`${base()}/bucket`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: bucket, name: bucket, public: false }),
  }).catch(() => null);
  if (res && !res.ok && res.status !== 409 && res.status !== 400) console.warn('[object-storage] bucket create failed:', res.status);
}

/** Short-lived signed read URL for a private object. */
export async function createSignedReadUrl(key: string, bucket: string, expiresIn = 3600): Promise<string | null> {
  if (!storageConfigured()) return null;
  const res = await fetch(`${base()}/object/sign/${bucket}/${key}`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn }),
  }).catch(() => null);
  if (!res || !res.ok) return null;
  const { signedURL } = (await res.json()) as { signedURL: string };
  return `${base()}${signedURL}`;
}
