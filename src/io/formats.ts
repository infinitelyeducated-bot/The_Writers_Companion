import JSZip from 'jszip'
import type { Asset, Block, BookDoc, PMNode, Project } from '../model/types'
import { docToMarkdown } from './markdown'

// Extra manuscript formats beyond Word, Markdown and EPUB:
//   plain text, one-page HTML, RTF, Fountain (screenplays), one file per chapter.
// All of them read the same document the print layout and EPUB read.

const kids = (n: unknown): PMNode[] => ('content' in (n as object) ? (n as { content?: PMNode[] }).content || [] : [])
const hasMark = (n: PMNode, t: string) => n.type === 'text' && (n.marks || []).some((m) => m.type === t)
const plainOf = (nodes: PMNode[] | undefined): string =>
  (nodes || []).map((n) => (n.type === 'text' ? n.text : n.type === 'hardBreak' ? '\n' : '')).join('')

/** The visible heading for a block (chapters without a title get "Chapter N"). */
function labelFor(block: Block, chapterNo: number): string {
  return block.title || (block.type === 'chapter' ? `Chapter ${chapterNo}` : '')
}

interface Walked {
  block: Block
  label: string
  scenes: PMNode[][]
}

function walk(doc: BookDoc): Walked[] {
  let ch = 0
  const out: Walked[] = []
  for (const block of doc.blocks) {
    if (block.type === 'chapter') ch++
    if (block.type === 'backmatter' && block.kind === 'endnotes') continue
    out.push({ block, label: labelFor(block, ch), scenes: block.sceneIds.map((s) => doc.scenes[s] || []) })
  }
  return out
}

// ── Plain text ───────────────────────────────────────────────────────────────

function textBlocks(nodes: PMNode[]): string[] {
  const out: string[] = []
  for (const n of nodes) {
    switch (n.type) {
      case 'paragraph':
        out.push(plainOf(n.content))
        break
      case 'heading':
        out.push(plainOf(n.content).toUpperCase())
        break
      case 'blockquote':
        out.push(textBlocks(kids(n)).join('\n\n').split('\n').map((l) => '    ' + l).join('\n') + (n.attrs?.attribution ? '\n    ' + n.attrs.attribution : ''))
        break
      case 'bulletList':
      case 'orderedList':
        out.push(kids(n).map((li, i) => (n.type === 'bulletList' ? '- ' : `${i + 1}. `) + kids(li).map((p) => plainOf(kids(p))).join(' ')).join('\n'))
        break
      case 'sceneBreak':
      case 'horizontalRule':
        out.push('* * *')
        break
      case 'image':
        out.push(`[Image${n.attrs.alt ? ': ' + n.attrs.alt : ''}]${n.attrs.caption ? '\n' + n.attrs.caption : ''}`)
        break
      default:
        if ('content' in n && n.content) out.push(...textBlocks(n.content as PMNode[]))
    }
  }
  return out.filter((s) => s.trim().length || s === '')
}

export function docToPlainText(project: Project): string {
  const { meta, doc } = project
  const parts: string[] = [meta.title.toUpperCase(), meta.subtitle, 'by ' + meta.author].filter(Boolean)
  const out = [parts.join('\n'), '']
  for (const w of walk(doc)) {
    if (w.block.kind === 'titlepage' || w.block.kind === 'copyright') continue
    const body = w.scenes.map((s) => textBlocks(s).join('\n\n')).filter(Boolean).join('\n\n* * *\n\n')
    out.push((w.label ? w.label.toUpperCase() + '\n' + '='.repeat(Math.min(w.label.length, 60)) + '\n\n' : '') + body, '')
  }
  return out.join('\n').replace(/\n{4,}/g, '\n\n\n').trimEnd() + '\n'
}

// ── HTML ─────────────────────────────────────────────────────────────────────

const he = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function inlineHtml(nodes: PMNode[] | undefined): string {
  return (nodes || [])
    .map((n) => {
      if (n.type === 'hardBreak') return '<br>'
      if (n.type !== 'text') return ''
      let t = he(n.text)
      if (hasMark(n, 'italic')) t = `<em>${t}</em>`
      if (hasMark(n, 'bold')) t = `<strong>${t}</strong>`
      if (hasMark(n, 'underline')) t = `<u>${t}</u>`
      if (hasMark(n, 'strike')) t = `<s>${t}</s>`
      if (hasMark(n, 'smallCaps')) t = `<span style="font-variant:small-caps">${t}</span>`
      const link = (n.marks || []).find((m) => m.type === 'link')
      if (link) t = `<a href="${he(String((link.attrs as { href: string }).href))}">${t}</a>`
      return t
    })
    .join('')
}

function blocksHtml(nodes: PMNode[], imageSrc: (id: string) => string | null): string {
  const out: string[] = []
  for (const n of nodes) {
    switch (n.type) {
      case 'paragraph':
        out.push(`<p>${inlineHtml(n.content) || '&nbsp;'}</p>`)
        break
      case 'heading':
        out.push(`<h${Math.min(6, n.attrs.level + 1)}>${inlineHtml(n.content)}</h${Math.min(6, n.attrs.level + 1)}>`)
        break
      case 'blockquote':
        out.push(`<blockquote>${blocksHtml(kids(n), imageSrc)}${n.attrs?.attribution ? `<footer>${he(String(n.attrs.attribution))}</footer>` : ''}</blockquote>`)
        break
      case 'bulletList':
      case 'orderedList': {
        const tag = n.type === 'bulletList' ? 'ul' : 'ol'
        out.push(`<${tag}>${kids(n).map((li) => `<li>${kids(li).map((p) => inlineHtml(kids(p))).join(' ')}</li>`).join('')}</${tag}>`)
        break
      }
      case 'sceneBreak':
      case 'horizontalRule':
        out.push('<p class="scene-break">* * *</p>')
        break
      case 'image': {
        const src = imageSrc(n.attrs.imageId)
        if (src) out.push(`<figure><img src="${src}" alt="${he(n.attrs.alt || '')}">${n.attrs.caption ? `<figcaption>${he(String(n.attrs.caption))}</figcaption>` : ''}</figure>`)
        break
      }
      default:
        if ('content' in n && n.content) out.push(blocksHtml(n.content as PMNode[], imageSrc))
    }
  }
  return out.join('\n')
}

export function docToHtml(project: Project, assets: Asset[]): string {
  const { meta, doc, settings } = project
  const imageSrc = (id: string) => assets.find((a) => a.id === id)?.dataUrl || null
  const font = settings.typography.fontFamily
  const sections = walk(doc)
    .filter((w) => w.block.kind !== 'titlepage' && w.block.kind !== 'copyright')
    .map((w) => {
      const body = w.scenes.map((s) => blocksHtml(s, imageSrc)).filter(Boolean).join('\n<p class="scene-break">* * *</p>\n')
      return `<section id="${he(w.block.id)}">${w.label ? `<h1>${he(w.label)}</h1>` : ''}\n${body}\n</section>`
    })
  const toc = walk(doc)
    .filter((w) => w.block.type === 'chapter' || w.block.type === 'part')
    .map((w) => `<li><a href="#${he(w.block.id)}">${he(w.label)}</a></li>`)
    .join('')
  return `<!doctype html>
<html lang="${he(meta.language || 'en')}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${he(meta.title)}</title>
<style>
body{font-family:'${font}',Georgia,serif;font-size:1.1rem;line-height:1.65;max-width:38rem;margin:2.5rem auto;padding:0 1.2rem;color:#1c1c1c;background:#fffdf8}
h1{font-size:1.7rem;margin:3rem 0 1rem;text-align:center;page-break-before:always}
h2,h3,h4{margin:1.6rem 0 .6rem}
p{margin:0;text-indent:1.4em;text-align:justify}
p+p{margin-top:0}
.scene-break,.cover-line{text-align:center;text-indent:0;margin:1.2rem 0}
blockquote{margin:1.2rem 2rem;font-style:italic}blockquote footer{font-style:normal;text-align:right}
figure{margin:1.4rem 0;text-align:center}img{max-width:100%}figcaption{font-size:.9rem;color:#555}
.title-page{text-align:center;margin:6rem 0}.title-page h1{page-break-before:avoid;font-size:2.4rem}
nav ol{list-style:none;padding:0}nav a{color:inherit}
@media print{body{max-width:none;background:#fff}}
</style></head><body>
<div class="title-page"><h1>${he(meta.title)}</h1>${meta.subtitle ? `<p class="cover-line"><em>${he(meta.subtitle)}</em></p>` : ''}<p class="cover-line">${he(meta.author)}</p></div>
${toc ? `<nav><h2>Contents</h2><ol>${toc}</ol></nav>` : ''}
${sections.join('\n')}
</body></html>
`
}

// ── RTF ──────────────────────────────────────────────────────────────────────

function rtfEsc(s: string): string {
  let out = ''
  for (const ch of s) {
    const c = ch.codePointAt(0)!
    if (ch === '\\' || ch === '{' || ch === '}') out += '\\' + ch
    else if (ch === '\n') out += '\\line '
    else if (c < 128) out += ch
    else if (c < 0x10000) out += `\\u${c > 32767 ? c - 65536 : c}?`
    else {
      const v = c - 0x10000
      const hi = 0xd800 + (v >> 10)
      const lo = 0xdc00 + (v & 0x3ff)
      out += `\\u${hi - 65536}?\\u${lo - 65536}?`
    }
  }
  return out
}

function rtfRuns(nodes: PMNode[] | undefined): string {
  return (nodes || [])
    .map((n) => {
      if (n.type === 'hardBreak') return '\\line '
      if (n.type !== 'text') return ''
      let t = rtfEsc(n.text)
      if (hasMark(n, 'bold')) t = `{\\b ${t}}`
      if (hasMark(n, 'italic')) t = `{\\i ${t}}`
      if (hasMark(n, 'underline')) t = `{\\ul ${t}}`
      if (hasMark(n, 'strike')) t = `{\\strike ${t}}`
      if (hasMark(n, 'smallCaps')) t = `{\\scaps ${t}}`
      return t
    })
    .join('')
}

function rtfBlocks(nodes: PMNode[]): string {
  const out: string[] = []
  for (const n of nodes) {
    switch (n.type) {
      case 'paragraph':
        out.push(`\\pard\\fi360\\sa0\\qj ${rtfRuns(n.content)}\\par`)
        break
      case 'heading':
        out.push(`\\pard\\sb240\\sa120\\keepn{\\b\\fs${n.attrs.level <= 2 ? 30 : 26} ${rtfRuns(n.content)}}\\par`)
        break
      case 'blockquote':
        out.push(`\\pard\\li720\\ri720\\sa120{\\i ${kids(n).map((p) => rtfRuns(kids(p))).join('\\line ')}}${n.attrs?.attribution ? `\\line ${rtfEsc(String(n.attrs.attribution))}` : ''}\\par`)
        break
      case 'bulletList':
      case 'orderedList':
        kids(n).forEach((li, i) => out.push(`\\pard\\li480\\fi-240 ${n.type === 'bulletList' ? '\\u8226?\\tab ' : `${i + 1}.\\tab `}${kids(li).map((p) => rtfRuns(kids(p))).join(' ')}\\par`))
        break
      case 'sceneBreak':
      case 'horizontalRule':
        out.push('\\pard\\qc\\sb120\\sa120 * * *\\par')
        break
      case 'image':
        out.push(`\\pard\\qc [Image${n.attrs.alt ? ': ' + rtfEsc(n.attrs.alt) : ''}]\\par`)
        break
      default:
        if ('content' in n && n.content) out.push(rtfBlocks(n.content as PMNode[]))
    }
  }
  return out.join('\n')
}

export function docToRtf(project: Project): string {
  const { meta, doc, settings } = project
  const font = settings.typography.fontFamily.replace(/[;{}\\]/g, '')
  const sz = Math.round(settings.typography.fontSize * 2)
  const body = walk(doc)
    .filter((w) => w.block.kind !== 'titlepage' && w.block.kind !== 'copyright')
    .map((w) => {
      const text = w.scenes.map((s) => rtfBlocks(s)).filter(Boolean).join('\n\\pard\\qc\\sb120\\sa120 * * *\\par\n')
      return `${w.label ? `\\pard\\qc\\sb600\\sa300\\page{\\b\\fs40 ${rtfEsc(w.label)}}\\par\n` : ''}${text}`
    })
    .join('\n')
  const title = `\\pard\\qc\\sb3000{\\b\\fs64 ${rtfEsc(meta.title)}}\\par\n${meta.subtitle ? `\\pard\\qc{\\i\\fs32 ${rtfEsc(meta.subtitle)}}\\par\n` : ''}\\pard\\qc\\sb600{\\fs32 ${rtfEsc(meta.author)}}\\par`
  return `{\\rtf1\\ansi\\ansicpg1252\\deff0{\\fonttbl{\\f0\\froman ${font};}}{\\info{\\title ${rtfEsc(meta.title)}}{\\author ${rtfEsc(meta.author)}}}\\viewkind4\\uc1\\f0\\fs${sz}\n${title}\n${body}\n}`
}

// ── Fountain (screenplays) ───────────────────────────────────────────────────

const SLUG = /^(INT|EXT|EST|INT\.?\/EXT|I\/E)[. ]/i
const TRANSITION = /(TO:|FADE OUT\.|FADE IN:|CUT TO BLACK\.)$/

/** Fountain is a plain-text screenplay format that Final Draft, Highland, WriterDuet
 *  and others import. This maps the screenplay layout onto it: bold scene lines
 *  become scene headings, "NAME: line" becomes a character cue, transitions are
 *  right-aligned. Anything it cannot place is written as action. */
export function docToFountain(project: Project): string {
  const { meta, doc } = project
  const out: string[] = [`Title: ${meta.title}`, `Author: ${meta.author}`, meta.description ? `Notes: ${meta.description.replace(/\n/g, ' ')}` : '', '']
  const emitNodes = (nodes: PMNode[]) => {
    for (const n of nodes) {
      if (n.type !== 'paragraph') {
        if ('content' in n && n.content) emitNodes(n.content as PMNode[])
        continue
      }
      const text = plainOf(n.content).trim()
      if (!text) continue
      const bold = (n.content || []).some((c) => hasMark(c, 'bold'))
      const cue = /^([A-Z][A-Z0-9 .'’()-]{0,30}):\s+(.+)$/.exec(text)
      if (SLUG.test(text) || (bold && text === text.toUpperCase())) out.push(SLUG.test(text) ? text.toUpperCase() : '.' + text.toUpperCase(), '')
      else if (TRANSITION.test(text.toUpperCase()) && text === text.toUpperCase()) out.push('> ' + text, '')
      else if (cue) out.push(cue[1], cue[2], '')
      else out.push(text, '')
    }
  }
  for (const w of walk(doc)) {
    if (w.block.kind === 'titlepage' || w.block.kind === 'copyright' || w.block.kind === 'aboutAuthor') continue
    w.scenes.forEach((s) => emitNodes(s))
  }
  return out.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n').trimEnd() + '\n'
}

// ── One file per chapter ─────────────────────────────────────────────────────

const slug = (s: string) => s.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'section'

/** A zip holding each chapter, part and matter section as its own Markdown file, numbered in book order. */
export async function chaptersZip(project: Project): Promise<{ blob: Blob; count: number }> {
  const zip = new JSZip()
  const { doc } = project
  let n = 0
  let ch = 0
  for (const block of doc.blocks) {
    if (block.type === 'chapter') ch++
    if (block.type === 'backmatter' && block.kind === 'endnotes') continue
    if (block.kind === 'titlepage' || block.kind === 'copyright') continue
    const one: BookDoc = { ...doc, blocks: [block] }
    const md = docToMarkdown(one)
    if (!md.trim()) continue
    n++
    const label = labelFor(block, ch) || block.title || 'Section'
    zip.file(`${String(n).padStart(2, '0')}-${slug(label)}.md`, md + '\n')
  }
  return { blob: await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' }), count: n }
}
