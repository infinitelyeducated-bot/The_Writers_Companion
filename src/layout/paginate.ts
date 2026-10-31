import type { BookDoc, PMNode, Project } from '../model/types'
import { anchorKeys } from '../pageArt'

// ─────────────────────────────────────────────────────────────────────────────
// Pagination: block list → measured page boxes.
// This module is pure: it takes a project (doc + settings) and returns pages.
// The preview and the print PDF both render these page descriptors, so what you
// see is what prints.
// ─────────────────────────────────────────────────────────────────────────────

export interface FlowItem {
  /** scene id, or special markers */
  kind: 'h2' | 'h3' | 'p' | 'bq' | 'bq-attr' | 'ul' | 'ol' | 'break' | 'img' | 'fn-note' | 'dropcap-p'
  html?: string
  imgSrc?: string
  imgW?: number
  first?: boolean
  level?: number
  /** heading items: stable id so a TOC row can resolve to a page */
  sectionId?: string
  footnotes?: { num: number; text: string }[]
}

export interface Page {
  index: number // 1-based physical page
  folio: number | null // displayed folio number (arabic/roman handled at render)
  folioType: 'roman' | 'arabic' | null
  side: 'verso' | 'recto'
  type: 'blank' | 'title' | 'copyright' | 'front' | 'part' | 'chapter' | 'body' | 'toc' | 'back' | 'endnotes' | 'plate'
  header: { verso?: string; recto?: string; show: boolean; text?: string }
  items: FlowItem[]
  chapterTitle?: string
  chapterId?: string
  blockId?: string
  isChapterOpen: boolean
  showFolio: boolean
  continuation?: boolean
  /** TOC rows (rendered as real rows, not flow items) */
  tocEntries?: { title: string; level: 1 | 2; pageNo: string; _page?: Page | null }[]
  /** section-heading ids that begin on this page (level-2 TOC targets) */
  sections?: string[]
  /** page graphic (vignette / sidebar / decorative border) */
  graphic?: {
    mode: 'vignette' | 'sidebar'
    src: string
    side: 'verso' | 'recto'
    /** inches */
    widthIn: number
    heightIn: number
    opacity: number
    frame: boolean
  }
  /** full-page plate placed before this page (oriented so it faces the chapter) */
  plate?: { src: string; caption: string | null; forPage: number }
}

export interface TocEntry {
  level: 1 | 2
  title: string
  page: number | null
  blockId: string
  /** level-2 entries: the section heading this row points at */
  sectionId?: string
  folioType?: 'roman' | 'arabic'
}

export interface PaginationResult {
  pages: Page[]
  toc: TocEntry[]
  pageCount: number
  bodyStartPage: number
  gutter: number
  textWidthIn: number
  textHeightIn: number
  warnings: string[]
  /** text anchor per physical page (see pageArt.anchorKeys) */
  anchors: string[]
}

export interface LayoutMetrics {
  pageW: number
  pageH: number
  marginTop: number
  marginBottom: number
  marginInside: number
  marginOutside: number
  gutter: number
}

// ── KDP gutter table (inches), from page count ──────────────────────────────
export function kdpGutter(pageCount: number): number {
  if (pageCount <= 24) return 0
  if (pageCount <= 150) return 0.375
  if (pageCount <= 300) return 0.5
  if (pageCount <= 500) return 0.625
  if (pageCount <= 700) return 0.75
  if (pageCount <= 828) return 0.875
  return 1.0
}

export function measureWidths(project: Project, pageCountForGutter: number): LayoutMetrics {
  const { trim, margins } = project.settings
  const gutter = margins.autoGutter ? kdpGutter(pageCountForGutter) : margins.gutterOverride ?? 0.375
  return {
    pageW: trim.width,
    pageH: trim.height,
    marginTop: margins.top,
    marginBottom: margins.bottom,
    marginInside: margins.inside,
    marginOutside: margins.outside,
    gutter,
  }
}

// ── HTML serialisation of PM nodes (used for measurement + print) ───────────

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** Tab indents are stored as non-breaking spaces so they hold their width in
 *  justified text; output uses ordinary spaces so no odd characters reach the
 *  PDF, DOCX or EPUB. */
export const normaliseIndentation = (s: string): string => s.replace(/\u00a0/g, ' ')

export function inlineHtml(nodes: PMNode[] | undefined, fnNums: Map<string, number>): string {
  if (!nodes) return ''
  return nodes
    .map((n) => {
      if (n.type === 'text') {
        let t = esc(normaliseIndentation(n.text))
        const marks = n.marks || []
        if (marks.some((m) => m.type === 'italic')) t = `<em>${t}</em>`
        if (marks.some((m) => m.type === 'bold')) t = `<strong>${t}</strong>`
        if (marks.some((m) => m.type === 'underline')) t = `<u>${t}</u>`
        if (marks.some((m) => m.type === 'strike')) t = `<s>${t}</s>`
        if (marks.some((m) => m.type === 'smallCaps')) t = `<span class="sc">${t}</span>`
        if (marks.some((m) => m.type === 'indexTerm')) t = `<span data-ix="${esc(normaliseIndentation(n.text)).toLowerCase()}">${t}</span>`
        const ff = marks.find((m) => m.type === 'fontFamily')
        if (ff?.attrs?.family) {
          const fam = String(ff.attrs.family)
          t = `<span data-ff="${fam.replace(/"/g, '')}" style="font-family:'${fam.replace(/'/g, '')}',Georgia,serif">${t}</span>`
        }
        const fs = marks.find((m) => m.type === 'fontSize')
        if (fs?.attrs?.size) t = `<span data-fs="${Number(fs.attrs.size)}" style="font-size:${Number(fs.attrs.size)}pt">${t}</span>`
        const tp = marks.find((m) => m.type === 'textPaint')
        if (tp?.attrs) {
          const color = tp.attrs.color ? String(tp.attrs.color) : ''
          const gradient = tp.attrs.gradient ? String(tp.attrs.gradient) : ''
          const opacity = tp.attrs.opacity != null ? Number(tp.attrs.opacity) : 1
          const bits: string[] = []
          if (gradient) bits.push(`background-image:${gradient}`, '-webkit-background-clip:text', 'background-clip:text', 'color:transparent', '-webkit-text-fill-color:transparent')
          else if (color) bits.push(`color:${color}`)
          if (opacity !== 1) bits.push(`opacity:${opacity}`)
          if (bits.length) t = `<span data-tc="${color}" data-to="${opacity}"${gradient ? ` data-tg="${gradient.replace(/"/g, '')}"` : ''} style="${bits.join(';')}">${t}</span>`
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
        return `<sup class="fn-marker">${num}</sup>`
      }
      return ''
    })
    .join('')
}

export function sceneFlow(doc: BookDoc, sceneId: string, fnNums: Map<string, number>, docFootnotes: Record<string, string>): FlowItem[] {
  const items: FlowItem[] = []
  const nodes = doc.scenes[sceneId] || []
  const collectFns = (ns: PMNode[]): { num: number; text: string }[] => {
    const out: { num: number; text: string }[] = []
    const walk = (list: PMNode[]) => {
      for (const n of list) {
        if (n.type === 'footnoteRef') out.push({ num: fnNums.get(n.attrs.id) || 0, text: docFootnotes[n.attrs.id] || '' })
        else if ('content' in n && n.content) walk(n.content as PMNode[])
      }
    }
    walk(ns)
    return out
  }

  let first = true
  for (const n of nodes) {
    switch (n.type) {
      case 'paragraph': {
        const fns = collectFns([n])
        items.push({ kind: 'p', html: inlineHtml(n.content, fnNums), first, footnotes: fns.length ? fns : undefined })
        first = false
        break
      }
      case 'heading':
        items.push({
          kind: n.attrs.level === 2 ? 'h2' : 'h3',
          html: inlineHtml(n.content, fnNums),
          level: n.attrs.level,
          // section headings can be listed in a technical book's contents
          sectionId: n.attrs.level === 2 ? `sec_${sceneId}_${items.length}` : undefined,
        })
        first = true
        break
      case 'blockquote': {
        const fns = collectFns(n.content || [])
        items.push({ kind: 'bq', html: (n.content || []).map((c) => inlineHtml((c as { content?: PMNode[] }).content, fnNums)).join('<br/><br/>'), footnotes: fns.length ? fns : undefined })
        if (n.attrs?.attribution) items.push({ kind: 'bq-attr', html: esc(n.attrs.attribution) })
        first = true
        break
      }
      case 'bulletList':
      case 'orderedList': {
        const lis = (n.content || []).map((li) =>
          ((li as { content?: PMNode[] }).content || [])
            .map((p) => inlineHtml((p as { content?: PMNode[] }).content, fnNums))
            .join(' '),
        )
        items.push({
          kind: n.type === 'bulletList' ? 'ul' : 'ol',
          html: lis.map((t) => `<li>${t}</li>`).join(''),
          footnotes: collectFns(n.content || []).length ? collectFns(n.content || []) : undefined,
        })
        first = true
        break
      }
      case 'sceneBreak':
      case 'horizontalRule':
        items.push({ kind: 'break' })
        first = true
        break
      case 'image':
        items.push({ kind: 'img', imgSrc: n.attrs.imageId, imgW: n.attrs.width || 100, html: esc(n.attrs.caption || '') })
        first = true
        break
      default:
        break
    }
  }
  return items
}

// ── Measurement ─────────────────────────────────────────────────────────────

export class Measurer {
  el: HTMLDivElement
  host: HTMLDivElement
  constructor(widthIn: number, fontSize: number, lineHeight: number, fontFamily: string, indent: number, justify: boolean, hyphenate: boolean, paragraphSpacing: number) {
    const host = document.createElement('div')
    host.className = 'measure-host'
    host.style.cssText = `position:absolute;left:-10000px;top:0;width:${widthIn}in;font-family:'${fontFamily}',Georgia,serif;font-size:${fontSize}pt;line-height:${lineHeight};text-align:${justify ? 'justify' : 'left'};hyphens:${hyphenate ? 'auto' : 'manual'};`
    host.setAttribute('data-measure', '1')
    this.el = document.createElement('div')
    this.el.className = 'page-body measuring'
    this.el.innerHTML = Measurer.CSS
    host.appendChild(this.el)
    document.body.appendChild(host)
    this.host = host
    this.baseWidthIn = widthIn
    this.indent = indent
    this.paragraphSpacing = paragraphSpacing
  }
  indent = 1.5
  paragraphSpacing = 0
  baseWidthIn = 0

  setTextWidth(widthIn: number) {
    if (!this.host) return
    this.host.style.width = `${widthIn}in`
    this.el.style.width = `${widthIn}in`
  }

  itemHtml(item: FlowItem, first: boolean): string {
    switch (item.kind) {
      case 'p': {
        // preserve leading spaces from a Tab indent when measuring
        const html = (item.html || '').replace(/^ +/, (sp) => sp.replace(/ /g, '&nbsp;'))
        return `<p class="${first ? 'no-indent' : ''}" style="text-indent:${first ? 0 : this.indent}em;margin:0 0 ${this.paragraphSpacing}em">${html}</p>`
      }
      case 'h2':
        return `<h2 class="sec-h2">${item.html || ''}</h2>`
      case 'h3':
        return `<h3 class="sec-h3">${item.html || ''}</h3>`
      case 'bq':
        return `<blockquote>${item.html || ''}</blockquote>`
      case 'bq-attr':
        return `<p class="bq-attr">${item.html || ''}</p>`
      case 'ul':
        return `<ul>${item.html || ''}</ul>`
      case 'ol':
        return `<ol>${item.html || ''}</ol>`
      case 'break':
        return `<div class="sb">❦</div>`
      case 'img':
        return `<figure class="img"><div class="img-ph" style="width:${item.imgW}%;aspect-ratio:4/3"></div>${item.html ? `<figcaption>${item.html}</figcaption>` : ''}</figure>`
      default:
        return ''
    }
  }

  /** Book rules that affect height must be present while measuring, otherwise
   *  measured heights drift from rendered heights (especially footnotes). */
  static readonly CSS = `<style>
    .measuring p { margin: 0; }
    .measuring .sec-h2 { font-size: 1.25em; font-weight: normal; text-align: center; margin: 1.4em 0 0.9em; text-indent: 0; }
    .measuring .sec-h3 { font-size: 1.05em; font-weight: bold; margin: 1.2em 0 0.6em; text-indent: 0; }
    .measuring blockquote { margin: 1em 1.5em; font-style: italic; }
    .measuring ul, .measuring ol { margin: 0.8em 0 0.8em 1.4em; padding: 0; }
    .measuring li { margin: 0.25em 0; }
    .measuring .sb { text-align: center; margin: 1.1em 0; letter-spacing: 0.5em; }
    .measuring figure.img { margin: 1.2em 0; text-align: center; }
    .measuring .img-ph { height: 1.6in; margin: 0 auto; }
    .measuring figcaption { font-size: 0.85em; font-style: italic; margin-top: 0.4em; text-align: center; }
    .measuring .fn-block { border-top: 0.5pt solid #999; padding-top: 0.28em; margin-top: 0.3em; }
    .measuring .fn-body { font-size: 0.78em; line-height: 1.28; }
    .measuring .fn-line { margin: 0 0 0.25em; padding: 0; text-align: left; text-indent: 0; }
    .measuring .bq-attr { text-align: right; font-size: 0.92em; margin: 0.2em 1.5em 1em 0; }
    .measuring .toc-head { font-size: 1.5em; font-weight: normal; text-align: center; margin: 0 0 1.6em; }
    .measuring .toc-row { display: flex; align-items: baseline; column-gap: 0.3em; margin: 0 0 0.55em; }
    .measuring .toc-p2 { min-width: 1.6em; }
  </style>`

  measure(html: string): number {
    // Keep the book-rule <style> block. Replacing innerHTML with just the
    // fragment would drop it, so later rows (TOC, footnotes) measure without
    // the same CSS the page will actually use.
    this.el.innerHTML = Measurer.CSS + html
    return this.el.getBoundingClientRect().height
  }

  /**
   * Split a paragraph at the last line that fits `availPx`.
   *
   * ProseMirror splits text nodes at spaces, so the HTML is `<w0> <w1> <w2>…`
   * where a token starting with a space begins a new word. Binary-search the
   * token count, then grow one token at a time to the largest prefix that fits,
   * so the remainder starts at a word boundary with no doubled spaces.
   */
  splitParagraph(html: string, availPx: number, first: boolean): [string | null, string | null] {
    if (availPx <= 0) return [null, html]
    const tokens = html.split(/(?= )/)
    const build = (k: number) => this.itemHtml({ kind: 'p', html: tokens.slice(0, k).join('').trimEnd() }, first)
    const fits = (k: number) => k > 0 && this.measure(build(k)) <= availPx
    if (fits(tokens.length)) return [html, null]
    if (!fits(1)) return [null, html]
    let lo = 1
    let hi = tokens.length
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2)
      if (fits(mid)) lo = mid
      else hi = mid - 1
    }
    while (lo < tokens.length && fits(lo + 1)) lo++
    const fit = tokens.slice(0, lo).join('').trimEnd()
    const rest = tokens.slice(lo).join('').trimStart()
    if (!rest) return [html, null]
    return [fit, rest]
  }

  destroy() {
    this.el.parentElement?.remove()
  }
}

// ── Main pagination ─────────────────────────────────────────────────────────

export interface PaginateOptions {
  project: Project
  imageResolver: (id: string) => string | undefined
}

export function paginate(
  project: Project,
  imageResolver: (id: string) => string | undefined,
  naturalSize: (id: string) => { w: number; h: number } | undefined = () => undefined,
): PaginationResult {
  const { doc, settings } = project
  const warnings: string[] = []
  const typ = settings.typography

  // First pass: build all flow items & count footnotes
  const fnNums = new Map<string, number>()
  let fnCounter = 0
  for (const block of doc.blocks) {
    for (const sid of block.sceneIds) {
      const walk = (ns: PMNode[]) => {
        for (const n of ns) {
          if (n.type === 'footnoteRef' && !fnNums.has(n.attrs.id)) fnNums.set(n.attrs.id, ++fnCounter)
          else if ('content' in n && n.content) walk(n.content as PMNode[])
        }
      }
      walk(doc.scenes[sid] || [])
    }
  }

  // margins/gutter: iterate twice (gutter depends on page count)
  const pass = (gutterPageCount: number) => runPagination(project, imageResolver, fnNums, gutterPageCount, warnings, naturalSize)
  let result = pass(200)
  result = pass(result.pageCount)
  if (result.pageCount !== pass(result.pageCount).pageCount) result = pass(result.pageCount)

  // image resolution warnings
  for (const block of doc.blocks) {
    for (const sid of block.sceneIds) {
      for (const n of doc.scenes[sid] || []) {
        if (n.type === 'image' && !imageResolver(n.attrs.imageId)) warnings.push(`An image in “${block.title}” is missing from the library.`)
      }
    }
  }
  void typ
  return result
}

function runPagination(
  project: Project,
  imageResolver: (id: string) => string | undefined,
  fnNums: Map<string, number>,
  gutterPageCount: number,
  warnings: string[],
  naturalSize: (id: string) => { w: number; h: number } | undefined,
): PaginationResult {
  const { doc, settings, meta } = project
  const typ = settings.typography
  const m = measureWidths(project, gutterPageCount)
  const textWidthIn = m.pageW - m.marginInside - m.marginOutside - m.gutter
  const textHeightIn = m.pageH - m.marginTop - m.marginBottom
  const headSpaceIn = settings.runningHeads.enabled ? 0.28 : 0
  const footSpaceIn = settings.folios.enabled ? 0.3 : 0
  const bodyHeightIn = textHeightIn - headSpaceIn - footSpaceIn

  const px = (inches: number) => inches * 96
  const availBody = px(bodyHeightIn)

  const measurer = new Measurer(
    textWidthIn,
    typ.fontSize,
    typ.lineHeight,
    typ.fontFamily,
    typ.firstLineIndent,
    typ.justify,
    typ.hyphenate,
    typ.paragraphSpacing,
  )

  const pages: Page[] = []
  const toc: TocEntry[] = []
  let arabicCount = 0
  let bodyStartPage = 0

  const sideFor = (n: number): 'verso' | 'recto' => (n % 2 === 1 ? 'recto' : 'verso')

  const pushPage = (p: Omit<Page, 'index' | 'side' | 'folio' | 'folioType' | 'showFolio'> & Partial<Page>) => {
    const index = pages.length + 1
    const page: Page = {
      index,
      side: sideFor(index),
      folio: null,
      folioType: null,
      showFolio: false,
      ...p,
    } as Page
    pages.push(page)
    return page
  }

  const pushBlank = (type: Page['type'] = 'blank') => {
    const index = pages.length + 1
    const page: Page = {
      index,
      side: sideFor(index),
      folio: null,
      folioType: null,
      showFolio: false,
      type,
      header: { show: false },
      items: [],
      isChapterOpen: false,
    }
    pages.push(page)
    return page
  }

  const ensureRecto = () => {
    const nextIndex = pages.length + 1
    if (nextIndex % 2 === 0) pushBlank('blank')
  }

  /**
   * Bring an opening to a right-hand page.
   * `rectoStart` is the rule; `blankPageBetween` is the permission to insert a
   * blank to honour it. If both are on, a verso next-page becomes a blank and
   * the opening lands on the following recto. If rectoStart is on but blanks
   * are forbidden, the opening still starts a new page — it just may be a verso.
   */
  const ensureOpeningRecto = () => {
    if (!settings.chapterOpening.rectoStart) return
    const nextIndex = pages.length + 1
    if (nextIndex % 2 === 0 && settings.chapterOpening.blankPageBetween) pushBlank('blank')
  }

  // ── Front matter ───────────────────────────────────────────────────────────
  const frontBlocks = doc.blocks.filter((b) => b.type === 'frontmatter')
  for (const block of frontBlocks) {
    const isTitle = block.kind === 'titlepage'
    const isCopyright = block.kind === 'copyright'
    if (isTitle) {
      // title page always page 1 recto
      if (pages.length > 0) ensureRecto()
      const page = pushPage({
        type: 'title',
        header: { show: false },
        items: [],
        blockId: block.id,
        isChapterOpen: true,
      })
      page.chapterTitle = block.title
      continue
    }
    if (isCopyright) {
      pushPage({
        type: 'copyright',
        header: { show: false },
        items: [],
        blockId: block.id,
        isChapterOpen: true,
      })
      continue
    }
    if (settings.chapterOpening.startOnNewPage) ensureOpeningRecto()
    const flow = block.sceneIds.flatMap((sid) => sceneFlow(doc, sid, fnNums, doc.footnotes))
    flowIntoPages({
      pages, pushPage, pushBlank, availBody, measurer, flow,
      header: { show: false },
      type: 'front',
      isChapterOpen: true,
      blockId: block.id,
      blockTitle: block.title,
      settings, doc, imageResolver, textWidthIn,
    })
    if (settings.toc.includeFrontMatter) toc.push({ level: 1, title: block.title, page: null, blockId: block.id })
  }

  // ── TOC pages are reserved here so body folios account for them ────────────
  // Start with one page; the layout pass below inserts more if the contents
  // run long, before any folio is handed out.
  let tocPageIndices: number[] = []
  if (settings.toc.enabled) {
    ensureRecto()
    tocPageIndices = [pages.length]
    pushPage({ type: 'toc', header: { show: false }, items: [], isChapterOpen: true })
  }

  // ── Body ───────────────────────────────────────────────────────────────────
  const bodyBlocks = doc.blocks.filter((b) => b.type === 'chapter' || b.type === 'part')
  bodyStartPage = pages.length + 1
  const bodyStartIndex = pages.length
  let currentPartTitle = ''

  for (const block of bodyBlocks) {
    const prev = pages[pages.length - 1]
    const needsBlank = !prev || (!prev.isChapterOpen && prev.type !== 'blank')
    if (block.type === 'part') {
      if (settings.chapterOpening.startOnNewPage && needsBlank) ensureOpeningRecto()
      const page = pushPage({
        type: 'part',
        header: { show: false },
        items: [],
        blockId: block.id,
        isChapterOpen: true,
        chapterTitle: block.title,
      })
      page.chapterTitle = block.title
      currentPartTitle = block.title
      toc.push({ level: 1, title: block.title, page: null, blockId: block.id })
      const flow = block.sceneIds.flatMap((sid) => sceneFlow(doc, sid, fnNums, doc.footnotes))
      if (flow.length) {
        flowIntoPages({
          pages, pushPage, pushBlank, availBody, measurer, flow, header: { show: false }, type: 'body',
          isChapterOpen: false, blockId: block.id, blockTitle: block.title, settings, doc, imageResolver, textWidthIn,
          startOnExistingPage: true,
        })
      }
      continue
    }

    // chapter
    if (settings.chapterOpening.startOnNewPage && needsBlank) ensureOpeningRecto()
    const flow = block.sceneIds.flatMap((sid) => sceneFlow(doc, sid, fnNums, doc.footnotes))
    const { page } = flowIntoPages({
      pages, pushPage, pushBlank, availBody, measurer, flow,
      header: { show: false },
      type: 'chapter',
      isChapterOpen: true,
      blockId: block.id,
      blockTitle: block.title,
      settings, doc, imageResolver, textWidthIn,
      chapterNumber: chapterIndex(doc, block.id),
      partTitle: currentPartTitle,
    })
    page.chapterTitle = block.title
    toc.push({ level: 1, title: block.title, page: null, blockId: block.id })
    if (settings.toc.depth === 'sections') {
      // One row per level-2 heading, indented under its chapter. The page is
      // filled in later: the heading may have flowed onto a continuation page.
      for (const sid of block.sceneIds) {
        for (const item of sceneFlow(doc, sid, fnNums, doc.footnotes)) {
          if (item.kind !== 'h2' || !item.sectionId) continue
          const label = item.html ? item.html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim() : ''
          if (label) toc.push({ level: 2, title: label, page: null, blockId: block.id, sectionId: item.sectionId })
        }
      }
    }
  }

  // ── Back matter ────────────────────────────────────────────────────────────
  const backBlocks = doc.blocks.filter((b) => b.type === 'backmatter')
  const endnotes = collectEndnotes(doc, fnNums)
  for (const block of backBlocks) {
    if (block.kind === 'endnotes') {
      if (settings.footnoteMode !== 'end' || endnotes.length === 0) continue
      ensureOpeningRecto()
      const flow: FlowItem[] = endnotes.map((e) => ({ kind: 'fn-note', html: `<span class="en-num">${e.num}</span> ${esc(e.text)}`, first: false }))
      flowIntoPages({
        pages, pushPage, pushBlank, availBody, measurer, flow, header: { show: false }, type: 'endnotes',
        isChapterOpen: true, blockId: block.id, blockTitle: block.title || 'Notes', settings, doc, imageResolver, textWidthIn,
      })
      toc.push({ level: 1, title: block.title || 'Notes', page: null, blockId: block.id })
      continue
    }
    ensureOpeningRecto()
    const flow = block.sceneIds.flatMap((sid) => sceneFlow(doc, sid, fnNums, doc.footnotes))
    flowIntoPages({
      pages, pushPage, pushBlank, availBody, measurer, flow, header: { show: false }, type: 'back',
      isChapterOpen: true, blockId: block.id, blockTitle: block.title, settings, doc, imageResolver, textWidthIn,
    })
    toc.push({ level: 1, title: block.title, page: null, blockId: block.id })
  }

  // ── Extra TOC pages (layout only; folios come later) ───────────────────────
  // The contents is laid out last so a long contents grows instead of being
  // truncated. Folios are not assigned yet — rows keep a pointer to the page
  // object and the printed number is filled in after numbering.
  if (settings.toc.enabled && tocPageIndices.length) {
    const sectionPage = new Map<string, Page>()
    for (const pg of pages) for (const sid of pg.sections || []) if (!sectionPage.has(sid)) sectionPage.set(sid, pg)
    const rowPage = new Map<TocEntry, Page | null>()
    for (const entry of toc) {
      rowPage.set(entry, entry.sectionId ? sectionPage.get(entry.sectionId) || null : pages.find((pg) => pg.blockId === entry.blockId) || null)
    }
    const rowHtml = (t: TocEntry) => {
      const cls = t.level === 2 ? 'toc-row lvl2' : 'toc-row'
      return `<div class="${cls}"><span class="toc-t2">${esc(t.title)}</span><span class="toc-fill"></span><span class="toc-p2">000</span></div>`
    }

    const headH = measurer.measure('<h1 class="toc-head">Contents</h1>')
    const chunks: TocEntry[][] = []
    let cur: TocEntry[] = []
    let acc = headH
    for (const t of toc) {
      const h = measurer.measure(rowHtml(t))
      if (cur.length && acc + h > availBody) {
        chunks.push(cur)
        cur = []
        acc = 0
      }
      cur.push(t)
      acc += h
    }
    if (cur.length || chunks.length === 0) chunks.push(cur)

    const firstIdx = tocPageIndices[0]
    for (let k = 1; k < chunks.length; k++) {
      pages.splice(firstIdx + k, 0, {
        index: 0,
        side: 'verso',
        folio: null,
        folioType: null,
        showFolio: false,
        type: 'toc',
        header: { show: false },
        items: [],
        isChapterOpen: false,
        continuation: true,
      })
    }
    if (chunks.length > 1) {
      pages.forEach((pg, i) => {
        pg.index = i + 1
        pg.side = sideFor(i + 1)
      })
    }
    const firstToc = pages[firstIdx]
    if (firstToc) {
      firstToc.tocEntries = chunks[0].map((t) => ({ title: t.title, level: t.level, pageNo: '', _page: rowPage.get(t) || null }))
      firstToc.items = []
      firstToc.chapterTitle = 'Contents'
    }
    for (let k = 1; k < chunks.length; k++) {
      const tp = pages[firstIdx + k]
      if (!tp) continue
      tp.tocEntries = chunks[k].map((t) => ({ title: t.title, level: t.level, pageNo: '', _page: rowPage.get(t) || null }))
      tp.items = []
      tp.chapterTitle = 'Contents'
    }
    tocPageIndices = chunks.map((_, k) => firstIdx + k)
  }

  // ── Folios ─────────────────────────────────────────────────────────────────
  // The contents may have added pages, so locate the body again by its first
  // block rather than trusting an index captured before insertion.
  const firstBody = pages.findIndex((pg) => pg.type === 'chapter' || pg.type === 'part' || pg.type === 'body')
  const bodyStart = firstBody >= 0 ? firstBody : bodyStartIndex
  bodyStartPage = bodyStart + 1
  // Front matter (after title & copyright): lowercase roman.
  if (settings.folios.romanFrontMatter) {
    let r = 0
    for (const p of pages.slice(0, bodyStart)) {
      if (p.type === 'title' || p.type === 'copyright' || p.type === 'blank') continue
      r++
      p.folio = r
      p.folioType = 'roman'
      p.showFolio = settings.folios.enabled && !(p.isChapterOpen && settings.folios.suppressOnChapterOpen)
    }
  }
  // Body + back matter: arabic, restarting at 1.
  for (const p of pages.slice(bodyStart)) {
    if (p.type === 'blank') continue
    arabicCount++
    p.folio = arabicCount
    p.folioType = 'arabic'
    const suppressOpen = p.isChapterOpen && settings.folios.suppressOnChapterOpen
    const suppressPart = p.type === 'part' && settings.folios.suppressOnPartPages
    p.showFolio = settings.folios.enabled && !suppressOpen && !suppressPart
  }

  // ── Running heads ──────────────────────────────────────────────────────────
  let lastChapter = ''
  let lastPart = ''
  for (const p of pages) {
    if (p.type === 'part') lastPart = p.chapterTitle || ''
    if (p.type === 'chapter') lastChapter = p.chapterTitle || ''
    if (!settings.runningHeads.enabled || p.type === 'blank' || p.type === 'title' || p.type === 'copyright') {
      p.header = { show: false }
      continue
    }
    if (p.isChapterOpen && settings.runningHeads.suppressOnChapterOpen) {
      p.header = { show: false }
      continue
    }
    const isMatter = p.type === 'front' || p.type === 'toc' || p.type === 'back' || p.type === 'endnotes'
    if (isMatter && settings.runningHeads.suppressOnFrontMatter) {
      p.header = { show: false }
      continue
    }
    // Front/back matter running heads repeat the section title on both sides.
    const sectionTitle = isMatter ? (doc.blocks.find((b) => b.id === p.blockId)?.title || '') : ''
    const verso =
      sectionTitle ? sectionTitle
      : settings.runningHeads.verso === 'bookTitle' ? meta.title
      : settings.runningHeads.verso === 'author' ? meta.author
      : ''
    const recto =
      sectionTitle ? sectionTitle
      : settings.runningHeads.recto === 'chapter' ? (lastChapter || lastPart || meta.title)
      : settings.runningHeads.recto === 'part' ? (lastPart || meta.title)
      : settings.runningHeads.recto === 'bookTitle' ? meta.title
      : ''
    p.header = { show: true, verso, recto }
  }

  applyPageGraphics({ pages, settings, imageResolver, naturalSize, warnings })

  // Plates splice pages in after numbering. Re-index, re-side, and re-number
  // so a plate does not steal the chapter's folio or leave the TOC pointing
  // at a page that has since shifted.
  if (pages.some((pg) => pg.type === 'plate')) {
    pages.forEach((pg, i) => {
      pg.index = i + 1
      pg.side = sideFor(i + 1)
    })
    const bodyNow = pages.findIndex((pg) => pg.type === 'chapter' || pg.type === 'part' || pg.type === 'body')
    const bodyAt = bodyNow >= 0 ? bodyNow : 0
    bodyStartPage = bodyAt + 1
    let r = 0
    let a = 0
    for (const p of pages) {
      if (p.type === 'blank' || p.type === 'title' || p.type === 'copyright') {
        p.folio = null
        p.folioType = null
        p.showFolio = false
        continue
      }
      if (p.type === 'plate') {
        p.folio = null
        p.folioType = null
        p.showFolio = false
        p.header = { show: false }
        continue
      }
      if (pages.indexOf(p) < bodyAt) {
        if (settings.folios.romanFrontMatter) {
          r++
          p.folio = r
          p.folioType = 'roman'
          p.showFolio = settings.folios.enabled && !(p.isChapterOpen && settings.folios.suppressOnChapterOpen)
        }
      } else {
        a++
        p.folio = a
        p.folioType = 'arabic'
        const suppressOpen = p.isChapterOpen && settings.folios.suppressOnChapterOpen
        const suppressPart = p.type === 'part' && settings.folios.suppressOnPartPages
        p.showFolio = settings.folios.enabled && !suppressOpen && !suppressPart
      }
    }
  }

  const folioText = (pg: Page | null | undefined) => {
    if (!pg || pg.folio == null) return ''
    return pg.folioType === 'roman' ? ROMAN_UPPER(pg.folio) : String(pg.folio)
  }
  for (const pg of pages) {
    if (pg.type !== 'toc' || !pg.tocEntries) continue
    for (const row of pg.tocEntries) {
      const target = (row as { _page?: Page | null })._page
      row.pageNo = folioText(target)
      delete (row as { _page?: Page | null })._page
    }
  }
  for (const entry of toc) {
    const pg = entry.sectionId
      ? pages.find((p) => (p.sections || []).includes(entry.sectionId!))
      : pages.find((p) => p.blockId === entry.blockId)
    entry.page = pg?.index ?? null
    entry.folioType = pg?.folioType ?? undefined
  }

  // ── warnings ───────────────────────────────────────────────────────────────
  if (pages.length === 0) warnings.push('The manuscript has no content to paginate.')
  const pageCount = pages.length
  if (settings.margins.autoGutter) {
    const needed = kdpGutter(pageCount)
    if (needed === 0 && pageCount < 24) warnings.push('Books under 24 pages have no minimum gutter, but KDP requires at least 24 pages for a paperback spine.')
  }
  if (settings.bleed && !settings.cropMarks) warnings.push('Bleed is enabled: ensure images extend into the bleed area and export with crop marks for the printer.')
  if (pageCount > 800) warnings.push(`Interior is ${pageCount} pages — above KDP's 828-page limit for a single volume.`)

  measurer.destroy()
  return { pages, toc, pageCount, bodyStartPage, gutter: m.gutter, textWidthIn, textHeightIn, warnings, anchors: anchorKeys(pages) }
}

function ROMAN_UPPER(n: number): string {
  const map: [number, string][] = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]
  let out = ''
  let v = n
  for (const [num, sym] of map) while (v >= num) { out += sym; v -= num }
  return out
}

function chapterIndex(doc: BookDoc, blockId: string): number {
  const chapters = doc.blocks.filter((b) => b.type === 'chapter')
  return chapters.findIndex((b) => b.id === blockId) + 1
}

function collectEndnotes(doc: BookDoc, fnNums: Map<string, number>) {
  const out: { num: number; text: string; id: string }[] = []
  for (const [id, num] of fnNums) {
    out.push({ id, num, text: doc.footnotes[id] || '' })
  }
  return out.sort((a, b) => a.num - b.num)
}

interface FlowIntoArgs {
  pages: Page[]
  pushPage: (p: Omit<Page, 'index' | 'side' | 'folio' | 'folioType' | 'showFolio'> & Partial<Page>) => Page
  pushBlank: (type?: Page['type']) => Page
  availBody: number
  measurer: Measurer
  flow: FlowItem[]
  header: Page['header']
  type: Page['type']
  isChapterOpen: boolean
  blockId: string
  blockTitle: string
  settings: Project['settings']
  doc: BookDoc
  imageResolver: (id: string) => string | undefined
  startOnExistingPage?: boolean
  chapterNumber?: number
  partTitle?: string
  /** sidebar fraction of the text block; shrinks the measure for that page */
  sidebarFraction?: number
  textWidthIn: number
}

/** Which pages receive a graphic, given the page list so far. */
function pageGraphicFor(
  page: Page,
  settings: import('../model/types').BookSettings,
  pageNo: number,
  imageResolver: (id: string) => string | undefined,
  naturalSize: (id: string) => { w: number; h: number } | undefined,
): Page['graphic'] | undefined {
  const g = settings.graphics
  if (!g || g.mode === 'off' || g.mode === 'plate') return undefined
  // never decorate blanks, title/copyright, TOC or part pages
  if (page.type === 'blank' || page.type === 'title' || page.type === 'copyright' || page.type === 'toc' || page.type === 'part') return undefined
  const isMatter = page.type === 'front' || page.type === 'back' || page.type === 'endnotes'
  if (page.isChapterOpen && !g.onChapterOpen) return undefined
  if (isMatter && !g.onMatter) return undefined
  if (g.vignetteEvery > 1 && pageNo % g.vignetteEvery !== 0) return undefined

  if (g.mode === 'sidebar') {
    const id = g.sidebarImageId
    const src = id ? imageResolver(id) : undefined
    if (!src) return undefined
    return {
      mode: 'sidebar',
      src,
      side: page.side,
      widthIn: 0,
      heightIn: 0,
      opacity: g.sidebarOpacity ?? 1,
      frame: g.sidebarFrame,
    }
  }

  // vignette
  const id = g.vignetteImageId
  const src = id ? imageResolver(id) : undefined
  if (!src) return undefined
  const nat = (id && naturalSize(id)) || { w: 1200, h: 800 }
  const widthIn = g.vignetteSize * (nat.w / nat.h)
  return {
    mode: 'vignette',
    src,
    side: page.side,
    widthIn,
    heightIn: g.vignetteSize,
    opacity: g.vignetteOpacity,
    frame: false,
  }
}

function measureOpening(measurer: Measurer, title: string, settings: Project['settings'], isPart: boolean): number {
  const typ = settings.typography
  const fs = typ.fontSize
  let h = 0
  if (isPart) {
    h += measurer.measure(
      `<div class="open-chrome part-open"><div class="open-label">Part One</div><h1>${esc(title)}</h1><div class="orn">${settings.chapterOpening.ornament !== 'none' ? '⁂' : ''}</div></div>`,
    )
  } else {
    h += measurer.measure(
      `<div class="open-chrome"><div class="open-label">Chapter One</div><h1>${esc(title)}</h1><div class="orn">${settings.chapterOpening.ornament !== 'none' ? '⁂' : ''}</div></div>`,
    )
  }
  // the cap takes two lines; the opening chrome already reserves one, so add
  // one more rather than an arbitrary fraction of the type size
  if (settings.chapterOpening.dropCap) h += fs * typ.lineHeight
  return h
}

function flowIntoPages(a: FlowIntoArgs): { page: Page; lastPage: Page } {
  const { pages, pushPage, measurer, flow, blockId, blockTitle, settings, imageResolver } = a

  let page: Page | null = null
  let used = 0
  let usedFootnotes = 0
  let footnoteQueue: { num: number; text: string }[] = []
  let pageFns: { num: number; text: string }[] = []

  const newPage = (open: boolean) => {
    const type: Page['type'] = open ? a.type : a.type === 'chapter' ? 'body' : a.type
    const nextNo = pages.length + 1
    const g = settings.graphics
    const sidebarHere =
      !!a.sidebarFraction &&
      g?.mode === 'sidebar' &&
      !!g.sidebarImageId &&
      type !== 'blank' &&
      type !== 'title' &&
      type !== 'copyright' &&
      type !== 'toc' &&
      type !== 'part' &&
      (!open || g.onChapterOpen) &&
      (g.vignetteEvery <= 1 || nextNo % g.vignetteEvery === 0) &&
      (type === 'front' || type === 'back' || type === 'endnotes' ? g.onMatter : true)
    measurer.setTextWidth(sidebarHere ? a.textWidthIn - sidebarIn : a.textWidthIn)
    page = pushPage({
      type,
      header: a.header,
      items: [],
      blockId,
      isChapterOpen: open,
      continuation: !open,
    })
    page.chapterTitle = blockTitle
    used = 0
    usedFootnotes = 0
    pageFns = []
    if (open) used += measureOpening(measurer, blockTitle, settings, a.type === 'part')
    return page
  }

  const sidebarIn = a.sidebarFraction ? a.textWidthIn * a.sidebarFraction : 0
  const avail = () => a.availBody - usedFootnotes

  const fnBlockHeight = (fns: { num: number; text: string }[]) => {
    if (!fns.length) return 0
    const inner = fns.map((f) => `<div class="fn-line">${f.num} ${esc(f.text)}</div>`).join('')
    return measurer.measure(`<div class="fn-block"><div class="fn-body">${inner}</div></div>`)
  }
  const flushFootnotes = () => {
    if (settings.footnoteMode !== 'page' || !footnoteQueue.length || !page) return
    pageFns.push(...footnoteQueue)
    footnoteQueue = []
    usedFootnotes = fnBlockHeight(pageFns)
  }
  /** Will `n` more footnote notes still fit under the text already on the page? */
  const notesFit = (extra: { num: number; text: string }[]) => {
    if (settings.footnoteMode !== 'page' || !extra.length) return true
    return fnBlockHeight([...pageFns, ...extra]) + used <= a.availBody
  }

  if (a.startOnExistingPage && pages.length > 0 && pages[pages.length - 1].type === 'part') {
    page = pages[pages.length - 1]
    used = 0
  } else {
    newPage(a.isChapterOpen)
  }

  for (let i = 0; i < flow.length; i++) {
    const item = flow[i]
    const html = measurer.itemHtml(item, !!item.first)
    const h = measurer.measure(html)
    const remaining = avail() - used

    const fits = h <= remaining && notesFit(item.footnotes || [])
    if (fits) {
      if (item.kind === 'img') {
        page!.items.push({ ...item, imgSrc: item.imgSrc ? imageResolver(item.imgSrc) || '' : '' })
      } else {
        page!.items.push(item)
      }
      if (item.sectionId) (page!.sections ||= []).push(item.sectionId)
      used += h
      if (item.footnotes) {
        footnoteQueue.push(...item.footnotes)
        flushFootnotes()
      }
      continue
    }

    if (item.kind === 'p' && remaining > 30) {
      const [fit, rest] = measurer.splitParagraph(item.html || '', remaining, !!item.first)
      if (fit) {
        page!.items.push({ ...item, kind: 'p', html: fit, first: item.first })
        newPage(false)
        if (rest) flow.splice(i + 1, 0, { ...item, html: rest, first: false })
        continue
      }
    }
    // An item taller than a whole page (a large image, a dense list) must still
    // land somewhere. Placing it on an empty continuation page stops us from
    // inserting blanks forever.
    if (page!.items.length === 0) {
      if (item.kind === 'img') {
        page!.items.push({ ...item, imgSrc: item.imgSrc ? imageResolver(item.imgSrc) || '' : '' })
      } else {
        page!.items.push(item)
      }
      if (item.sectionId) (page!.sections ||= []).push(item.sectionId)
      used += h
      if (item.footnotes) {
        footnoteQueue.push(...item.footnotes)
        flushFootnotes()
      }
      continue
    }
    newPage(false)
    i--
  }

  measurer.setTextWidth(measurer.baseWidthIn)

  if (settings.footnoteMode === 'page' && pageFns.length && page) {
    page.items.push({
      kind: 'fn-note',
      html: pageFns.map((f) => `<div class="fn-line"><span class="fn-num">${f.num}</span> ${esc(f.text)}</div>`).join(''),
    })
  }

  return { page: page!, lastPage: page! }
}

/**
 * Page graphics. Runs on the finished page list so it can judge page parity
 * (recto/verso), openings and front matter, then insert plates where needed.
 */
export function applyPageGraphics(a: {
  pages: Page[]
  settings: Project['settings']
  imageResolver: (id: string) => string | undefined
  naturalSize: (id: string) => { w: number; h: number } | undefined
  warnings: string[]
}) {
  const { pages, settings, imageResolver, naturalSize, warnings } = a
  const sideFor = (n: number): 'verso' | 'recto' => (n % 2 === 1 ? 'recto' : 'verso')

  pages.forEach((p, i) => {
    p.index = i + 1
    p.side = sideFor(i + 1)
    const gfx = pageGraphicFor(p, settings, i + 1, imageResolver, naturalSize)
    if (gfx) p.graphic = gfx
  })

  if (settings.graphics?.mode === 'plate') {
    const src = settings.graphics.plateImageId ? imageResolver(settings.graphics.plateImageId) : undefined
    if (!src) {
      warnings.push('Full-page plates are enabled but no plate image is set.')
      return
    }
    const inserts: { at: number; replace: boolean }[] = []
    pages.forEach((p, i) => {
      if (!p.isChapterOpen) return
      if (p.type !== 'chapter' && p.type !== 'part') return
      if (p.type === 'part' && !settings.graphics.onChapterOpen) return
      // The plate must face the opening: verso before a recto opening, recto after a verso one.
      if (p.side === 'recto') {
        const prev = pages[i - 1]
        if (prev && prev.type === 'blank') inserts.push({ at: i - 1, replace: true })
        else inserts.push({ at: i, replace: false })
      } else {
        inserts.push({ at: i + 1, replace: false })
      }
    })
    for (const { at, replace } of inserts.sort((x, y) => y.at - x.at)) {
      const plate: Page = {
        index: 0,
        side: 'verso',
        folio: null,
        folioType: null,
        showFolio: false,
        type: 'plate',
        header: { show: false },
        items: [],
        isChapterOpen: false,
        plate: { src, caption: settings.graphics.plateCaption ? projectPlateCaption(replace ? pages[at + 1] : pages[at]) : null, forPage: 0 },
      }
      if (replace) pages.splice(at, 1, plate)
      else pages.splice(at, 0, plate)
    }
    pages.forEach((p, i) => {
      p.index = i + 1
      p.side = sideFor(i + 1)
      if (p.type === 'plate') p.header = { show: false }
    })
  }
}

function projectPlateCaption(p?: Page): string | null {
  return p && p.chapterTitle ? p.chapterTitle : null
}
