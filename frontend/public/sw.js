// Face Attendance offline service worker (hand-written, no build plugin).
// - cache-first: Next static chunks and the self-hosted face engine / models / pdf.js
// - network-first with cache fallback: Face Attendance pages (HTML + RSC payloads)
// Everything else (API calls, other pages) passes straight through to the network.
const CACHE = "vid-face-v3"
const PRECACHE = [
  "/attendance/face",
  "/attendance/face/enroll",
  "/vendor/human/human.esm.js",
  "/vendor/human/models/blazeface.json",
  "/vendor/human/models/blazeface.bin",
  "/vendor/human/models/facemesh.json",
  "/vendor/human/models/facemesh.bin",
  "/vendor/human/models/antispoof.json",
  "/vendor/human/models/antispoof.bin",
  "/vendor/human/models/liveness.json",
  "/vendor/human/models/liveness.bin",
  "/vendor/ort/ort.wasm.min.mjs",
  "/vendor/ort/ort-wasm-simd-threaded.mjs",
  "/vendor/ort/ort-wasm-simd-threaded.wasm",
  "/vendor/sface/sface.onnx",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url)))).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("vid-face-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

const isImmutable = (url) => url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/vendor/")
const isFacePage = (url) => url.pathname.startsWith("/attendance/face")

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (isImmutable(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) caches.open(CACHE).then((c) => c.put(request, res.clone()))
            return res
          })
      )
    )
    return
  }

  if (isFacePage(url)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(request, res.clone()))
          return res
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match(url.pathname)))
    )
  }
})

// ================= Background Sync: upload queued attendance while the app is closed =================
// Mirrors frontend/lib/face/offline-store.ts (same IndexedDB, same non-extractable AES-GCM key).
const DB_NAME = "vid-face-attendance"
const STORE = "kv"
const KEY_ID = "__aes_key__"
const AUTH_TTL_MS = 30 * 24 * 60 * 60 * 1000

function idb(mode, run) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1)
    open.onupgradeneeded = () => open.result.createObjectStore(STORE)
    open.onerror = () => reject(open.error)
    open.onsuccess = () => {
      const req = run(open.result.transaction(STORE, mode).objectStore(STORE))
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    }
  })
}

async function readSealed(key) {
  const sealed = await idb("readonly", (s) => s.get(key))
  const aes = await idb("readonly", (s) => s.get(KEY_ID))
  if (!sealed || !aes || sealed.expiresAt < Date.now()) return null
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: sealed.iv }, aes, sealed.data)
  return JSON.parse(new TextDecoder().decode(plain))
}

async function writeSealed(key, value, ttlMs) {
  const aes = await idb("readonly", (s) => s.get(KEY_ID))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aes, new TextEncoder().encode(JSON.stringify(value)))
  await idb("readwrite", (s) => s.put({ iv, data, expiresAt: Date.now() + ttlMs }, key))
}

function tokenExpiry(token) {
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).exp * 1000
  } catch {
    return 0
  }
}

// Same lock name as the app (lib/api/auth-refresh.ts): a refresh token can be used only once
async function freshAuth() {
  const run = async () => {
    const auth = await readSealed("auth")
    if (!auth) return null
    if (tokenExpiry(auth.token) - Date.now() > 60 * 1000) return auth
    const res = await fetch(`${auth.apiBase}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: auth.refreshToken }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || !json.success) return null
    const next = { ...auth, token: json.data.token, refreshToken: json.data.refreshToken, updatedAt: Date.now() }
    await writeSealed("auth", next, AUTH_TTL_MS)
    return next
  }
  return self.navigator.locks ? self.navigator.locks.request("vid-token-refresh", run) : run()
}

async function uploadQueue() {
  const keys = (await idb("readonly", (s) => s.getAllKeys())).filter((k) => typeof k === "string" && k.startsWith("queue:"))
  if (keys.length === 0) return
  const auth = await freshAuth() // network errors throw -> the browser retries the sync later
  if (!auth) return // signed out or session ended: stays queued until the next sign-in
  for (const key of keys) {
    const payload = await readSealed(key).catch(() => null)
    if (!payload) continue
    const res = await fetch(`${auth.apiBase}/attendance/face/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
      body: JSON.stringify(payload),
    })
    // Server de-duplicates replays, so removing only after success is safe
    if (res.ok) await idb("readwrite", (s) => s.delete(key))
  }
}

self.addEventListener("sync", (event) => {
  // Same Web Lock as the app's flushQueue, so the queue is never uploaded twice at once
  const run = () => uploadQueue()
  if (event.tag === "vid-face-queue") event.waitUntil(self.navigator.locks ? self.navigator.locks.request("vid-face-queue", run) : run())
})
