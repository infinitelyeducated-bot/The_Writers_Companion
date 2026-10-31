import type { BookDoc } from '../model/types'
import type { FlowItem, Page, PaginationResult } from '../layout/paginate'
import { sceneFlow } from '../layout/paginate'
import { gradientFallback } from '../editor/typeMarks'

// ─────────────────────────────────────────────────────────────────────────────
// EPUB 3 (EPUBCheck-oriented) — generated from the same structured manuscript.
// ─────────────────────────────────────────────────────────────────────────────

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const slug = (s: string, i: number) =>
  'ch' + String(i + 1).padStart(3, '0') + '-' + (s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'section')

function inlineXhtml(nodes: BookDoc['scenes'][string], fnNums: Map<string, number>, endnotes: boolean): string {
  return (nodes || [])
    .map((n) => {
      if (n.type === 'text') {
        let t = esc(n.text)
        const marks = n.marks || []
        if (marks.some((m) => m.type === 'italic')) t = `<em>${t}</em>`
        if (marks.some((m) => m.type === 'bold')) t = `<strong>${t}</strong>`
        if (marks.some((m) => m.type === 'underline')) t = `<span class="u">${t}</span>`
        if (marks.some((m) => m.type === 'strike')) t = `<del>${t}</del>`
        if (marks.some((m) => m.type === 'smallCaps')) t = `<span class="sc">${t}</span>`
        const ff = marks.find((m) => m.type === 'fontFamily')
        if (ff?.attrs?.family) t = `<span style="font-family:'${String(ff.attrs.family).replace(/'/g, '')}',Georgia,serif">${t}</span>`
        const fs = marks.find((m) => m.type === 'fontSize')
        if (fs?.attrs?.size) t = `<span style="font-size:${Number(fs.attrs.size)}pt">${t}</span>`
        const tp = marks.find((m) => m.type === 'textPaint')
        if (tp?.attrs) {
          // readers cannot clip a gradient to text: use its first stop as ink
          const color = (tp.attrs.gradient ? gradientFallback(String(tp.attrs.gradient)) : null) || (tp.attrs.color ? String(tp.attrs.color) : '')
          const opacity = tp.attrs.opacity != null ? Number(tp.attrs.opacity) : 1
          const bits: string[] = []
          if (color) bits.push(`color:${color}`)
          if (opacity !== 1) bits.push(`opacity:${opacity}`)
          if (bits.length) t = `<span style="${bits.join(';')}">${t}</span>`
        }
        const link = marks.find((m) => m.type === 'link')
        if (link) {
          const href = String((link.attrs as { href: string })?.href || '')
          const safe = /^(https?:|mailto:|#)/i.test(href) ? esc(href) : '#'
          t = `<a href="${safe}">${t}</a>`
        }
        return t
      }
      if (n.type === 'hardBreak') return '<br/>'
      if (n.type === 'footnoteRef') {
        const num = fnNums.get(n.attrs.id) || 0
        return endnotes
          ? `<sup><a href="endnotes.xhtml#fn${num}" id="fref${num}" epub:type="noteref">${num}</a></sup>`
          : `<sup class="fn">${num}</sup>`
      }
      return ''
    })
    .join('')
}

type N = BookDoc['scenes'][string]
const kids = (n: unknown): N => (('content' in (n as object)) ? ((n as { content?: N }).content || []) : [])

export function nodesToXhtml(nodes: BookDoc['scenes'][string], fnNums: Map<string, number>, endnotes: boolean, imageHref: (id: string) => string | null): string {
  const out: string[] = []
  const push = (nodes2: BookDoc['scenes'][string]) => {
    for (const n of nodes2) {
      switch (n.type) {
        case 'paragraph':
          out.push(`<p>${inlineXhtml(kids(n), fnNums, endnotes)}</p>`)
          break
        case 'heading':
          out.push(`<h${n.attrs.level}>${inlineXhtml(kids(n), fnNums, endnotes)}</h${n.attrs.level}>`)
          break
        case 'blockquote': {
          const inner = (n.content || [])
            .map((c) => `<p>${inlineXhtml(kids(c), fnNums, endnotes)}</p>`)
            .join('')
          out.push(`<blockquote>${inner}${n.attrs?.attribution ? `<p class="attrib">${esc(n.attrs.attribution)}</p>` : ''}</blockquote>`)
          break
        }
        case 'bulletList':
        case 'orderedList': {
          const tag = n.type === 'bulletList' ? 'ul' : 'ol'
          const items = (n.content || [])
            .map((li) => `<li>${kids(li).map((p) => inlineXhtml(kids(p), fnNums, endnotes)).join('')}</li>`)
            .join('')
          out.push(`<${tag}>${items}</${tag}>`)
          break
        }
        case 'sceneBreak':
        case 'horizontalRule':
          out.push('<p class="sb">❦</p>')
          break
        case 'image': {
          const href = imageHref(n.attrs.imageId)
          if (href) {
            out.push(
              `<figure class="img"><img src="images/${esc(href)}" alt="${esc(n.attrs.alt || '')}"${n.attrs.width ? ` style="width:${n.attrs.width}%"` : ''}/>${n.attrs.caption ? `<figcaption>${esc(n.attrs.caption)}</figcaption>` : ''}</figure>`,
            )
          }
          break
        }
        default:
          if ('content' in n && n.content) push(kids(n))
      }
    }
  }
  push(nodes)
  return out.join('\n')
}

export function xhtmlDoc(title: string, body: string, lang: string, css = 'styles/book.css', bodyClass = ''): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${esc(lang)}" lang="${esc(lang)}">
<head>
  <meta charset="utf-8"/>
  <title>${esc(title)}</title>
  <link rel="stylesheet" type="text/css" href="${css}"/>
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
${body}
</body>
</html>`
}

export interface EpubChapterDoc {
  href: string
  title: string
  body: string
  inNav: boolean
  navLevel: 1 | 2
}

export function buildEpubXhtml(doc: BookDoc, meta: { title: string; author: string; language: string }, opts: { endnotes: boolean; coverHref: string | null; imageHref: (id: string) => string | null }): EpubChapterDoc[] {
  const fnNums = new Map<string, number>()
  let n = 0
  for (const block of doc.blocks) {
    for (const sid of block.sceneIds) {
      const walk = (nodes: BookDoc['scenes'][string]) => {
        for (const node of nodes) {
          if (node.type === 'footnoteRef' && !fnNums.has(node.attrs.id)) fnNums.set(node.attrs.id, ++n)
          else if ('content' in node && node.content) walk(kids(node))
        }
      }
      walk(doc.scenes[sid] || [])
    }
  }

  const chapters: EpubChapterDoc[] = []
  let i = 0
  const cover = opts.coverHref
  if (cover) {
    chapters.push({
      href: 'cover.xhtml',
      title: 'Cover',
      inNav: false,
      navLevel: 1,
      body: `<div class="cover-wrap"><img class="cover" src="images/${esc(cover)}" alt="${esc(meta.title)}"/></div>`,
    })
  }
  // title page
  chapters.push({
    href: 'titlepage.xhtml',
    title: 'Title Page',
    inNav: true,
    navLevel: 1,
    body: `<section class="titlepage" epub:type="titlepage">
  <h1>${esc(meta.title)}</h1>
  <p class="author">${esc(meta.author)}</p>
</section>`,
  })

  for (const block of doc.blocks) {
    if (block.type === 'frontmatter' && (block.kind === 'titlepage' || block.kind === 'copyright')) {
      if (block.kind === 'copyright') {
        const copyrightHref = slug('copyright', i++)
        const body = block.sceneIds.map((sid) => nodesToXhtml(doc.scenes[sid] || [], fnNums, opts.endnotes, opts.imageHref)).join('\n')
        chapters.push({
          href: copyrightHref,
          title: 'Copyright',
          inNav: false,
          navLevel: 1,
          body: `<section epub:type="copyright-page"><p class="cp">Copyright © ${new Date().getFullYear()} ${esc(meta.author)}. All rights reserved.</p>\n${body}</section>`,
        })
      }
      continue
    }
    if (block.type === 'backmatter' && block.kind === 'endnotes') continue
    const href = slug(block.title, i++)
    const body = block.sceneIds.map((sid) => nodesToXhtml(doc.scenes[sid] || [], fnNums, opts.endnotes, opts.imageHref)).join('\n')
    const isChapter = block.type === 'chapter' || block.type === 'part'
    const head = isChapter
      ? block.type === 'part'
        ? `<h1 class="part-title">${esc(block.title)}</h1>`
        : `<h1 class="chapter-title">${esc(block.title)}</h1>`
      : `<h1 class="matter-title">${esc(block.title)}</h1>`
    chapters.push({
      href,
      title: block.title,
      inNav: block.type !== 'frontmatter' || block.kind !== 'copyright',
      navLevel: block.type === 'chapter' && block.sceneIds.length > 1 ? 2 : 1,
      body: `<section epub:type="${block.type === 'chapter' ? 'chapter' : block.type === 'part' ? 'part' : 'chapter'}">\n${head}\n${body}\n</section>`,
    })
  }

  if (opts.endnotes && fnNums.size) {
    const notes = [...fnNums.entries()].sort((a, b) => a[1] - b[1])
    // Every note must link back to the exact marker that sent the reader here,
    // so record which XHTML document each marker was written into.
    const origin = new Map<string, string>()
    for (const c of chapters) {
      for (const m of c.body.matchAll(/id="fref(\d+)"/g)) origin.set('fref' + m[1], c.href)
    }
    const body = notes
      .map(([id, num]) => {
        const back = origin.get(`fref${num}`)
        return `<p class="note" id="fn${num}" epub:type="endnote"><span class="n">${num}.</span> ${esc(doc.footnotes[id] || '')}${
          back ? ` <a class="back" href="${esc(back)}#fref${num}" epub:type="backlink" role="doc-backlink">↩</a>` : ''
        }</p>`
      })
      .join('\n')
    chapters.push({
      href: 'endnotes.xhtml',
      title: 'Notes',
      inNav: true,
      navLevel: 1,
      body: `<section epub:type="endnotes">\n<h1>Notes</h1>\n${body}\n</section>`,
    })
  }
  return chapters
}

export function paginationToEpubNote(_p: PaginationResult) {
  void _p
}

export function pageFlowSanity(pages: Page[], flow: FlowItem[]) {
  void pages
  void flow
  void sceneFlow
}
