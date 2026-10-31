import { Extension, InputRule, Mark, Node, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Node as PMNode } from '@tiptap/pm/model'
import { smarten } from './typography'

// ── Typography input rules ───────────────────────────────────────────────────
export const TypographyRules = Extension.create({
  name: 'typographyRules',
  addInputRules() {
    return [
      new InputRule({ find: /\.\.\.$/, handler: ({ state, range }) => {
        state.tr.replaceWith(range.from, range.to, state.schema.text('…'))
      }}),
      new InputRule({ find: /---$/, handler: ({ state, range }) => {
        state.tr.replaceWith(range.from, range.to, state.schema.text('—'))
      }}),
      new InputRule({ find: /(?<!-)--$/, handler: ({ state, range }) => {
        state.tr.replaceWith(range.from, range.to, state.schema.text('–'))
      }}),
      // straight double quote → opening or closing curly
      new InputRule({ find: /"$/, handler: ({ state, range }) => {
        const $from = state.selection.$from
        const before = state.doc.textBetween(Math.max(0, $from.pos - 2), $from.pos, undefined, '\u0000')
        const isOpen = /(^|[\s(\[{<—–/‘“])"$/.test(before)
        state.tr.replaceWith(range.from, range.to, state.schema.text(isOpen ? '“' : '”'))
      }}),
      // straight apostrophe/quote → ‘ or ’
      new InputRule({ find: /'$/, handler: ({ state, range }) => {
        const $from = state.selection.$from
        const before = state.doc.textBetween(Math.max(0, $from.pos - 2), $from.pos, undefined, '\u0000')
        const isOpen = /(^|[\s(\[{<—–/‘“])'$/.test(before)
        state.tr.replaceWith(range.from, range.to, state.schema.text(isOpen ? '‘' : '’'))
      }}),
    ]
  },
})

// ── Small caps ───────────────────────────────────────────────────────────────
// A real mark, not a strikethrough: `smallCaps` already exists in PMMark and in
// the DOCX/EPUB serialisers, but nothing could ever produce one. Renderers map it
// to font-variant: small-caps; print CSS keeps the same rule so PDF and screen agree.
export const SmallCaps = Mark.create({
  name: 'smallCaps',
  parseHTML() {
    return [{ tag: 'span.sc' }, { style: 'font-variant=small-caps' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'sc' }), 0]
  },
  addKeyboardShortcuts() {
    return { 'Mod-Shift-k': () => this.editor.commands.toggleMark('smallCaps') }
  },
})

// ── Scene break node (* * *) ─────────────────────────────────────────────────
export const SceneBreak = Node.create({
  name: 'sceneBreak',
  group: 'block',
  atom: true,
  selectable: true,
  parseHTML() {
    return [{ tag: 'div[data-scene-break]' }, { tag: 'hr' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-scene-break': 'true', class: 'scene-break' }), ['span', {}, '❦']]
  },
  addInputRules() {
    return [
      new InputRule({
        find: /^\*\s\*\s\*$/,
        handler: ({ state, range }) => {
          const node = this.type.create()
          state.tr.replaceWith(range.from, range.to, node)
        },
      }),
    ]
  },
})

// ── Footnote reference (inline atom with a tooltip / editor popover) ─────────
export interface FootnoteOptions {
  getText: (id: string) => string
  setText: (id: string, text: string) => void
  onOpen: (id: string, rect: DOMRect) => void
}

export const FootnoteRef = Node.create<FootnoteOptions>({
  name: 'footnoteRef',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  addOptions() {
    return { getText: () => '', setText: () => {}, onOpen: () => {} }
  },
  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-footnote'),
        renderHTML: (attrs) => ({ 'data-footnote': attrs.id }),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'sup[data-footnote]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['sup', mergeAttributes(HTMLAttributes, { class: 'fn-ref' }), '†']
  },
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement('sup')
      dom.className = 'fn-ref'
      dom.contentEditable = 'false'
      const label = document.createElement('span')
      label.textContent = '1'
      dom.appendChild(label)
      const update = () => {
        const text = this.options.getText(node.attrs.id)
        dom.title = text || 'Footnote (empty)'
        dom.classList.toggle('fn-empty', !text)
      }
      update()
      dom.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        const rect = dom.getBoundingClientRect()
        const pos = typeof getPos === 'function' ? getPos() : null
        if (pos != null) editor.commands.setNodeSelection(pos)
        this.options.onOpen(node.attrs.id, rect)
      })
      return {
        dom,
        update: (n) => {
          if (n.type.name !== 'footnoteRef') return false
          node = n
          update()
          return true
        },
        ignoreMutation: () => true,
      }
    }
  },
})

// ── Visual indent suppression ────────────────────────────────────────────────
// Novel convention: first-line indent, suppressed after headings, images,
// block quotes, lists, scene breaks, and at the start of a scene.
export interface IndentDecorationOptions {
  /** when the layout has no first-line indent, the preview must not add one */
  paragraphIndent: number
}

export const IndentDecorations = Extension.create<IndentDecorationOptions>({
  name: 'indentDecorations',
  addOptions() {
    return { paragraphIndent: 1.5 }
  },
  addProseMirrorPlugins() {
    const noIndent = this.options.paragraphIndent <= 0
    return [
      new Plugin({
        key: new PluginKey('indentDecorations'),
        props: {
          decorations(state) {
            const decos: Decoration[] = []
            state.doc.forEach((node: PMNode, offset: number) => {
              const prev = offset === 0 ? null : state.doc.childBefore(offset).node
              if (node.type.name === 'paragraph' || node.type.name === 'heading') {
                const suppress =
                  !prev ||
                  ['heading', 'image', 'blockquote', 'bulletList', 'orderedList', 'sceneBreak', 'horizontalRule', 'listItem'].includes(prev.type.name)
                if ((suppress || noIndent) && node.type.name === 'paragraph') {
                  decos.push(Decoration.node(offset, offset + node.nodeSize, { class: 'no-indent' }))
                }
              }
              // recurse into blockquotes / lists
              node.descendants((child, pos) => {
                if (child.type.name === 'paragraph') {
                  const abs = offset + 1 + pos
                  const $pos = state.doc.resolve(abs)
                  const parent = $pos.parent
                  const index = $pos.index()
                  const prevSib = index === 0 ? null : parent.child(index - 1)
                  const suppress = !prevSib || ['heading', 'image', 'blockquote', 'sceneBreak', 'horizontalRule'].includes(prevSib.type.name)
                  if (suppress || noIndent) decos.push(Decoration.node(abs, abs + child.nodeSize, { class: 'no-indent' }))
                }
                return false
              })
            })
            return DecorationSet.create(state.doc, decos)
          },
        },
      }),
    ]
  },
})

// ── Block quote with attribution ─────────────────────────────────────────────
export const BlockQuoteWithAttribution = Node.create({
  name: 'blockquote',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return {
      attribution: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-attribution'),
        renderHTML: (attrs) => (attrs.attribution ? { 'data-attribution': attrs.attribution } : {}),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'blockquote' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['blockquote', mergeAttributes(HTMLAttributes), 0]
  },
})

// ── Chapter title field helper (used by editor shell) ────────────────────────
export const typographiseText = (t: string) => smarten(t)
