"use client"

// On-device face engine. Runs entirely in the browser from self-hosted files in /public/vendor, so it works
// offline on any device with a camera (laptop, phone, tablet, kiosk).
//   Human:  detection, 468-point landmarks, anti-spoof (photo/screen), liveness
//   SFace:  recognition embedding (OpenCV Zoo, Apache-2.0, fp32) via onnxruntime-web, on a 5-point aligned 112x112 crop
import type { Human, FaceResult } from "@vladmandic/human"

export const MODEL_VERSION = "sface-2021dec"
export const EMBEDDING_DIM = 128

// Cosine similarity of L2-normalised SFace embeddings. Calibrated on real student photos: same person
// across very different photos scored 0.49-0.75 (median 0.68); 91 pairs of different students scored
// median 0.18, max 0.54; 71 other different faces max 0.25.
export const ACCEPT_SCORE = 0.58 // minimum similarity to accept a match (kept above the closest different-student pair, 0.54)
export const MATCH_MARGIN = 0.08 // best must beat the next different student by this much (look-alikes, twins)
const MIN_REAL = 0.5 // anti-spoof: rejects printed photos and screens
const MIN_LIVE = 0.4 // liveness
const MIN_FACE_PX = 48 // small enough for faces in a group snap
const MAX_YAW_PITCH = 0.45 // radians, roughly 25 degrees

export interface DetectedFace {
  box: [number, number, number, number]
  embedding: number[]
  quality: number
  frontal: boolean
  spoof: boolean
}

export interface GalleryStudent {
  id: string
  name: string
  rollNumber: string | null
  admissionNumber: string
  templates: number[][]
}

export interface FaceMatch {
  student: GalleryStudent
  score: number
  margin: number
}

let enginePromise: Promise<Human> | null = null
let sfacePromise: Promise<{ ort: any; session: any }> | null = null

function getSFace() {
  if (!sfacePromise) {
    sfacePromise = (async () => {
      const url = "/vendor/ort/ort.wasm.min.mjs"
      const ort = await import(/* webpackIgnore: true */ url)
      ort.env.wasm.wasmPaths = "/vendor/ort/"
      ort.env.wasm.numThreads = 1 // multi-threading needs cross-origin isolation; single thread: ~56 ms/face on a modern laptop
      const session = await ort.InferenceSession.create("/vendor/sface/sface.onnx", { executionProviders: ["wasm"] })
      return { ort, session }
    })().catch((err) => {
      sfacePromise = null
      throw err
    })
  }
  return sfacePromise
}

// ArcFace/SFace canonical 5-point template for a 112x112 crop: eyes, nose tip, mouth corners (image left to right)
const ALIGN_DST = [
  [38.2946, 51.6963],
  [73.5318, 51.5014],
  [56.0252, 71.7366],
  [41.5493, 92.3655],
  [70.7299, 92.2041],
]
const meanOf = (mesh: number[][], ids: number[]) => [
  ids.reduce((s, i) => s + mesh[i][0], 0) / ids.length,
  ids.reduce((s, i) => s + mesh[i][1], 0) / ids.length,
]

/** Similarity-transform (rotation + scale + shift) alignment from face-mesh landmarks, then SFace. */
async function sfaceEmbedding(source: CanvasImageSource, mesh: number[][]): Promise<number[]> {
  const { ort, session } = await getSFace()
  const src = [meanOf(mesh, [33, 133, 159, 145]), meanOf(mesh, [362, 263, 386, 374]), mesh[1], mesh[61], mesh[291]]
  const mp = [src.reduce((s, p) => s + p[0], 0) / 5, src.reduce((s, p) => s + p[1], 0) / 5]
  const mq = [ALIGN_DST.reduce((s, p) => s + p[0], 0) / 5, ALIGN_DST.reduce((s, p) => s + p[1], 0) / 5]
  let a = 0
  let b = 0
  let n = 0
  for (let i = 0; i < 5; i++) {
    const px = src[i][0] - mp[0]
    const py = src[i][1] - mp[1]
    const qx = ALIGN_DST[i][0] - mq[0]
    const qy = ALIGN_DST[i][1] - mq[1]
    a += px * qx + py * qy
    b += px * qy - py * qx
    n += px * px + py * py
  }
  const cs = a / n
  const sn = b / n
  const canvas = document.createElement("canvas")
  canvas.width = 112
  canvas.height = 112
  const g = canvas.getContext("2d", { willReadFrequently: true })!
  g.setTransform(cs, sn, -sn, cs, mq[0] - (cs * mp[0] - sn * mp[1]), mq[1] - (sn * mp[0] + cs * mp[1]))
  g.drawImage(source, 0, 0)
  const px = g.getImageData(0, 0, 112, 112).data
  const input = new Float32Array(3 * 112 * 112) // NCHW, RGB, 0-255 (same as OpenCV's blobFromImage with swapRB)
  for (let i = 0; i < 112 * 112; i++) {
    input[i] = px[i * 4]
    input[i + 12544] = px[i * 4 + 1]
    input[i + 25088] = px[i * 4 + 2]
  }
  const out = await session.run({ [session.inputNames[0]]: new ort.Tensor("float32", input, [1, 3, 112, 112]) })
  const v = Array.from(out[session.outputNames[0]].data as Float32Array)
  const norm = Math.hypot(...v) || 1
  return v.map((x) => x / norm)
}

/** Templates from another model version (other dimension) can't be compared and are ignored. */
export const usableTemplates = (templates: number[][]) => templates.filter((t) => t.length === EMBEDDING_DIM)

export function getEngine(): Promise<Human> {
  if (!enginePromise) {
    enginePromise = (async () => {
      const url = "/vendor/human/human.esm.js"
      const mod = await import(/* webpackIgnore: true */ url)
      const human: Human = new mod.Human({
        modelBasePath: "/vendor/human/models/",
        debug: false,
        cacheSensitivity: 0, // never reuse a previous frame's faces: every frame is matched fresh
        filter: { enabled: true, equalization: true }, // normalises dim / backlit classrooms
        face: {
          enabled: true,
          detector: { rotation: true, maxDetected: 40, minConfidence: 0.5, skipFrames: 0, skipTime: 0, return: false },
          mesh: { enabled: true },
          iris: { enabled: false },
          emotion: { enabled: false },
          attention: { enabled: false },
          description: { enabled: false }, // recognition is done by SFace
          antispoof: { enabled: true, skipFrames: 0, skipTime: 0 },
          liveness: { enabled: true, skipFrames: 0, skipTime: 0 },
        },
        body: { enabled: false },
        hand: { enabled: false },
        object: { enabled: false },
        gesture: { enabled: false },
        segmentation: { enabled: false },
      })
      await Promise.all([human.load(), getSFace()])
      await human.warmup()
      return human
    })().catch((err) => {
      enginePromise = null
      throw err
    })
  }
  return enginePromise
}

type FaceInput = HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | ImageBitmap

/**
 * Detects every face and returns its embedding plus quality signals.
 * `liveCheck` must be off for documents (PDF photos are, by definition, not live).
 */
export async function detectFaces(input: FaceInput, opts: { liveCheck: boolean }): Promise<DetectedFace[]> {
  const human = await getEngine()
  const result = await human.detect(input, {
    face: { antispoof: { enabled: opts.liveCheck }, liveness: { enabled: opts.liveCheck } },
  })
  const faces: DetectedFace[] = []
  for (const f of result.face as FaceResult[]) {
    if (f.box[2] < MIN_FACE_PX || !f.mesh || f.mesh.length < 300) continue
    const angle = f.rotation?.angle
    const frontal = !angle || (Math.abs(angle.yaw) < MAX_YAW_PITCH && Math.abs(angle.pitch) < MAX_YAW_PITCH)
    const spoof = opts.liveCheck && ((f.real ?? 1) < MIN_REAL || (f.live ?? 1) < MIN_LIVE)
    faces.push({
      box: f.box,
      embedding: await sfaceEmbedding(input as CanvasImageSource, f.mesh as number[][]),
      quality: Math.min(1, (f.faceScore || f.score) * (frontal ? 1 : 0.6)),
      frontal,
      spoof,
    })
  }
  return faces
}

/** Cosine similarity of two normalised embeddings (0 when they come from different model versions). */
export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}

export async function similarity(a: number[], b: number[]): Promise<number> {
  return cosine(a, b)
}

/**
 * Best match for one face against a section gallery, using the max over each student's templates.
 * Accepted only when the score clears ACCEPT_SCORE and beats the runner-up student by MATCH_MARGIN.
 */
export async function matchFace(embedding: number[], gallery: GalleryStudent[]): Promise<(FaceMatch & { accepted: boolean }) | null> {
  let best: FaceMatch | null = null
  let second = 0
  for (const student of gallery) {
    const templates = usableTemplates(student.templates)
    if (templates.length === 0) continue
    let score = -1
    for (const t of templates) score = Math.max(score, cosine(embedding, t))
    if (!best || score > best.score) {
      if (best) second = Math.max(second, best.score)
      best = { student, score, margin: 0 }
    } else {
      second = Math.max(second, score)
    }
  }
  if (!best) return null
  best.margin = best.score - second
  return { ...best, accepted: best.score >= ACCEPT_SCORE && best.margin >= MATCH_MARGIN }
}

/**
 * Matches all faces of one frame, ensuring a student is assigned to at most one face
 * (greedy by score, so the stronger face wins and the other becomes "unrecognised").
 */
export async function matchFrame(faces: DetectedFace[], gallery: GalleryStudent[]) {
  const scored = await Promise.all(faces.map(async (face) => ({ face, match: face.spoof ? null : await matchFace(face.embedding, gallery) })))
  const taken = new Set<string>()
  return scored
    .sort((a, b) => (b.match?.score || 0) - (a.match?.score || 0))
    .map(({ face, match }) => {
      if (match?.accepted && !taken.has(match.student.id)) {
        taken.add(match.student.id)
        return { face, match }
      }
      return { face, match: null as FaceMatch | null }
    })
}

/** Square JPEG crop around a face, used for the stored reference photo and review thumbnails. */
export function cropFace(source: CanvasImageSource, box: [number, number, number, number], size = 256, quality = 0.85): string {
  const [x, y, w, h] = box
  const side = Math.max(w, h) * 1.4
  const cx = x + w / 2
  const cy = y + h / 2
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  canvas.getContext("2d")!.drawImage(source, cx - side / 2, cy - side / 2, side, side, 0, 0, size, size)
  return canvas.toDataURL("image/jpeg", quality)
}
