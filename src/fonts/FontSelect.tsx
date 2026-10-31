import { useEffect, useMemo, useRef, useState } from 'react'
import {
  TYPE_GROUPS,
  FACE_BY_FAMILY,
  loadFontFamily,
  searchBlob,
  SIZE_PRESETS,
  copySample,
  type Typeface,
} from './catalog'

export function FontSelect({
  value,
  onChange,
  sizePt,
  onSize,
  compact,
  hideSample,
}: {
  value: string
  onChange: (family: string) => void
  sizePt?: number
  onSize?: (pt: number) => void
  compact?: boolean
  hideSample?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [popPos, setPopPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const box = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const needle = q.trim().toLowerCase()
  const face: Typeface | undefined = FACE_BY_FAMILY.get(value)

  const groups = useMemo(() => {
    if (!needle) return TYPE_GROUPS
    return TYPE_GROUPS.map((g) => ({
      ...g,
      faces: g.faces.filter((f) => searchBlob(f, g.heading).includes(needle)),
    })).filter((g) => g.faces.length)
  }, [needle])

  const hitCount = groups.reduce((n, g) => n + g.faces.length, 0)

  useEffect(() => {
    if (!open) return
    const place = () => {
      const r = trigger.current?.getBoundingClientRect()
      if (!r) return
      const width = Math.min(360, window.innerWidth - 24)
      let left = r.left
      if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8
      if (left < 8) left = 8
      let top = r.bottom + 4
      if (top + 360 > window.innerHeight) top = Math.max(8, r.top - 364)
      setPopPos({ top, left })
    }
    place()
    const onDoc = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', place)
    window.setTimeout(() => searchRef.current?.focus(), 0)
    void loadFontFamily(value)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', place)
    }
  }, [open, value])

  const pick = (family: string) => {
    void loadFontFamily(family)
    onChange(family)
    setQ('')
    setOpen(false)
  }

  return (
    <div className={'font-select' + (compact ? ' compact' : '')} ref={box}>
      <button
        type="button"
        ref={trigger}
        className={'font-trigger' + (open ? ' on' : '')}
        onClick={() => setOpen((v) => !v)}
        title="Search 228 typefaces — hieroglyphs, storybook, runes…"
      >
        <span className="font-trigger-name" style={{ fontFamily: `'${value}', Georgia, serif` }}>
          {value}
        </span>
        <span className="font-trigger-caret">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="font-pop" role="listbox" style={{ top: popPos.top, left: popPos.left }}>
          <input
            ref={searchRef}
            className="font-search"
            type="search"
            placeholder="Search — hieroglyph, disney, runic, storybook…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search typefaces"
          />
          <div className="font-hit muted small">
            {needle ? `${hitCount} match${hitCount === 1 ? '' : 'es'}` : `${FACE_BY_FAMILY.size} families`}
          </div>
          <div className="font-list">
            {groups.length === 0 && <p className="muted small font-empty">No faces match “{q}”.</p>}
            {groups.map((g) => (
              <div key={g.heading} className="font-group">
                <div className="font-group-h">{g.heading}</div>
                {g.faces.map((f) => (
                  <button
                    type="button"
                    key={f.family}
                    className={'font-opt' + (f.family === value ? ' on' : '')}
                    onMouseEnter={() => void loadFontFamily(f.family)}
                    onClick={() => pick(f.family)}
                  >
                    <span className="font-opt-name" style={{ fontFamily: `'${f.family}', Georgia, serif` }}>
                      {f.family}
                    </span>
                    {f.note && <span className="font-opt-note">{f.note}</span>}
                    {f.sample && (
                      <span className="font-opt-sample" style={{ fontFamily: `'${f.family}', Georgia, serif` }}>
                        {f.sample}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {onSize && (
        <label className="font-size-row">
          <span className="muted small">Size</span>
          <select
            value={String(sizePt ?? 11.5)}
            onChange={(e) => onSize(Number(e.target.value))}
            aria-label="Type size"
          >
            {!SIZE_PRESETS.some((p) => p.pt === sizePt) && sizePt != null && (
              <option value={sizePt}>{sizePt} pt (current)</option>
            )}
            {SIZE_PRESETS.map((p) => (
              <option key={p.pt} value={p.pt}>
                {p.label} ({p.pt} pt)
              </option>
            ))}
          </select>
        </label>
      )}

      {face?.sample && !hideSample && (
        <div className="font-sample">
          <span className="muted small">Click to copy into the manuscript</span>
          <button
            type="button"
            className="font-sample-btn"
            style={{ fontFamily: `'${face.family}', Georgia, serif` }}
            onClick={() => {
              void loadFontFamily(face.family)
              copySample(face.sample!)
            }}
            title="Copy sample"
          >
            {face.sample}
          </button>
        </div>
      )}
    </div>
  )
}
