import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useProject } from '../state/project'
import { paginate, type PaginationResult } from '../layout/paginate'
import { BookPage } from '../layout/BookPage'
import { TRIM_PRESETS, type PMNode } from '../model/types'
import { LAYOUTS, layoutById } from '../data/layouts'
import { canOpenPrintWindow, saveVerb } from '../target'
import { kdpGutterFor as kdpGutter, runPreflight, worstLevel, type Check } from '../export/preflight'
import { downloadBlob } from '../util/download'
import { safeName } from '../export/epub'
import { FontSelect } from '../fonts/FontSelect'
import { loadFontFamily } from '../fonts/catalog'
import { PageArtEditor } from './PageArtEditor'
import { artForPage, artKeyFor } from '../pageArt'

// ─────────────────────────────────────────────────────────────────────────────
// Print layout tab: settings, live preview, preflight, PDF export.
// ─────────────────────────────────────────────────────────────────────────────

export function PrintPane({ onPageCount, onCurrentPage }: { onPageCount: (n: number) => void; onCurrentPage?: (n: number) => void }) {
  const { project, updateSettings, updateMeta, uploadImage, applyLayout, assets, flushNow, updateDoc, recordPagination } = useProject()
  const g = project.settings.graphics
  const assetMap = Object.fromEntries(assets.map((a) => [a.id, a.dataUrl]))
  const updateGraphics = (patch: Partial<typeof g>) => updateSettings({ graphics: { ...g, ...patch } })
  const [pagination, setPagination] = useState<PaginationResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [pageNo, setPageNoRaw] = useState(1)
  const setPageNo = useCallback((n: number | ((p: number) => number)) => {
    setPageNoRaw((prev) => {
      const next = typeof n === 'function' ? n(prev) : n
      onCurrentPage?.(next)
      return next
    })
  }, [onCurrentPage])
  const [zoom, setZoom] = useState(0.72)
  const [guides, setGuides] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [checks, setChecks] = useState<Check[]>([])
  const runId = useRef(0)

  const repaginate = useCallback(() => {
    const id = ++runId.current
    setBusy(true)
    // let the UI paint the busy state before the synchronous measurement pass
    window.setTimeout(() => {
      const assetMap = Object.fromEntries(assets.map((a) => [a.id, a.dataUrl]))
      const sizes = Object.fromEntries(assets.map((a) => [a.id, { w: a.width, h: a.height }]))
      const res = paginate(project, (aid) => assetMap[aid], (aid) => sizes[aid])
      if (id !== runId.current) return
      setPagination(res)
      onPageCount(res.pageCount)
      recordPagination(res.pageCount, res.anchors)
      setPageNo((p) => Math.min(Math.max(1, p), Math.max(1, res.pageCount)))
      const placedWidth = res.textWidthIn
      const assetDpi = assets
        .filter((a) => Object.values(project.doc.scenes).some((sc) => JSON.stringify(sc).includes(a.id)))
        .map((a) => ({ name: a.name, dpi: a.width / (placedWidth * 0.7), placedIn: placedWidth * 0.7 }))
      const missing = project.doc.blocks.flatMap((b) =>
        b.sceneIds.flatMap((sid) => (project.doc.scenes[sid] || []).filter((n) => n.type === 'image' && !assetMap[n.attrs.imageId]).map(() => b.title)),
      )
      const empty = project.doc.blocks.filter((b) => b.sceneIds.every((sid) => !JSON.stringify(project.doc.scenes[sid] || []).match(/"text":/))).map((b) => b.title)
      setChecks(
        runPreflight({
          project,
          pageCount: res.pageCount,
          gutter: res.gutter,
          textWidthIn: res.textWidthIn,
          textHeightIn: res.textHeightIn,
          missingImages: missing,
          assetDpi,
          emptyChapters: empty,
        }),
      )
      setBusy(false)
    }, 30)
  }, [project, assets, onPageCount, setPageNo, recordPagination])

  useEffect(() => {
    void loadFontFamily(project.settings.typography.fontFamily)
  }, [project.settings.typography.fontFamily])

  useEffect(() => {
    // debounce: settings sliders would otherwise re-paginate on every pixel
    const t = window.setTimeout(repaginate, 1500)
    return () => window.clearTimeout(t)
  }, [repaginate])

  const openPrintWindow = () => {
    void downloadBlob(new Blob(['<!doctype html><title>The Writers Companion</title>'], { type: 'text/html' }), 'placeholder.html')
  }
  void openPrintWindow

  const doPrintPdf = async () => {
    if (!pagination) return
    await flushNow()
    if (!canOpenPrintWindow()) {
      window.alert(
        'Printing the interior PDF needs a desktop browser.\n\nYour layout is saved with the book: open this book on a computer and press Interior PDF there. On this device you can still export EPUB, DOCX and Markdown from the Export tab.',
      )
      return
    }
    const { openPrintWindow: openWindow } = await import('../print/printWindow')
    const assetsMap = Object.fromEntries(assets.map((a) => [a.id, a.dataUrl]))
    openWindow(project, pagination, assetsMap)
  }

  const page = pagination?.pages[pageNo - 1]
  const worst = worstLevel(checks)
  const preset = TRIM_PRESETS.find((t) => t.id === project.settings.trim.preset)

  // ── index builder: collect ✦-marked terms with their real folios ──────────
  const buildIndex = () => {
    if (!pagination) return
    const terms = new Map<string, Set<string>>()
    const folio = (p: import('../layout/paginate').Page) =>
      p.folio == null ? '' : p.folioType === 'roman' ? String(p.folio) : String(p.folio)
    for (const p of pagination.pages) {
      for (const it of p.items) {
        if (!it.html) continue
        const rx = /data-ix="([^"]+)"/g
        let m: RegExpExecArray | null
        while ((m = rx.exec(it.html))) {
          const term = m[1].trim()
          if (!term) continue
          const f = folio(p)
          if (!f) continue
          if (!terms.has(term)) terms.set(term, new Set())
          terms.get(term)!.add(f)
        }
      }
    }
    if (!terms.size) {
      alert('No index terms marked yet. In Write, select a word and press ✦ to add it to the index.')
      return
    }
    const sorted = [...terms.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    const content = sorted.map(([term, pagesSet]) => ({
      type: 'paragraph' as const,
      content: [{ type: 'text' as const, text: `${cap(term)} — ${[...pagesSet].join(', ')}` }],
    }))
    const indexBlock = project.doc.blocks.find((b) => b.kind === 'index')
    if (indexBlock) {
      updateDocIndex(indexBlock.sceneIds[0], content)
      alert(`Index rebuilt: ${sorted.length} term${sorted.length === 1 ? '' : 's'}.`)
    } else {
      addIndexBlock(content)
      alert(`Index created with ${sorted.length} term${sorted.length === 1 ? '' : 's'} (back matter).`)
    }
  }
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  const updateDocIndex = (sceneId: string, content: PMNode[]) => {
    updateDoc((d) => ({ ...d, scenes: { ...d.scenes, [sceneId]: content } }), { snapshot: 'Index rebuilt', snapshotBefore: true })
  }
  const addIndexBlock = (content: PMNode[]) => {
    const sid = 'sc_index_' + Math.random().toString(36).slice(2, 8)
    const bid = 'blk_index_' + Math.random().toString(36).slice(2, 8)
    updateDoc((d) => ({
      ...d,
      blocks: [...d.blocks, { id: bid, type: 'backmatter', kind: 'index', title: 'Index', sceneIds: [sid] }],
      scenes: { ...d.scenes, [sid]: content },
    }), { snapshot: 'Index created', snapshotBefore: true })
  }

  return (
    <div className="print-pane">
      <aside className="settings-col">
        <h3>Print setup</h3>
        <Field label="Layout family">
          <select value={project.settings.layout || 'trade'} onChange={(e) => applyLayout(e.target.value as never)}>
            {LAYOUTS.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.tag}</option>)}
          </select>
        </Field>
        <p className="hint">{layoutById(project.settings.layout || 'trade').blurb}</p>

        <Field label="Trim size">
          <select
            value={project.settings.trim.preset}
            onChange={(e) => {
              const p = TRIM_PRESETS.find((t) => t.id === e.target.value)!
              updateSettings({ trim: { preset: p.id, width: p.w, height: p.h } })
            }}
          >
            {TRIM_PRESETS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </Field>
        {project.settings.trim.preset === 'custom' && (
          <div className="row2">
            <Field label="Width (in)">
              <input type="number" step="0.01" value={project.settings.trim.width} onChange={(e) => updateSettings({ trim: { ...project.settings.trim, width: Number(e.target.value) } })} />
            </Field>
            <Field label="Height (in)">
              <input type="number" step="0.01" value={project.settings.trim.height} onChange={(e) => updateSettings({ trim: { ...project.settings.trim, height: Number(e.target.value) } })} />
            </Field>
          </div>
        )}

        <h4>Margins (inches)</h4>
        <div className="row2">
          <Field label="Top"><NumIn v={project.settings.margins.top} on={(v) => updateSettings({ margins: { ...project.settings.margins, top: v } })} /></Field>
          <Field label="Bottom"><NumIn v={project.settings.margins.bottom} on={(v) => updateSettings({ margins: { ...project.settings.margins, bottom: v } })} /></Field>
          <Field label="Inside"><NumIn v={project.settings.margins.inside} on={(v) => updateSettings({ margins: { ...project.settings.margins, inside: v } })} /></Field>
          <Field label="Outside"><NumIn v={project.settings.margins.outside} on={(v) => updateSettings({ margins: { ...project.settings.margins, outside: v } })} /></Field>
        </div>
        <label className="chk">
          <input type="checkbox" checked={project.settings.margins.autoGutter} onChange={(e) => updateSettings({ margins: { ...project.settings.margins, autoGutter: e.target.checked } })} />
          Auto gutter from page count
        </label>
        {project.settings.margins.autoGutter ? (
          <p className="hint">Gutter {pagination?.gutter ?? kdpGutter(0)}″ for {pagination?.pageCount ?? 0} pages</p>
        ) : (
          <Field label="Gutter override"><NumIn v={project.settings.margins.gutterOverride ?? 0.375} on={(v) => updateSettings({ margins: { ...project.settings.margins, gutterOverride: v } })} /></Field>
        )}

        <h4>Typography</h4>
        <Field label="Font">
          <FontSelect
            value={project.settings.typography.fontFamily}
            onChange={(fontFamily) => updateSettings({ typography: { ...project.settings.typography, fontFamily } })}
            sizePt={project.settings.typography.fontSize}
            onSize={(fontSize) => updateSettings({ typography: { ...project.settings.typography, fontSize } })}
          />
        </Field>
        <div className="row2">
          <Field label="Size (pt)"><NumIn v={project.settings.typography.fontSize} step={0.25} on={(v) => updateSettings({ typography: { ...project.settings.typography, fontSize: v } })} /></Field>
          <Field label="Leading"><NumIn v={project.settings.typography.lineHeight} step={0.05} on={(v) => updateSettings({ typography: { ...project.settings.typography, lineHeight: v } })} /></Field>
          <Field label="Indent (em)"><NumIn v={project.settings.typography.firstLineIndent} step={0.25} on={(v) => updateSettings({ typography: { ...project.settings.typography, firstLineIndent: v } })} /></Field>
          <Field label="Para gap (em)"><NumIn v={project.settings.typography.paragraphSpacing} step={0.1} on={(v) => updateSettings({ typography: { ...project.settings.typography, paragraphSpacing: v } })} /></Field>
        </div>
        <label className="chk"><input type="checkbox" checked={project.settings.typography.justify} onChange={(e) => updateSettings({ typography: { ...project.settings.typography, justify: e.target.checked } })} /> Justified text</label>
        <label className="chk"><input type="checkbox" checked={project.settings.typography.hyphenate} onChange={(e) => updateSettings({ typography: { ...project.settings.typography, hyphenate: e.target.checked } })} /> Hyphenation</label>

        <h4>Chapter openings</h4>
        <label className="chk"><input type="checkbox" checked={project.settings.chapterOpening.rectoStart} onChange={(e) => updateSettings({ chapterOpening: { ...project.settings.chapterOpening, rectoStart: e.target.checked } })} /> Start chapters on recto</label>
        <label className="chk"><input type="checkbox" checked={project.settings.chapterOpening.blankPageBetween} onChange={(e) => updateSettings({ chapterOpening: { ...project.settings.chapterOpening, blankPageBetween: e.target.checked } })} /> Insert a blank page to reach recto</label>
        <label className="chk"><input type="checkbox" checked={project.settings.chapterOpening.startOnNewPage} onChange={(e) => updateSettings({ chapterOpening: { ...project.settings.chapterOpening, startOnNewPage: e.target.checked } })} /> New page per chapter</label>
        <label className="chk"><input type="checkbox" checked={project.settings.chapterOpening.dropCap} onChange={(e) => updateSettings({ chapterOpening: { ...project.settings.chapterOpening, dropCap: e.target.checked } })} /> Drop cap</label>
        <label className="chk"><input type="checkbox" checked={project.settings.chapterOpening.smallCapsFirstLine} onChange={(e) => updateSettings({ chapterOpening: { ...project.settings.chapterOpening, smallCapsFirstLine: e.target.checked } })} /> Small-caps first line</label>
        <Field label="Ornament">
          <select value={project.settings.chapterOpening.ornament} onChange={(e) => updateSettings({ chapterOpening: { ...project.settings.chapterOpening, ornament: e.target.value as 'asterism' } })}>
            <option value="none">None</option>
            <option value="asterism">Asterism ⁂</option>
            <option value="fleuron">Fleuron ❦</option>
            <option value="diamond">Diamond ◆</option>
            <option value="rule">Rule —</option>
          </select>
        </Field>
        <Field label="Chapter numbers">
          <select value={project.settings.chapterOpening.chapterNumbers} onChange={(e) => updateSettings({ chapterOpening: { ...project.settings.chapterOpening, chapterNumbers: e.target.value as 'arabic' } })}>
            <option value="arabic">1, 2, 3</option>
            <option value="words">One, Two, Three</option>
            <option value="none">None</option>
          </select>
        </Field>

        <h4>Running heads &amp; folios</h4>
        <label className="chk"><input type="checkbox" checked={project.settings.runningHeads.enabled} onChange={(e) => updateSettings({ runningHeads: { ...project.settings.runningHeads, enabled: e.target.checked } })} /> Running heads</label>
        <div className="row2">
          <Field label="Verso">
            <select value={project.settings.runningHeads.verso} onChange={(e) => updateSettings({ runningHeads: { ...project.settings.runningHeads, verso: e.target.value as 'bookTitle' } })}>
              <option value="bookTitle">Book title</option><option value="author">Author</option><option value="none">None</option>
            </select>
          </Field>
          <Field label="Recto">
            <select value={project.settings.runningHeads.recto} onChange={(e) => updateSettings({ runningHeads: { ...project.settings.runningHeads, recto: e.target.value as 'chapter' } })}>
              <option value="chapter">Chapter title</option><option value="part">Part title</option><option value="bookTitle">Book title</option><option value="none">None</option>
            </select>
          </Field>
        </div>
        <label className="chk"><input type="checkbox" checked={project.settings.runningHeads.suppressOnChapterOpen} onChange={(e) => updateSettings({ runningHeads: { ...project.settings.runningHeads, suppressOnChapterOpen: e.target.checked } })} /> Suppress on chapter openings</label>
        <label className="chk"><input type="checkbox" checked={project.settings.runningHeads.suppressOnFrontMatter} onChange={(e) => updateSettings({ runningHeads: { ...project.settings.runningHeads, suppressOnFrontMatter: e.target.checked } })} /> Suppress in front/back matter</label>
        <label className="chk"><input type="checkbox" checked={project.settings.folios.enabled} onChange={(e) => updateSettings({ folios: { ...project.settings.folios, enabled: e.target.checked } })} /> Page numbers</label>
        <Field label="Folio position">
          <select value={project.settings.folios.position} onChange={(e) => updateSettings({ folios: { ...project.settings.folios, position: e.target.value as 'bottomCenter' } })}>
            <option value="bottomCenter">Bottom centre</option><option value="bottomOutside">Bottom outside</option><option value="topOutside">Top outside</option>
          </select>
        </Field>
        <label className="chk"><input type="checkbox" checked={project.settings.folios.romanFrontMatter} onChange={(e) => updateSettings({ folios: { ...project.settings.folios, romanFrontMatter: e.target.checked } })} /> Roman numerals in front matter</label>


        <h4>This page · picture</h4>
        {page && <PageArtEditor page={page.index} />}

        <h4>Page graphics</h4>
        <Field label="Artwork treatment">
          <select value={g.mode} onChange={(e) => updateGraphics({ mode: e.target.value as 'off' })}>
            <option value="off">None — text only</option>
            <option value="vignette">Vignette on the page</option>
            <option value="sidebar">Image in a side bar</option>
            <option value="plate">Full-page plates facing chapters</option>
          </select>
        </Field>
        <label className="chk"><input type="checkbox" checked={g.onChapterOpen} onChange={(e) => updateGraphics({ onChapterOpen: e.target.checked })} /> Include chapter-opening pages</label>
        <label className="chk"><input type="checkbox" checked={g.onMatter} onChange={(e) => updateGraphics({ onMatter: e.target.checked })} /> Include front/back matter</label>

        {(g.mode === 'vignette' || g.mode === 'sidebar' || g.mode === 'plate') && (
          <Field label={g.mode === 'plate' ? 'Plate artwork' : 'Artwork'}>
            <input type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              const a = await uploadImage(f)
              if (g.mode === 'plate') updateGraphics({ plateImageId: a.id })
              else if (g.mode === 'sidebar') updateGraphics({ sidebarImageId: a.id })
              else updateGraphics({ vignetteImageId: a.id })
              e.target.value = ''
            }} />
          </Field>
        )}

        {g.mode === 'vignette' && (
          <>
            <Field label="Size (in)"><NumIn v={g.vignetteSize} step={0.1} on={(v) => updateGraphics({ vignetteSize: v })} /></Field>
            <Fader
              label="Visibility (fade)"
              value={g.vignetteOpacity}
              onChange={(v) => updateGraphics({ vignetteOpacity: v })}
              artwork={assetMap[g.vignetteImageId || '']}
            />
            {(() => {
              const a = assets.find((x) => x.id === g.vignetteImageId)
              if (!a) return null
              return (
                <div className="asset-note">
                  <span>{a.name}</span>
                  <span>{a.width} × {a.height}px{a.frames ? ` · ${a.frames} frames` : ''}</span>
                </div>
              )
            })()}
            {assets.find((x) => x.id === g.vignetteImageId)?.frames ? (
              <p className="hint">
                Animated GIF: motion shows in this preview, but a printed PDF holds a single frame and EPUB readers vary.
                Use a still (PNG) for print covers of pages you care about — the image exports unchanged either way.
              </p>
            ) : null}
            <Field label="Position">
              <select value={g.vignettePosition} onChange={(e) => updateGraphics({ vignettePosition: e.target.value as 'top' })}>
                <option value="bottom">Bottom of page</option>
                <option value="top">Top of page</option>
              </select>
            </Field>
            <Field label="Align">
              <select value={g.vignetteAlign} onChange={(e) => updateGraphics({ vignetteAlign: e.target.value as 'center' })}>
                <option value="center">Centred</option>
                <option value="outside">Outer edge</option>
                <option value="inside">Inner edge</option>
              </select>
            </Field>
            <Field label="Every N pages"><NumIn v={g.vignetteEvery} step={1} on={(v) => updateGraphics({ vignetteEvery: Math.max(1, Math.round(v)) })} /></Field>
          </>
        )}

        {g.mode === 'sidebar' && (
          <>
            <Field label={`Side bar width — ${Math.round(g.sidebarWidth * 100)}% of text block`}>
              <input type="range" min={20} max={45} step={1} value={Math.round(g.sidebarWidth * 100)} onChange={(e) => updateGraphics({ sidebarWidth: Number(e.target.value) / 100 })} />
            </Field>
            <Field label="Side">
              <select value={g.sidebarSide} onChange={(e) => updateGraphics({ sidebarSide: e.target.value as 'outside' })}>
                <option value="alternate">Outer edge, mirrored</option>
                <option value="outside">Outer edge, same side</option>
                <option value="inside">Inner edge (gutter side)</option>
              </select>
            </Field>
            <label className="chk"><input type="checkbox" checked={g.sidebarFrame} onChange={(e) => updateGraphics({ sidebarFrame: e.target.checked })} /> Rule frame around the image</label>
            <Fader
              label="Image visibility"
              value={g.sidebarOpacity ?? 1}
              onChange={(v) => updateGraphics({ sidebarOpacity: v })}
              artwork={assetMap[g.sidebarImageId || '']}
            />
            <p className="hint">The text column narrows on bar pages, so more pages are produced — the preview repaginates as you change this.</p>
          </>
        )}

        {g.mode === 'plate' && (
          <label className="chk"><input type="checkbox" checked={g.plateCaption} onChange={(e) => updateGraphics({ plateCaption: e.target.checked })} /> Caption the plate with the chapter title</label>
        )}

        <Field label="Decorative border">
          <select value={g.border} onChange={(e) => updateGraphics({ border: e.target.value as 'none' })}>
            <option value="none">None</option>
            <option value="rule">Single rule box</option>
            <option value="double">Double rule box</option>
            <option value="ornament">Rule box with fleuron</option>
          </select>
        </Field>

        <h4>Index</h4>
        <button className="btn tiny ghost wide" onClick={buildIndex} disabled={!pagination} title="Collects every ✦-marked term from the manuscript and writes an alphabetical Index into the back matter, with the real page numbers from this layout.">
          ✦ Build index from marked terms
        </button>
        <p className="hint">Mark terms in Write with the ✦ toolbar button. Rebuild after layout changes so folios stay true.</p>

        <h4>Contents &amp; notes</h4>
        <label className="chk"><input type="checkbox" checked={project.settings.toc.enabled} onChange={(e) => updateSettings({ toc: { ...project.settings.toc, enabled: e.target.checked } })} /> Auto table of contents</label>
        <label className="chk"><input type="checkbox" checked={project.settings.toc.leaderDots} onChange={(e) => updateSettings({ toc: { ...project.settings.toc, leaderDots: e.target.checked } })} /> Leader dots</label>
        <label className="chk"><input type="checkbox" checked={project.settings.toc.includeFrontMatter} onChange={(e) => updateSettings({ toc: { ...project.settings.toc, includeFrontMatter: e.target.checked } })} /> Include front matter in TOC</label>
        <Field label="Contents depth">
          <select value={project.settings.toc.depth} onChange={(e) => updateSettings({ toc: { ...project.settings.toc, depth: e.target.value as 'chapters' | 'sections' } })}>
            <option value="chapters">Chapters and parts</option>
            <option value="sections">Down to section headings</option>
          </select>
        </Field>
        <Field label="Footnotes">
          <select value={project.settings.footnoteMode} onChange={(e) => updateSettings({ footnoteMode: e.target.value as 'page' })}>
            <option value="page">Bottom of page</option>
            <option value="end">Endnotes at back</option>
          </select>
        </Field>

        <h4>Bleed &amp; marks</h4>
        <label className="chk"><input type="checkbox" checked={project.settings.bleed} onChange={(e) => updateSettings({ bleed: e.target.checked })} /> Include bleed</label>
        <label className="chk"><input type="checkbox" checked={project.settings.cropMarks} onChange={(e) => updateSettings({ cropMarks: e.target.checked })} /> Crop marks</label>
        <Field label="Bleed (in)"><NumIn v={project.settings.bleedSize} step={0.01} on={(v) => updateSettings({ bleedSize: v })} /></Field>

        <h4>Metadata</h4>
        <Field label="Title"><input value={project.meta.title} onChange={(e) => updateMeta({ title: e.target.value })} /></Field>
        <Field label="Subtitle"><input value={project.meta.subtitle} onChange={(e) => updateMeta({ subtitle: e.target.value })} /></Field>
        <Field label="Author"><input value={project.meta.author} onChange={(e) => updateMeta({ author: e.target.value })} /></Field>
        <div className="row2">
          <Field label="ISBN"><input value={project.meta.isbn} onChange={(e) => updateMeta({ isbn: e.target.value })} /></Field>
          <Field label="Year"><input value={project.meta.copyrightYear} onChange={(e) => updateMeta({ copyrightYear: e.target.value })} /></Field>
        </div>
        <Field label="Publisher"><input value={project.meta.publisher} onChange={(e) => updateMeta({ publisher: e.target.value })} /></Field>
      </aside>

      <main className="preview-col">
        <div className="preview-toolbar">
          <div className="pt-left">
            <button className="btn tiny ghost" onClick={repaginate} disabled={busy}>{busy ? 'Paginating…' : '↻ Re-paginate'}</button>
            <span className="muted small">
              {pagination ? `${pagination.pageCount} pages · ${preset?.label} · gutter ${pagination.gutter}″` : 'Paginating…'}
            </span>
          </div>
          <div className="pt-right">
            <label className="chk inline"><input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} /> Guides</label>
            <label className="chk inline"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> All pages</label>
            <div className="zoom">
              <button className="icon-btn" onClick={() => setZoom((z) => Math.max(0.3, +(z - 0.1).toFixed(2)))}>−</button>
              <span>{Math.round(zoom * 100)}%</span>
              <button className="icon-btn" onClick={() => setZoom((z) => Math.min(1.5, +(z + 0.1).toFixed(2)))}>+</button>
            </div>
            <button className="btn tiny primary" onClick={() => void doPrintPdf()} disabled={!pagination}>⤓ Interior PDF</button>
          </div>
        </div>

        {!showAll && (
          <div className="page-nav">
            <button className="btn tiny ghost" onClick={() => setPageNo((p) => Math.max(1, p - 2))} disabled={pageNo <= 1}>‹ prev spread</button>
            <span>
              {page && `${page.side} · page ${page.index}${page.folioType ? ` (folio ${page.folioType === 'roman' ? 'roman' : ''} ${page.folio ?? '—'})` : ''} · ${page.type}`}
            </span>
            <button className="btn tiny ghost" onClick={() => setPageNo((p) => Math.min(pagination?.pageCount || 1, p + 1))}>next ›</button>
          </div>
        )}

        <div className="preview-scroll">
          {pagination && !showAll && page && (
            <div className="spread" style={{ transform: `scale(${zoom})` }}>
              <PageSlot p={pagination.pages[pageNo - 2]} project={project} pagination={pagination} guides={guides} />
              <PageSlot p={page} project={project} pagination={pagination} guides={guides} />
            </div>
          )}
          {pagination && showAll && (
            <div className="all-pages-wrap">
            <div className="all-pages">
              {pagination.pages.map((p) => (
                <div key={p.index} className="thumb" style={{ width: 'fit-content', margin: '0 auto' }} onClick={() => { setShowAll(false); setPageNo(p.index) }}>
                  <PageSlot p={p} project={project} pagination={pagination} guides={false} />
                  <span className="thumb-no">{p.index}</span>
                </div>
              ))}
            </div>
            </div>
          )}
        </div>
      </main>

      <aside className="checks-col">
        <h3>
          KDP readiness{' '}
          <span className={'pill ' + worst}>{worst === 'pass' ? 'Ready' : worst === 'warn' ? 'Warnings' : 'Blocked'}</span>
        </h3>
        <div className="check-list">
          {checks.map((c) => (
            <div key={c.id} className={'check ' + c.level}>
              <div className="check-icon">{c.level === 'pass' ? '✓' : c.level === 'warn' ? '!' : c.level === 'error' ? '✕' : 'i'}</div>
              <div>
                <div className="check-title">{c.title}</div>
                <div className="check-detail">{c.detail}</div>
                {c.fix && <div className="check-fix">Fix: {c.fix}</div>}
              </div>
            </div>
          ))}
        </div>
        <div className="export-block">
          <h4>Export</h4>
          <button className="btn primary wide" onClick={() => void doPrintPdf()} disabled={!pagination}>
            ⤓ {canOpenPrintWindow() ? 'Print interior PDF' : 'Interior PDF (needs a desktop)'}
          </button>
          {!canOpenPrintWindow() && (
            <p className="hint">
              This device cannot print to PDF. The layout is saved with the book — open it on a computer and export the interior there.
            </p>
          )}
          <p className="hint">Opens a print window — choose “Save as PDF”, paper size = trim ({project.settings.trim.width}″ × {project.settings.trim.height}″), margins None, background graphics ON. Page boxes are already exact, so the PDF matches this preview.</p>
          <button className="btn ghost wide" onClick={() => void exportJson(project)}>⤓ Project backup (.json)</button>
          <span className="hint">Files are saved with “{saveVerb()}”.</span>
          <button className="btn ghost wide" onClick={async () => {
            const { exportDocx } = await import('../io/docx')
            downloadBlob(await exportDocx(project), safeName(project.meta.title) + '.docx')
          }}>⤓ Manuscript .docx</button>
          <button className="btn ghost wide" onClick={async () => {
            const { docToMarkdown } = await import('../io/markdown')
            downloadBlob(new Blob([docToMarkdown(project.doc)], { type: 'text/markdown' }), safeName(project.meta.title) + '.md')
          }}>⤓ Manuscript .md</button>
        </div>
      </aside>
    </div>
  )
}

function PageSlot({ p, project, pagination, guides }: { p?: import('../layout/paginate').Page; project: ReturnType<typeof useProject>['project']; pagination: PaginationResult; guides: boolean }) {
  const { assetMap, updateSettings } = useProject()
  const slotRef = useRef<HTMLDivElement>(null)
  if (!p) return <div className="page-slot empty" />

  // Drag-to-place: when this page has art, dragging on the page moves the
  // picture on the active layer; the sliders stay as the fine control.
  const artKey = artKeyFor(p.index, pagination.anchors)
  const art = artForPage(project.settings.pageArt, p.index, pagination.anchors)
  const dragLayer = art?.below.imageId ? 'below' : art?.text.imageId ? 'text' : art?.above.imageId ? 'above' : null

  const onPointerDown = (e: React.PointerEvent) => {
    if (!dragLayer || !art || !e.altKey) return
    e.preventDefault()
    const el = slotRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const move = (ev: PointerEvent) => {
      const x = Math.max(0, Math.min(100, ((ev.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((ev.clientY - rect.top) / rect.height) * 100))
      updateSettings({
        pageArt: {
          ...(project.settings.pageArt || {}),
          [artKey]: { ...art, [dragLayer]: { ...art[dragLayer], x: Math.round(x), y: Math.round(y) } },
        },
      })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  return (
    <div
      className={'page-slot' + (dragLayer ? ' has-art' : '')}
      ref={slotRef}
      onPointerDown={onPointerDown}
      title={dragLayer ? 'Alt-drag to move the picture on this page' : undefined}
    >
      <BookPage page={p} project={project} pagination={pagination} guides={guides} assets={assetMap} />
    </div>
  )
}

/**
 * Fader: a horizontal slider whose track shows the artwork fading from
 * transparent to solid, so the control looks like what it changes.
 */
export function Fader({ label, value, onChange, artwork, min = 0.05, max = 1, step = 0.01 }: {
  label: string
  value: number
  onChange: (v: number) => void
  /** optional thumbnail shown in the track preview */
  artwork?: string
  min?: number
  max?: number
  step?: number
}) {
  const pct = Math.round(((value - min) / (max - min)) * 100)
  return (
    <div className="fader">
      <div className="fader-head">
        <span>{label}</span>
        <span className="fader-val">{Math.round(value * 100)}%</span>
      </div>
      <div
        className="fader-track"
        style={{
          backgroundImage: artwork
            ? `linear-gradient(90deg, #fff 0%, rgba(255,255,255,0) 55%), url(${JSON.stringify(artwork)})`
            : 'linear-gradient(90deg, #fff, #8a5a2b)',
          backgroundSize: artwork ? 'cover, cover' : 'auto',
          backgroundPosition: 'center, center',
          backgroundBlendMode: artwork ? 'normal' : undefined,
        }}
      >
        <div className="fader-ink" style={{ width: `${pct}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={label}
        />
      </div>
      <div className="fader-scale"><span>faint</span><span>solid</span></div>
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

/**
 * A number field that commits on Enter as well as on blur.
 *
 * Blur alone loses a value when the user types a margin and then clicks
 * "Interior PDF": the click fires before blur is observed by the export, so the
 * old value went into the PDF. Enter commits, Escape reverts, and the field
 * shows a draft until it commits so the caret is never fought.
 */
function NumIn({ v, on, step = 0.05 }: { v: number; on: (n: number) => void; step?: number }) {
  const [val, setVal] = useState(String(v))
  useEffect(() => setVal(String(v)), [v])
  const commit = () => {
    const n = Number(val)
    if (val.trim() !== '' && !Number.isNaN(n) && n > 0) on(n)
    else setVal(String(v))
  }
  return (
    <input
      type="number"
      step={step}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          commit()
          ;(e.currentTarget as HTMLInputElement).blur()
        } else if (e.key === 'Escape') {
          setVal(String(v))
          ;(e.currentTarget as HTMLInputElement).blur()
        }
      }}
    />
  )
}

async function exportJson(project: ReturnType<typeof useProject>['project']) {
  const { db } = await import('../db/db')
  const assets = await db.assets.where('projectId').equals(project.id).toArray()
  const notes = await db.notes.where('projectId').equals(project.id).toArray()
  const snapshots = await db.snapshots.where('projectId').equals(project.id).toArray()
  downloadBlob(
    new Blob([JSON.stringify({ project, assets, notes, snapshots, exportedAt: Date.now() }, null, 2)], { type: 'application/json' }),
    safeName(project.meta.title) + '.writerscompanion.json',
  )
}

export function usePrintActions() {
  const { project } = useProject()
  const isbn = useMemo(() => project.meta.isbn, [project])
  return { isbn }
}
