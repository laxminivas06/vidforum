"use client"

// Encrypted on-device cache for Face Attendance offline mode.
// Approved exception to the "no browser storage for domain data" rule (see AGENTS.md):
// only today's section galleries (face templates, no photos) and unsynced submissions,
// AES-GCM encrypted with a non-extractable key, purged after sync / expiry.
// The cloud database remains the single source of truth.

const DB_NAME = "vid-face-attendance"
const STORE = "kv"
const KEY_ID = "__aes_key__"
const DAY_MS = 24 * 60 * 60 * 1000
export const GALLERY_TTL_MS = DAY_MS
const QUEUE_TTL_MS = 7 * DAY_MS

interface Sealed {
  iv: Uint8Array<ArrayBuffer>
  data: ArrayBuffer
  expiresAt: number
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => req.result.createObjectStore(STORE)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  }
  return dbPromise
}

async function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

let keyPromise: Promise<CryptoKey> | null = null

function getKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    keyPromise = (async () => {
      const existing = await tx<CryptoKey | undefined>("readonly", (s) => s.get(KEY_ID))
      if (existing) return existing
      // Non-extractable: the raw key can never be read out of the browser
      const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"])
      try {
        await tx("readwrite", (s) => s.add(key, KEY_ID)) // add (not put): fails if another tab created one first
        return key
      } catch {
        return (await tx<CryptoKey | undefined>("readonly", (s) => s.get(KEY_ID)))!
      }
    })()
  }
  return keyPromise
}

async function seal(value: unknown, ttlMs: number): Promise<Sealed> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await getKey(),
    new TextEncoder().encode(JSON.stringify(value))
  )
  return { iv, data, expiresAt: Date.now() + ttlMs }
}

async function unseal<T>(sealed: Sealed): Promise<T> {
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: sealed.iv }, await getKey(), sealed.data)
  return JSON.parse(new TextDecoder().decode(plain))
}

async function put(key: string, value: unknown, ttlMs: number) {
  const sealed = await seal(value, ttlMs)
  await tx("readwrite", (s) => s.put(sealed, key))
}

async function get<T>(key: string): Promise<T | null> {
  const sealed = await tx<Sealed | undefined>("readonly", (s) => s.get(key))
  if (!sealed) return null
  if (sealed.expiresAt < Date.now()) {
    await remove(key)
    return null
  }
  try {
    return await unseal<T>(sealed)
  } catch {
    // Unreadable cache entries are dropped; unsynced attendance is never deleted silently
    if (!key.startsWith("queue:")) await remove(key)
    return null
  }
}

async function remove(key: string) {
  await tx("readwrite", (s) => s.delete(key))
}

// ================= Gallery cache =================
export const cacheGallery = (sectionId: string, gallery: unknown) => put(`gallery:${sectionId}`, gallery, GALLERY_TTL_MS)
export const readCachedGallery = <T>(sectionId: string) => get<T>(`gallery:${sectionId}`)

export const cacheSections = (sections: unknown) => put("sections", sections, GALLERY_TTL_MS)
export const readCachedSections = <T>() => get<T>("sections")

// ================= In-progress session (survives power cuts / browser restarts) =================
export const saveDraft = (draft: unknown) => put("draft", draft, GALLERY_TTL_MS)
export const readDraft = <T>() => get<T>("draft")
export const clearDraft = () => remove("draft")

// ================= Auth mirror for Background Sync =================
// The service worker cannot read localStorage, so it gets an encrypted copy of the auth session
// tokens (auth tokens only, per AGENTS.md) to upload queued attendance while the app is closed.
export interface AuthMirror {
  token: string
  refreshToken: string
  apiBase: string
  updatedAt: number
}
export const saveAuthMirror = (auth: AuthMirror) => put("auth", auth, 30 * DAY_MS)
export const readAuthMirror = () => get<AuthMirror>("auth")
export const clearAuthMirror = () => remove("auth")

// ================= Device identity =================
export async function getDeviceCode(): Promise<string> {
  const existing = await get<string>("device-code")
  if (existing) return existing
  const code = `web-${crypto.randomUUID()}`
  await put("device-code", code, 3650 * DAY_MS)
  return code
}
export const readDeviceId = () => get<string>("device-id")
export const saveDeviceId = (id: string) => put("device-id", id, 3650 * DAY_MS)

// ================= Pending submissions =================
export async function enqueueSubmission(id: string, payload: unknown) {
  await put(`queue:${id}`, payload, QUEUE_TTL_MS)
}

export async function listQueuedSubmissions<T>(): Promise<Array<{ id: string; payload: T }>> {
  const keys = (await tx<IDBValidKey[]>("readonly", (s) => s.getAllKeys())).filter(
    (k): k is string => typeof k === "string" && k.startsWith("queue:")
  )
  const items = []
  for (const key of keys) {
    const payload = await get<T>(key)
    if (payload) items.push({ id: key.slice("queue:".length), payload })
  }
  return items
}

export const removeQueuedSubmission = (id: string) => remove(`queue:${id}`)

/** Removes expired entries (galleries older than 24h, stale queue items). */
export async function purgeExpired() {
  const keys = await tx<IDBValidKey[]>("readonly", (s) => s.getAllKeys())
  for (const key of keys) {
    if (key === KEY_ID || typeof key !== "string") continue
    const sealed = await tx<Sealed | undefined>("readonly", (s) => s.get(key))
    if (sealed && sealed.expiresAt < Date.now()) await remove(key)
  }
}
