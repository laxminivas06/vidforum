"use client"

// Bulk enrollment from ONE document (.docx or .pdf) laid out as the sample sheet:
//   Photo | Student Name | Roll No | Class | Section   (one row per student, any number of sections)
// Parsed fully in the browser (native DecompressionStream for .docx, self-hosted pdf.js for .pdf), so it works offline.
import { detectFaces, cropFace, DetectedFace } from "./engine"

export interface RosterStudent {
  id: string
  name: string
  rollNumber: string | null
  admissionNumber: string
  templates: number[][]
}

export interface SectionInfo {
  id: string
  className: string
  sectionName: string
}

export interface DocFields {
  name: string
  roll: string
  className: string
  sectionName: string
}

export type DocIssue =
  | "ok"
  | "name_mismatch"
  | "roll_not_found"
  | "section_not_found"
  | "student_not_found"
  | "no_label"
  | "no_face"
  | "multiple_faces"
  | "low_quality"

export interface DocRow {
  key: string
  where: string // "Row 3" / "Page 2"
  face: DetectedFace | null
  thumb?: string // small preview
  photo?: string // 256px reference crop sent to the server
  fields: DocFields
  text: string // raw label text (free-form PDFs without the sample's columns)
  issue: DocIssue
}

type Column = keyof DocFields | "photo"

// Checked in order: "Roll No" / "Section" / "Class" before the generic "name"
const HEADER_PATTERNS: Array<[Column, RegExp]> = [
  ["photo", /^(photo|image|picture|pic)\b/i],
  ["roll", /\broll\b/i],
  ["sectionName", /^(section|sec)\b/i],
  ["className", /^(class|grade|std|standard)\b/i],
  ["name", /\bname\b/i],
]

const EMPTY: DocFields = { name: "", roll: "", className: "", sectionName: "" }
const SAMPLE_COLUMNS = ["Photo", "Student Name", "Roll No", "Class", "Section"]

// ---------------------------------------------------------------- matching
const normName = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim()
const normRoll = (s: string) => {
  const r = s.toLowerCase().replace(/\s+/g, "")
  return /^\d+$/.test(r) ? r.replace(/^0+(?=\d)/, "") : r
}
const normClass = (s: string) =>
  s.toLowerCase().replace(/\b(grade|class|std|standard)\b\.?/g, "").replace(/(\d+)(st|nd|rd|th)\b/g, "$1").replace(/[^a-z0-9]/g, "")
const normSection = (s: string) => s.toLowerCase().replace(/\b(section|sec)\b\.?/g, "").replace(/[^a-z0-9]/g, "")

/** A heading row must name both the Name and Roll columns ("Grade 8" / "Section B" cells alone are data). */
const isHeaderRow = (cols: Array<Column | null>) => cols.includes("name") && cols.includes("roll")

function headerColumn(text: string): Column | null {
  const t = text.trim()
  if (!t || t.length > 24) return null
  return HEADER_PATTERNS.find(([, re]) => re.test(t))?.[0] ?? null
}

/** Section named by the row's Class + Section ("Grade 10"/"10"/"10th" and "Section A"/"A" all match). */
export function findSection(fields: DocFields, sections: SectionInfo[]): SectionInfo | null {
  const c = normClass(fields.className)
  const s = normSection(fields.sectionName)
  if (!c) return null
  const inClass = sections.filter((x) => normClass(x.className) === c)
  if (!s) return inClass.length === 1 ? inClass[0] : null
  return inClass.find((x) => normSection(x.sectionName) === s) || null
}

/** Roll number (within the section) is authoritative; the name is cross-checked against the record. */
export function resolveStudent(
  row: Pick<DocRow, "fields" | "text">,
  sections: SectionInfo[],
  rosters: Map<string, RosterStudent[]>,
  fallbackSectionId?: string
): { studentId: string | null; issue: DocIssue } {
  const { fields } = row
  const named = fields.className || fields.sectionName
  const section = named ? findSection(fields, sections) : sections.find((s) => s.id === fallbackSectionId) || null
  if (!section) return { studentId: null, issue: named ? "section_not_found" : "no_label" }
  const roster = rosters.get(section.id) || []

  let { name, roll } = fields
  if (!name && !roll && row.text) {
    // Free-form label (no sample columns): "Roll No: 08-B-01", name matched against the roster
    roll = row.text.match(/roll\s*(?:no\.?|number|#)?\s*[:\-.]?\s*([a-z0-9][a-z0-9\-/]*)/i)?.[1] || ""
    const blob = ` ${normName(row.text)} `
    name = roster.find((s) => blob.includes(` ${normName(s.name)} `))?.name || ""
  }

  // The "Roll No" column may also hold the admission number
  const byRoll = roll
    ? roster.find((s) => (s.rollNumber && normRoll(s.rollNumber) === normRoll(roll)) || normRoll(s.admissionNumber) === normRoll(roll))
    : undefined
  if (byRoll) return { studentId: byRoll.id, issue: name && normName(name) !== normName(byRoll.name) ? "name_mismatch" : "ok" }
  const byName = name ? roster.find((s) => normName(s.name) === normName(name)) : undefined
  // When the section has no roll numbers recorded at all, the name is the only identifier: not an error
  const rollsRecorded = roster.some((s) => s.rollNumber)
  if (byName) return { studentId: byName.id, issue: roll && rollsRecorded ? "roll_not_found" : "ok" }
  return { studentId: null, issue: roll && rollsRecorded ? "roll_not_found" : name ? "student_not_found" : "no_label" }
}

// ---------------------------------------------------------------- faces
type ImageResult = { face: DetectedFace | null; thumb?: string; photo?: string; issue: DocIssue }

async function faceFromImage(source: HTMLCanvasElement): Promise<ImageResult> {
  const faces = (await detectFaces(source, { liveCheck: false })).sort((a, b) => b.box[2] * b.box[3] - a.box[2] * a.box[3])
  const face = faces[0] || null
  return {
    face,
    thumb: face ? cropFace(source, face.box, 96) : undefined,
    photo: face ? cropFace(source, face.box, 256) : undefined,
    issue: !face ? "no_face" : faces.length > 1 ? "multiple_faces" : face.quality < 0.5 ? "low_quality" : "ok",
  }
}

async function bitmapToCanvas(blob: Blob) {
  const bmp = await createImageBitmap(blob)
  const scale = Math.min(1, 1280 / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close()
  return canvas
}

// ---------------------------------------------------------------- .docx (zip) reading
const W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
const R_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
const A_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"

async function unzip(buf: ArrayBuffer) {
  const dv = new DataView(buf)
  const u8 = new Uint8Array(buf)
  let eocd = -1
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error("This is not a valid Word (.docx) file.")
  const entries = new Map<string, { method: number; data: Uint8Array }>()
  let p = dv.getUint32(eocd + 16, true)
  for (let n = dv.getUint16(eocd + 10, true); n > 0 && dv.getUint32(p, true) === 0x02014b50; n--) {
    const method = dv.getUint16(p + 10, true)
    const size = dv.getUint32(p + 20, true)
    const nameLen = dv.getUint16(p + 28, true)
    const skip = nameLen + dv.getUint16(p + 30, true) + dv.getUint16(p + 32, true)
    const local = dv.getUint32(p + 42, true)
    const name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nameLen))
    const start = local + 30 + dv.getUint16(local + 26, true) + dv.getUint16(local + 28, true)
    entries.set(name, { method, data: u8.subarray(start, start + size) })
    p += 46 + skip
  }
  return async (name: string): Promise<Uint8Array | null> => {
    const e = entries.get(name)
    if (!e) return null
    if (e.method === 0) return e.data
    const stream = new Blob([e.data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"))
    return new Uint8Array(await new Response(stream).arrayBuffer())
  }
}

const cellText = (el: Element) =>
  Array.from(el.getElementsByTagNameNS(W_NS, "p"))
    .map((p) => Array.from(p.getElementsByTagNameNS(W_NS, "t")).map((t) => t.textContent || "").join(""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()

async function readDocx(file: File, onProgress?: (msg: string) => void): Promise<DocRow[]> {
  const read = await unzip(await file.arrayBuffer())
  const xmlBytes = await read("word/document.xml")
  if (!xmlBytes) throw new Error("This Word file has no document body.")
  const parse = (b: Uint8Array) => new DOMParser().parseFromString(new TextDecoder().decode(b), "application/xml")
  const doc = parse(xmlBytes)
  const relBytes = await read("word/_rels/document.xml.rels")
  const rels = new Map<string, string>()
  if (relBytes) for (const r of Array.from(parse(relBytes).getElementsByTagName("Relationship"))) rels.set(r.getAttribute("Id")!, r.getAttribute("Target")!)

  const trs = Array.from(doc.getElementsByTagNameNS(W_NS, "tr"))
  if (trs.length === 0) throw new Error("No table found. Use the sample sheet: Photo | Student Name | Roll No | Class | Section.")

  let columns: Array<Column | null> | null = null
  const rows: DocRow[] = []
  for (let i = 0; i < trs.length; i++) {
    const cells = Array.from(trs[i].getElementsByTagNameNS(W_NS, "tc"))
    const texts = cells.map(cellText)
    const blipCell = cells.findIndex((c) => c.getElementsByTagNameNS(A_NS, "blip").length > 0)
    const asHeader = texts.map(headerColumn)
    if (blipCell < 0 && isHeaderRow(asHeader)) {
      columns = asHeader
      continue
    }
    if (blipCell < 0 && texts.every((t) => !t)) continue // empty row

    // Without a header row, assume the sample's order after the photo cell
    const order: Array<Column | null> = columns || cells.map((_, c) => (c === blipCell ? "photo" : null))
    const fields: DocFields = { ...EMPTY }
    if (columns) {
      texts.forEach((t, c) => {
        const col = order[c]
        if (col && col !== "photo") fields[col] = t
      })
    } else {
      const [name = "", roll = "", className = "", sectionName = ""] = texts.filter((_, c) => c !== blipCell)
      Object.assign(fields, { name, roll, className, sectionName })
    }

    onProgress?.(`Reading row ${rows.length + 1} of about ${trs.length - 1}...`)
    let image: ImageResult = { face: null, issue: "no_face" }
    if (blipCell >= 0) {
      const embed = cells[blipCell].getElementsByTagNameNS(A_NS, "blip")[0].getAttributeNS(R_NS, "embed") || ""
      const target = (rels.get(embed) || "").replace(/^\.?\//, "")
      const bytes = await read(target.startsWith("word/") ? target : `word/${target}`)
      if (bytes) {
        try {
          image = await faceFromImage(await bitmapToCanvas(new Blob([bytes as BlobPart])))
        } catch {
          image = { face: null, issue: "no_face" } // unsupported image format (e.g. EMF)
        }
      }
    }
    rows.push({ key: `docx-${i}`, where: `Row ${rows.length + 1}`, fields, text: "", ...image })
  }
  return rows
}

// ---------------------------------------------------------------- .pdf reading
let pdfjsPromise: Promise<any> | null = null
function getPdfJs() {
  if (!pdfjsPromise) {
    const url = "/vendor/pdfjs/pdf.min.mjs"
    pdfjsPromise = import(/* webpackIgnore: true */ url).then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.mjs"
      return lib
    })
  }
  return pdfjsPromise
}

interface TextBox {
  str: string
  x: number
  cx: number
  cy: number
}

const overlap = (a: number[], b: number[]) => {
  const w = Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])
  const h = Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1])
  return w > 0 && h > 0 ? (w * h) / Math.min(a[2] * a[3], b[2] * b[3]) : 0
}

/**
 * Small photos on a full page shrink to a few pixels at the detector's input size, so the region is
 * scanned in overlapping tiles (each face lies fully inside at least one tile) and duplicates merged.
 */
async function detectTiled(src: HTMLCanvasElement, rx: number, ry: number, rw: number, rh: number, tile: number) {
  const step = Math.round(tile * 0.6)
  const found: DetectedFace[] = []
  for (let y = ry; ; y += step) {
    for (let x = rx; ; x += step) {
      const w = Math.min(tile, rx + rw - x)
      const h = Math.min(tile, ry + rh - y)
      if (w >= 48 && h >= 48) {
        const c = document.createElement("canvas")
        c.width = w
        c.height = h
        c.getContext("2d")!.drawImage(src, x, y, w, h, 0, 0, w, h)
        for (const f of await detectFaces(c, { liveCheck: false })) found.push({ ...f, box: [f.box[0] + x, f.box[1] + y, f.box[2], f.box[3]] })
      }
      if (x + tile >= rx + rw) break
    }
    if (y + tile >= ry + rh) break
  }
  const keep: DetectedFace[] = []
  for (const f of found.sort((a, b) => b.quality - a.quality)) if (!keep.some((k) => overlap(k.box, f.box) > 0.3)) keep.push(f)
  return keep
}

interface PhotoUnit {
  face: DetectedFace | null
  thumb?: string
  photo?: string
  issue: DocIssue
  cx: number // position on the rendered page, used to find the photo's table row
  cy: number
  size: number
}

/** Draws a pdf.js image object (ImageBitmap or raw RGB/RGBA pixels) onto a canvas at its native resolution. */
function pdfImageToCanvas(img: any): HTMLCanvasElement | null {
  const w = img?.width
  const h = img?.height
  if (!w || !h || w < 48 || h < 48) return null
  const scale = Math.min(1, 1280 / Math.max(w, h))
  const out = document.createElement("canvas")
  out.width = Math.round(w * scale)
  out.height = Math.round(h * scale)
  const g = out.getContext("2d")!
  if (img.bitmap) {
    g.drawImage(img.bitmap, 0, 0, out.width, out.height)
    return out
  }
  if (!img.data || (img.kind !== 2 && img.kind !== 3)) return null // 1-bit masks etc.
  const full = document.createElement("canvas")
  full.width = w
  full.height = h
  const data = new ImageData(w, h)
  if (img.kind === 3) data.data.set(img.data.subarray(0, w * h * 4))
  else for (let i = 0, j = 0; i < w * h; i++, j += 3) data.data.set([img.data[j], img.data[j + 1], img.data[j + 2], 255], i * 4)
  full.getContext("2d")!.putImageData(data, 0, 0)
  g.drawImage(full, 0, 0, out.width, out.height)
  return out
}

/**
 * Photos embedded in the page, at full resolution. Spreadsheet/Word exports often show photos as tiny
 * thumbnails while embedding the original image, so this is far more reliable than the rendered page.
 */
async function embeddedPhotos(pdfjs: any, page: any, viewport: any): Promise<Array<{ canvas: HTMLCanvasElement; box: number[] }>> {
  const { OPS, Util } = pdfjs
  const ops = await page.getOperatorList()
  const getObj = (id: string) =>
    new Promise<any>((resolve) => {
      const store = id.startsWith("g_") ? page.commonObjs : page.objs
      const timer = setTimeout(() => resolve(null), 3000)
      try {
        store.get(id, (v: any) => {
          clearTimeout(timer)
          resolve(v)
        })
      } catch {
        resolve(null)
      }
    })
  let ctm: number[] = viewport.transform.slice()
  const stack: number[][] = []
  const pageArea = viewport.width * viewport.height
  const found: Array<{ canvas: HTMLCanvasElement; box: number[] }> = []
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i]
    const args = ops.argsArray[i]
    if (fn === OPS.save) stack.push(ctm.slice())
    else if (fn === OPS.restore) ctm = stack.pop() || ctm
    else if (fn === OPS.transform) ctm = Util.transform(ctm, args)
    else if (fn === OPS.paintImageXObject || fn === OPS.paintImageXObjectRepeat || fn === OPS.paintInlineImageXObject) {
      const img = fn === OPS.paintInlineImageXObject ? args[0] : await getObj(args[0])
      const pts = [[0, 0], [1, 0], [0, 1], [1, 1]].map((pt) => Util.applyTransform(pt, ctm))
      const xs = pts.map((pt: number[]) => pt[0])
      const ys = pts.map((pt: number[]) => pt[1])
      const box = [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)]
      if (box[2] * box[3] > pageArea * 0.6) continue // full-page scan/background: handled by the tiled fallback
      const canvas = pdfImageToCanvas(img)
      if (canvas) found.push({ canvas, box })
    }
  }
  return found
}

async function readPdf(file: File, onProgress?: (msg: string) => void): Promise<DocRow[]> {
  const pdfjs = await getPdfJs()
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  const rows: DocRow[] = []

  for (let p = 1; p <= doc.numPages; p++) {
    onProgress?.(`Reading page ${p} of ${doc.numPages}...`)
    const page = await doc.getPage(p)
    // Scale 3: passport-size photos on an A4 page render at ~70-110 px faces (scale 2 leaves them below the detector minimum)
    const viewport = page.getViewport({ scale: 3 })
    const canvas = document.createElement("canvas")
    canvas.width = viewport.width
    canvas.height = viewport.height
    await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise

    const content = await page.getTextContent()
    const texts: TextBox[] = content.items
      .filter((it: any) => typeof it.str === "string" && it.str.trim())
      .map((it: any) => {
        const [x, y] = viewport.convertToViewportPoint(it.transform[4], it.transform[5])
        return { str: it.str.trim(), x, cx: x + ((it.width || 0) * viewport.scale) / 2, cy: y - ((it.height || 10) * viewport.scale) / 2 }
      })

    // Sample-sheet columns: the topmost line holding the Name and Roll headings (Word repeats it on each page)
    const candidates = texts.map((t) => ({ t, col: headerColumn(t.str) })).filter((h) => h.col && h.col !== "photo")
    const keyY = candidates.filter((h) => h.col === "name" || h.col === "roll").map((h) => h.t.cy)
    const rowY = keyY.length ? Math.min(...keyY) : NaN
    let headers = candidates.filter((h) => Math.abs(h.t.cy - rowY) < 15)
    if (!isHeaderRow(headers.map((h) => h.col))) headers = []
    const hasHeader = headers.length >= 2
    const headerY = hasHeader ? Math.max(...headers.map((h) => h.t.cy)) : -Infinity
    const body = texts.filter((t) => t.cy > headerY + 4)
    const firstTextCol = hasHeader ? Math.min(...headers.map((h) => h.t.x)) - 4 : canvas.width

    // 1) Embedded photos at full resolution
    const units: PhotoUnit[] = []
    for (const img of await embeddedPhotos(pdfjs, page, viewport)) {
      const [x, y, w, h] = img.box
      if (y + h / 2 <= headerY) continue
      const r = await faceFromImage(img.canvas)
      // Faceless images only count as rows inside the sample's Photo column (otherwise they're logos/decoration)
      if (!r.face && !(hasHeader && x < firstTextCol)) continue
      units.push({ ...r, cx: x + w / 2, cy: y + h / 2, size: Math.max(w, h) })
    }
    // 2) Fallback for scanned/flattened pages: scan the rendered page in tiles
    if (!units.some((u) => u.face)) {
      units.length = 0
      const top = hasHeader ? Math.max(0, headerY) : 0
      for (const face of await detectTiled(canvas, 0, top, firstTextCol, canvas.height - top, Math.max(320, Math.min(firstTextCol, 480)))) {
        const [x, y, w, h] = face.box
        units.push({
          face,
          thumb: cropFace(canvas, face.box, 96),
          photo: cropFace(canvas, face.box, 256),
          issue: face.quality < 0.5 ? "low_quality" : "ok",
          cx: x + w / 2,
          cy: y + h / 2,
          size: Math.max(w, h),
        })
      }
    }
    units.sort((a, b) => a.cy - b.cy || a.cx - b.cx)

    // Table layout (sample sheet, or photos stacked in one column): a row's texts share the photo's vertical band
    const sizes = units.map((u) => u.size).sort((a, b) => a - b)
    const median = sizes[Math.floor(sizes.length / 2)] || 0
    const xs = units.map((u) => u.cx)
    const tableLayout = hasHeader || (units.length >= 2 && Math.max(...xs) - Math.min(...xs) < 1.5 * median)

    const owned: TextBox[][] = units.map(() => [])
    for (const t of body) {
      let best = -1
      let bestDist = Infinity
      units.forEach((u, i) => {
        const dy = Math.abs(t.cy - u.cy)
        const d = tableLayout ? dy : Math.hypot(t.cx - u.cx, dy)
        if (d < bestDist && d < (tableLayout ? Math.max(u.size * 0.75, 40) : 2.5 * u.size + 40)) {
          best = i
          bestDist = d
        }
      })
      if (best >= 0) owned[best].push(t)
    }

    units.forEach((u, i) => {
      const fields: DocFields = { ...EMPTY }
      const mine = owned[i].sort((a, b) => a.cy - b.cy || a.cx - b.cx)
      if (hasHeader) {
        for (const t of mine) {
          const nearest = headers.reduce((a, b) => (Math.abs(b.t.cx - t.cx) < Math.abs(a.t.cx - t.cx) ? b : a))
          const col = nearest.col as keyof DocFields
          fields[col] = fields[col] ? `${fields[col]} ${t.str}` : t.str
        }
      }
      rows.push({
        key: `pdf-${p}-${i}`,
        where: `Page ${p}`,
        face: u.face,
        thumb: u.thumb,
        photo: u.photo,
        fields,
        text: hasHeader ? "" : [...mine].sort((a, b) => a.cx - b.cx).map((t) => t.str).join(" "),
        issue: u.issue,
      })
    })
  }
  return rows
}

export async function readStudentDocument(file: File, onProgress?: (msg: string) => void): Promise<DocRow[]> {
  const name = file.name.toLowerCase()
  if (name.endsWith(".docx")) return readDocx(file, onProgress)
  if (name.endsWith(".pdf")) return readPdf(file, onProgress)
  throw new Error("Upload a .docx (Word) or .pdf file. Older .doc files: open in Word and save as .docx.")
}

// ---------------------------------------------------------------- sample .docx (generated in the browser)
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc32 = (u8: Uint8Array) => {
  let c = 0xffffffff
  for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** Minimal stored (uncompressed) zip, enough for a valid .docx. */
function zip(files: Array<{ name: string; data: Uint8Array }>): Blob {
  const enc = new TextEncoder()
  const parts: Uint8Array[] = []
  const central: Uint8Array[] = []
  let offset = 0
  for (const f of files) {
    const name = enc.encode(f.name)
    const crc = crc32(f.data)
    const local = new DataView(new ArrayBuffer(30))
    local.setUint32(0, 0x04034b50, true)
    local.setUint16(4, 20, true)
    local.setUint32(14, crc, true)
    local.setUint32(18, f.data.length, true)
    local.setUint32(22, f.data.length, true)
    local.setUint16(26, name.length, true)
    parts.push(new Uint8Array(local.buffer), name, f.data)
    const cen = new DataView(new ArrayBuffer(46))
    cen.setUint32(0, 0x02014b50, true)
    cen.setUint16(4, 20, true)
    cen.setUint16(6, 20, true)
    cen.setUint32(16, crc, true)
    cen.setUint32(20, f.data.length, true)
    cen.setUint32(24, f.data.length, true)
    cen.setUint16(28, name.length, true)
    cen.setUint32(42, offset, true)
    central.push(new Uint8Array(cen.buffer), name)
    offset += 30 + name.length + f.data.length
  }
  const size = central.reduce((n, c) => n + c.length, 0)
  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true)
  end.setUint16(8, files.length, true)
  end.setUint16(10, files.length, true)
  end.setUint32(12, size, true)
  end.setUint32(16, offset, true)
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)] as BlobPart[], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  })
}

async function placeholderPhoto(): Promise<Uint8Array> {
  const c = document.createElement("canvas")
  c.width = 240
  c.height = 300
  const g = c.getContext("2d")!
  g.fillStyle = "#eef0f3"
  g.fillRect(0, 0, 240, 300)
  g.fillStyle = "#c3c8d0"
  g.beginPath()
  g.arc(120, 115, 52, 0, Math.PI * 2)
  g.fill()
  g.beginPath()
  g.ellipse(120, 280, 95, 85, 0, Math.PI, 0)
  g.fill()
  g.fillStyle = "#6b7280"
  g.font = "bold 20px sans-serif"
  g.textAlign = "center"
  g.fillText("Paste photo", 120, 30)
  const blob: Blob = await new Promise((r) => c.toBlob((b) => r(b!), "image/png"))
  return new Uint8Array(await blob.arrayBuffer())
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const WIDTHS = [2000, 3000, 1700, 1500, 1500]

const cell = (inner: string, w: number, header = false) =>
  `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${header ? '<w:shd w:val="clear" w:color="auto" w:fill="E5E7EB"/>' : ""}<w:vAlign w:val="center"/></w:tcPr>${inner}</w:tc>`
const para = (text: string, bold = false) =>
  `<w:p><w:r>${bold ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`
const photoPara = (id: number) =>
  `<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="900000" cy="1125000"/><wp:docPr id="${id}" name="Photo ${id}"/>` +
  `<a:graphic xmlns:a="${A_NS}"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
  `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="photo.png"/><pic:cNvPicPr/></pic:nvPicPr>` +
  `<pic:blipFill><a:blip r:embed="rIdPhoto"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
  `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="900000" cy="1125000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>` +
  `</a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`

/** Downloads an editable sample sheet; pre-filled with the given students (photos left as placeholders). */
export async function downloadSampleDocx(students: DocFields[], fileName: string) {
  const enc = new TextEncoder()
  const border = '<w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/>'
  const header = `<w:tr><w:trPr><w:tblHeader/></w:trPr>${SAMPLE_COLUMNS.map((c, i) => cell(para(c, true), WIDTHS[i], true)).join("")}</w:tr>`
  const body = students
    .map(
      (s, i) =>
        `<w:tr><w:trPr><w:cantSplit/></w:trPr>${cell(photoPara(i + 1), WIDTHS[0])}${[s.name, s.roll, s.className, s.sectionName]
          .map((v, c) => cell(para(v), WIDTHS[c + 1]))
          .join("")}</w:tr>`
    )
    .join("")
  const documentXml =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:document xmlns:w="${W_NS}" xmlns:r="${R_NS}" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>` +
    para("Face Enrollment Sheet", true) +
    para("One row per student. Replace each placeholder with a clear, front-facing photo (right-click the picture, then Change Picture).") +
    para("Keep the column headings. Upload this file as .docx, or export it as PDF. Students are matched by Class, Section and Roll No.") +
    `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders>${border}</w:tblBorders></w:tblPr>` +
    `<w:tblGrid>${WIDTHS.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>${header}${body}</w:tbl>` +
    `<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1000" w:right="900" w:bottom="1000" w:left="900" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>` +
    `</w:body></w:document>`

  const blob = zip([
    {
      name: "[Content_Types].xml",
      data: enc.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
          `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>` +
          `<Default Extension="png" ContentType="image/png"/>` +
          `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`
      ),
    },
    {
      name: "_rels/.rels",
      data: enc.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
          `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`
      ),
    },
    { name: "word/document.xml", data: enc.encode(documentXml) },
    {
      name: "word/_rels/document.xml.rels",
      data: enc.encode(
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
          `<Relationship Id="rIdPhoto" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/placeholder.png"/></Relationships>`
      ),
    },
    { name: "word/media/placeholder.png", data: await placeholderPhoto() },
  ])

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
