import { useState } from 'react'

const KEY = 'writerscompanion.license.v1'

export function licenseAccepted(): boolean {
  try {
    return localStorage.getItem(KEY) === 'yes'
  } catch {
    return false
  }
}

/**
 * First-launch freeware gate. Shown once, before anything else in the app.
 * "Yes" records acceptance on this device and opens the app (never asked
 * again). "No" does not open the app: it asks the browser to close the file
 * and leaves a dead-end screen in case the browser blocks the auto-close.
 * Nothing is stored on decline, so relaunching asks again.
 */
export function LicenseGate({ onAccept }: { onAccept: () => void }) {
  const [declined, setDeclined] = useState(false)

  const accept = () => {
    try {
      localStorage.setItem(KEY, 'yes')
    } catch {
      /* storage unavailable — still let them in this session */
    }
    onAccept()
  }

  const decline = () => {
    setDeclined(true)
    window.close()
  }

  if (declined) {
    return (
      <div className="modal-backdrop">
        <div className="modal" role="dialog" aria-modal="true" aria-label="Licence declined">
          <h2>You chose not to accept</h2>
          <div className="modal-body">
            <p className="muted">
              The Writers Companion stays closed without your acceptance. Nothing was stored and nothing
              was changed.
            </p>
            <p className="muted">
              If this file or tab is still open, your browser blocked the automatic close —
              please close it yourself.
            </p>
          </div>
          <div className="modal-actions">
            <button className="btn primary" onClick={() => window.close()}>
              Close
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-label="Freeware licence">
        <h2>Before you open The Writers Companion</h2>
        <div className="modal-body">
          <p>
            <strong>The Writers Companion is freeware.</strong> It costs nothing and you may use it as
            you like.
          </p>
          <ul className="license-list">
            <li>It comes with no warranty of any kind. If it eats your manuscript, I&rsquo;m sorry — but that&rsquo;s the deal.</li>
            <li>It is not supported. There is no helpdesk, no SLA, and no promise of fixes.</li>
            <li>
              The creator(s) cannot and will not be held responsible for its use or misuse —
              including lost work, bad print runs, or anything else that goes wrong.
            </li>
            <li>
              It&rsquo;s free, so you don&rsquo;t get a warranty. Keep your own backups (Export
              tab → Project backup).
            </li>
          </ul>
          <p>
            <strong>You don&rsquo;t own this, so don&rsquo;t try to sell it.</strong> Freeware
            means you may use The Writers Companion; it does not mean you may sell, rebrand, or
            redistribute it as your product.
          </p>
          <p>If you like it, I&rsquo;m glad.</p>
          <p className="muted small">
            Your answer is remembered on this device, so this only appears once.
          </p>
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={decline}>
            No
          </button>
          <button className="btn primary" onClick={accept} autoFocus>
            Yes — open The Writers Companion
          </button>
        </div>
      </div>
    </div>
  )
}
