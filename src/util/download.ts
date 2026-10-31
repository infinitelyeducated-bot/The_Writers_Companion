import { isTouch } from '../target'

/**
 * Save a file. On a desktop this is an ordinary download. Inside a phone app
 * (the Android and iOS builds) the WebView often ignores a download attribute,
 * so the file is handed to the operating system's share sheet instead — which
 * is where "save to Files", "send to email" and "open in Books" live.
 */
export async function downloadBlob(blob: Blob, fileName: string) {
  if (isTouch() && typeof navigator !== 'undefined' && 'canShare' in navigator) {
    const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' })
    const data = { files: [file], title: fileName }
    if ((navigator as Navigator & { canShare?: (d: unknown) => boolean }).canShare?.(data)) {
      try {
        await navigator.share(data)
        return
      } catch {
        /* the user cancelled, or the sheet failed: fall through to download */
      }
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  // Removing the anchor in the same tick can cancel a large blob download in
  // Chromium (seen with multi-MB workspace files opened from file://).
  window.setTimeout(() => a.remove(), 1000)
  // Revoking too early cancels the download mid-write: a workspace file with
  // pictures can be tens of MB. Keep the URL alive well past any realistic
  // write; the blob is freed when the page unloads anyway.
  window.setTimeout(() => URL.revokeObjectURL(url), 120000)
}

export function downloadText(text: string, fileName: string, mime = 'text/plain') {
  downloadBlob(new Blob([text], { type: mime }), fileName)
}
