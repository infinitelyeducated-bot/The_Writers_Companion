import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { db, saveProject, createSnapshot, addAsset } from '../db/db'
import { totalWords } from '../model/docUtils'
import type { Asset, BookDoc, BookMeta, BookSettings, LayoutFamily, PMNode, Project } from '../model/types'
import { settingsFor } from '../data/layouts'
import { migrateArtKeys } from '../pageArt'

export type SaveState = 'saved' | 'saving' | 'dirty'

interface ProjectCtx {
  project: Project
  assets: Asset[]
  assetMap: Record<string, string>
  saveState: SaveState
  updateDoc: (fn: (doc: BookDoc) => BookDoc, opts?: { snapshot?: string; snapshotBefore?: boolean }) => void
  updateMeta: (patch: Partial<BookMeta>) => void
  updateSettings: (patch: Partial<BookSettings>) => void
  applyLayout: (layout: LayoutFamily) => void
  replaceDoc: (doc: BookDoc, snapshotLabel?: string, opts?: { snapshotBefore?: boolean }) => void
  setSceneContent: (sceneId: string, content: PMNode[]) => void
  setFootnote: (id: string, text: string) => void
  uploadImage: (file: File) => Promise<Asset>
  takeSnapshot: (label: string) => Promise<void>
  /** remember the last pagination (page count + text anchors for page art) */
  recordPagination: (pageCount: number, keys: string[]) => void
  /** Write any pending autosave now. Call before an export or a tab change. */
  flushNow: () => Promise<void>
  refreshAssets: () => Promise<void>
  lastSavedAt: number | null
  words: number
}

const Ctx = createContext<ProjectCtx | null>(null)
export const useProject = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useProject outside provider')
  return c
}

export function ProjectProvider({ initial, children }: { initial: Project; children: React.ReactNode }) {
  const [project, setProject] = useState<Project>(initial)
  const [assets, setAssets] = useState<Asset[]>([])
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const timer = useRef<number | null>(null)
  const latest = useRef<Project>(initial)
  const dirty = useRef(false)
  const sessionSnap = useRef(false)
  const lastSnapAt = useRef(Date.now())

  latest.current = project

  const refreshAssets = useCallback(async () => {
    const list = await db.assets.where('projectId').equals(initial.id).toArray()
    setAssets(list)
  }, [initial.id])

  useEffect(() => {
    void refreshAssets()
  }, [refreshAssets])

  const flush = useCallback(async () => {
    if (!dirty.current) return
    dirty.current = false
    setSaveState('saving')
    const p = latest.current
    await saveProject(p)
    setSaveState('saved')
    setLastSavedAt(Date.now())
    if (!sessionSnap.current) {
      sessionSnap.current = true
      await createSnapshot(p, 'Session start')
      lastSnapAt.current = Date.now()
    } else if (Date.now() - lastSnapAt.current > 10 * 60 * 1000) {
      await createSnapshot(p, 'Autosave')
      lastSnapAt.current = Date.now()
    }
  }, [])

  const schedule = useCallback(() => {
    dirty.current = true
    setSaveState('dirty')
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void flush(), 600)
  }, [flush])

  // Interval autosave: every N minutes (default 5), regardless of the debounce.
  // A periodic snapshot-less flush that also takes a labelled snapshot so the
  // version history has regular safety points.
  const autosaveMin = Math.max(5, Math.round((project.settings.autosaveMinutes ?? 5) / 5) * 5)
  useEffect(() => {
    const id = window.setInterval(() => {
      if (dirty.current) void flush()
    }, autosaveMin * 60 * 1000)
    return () => window.clearInterval(id)
  }, [autosaveMin, flush])

  useEffect(() => {
    const onBeforeUnload = () => {
      if (dirty.current) void saveProject(latest.current)
    }
    // A debounced autosave is only as good as the last flush. Switching tab or
    // leaving the window is exactly when a user expects the book to be safe, so
    // flush on hide/blur too, not just on unload.
    const onHide = () => {
      if (document.visibilityState === 'hidden' && dirty.current) void flush()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('pagehide', onBeforeUnload)
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('blur', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('pagehide', onBeforeUnload)
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('blur', onBeforeUnload)
      if (timer.current) window.clearTimeout(timer.current)
      if (dirty.current) void saveProject(latest.current)
    }
  }, [flush])

  const mutate = useCallback(
    (fn: (p: Project) => Project) => {
      setProject((prev) => {
        const next = fn(prev)
        latest.current = next
        return next
      })
      schedule()
    },
    [schedule],
  )

  // Snapshot the state BEFORE an operation only when the caller says so
  // explicitly (destructive actions do: "Deleted: X" keeps a copy of the book
  // with X still in it, which is the thing you actually want back). Otherwise
  // capture the result so a label describes what restoring returns.
  const updateDoc = useCallback(
    (fn: (doc: BookDoc) => BookDoc, opts?: { snapshot?: string; snapshotBefore?: boolean }) => {
      mutate((p) => {
        const doc = fn(p.doc)
        if (opts?.snapshot) void createSnapshot({ ...p, doc: opts.snapshotBefore ? p.doc : doc }, opts.snapshot)
        return { ...p, doc }
      })
    },
    [mutate],
  )

  const setSceneContent = useCallback(
    (sceneId: string, content: PMNode[]) => {
      mutate((p) => ({ ...p, doc: { ...p.doc, scenes: { ...p.doc.scenes, [sceneId]: content } } }))
    },
    [mutate],
  )

  const setFootnote = useCallback(
    (id: string, text: string) => {
      mutate((p) => ({ ...p, doc: { ...p.doc, footnotes: { ...p.doc.footnotes, [id]: text } } }))
    },
    [mutate],
  )

  const updateMeta = useCallback((patch: Partial<BookMeta>) => mutate((p) => ({ ...p, meta: { ...p.meta, ...patch } })), [mutate])
  /** Switch layout family: applies its full set of page/type rules, but keeps the
   *  user's own artwork choices so switching style does not throw away images. */
  const applyLayout = useCallback(
    (layout: LayoutFamily) =>
      mutate((p) => {
        const next = settingsFor(layout)
        next.graphics = {
          ...next.graphics,
          vignetteImageId: p.settings.graphics?.vignetteImageId,
          sidebarImageId: p.settings.graphics?.sidebarImageId,
          plateImageId: p.settings.graphics?.plateImageId,
        }
        next.cover = { ...next.cover, coverImageId: p.settings.cover.coverImageId, backImageId: p.settings.cover.backImageId, backText: p.settings.cover.backText }
        next.pageArt = p.settings.pageArt
        return { ...p, settings: next }
      }),
    [mutate],
  )
  const updateSettings = useCallback((patch: Partial<BookSettings>) => mutate((p) => ({ ...p, settings: { ...p.settings, ...patch } })), [mutate])
  const replaceDoc = useCallback(
    (doc: BookDoc, snapshotLabel?: string, opts?: { snapshotBefore?: boolean }) => {
      mutate((p) => {
        if (snapshotLabel) void createSnapshot(opts?.snapshotBefore ? p : { ...p, doc }, snapshotLabel)
        return { ...p, doc }
      })
    },
    [mutate],
  )
  const recordPagination = useCallback(
    (pageCount: number, keys: string[]) => {
      const prev = latest.current
      const same =
        prev.lastPaginated?.pageCount === pageCount &&
        (prev.lastPaginated?.keys || []).join('|') === keys.join('|')
      const mig = migrateArtKeys(prev.settings.pageArt, prev.settings.pageArtAllKey, keys)
      if (same && !mig.changed) return
      mutate((p) => ({
        ...p,
        lastPaginated: { pageCount, spineWidth: p.lastPaginated?.spineWidth || 0, at: Date.now(), keys },
        settings: mig.changed ? { ...p.settings, pageArt: mig.map, pageArtAllKey: mig.allKey } : p.settings,
      }))
    },
    [mutate],
  )
  const takeSnapshot = useCallback(async (label: string) => {
    await createSnapshot(latest.current, label)
  }, [])
  const uploadImage = useCallback(
    async (file: File) => {
      const a = await addAsset(initial.id, file).catch((e: Error) => {
        window.alert(e.message)
        throw e
      })
      await refreshAssets()
      return a
    },
    [initial.id, refreshAssets],
  )

  const assetMap = useMemo(() => Object.fromEntries(assets.map((a) => [a.id, a.dataUrl])), [assets])
  const words = useMemo(() => totalWords(project.doc), [project.doc])

  const value: ProjectCtx = {
    project,
    assets,
    assetMap,
    saveState,
    updateDoc,
    updateMeta,
    updateSettings,
    applyLayout,
    replaceDoc,
    setSceneContent,
    setFootnote,
    uploadImage,
    takeSnapshot,
    recordPagination,
    flushNow: flush,
    refreshAssets,
    lastSavedAt,
    words,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
