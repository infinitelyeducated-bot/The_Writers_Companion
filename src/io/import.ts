import { marked } from 'marked'
import mammoth from 'mammoth'
import type { BookDoc, PMNode } from '../model/types'
import { para, uid } from '../model/types'
import { smartenHtml, smarten } from '../editor/typography'

// ─────────────────────────────────────────────────────────────────────────────
// Import: .docx (mammoth), .md (marked), .txt (plain)  →  BookDoc
// ─────────────────────────────────────────────────────────────────────────────

export interface ImportResult {
  doc: BookDoc
  report: { chapters: number; parts: number; words: number; repairedParagraphs: number; headingsMapped: number }
}

const TERMINAL = /[.!?…:”’"')*\]]$/

/** Repair paragraphs broken by hard line breaks: join a short line that has no
 *  terminal punctuation with the following line. */
export function repairLineBrokenParagraphs(text: string): { text: string; repaired: number } {
  const lines = text.split(/\n/)
  const out: string[] = []
  let repaired = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const next = lines[i + 1]
    const trimmed = line.trim()
    if (
      next !== undefined &&
      trimmed.length > 0 &&
      !TERMINAL.test(trimmed) &&
      trimmed.length < 75 &&
      next.trim().length > 0 &&
      !/^#{1,6}\s/.test(next.trim()) &&
      !/^[-*+]\s|^\d+\.\s/.test(next.trim()) &&
      !/^>/.test(next.trim())
    ) {
      out.push(line.replace(/\s+$/, '') + ' ' + next.trim())
      i++
      repaired++
      continue
    }
    out.push(line)
  }
  return { text: out.join('\n'), repaired }
}

function inlineFromHtml(el: Node, doc: Document): PMNode[] {
  const out: PMNode[] = []
  el.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      const t = child.textContent || ''
      if (t) out.push({ type: 'text', text: t })
    } else if (child.nodeType === 1) {
      const e = child as HTMLElement
      const tag = e.tagName.toLowerCase()
      const marks: { type: 'bold' | 'italic' | 'underline' | 'strike' | 'smallCaps' | 'link' | 'fontFamily' | 'fontSize' | 'textPaint'; attrs?: Record<string, unknown> }[] = []
      if (tag === 'strong' || tag === 'b') marks.push({ type: 'bold' })
      if (tag === 'em' || tag === 'i') marks.push({ type: 'italic' })
      if (tag === 'u') marks.push({ type: 'underline' })
      if (tag === 's' || tag === 'del') marks.push({ type: 'strike' })
      // <span class="sc"> is what The Writers Companion's own exporters write for small caps
      if (tag === 'span' && e.classList.contains('sc')) marks.push({ type: 'smallCaps' })
      if (tag === 'span' && e.getAttribute('data-ff')) marks.push({ type: 'fontFamily', attrs: { family: e.getAttribute('data-ff') } })
      if (tag === 'span' && e.getAttribute('data-fs')) marks.push({ type: 'fontSize', attrs: { size: Number(e.getAttribute('data-fs')) } })
      if (tag === 'span' && (e.getAttribute('data-tc') || e.getAttribute('data-tg') || e.getAttribute('data-to'))) {
        marks.push({
          type: 'textPaint',
          attrs: {
            color: e.getAttribute('data-tc') || undefined,
            gradient: e.getAttribute('data-tg') || undefined,
            opacity: e.getAttribute('data-to') != null ? Number(e.getAttribute('data-to')) : 1,
          },
        })
      }
      if (tag === 'a') marks.push({ type: 'link', attrs: { href: e.getAttribute('href') || '' } })
      if (tag === 'br') {
        out.push({ type: 'hardBreak' })
        return
      }
      if (tag === 'sup' && e.querySelector('a[href^="#fn"]')) {
        const id = (e.querySelector('a')!.getAttribute('href') || '').replace('#', '')
        out.push({ type: 'footnoteRef', attrs: { id } })
        return
      }
      const inner = inlineFromHtml(e, doc)
      for (const node of inner) {
        if (node.type === 'text') out.push({ ...node, marks: [...(node.marks || []), ...marks] })
        else out.push(node)
      }
    }
  })
  void doc
  return out
}

interface Section {
  kind: 'front' | 'part' | 'chapter' | 'back'
  title: string
  blocks: PMNode[]
}

const BACK_HEADINGS = /^(acknowledg|about the author|also by|appendix|glossary|bibliograph|afterword|epilogue|notes?$)/i
const FRONT_HEADINGS = /^(copyright|dedication|epigraph|foreword|preface|introduction|prologue|title page)/i

function htmlToSections(html: string): { sections: Section[]; repaired: number } {
  const dom = new DOMParser().parseFromString(html, 'text/html')
  const body = dom.body
  let repaired = 0

  // pre-pass: repair line-broken paragraphs (mammoth emits <p> per line for hard breaks;
  // also <br> inside paragraphs is repaired)
  const ps = Array.from(body.querySelectorAll('p'))
  for (const p of ps) {
    if (p.querySelector('br')) {
      const text = (p.textContent || '').replace(/\n/g, ' ')
      p.innerHTML = ''
      p.textContent = text.replace(/\s+/g, ' ').trim()
      repaired++
    }
  }
  // join consecutive short paragraphs without terminal punctuation
  for (let i = 0; i < ps.length - 1; i++) {
    const a = ps[i]
    const b = ps[i + 1]
    if (!a.isConnected || !b.isConnected) continue
    const at = (a.textContent || '').trim()
    if (at && at.length < 75 && !TERMINAL.test(at) && a.tagName === 'P' && b.tagName === 'P' && !a.querySelector('img')) {
      a.textContent = at + ' ' + (b.textContent || '').trim()
      b.remove()
      repaired++
      i--
    }
  }

  const sections: Section[] = []
  let current: Section | null = null
  const ensure = () => {
    if (!current) {
      current = { kind: 'chapter', title: '', blocks: [] }
      sections.push(current)
    }
    return current
  }

  const pushNode = (node: PMNode) => {
    const s = ensure()
    s.blocks.push(node)
  }

  const walk = (parent: Element) => {
    Array.from(parent.children).forEach((el) => {
      const tag = el.tagName.toLowerCase()
      if (/^h[1-6]$/.test(tag)) {
        const level = Number(tag[1])
        const text = smarten((el.textContent || '').replace(/\s+/g, ' ').trim())
        if (!text) return
        if (level === 1 || level === 2) {
          const lower = text.toLowerCase()
          let kind: Section['kind'] = 'chapter'
          if (/^(part|book|volume)\b/.test(lower)) kind = 'part'
          else if (BACK_HEADINGS.test(lower)) kind = 'back'
          else if (FRONT_HEADINGS.test(lower)) kind = 'front'
          // A level-2 heading directly following an h1 with no content = section heading
          const prev = current as Section | null
          if (level === 2 && prev && prev.blocks.length === 0 && (prev.kind === 'chapter')) {
            prev.blocks.push({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] })
            return
          }
          current = { kind, title: text, blocks: [] }
          sections.push(current)
        } else {
          pushNode({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text }] })
        }
        return
      }
      if (tag === 'p') {
        const content = inlineFromHtml(el, dom)
        if (content.length === 0) return
        // scene break detection
        const txt = (el.textContent || '').trim()
        if (/^(\*\s*\*\s*\*|#|\* \* \*|❦|⁂)$/.test(txt)) {
          pushNode({ type: 'sceneBreak' })
          return
        }
        pushNode({ type: 'paragraph', content })
        return
      }
      if (tag === 'blockquote') {
        const attributionEl = el.querySelector('cite, .attribution, em:last-child')
        const attribution = attributionEl ? (attributionEl.textContent || '').trim() : undefined
        const inner: PMNode[] = []
        Array.from(el.children).forEach((c) => {
          if (c.tagName === 'P') inner.push({ type: 'paragraph', content: inlineFromHtml(c, dom) })
        })
        if (!inner.length) inner.push({ type: 'paragraph', content: inlineFromHtml(el, dom) })
        pushNode({ type: 'blockquote', attrs: attribution ? { attribution } : {}, content: inner })
        return
      }
      if (tag === 'ul' || tag === 'ol') {
        const items: PMNode[] = Array.from(el.querySelectorAll(':scope > li')).map((li) => ({
          type: 'listItem',
          content: [{ type: 'paragraph', content: inlineFromHtml(li, dom) }],
        }))
        pushNode({ type: tag === 'ul' ? 'bulletList' : 'orderedList', content: items })
        return
      }
      if (tag === 'img') {
        const src = (el as HTMLImageElement).getAttribute('src') || ''
        pushNode({ type: 'image', attrs: { imageId: '', alt: (el as HTMLImageElement).alt, caption: undefined }, __src: src } as unknown as PMNode)
        return
      }
      if (tag === 'hr') {
        pushNode({ type: 'sceneBreak' })
        return
      }
      // container elements
      walk(el)
    })
  }
  walk(body)
  return { sections, repaired }
}

/** Convert raw HTML (already smartened) into a BookDoc. */
export function htmlToDoc(html: string, keepTitleHeading = false): ImportResult {
  const { sections, repaired } = htmlToSections(html)
  const doc: BookDoc = { version: 1, blocks: [], scenes: {}, footnotes: {} }
  let chapters = 0
  let parts = 0
  let words = 0
  let headingsMapped = 0

  const addBlock = (type: 'frontmatter' | 'part' | 'chapter' | 'backmatter', title: string, blocks: PMNode[]) => {
    const id = uid('blk')
    const sceneId = uid('scene')
    const clean = blocks.length ? blocks : [para()]
    doc.scenes[sceneId] = clean
    doc.blocks.push({ id, type, title, sceneIds: [sceneId] })
  }

  for (const s of sections) {
    let blocks = s.blocks
    if (!keepTitleHeading && blocks[0]?.type === 'heading' && blocks[0].attrs.level === 2) {
      blocks = blocks.slice(1)
    }
    if (s.title) headingsMapped++
    if (s.kind === 'part') {
      parts++
      addBlock('part', s.title, blocks)
    } else if (s.kind === 'front') {
      const kind = /dedication/i.test(s.title) ? 'dedication' : /copyright/i.test(s.title) ? 'copyright' : /foreword/i.test(s.title) ? 'foreword' : /preface/i.test(s.title) ? 'preface' : /introduction/i.test(s.title) ? 'introduction' : /epigraph/i.test(s.title) ? 'epigraph' : 'foreword'
      const id = uid('blk')
      const sceneId = uid('scene')
      doc.scenes[sceneId] = blocks.length ? blocks : [para()]
      doc.blocks.push({ id, type: 'frontmatter', title: s.title, kind, sceneIds: [sceneId] })
    } else if (s.kind === 'back') {
      const kind = /acknowledg/i.test(s.title) ? 'acknowledgments' : /about the author/i.test(s.title) ? 'aboutAuthor' : /also by/i.test(s.title) ? 'alsoBy' : /glossary/i.test(s.title) ? 'glossary' : /bibliograph/i.test(s.title) ? 'bibliography' : /appendix/i.test(s.title) ? 'appendix' : /afterword/i.test(s.title) ? 'afterword' : /epilogue/i.test(s.title) ? 'epilogue' : 'afterword'
      const id = uid('blk')
      const sceneId = uid('scene')
      doc.scenes[sceneId] = blocks.length ? blocks : [para()]
      doc.blocks.push({ id, type: 'backmatter', title: s.title, kind, sceneIds: [sceneId] })
    } else {
      if (!s.title && blocks.length === 0) continue
      chapters++
      addBlock('chapter', s.title || `Chapter ${chapters}`, blocks)
    }
  }

  for (const nodes of Object.values(doc.scenes)) {
    words += countWords(nodes)
  }
  return { doc, report: { chapters, parts, words, repairedParagraphs: repaired, headingsMapped } }
}

function countWords(nodes: PMNode[]): number {
  let n = 0
  for (const node of nodes) {
    if (node.type === 'text') n += (node.text.match(/[^\s]+/g) || []).length
    else if ('content' in node && node.content) n += countWords(node.content as PMNode[])
  }
  return n
}

export async function importDocx(file: File): Promise<ImportResult & { images: { name: string; dataUrl: string; mime: string }[] }> {
  const arrayBuffer = await file.arrayBuffer()
  const images: { name: string; dataUrl: string; mime: string }[] = []
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        const base64 = await image.read('base64')
        const dataUrl = `data:${image.contentType};base64,${base64}`
        const name = `docx-image-${images.length + 1}.${(image.contentType.split('/')[1] || 'png').replace('jpeg', 'jpg')}`
        images.push({ name, dataUrl, mime: image.contentType })
        return { src: dataUrl, alt: name }
      }),
    },
  )
  const html = smartenHtml(result.value)
  const res = htmlToDoc(html)
  return { ...res, images }
}

export async function importMarkdown(file: File): Promise<ImportResult> {
  const text = await file.text()
  const repaired = repairLineBrokenParagraphs(text)
  const html = await marked.parse(repaired.text, { gfm: true, breaks: false })
  const res = htmlToDoc(smartenHtml(String(html)))
  res.report.repairedParagraphs += repaired.repaired
  return res
}

export async function importText(file: File): Promise<ImportResult> {
  const raw = await file.text()
  const repaired = repairLineBrokenParagraphs(raw)
  // Blank-line separated blocks; a line that is short and unpunctuated becomes a heading
  const chunks = repaired.text.split(/\n\s*\n/)
  let html = ''
  for (const chunk of chunks) {
    const t = chunk.trim()
    if (!t) continue
    const lines = t.split('\n')
    const isShortTitle = lines.length === 1 && t.length < 60 && !TERMINAL.test(t) && !/^["“']/.test(t)
    const isChapterLabel = /^(chapter|part|book)\b/i.test(t) || /^[IVXLC]+\.?$/.test(t)
    if (isShortTitle || isChapterLabel) html += `<h1>${escapeHtml(t)}</h1>`
    else html += `<p>${escapeHtml(lines.join(' ').replace(/\s+/g, ' '))}</p>`
  }
  const res = htmlToDoc(smartenHtml(html))
  res.report.repairedParagraphs += repaired.repaired
  return res
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function importFile(file: File): Promise<ImportResult & { images: { name: string; dataUrl: string; mime: string }[] }> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.docx')) return importDocx(file)
  if (name.endsWith('.md') || name.endsWith('.markdown')) return { ...(await importMarkdown(file)), images: [] }
  if (name.endsWith('.txt')) return { ...(await importText(file)), images: [] }
  if (name.endsWith('.html') || name.endsWith('.htm')) {
    const text = await file.text()
    return { ...htmlToDoc(smartenHtml(text)), images: [] }
  }
  throw new Error('Unsupported file type. Use .docx, .md, .txt or .html')
}
