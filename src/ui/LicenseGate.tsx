import { useState } from 'react'

const KEY = 'writerscompanion.license.v2'

export function licenseAccepted(): boolean {
  try {
    return localStorage.getItem(KEY) === 'yes'
  } catch {
    return false
  }
}

/**
 * First-launch gateway. Shown once, before anything else in the app, and the
 * only way in is to answer Yes. "No" does not open the app: it asks the browser
 * to close the page and leaves a dead-end screen in case the browser blocks the
 * auto-close. Nothing is stored on decline, so relaunching asks again.
 *
 * The statement below is the author's own wording. Only spelling and punctuation were corrected.
 */
export function LicenseGate({ onAccept }: { onAccept: () => void }) {
  const [declined, setDeclined] = useState(false)

  const accept = () => {
    try {
      localStorage.setItem(KEY, 'yes')
    } catch {
      /* storage unavailable: still let them in this session */
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
        <div className="modal" role="dialog" aria-modal="true" aria-label="Declined">
          <h2>You chose not to accept</h2>
          <div className="modal-body">
            <p className="muted">
              The Writers Companion stays closed without your agreement. Nothing was stored and nothing
              was changed.
            </p>
            <p className="muted">
              If this file or tab is still open, your browser blocked the automatic close.
              Please close it yourself.
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
      <div className="modal modal-gate" role="dialog" aria-modal="true" aria-labelledby="gate-title" aria-describedby="gate-body">
        <h2 id="gate-title">Before you open The Writers Companion</h2>
        <div className="modal-body gate-body" id="gate-body">
          <p>
            The Software was written and is copyrighted. It is not to be altered in any way other than
            the use of writers to explore as a tool to help create and motivate. It was with that
            intention that The Writers Companion was meant.
          </p>
          <p>
            You owe me nothing and I owe you nothing, and I own nothing you create with this app. I do
            ask that you donate to a local charity to encourage literacy and community.
          </p>
          <p>Other than that, enjoy. I wish you the best!!!</p>
          <p className="gate-question">
            <strong>Do you agree to use The Writers Companion on these terms?</strong>
          </p>
          <p className="muted small">Your answer is remembered on this device, so this only appears once.</p>
        </div>
        <div className="modal-actions">
          <button className="btn ghost" onClick={decline}>
            No
          </button>
          <button className="btn primary" onClick={accept} autoFocus>
            Yes
          </button>
        </div>
      </div>
    </div>
  )
}
