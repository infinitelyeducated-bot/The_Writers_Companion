import { useEffect } from 'react'
import { marked } from 'marked'
import readmeText from '../../README.md?raw'

let cached: string | null = null

async function renderReadme(): Promise<string> {
  if (cached) return cached
  const html = await marked.parse(readmeText, { gfm: true, breaks: false })
  cached = html
  return html
}

/** Lazily-rendered README shown in a modal. */
export function GuideModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    let alive = true
    renderReadme().then((html) => {
      if (!alive) return
      const el = document.getElementById('writerscompanion-guide-content')
      if (el) el.innerHTML = html
    })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      alive = false
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal-wide"
        role="dialog"
        aria-modal="true"
        aria-label="The Writers Companion guide"
        onClick={(e) => e.stopPropagation()}
      >
        <h2>The Writers Companion guide</h2>
        <div className="modal-body guide-body">
          <div id="writerscompanion-guide-content">
            <p className="muted">Loading guide…</p>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn primary" onClick={onClose} autoFocus>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
