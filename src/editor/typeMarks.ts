import { Mark, mergeAttributes } from '@tiptap/core'
import { loadFontFamily } from '../fonts/catalog'

/** Inline face: applies to the selection, or to typing that follows (stored mark). */
export const FontFamilyMark = Mark.create({
  name: 'fontFamily',
  keepOnSplit: true,
  addAttributes() {
    return {
      family: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-ff') || el.style.fontFamily?.replace(/['"]/g, '').split(',')[0]?.trim() || null,
        renderHTML: (attrs) => (attrs.family ? { 'data-ff': attrs.family, style: `font-family: '${attrs.family}', Georgia, serif` } : {}),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-ff]' }, { style: 'font-family' }]
  },
  renderHTML({ HTMLAttributes }) {
    const family = HTMLAttributes['data-ff'] as string | undefined
    if (family) void loadFontFamily(family)
    return ['span', mergeAttributes(HTMLAttributes), 0]
  },
})

/** Inline size in points: same stored-mark behaviour as the face. */
export const FontSizeMark = Mark.create({
  name: 'fontSize',
  keepOnSplit: true,
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (el) => {
          const raw = el.getAttribute('data-fs') || el.style.fontSize
          if (!raw) return null
          const n = parseFloat(raw)
          return Number.isFinite(n) ? n : null
        },
        renderHTML: (attrs) => (attrs.size ? { 'data-fs': String(attrs.size), style: `font-size: ${attrs.size}pt` } : {}),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-fs]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0]
  },
})

/** Index term: invisible in print, collected into the back-matter Index. */
export const IndexTermMark = Mark.create({
  name: 'indexTerm',
  keepOnSplit: false,
  parseHTML() {
    return [{ tag: 'span[data-ix]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-ix': '1', class: 'ix-term' }), 0]
  },
})

/** Lettering colour, optional gradient, opacity. Default is fully visible ink. */
export const TextPaintMark = Mark.create({
  name: 'textPaint',
  keepOnSplit: true,
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-tc') || null,
        renderHTML: (attrs) => (attrs.color ? { 'data-tc': attrs.color } : {}),
      },
      opacity: {
        default: 1,
        parseHTML: (el) => {
          const v = el.getAttribute('data-to')
          return v == null ? 1 : Number(v)
        },
        renderHTML: (attrs) => (attrs.opacity != null && attrs.opacity !== 1 ? { 'data-to': String(attrs.opacity) } : {}),
      },
      gradient: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-tg') || null,
        renderHTML: (attrs) => (attrs.gradient ? { 'data-tg': attrs.gradient } : {}),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-tc]' }, { tag: 'span[data-tg]' }, { tag: 'span[data-to]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const style = paintCss({
      color: HTMLAttributes['data-tc'] as string | undefined,
      opacity: HTMLAttributes['data-to'] != null ? Number(HTMLAttributes['data-to']) : 1,
      gradient: HTMLAttributes['data-tg'] as string | undefined,
    })
    return ['span', mergeAttributes(HTMLAttributes, style ? { style } : {}), 0]
  },
})

export const TYPE_GRADIENTS: { id: string; label: string; css: string | null }[] = [
  { id: 'none', label: 'Solid', css: null },
  { id: 'gold', label: 'Gold', css: 'linear-gradient(90deg,#c9a227,#f3e5ab,#8a5a2b)' },
  { id: 'sunset', label: 'Sunset', css: 'linear-gradient(90deg,#d36b4f,#f4c27a,#5a2a4a)' },
  { id: 'ocean', label: 'Ocean', css: 'linear-gradient(90deg,#1d4e89,#5dade2,#0e6655)' },
  { id: 'forest', label: 'Forest', css: 'linear-gradient(90deg,#145a32,#82e0aa,#1e8449)' },
  { id: 'ember', label: 'Ember', css: 'linear-gradient(90deg,#7b241c,#e74c3c,#f5b041)' },
]

/**
 * Solid colour that stands in for a gradient where text gradients cannot be
 * drawn (EPUB readers, Word). Uses the gradient's first colour stop, which is
 * the colour the lettering starts in.
 */
export function gradientFallback(gradient?: string | null): string | null {
  if (!gradient) return null
  const m = /#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/i.exec(gradient)
  return m ? m[0] : null
}

export function paintCss(p: { color?: string | null; opacity?: number | null; gradient?: string | null }): string {
  const bits: string[] = []
  const op = p.opacity == null ? 1 : p.opacity
  if (p.gradient) {
    bits.push(`background-image:${p.gradient}`)
    bits.push('-webkit-background-clip:text')
    bits.push('background-clip:text')
    bits.push('color:transparent')
    bits.push('-webkit-text-fill-color:transparent')
  } else if (p.color) {
    bits.push(`color:${p.color}`)
  }
  if (op !== 1) bits.push(`opacity:${op}`)
  return bits.join(';')
}

export function wrapInlineMarks(html: string, marks: { type: string; attrs?: Record<string, unknown> }[]): string {
  let t = html
  for (const m of marks) {
    if (m.type === 'fontFamily' && m.attrs?.family) {
      const fam = String(m.attrs.family)
      t = `<span data-ff="${escAttr(fam)}" style="font-family:'${escAttr(fam)}',Georgia,serif">${t}</span>`
    }
    if (m.type === 'fontSize' && m.attrs?.size) {
      const sz = Number(m.attrs.size)
      t = `<span data-fs="${sz}" style="font-size:${sz}pt">${t}</span>`
    }
    if (m.type === 'textPaint') {
      const color = m.attrs?.color ? String(m.attrs.color) : ''
      const gradient = m.attrs?.gradient ? String(m.attrs.gradient) : ''
      const opacity = m.attrs?.opacity != null ? Number(m.attrs.opacity) : 1
      const style = paintCss({ color, opacity, gradient })
      const attrs = [
        color ? `data-tc="${escAttr(color)}"` : '',
        gradient ? `data-tg="${escAttr(gradient)}"` : '',
        opacity !== 1 ? `data-to="${opacity}"` : '',
        style ? `style="${style}"` : '',
      ].filter(Boolean).join(' ')
      if (attrs) t = `<span ${attrs}>${t}</span>`
    }
  }
  return t
}

function escAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
