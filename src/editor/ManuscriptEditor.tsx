import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { PMNode } from '../model/types'
import { BlockQuoteWithAttribution, FootnoteRef, IndentDecorations, SceneBreak, SmallCaps, TypographyRules } from './extensions'
import { FontFamilyMark, FontSizeMark, IndexTermMark, TextPaintMark, TYPE_GRADIENTS } from './typeMarks'
import { FontSelect } from '../fonts/FontSelect'
import { SIZE_PRESETS, loadFontFamily } from '../fonts/catalog'
import { TabIndent } from './TabIndent'
import { setAssetResolver } from './BookImage'
import { smartenNodes } from './typography'

interface Props {
  sceneId: string
  content: PMNode[]
  assets: Record<string, string>
  onUpdate: (sceneId: string, json: PMNode[], words: number) => void
  onFootnote: (id: string, rect: DOMRect) => void
  getFootnote: (id: string) => string
  setFootnote: (id: string, text: string) => void
  onInsertImage: () => void
  onTypographise: () => void
  showSectionHeadings: boolean
  /** the layout's first-line indent, in em; 0 disables the preview indent */
  firstLineIndent: number
  /** drawn under the type (page picture) */
  backdrop?: React.ReactNode
}

export function ManuscriptEditor({
  sceneId, content, assets, onUpdate, onFootnote, getFootnote, setFootnote, onInsertImage, onTypographise, showSectionHeadings, firstLineIndent, backdrop,
}: Props) {
  const lastLoaded = useRef<string>('')
  const [, force] = useState(0)

  useEffect(() => {
    setAssetResolver((id) => assets[id])
  }, [assets])

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        blockquote: false,
        horizontalRule: false,
        codeBlock: false,
        code: false,
        link: false,
        underline: false,
      }),
      BlockQuoteWithAttribution,
      Image.configure({ inline: false, allowBase64: false }),
      Underline,
      SmallCaps,
      FontFamilyMark,
      FontSizeMark,
      TextPaintMark,
      IndexTermMark,
      Link.configure({ openOnClick: false, autolink: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Begin writing…' }),
      TypographyRules,
      TabIndent,
      SceneBreak,
      IndentDecorations.configure({ paragraphIndent: firstLineIndent }),
      FootnoteRef.configure({ getText: getFootnote, setText: setFootnote, onOpen: onFootnote }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const editor = useEditor({
    extensions,
    content: { type: 'doc', content },
    immediatelyRender: true,
    editorProps: {
      attributes: {
        class: 'manuscript',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON().content as PMNode[]
      const words = editor.getText().trim().split(/\s+/).filter(Boolean).length
      onUpdate(sceneId, json, words)
      force((n) => n + 1)
    },
    onSelectionUpdate: () => force((n) => n + 1),
  })

  // swap content when the scene changes (not on every keystroke)
  useEffect(() => {
    if (!editor) return
    if (lastLoaded.current === sceneId) return
    lastLoaded.current = sceneId
    editor.commands.setContent({ type: 'doc', content }, { emitUpdate: false })
    editor.commands.focus('start')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId, editor])

  useEffect(() => {
    if (!editor) return
    if (lastLoaded.current !== sceneId) return
    // external change (e.g. snapshot restore or import)
    const current = JSON.stringify(editor.getJSON().content)
    if (current !== JSON.stringify(content)) {
      editor.commands.setContent({ type: 'doc', content }, { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  if (!editor) return null

  return (
    <div className="editor-shell">
      <EditorToolbar
        editor={editor}
        onInsertImage={onInsertImage}
        onTypographise={onTypographise}
        showSectionHeadings={showSectionHeadings}
        getFootnote={getFootnote}
        onFootnote={onFootnote}
      />
      <div className="editor-surface">
        {backdrop}
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

const TOOLBAR_KEY = 'writerscompanion.toolbar.float'

function ToolbarBtn({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title: string }) {
  return (
    <button type="button" className={'tb' + (active ? ' on' : '')} onMouseDown={(e) => e.preventDefault()} onClick={onClick} title={title}>
      {children}
    </button>
  )
}

export function EditorToolbar({ editor, onInsertImage, onTypographise, showSectionHeadings, getFootnote, onFootnote }: {
  editor: Editor
  onInsertImage: () => void
  onTypographise: () => void
  showSectionHeadings: boolean
  getFootnote?: (id: string) => string
  onFootnote?: (id: string, rect: DOMRect) => void
}) {
  void getFootnote

  // ── drag the toolbar: hold the glove handle, float it anywhere, drop near
  //    the top to snap it back home ──────────────────────────────────────────
  // The editor remounts on every scene switch; keep a floated toolbar where the
  // user parked it for the rest of this session (a fresh launch starts home).
  const [float, setFloatRaw] = useState<{ x: number; y: number } | null>(() => {
    try {
      const v = sessionStorage.getItem(TOOLBAR_KEY)
      return v ? (JSON.parse(v) as { x: number; y: number }) : null
    } catch {
      return null
    }
  })
  const setFloat = (v: { x: number; y: number } | null) => {
    setFloatRaw(v)
    try {
      if (v) sessionStorage.setItem(TOOLBAR_KEY, JSON.stringify(v))
      else sessionStorage.removeItem(TOOLBAR_KEY)
    } catch {
      /* storage unavailable: position just won't persist */
    }
  }
  const [grabbing, setGrabbing] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  const onGripDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return // left button only
    e.preventDefault()
    const bar = barRef.current
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const grabX = e.clientX - rect.left
    const grabY = e.clientY - rect.top
    const home = bar.parentElement?.getBoundingClientRect()
    setGrabbing(true)
    const move = (ev: PointerEvent) => {
      const x = ev.clientX - grabX
      const y = ev.clientY - grabY
      // sticky home: within 60px of the shell's top edge → latch back
      if (home && Math.abs(y - home.top) < 60 && x > home.left - 120 && x < home.right) {
        setFloat(null)
      } else {
        setFloat({
          x: Math.max(4, Math.min(window.innerWidth - rect.width - 4, x)),
          y: Math.max(4, Math.min(window.innerHeight - rect.height - 4, y)),
        })
      }
    }
    const up = () => {
      setGrabbing(false) // the hand lets go
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }
  const addFootnote = () => {
    const id = 'fn_' + Math.random().toString(36).slice(2, 9)
    editor.chain().focus().insertContent({ type: 'footnoteRef', attrs: { id } }).run()
    // open popover at caret
    const sel = window.getSelection()
    const rect = sel && sel.rangeCount ? sel.getRangeAt(0).getBoundingClientRect() : new DOMRect(200, 200, 1, 1)
    onFootnote?.(id, rect)
  }
  const setAttribution = () => {
    if (!editor.isActive('blockquote')) return
    const current = (editor.getAttributes('blockquote').attribution as string) || ''
    const val = window.prompt('Quote attribution (e.g. — Marcus Aurelius):', current)
    if (val === null) return
    editor.chain().focus().updateAttributes('blockquote', { attribution: val }).run()
  }
  const addLink = () => {
    const prev = (editor.getAttributes('link').href as string) || ''
    const url = window.prompt('Link URL', prev)
    if (url === null) return
    if (!url) editor.chain().focus().unsetLink().run()
    else editor.chain().focus().setLink({ href: url }).run()
  }
  return (
    <div
      className={'toolbar' + (float ? ' floating' : '') + (grabbing ? ' grabbing' : '')}
      ref={barRef}
      style={float ? { left: float.x, top: float.y } : undefined}
    >
      <button
        type="button"
        className="tb-grip"
        onPointerDown={onGripDown}
        title="Hold and drag to float the toolbar anywhere. Drop it near the top of the page and it latches back home."
        aria-label="Drag the formatting toolbar"
      >
        <span className="tb-grip-hand" aria-hidden="true">{grabbing ? '✊' : '🧤'}</span>
        <span className="tb-grip-dots" aria-hidden="true">⠿</span>
      </button>
      <div className="tb-group tb-type">
        <InlineType editor={editor} />
      </div>
      <div className="tb-group">
        <ToolbarBtn title="Bold (⌘B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></ToolbarBtn>
        <ToolbarBtn title="Italic (⌘I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></ToolbarBtn>
        <ToolbarBtn title="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></ToolbarBtn>
        <ToolbarBtn title="Small caps (⌘⇧K)" active={editor.isActive('smallCaps')} onClick={() => editor.chain().focus().toggleMark('smallCaps').run()}><span style={{ fontVariant: 'small-caps', fontWeight: 600 }}>Aa</span></ToolbarBtn>
      </div>
      {showSectionHeadings && (
        <div className="tb-group">
          <ToolbarBtn title="Section heading" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarBtn>
          <ToolbarBtn title="Sub-heading" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolbarBtn>
          <ToolbarBtn title="Body paragraph" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()}>¶</ToolbarBtn>
        </div>
      )}
      <div className="tb-group">
        <ToolbarBtn title="Block quote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</ToolbarBtn>
        <ToolbarBtn title="Quote attribution" active={!!editor.getAttributes('blockquote').attribution} onClick={setAttribution}>—</ToolbarBtn>
        <ToolbarBtn title="Bulleted list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>•</ToolbarBtn>
        <ToolbarBtn title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1.</ToolbarBtn>
      </div>
      <div className="tb-group">
        <ToolbarBtn title="Scene break" onClick={() => editor.chain().focus().insertContent({ type: 'sceneBreak' }).run()}>❦</ToolbarBtn>
        <ToolbarBtn title="Image" onClick={onInsertImage}>▣</ToolbarBtn>
        <ToolbarBtn title="Footnote" onClick={addFootnote}>†</ToolbarBtn>
        <ToolbarBtn title="Mark for the index — the selected words are collected into the back-matter Index with their real page numbers (build it on Print layout)" active={editor.isActive('indexTerm')} onClick={() => editor.chain().focus().toggleMark('indexTerm').run()}>✦</ToolbarBtn>
        <ToolbarBtn title="Link" active={editor.isActive('link')} onClick={addLink}>🔗</ToolbarBtn>
      </div>
      <div className="tb-group">
        <ToolbarBtn title="Align left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>⬅</ToolbarBtn>
        <ToolbarBtn title="Center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>↔</ToolbarBtn>
        <ToolbarBtn title="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>☰</ToolbarBtn>
      </div>
      <div className="tb-group">
        <ToolbarBtn title="Typographise (curly quotes, dashes, ellipses)" onClick={onTypographise}>“A”</ToolbarBtn>
        <ToolbarBtn title="Undo" onClick={() => editor.chain().focus().undo().run()}>↶</ToolbarBtn>
        <ToolbarBtn title="Redo" onClick={() => editor.chain().focus().redo().run()}>↷</ToolbarBtn>
      </div>
    </div>
  )
}

function InlineType({ editor }: { editor: Editor }) {
  const stored = editor.getAttributes('fontFamily')
  const sizeStored = editor.getAttributes('fontSize')
  const paint = editor.getAttributes('textPaint') as { color?: string; opacity?: number; gradient?: string }
  const family = (stored?.family as string) || 'Literata'
  const size = Number(sizeStored?.size) || 11.5
  const color = (paint?.color as string) || '#26221c'
  const opacity = paint?.opacity == null ? 1 : Number(paint.opacity)
  const gradient = (paint?.gradient as string) || ''
  const setPaint = (patch: { color?: string | null; opacity?: number; gradient?: string | null }) => {
    editor.chain().focus().setMark('textPaint', {
      color: patch.color !== undefined ? patch.color : paint?.color || color,
      opacity: patch.opacity !== undefined ? patch.opacity : opacity,
      gradient: patch.gradient !== undefined ? patch.gradient : paint?.gradient || null,
    }).run()
  }
  return (
    <>
      <FontSelect
        compact
        hideSample
        value={family}
        onChange={(next) => {
          void loadFontFamily(next)
          editor.chain().focus().setMark('fontFamily', { family: next }).run()
        }}
      />
      <select
        className="tb-size"
        value={String(size)}
        aria-label="Type size"
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          const pt = Number(e.target.value)
          editor.chain().focus().setMark('fontSize', { size: pt }).run()
        }}
      >
        {!SIZE_PRESETS.some((p) => p.pt === size) && <option value={size}>{size} pt</option>}
        {SIZE_PRESETS.map((p) => (
          <option key={p.pt} value={p.pt}>
            {p.pt}
          </option>
        ))}
      </select>
      <label className="tb-color" title="Lettering colour">
        <input
          type="color"
          value={color}
          aria-label="Lettering colour"
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => setPaint({ color: e.target.value, gradient: null })}
        />
      </label>
      <select
        className="tb-grad"
        value={TYPE_GRADIENTS.find((g) => g.css === gradient)?.id || 'none'}
        aria-label="Lettering gradient"
        title="Lettering gradient"
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          const g = TYPE_GRADIENTS.find((x) => x.id === e.target.value)
          setPaint({ gradient: g?.css || null })
        }}
      >
        {TYPE_GRADIENTS.map((g) => (
          <option key={g.id} value={g.id}>{g.label}</option>
        ))}
      </select>
      <label className="tb-op" title={`Lettering opacity ${Math.round(opacity * 100)}%`}>
        <input
          type="range"
          min={20}
          max={100}
          value={Math.round(opacity * 100)}
          aria-label="Lettering opacity"
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => setPaint({ opacity: Number(e.target.value) / 100 })}
        />
      </label>
    </>
  )
}

export { smartenNodes }
