import type { BookDoc, Block, PMNode } from '../model/types'

// ── Markdown serialisation ───────────────────────────────────────────────────

const esc = (s: string) => s
const kids = (n: unknown): PMNode[] => (('content' in (n as object)) ? ((n as { content?: PMNode[] }).content || []) : [])

function inlineMd(nodes: PMNode[] | undefined): string {
  if (!nodes) return ''
  return nodes
    .map((n) => {
      if (n.type === 'text') {
        let t = esc(n.text)
        const marks = n.marks || []
        if (marks.some((m) => m.type === 'italic')) t = `*${t}*`
        if (marks.some((m) => m.type === 'bold')) t = `**${t}**`
        if (marks.some((m) => m.type === 'underline')) t = `<u>${t}</u>`
        if (marks.some((m) => m.type === 'strike')) t = `~~${t}~~`
        if (marks.some((m) => m.type === 'smallCaps')) t = `<span class="sc">${t}</span>`
        const ff = marks.find((m) => m.type === 'fontFamily')
        if (ff?.attrs?.family) t = `<span data-ff="${String(ff.attrs.family)}">${t}</span>`
        const fs = marks.find((m) => m.type === 'fontSize')
        if (fs?.attrs?.size) t = `<span data-fs="${Number(fs.attrs.size)}">${t}</span>`
        const tp = marks.find((m) => m.type === 'textPaint')
        if (tp?.attrs) {
          const color = tp.attrs.color ? String(tp.attrs.color) : ''
          const gradient = tp.attrs.gradient ? String(tp.attrs.gradient) : ''
          const opacity = tp.attrs.opacity != null ? Number(tp.attrs.opacity) : 1
          t = `<span data-tc="${color}" data-to="${opacity}"${gradient ? ` data-tg="${gradient}"` : ''}>${t}</span>`
        }
        const link = marks.find((m) => m.type === 'link')
        if (link) t = `[${t}](${(link.attrs as { href: string }).href})`
        return t
      }
      if (n.type === 'hardBreak') return '  \n'
      if (n.type === 'footnoteRef') return `[^${n.attrs.id}]`
      return ''
    })
    .join('')
}

function blockMd(nodes: PMNode[] | undefined, footnotes: Record<string, string>, imageName: (id: string) => string): string {
  if (!nodes) return ''
  const out: string[] = []
  for (const n of nodes) {
    switch (n.type) {
      case 'paragraph':
        out.push(inlineMd(n.content))
        break
      case 'heading':
        out.push(`${'#'.repeat(n.attrs.level)} ${inlineMd(n.content)}`)
        break
      case 'blockquote': {
        const body = blockMd(n.content, footnotes, imageName)
        const lines = body.split('\n').map((l) => '> ' + l)
        if (n.attrs?.attribution) lines.push('>')
        if (n.attrs?.attribution) lines.push('> ' + n.attrs.attribution)
        out.push(lines.join('\n'))
        break
      }
      case 'bulletList':
      case 'orderedList':
        n.content?.forEach((li, i) => {
          const prefix = n.type === 'bulletList' ? '- ' : `${i + 1}. `
          const txt = kids(li).map((p) => inlineMd(kids(p))).join('\n  ')
          out.push(prefix + txt)
        })
        break
      case 'sceneBreak':
      case 'horizontalRule':
        out.push('* * *')
        break
      case 'image':
        out.push(`![${n.attrs.alt || ''}](${imageName(n.attrs.imageId)})`)
        if (n.attrs.caption) out.push(`*${n.attrs.caption}*`)
        break
      default:
        if ('content' in n && n.content) out.push(blockMd(n.content as PMNode[], footnotes, imageName))
    }
  }
  return out.join('\n\n')
}

export function docToMarkdown(doc: BookDoc, opts?: { imageName?: (id: string) => string }): string {
  const imageName = opts?.imageName || ((id) => id)
  const parts: string[] = []
  const footnotes: Record<string, string> = {}
  let chapterNo = 0
  for (const block of doc.blocks) {
    const body = block.sceneIds.map((sid) => blockMd(doc.scenes[sid], footnotes, imageName)).filter(Boolean).join('\n\n* * *\n\n')
    collectFootnoteIds(doc.scenes[block.sceneIds[0]] || [], doc, footnotes)
    for (const sid of block.sceneIds) collectFootnoteIds(doc.scenes[sid] || [], doc, footnotes)
    switch (block.type) {
      case 'frontmatter':
        parts.push(`# ${block.title}\n\n${body}`)
        break
      case 'backmatter':
        if (block.kind === 'endnotes') continue
        parts.push(`# ${block.title}\n\n${body}`)
        break
      case 'part':
        parts.push(`# ${block.title}\n\n${body}`)
        break
      case 'chapter': {
        chapterNo++
        const label = block.title || `Chapter ${chapterNo}`
        parts.push(`# ${label}\n\n${body}`)
        break
      }
    }
  }
  const fnList = Object.entries(footnotes)
  if (fnList.length) parts.push(fnList.map(([id, text]) => `[^${id}]: ${text}`).join('\n\n'))
  return parts.join('\n\n')
}

function collectFootnoteIds(nodes: PMNode[], doc: BookDoc, acc: Record<string, string>) {
  for (const n of nodes) {
    if (n.type === 'footnoteRef') acc[n.attrs.id] = doc.footnotes[n.attrs.id] || ''
    else if ('content' in n && n.content) collectFootnoteIds(n.content as PMNode[], doc, acc)
  }
}

// ── Parse markdown → BookDoc pieces ──────────────────────────────────────────
// # → part if the line starts with "Part", else chapter; ## / ### → section headings.

export interface ParsedBlock {
  level: 1 | 2 | 3
  title: string
}

export function classifyHeading(text: string): { kind: 'part' | 'chapter'; title: string } {
  const t = text.trim()
  if (/^(part|book|volume)\b/i.test(t)) return { kind: 'part', title: t }
  return { kind: 'chapter', title: t }
}

export function blankBlock(block: Block): boolean {
  return block.sceneIds.length === 0
}
