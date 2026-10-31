import { useRef, useState } from 'react'
import { useProject } from '../state/project'
import { typicalFor } from '../pageArt'

const POS_KEY = 'writerscompanion.goals.pos'
type Pos = { x: number; y: number }

function loadPos(): Pos | null {
  try {
    const v = localStorage.getItem(POS_KEY)
    return v ? (JSON.parse(v) as Pos) : null
  } catch {
    return null
  }
}

/**
 * Writing goal, autosave interval and progress. Collapsed by default.
 *
 * `docked`: on the Write tab the box is mounted in the chapter column's
 * footer, right of "+ Part". On the other tabs (no chapter column) it sits in
 * the lower-left corner. Either way it can be dragged out to float anywhere;
 * double-clicking the glove puts it back in its dock.
 */
export function GoalsBox({ docked = false }: { docked?: boolean }) {
  const { project, updateSettings, words, lastSavedAt } = useProject()
  const [open, setOpen] = useState(false)
  // drag anywhere: hold the glove, release to park; position kept on this device
  const [pos, setPos] = useState<Pos | null>(() => loadPos())
  const [grabbing, setGrabbing] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const onGripDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const box = boxRef.current
    if (!box) return
    const r = box.getBoundingClientRect()
    const dx = e.clientX - r.left
    const dy = e.clientY - r.top
    setGrabbing(true)
    let last: Pos | null = null
    const move = (ev: PointerEvent) => {
      last = {
        x: Math.max(4, Math.min(window.innerWidth - r.width - 4, ev.clientX - dx)),
        y: Math.max(4, Math.min(window.innerHeight - 40, ev.clientY - dy)),
      }
      setPos(last)
    }
    const up = () => {
      setGrabbing(false)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      try {
        if (last) localStorage.setItem(POS_KEY, JSON.stringify(last))
      } catch {
        /* position just won't persist */
      }
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
  const resetPos = () => {
    setPos(null)
    try {
      localStorage.removeItem(POS_KEY)
    } catch {
      /* ignore */
    }
  }
  // docked panel: open upward from the button, clamped to the window
  const [popAt, setPopAt] = useState<{ left: number; bottom: number } | null>(null)
  const toggle = () => {
    if (!open && docked && !pos && boxRef.current) {
      const r = boxRef.current.getBoundingClientRect()
      setPopAt({
        left: Math.max(8, Math.min(window.innerWidth - 288, r.left)),
        bottom: Math.max(8, window.innerHeight - r.top + 6),
      })
    }
    setOpen((v) => !v)
  }
  const goal = project.settings.writingGoal || 0
  const autosave = Math.max(5, Math.round((project.settings.autosaveMinutes ?? 5) / 5) * 5)
  const pct = goal > 0 ? Math.min(100, Math.round((words / goal) * 100)) : 0
  const typical = typicalFor(project.settings.layout)

  return (
    <div
      ref={boxRef}
      className={
        'goals-box' +
        (docked && !pos ? ' docked' : '') +
        (open ? ' open' : '') +
        (pos ? ' placed' : '') +
        (grabbing ? ' grabbing' : '')
      }
      style={pos ? { left: pos.x, top: pos.y, bottom: 'auto' } : undefined}
    >
      <div className="goals-headrow">
      <button
        type="button"
        className="goals-grip"
        onPointerDown={onGripDown}
        onDoubleClick={resetPos}
        title={`Hold and drag to place the goals box anywhere. Double-click to send it back to ${docked ? 'its place beside + Part' : 'the lower-left corner'}.`}
        aria-label="Drag the goals box"
      >
        {grabbing ? '✊' : '🧤'}
      </button>
      <button
        type="button"
        className="goals-head"
        onClick={toggle}
        title="Writing goal, autosave and progress"
        aria-expanded={open}
      >
        <span className="goals-ico">◎</span>
        {goal > 0 ? <span className="goals-mini">{pct}%</span> : <span className="goals-mini">Goals</span>}
        <span className="goals-caret">{open ? '▾' : '▴'}</span>
      </button>
      </div>

      {open && (
        <div
          className="goals-body"
          style={docked && !pos && popAt ? { left: popAt.left, bottom: popAt.bottom } : undefined}
        >
          <h4>Writing goal</h4>
          <label className="field">
            <span>Target words {goal > 0 ? `· ${pct}% there` : ''}</span>
            <input
              type="number"
              min={0}
              step={1000}
              value={goal}
              onChange={(e) => updateSettings({ writingGoal: Math.max(0, Number(e.target.value) || 0) })}
              placeholder="e.g. 80000"
            />
          </label>
          {goal > 0 && (
            <div className="goals-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="goals-fill" style={{ width: pct + '%' }} />
            </div>
          )}
          <p className="muted small">{words.toLocaleString()} words now. {typical.length}</p>

          <h4>Autosave</h4>
          <label className="field">
            <span>Save the workspace every</span>
            <select
              value={autosave}
              onChange={(e) => updateSettings({ autosaveMinutes: Number(e.target.value) })}
            >
              {[5, 10, 15, 20, 25, 30, 45, 60].map((m) => (
                <option key={m} value={m}>{m} minutes</option>
              ))}
            </select>
          </label>
          <p className="muted small">
            Typing already saves within a second; this is the extra safety interval.
            {lastSavedAt ? ` Last saved ${new Date(lastSavedAt).toLocaleTimeString()}.` : ''}
          </p>
        </div>
      )}
    </div>
  )
}
