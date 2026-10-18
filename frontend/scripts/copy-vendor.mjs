// Copies the on-device face engine, its models and pdf.js into public/vendor so they are
// self-hosted (no CDN) and cacheable by the service worker for offline use.
import { cpSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const nm = join(root, "node_modules")
const out = join(root, "public", "vendor")

const copy = (from, to) => {
  mkdirSync(dirname(join(out, to)), { recursive: true })
  cpSync(join(nm, from), join(out, to))
}

copy("@vladmandic/human/dist/human.esm.js", "human/human.esm.js")
for (const model of ["blazeface", "facemesh", "antispoof", "liveness"]) {
  copy(`@vladmandic/human/models/${model}.json`, `human/models/${model}.json`)
  copy(`@vladmandic/human/models/${model}.bin`, `human/models/${model}.bin`)
}
copy("onnxruntime-web/dist/ort.wasm.min.mjs", "ort/ort.wasm.min.mjs")
copy("onnxruntime-web/dist/ort-wasm-simd-threaded.mjs", "ort/ort-wasm-simd-threaded.mjs")
copy("onnxruntime-web/dist/ort-wasm-simd-threaded.wasm", "ort/ort-wasm-simd-threaded.wasm")

// SFace recognition model (OpenCV Zoo, Apache-2.0), kept in frontend/models
mkdirSync(join(out, "sface"), { recursive: true })
cpSync(join(root, "models", "face_recognition_sface_2021dec.onnx"), join(out, "sface", "sface.onnx"))
copy("pdfjs-dist/build/pdf.min.mjs", "pdfjs/pdf.min.mjs")
copy("pdfjs-dist/build/pdf.worker.min.mjs", "pdfjs/pdf.worker.min.mjs")
console.log("[copy-vendor] face engine, models, ONNX runtime and pdf.js copied to public/vendor")
