import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import type { Project } from '../model/types'
import type { PaginationResult } from '../layout/paginate'
import { BookPage, pageBoxStyle } from '../layout/BookPage'
import { LAYOUT_CSS } from '../layout/pageCss'
import { cssHrefForFamily } from '../fonts/catalog'
import type { PMNode } from '../model/types'

/** Every family used by inline fontFamily marks anywhere in the manuscript. */
function inlineFamilies(project: Project): string[] {
  const out = new Set<string>()
  const walk = (nodes: PMNode[] | undefined) => {
    for (const n of nodes || []) {
      if (n.type === 'text') {
        const m = (n.marks || []).find((x) => x.type === 'fontFamily')
        const fam = m?.attrs?.family
        if (fam) out.add(String(fam))
      } else if ('content' in n && n.content) {
        walk(n.content as PMNode[])
      }
    }
  }
  for (const sid of Object.keys(project.doc.scenes)) walk(project.doc.scenes[sid])
  return [...out]
}

/**
 * Print-to-PDF: renders every page into a fresh window at exact trim size and
 * triggers the browser's print dialog. Each .book-page is its own @page, so the
 * resulting PDF has one page per book page, identical to the preview.
 */
export function openPrintWindow(project: Project, pagination: PaginationResult, assetMap: Record<string, string>) {
  const w = window.open('', '_blank', 'width=1200,height=900')
  if (!w) {
    alert('Pop-up blocked. Allow pop-ups for this site to export the PDF.')
    return
  }
  const { settings } = project
  const trimW = settings.trim.width + (settings.bleed && settings.cropMarks ? settings.bleedSize * 2 : 0)
  const trimH = settings.trim.height + (settings.bleed && settings.cropMarks ? settings.bleedSize * 2 : 0)
  const bleedPad = settings.bleed && settings.cropMarks ? settings.bleedSize : 0

  w.document.open()
  // the book face plus every face used by inline marks — otherwise the PDF
  // silently falls back to Georgia for hieroglyphs/storybook runs
  const families = [settings.typography.fontFamily, ...inlineFamilies(project)]
  const fontLinks = [...new Set(families)]
    .map((f) => cssHrefForFamily(f))
    .filter((h): h is string => !!h)
    .map((h) => `<link href="${h}" rel="stylesheet">`)
    .join('\n')
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(project.meta.title)} — interior</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fontLinks}
<style>${PRINT_CSS(trimW, trimH, bleedPad)}${GRAPHICS_CSS}
${LAYOUT_CSS}</style>
</head><body><div id="print-root"></div></body></html>`)
  w.document.close()

  const render = () => {
    const root = w.document.getElementById('print-root')!
    // accessibility layer = extra DOM text (duplicates in the PDF text layer,
    // huge node count on long books). Printing doesn't need it.
    ;(window as unknown as { __bfDisableA11y?: boolean }).__bfDisableA11y = true
    const reactRoot = createRoot(root)
    flushSync(() => {
      reactRoot.render(
        <>
          {pagination.pages.map((p) => {
            const box = pageBoxStyle(project, pagination, p)
            return (
              <div key={p.index} className="print-sheet">
                {bleedPad > 0 && <div className="bleed-bg" style={{ position: 'absolute', inset: 0, background: '#fff' }} />}
                <div style={{ position: 'absolute', left: `${bleedPad}in`, top: `${bleedPad}in`, width: box.width, height: box.height }}>
                  <BookPage page={p} project={project} pagination={pagination} className="print-page" assets={assetMap} />
                </div>
                {bleedPad > 0 && <CropMarks bleed={bleedPad} trimW={project.settings.trim.width} trimH={project.settings.trim.height} />}
              </div>
            )
          })}
        </>,
      )
    })
    // wait for images + fonts, then print
    const images = Array.from(w.document.images)
    const imgPromises = images.map((img) => (img.complete ? Promise.resolve() : new Promise((res) => { img.onload = res; img.onerror = res })))
    Promise.all([w.document.fonts.ready, ...imgPromises]).then(() => {
      w.setTimeout(() => {
        w.focus()
        w.print()
      }, 350)
    })
  }
  // give the stylesheet a beat to load
  w.setTimeout(render, 400)
}

function CropMarks({ bleed, trimW, trimH }: { bleed: number; trimW: number; trimH: number }) {
  const L = bleed / 2
  const mark = (style: React.CSSProperties) => <div style={{ position: 'absolute', background: '#000', ...style }} />
  const W = trimW + bleed * 2
  const H = trimH + bleed * 2
  return (
    <div className="crop-marks" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {mark({ left: `${bleed - L - 0.06}in`, top: `${bleed}in`, width: '0.06in', height: '1pt' })}
      {mark({ left: `${bleed - L - 0.06}in`, top: `${bleed + trimH}in`, width: '0.06in', height: '1pt' })}
      {mark({ left: `${bleed + trimW}in`, top: `${bleed}in`, width: '0.06in', height: '1pt' })}
      {mark({ left: `${bleed + trimW}in`, top: `${bleed + trimH}in`, width: '0.06in', height: '1pt' })}
      {mark({ left: `${bleed}in`, top: `${bleed - L - 0.06}in`, width: '1pt', height: '0.06in' })}
      {mark({ left: `${bleed + trimW}in`, top: `${bleed - L - 0.06}in`, width: '1pt', height: '0.06in' })}
      {mark({ left: `${bleed}in`, top: `${bleed + trimH}in`, width: '1pt', height: '0.06in' })}
      {mark({ left: `${bleed + trimW}in`, top: `${bleed + trimH}in`, width: '1pt', height: '0.06in' })}
      <div style={{ position: 'absolute', left: `${bleed}in`, top: `${bleed}in`, width: `${trimW}in`, height: `${trimH}in`, outline: '0.25pt solid rgba(0,0,0,0.25)', opacity: 0.35 }} />
      <div style={{ position: 'absolute', right: '0.1in', bottom: '0.05in', font: '6pt monospace', color: '#555' }}>
        {W.toFixed(3)}″ × {H.toFixed(3)}″ · bleed {bleed}″ · trim {trimW}″ × {trimH}″
      </div>
    </div>
  )
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export const GRAPHICS_CSS = "\n.page-vignette { position: absolute; z-index: 1; pointer-events: none; display: flex; align-items: center; justify-content: center; }\n.page-vignette img { width: 100%; height: 100%; object-fit: contain; }\n.page-vignette.center { left: 50%; transform: translateX(-50%); }\n.page-sidebar { position: absolute; z-index: 1; overflow: hidden; display: flex; align-items: center; justify-content: center; }\n.page-sidebar img { width: 100%; height: 100%; object-fit: cover; object-position: center; }\n.page-sidebar.framed { border: 0.5pt solid #999; padding: 0.06in; }\n.page-sidebar.framed img { border: 0.25pt solid #bbb; }\n.page-border { position: absolute; inset: 0; pointer-events: none; z-index: 2; }\n.page-border.rule { margin: 0.28in; border: 0.6pt solid #8a8275; }\n.page-border.double { margin: 0.28in; border: 0.6pt solid #8a8275; box-shadow: inset 0 0 0 0.06in #fff, inset 0 0 0 0.9pt #8a8275; }\n.page-border.ornament { margin: 0.3in; border: 0.5pt solid #b3aa9a; }\n.pb-orn { position: absolute; left: 50%; transform: translateX(-50%); top: -0.11in; background: #fff; padding: 0 0.12em; color: #8a8275; font-size: 0.85em; }\n.plate-page { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.5in; }\n.plate-page img { max-width: 100%; max-height: 100%; object-fit: contain; }\n.plate-caption { margin: 0.22in 0 0; font-size: 0.8em; font-style: italic; letter-spacing: 0.04em; color: #444; text-align: center; }\n.page-sidebar { opacity: var(--sb-op, 1); }"

function PRINT_CSS(w: number, h: number, bleed: number): string {
  void bleed
  return `
  @page { size: ${w}in ${h}in; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .print-sheet { width: ${w}in; height: ${h}in; page-break-after: always; break-after: page; position: relative; overflow: hidden; }
  .print-sheet:last-child { page-break-after: auto; break-after: auto; }
  ${BASE_BOOK_CSS}
  .print-page { position: relative; }
  `
}

export const BASE_BOOK_CSS = `
  .book-page {
    position: relative; overflow: hidden; background: #fff; color: #111;
    box-sizing: border-box; break-inside: avoid; isolation: isolate;
  }
  .book-page * { box-sizing: border-box; }
  .page-body { height: 100%; overflow: visible; background: transparent; position: relative; z-index: 2; }
  .page-art-backdrop { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
  .page-art-layer { position: absolute; pointer-events: none; }
  .page-art-layer.layer-below, .page-art-layer.layer-text { inset: 0; width: 100%; height: 100%; object-fit: contain; }
  .page-art-above { position: absolute; inset: 0; z-index: 3; pointer-events: none; }
  .run-head, .folio { z-index: 2; }
  .page-body p { margin: 0; orphans: 2; widows: 2; }
  .page-body .no-indent { text-indent: 0; }
  .page-body p + p { text-indent: 1.5em; }
  .sec-h2 { font-size: 1.25em; font-weight: normal; text-align: center; margin: 1.4em 0 0.9em; text-indent: 0; letter-spacing: 0.02em; }
  .sec-h3 { font-size: 1.05em; font-weight: bold; margin: 1.2em 0 0.6em; text-indent: 0; }
  .sec-h2 + p, .sec-h3 + p { text-indent: 0; }
  blockquote.bq { margin: 1em 1.5em; font-style: italic; text-indent: 0; }
  blockquote.bq p { text-indent: 0; }
  .bq-attr { text-align: right; font-style: normal; font-size: 0.92em; margin: 0.2em 1.5em 1em 0; text-indent: 0; }
  ul, ol { margin: 0.8em 0 0.8em 1.4em; padding: 0; }
  li { margin: 0.25em 0; text-align: left; }
  .sb { text-align: center; margin: 1.1em 0; text-indent: 0; letter-spacing: 0.5em; }
  figure.img { margin: 1.2em 0; text-align: center; text-indent: 0; }
  figure.img img { max-width: 100%; height: auto; }
  figcaption { font-size: 0.85em; font-style: italic; margin-top: 0.4em; text-align: center; }
  .img-ph { height: 1.6in; margin: 0 auto; background: #eee; border: 1px dashed #bbb; }
  .sc { font-variant: small-caps; letter-spacing: 0.02em; }
  sup.fn-marker { font-size: 0.68em; line-height: 0; vertical-align: super; }
  .page-fn { border-top: 0.5pt solid #999; padding-top: 0.28em; margin-top: 0.3em; text-indent: 0; text-align: left; }
  .page-fn .fn-body { font-size: 0.78em; line-height: 1.28; }
  .page-fn .fn-line { margin: 0 0 0.25em; text-indent: 0; }
  .page-fn .fn-num { font-weight: bold; }
  .run-head { position: absolute; left: 0; right: 0; text-align: center; font-size: 8.5pt; color: #333; }
  .folio { position: absolute; left: 0; right: 0; text-align: center; font-size: 9pt; }
  .folio.bottomOutside.verso, .folio.topOutside.verso { text-align: left; padding-left: 0.6in; }
  .folio.bottomOutside.recto, .folio.topOutside.recto { text-align: right; padding-right: 0.6in; }
  .open-chrome { text-align: center; margin: 0 0 1.6em; }
  .open-chrome.part-open { margin-top: 2.6em; }
  .open-label { font-size: 0.8em; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 0.9em; color: #444; }
  .open-title { font-size: 1.7em; font-weight: normal; margin: 0.2em 0 0.6em; line-height: 1.2; }
  .open-chrome .orn { font-size: 1em; letter-spacing: 0.4em; color: #555; margin-top: 0.4em; }
  .matter-open .open-title, .matter-open h1 { font-size: 1.5em; font-weight: normal; text-align: center; margin: 0 0 1.4em; }
  .matter-open { margin-bottom: 1.2em; }
  .dropcap > p:first-child::first-letter, p.dropcap::first-letter { float: left; font-size: 3.1em; line-height: 0.82; margin-top: 0.04em; padding: 0.02em 0.08em 0 0; font-weight: normal; }
  p.sc-first { font-variant: small-caps; letter-spacing: 0.04em; }
  .blank-page { height: 100%; }
  .title-page { height: 100%; display: flex; flex-direction: column; justify-content: space-between; text-align: center; padding: 1.2in 0 1in; }
  .tp-title { font-size: 2em; font-weight: normal; line-height: 1.2; margin: 0 0 0.6em; letter-spacing: 0.02em; }
  .tp-sub { font-size: 1.05em; font-style: italic; margin: 0; }
  .tp-rule { width: 1.4in; border-top: 0.75pt solid #444; margin: 0 auto 1em; }
  .tp-author { font-size: 1.1em; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 2.4em; }
  .tp-pub { font-size: 0.8em; letter-spacing: 0.1em; text-transform: uppercase; color: #555; margin: 0; }
  .copyright-page { font-size: 0.8em; line-height: 1.45; padding-top: 55%; text-align: left; }
  .copyright-page p { margin: 0 0 0.7em; text-indent: 0; }
  .copyright-page .cp-title { font-weight: bold; font-size: 1.1em; }
  .copyright-page .cp-small { margin-top: 1.6em; }
  .toc-head { font-size: 1.5em; font-weight: normal; text-align: center; margin: 0 0 1.6em; }
  .toc-row { display: flex; align-items: baseline; column-gap: 0.3em; margin: 0 0 0.55em; text-indent: 0; }
  .toc-row.lvl2 { padding-left: 1.4em; font-size: 0.94em; }
  .toc-t2 { flex: none; white-space: normal; }
  .toc-fill { flex: 1 1 auto; align-self: end; height: 1px; margin-bottom: 0.28em; background-image: radial-gradient(circle, #999 0.35px, transparent 0.45px); background-size: 3.2px 2px; background-repeat: repeat-x; background-position: left bottom; }
  .toc-p2 { flex: none; min-width: 1.6em; text-align: right; font-variant-numeric: tabular-nums; }
`
