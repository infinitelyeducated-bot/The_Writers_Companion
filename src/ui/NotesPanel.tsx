import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useProject } from '../state/project'
import { uid, type Note } from '../model/types'
import { artKeyFor, pageForKey } from '../pageArt'

/**
 * Notes & research, opened from the Notes tab beside Picture.
 *
 * Notes can belong to one page, like pictures: "This page" lists the notes
 * saved to the current interior page (stored under the same text anchor as
 * page art, so a note follows its page when the book reflows). "All notes"
 * lists every note in the book, including book-wide ones with no page.
 */
export function NotesPanel({ page }: { page: number }) {
  const { project } = useProject()
  const keys = project.lastPaginated?.keys
  const pageKey = artKeyFor(page, keys)
  const notes = useLiveQuery(() => db.notes.where('projectId').equals(project.id).toArray(), [project.id], [])
  const [scope, setScope] = useState<'page' | 'all'>('page')
  const [selected, setSelected] = useState<string | null>(null)

  // a note saved before anchors existed may still carry a plain page number
  const onThisPage = (n: Note) => n.pageKey === pageKey || n.pageKey === String(page)
  const visible = (notes || []).filter((n) => (scope === 'page' ? onThisPage(n) : true))
  const sorted = [...visible].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.updatedAt - a.updatedAt)
  const current = sorted.find((n) => n.id === selected) || sorted[0]

  const create = async () => {
    const n: Note = {
      id: uid('note'),
      projectId: project.id,
      title: scope === 'page' ? `Page ${page} note` : 'New note',
      body: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pageKey: scope === 'page' ? pageKey : undefined,
    }
    await db.notes.add(n)
    setSelected(n.id)
  }

  const patch = async (id: string, p: Partial<Note>) => {
    await db.notes.update(id, { ...p, updatedAt: Date.now() })
  }

  const pageLabel = (n: Note) => {
    if (!n.pageKey) return 'whole book'
    const p = pageForKey(n.pageKey, keys)
    return p ? `page ${p}` : 'page (re-paginate to locate)'
  }

  return (
    <div className="notes-panel">
      <div className="notes-head">
        <div className="notes-scope" role="tablist" aria-label="Which notes">
          <button
            type="button"
            role="tab"
            className={scope === 'page' ? 'on' : ''}
            onClick={() => setScope('page')}
            title="Notes saved to the interior page you are on. Change page with the navigator in the bottom bar."
          >
            Page {page}
          </button>
          <button
            type="button"
            role="tab"
            className={scope === 'all' ? 'on' : ''}
            onClick={() => setScope('all')}
            title="Every note in this book, including book-wide notes that belong to no page"
          >
            All notes
          </button>
        </div>
        <button
          className="btn tiny primary"
          onClick={() => void create()}
          title={scope === 'page' ? `New note saved to page ${page}` : 'New book-wide note (not tied to a page)'}
        >
          + Note
        </button>
      </div>

      <div className="notes-body">
        <div className="notes-list">
          {sorted.map((n) => (
            <button
              key={n.id}
              type="button"
              className={'note-row' + (current?.id === n.id ? ' active' : '')}
              onClick={() => setSelected(n.id)}
            >
              <span
                className="note-pin"
                title={n.pinned ? 'Unpin' : 'Pin to the top'}
                onClick={(e) => {
                  e.stopPropagation()
                  void patch(n.id, { pinned: !n.pinned })
                }}
              >
                {n.pinned ? '★' : '☆'}
              </span>
              <span className="note-name">{n.title || 'Untitled'}</span>
              {scope === 'all' && <span className="note-where">{pageLabel(n)}</span>}
            </button>
          ))}
          {sorted.length === 0 && (
            <p className="muted small pad">
              {scope === 'page'
                ? `No notes on page ${page} yet. “+ Note” saves one to this page.`
                : 'Keep character sheets, research, timelines and references here.'}
            </p>
          )}
        </div>

        {current && (
          <div className="note-editor">
            <div className="note-toolbar">
              <input
                className="note-title"
                value={current.title}
                onChange={(e) => void patch(current.id, { title: e.target.value })}
                placeholder="Note title"
              />
              <button
                type="button"
                className="btn tiny ghost"
                title={current.pageKey ? 'Detach from its page — make it a book-wide note' : `Save this note to page ${page}`}
                onClick={() => void patch(current.id, { pageKey: current.pageKey ? undefined : pageKey })}
              >
                {current.pageKey ? '⊘ Unpin page' : `⇣ Page ${page}`}
              </button>
              <button
                type="button"
                className="btn tiny danger"
                onClick={async () => {
                  if (!confirm('Delete note?')) return
                  await db.notes.delete(current.id)
                  setSelected(null)
                }}
              >
                Delete
              </button>
            </div>
            <span className="note-where muted small">Saved to {pageLabel(current)} · never printed or exported</span>
            <textarea
              className="note-body"
              value={current.body}
              onChange={(e) => void patch(current.id, { body: e.target.value })}
              placeholder="Write in Markdown or plain text…"
            />
          </div>
        )}
      </div>
    </div>
  )
}
