import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, TextSelection } from '@tiptap/pm/state'
import type { EditorView } from '@tiptap/pm/view'

/**
 * Tab handling for long-form prose.
 *
 * A plain Tab inserts four spaces. They are non-breaking spaces, because in
 * justified text an ordinary run of spaces gets stretched across the measure;
 * a typographic indent must hold its width. Shift-Tab removes up to four.
 *
 * Inside a list, Tab keeps its usual meaning (nest the item) and Shift-Tab
 * lifts it, which is what people expect while building a list rather than
 * indenting a line.
 *
 * `normaliseIndentation` in the print layer maps the spaces back to ordinary
 * ones when the text is serialised, so nothing exotic reaches the PDF, DOCX or
 * EPUB.
 */
export const INDENT_UNIT = '\u00a0\u00a0\u00a0\u00a0'
const LEADING = /^(?:\u00a0| ){1,4}/

function inListItem(view: EditorView): boolean {
  const { $from } = view.state.selection
  for (let d = $from.depth; d > 0; d--) {
    const name = $from.node(d).type.name
    if (name === 'listItem' || name === 'bulletList' || name === 'orderedList') return true
  }
  return false
}

/** Remove up to four spaces from the start of the line the caret is on. */
function deindent(view: EditorView): boolean {
  const { state } = view
  const $from = state.selection.$from
  const para = $from.parent
  if (para.type.name !== 'paragraph' && para.type.name !== 'heading') return false
  const start = $from.start($from.depth)
  const text = para.textBetween(0, para.content.size, '\n', '\uFFFC')
  const at = state.selection.from - start
  const lineStart = text.lastIndexOf('\n', at - 1) + 1
  const lead = LEADING.exec(text.slice(lineStart))
  if (!lead) return false
  const next = text.slice(0, lineStart) + text.slice(lineStart + lead[0].length)
  const tr = state.tr.replaceWith(
    start,
    start + para.content.size,
    next.length ? state.schema.text(next) : state.schema.text(' '),
  )
  const caret = Math.min(start + Math.max(lineStart, at - lead[0].length), tr.doc.content.size)
  view.dispatch(tr.setSelection(TextSelection.near(tr.doc.resolve(caret))))
  return true
}

export const TabIndent = Extension.create({
  name: 'tabIndent',

  /**
   * ProseMirror does not route key events to every extension's keymap, so Tab
   * is caught with a capture listener on the editor element instead — capture
   * runs before the browser can move focus or the list extension can act.
   */
  onBeforeCreate() {
    this.storage.onKey = (event: KeyboardEvent) => {
      const view = this.editor.view
      if (!view || !(view.dom as HTMLElement).contains(event.target as Node)) return
      if (event.key !== 'Tab') return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (inListItem(view)) return // lists keep Tab/Shift-Tab for nesting

      event.preventDefault()

      if (event.shiftKey) {
        deindent(view)
        return
      }
      const { state } = view
      view.dispatch(state.tr.insertText(INDENT_UNIT, state.selection.from, state.selection.to))
    }
  },

  onCreate() {
    const fn = (this.storage as { onKey?: (e: KeyboardEvent) => void }).onKey
    if (fn) this.editor.view.dom.addEventListener('keydown', fn, true)
  },

  onDestroy() {
    const fn = (this.storage as { onKey?: (e: KeyboardEvent) => void }).onKey
    if (fn) this.editor.view.dom?.removeEventListener('keydown', fn, true)
  },

  /** Also register through TipTap's own shortcut table, for completeness. */
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        const view = this.editor.view
        if (inListItem(view)) return this.editor.commands.sinkListItem('listItem')
        const { state } = this.editor
        this.editor.view.dispatch(state.tr.insertText(INDENT_UNIT, state.selection.from, state.selection.to))
        return true
      },
      'Shift-Tab': () => {
        const view = this.editor.view
        if (inListItem(view) && this.editor.commands.liftListItem('listItem')) return true
        return deindent(view)
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('tabIndent'),
        props: {
          // Last line of defence: never let Tab move the caret out of the page.
          handleKeyDown: (view) => inListItem(view),
        },
      }),
    ]
  },
})
