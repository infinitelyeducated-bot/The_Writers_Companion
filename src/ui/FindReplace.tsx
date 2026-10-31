import { useMemo, useRef, useState } from 'react'
import { useProject } from '../state/project'
import type { BookDoc, PMNode } from '../model/types'

interface Hit {
  sceneId: string
  blockTitle: string
  text: string
  at: number
}

/**
 * Quote-tolerant pattern. Each quote in the search term becomes a character
 * class matching straight AND curly forms, and the pattern runs against the
 * ORIGINAL text. Nothing is normalised in place, so text outside a match —
 * including every other curly quote in the book — is never touched.
 */
function quoteTolerant(escaped: string): string {
  return escaped
    .replace(/['\u2018\u2019]/g, "['\u2018\u2019]")
    .replace(/["\u201c\u201d]/g, '["\u201c\u201d]')
}

export function replaceInNodes(nodes: PMNode[], find: string, repl: string, matchCase: boolean, whole: boolean): { nodes: PMNode[]; count: number } {
  let count = 0
  const rx = buildRx(find, matchCase, whole)
  const walk = (ns: PMNode[]): PMNode[] =>
    ns.map((n) => {
      if (n.type === 'text') {
        let hit = false
        const replaced = n.text.replace(rx, () => {
          count++
          hit = true
          return repl
        })
        // untouched nodes are returned as the same object, byte for byte
        return hit ? { ...n, text: replaced } : n
      }
      if ('content' in n && n.content) return { ...n, content: walk(n.content as PMNode[]) } as PMNode
      return n
    })
  return { nodes: walk(nodes), count }
}

export function buildRx(find: string, matchCase: boolean, whole: boolean): RegExp {
  const esc = quoteTolerant(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const body = whole ? `\\b${esc}\\b` : esc
  return new RegExp(body, matchCase ? 'g' : 'gi')
}

export function FindReplace() {
  const { project, updateDoc } = useProject()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [repl, setRepl] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [whole, setWhole] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  const hits: Hit[] = useMemo(() => {
    if (!q.trim()) return []
    const rx = buildRx(q, matchCase, whole)
    const out: Hit[] = []
    // Search each text run on its own — the same unit Replace all edits — so
    // the count shown is exactly what Replace all will change.
    const runs = (nodes: PMNode[] | undefined, acc: string[]) => {
      for (const n of nodes || []) {
        if (n.type === 'text') acc.push(n.text)
        else if ('content' in n && n.content) runs(n.content as PMNode[], acc)
      }
      return acc
    }
    for (const block of project.doc.blocks) {
      for (const sid of block.sceneIds) {
        for (const text of runs(project.doc.scenes[sid], [])) {
          rx.lastIndex = 0
          let m: RegExpExecArray | null
          while ((m = rx.exec(text)) && out.length < 200) {
            out.push({
              sceneId: sid,
              blockTitle: block.title,
              text: text.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30),
              at: m.index,
            })
            if (m.index === rx.lastIndex) rx.lastIndex++
          }
        }
      }
    }
    return out
  }, [q, matchCase, whole, project.doc])

  const replaceAll = () => {
    if (!q.trim() || !hits.length) return
    if (!confirm(`Replace ${hits.length} occurrence${hits.length === 1 ? '' : 's'} of “${q}” with “${repl}”?\n\nA snapshot is taken first.`)) return
    let total = 0
    updateDoc(
      (d: BookDoc) => {
        const scenes = { ...d.scenes }
        for (const sid of Object.keys(scenes)) {
          const { nodes, count } = replaceInNodes(scenes[sid], q, repl, matchCase, whole)
          if (count) {
            scenes[sid] = nodes
            total += count
          }
        }
        return { ...d, scenes }
      },
      { snapshot: `Before replace: "${q}" → "${repl}"`, snapshotBefore: true },
    )
    window.setTimeout(() => alert(`Replaced ${total} occurrence${total === 1 ? '' : 's'}.`), 50)
  }

  return (
    <div className="findbar" ref={box}>
      <div className="findbar-wrap" title="Find & Replace — search every chapter and scene. Case-sensitive and whole-word options; smart quotes match straight quotes; Replace all snapshots the book first so it can be undone from Version history.">
        <input
          className="findbar-input"
          type="search"
          placeholder="Find in book…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          aria-label="Find in book"
        />
        <span className="findbar-ico" aria-hidden="true">⌕</span>
      </div>

      {open && q.trim() && (
        <div className="findbar-pop">
          <div className="findbar-row">
            <input
              type="text"
              placeholder="Replace with…"
              value={repl}
              onChange={(e) => setRepl(e.target.value)}
              aria-label="Replace with"
            />
            <button type="button" className="btn tiny primary" disabled={!hits.length} onClick={replaceAll}>
              Replace all ({hits.length})
            </button>
            <button type="button" className="btn tiny ghost" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="findbar-opts">
            <label className="chk inline"><input type="checkbox" checked={matchCase} onChange={(e) => setMatchCase(e.target.checked)} /> Match case</label>
            <label className="chk inline"><input type="checkbox" checked={whole} onChange={(e) => setWhole(e.target.checked)} /> Whole word</label>
            <span className="muted small">{hits.length === 200 ? '200+ matches' : `${hits.length} match${hits.length === 1 ? '' : 'es'}`}</span>
          </div>
          <div className="findbar-hits">
            {hits.slice(0, 30).map((h, i) => (
              <div key={i} className="findbar-hit">
                <span className="findbar-chap">{h.blockTitle}</span>
                <span className="findbar-ctx">…{h.text}…</span>
              </div>
            ))}
            {hits.length > 30 && <p className="muted small">…and {hits.length - 30} more.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
