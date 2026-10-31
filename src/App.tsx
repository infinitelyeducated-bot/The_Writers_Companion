import { useCallback, useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/db'
import { ProjectProvider, useProject } from './state/project'
import { Library } from './ui/Library'
import { ManuscriptTree } from './ui/ManuscriptTree'
import { EditorPane } from './ui/EditorPane'
import { PrintPane } from './ui/PrintPane'
import { CoverPane } from './ui/CoverPane'
import { ExportPane } from './ui/ExportPane'
import type { Project } from './model/types'
import { useSeedDemo } from './seed'
import { useAppSnapshots } from './state/appSnapshots'
import { LicenseGate, licenseAccepted } from './ui/LicenseGate'
import { typicalFor } from './pageArt'
import { GoalsBox } from './ui/GoalsBox'
import { FindReplace } from './ui/FindReplace'
import { SkinPicker } from './ui/SkinPicker'
import { treePx, useTreeMaxPct } from './ui/treeWidth'
import { SnapshotsBar } from './ui/SnapshotsBar'
import { PageNavigator } from './ui/PageNavigator'

type Tab = 'write' | 'print' | 'cover' | 'export'

function hashProject(): string | null {
  const m = /^#\/p\/([^/]+)/.exec(location.hash)
  return m ? m[1] : null
}

/** Live project: subscribes to the DB row and ignores the first render's cache
 *  (Dexie's default value), so we never seed a provider with a stale document. */
function useLiveProject(id: string | null): Project | undefined {
  const cached = useLiveQuery(() => (id ? db.projects.get(id) : undefined), [id])
  const [ready, setReady] = useState<{ id: string | null; project: Project } | null>(null)
  useEffect(() => {
    if (cached && id && (!ready || ready.id !== id || ready.project.updatedAt !== cached.updatedAt)) {
      setReady({ id, project: cached as Project })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cached, id])
  return ready?.id === id ? ready.project : undefined
}

export function App() {
  const [licensed, setLicensed] = useState<boolean>(() => licenseAccepted())
  useSeedDemo(licensed)
  useAppSnapshots(licensed)
  const [projectId, setProjectId] = useState<string | null>(hashProject())
  const project = useLiveProject(licensed ? projectId : null)

  useEffect(() => {
    const onHash = () => setProjectId(hashProject())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const open = (id: string) => {
    location.hash = '#/p/' + id
    setProjectId(id)
  }
  const close = () => {
    location.hash = ''
    setProjectId(null)
  }

  if (!licensed) return <LicenseGate onAccept={() => setLicensed(true)} />
  if (!projectId) return <Library onOpen={open} />
  if (!project) return <div className="loading">Opening book…</div>
  return (
    <ProjectProvider key={project.id} initial={project as Project}>
      <Workspace onBack={close} />
    </ProjectProvider>
  )
}

function Workspace({ onBack }: { onBack: () => void }) {
  const { project, saveState, words, lastSavedAt } = useProject()
  const [tab, setTab] = useState<Tab>('write')
  const [sel, setSel] = useState<{ blockId: string; sceneId: string }>(() => {
    const first = project.doc.blocks.find((b) => b.type === 'chapter') || project.doc.blocks[0]
    return { blockId: first?.id || '', sceneId: first?.sceneIds[0] || '' }
  })
  const [treeOpen, setTreeOpen] = useState(false)
  const [pageCount, setPageCount] = useState(project.lastPaginated?.pageCount || 0)
  const [currentPage, setCurrentPage] = useState(1)

  // keep the selection valid when blocks change (delete/import/restore)
  useEffect(() => {
    const block = project.doc.blocks.find((b) => b.id === sel.blockId)
    if (!block) {
      const first = project.doc.blocks.find((b) => b.type === 'chapter') || project.doc.blocks[0]
      if (first) setSel({ blockId: first.id, sceneId: first.sceneIds[0] })
      return
    }
    if (!block.sceneIds.includes(sel.sceneId)) setSel({ blockId: block.id, sceneId: block.sceneIds[0] })
  }, [project.doc.blocks, sel])

  const onPageCount = useCallback((n: number) => setPageCount(n), [])
  const chapterCount = project.doc.blocks.filter((b) => b.type === 'chapter').length
  const treeMax = useTreeMaxPct()

  return (
    <div className="workspace">
      <header className="appbar">
        <button className="back-btn" onClick={onBack} title="Back to library">◈ Library</button>
        {tab === 'write' && (
          <button className="tree-toggle" onClick={() => setTreeOpen((v) => !v)} aria-label="Show manuscript tree">
            ☰ Chapters
          </button>
        )}
        <div className="app-title">
          <span className="book-name">{project.meta.title || 'Untitled Book'}</span>
          <span className="muted">{project.meta.author}</span>
        </div>
        <span
          className="chapter-count"
          title="How many chapters the manuscript holds right now — parts and front/back matter are not counted"
        >
          {chapterCount} {chapterCount === 1 ? 'chapter' : 'chapters'}
        </span>
        <nav className="tabs">
          {(['write', 'print', 'cover', 'export'] as Tab[]).map((t) => (
            <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
              {{ write: 'Write', print: 'Print layout', cover: 'Cover', export: 'Export' }[t]}
            </button>
          ))}
        </nav>
        <div className="appbar-right">
          <SkinPicker />
          <FindReplace />
          <span className={'save-dot ' + saveState} title={lastSavedAt ? 'Saved ' + new Date(lastSavedAt).toLocaleTimeString() : ''}>
            {saveState === 'saved' ? 'Saved' : saveState === 'saving' ? 'Saving…' : 'Unsaved'}
          </span>
        </div>
      </header>

      {tab === 'write' && (
        <div
          className={'write-layout' + (treeOpen ? ' tree-open' : '')}
          style={{ ['--tree-w' as string]: `${treePx(Math.min(project.settings.treeWidth ?? 100, treeMax))}px` }}
        >
          {treeOpen && <div className="tree-scrim" onClick={() => setTreeOpen(false)} />}
          <ManuscriptTree
            activeSceneId={sel.sceneId}
            onSelect={(blockId, sceneId) => {
              setSel({ blockId, sceneId })
              setTreeOpen(false)
            }}
          />
          <EditorPane blockId={sel.blockId} sceneId={sel.sceneId} onSelect={(b, s) => setSel({ blockId: b, sceneId: s })} page={currentPage} onPage={setCurrentPage} />
        </div>
      )}
      {tab === 'print' && <PrintPane onPageCount={onPageCount} onCurrentPage={setCurrentPage} />}
      {tab === 'cover' && <CoverPane pageCount={pageCount} />}
      {tab === 'export' && <ExportPane pageCount={pageCount} onGoPrint={() => setTab('print')} />}

      {tab !== 'write' && <GoalsBox />}

      <div className="status-bar" aria-live="polite">
        <span className="status-typical" title={typicalFor(project.settings.layout).length}>
          {typicalFor(project.settings.layout).pages}
        </span>
        {tab === 'write' && (
          <span className="status-tools">
            <SnapshotsBar />
            <PageNavigator page={currentPage} onPage={setCurrentPage} pageCount={pageCount} />
          </span>
        )}
        <span className="status-right">
          <span
            className="page-total"
            title="The interior page you are on right now — the one chosen on Write (Interior page) or shown on Print layout — out of the pages the last pagination produced"
          >
            page {currentPage}{pageCount > 0 ? ` of ${pageCount.toLocaleString()}` : ''}
          </span>
          <span
            className="word-total"
            title="Every word in the manuscript — chapters, parts and front/back matter together, updated as you type"
          >
            {words.toLocaleString()} words
          </span>
        </span>
      </div>

      <nav className="mobile-tabs" aria-label="Workspace sections">
        {([
          ['write', '✎', 'Write'],
          ['print', '▤', 'Print'],
          ['cover', '◫', 'Cover'],
          ['export', '⤓', 'Export'],
        ] as [Tab, string, string][]).map(([t, ico, label]) => (
          <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
            <span className="ico">{ico}</span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
