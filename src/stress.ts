import { buildBlank } from './data/examples'
import { paginate } from './layout/paginate'
import type { PMNode } from './model/types'

const out = document.getElementById('out') as HTMLElement
const log = (s: string) => {
  out.textContent += s + '\n'
}

function lorem(n: number, seed: number): string {
  const words = 'the sea was neither angry nor calm and the keeper counted the steps again as she had every morning since the light first turned across the water'.split(' ')
  let s = ''
  let x = seed
  for (let i = 0; i < n; i++) {
    x = (x * 1103515245 + 12345) % 2147483648
    s += words[x % words.length] + ' '
  }
  return s.trim()
}

function run() {
  out.textContent = ''
  const chapters = Number((document.getElementById('chapters') as HTMLInputElement).value)
  const paras = Number((document.getElementById('paras') as HTMLInputElement).value)
  const p = buildBlank('trade')
  // clear the starter chapter, build the transcript
  p.doc.blocks = p.doc.blocks.filter((b) => b.type === 'frontmatter')
  p.doc.scenes = {}
  let words = 0
  for (let c = 0; c < chapters; c++) {
    const sid = 'sc_' + c
    const nodes: PMNode[] = []
    for (let i = 0; i < paras; i++) {
      const text = lorem(24 + ((c * 7 + i) % 90), c * 97 + i)
      words += text.split(/\s+/).length
      nodes.push({ type: 'paragraph', content: [{ type: 'text', text }] })
      if (i === 5) nodes.push({ type: 'sceneBreak' })
    }
    p.doc.scenes[sid] = nodes
    p.doc.blocks.push({ id: 'ch_' + c, type: 'chapter', title: 'Chapter ' + (c + 1), sceneIds: [sid] })
  }
  const t0 = performance.now()
  const res = paginate(p, () => undefined)
  const t1 = performance.now()
  const mem = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
  log(`chapters: ${chapters}   words: ${words.toLocaleString()}   generated in ${(t1 - t0).toFixed(0)} ms (includes pagination)`)
  log(`pages: ${res.pageCount}   text block: ${res.textWidthIn.toFixed(2)} × ${res.textHeightIn.toFixed(2)} in   gutter ${res.gutter}in`)
  log(`heap after: ${mem ? (mem.usedJSHeapSize / 1048576).toFixed(0) + ' MB' : 'n/a'}`)
  log(`warnings: ${res.warnings.length ? res.warnings.join(' | ') : 'none'}`)
}

document.getElementById('run')!.addEventListener('click', run)
window.addEventListener('load', () => setTimeout(run, 300))
