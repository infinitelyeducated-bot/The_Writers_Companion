import { useRef, useState } from 'react'
import { useProject } from '../state/project'
import { buildEpub } from '../export/epub'
import { downloadBlob } from '../util/download'
import { importFile } from '../io/import'
import { docToMarkdown } from '../io/markdown'
import { exportDocx } from '../io/docx'
import { safeName } from '../export/epub'
import type { BookDoc } from '../model/types'
import { totalWords } from '../model/docUtils'
import { PageArtEditor } from './PageArtEditor'
import { retailerDestinations, storageDestinations, type Destination } from '../export/destinations'

export function ExportPane({ pageCount, onGoPrint }: { pageCount: number; onGoPrint: () => void }) {
  const { project, assets, uploadImage, updateSettings, replaceDoc, flushNow } = useProject()
  const [log, setLog] = useState<string[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [artPage, setArtPage] = useState(1)
  const fileRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const c = project.settings.cover
  const add = (s: string) => setLog((l) => [`${new Date().toLocaleTimeString()}  ${s}`, ...l].slice(0, 40))

  const doEpub = async () => {
    await flushNow()
    setBusy('epub')
    try {
      const res = await buildEpub(project, assets)
      downloadBlob(res.blob, res.fileName)
      add(`EPUB built: ${res.fileName} (${res.files} files, ${(res.blob.size / 1024).toFixed(0)} KB)`)
      res.issues.forEach((i) => add('Note: ' + i))
    } catch (e) {
      add('EPUB failed: ' + (e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const doDocx = async () => {
    await flushNow()
    setBusy('docx')
    try {
      const blob = await exportDocx(project)
      downloadBlob(blob, safeName(project.meta.title) + '.docx')
      add(`DOCX exported (${(blob.size / 1024).toFixed(0)} KB)`)
    } finally {
      setBusy(null)
    }
  }

  const doMd = () => {
    downloadBlob(new Blob([docToMarkdown(project.doc)], { type: 'text/markdown' }), safeName(project.meta.title) + '.md')
    add('Markdown exported')
  }

  const doImport = async (f: File) => {
    setBusy('import')
    try {
      const res = await importFile(f)
      if (!confirm(`Import “${f.name}”?\n\nFound ${res.report.chapters} chapters, ${res.report.parts} parts, ${res.report.words.toLocaleString()} words, repaired ${res.report.repairedParagraphs} broken paragraph(s).\n\nThis replaces the current manuscript (a snapshot is taken first).`)) {
        setBusy(null)
        return
      }
      for (const img of res.images) {
        const blob = await (await fetch(img.dataUrl)).blob()
        const file = new File([blob], img.name, { type: img.mime })
        const asset = await uploadImage(file)
        // point image nodes with __src at this asset
        const remap = (nodes: BookDoc['scenes'][string]): BookDoc['scenes'][string] =>
          nodes.map((n) => {
            if (n.type === 'image' && (n as unknown as { __src?: string }).__src === img.dataUrl) {
              return { type: 'image' as const, attrs: { imageId: asset.id, alt: img.name } }
            }
            if ('content' in n && n.content) return { ...n, content: remap(n.content as BookDoc['scenes'][string]) } as (typeof nodes)[number]
            return n
          })
        for (const sid of Object.keys(res.doc.scenes)) res.doc.scenes[sid] = remap(res.doc.scenes[sid])
      }
      replaceDoc(res.doc, 'Imported: ' + f.name, { snapshotBefore: true })
      add(`Imported ${f.name}: ${res.report.chapters} chapters, ${res.report.repairedParagraphs} paragraphs repaired, ${res.images.length} images.`)
    } catch (e) {
      add('Import failed: ' + (e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const words = totalWords(project.doc)

  return (
    <div className="export-pane">
      <div className="export-typebar">
        <h4>This page · picture</h4>
        <label className="field">
          <span>Page</span>
          <input type="number" min={1} max={Math.max(1, pageCount)} value={artPage} onChange={(e) => setArtPage(Number(e.target.value) || 1)} />
        </label>
        <PageArtEditor page={artPage} />
      </div>
      <div className="export-grid">
        <section className="export-card">
          <h3>Manuscript</h3>
          <p className="muted small">Round-trip your text. Heading levels map back to chapters and sections; smart typography is preserved.</p>
          <div className="btn-row">
            <button className="btn primary" disabled={busy !== null} onClick={() => void doDocx()}>⤓ Export .docx</button>
            <button className="btn ghost" disabled={busy !== null} onClick={doMd}>⤓ Export .md</button>
            <button className="btn ghost" disabled={busy !== null} onClick={() => fileRef.current?.click()}>⤒ Import .docx / .md / .txt</button>
          </div>
          <input ref={fileRef} type="file" accept=".docx,.md,.markdown,.txt,.html" hidden onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void doImport(f)
            e.target.value = ''
          }} />
          <p className="hint">{words.toLocaleString()} words · {project.doc.blocks.filter((b) => b.type === 'chapter').length} chapters · {project.doc.blocks.filter((b) => b.type === 'part').length} parts</p>
        </section>

        <section className="export-card">
          <h3>Print interior</h3>
          <p className="muted small">{pageCount} pages at {project.settings.trim.width}″ × {project.settings.trim.height}″. PDF is generated from the same page boxes as the preview.</p>
          <div className="btn-row">
            <button className="btn primary" onClick={onGoPrint}>Open print preview &amp; export PDF</button>
          </div>
        </section>

        <section className="export-card">
          <h3>EPUB 3</h3>
          <p className="muted small">Metadata, cover, nav + NCX, front matter, images and endnotes. Built to pass EPUBCheck.</p>
          <label className="chk"><input type="checkbox" checked={project.settings.epub.includeCover} onChange={(e) => updateSettings({ epub: { ...project.settings.epub, includeCover: e.target.checked } })} /> Include cover</label>
          <label className="chk"><input type="checkbox" checked={project.settings.epub.endnotes} onChange={(e) => updateSettings({ epub: { ...project.settings.epub, endnotes: e.target.checked } })} /> Collect footnotes as endnotes</label>
          <label className="chk" title="Packs the book's Google Fonts into the EPUB as woff2 so hieroglyphs, runes and storybook faces survive in e-readers. Needs network at export; capped at 8 MB.">
            <input type="checkbox" checked={!!project.settings.epub.embedFonts} onChange={(e) => updateSettings({ epub: { ...project.settings.epub, embedFonts: e.target.checked } })} /> Embed webfonts (hieroglyphs &amp; display faces)
          </label>
          <div className="btn-row">
            <button className="btn primary" disabled={busy !== null} onClick={() => void doEpub()}>{busy === 'epub' ? 'Building…' : '⤓ Export EPUB 3'}</button>
          </div>
          <p className="hint">Cover source: {c.coverImageId ? 'uploaded cover art' : 'generated SVG from cover settings'}.</p>
          <label className="field">
            <span>Upload ebook cover (1600 × 2560 recommended)</span>
            <input ref={coverRef} type="file" accept="image/*" onChange={async (e) => {
              const f = e.target.files?.[0]
              if (f) {
                const a = await uploadImage(f)
                updateSettings({ cover: { ...c, coverImageId: a.id } })
                add('Cover art set: ' + a.name)
              }
            }} />
          </label>
        </section>

        <section className="export-card">
          <h3>Project file</h3>
          <p className="muted small">
            Your work lives in this browser’s storage on this machine — <b>not</b> inside the
            The Writers Companion .html file. To keep a safe copy or carry a book to another computer, save
            a JSON backup and restore it from the library.
          </p>
          <div className="btn-row">
            <button className="btn ghost" onClick={async () => {
              const { db } = await import('../db/db')
              const assetsDb = await db.assets.where('projectId').equals(project.id).toArray()
              const notes = await db.notes.where('projectId').equals(project.id).toArray()
              const snapshots = await db.snapshots.where('projectId').equals(project.id).toArray()
              downloadBlob(new Blob([JSON.stringify({ project, assets: assetsDb, notes, snapshots }, null, 2)], { type: 'application/json' }), safeName(project.meta.title) + '.writerscompanion.json')
              add('Project backup saved')
            }}>⤓ Backup project (.json)</button>
            <button className="btn ghost" onClick={async () => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.json,application/json'
              input.onchange = async () => {
                const f = input.files?.[0]
                if (!f) return
                const { readBackupFile, restoreBackup } = await import('../db/db')
                const check = await readBackupFile(f)
                if (!check.ok) {
                  add('Restore failed: ' + check.error)
                  return
                }
                const title = check.backup.project.meta.title || 'Untitled Book'
                if (!confirm(`Restore “${title}” from this backup?\n\nIts current copy in this browser is replaced by the backup, including notes, snapshots and images.`)) return
                await flushNow()
                try {
                  await restoreBackup(check.backup)
                  add(`Restored “${title}” from ${f.name}.`)
                  location.hash = '#/p/' + check.backup.project.id
                } catch (e) {
                  add('Restore failed: ' + (e as Error).message)
                }
              }
              input.click()
            }}>⤒ Restore from backup…</button>
          </div>
        </section>
        <section className="export-card export-dest">
          <h3>Send to storage</h3>
          <p className="muted small">
            Your book never leaves this machine on its own. Export first, then open a
            service — the right file is one drag away.
          </p>
          <div className="dest-list">
            {storageDestinations().map((d) => (
              <DestRow key={d.id} d={d} onOpen={() => add(`Opened ${d.name} — drag the exported file in.`)} />
            ))}
          </div>
        </section>

        <section className="export-card export-dest">
          <h3>Publish to retailers</h3>
          <p className="muted small">
            The big ebook and print-on-demand portals, each labelled with the file it
            wants. Export that file above, then upload it on their page.
          </p>
          <div className="dest-list">
            {retailerDestinations().map((d) => (
              <DestRow key={d.id} d={d} onOpen={() => add(`Opened ${d.name} — upload the ${d.wants} there.`)} />
            ))}
          </div>
          <p className="hint">
            Each store has its own account, pricing and review steps; The Writers Companion’s job ends
            at a file that passes their checks. Run the KDP readiness panel (Print layout)
            before uploading print files.
          </p>
        </section>
      </div>

      <section className="export-log">
        <h4>Activity</h4>
        {log.length === 0 && <p className="muted small">Exports and imports will be logged here.</p>}
        {log.map((l, i) => <div key={i} className="log-line">{l}</div>)}
      </section>
    </div>
  )
}

function DestRow({ d, onOpen }: { d: Destination; onOpen: () => void }) {
  return (
    <div className="dest-row" title={d.note}>
      <div className="dest-main">
        <span className="dest-name">{d.name}</span>
        <span className="dest-wants">{d.wants}</span>
      </div>
      <span className="dest-note">{d.note}</span>
      <button
        type="button"
        className="btn tiny ghost"
        onClick={() => {
          window.open(d.url, '_blank', 'noopener')
          onOpen()
        }}
      >
        Open ↗
      </button>
    </div>
  )
}
