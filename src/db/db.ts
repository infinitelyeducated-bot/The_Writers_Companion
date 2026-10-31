import Dexie, { type Table } from 'dexie'
import type { Asset, Note, Project, Snapshot } from '../model/types'
import { totalWords } from '../model/docUtils'

export class WritersCompanionDB extends Dexie {
  projects!: Table<Project, string>
  snapshots!: Table<Snapshot, string>
  assets!: Table<Asset, string>
  notes!: Table<Note, string>

  constructor() {
    super('writerscompanion')
    this.version(1).stores({
      projects: 'id, updatedAt, meta.title',
      snapshots: 'id, projectId, createdAt',
      assets: 'id, projectId',
      notes: 'id, projectId, updatedAt',
    })
  }
}

export const db = new WritersCompanionDB()

export async function getProject(id: string): Promise<Project | undefined> {
  return db.projects.get(id)
}

export async function saveProject(p: Project): Promise<void> {
  p.updatedAt = Date.now()
  await db.projects.put(p)
}

export async function createSnapshot(p: Project, label: string): Promise<Snapshot> {
  const snap: Snapshot = {
    id: 'snap_' + Math.random().toString(36).slice(2, 10),
    projectId: p.id,
    label,
    createdAt: Date.now(),
    // a snapshot must say how long it is: version history shows this, and it is
    // the only cheap way to tell two "Autosave" rows apart at a glance
    wordCount: totalWords(p.doc),
    doc: JSON.parse(JSON.stringify(p.doc)),
    // settings travel with the words: restoring a snapshot puts the layout,
    // typography and page art back too, not just the text
    settings: JSON.parse(JSON.stringify(p.settings)),
  }
  await db.snapshots.add(snap)
  // prune to 50
  const all = await db.snapshots.where('projectId').equals(p.id).sortBy('createdAt')
  if (all.length > 50) {
    const excess = all.slice(0, all.length - 50)
    await db.snapshots.bulkDelete(excess.map((s) => s.id))
  }
  return snap
}

function toBase64(bytes: Uint8Array): string {
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode(...bytes.subarray(i, i + chunk))
  return btoa(bin)
}

/** Number of frames in a GIF (0 if not a GIF / unreadable). */
function gifFrames(bytes: Uint8Array): number {
  let n = 0
  for (let i = 0; i + 2 < bytes.length; i++) {
    if (bytes[i] === 0x21 && bytes[i + 1] === 0xf9) n++
  }
  return n
}

/** Largest single image accepted (bytes). Browsers and printers get unreliable well
 *  before this, and a data URL inflates the stored bytes by about a third. */
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024
/** Refuse to let the library grow past this many images in total. */
export const MAX_ASSETS = 2000

export async function addAsset(projectId: string, file: File): Promise<Asset> {
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`${file.name} is ${(file.size / 1048576).toFixed(1)} MB. Images must be under ${MAX_IMAGE_BYTES / 1048576} MB.`)
  }
  // Animated images must survive the round-trip unchanged: a data URL keeps the
  // GIF/APNG byte-for-byte so frame delays are not lost.
  const bytes = new Uint8Array(await file.arrayBuffer())
  const head = String.fromCharCode(...bytes.slice(0, 6))
  let mime = file.type
  if (!mime) {
    if (head.startsWith('GIF')) mime = 'image/gif'
    else if (head.startsWith('\x89PNG')) mime = 'image/png'
    else if (head.startsWith('\xff\xd8')) mime = 'image/jpeg'
    else if (head.startsWith('<svg') || head.startsWith('<?xml')) mime = 'image/svg+xml'
    else mime = 'image/png'
  }
  const dataUrl = `data:${mime};base64,${toBase64(bytes)}`
  const { w, h } = await new Promise<{ w: number; h: number }>((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => resolve({ w: 0, h: 0 })
    img.src = dataUrl
  })
  const count = await db.assets.count()
  if (count >= MAX_ASSETS) {
    throw new Error(`This library already holds ${MAX_ASSETS} images. Remove some before adding more.`)
  }
  const asset: Asset = {
    id: 'img_' + Math.random().toString(36).slice(2, 10),
    projectId,
    name: file.name,
    mime,
    dataUrl,
    width: w,
    height: h,
    bytes: Math.round((dataUrl.length * 3) / 4),
    createdAt: Date.now(),
    ...(head.startsWith('GIF') ? { frames: gifFrames(bytes) } : {}),
  }
  await db.assets.add(asset)
  return asset
}

// ── Project backup / restore ─────────────────────────────────────────────────
// A backup is the whole book: project row, its images, notes and snapshots.
// Restoring must be all-or-nothing, so it runs inside one Dexie transaction;
// a half-restored book is worse than a failed restore.

export interface ProjectBackup {
  project: Project
  assets?: Asset[]
  notes?: Note[]
  snapshots?: Snapshot[]
  exportedAt?: number
}

export function validateBackup(data: unknown): { ok: true; backup: ProjectBackup } | { ok: false; error: string } {
  const d = data as ProjectBackup | null
  if (!d || typeof d !== 'object') return { ok: false, error: 'That file is not a Writers Companion backup.' }
  const p = d.project
  if (!p || typeof p !== 'object' || !p.id || !p.meta || !p.settings || !p.doc) {
    return { ok: false, error: 'The backup is missing its project record (or it is from an older, incompatible version).' }
  }
  if (!Array.isArray(p.doc.blocks) || typeof p.doc.scenes !== 'object') {
    return { ok: false, error: 'The backup\'s manuscript is not readable (blocks or scenes missing).' }
  }
  return { ok: true, backup: d }
}

export async function restoreBackup(backup: ProjectBackup): Promise<Project> {
  const project: Project = { ...backup.project, updatedAt: Date.now() }
  const assets = (backup.assets || []).map((a) => ({ ...a, projectId: project.id }))
  const notes = (backup.notes || []).map((n) => ({ ...n, projectId: project.id }))
  const snapshots = (backup.snapshots || []).map((s) => ({ ...s, projectId: project.id }))
  await db.transaction('rw', db.projects, db.assets, db.notes, db.snapshots, async () => {
    await db.assets.where('projectId').equals(project.id).delete()
    await db.notes.where('projectId').equals(project.id).delete()
    await db.snapshots.where('projectId').equals(project.id).delete()
    await db.projects.put(project)
    if (assets.length) await db.assets.bulkPut(assets)
    if (notes.length) await db.notes.bulkPut(notes)
    if (snapshots.length) await db.snapshots.bulkPut(snapshots)
  })
  return project
}

/** Read a `.writerscompanion.json` file and say whether it can be restored. */
export async function readBackupFile(file: File): Promise<{ ok: true; backup: ProjectBackup } | { ok: false; error: string }> {
  try {
    const text = await file.text()
    return validateBackup(JSON.parse(text))
  } catch {
    return { ok: false, error: 'That file could not be read as JSON.' }
  }
}
