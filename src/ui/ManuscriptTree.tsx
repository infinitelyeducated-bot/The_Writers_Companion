import { useMemo, useState } from 'react'
import { TREE_MIN_PCT, useTreeMaxPct } from './treeWidth'
import { GoalsBox } from './GoalsBox'
import {
  DndContext, PointerSensor, useSensor, useSensors, closestCenter, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useProject } from '../state/project'
import { addScene, blockWords, cloneBlock, deleteBlock, deleteScene, partNumberLabel } from '../model/docUtils'
import { BACK_KINDS, FRONT_KINDS, newBlock, type Block, type FrontKind, type BackKind } from '../model/types'

interface Props {
  activeSceneId: string
  onSelect: (blockId: string, sceneId: string) => void
}

const typeLabel: Record<Block['type'], string> = { frontmatter: 'Front', part: 'Part', chapter: 'Chapter', backmatter: 'Back' }

export function ManuscriptTree({ activeSceneId, onSelect }: Props) {
  const { project, updateDoc, updateSettings } = useProject()
  const { doc } = project
  const treeMax = useTreeMaxPct()
  // a value saved on a wider screen is shown at what this window can display
  const widthPct = Math.min(project.settings.treeWidth ?? 100, treeMax)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [menu, setMenu] = useState<string | null>(null)
  const [addMenu, setAddMenu] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const ids = doc.blocks.map((b) => b.id)

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    updateDoc((d) => {
      const blocks = arrayMove(d.blocks, from, to)
      return { ...d, blocks }
    }, { snapshot: 'Reorder' })
  }

  // new chapters and parts belong to the body of the book: insert them before
  // the back matter (acknowledgments, about the author…), not after it
  const insertBeforeBack = (d: typeof doc, block: (typeof doc.blocks)[number]) => {
    const firstBack = d.blocks.findIndex((b) => b.type === 'backmatter')
    const blocks = [...d.blocks]
    blocks.splice(firstBack < 0 ? blocks.length : firstBack, 0, block)
    return blocks
  }
  const addChapter = () => {
    const { block, scenes } = newBlock('chapter', `Chapter ${doc.blocks.filter((b) => b.type === 'chapter').length + 1}`)
    updateDoc((d) => ({ ...d, blocks: insertBeforeBack(d, block), scenes: { ...d.scenes, ...scenes } }))
    onSelect(block.id, block.sceneIds[0])
  }
  const addPart = () => {
    const { block, scenes } = newBlock('part', `Part ${doc.blocks.filter((b) => b.type === 'part').length + 1}`)
    updateDoc((d) => ({ ...d, blocks: insertBeforeBack(d, block), scenes: { ...d.scenes, ...scenes } }))
    onSelect(block.id, block.sceneIds[0])
  }
  const addMatter = (type: 'frontmatter' | 'backmatter', kind: FrontKind | BackKind, title: string) => {
    const { block, scenes } = newBlock(type, title, kind)
    updateDoc((d) => {
      if (type === 'frontmatter') {
        const lastFront = d.blocks.map((b) => b.type).lastIndexOf('frontmatter')
        const blocks = [...d.blocks]
        blocks.splice(lastFront + 1, 0, block)
        return { ...d, blocks, scenes: { ...d.scenes, ...scenes } }
      }
      return { ...d, blocks: [...d.blocks, block], scenes: { ...d.scenes, ...scenes } }
    })
    onSelect(block.id, block.sceneIds[0])
    setAddMenu(false)
  }

  return (
    <div className="tree">
      <div className="tree-head">
        <span>Manuscript</span>
        <div className="tree-head-actions">
          <button className="icon-btn" title="Add…" onClick={() => setAddMenu((v) => !v)}>＋</button>
        </div>
      </div>
      {addMenu && (
        <div className="add-menu">
          <button onClick={() => { addChapter(); setAddMenu(false) }}>Chapter</button>
          <button onClick={() => { addPart(); setAddMenu(false) }}>Part</button>
          <div className="add-sep">Front matter</div>
          {FRONT_KINDS.filter((f) => !f.fixed).map((f) => (
            <button key={f.kind} onClick={() => addMatter('frontmatter', f.kind, f.label)}>{f.label}</button>
          ))}
          <div className="add-sep">Back matter</div>
          {BACK_KINDS.map((f) => (
            <button key={f.kind} onClick={() => addMatter('backmatter', f.kind, f.label)}>{f.label}</button>
          ))}
        </div>
      )}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="tree-list">
            {doc.blocks.map((block, i) => {
              const prevType = i > 0 ? doc.blocks[i - 1].type : null
              const showDivider = block.type !== 'chapter' && prevType === 'chapter'
              return (
                <div key={block.id}>
                  {showDivider && <div className="tree-divider">{typeLabel[block.type] === 'Back' ? 'Back matter' : typeLabel[block.type] === 'Part' ? '' : 'Front matter'}</div>}
                  <SortableBlock
                    block={block}
                    active={block.sceneIds.includes(activeSceneId)}
                    renaming={renaming === block.id}
                    menuOpen={menu === block.id}
                    onMenu={() => setMenu(menu === block.id ? null : block.id)}
                    onRename={(title) => {
                      updateDoc((d) => ({ ...d, blocks: d.blocks.map((b) => (b.id === block.id ? { ...b, title } : b)) }))
                      setRenaming(null)
                    }}
                    onStartRename={() => { setRenaming(block.id); setMenu(null) }}
                    onDuplicate={() => { updateDoc((d) => cloneBlock(d, block.id), { snapshot: 'Duplicated: ' + block.title }); setMenu(null) }}
                    onDelete={() => {
                      if (!confirm(`Delete “${block.title}”? A snapshot of the book as it will be after the delete is kept, so you can bring it back from version history.`)) return
                      updateDoc((d) => deleteBlock(d, block.id), { snapshot: 'Deleted: ' + block.title, snapshotBefore: true })
                      setMenu(null)
                    }}
                    onSelectScene={(sid) => onSelect(block.id, sid)}
                    onAddScene={() => {
                      const res = addScene(doc, block.id, block.sceneIds[block.sceneIds.length - 1])
                      updateDoc(() => res.doc)
                      onSelect(block.id, res.sceneId)
                    }}
                    onDeleteScene={(sid) => {
                      if (!confirm('Delete this scene?')) return
                      updateDoc((d) => deleteScene(d, block.id, sid), { snapshot: 'Deleted scene in ' + block.title, snapshotBefore: true })
                      if (sid === activeSceneId && block.sceneIds.length > 1) {
                        onSelect(block.id, block.sceneIds.find((s) => s !== sid)!)
                      }
                    }}
                    onToggleCollapse={() => updateDoc((d) => ({ ...d, blocks: d.blocks.map((b) => (b.id === block.id ? { ...b, collapsed: !b.collapsed } : b)) }))}
                    words={blockWords(doc, block)}
                    activeSceneId={activeSceneId}
                    sceneWords={(sid) => blockWords(doc, { ...block, sceneIds: [sid] })}
                    numberLabel={block.type === 'part' ? partNumberLabel(doc, block) : ''}
                    canDeleteScene={block.sceneIds.length > 1}
                  />
                </div>
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
      <div className="tree-foot">
        <div className="tree-foot-add">
          <button className="btn tiny ghost" onClick={addChapter}>+ Chapter</button>
          <button className="btn tiny ghost" onClick={addPart}>+ Part</button>
          <GoalsBox docked />
        </div>
        <label
          className="tree-width"
          title={`Width of this chapter column (100% = normal). Slide left to give the editor more room, right to read long chapter titles — up to ${treeMax}%, the most this window can show while keeping the editor usable. Double-click to reset to 100%.`}
        >
          <span className="muted small">Width</span>
          <input
            type="range"
            min={TREE_MIN_PCT}
            max={treeMax}
            step={5}
            value={widthPct}
            onChange={(e) => updateSettings({ treeWidth: Number(e.target.value) })}
            onDoubleClick={() => updateSettings({ treeWidth: 100 })}
            aria-label="Chapter column width"
          />
          <span className="tree-width-val">{widthPct}%</span>
        </label>
      </div>
    </div>
  )
}

function SortableBlock(props: {
  block: Block
  active: boolean
  renaming: boolean
  menuOpen: boolean
  onMenu: () => void
  onRename: (t: string) => void
  onStartRename: () => void
  onDuplicate: () => void
  onDelete: () => void
  onSelectScene: (id: string) => void
  onAddScene: () => void
  onDeleteScene: (id: string) => void
  onToggleCollapse: () => void
  words: number
  activeSceneId: string
  sceneWords: (id: string) => number
  numberLabel: string
  canDeleteScene: boolean
}) {
  const { block, active, renaming } = props
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
  const showScenes = !block.collapsed && block.sceneIds.length > 1
  const icon = { chapter: '§', part: '❖', frontmatter: '◷', backmatter: '◶' }[block.type]
  const [val, setVal] = useState(block.title)
  useMemo(() => setVal(block.title), [block.title, renaming])

  return (
    <div ref={setNodeRef} style={style} className={'tree-row' + (active ? ' active' : '') + ' t-' + block.type}>
      <div className="tree-row-main">
        <span className="drag-handle" {...attributes} {...listeners} title="Drag to reorder">⠿</span>
        <span className="blk-icon">{icon}</span>
        {renaming ? (
          <input
            className="rename-input"
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={() => props.onRename(val)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') props.onRename(val)
              if (e.key === 'Escape') props.onRename(block.title)
            }}
          />
        ) : (
          <button className="blk-title" onClick={() => props.onSelectScene(block.sceneIds[0])} onDoubleClick={props.onStartRename}>
            {props.numberLabel && <span className="blk-num">{props.numberLabel}</span>}
            {block.title || <span className="muted">Untitled</span>}
          </button>
        )}
        <span className="blk-words">{props.words.toLocaleString()}</span>
        <button className="icon-btn small" onClick={props.onMenu}>⋯</button>
      </div>
      {props.menuOpen && (
        <div className="row-menu">
          <button onClick={props.onStartRename}>Rename</button>
          <button onClick={props.onDuplicate}>Duplicate</button>
          {block.sceneIds.length > 1 && <button onClick={props.onToggleCollapse}>{block.collapsed ? 'Expand scenes' : 'Collapse scenes'}</button>}
          <button onClick={props.onAddScene}>Add scene</button>
          <button className="danger-text" onClick={props.onDelete}>Delete</button>
        </div>
      )}
      {showScenes && (
        <div className="scene-list">
          {block.sceneIds.map((sid, i) => (
            <div key={sid} className={'scene-row' + (sid === props.activeSceneId ? ' active' : '')}>
              <button className="scene-title" onClick={() => props.onSelectScene(sid)}>
                <span className="scene-dot">•</span> Scene {i + 1}
                <span className="scene-words">{props.sceneWords(sid)}w</span>
              </button>
              {props.canDeleteScene && (
                <button className="icon-btn small" title="Delete scene" onClick={() => props.onDeleteScene(sid)}>×</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
