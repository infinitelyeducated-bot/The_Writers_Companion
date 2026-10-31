import { useEffect, useRef, useState } from 'react'
import { useProject } from '../state/project'
import { CoverWrap, EbookCover } from '../cover/CoverWrap'
import { coverGeometry, spineWidth } from '../cover/geometry'
import { BASE_BOOK_CSS } from '../print/printWindow'
import { COVER_CSS } from './coverCss'
import { downloadBlob } from '../util/download'
import { safeName } from '../export/epub'
import { canOpenPrintWindow } from '../target'
import { FontSelect } from '../fonts/FontSelect'
import { cssHrefForFamily, loadFontFamily } from '../fonts/catalog'
import { PageArtEditor } from './PageArtEditor'

export function CoverPane({ pageCount }: { pageCount: number }) {
  const { project, updateSettings, assets, uploadImage, flushNow } = useProject()
  const [mode, setMode] = useState<'print' | 'ebook'>('print')
  const [guides, setGuides] = useState(true)
  const [busy, setBusy] = useState(false)
  const [artPage, setArtPage] = useState(1)
  const printRef = useRef<HTMLDivElement>(null)
  const ebookRef = useRef<HTMLDivElement>(null)
  const c = project.settings.cover
  const set = (patch: Partial<typeof c>) => updateSettings({ cover: { ...c, ...patch } })
  useEffect(() => { void loadFontFamily(c.fontFamily) }, [c.fontFamily])
  const g = coverGeometry(project, pageCount, true)
  const trim = project.settings.trim

  const exportPrintPdf = async () => {
    await flushNow()
    setBusy(true)
    try {
      const w = window.open('', '_blank', 'width=1200,height=900')
      if (!w) { alert('Pop-up blocked — allow pop-ups to export.'); return }
      const gg = coverGeometry(project, pageCount, true)
      w.document.open()
      w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${safeName(project.meta.title)} — cover</title>
${cssHrefForFamily(c.fontFamily) ? `<link href="${cssHrefForFamily(c.fontFamily)}" rel="stylesheet">` : ''}
<style>@page { size: ${gg.wrapW}in ${gg.wrapH}in; margin: 0; }
html,body{margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact;}${COVER_CSS}</style>
</head><body></body></html>`)
      w.document.close()
      // copy rendered cover markup (guides hidden) into the print window
      const host = w.document.createElement('div')
      w.document.body.appendChild(host)
      await new Promise((r) => setTimeout(r, 500))
      const node = document.createElement('div')
      node.innerHTML = `<div class="cover-export">${printRef.current?.innerHTML || ''}</div>`
      host.appendChild(node)
      // hide guides + reset transform
      node.querySelectorAll('.cg-trim,.cg-spine,.cg-safe,.cg-label').forEach((el) => ((el as HTMLElement).style.display = 'none'))
      const wrap = node.querySelector('.cover-wrap') as HTMLElement | null
      if (wrap) { wrap.style.transform = 'none'; wrap.style.boxShadow = 'none' }
      await new Promise((r) => setTimeout(r, 600))
      w.focus()
      w.print()
    } finally {
      setBusy(false)
    }
  }

  const exportEbookPng = async () => {
    await flushNow()
    const el = ebookRef.current
    if (!el) return
    const canvas = document.createElement('canvas')
    const W = 1600
    const H = 2560
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!
    const ratio = W / el.offsetWidth
    // draw background
    ctx.fillStyle = c.background
    ctx.fillRect(0, 0, W, H)
    // rasterise via foreignObject SVG
    const clone = el.cloneNode(true) as HTMLElement
    clone.style.transform = 'none'
    const html = new XMLSerializer().serializeToString(clone)
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${W}px;height:${H}px;transform:scale(${ratio});transform-origin:top left">${html}</div></foreignObject></svg>`
    const img = new Image()
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
    img.onload = () => {
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => { if (blob) downloadBlob(blob, safeName(project.meta.title) + '-ebook-cover.png') }, 'image/png')
    }
    img.onerror = () => {
      // fallback: plain canvas rendering
      ctx.fillStyle = c.textColor
      ctx.font = `${W * 0.08}px Georgia`
      ctx.textAlign = 'center'
      ctx.fillText(project.meta.title.slice(0, 18), W / 2, H / 3)
      ctx.font = `${W * 0.04}px Georgia`
      ctx.fillText(project.meta.author, W / 2, (H * 2) / 3)
      canvas.toBlob((blob) => { if (blob) downloadBlob(blob, safeName(project.meta.title) + '-ebook-cover.png') }, 'image/png')
    }
    img.src = url
  }

  return (
    <div className="cover-pane">
      <aside className="settings-col">
        <h3>Cover</h3>
        <div className="seg">
          <button className={mode === 'print' ? 'on' : ''} onClick={() => setMode('print')}>Full-wrap print</button>
          <button className={mode === 'ebook' ? 'on' : ''} onClick={() => setMode('ebook')}>Ebook</button>
        </div>

        <h4>Geometry</h4>
        <div className="geo-box">
          <div><span>Trim</span><b>{trim.width}″ × {trim.height}″</b></div>
          <div><span>Pages</span><b>{pageCount}</b></div>
          <div><span>Spine</span><b>{g.spine.toFixed(3)}″</b></div>
          <div><span>Bleed</span><b>{project.settings.bleedSize}″</b></div>
          <div><span>Full wrap</span><b>{g.wrapW.toFixed(3)}″ × {g.wrapH.toFixed(3)}″</b></div>
        </div>
        <Field label="Paper thickness (in/page)">
          <select value={c.paperPpi} onChange={(e) => set({ paperPpi: Number(e.target.value) })}>
            <option value={0.002252}>White paper — 0.002252″/page</option>
            <option value={0.0025}>Cream paper — 0.0025″/page</option>
          </select>
        </Field>
        <p className="hint">Spine = pages × paper thickness ({spineWidth(pageCount, c.paperPpi).toFixed(3)}″). KDP minimum spine 0.0625″.</p>

        <h4>Artwork</h4>
        <Field label="Front cover image">
          <input type="file" accept="image/*" onChange={async (e) => {
            const f = e.target.files?.[0]
            if (f) { const a = await uploadImage(f); set({ coverImageId: a.id }) }
          }} />
        </Field>
        {c.coverImageId && <button className="btn tiny ghost" onClick={() => set({ coverImageId: undefined })}>Remove front image</button>}
        <Field label="Back cover image">
          <input type="file" accept="image/*" onChange={async (e) => {
            const f = e.target.files?.[0]
            if (f) { const a = await uploadImage(f); set({ backImageId: a.id }) }
          }} />
        </Field>
        {c.backImageId && <button className="btn tiny ghost" onClick={() => set({ backImageId: undefined })}>Remove back image</button>}

        <h4>This page · picture</h4>
        <Field label="Interior page">
          <input type="number" min={1} max={Math.max(1, pageCount)} value={artPage} onChange={(e) => setArtPage(Number(e.target.value) || 1)} />
        </Field>
        <PageArtEditor page={artPage} />

        <h4>Style</h4>
        <Field label="Layout">
          <select value={c.layout} onChange={(e) => set({ layout: e.target.value as 'classic' })}>
            <option value="classic">Classic</option>
            <option value="band">Colour band</option>
            <option value="minimal">Minimal</option>
            <option value="frame">Frame</option>
          </select>
        </Field>
        <Field label="Typeface">
          <FontSelect
            value={c.fontFamily}
            onChange={(fontFamily) => set({ fontFamily })}
            sizePt={c.titleSize}
            onSize={(titleSize) => set({ titleSize })}
          />
        </Field>
        <div className="row2">
          <Field label="Background"><input type="color" value={c.background} onChange={(e) => set({ background: e.target.value })} /></Field>
          <Field label="Text"><input type="color" value={c.textColor} onChange={(e) => set({ textColor: e.target.value })} /></Field>
          <Field label="Accent"><input type="color" value={c.accentColor} onChange={(e) => set({ accentColor: e.target.value })} /></Field>
        </div>
        <div className="row2">
          <Field label="Title size"><input type="range" min={30} max={100} value={c.titleSize} onChange={(e) => set({ titleSize: Number(e.target.value) })} /></Field>
          <Field label="Author size"><input type="range" min={14} max={60} value={c.authorSize} onChange={(e) => set({ authorSize: Number(e.target.value) })} /></Field>
        </div>
        <label className="chk"><input type="checkbox" checked={c.spineText} onChange={(e) => set({ spineText: e.target.checked })} /> Spine text (needs ≥ 0.25″)</label>
        <Field label="Publisher / imprint">
          <input value={c.publisherLogoText || ''} onChange={(e) => set({ publisherLogoText: e.target.value })} />
        </Field>
        <Field label="Back cover copy">
          <textarea rows={6} value={c.backText} onChange={(e) => set({ backText: e.target.value })} />
        </Field>
        <label className="chk"><input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} /> Show trim / spine / safe guides</label>

        <h4>Export</h4>
        <button
          className="btn primary wide"
          onClick={() => {
            if (!canOpenPrintWindow()) {
              window.alert('The print cover PDF needs a desktop browser. Open this book on a computer to export it; the ebook cover PNG works here.')
              return
            }
            void exportPrintPdf()
          }}
          disabled={busy}
        >
          ⤓ Print cover PDF (with bleed)
        </button>
        <button className="btn ghost wide" onClick={() => void exportEbookPng()}>⤓ Ebook cover PNG (1600×2560)</button>
        <p className="hint">Cover PDF is {g.wrapW.toFixed(3)}″ × {g.wrapH.toFixed(3)}″ including {project.settings.bleedSize}″ bleed on all sides. Guides are never printed.</p>
      </aside>

      <main className="cover-preview">
        {mode === 'print' ? (
          <div className="cover-stage">
            <div ref={printRef} style={{ transform: 'scale(0.55)', transformOrigin: 'top left' }}>
              <CoverWrap project={project} pageCount={pageCount} assets={assets} guides={guides} forPrint />
            </div>
          </div>
        ) : (
          <div className="ebook-stage">
            <div ref={ebookRef}>
              <EbookCover project={project} assets={assets} width={380} />
            </div>
            <p className="muted small">Ebook cover · 1600 × 2560 px export (digital 1:1.6)</p>
          </div>
        )}
      </main>
      <style>{BASE_BOOK_CSS + COVER_CSS}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}
