import { downloadBlob } from './download'

/**
 * "Save as…" for every export. Where the browser supports the File System Access
 * API (Chrome, Edge, Opera on a computer) this opens the real Save dialog, so the
 * writer picks the folder and the file name. Everywhere else (Firefox, Safari,
 * phones) it asks for a file name and uses the ordinary download or share sheet.
 *
 * The preference lives under `writerscompanion.saveAs`; "off" skips the question
 * and downloads straight away under the suggested name.
 */

const KEY = 'writerscompanion.saveAs'

export function askWhereToSave(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export function setAskWhereToSave(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    /* storage unavailable: keep the default */
  }
}

type Picker = (opts: unknown) => Promise<{ createWritable: () => Promise<{ write: (b: Blob) => Promise<void>; close: () => Promise<void> }>; name: string }>

export interface SaveResult {
  saved: boolean
  /** the name actually used, when known */
  name?: string
  how: 'dialog' | 'download' | 'cancelled'
}

export async function saveAs(blob: Blob, suggestedName: string, description = 'File'): Promise<SaveResult> {
  if (!askWhereToSave()) {
    await downloadBlob(blob, suggestedName)
    return { saved: true, name: suggestedName, how: 'download' }
  }
  const picker = (window as unknown as { showSaveFilePicker?: Picker }).showSaveFilePicker
  if (typeof picker === 'function') {
    try {
      const ext = suggestedName.includes('.') ? '.' + suggestedName.split('.').slice(-1)[0] : ''
      const handle = await picker({
        suggestedName,
        types: ext ? [{ description, accept: { [blob.type || 'application/octet-stream']: [ext] } }] : undefined,
      })
      const w = await handle.createWritable()
      await w.write(blob)
      await w.close()
      return { saved: true, name: handle.name, how: 'dialog' }
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return { saved: false, how: 'cancelled' }
      // anything else (blocked in a frame, permission): fall through to the name prompt
    }
  }
  const chosen = window.prompt('Save as (file name):', suggestedName)
  if (chosen === null) return { saved: false, how: 'cancelled' }
  const ext = suggestedName.includes('.') ? '.' + suggestedName.split('.').slice(-1)[0] : ''
  let name = chosen.trim() || suggestedName
  if (ext && !name.toLowerCase().endsWith(ext.toLowerCase())) name += ext
  await downloadBlob(blob, name)
  return { saved: true, name, how: 'download' }
}
