"use client"

import React, { useEffect, useId, useState } from "react"
import ReactMarkdown, { Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import type { TutorCitation } from "@/lib/api/tutor"

/** Renders a ```mermaid block as SVG (strict security level; lazy-loaded). */
function MermaidDiagram({ code }: { code: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "")
  const [svg, setSvg] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let cancelled = false
    import("mermaid")
      .then(async ({ default: mermaid }) => {
        mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral", fontFamily: "inherit" })
        // models often write  -->| "label" |  which mermaid rejects; normalise to  -->|"label"|
        const clean = code.replace(/\|\s*"([^"|]*)"\s*\|/g, '|"$1"|')
        const { svg } = await mermaid.render(`m${id}`, clean)
        // keep diagrams compact in a chat bubble: never above natural size, at most ~520px tall
        const [, , w = 0, h = 0] = (svg.match(/viewBox="([^"]+)"/)?.[1] ?? "").split(/\s+/).map(Number)
        const maxW = w && h ? Math.round(w * Math.min(1, 520 / h)) : 460
        if (!cancelled) setSvg(svg.replace(/style="max-width:[^"]*"/, `style="max-width: min(100%, ${maxW}px)"`))
      })
      .catch((e) => {
        console.warn("[AI Tutor] diagram could not be drawn", e)
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [code, id])
  if (failed) return <pre className="my-2 overflow-x-auto rounded-lg bg-canvas p-3 font-mono text-[11px] text-text-secondary">{code}</pre>
  if (!svg) return <div className="my-3 h-24 rounded-lg bg-canvas animate-pulse" />
  return (
    <div
      className="my-3 overflow-x-auto rounded-xl border border-border-default bg-white p-3 [&_svg]:mx-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

interface Props {
  content: string
  citations?: TutorCitation[]
  streaming?: boolean
  onCite?: (c: TutorCitation) => void
}

/** Tutor answer renderer: Markdown + LaTeX + Mermaid, with [S#] tags turned into page chips. */
export function TutorMarkdown({ content, citations = [], streaming, onCite }: Props) {
  const byRef = new Map(citations.map((c) => [c.ref, c]))
  const text = content.replace(/\[S\d+(?:\s*,\s*S?\d+)+\]/g, (m) => (streaming ? "" : m)).replace(/\[S(\d+)\]/g, (tag, n) => {
    if (streaming) return ""
    const c = byRef.get(`S${n}`)
    return c ? `[p.${c.page}](#cite-S${n})` : ""
  })

  // "[p.13](#cite-S1) [p.13](#cite-S4)" → one chip
  const compact = text.replace(/(\[p\.(\d+)\]\(#cite-S\d+\))(?:\s*\[p\.\2\]\(#cite-S\d+\))+/g, "$1")

  const components: Components = {
    a: ({ href, children }) => {
      if (href?.startsWith("#cite-")) {
        const c = byRef.get(href.slice(6))
        return (
          <button
            type="button"
            onClick={() => c && onCite?.(c)}
            title={c ? `${c.chapterTitle}, page ${c.page} — open page` : undefined}
            className="mx-0.5 inline-flex items-center rounded-md border border-purple-200 bg-purple-50 px-1.5 py-0 align-baseline text-[10px] font-semibold text-purple-700 hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950/50 dark:text-purple-300"
          >
            {children}
          </button>
        )
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-primary underline">
          {children}
        </a>
      )
    },
    code: ({ className, children }) => {
      const lang = /language-(\w+)/.exec(className || "")?.[1]
      const code = String(children).replace(/\n$/, "")
      if (lang === "mermaid") return streaming ? <span className="text-text-muted italic">Drawing a diagram…</span> : <MermaidDiagram code={code} />
      if (!lang) return <code className="rounded bg-canvas px-1 py-0.5 font-mono text-[0.9em]">{children}</code>
      return <code className="block overflow-x-auto rounded-lg bg-canvas p-3 font-mono text-[11px]">{code}</code>
    },
    pre: ({ children }) => <div className="my-2">{children}</div>,
    p: ({ children }) => <p className="my-2 leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
    ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
    h1: ({ children }) => <h3 className="mb-1 mt-3 text-sm font-bold">{children}</h3>,
    h2: ({ children }) => <h3 className="mb-1 mt-3 text-sm font-bold">{children}</h3>,
    h3: ({ children }) => <h4 className="mb-1 mt-3 text-[13px] font-bold">{children}</h4>,
    blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-purple-300 pl-3 text-text-secondary">{children}</blockquote>,
    table: ({ children }) => (
      <div className="my-2 overflow-x-auto">
        <table className="w-full border-collapse text-[11px]">{children}</table>
      </div>
    ),
    th: ({ children }) => <th className="border border-border-default bg-canvas px-2 py-1 text-left font-semibold">{children}</th>,
    td: ({ children }) => <td className="border border-border-default px-2 py-1">{children}</td>,
  }

  return (
    <div className="text-xs text-text-primary [&_.katex-display]:overflow-x-auto [&_.katex-display]:py-1">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]} components={components}>
        {compact}
      </ReactMarkdown>
    </div>
  )
}
