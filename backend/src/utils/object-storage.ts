import { env } from '../config/env';

const configured = () => Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);

function objectUrl(key: string) {
  return `${env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/${env.FACE_PHOTO_BUCKET}/${key}`;
}

function authHeaders() {
  return { Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, apikey: env.SUPABASE_SERVICE_ROLE_KEY };
}

/** Uploads to the private bucket. Fail-open: returns null when storage is unconfigured or unreachable. */
export async function putPrivateObject(key: string, body: Buffer, contentType: string): Promise<string | null> {
  if (!configured()) return null;
  try {
    const res = await fetch(objectUrl(key), {
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

export async function deletePrivateObject(key: string): Promise<void> {
  if (!configured()) return;
  try {
    await fetch(objectUrl(key), { method: 'DELETE', headers: authHeaders() });
  } catch (err: any) {
    console.warn('[object-storage] delete skipped:', err.message);
  }
}
