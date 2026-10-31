import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { useProject } from '../state/project'

/** Version history + Snapshot now. Lives in the bottom status frame. */
export function SnapshotsBar() {
  const { project, replaceDoc, takeSnapshot, updateSettings } = useProject()
  const [open, setOpen] = useState(false)
  const snaps = useLiveQuery(() => db.snapshots.where('projectId').equals(project.id).reverse().sortBy('createdAt'), [project.id], [])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div className="snapshots" ref={ref}>
      <button className="btn tiny ghost" onClick={() => setOpen((v) => !v)}>
        ⟲ Version history ({snaps?.length || 0})
      </button>
      <button
        className="btn tiny ghost"
        onClick={() => {
          const label = prompt('Snapshot label', 'Draft ' + new Date().toLocaleString())
          if (label) void takeSnapshot(label)
        }}
      >
        Snapshot now
      </button>
      {open && (
        <div className="snap-list">
          {(snaps || []).length === 0 && <p className="muted small pad">No snapshots yet.</p>}
          {(snaps || []).map((s) => (
            <div key={s.id} className="snap-item">
              <div>
                <div className="snap-label">{s.label}</div>
                <div className="muted small">
                  {new Date(s.createdAt).toLocaleString()}
                  {s.wordCount ? ` · ${s.wordCount.toLocaleString()} words` : ''}
                </div>
              </div>
              <div className="snap-actions">
                <button
                  className="btn tiny"
                  onClick={() => {
                    if (!confirm(`Restore “${s.label}”? Current manuscript will be snapshotted first.${s.settings ? '\n\nLayout and page-art settings are restored too.' : ''}`)) return
                    replaceDoc(JSON.parse(JSON.stringify(s.doc)), 'Before restore', { snapshotBefore: true })
                    if (s.settings) updateSettings(JSON.parse(JSON.stringify(s.settings)))
                    setOpen(false)
                  }}
                >
                  Restore
                </button>
                <button className="btn tiny danger" onClick={() => void db.snapshots.delete(s.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
