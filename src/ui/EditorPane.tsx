import { useEffect, useRef, useState } from 'react'
import { useProject } from '../state/project'
import { ManuscriptEditor } from '../editor/ManuscriptEditor'
import { smartenNodes } from '../editor/typography'
import type { Block, PMNode } from '../model/types'
import { blockWords } from '../model/docUtils'
import { loadFontFamily } from '../fonts/catalog'
import { PageArtEditor } from './PageArtEditor'
import { NotesPanel } from './NotesPanel'
import { PageArtBackdrop } from './PageArtLayers'
import { artForPage, emptyPageArt, hasPagePicture, pageForKey } from '../pageArt'

export function EditorPane({ blockId, sceneId, onSelect, page: artPage, onPage }: { blockId: string; sceneId: string; onSelect: (b: string, s: string) => void; page: number; onPage: (n: number) => void }) {
  const { project, updateDoc, setSceneContent, assetMap, setFootnote, uploadImage } = useProject()
  const doc = project.doc
  const block = doc.blocks.find((b) => b.id === blockId)
  const content = doc.scenes[sceneId] || [{ type: 'paragraph' }]
  const [fnPopover, setFnPopover] = useState<{ id: string; x: number; y: number } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'edit' | 'preview' | 'picture' | 'notes'>('edit')
  const setArtPage = (n: number) => onPage(Math.max(1, n))
  const artMap = project.settings.pageArt || {}
  const keys = project.lastPaginated?.keys
  const pagesWithArt = Object.keys(artMap)
    .filter((k) => hasPagePicture(artMap[k]))
    .map((k) => pageForKey(k, keys))
    .filter((n) => n > 0)
    .sort((a, b) => a - b)
  // Jump to a page with art only once, when first entering Edit — never while
  // the user is stepping the page number to place art on a new page.
  const jumped = useRef(false)
  useEffect(() => {
    if (jumped.current) return
    if (pagesWithArt.length && !hasPagePicture(artForPage(artMap, artPage, keys))) {
      jumped.current = true
      setArtPage(pagesWithArt[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagesWithArt.join(',')])
  const allKey = project.settings.pageArtAllKey
  const pageArt = allKey ? artMap[allKey] : artForPage(artMap, artPage, keys)
  const showLiveArt = hasPagePicture(pageArt)

  const setTitle = (title: string) => {
    updateDoc((d) => ({ ...d, blocks: d.blocks.map((b) => (b.id === blockId ? { ...b, title } : b)) }))
  }

  useEffect(() => {
    void loadFontFamily(project.settings.typography.fontFamily)
  }, [project.settings.typography.fontFamily])

  if (!block) return <div className="pane-empty">Select a chapter from the manuscript tree.</div>

  const words = blockWords(doc, block)

  const typographise = () => {
    if (!confirm('Convert straight quotes, dashes and ellipses in this scene to smart typography?')) return
    const next = smartenNodes(JSON.parse(JSON.stringify(content))) as PMNode[]
    setSceneContent(sceneId, next)
  }

  const insertImage = async (file: File) => {
    const asset = await uploadImage(file)
    const width = asset.width && asset.height && asset.width / asset.height > 1.4 ? 100 : 70
    const node: PMNode = { type: 'image', attrs: { imageId: asset.id, alt: asset.name, width } }
    setSceneContent(sceneId, [...content, node, { type: 'paragraph' }])
  }

  const addSceneAfterCurrent = () => {
    // split current scene content at the end: simplest robust behaviour is a new scene
    const newId = 'scene_' + Math.random().toString(36).slice(2, 10)
    updateDoc((d) => {
      const blk = d.blocks.find((b) => b.id === blockId)!
      const at = blk.sceneIds.indexOf(sceneId)
      const sceneIds = [...blk.sceneIds]
      sceneIds.splice(at + 1, 0, newId)
      return {
        ...d,
        blocks: d.blocks.map((b) => (b.id === blockId ? { ...b, sceneIds } : b)),
        scenes: { ...d.scenes, [newId]: [{ type: 'paragraph' }] },
      }
    })
    onSelect(blockId, newId)
  }

  return (
    <div className="editor-pane">
      <div className="editor-topbar">
        <div className="crumb">
          <span className="crumb-type">{labelFor(block)}</span>
          <input className="title-input" value={block.title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
        </div>
        <div className="editor-top-actions">
          <span className="wordcount" title="Words in this chapter alone — the whole-book total lives on the bottom status bar">{words.toLocaleString()} words</span>
          <button className="btn tiny ghost" title="End this scene here and start a new one right after it — the chapter keeps both" onClick={addSceneAfterCurrent}>Split → new scene</button>
          <div className="editor-modes" role="tablist" aria-label="Editor view">
            <button type="button" role="tab" aria-selected={mode === 'edit'} title="Write the manuscript — any picture on the chosen interior page shows under the type" className={'btn tiny ghost' + (mode === 'edit' ? ' on' : '')} onClick={() => setMode('edit')}>
              Edit
            </button>
            <button type="button" role="tab" aria-selected={mode === 'preview'} title="See this scene as a printed page, without leaving Write" className={'btn tiny ghost' + (mode === 'preview' ? ' on' : '')} onClick={() => setMode('preview')}>
              Preview
            </button>
            <button type="button" role="tab" aria-selected={mode === 'picture'} title="Place pictures on this page: three layers, gradient wash, colour tools — each page keeps its own images" className={'btn tiny ghost' + (mode === 'picture' ? ' on' : '')} onClick={() => setMode('picture')}>
              Picture
            </button>
            <button type="button" role="tab" aria-selected={mode === 'notes'} title="Notes & research — save notes to the page you are on (like pictures), or keep book-wide notes. Notes are never printed or exported." className={'btn tiny ghost' + (mode === 'notes' ? ' on' : '')} onClick={() => setMode('notes')}>
              Notes
            </button>
          </div>
        </div>
      </div>

      {block.type === 'chapter' && <ChapterNumberControl block={block} />}

      {mode === 'notes' && (
        <div className="editor-notes">
          <NotesPanel page={artPage} />
        </div>
      )}

      {mode === 'picture' && (
        <div className="editor-art">
          <label className="field">
            <span>Interior page</span>
            <input type="number" min={1} value={artPage} onChange={(e) => setArtPage(Number(e.target.value) || 1)} />
          </label>
          <PageArtEditor page={artPage} />
        </div>
      )}

      {mode === 'preview' && <ScenePreview block={block} content={content} assetMap={assetMap} />}

      {mode === 'edit' && (
        <div className="editor-scroll">
          <div className="editor-stage">
            <ManuscriptEditor
              key={sceneId}
              sceneId={sceneId}
              content={content}
              assets={assetMap}
              getFootnote={(id) => doc.footnotes[id] || ''}
              setFootnote={setFootnote}
              onFootnote={(id, rect) => setFnPopover({ id, x: rect.left, y: rect.bottom + 6 })}
              onUpdate={(_sid, json) => setSceneContent(sceneId, json)}
              onInsertImage={() => fileRef.current?.click()}
              onTypographise={typographise}
              showSectionHeadings={block.type !== 'frontmatter' && block.type !== 'backmatter'}
              firstLineIndent={project.settings.typography.firstLineIndent}
              backdrop={
                showLiveArt ? (
                  <PageArtBackdrop
                    className="editor-art-live"
                    art={pageArt || emptyPageArt()}
                    srcs={assetMap}
                    idPrefix={'edit-' + artPage}
                    includeAbove={false}
                  />
                ) : null
              }
            />
            <div className="page-number-badge" title="The interior page you are working on — every page has its own number, picture layers and art">
              — {artPage} —
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0]
          if (f) await insertImage(f)
          e.target.value = ''
        }}
      />

      {fnPopover && (
        <div className="fn-popover" style={{ left: Math.min(fnPopover.x, window.innerWidth - 320), top: fnPopover.y }}>
          <div className="fn-pop-head">Footnote</div>
          <textarea
            autoFocus
            value={doc.footnotes[fnPopover.id] || ''}
            onChange={(e) => setFootnote(fnPopover.id, e.target.value)}
            placeholder="Footnote text…"
            rows={4}
          />
          <div className="fn-pop-actions">
            <button className="btn tiny danger" onClick={() => {
              setSceneContent(sceneId, removeFootnoteRef(content, fnPopover.id))
              setFnPopover(null)
            }}>Remove</button>
            <button className="btn tiny primary" onClick={() => setFnPopover(null)}>Done</button>
          </div>
        </div>
      )}

    </div>
  )
}

function removeFootnoteRef(nodes: PMNode[], id: string): PMNode[] {
  const walk = (ns: PMNode[]): PMNode[] =>
    ns
      .filter((n) => !(n.type === 'footnoteRef' && n.attrs.id === id))
      .map((n) => ('content' in n && n.content ? ({ ...n, content: walk(n.content as PMNode[]) } as PMNode) : n))
  return walk(nodes)
}

function labelFor(b: Block) {
  return { frontmatter: 'Front matter', backmatter: 'Back matter', part: 'Part', chapter: 'Chapter' }[b.type]
}

function ChapterNumberControl({ block }: { block: Block }) {
  const { updateDoc } = useProject()
  return (
    <div className="chapter-num-bar">
      <label>
        Number shown
        <input
          value={block.numberOverride || ''}
          placeholder="auto"
          onChange={(e) =>
            updateDoc((d) => ({ ...d, blocks: d.blocks.map((b) => (b.id === block.id ? { ...b, numberOverride: e.target.value || undefined } : b)) }))
          }
        />
      </label>
      <span className="muted small">Leave blank to auto-number chapters.</span>
    </div>
  )
}

function ScenePreview({ block, content, assetMap }: { block: Block; content: PMNode[]; assetMap: Record<string, string> }) {
  return (
    <div className="scene-preview">
      <div className="sp-page">
        <h2>{block.title}</h2>
        <div className="sp-body">
          {content.map((n, i) => (
            <PreviewNode key={i} node={n} first={i === 0} assetMap={assetMap} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PreviewNode({ node, first, assetMap }: { node: PMNode; first: boolean; assetMap: Record<string, string> }) {
  switch (node.type) {
    case 'paragraph':
      return <p className={first ? 'no-indent' : ''}>{inline(node.content)}</p>
    case 'heading':
      return node.attrs.level === 2 ? <h3>{inline(node.content)}</h3> : <h4>{inline(node.content)}</h4>
    case 'blockquote':
      return (
        <blockquote>
          {(node.content || []).map((p, i) => <p key={i}>{inline((p as { content?: PMNode[] }).content)}</p>)}
          {node.attrs?.attribution && <cite>{node.attrs.attribution}</cite>}
        </blockquote>
      )
    case 'bulletList':
    case 'orderedList':
      return (
        <ul>
          {(node.content || []).map((li, i) => (
            <li key={i}>{((li as { content?: PMNode[] }).content || []).map((p, j) => <span key={j}>{inline((p as { content?: PMNode[] }).content)}</span>)}</li>
          ))}
        </ul>
      )
    case 'sceneBreak':
      return <div className="scene-break-preview">❦</div>
    case 'image':
      return (
        <figure className="book-image">
          <img src={assetMap[node.attrs.imageId]} alt={node.attrs.alt || ''} style={{ width: (node.attrs.width || 100) + '%' }} />
          {node.attrs.caption && <figcaption>{node.attrs.caption}</figcaption>}
        </figure>
      )
    default:
      return null
  }
}

function inline(nodes: PMNode[] | undefined) {
  if (!nodes) return null
  return nodes.map((n, i) => {
    if (n.type === 'text') {
      let el: React.ReactNode = n.text
      const marks = n.marks || []
      if (marks.some((m) => m.type === 'italic')) el = <em>{el}</em>
      if (marks.some((m) => m.type === 'bold')) el = <strong>{el}</strong>
      if (marks.some((m) => m.type === 'underline')) el = <u>{el}</u>
      const ff = marks.find((m) => m.type === 'fontFamily')
      const fs = marks.find((m) => m.type === 'fontSize')
      const tp = marks.find((m) => m.type === 'textPaint')
      const style: React.CSSProperties = {}
      if (ff?.attrs?.family) style.fontFamily = `'${String(ff.attrs.family)}', Georgia, serif`
      if (fs?.attrs?.size) style.fontSize = `${Number(fs.attrs.size)}pt`
      if (tp?.attrs?.gradient) {
        style.backgroundImage = String(tp.attrs.gradient)
        style.WebkitBackgroundClip = 'text'
        style.backgroundClip = 'text'
        style.color = 'transparent'
        style.WebkitTextFillColor = 'transparent'
      } else if (tp?.attrs?.color) {
        style.color = String(tp.attrs.color)
      }
      if (tp?.attrs?.opacity != null && Number(tp.attrs.opacity) !== 1) style.opacity = Number(tp.attrs.opacity)
      return <span key={i} style={Object.keys(style).length ? style : undefined}>{el}</span>
    }
    if (n.type === 'footnoteRef') return <sup key={i}>†</sup>
    if (n.type === 'hardBreak') return <br key={i} />
    return null
  })
}
