import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, createAppSnapshot, restoreAppSnapshot, APP_SNAPSHOT_MINUTES, APP_SNAPSHOT_KEEP } from '../db/db'
import { saveAs } from '../util/saveAs'

const fmtBytes = (n: number) => (n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB')

/** Whole-app snapshots: automatic every five minutes, plus "Snapshot now". */
export function AppSnapshotsDialog({ onClose }: { onClose: () => void }) {
  const snaps = useLiveQuery(() => db.appSnapshots.orderBy('createdAt').reverse().toArray(), [], [])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  const restore = async (id: string, when: string) => {
    if (!confirm(`Restore the whole app to ${when}?\n\nEvery book in this browser is replaced by the books in that snapshot. A safety snapshot of right now is taken first, so you can undo this from this same list.`)) return
    setBusy(true)
    try {
      await restoreAppSnapshot(id)
      setMsg('Restored. Reloading…')
      location.hash = ''
      location.reload()
    } catch (e) {
      setMsg('Restore failed: ' + (e as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" role="dialog" aria-modal="true" aria-label="App snapshots" onClick={(e) => e.stopPropagation()}>
        <h2>App snapshots</h2>
        <div className="modal-body">
          <p className="muted small">
            The whole workspace (every book, its notes and its pictures) is copied automatically every {APP_SNAPSHOT_MINUTES} minutes,
            but only when something changed. The newest {APP_SNAPSHOT_KEEP} are kept, about an hour of history. These live in this
            browser, so use <b>Save whole library as…</b> for a copy that survives clearing browser data.
          </p>
          <div className="btn-row">
            <button
              className="btn primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                const s = await createAppSnapshot('Snapshot now', true)
                setMsg(s ? `Snapshot taken: ${s.books} books.` : 'Nothing to snapshot yet.')
                setBusy(false)
              }}
            >
              Snapshot now
            </button>
          </div>
          {msg && <p className="hint">{msg}</p>}
          <div className="dest-list">
            {(snaps || []).length === 0 && <p className="muted small">No app snapshots yet. The first is taken a few seconds after the app opens.</p>}
            {(snaps || []).map((s) => {
              const when = new Date(s.createdAt).toLocaleString()
              return (
                <div key={s.id} className="snap-row">
                  <div className="dest-main">
                    <span className="dest-name">{when}</span>
                    <span className="dest-wants">{s.books} {s.books === 1 ? 'book' : 'books'} · {fmtBytes(s.bytes)} of pictures</span>
                  </div>
                  <span className="dest-note">{s.label}</span>
                  <button className="btn tiny ghost" disabled={busy} onClick={() => void restore(s.id, when)}>Restore</button>
                  <button
                    className="btn tiny ghost"
                    disabled={busy}
                    title="Save this snapshot to a file"
                    onClick={async () => {
                      const body = { kind: 'writerscompanion-library', version: 1, exportedAt: s.createdAt, projects: s.projects, notes: s.notes, assets: s.assets, snapshots: [] }
                      const r = await saveAs(new Blob([JSON.stringify(body)], { type: 'application/json' }), 'The_Writers_Companion_snapshot_' + new Date(s.createdAt).toISOString().replace(/[:T]/g, '-').slice(0, 16) + '.json', 'Writers Companion snapshot')
                      setMsg(r.saved ? 'Saved ' + r.name : 'Save cancelled')
                    }}
                  >
                    Save as…
                  </button>
                </div>
              )
            })}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
