import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, saveProject } from '../db/db'
import { TRIM_PRESETS, type Project } from '../model/types'
import { EXAMPLES, buildBlank, buildExample } from '../data/examples'
import { LAYOUTS, layoutById } from '../data/layouts'
import { AppSnapshotsDialog } from './AppSnapshotsDialog'
import { saveAs } from '../util/saveAs'
import { buildLibraryBackup, readLibraryFile, restoreLibraryBackup } from '../db/db'
import type { LayoutFamily } from '../model/types'
import { totalWords } from '../model/docUtils'
import { GuideModal } from './GuideModal'
import { MenuFontPicker, useMenuFont } from './menuFont'
import { FontSelect } from '../fonts/FontSelect'
import { SkinPicker } from './SkinPicker'

export function coverColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
  const palette = ['#1d2b3a', '#3b2f2f', '#22352b', '#3a2233', '#2b2b40', '#4a3728', '#1f3a3d', '#402b1e']
  return palette[h % palette.length]
}

export function Library({ onOpen }: { onOpen: (id: string) => void }) {
  const projects = useLiveQuery(() => db.projects.orderBy('updatedAt').reverse().toArray(), [], [])
  const [creating, setCreating] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetBusy, setResetBusy] = useState(false)
  const [snapsOpen, setSnapsOpen] = useState(false)
  const libRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState<{ title: string; author: string; genre: string; layout: LayoutFamily }>({ title: '', author: '', genre: '', layout: 'trade' })
  const [seeding, setSeeding] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)
  const [menuFont, setMenuFont] = useMenuFont()
  const [previewFace, setPreviewFace] = useState('Literata')
  const importRef = useRef<HTMLInputElement>(null)
  const restoreRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(
    () =>
      (projects || []).filter((p) =>
        (p.meta.title + ' ' + p.meta.author + ' ' + p.meta.genre).toLowerCase().includes(query.toLowerCase()),
      ),
    [projects, query],
  )

  const create = async () => {
    const p = buildBlank(draft.layout)
    p.meta.title = draft.title.trim() || 'Untitled Book'
    p.meta.author = draft.author.trim() || 'Anonymous'
    if (draft.genre.trim()) p.meta.genre = draft.genre.trim()
    await saveProject(p)
    setCreating(false)
    setDraft({ title: '', author: '', genre: '', layout: 'trade' })
    onOpen(p.id)
  }

  const openExample = async (layoutId: string) => {
    setSeeding(layoutId)
    try {
      const existing = (projects || []).find((p) => p.meta.notes.includes(`[example:${layoutId}]`))
      if (existing) {
        onOpen(existing.id)
        return
      }
      const p = buildExample(layoutId)
      p.meta.notes = `[example:${layoutId}] A worked example of the ${layoutById(layoutId as LayoutFamily).name} layout. Edit freely or duplicate it to start your own.`
      await saveProject(p)
      onOpen(p.id)
    } finally {
      setSeeding(null)
    }
  }

  const remove = async (id: string) => {
    await db.projects.delete(id)
    await db.snapshots.where('projectId').equals(id).delete()
    await db.assets.where('projectId').equals(id).delete()
    await db.notes.where('projectId').equals(id).delete()
    setConfirmDelete(null)
  }

  const duplicate = async (p: Project) => {
    const copy: Project = JSON.parse(JSON.stringify(p))
    const newId = 'proj_' + Math.random().toString(36).slice(2, 10)
    copy.id = newId
    copy.meta.title = p.meta.title + ' (copy)'
    copy.createdAt = Date.now()
    copy.updatedAt = Date.now()
    copy.coverHex = coverColor(copy.id)
    const [assets, notes, snapshots] = await Promise.all([
      db.assets.where('projectId').equals(p.id).toArray(),
      db.notes.where('projectId').equals(p.id).toArray(),
      db.snapshots.where('projectId').equals(p.id).toArray(),
    ])
    await saveProject(copy)
    const remap = (oldId: string) => (oldId ? oldId + '_copy_' + newId.slice(-6) : oldId)
    if (assets.length) {
      await db.assets.bulkAdd(assets.map((a) => ({ ...a, id: remap(a.id), projectId: newId })))
      const g = copy.settings.graphics
      const c = copy.settings.cover
      const rewrite = (id?: string) => (id ? remap(id) : id)
      copy.settings = {
        ...copy.settings,
        graphics: { ...g, vignetteImageId: rewrite(g.vignetteImageId), sidebarImageId: rewrite(g.sidebarImageId), plateImageId: rewrite(g.plateImageId) },
        cover: { ...c, coverImageId: rewrite(c.coverImageId), backImageId: rewrite(c.backImageId) },
      }
      const walk = (nodes: typeof copy.doc.scenes[string]): typeof copy.doc.scenes[string] =>
        nodes.map((n) => {
          if (n.type === 'image') return { ...n, attrs: { ...n.attrs, imageId: remap(n.attrs.imageId) } }
          if ('content' in n && n.content) return { ...n, content: walk(n.content as typeof nodes) } as typeof n
          return n
        })
      const scenes: typeof copy.doc.scenes = {}
      for (const [sid, nodes] of Object.entries(copy.doc.scenes)) scenes[sid] = walk(nodes)
      copy.doc = { ...copy.doc, scenes }
      await saveProject(copy)
    }
    if (notes.length) await db.notes.bulkAdd(notes.map((n) => ({ ...n, id: remap(n.id), projectId: newId })))
    if (snapshots.length) await db.snapshots.bulkAdd(snapshots.map((s) => ({ ...s, id: remap(s.id), projectId: newId })))
  }

  return (
    <div className="library">
      <header className="lib-header">
        <div className="brand">
          <span className="brand-mark">◈</span>
          <div>
            <h1>The Writers Companion</h1>
            <p className="muted">Write · Organise · Print · Publish</p>
          </div>
        </div>
        <div className="lib-actions">
          <input className="search" placeholder="Search library…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <MenuFontPicker value={menuFont} onChange={setMenuFont} />
          <SkinPicker />
          <div className="lib-typebar" title="Search the catalog and copy a sample. Open a book to apply a face to its pages.">
            <FontSelect compact value={previewFace} onChange={setPreviewFace} />
          </div>
          <button className="btn ghost" onClick={() => setGuideOpen(true)} title="Open the built-in user guide">Guide</button>
          <button className="btn ghost" onClick={() => importRef.current?.click()}>Import manuscript…</button>
          <button className="btn ghost" onClick={() => restoreRef.current?.click()} title="Restore a .writerscompanion.json backup">Restore backup…</button>
          <input
            ref={restoreRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              const { readBackupFile, restoreBackup } = await import('../db/db')
              const check = await readBackupFile(f)
              if (!check.ok) {
                window.alert('Restore failed: ' + check.error)
                return
              }
              const title = check.backup.project.meta.title || 'Untitled Book'
              if (!confirm(`Restore “${title}” from ${f.name}?\n\nAny copy of this book already in this browser is replaced, including its notes, snapshots and images.`)) return
              try {
                const restored = await restoreBackup(check.backup)
                onOpen(restored.id)
              } catch (err) {
                window.alert('Restore failed: ' + (err as Error).message)
              }
            }}
          />
          <button className="btn ghost" title="Save every book, note and picture to one file, choosing where it goes" onClick={async () => {
            const lib = await buildLibraryBackup()
            const r = await saveAs(new Blob([JSON.stringify(lib)], { type: 'application/json' }), 'The_Writers_Companion_library_' + new Date().toISOString().slice(0, 10) + '.json', 'Writers Companion whole library')
            if (r.saved) window.alert('Saved ' + (r.name || 'the library') + ' (' + lib.projects.length + ' books).')
          }}>Save library as…</button>
          <button className="btn ghost" title="Restore a whole-library file (replaces every book here)" onClick={() => libRef.current?.click()}>Restore library…</button>
          <input ref={libRef} type="file" accept=".json,application/json" hidden onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            const check = await readLibraryFile(f)
            if (!check.ok) { window.alert('Restore failed: ' + check.error); return }
            if (!confirm('Restore the whole library from ' + f.name + '?\n\nThis REPLACES every book in this browser with the ' + check.backup.projects.length + ' book(s) in the file. A safety snapshot of the current library is taken first.')) return
            try { await restoreLibraryBackup(check.backup); location.hash = ''; location.reload() } catch (err) { window.alert('Restore failed: ' + (err as Error).message) }
          }} />
          <button className="btn ghost" title="Automatic whole-app snapshots, every 5 minutes" onClick={() => setSnapsOpen(true)}>App snapshots…</button>
          <button className="btn primary" onClick={() => setCreating(true)}>+ New book</button>
          <button
            className="btn btn-reset"
            onClick={() => setResetting(true)}
            title="Erase every book, picture, note and setting in this browser and start The Writers Companion over as it was first opened"
          >
            Reset The Writers Companion to default
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".docx,.md,.markdown,.txt,.html"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              const { importFile } = await import('../io/import')
              let res
              try {
                res = await importFile(f)
              } catch (err) {
                window.alert('Could not import ' + f.name + ':\n\n' + (err as Error).message)
                e.target.value = ''
                return
              }
              const ok = window.confirm(
                `Import “${f.name}” as a new book?\n\n` +
                  `Found ${res.report.chapters} chapters, ${res.report.parts} parts, ` +
                  `${res.report.words.toLocaleString()} words, and repaired ` +
                  `${res.report.repairedParagraphs} broken paragraph(s).`,
              )
              if (!ok) {
                e.target.value = ''
                return
              }
              const p = buildBlank('trade')
              p.meta.title = f.name.replace(/\.[^.]+$/, '')
              p.doc = res.doc
              p.coverHex = coverColor(p.id)
              await saveProject(p)
              e.target.value = ''
              onOpen(p.id)
            }}
          />
        </div>
      </header>

      <div className="lib-shelf-head">
        <h2>Layout examples</h2>
        <span className="muted small">Each is a short, complete book set in a different house style — open one to see its page construction, then duplicate it for your own.</span>
      </div>
      <div className="example-strip">
        {EXAMPLES.map((ex) => (
          <div key={ex.id} className="example-card">
            <button
              className="ex-cover"
              style={{ background: layoutById(ex.id as LayoutFamily).cover.background, color: layoutById(ex.id as LayoutFamily).cover.textColor }}
              onClick={() => void openExample(ex.id)}
              title={ex.typicalLength}
            >
              <span>{seeding === ex.id ? 'Opening…' : ex.title}</span>
            </button>
            <div className="ex-body">
              <span className="ex-tag">{ex.tag}</span>
              <span className="ex-name">{ex.name}</span>
              <span className="ex-blurb">{ex.blurb}</span>
              <span className="ex-length" title="A finished book of this kind usually lands here; the app never enforces it.">{ex.typicalLength}</span>
              <span className="ex-author">{ex.author}</span>
              <span className="ex-meta">{ex.title} · {ex.trim}</span>
              <span className="ex-pages" title="A finished book of this kind usually lands here; the app never enforces it.">{ex.typicalPages}</span>
              <button className="btn tiny" onClick={() => void openExample(ex.id)}>Open example</button>
            </div>
          </div>
        ))}
      </div>

      <div className="lib-shelf-head">
        <h2>Your books</h2>
        <span className="muted small">{filtered.length} {filtered.length === 1 ? 'book' : 'books'}</span>
      </div>
      <div className="lib-grid">
        {filtered.map((p) => {
          const words = totalWords(p.doc)
          const trim = TRIM_PRESETS.find((t) => t.id === p.settings.trim.preset)
          return (
            <div key={p.id} className="book-card">
              <button className="book-cover" style={{ background: p.coverHex || '#1d2b3a' }} onClick={() => onOpen(p.id)}>
                <span className="bc-title">{p.meta.title}</span>
                {p.meta.subtitle && <span className="bc-sub">{p.meta.subtitle}</span>}
                <span className="bc-rule" />
                <span className="bc-author">{p.meta.author}</span>
              </button>
              <div className="book-meta">
                <h3>{p.meta.title}</h3>
                <p className="muted">
                  {p.meta.author} · {trim?.label || 'Custom'} · {words.toLocaleString()} words
                </p>
                <p className="muted small">Edited {new Date(p.updatedAt).toLocaleDateString()}</p>
                <div className="card-actions">
                  <button className="btn tiny" onClick={() => onOpen(p.id)}>Open</button>
                  <button className="btn tiny ghost" onClick={() => void duplicate(p)}>Duplicate</button>
                  <button className="btn tiny danger" onClick={() => setConfirmDelete(p.id)}>Delete</button>
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="empty-state">
            <p>No books yet.</p>
            <button className="btn primary" onClick={() => setCreating(true)}>Create your first book</button>
          </div>
        )}
      </div>

      {guideOpen && <GuideModal onClose={() => setGuideOpen(false)} />}

      {resetting && (
        <div className="modal-backdrop" onClick={() => !resetBusy && setResetting(false)}>
          <div
            className="modal modal-reset"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="reset-title"
            aria-describedby="reset-body"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="reset-title">Reset The Writers Companion to default?</h2>
            <div className="modal-body" id="reset-body">
              <p className="reset-warning">
                <strong>This can’t be undone. You’ll lose everything not saved elsewhere.</strong>
              </p>
              <p>
                Every book in this library is erased — manuscripts, pictures, notes and version
                history — along with your settings (skin, menu font, panel positions). The Writers Companion
                then starts over exactly as it was first opened, with the sample books.
              </p>
              <p className="muted small">
                To keep a book, cancel and save a JSON backup first (Export → Backup project).
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" autoFocus disabled={resetBusy} onClick={() => setResetting(false)}>
                Cancel
              </button>
              <button
                className="btn btn-reset"
                disabled={resetBusy}
                onClick={async () => {
                  setResetBusy(true)
                  try {
                    const { resetWritersCompanion } = await import('../resetApp')
                    await resetWritersCompanion()
                  } catch (err) {
                    setResetBusy(false)
                    window.alert('Reset failed: ' + (err as Error).message)
                  }
                }}
              >
                {resetBusy ? 'Erasing…' : 'Erase everything and reset'}
              </button>
            </div>
          </div>
        </div>
      )}

      {snapsOpen && <AppSnapshotsDialog onClose={() => setSnapsOpen(false)} />}

      {creating && (
        <div className="modal-backdrop" onClick={() => setCreating(false)}>
          <div className="modal modal-wide" role="dialog" aria-modal="true" aria-label="New book" onClick={(e) => e.stopPropagation()}>
            <h2>New book</h2>
            <div className="modal-body">
              <label>
                Title
                <input autoFocus value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="The Lighthouse Keeper" />
              </label>
              <label>
                Author
                <input value={draft.author} onChange={(e) => setDraft({ ...draft, author: e.target.value })} placeholder="Your name" />
              </label>
              <label>
                Genre
                <input value={draft.genre} onChange={(e) => setDraft({ ...draft, genre: e.target.value })} placeholder="Literary Fiction" />
              </label>
              <div className="modal-section">Layout family</div>
              <div className="layout-grid">
                {LAYOUTS.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    className={'layout-opt' + (draft.layout === l.id ? ' on' : '')}
                    onClick={() => setDraft({ ...draft, layout: l.id })}
                  >
                    <span className="lo-tag">{l.tag}</span>
                    <span className="lo-name">{l.name}</span>
                    <span className="lo-blurb">{l.blurb}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setCreating(false)}>Cancel</button>
              <button className="btn primary" onClick={() => void create()}>Create book</button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-backdrop" onClick={() => setConfirmDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Delete this book?</h2>
            <div className="modal-body">
              <p className="muted">The project, its snapshots, notes and images will be permanently removed from this browser.</p>
            </div>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="btn danger" onClick={() => void remove(confirmDelete)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function useNow(interval = 10000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), interval)
    return () => window.clearInterval(t)
  }, [interval])
  return now
}
