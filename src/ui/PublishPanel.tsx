import { useMemo, useState } from 'react'
import { useProject } from '../state/project'
import { RETAILERS, buildPublishPackage, listingText, readiness } from '../export/publish'
import { saveAs } from '../util/saveAs'

const ICON = { ok: '✓', warn: '!', error: '✕' } as const

/** Prepare a ready-to-upload package for the big retailers. */
export function PublishPanel({ pageCount, log }: { pageCount: number; log: (s: string) => void }) {
  const { project, assets, flushNow } = useProject()
  const [picked, setPicked] = useState<string[]>(['kdp'])
  const [docx, setDocx] = useState(true)
  const [md, setMd] = useState(false)
  const [backup, setBackup] = useState(false)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const ctx = { project, assets, pageCount }
  const ready = useMemo(() => readiness(ctx), [project, assets, pageCount])
  const errors = ready.filter((r) => r.level === 'error').length
  const warns = ready.filter((r) => r.level === 'warn').length

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const build = async () => {
    if (!picked.length) return
    if (errors && !confirm(`${errors} item${errors === 1 ? '' : 's'} marked ✕ should be fixed before you upload. Build the package anyway?`)) return
    await flushNow()
    setBusy(true)
    try {
      const res = await buildPublishPackage(ctx, { retailers: picked, includeDocx: docx, includeMarkdown: md, includeBackup: backup })
      const r = await saveAs(res.blob, res.fileName, 'Publishing package (zip)')
      log(r.saved ? `Publishing package saved: ${r.name || res.fileName} (${res.files.length} files, ${(res.blob.size / 1024).toFixed(0)} KB) for ${picked.length} store${picked.length === 1 ? '' : 's'}` : 'Publishing package cancelled')
      res.notes.forEach((n) => log('Note: ' + n))
    } catch (e) {
      log('Publishing package failed: ' + (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="export-card export-dest publish-card">
      <h3>Publishing package</h3>
      <p className="muted small">
        No store accepts uploads from other software, and this app never holds your account login. So it builds the
        next best thing: the files each store wants, the listing details in the order its form asks for them (ready to
        paste), and a checklist. You then upload on the store’s own page.
      </p>

      <div className="pub-ready" aria-label="Readiness">
        <strong>
          Readiness: {errors ? `${errors} to fix` : 'nothing blocking'}
          {warns ? ` · ${warns} to check` : ''}
        </strong>
        {ready.map((r, i) => (
          <div key={i} className={'pub-line pub-' + r.level} title={r.detail}>
            <span className="pub-icon">{ICON[r.level]}</span>
            <span><b>{r.title}</b> <span className="muted">{r.detail}</span></span>
          </div>
        ))}
      </div>

      <h4 className="pub-sub">Stores</h4>
      <div className="pub-stores">
        {RETAILERS.map((r) => (
          <label key={r.id} className="chk pub-store">
            <input type="checkbox" checked={picked.includes(r.id)} onChange={() => toggle(r.id)} /> {r.name}
            <span className="muted small"> {r.ebook && r.print ? 'ebook + print' : r.ebook ? 'ebook' : 'print'}</span>
          </label>
        ))}
      </div>
      <div className="btn-row">
        <button className="btn tiny ghost" onClick={() => setPicked(RETAILERS.map((r) => r.id))}>Select all</button>
        <button className="btn tiny ghost" onClick={() => setPicked([])}>Clear</button>
      </div>

      <h4 className="pub-sub">Also include</h4>
      <label className="chk"><input type="checkbox" checked={docx} onChange={(e) => setDocx(e.target.checked)} /> Word .docx (for stores that take it)</label>
      <label className="chk"><input type="checkbox" checked={md} onChange={(e) => setMd(e.target.checked)} /> Markdown .md</label>
      <label className="chk"><input type="checkbox" checked={backup} onChange={(e) => setBackup(e.target.checked)} /> Project backup .json</label>

      <div className="btn-row">
        <button className="btn primary" disabled={busy || !picked.length} onClick={() => void build()}>
          {busy ? 'Building…' : `⤓ Build package (${picked.length} store${picked.length === 1 ? '' : 's'})`}
        </button>
        <select className="pub-preview-select" value={preview || ''} onChange={(e) => setPreview(e.target.value || null)} aria-label="Preview listing details">
          <option value="">Preview listing details…</option>
          {RETAILERS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
      {preview && (
        <>
          <pre className="pub-listing">{listingText(ctx, RETAILERS.find((r) => r.id === preview)!)}</pre>
          <div className="btn-row">
            <button className="btn tiny ghost" onClick={() => void navigator.clipboard?.writeText(listingText(ctx, RETAILERS.find((r) => r.id === preview)!)).then(() => log('Listing details copied'))}>Copy</button>
            <button className="btn tiny ghost" onClick={() => setPreview(null)}>Close preview</button>
          </div>
        </>
      )}
      <p className="hint">
        The zip holds /ebook (EPUB and cover image), /manuscript, /listings (one text file per store plus book-metadata.json and .csv)
        and README-publishing.txt. Paperback interior and cover PDFs come from the Print layout and Cover tabs.
      </p>
    </section>
  )
}
