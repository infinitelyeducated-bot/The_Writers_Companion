import type { BookDoc, Block, PMNode } from './types'

// ── Word counting ────────────────────────────────────────────────────────────

export function countWordsInNodes(nodes: PMNode[] | undefined): number {
  if (!nodes) return 0
  let n = 0
  for (const node of nodes) {
    if (node.type === 'text') {
      n += (node.text.match(/[^\s]+/g) || []).length
    } else if ('content' in node && node.content) {
      n += countWordsInNodes(node.content as PMNode[])
    }
  }
  return n
}

export function sceneWords(doc: BookDoc, sceneId: string): number {
  return countWordsInNodes(doc.scenes[sceneId])
}

export function blockWords(doc: BookDoc, block: Block): number {
  return block.sceneIds.reduce((a, id) => a + sceneWords(doc, id), 0)
}

export function totalWords(doc: BookDoc): number {
  return Object.values(doc.scenes).reduce((a, nodes) => a + countWordsInNodes(nodes), 0)
}

/** Rough page estimate: 250 words/page at 6×9, scaled by area. */
export function estimatePages(words: number, trimW: number, trimH: number): number {
  const base = (trimW * trimH) / 54
  return Math.max(1, Math.round(words / (250 * base)))
}

// ── Structural helpers ───────────────────────────────────────────────────────

export function chapterNumberLabel(doc: BookDoc, block: Block): string {
  if (block.numberOverride) return block.numberOverride
  const chapters = doc.blocks.filter((b) => b.type === 'chapter')
  const idx = chapters.findIndex((b) => b.id === block.id)
  return idx >= 0 ? String(idx + 1) : ''
}

export function partNumberLabel(doc: BookDoc, block: Block): string {
  if (block.numberOverride) return block.numberOverride
  const parts = doc.blocks.filter((b) => b.type === 'part')
  const idx = parts.findIndex((b) => b.id === block.id)
  return idx >= 0 ? String(idx + 1) : ''
}

export const ORDINAL_WORDS = [
  'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen',
  'Nineteen', 'Twenty', 'Twenty-One', 'Twenty-Two', 'Twenty-Three', 'Twenty-Four', 'Twenty-Five',
]

export function numberToWord(n: number): string {
  return ORDINAL_WORDS[n - 1] || String(n)
}

export function cloneDoc(doc: BookDoc): BookDoc {
  return JSON.parse(JSON.stringify(doc))
}

export function cloneBlock(doc: BookDoc, blockId: string): BookDoc {
  const d = cloneDoc(doc)
  const idx = d.blocks.findIndex((b) => b.id === blockId)
  if (idx < 0) return d
  const src = d.blocks[idx]
  const copy: Block = { ...src, id: src.id + '_copy' + Math.random().toString(36).slice(2, 6), title: src.title + ' (copy)', sceneIds: [] }
  for (const sid of src.sceneIds) {
    const nid = sid + '_copy' + Math.random().toString(36).slice(2, 6)
    d.scenes[nid] = JSON.parse(JSON.stringify(d.scenes[sid] || []))
    copy.sceneIds.push(nid)
  }
  d.blocks.splice(idx + 1, 0, copy)
  return d
}

export function deleteBlock(doc: BookDoc, blockId: string): BookDoc {
  const d = cloneDoc(doc)
  const idx = d.blocks.findIndex((b) => b.id === blockId)
  if (idx < 0) return d
  for (const sid of d.blocks[idx].sceneIds) delete d.scenes[sid]
  d.blocks.splice(idx, 1)
  return d
}

export function deleteScene(doc: BookDoc, blockId: string, sceneId: string): BookDoc {
  const d = cloneDoc(doc)
  const block = d.blocks.find((b) => b.id === blockId)
  if (!block) return d
  if (block.sceneIds.length <= 1) return d
  block.sceneIds = block.sceneIds.filter((s) => s !== sceneId)
  delete d.scenes[sceneId]
  return d
}

export function addScene(doc: BookDoc, blockId: string, afterSceneId?: string): { doc: BookDoc; sceneId: string } {
  const d = cloneDoc(doc)
  const block = d.blocks.find((b) => b.id === blockId)
  if (!block) return { doc: d, sceneId: '' }
  const sid = 'scene_' + Math.random().toString(36).slice(2, 10)
  d.scenes[sid] = [{ type: 'paragraph' }]
  const at = afterSceneId ? block.sceneIds.indexOf(afterSceneId) : -1
  if (at >= 0) block.sceneIds.splice(at + 1, 0, sid)
  else block.sceneIds.push(sid)
  return { doc: d, sceneId: sid }
}

export function reorderBlocks(doc: BookDoc, from: number, to: number): BookDoc {
  const d = cloneDoc(doc)
  if (from === to || from < 0 || to < 0 || from >= d.blocks.length || to >= d.blocks.length) return d
  const [m] = d.blocks.splice(from, 1)
  d.blocks.splice(to, 0, m)
  return d
}

export function reorderArray<T>(arr: T[], from: number, to: number): T[] {
  const a = arr.slice()
  const [m] = a.splice(from, 1)
  a.splice(to, 0, m)
  return a
}

/** First prose node in a chapter — used for drop caps / previews. */
export function firstText(nodes: PMNode[] | undefined): string {
  if (!nodes) return ''
  for (const n of nodes) {
    if (n.type === 'paragraph' && 'content' in n && n.content) {
      const t = n.content.map((c) => (c.type === 'text' ? c.text : '')).join('')
      if (t.trim()) return t
    }
  }
  return ''
}

export function plainText(nodes: PMNode[] | undefined): string {
  if (!nodes) return ''
  let out = ''
  for (const n of nodes) {
    if (n.type === 'text') out += n.text
    else if ('content' in n && n.content) out += plainText(n.content as PMNode[]) + (n.type === 'paragraph' ? '\n\n' : '')
  }
  return out.trim()
}

/** Collect footnote refs across the doc, in reading order. */
export function collectFootnotes(doc: BookDoc): { id: string; text: string }[] {
  const seen: { id: string; text: string }[] = []
  for (const block of doc.blocks) {
    for (const sid of block.sceneIds) {
      const walk = (nodes: PMNode[]) => {
        for (const n of nodes) {
          if (n.type === 'footnoteRef') {
            const id = n.attrs.id
            if (!seen.some((s) => s.id === id)) seen.push({ id, text: doc.footnotes[id] || '' })
          } else if ('content' in n && n.content) walk(n.content as PMNode[])
        }
      }
      walk(doc.scenes[sid] || [])
    }
  }
  return seen
}
