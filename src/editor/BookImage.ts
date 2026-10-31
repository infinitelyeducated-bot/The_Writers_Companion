import { Node, mergeAttributes } from '@tiptap/core'

/**
 * Image node that stores the IndexedDB asset id. Rendering resolves the
 * data-URL from an in-memory cache installed by the editor.
 */
let assetResolver: (id: string) => string | undefined = () => undefined
export function setAssetResolver(fn: (id: string) => string | undefined) {
  assetResolver = fn
}

export const BookImage = Node.create({
  name: 'image',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      imageId: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-image-id'),
        renderHTML: (attrs) => ({ 'data-image-id': attrs.imageId }),
      },
      alt: { default: null },
      caption: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-caption'),
        renderHTML: (attrs) => (attrs.caption ? { 'data-caption': attrs.caption } : {}),
      },
      width: {
        default: null,
        parseHTML: (el) => Number((el as HTMLElement).getAttribute('data-width')) || null,
        renderHTML: (attrs) => (attrs.width ? { 'data-width': attrs.width } : {}),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'figure[data-image-id]' }, { tag: 'img[data-image-id]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const id = HTMLAttributes.imageId as string
    const src = (id && assetResolver(id)) || ''
    const alt = (HTMLAttributes.alt as string) || ''
    const caption = HTMLAttributes.caption as string | null
    const width = HTMLAttributes.width as number | null
    const img: unknown[] = ['img', { src, alt, ...(width ? { style: `width:${width}%` } : {}) }]
    const children: unknown[] = [img]
    if (caption) children.push(['figcaption', {}, caption])
    return ['figure', mergeAttributes({ 'data-image-id': id, class: 'book-image' }), ...children]
  },
  addNodeView() {
    return ({ node }) => {
      const figure = document.createElement('figure')
      figure.className = 'book-image'
      figure.contentEditable = 'false'
      const img = document.createElement('img')
      const caption = document.createElement('figcaption')
      const render = (n: typeof node) => {
        img.src = assetResolver(n.attrs.imageId) || ''
        img.alt = n.attrs.alt || ''
        img.style.width = n.attrs.width ? `${n.attrs.width}%` : '100%'
        caption.textContent = n.attrs.caption || ''
        caption.style.display = n.attrs.caption ? '' : 'none'
      }
      render(node)
      figure.append(img, caption)
      return {
        dom: figure,
        update: (n) => {
          if (n.type.name !== 'image') return false
          render(n)
          return true
        },
      }
    }
  },
})
