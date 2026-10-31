import type JSZip from 'jszip'
import type { PMNode, Project } from '../model/types'
import { cssHrefForFamily } from '../fonts/catalog'

/**
 * Optional webfont embedding for EPUB: fetch the Google Fonts CSS for every
 * family the book actually uses, pull the woff2 files, and pack them into
 * OEBPS/fonts with matching @font-face rules. Needs network at export time.
 */
export async function embedEpubFonts(
  zip: JSZip,
  project: Project,
  issues: string[],
): Promise<{ css: string; files: number }> {
  const families = new Set<string>([project.settings.typography.fontFamily])
  const walk = (nodes: PMNode[] | undefined) => {
    for (const n of nodes || []) {
      if (n.type === 'text') {
        const m = (n.marks || []).find((x) => x.type === 'fontFamily')
        if (m?.attrs?.family) families.add(String(m.attrs.family))
      } else if ('content' in n && n.content) walk(n.content as PMNode[])
    }
  }
  for (const sid of Object.keys(project.doc.scenes)) walk(project.doc.scenes[sid])

  let css = ''
  let count = 0
  let bytes = 0
  const folder = zip.folder('OEBPS/fonts')!

  for (const family of families) {
    const href = cssHrefForFamily(family)
    if (!href) continue // system face
    try {
      const sheet = await (await fetch(href)).text()
      // every @font-face block, rewritten to a local file
      const blocks = sheet.match(/@font-face\s*\{[^}]*\}/g) || []
      for (const block of blocks) {
        const url = /url\((https:[^)]+\.woff2)\)/.exec(block)?.[1]
        if (!url) continue
        const buf = await (await fetch(url)).arrayBuffer()
        bytes += buf.byteLength
        if (bytes > 8 * 1024 * 1024) {
          issues.push(`Font embedding stopped at 8 MB — “${family}” and later faces fall back to the reader's serif.`)
          return { css, files: count }
        }
        const name = `f${++count}.woff2`
        folder.file(name, buf)
        css += block.replace(/src:[^;]+;/, `src: url(fonts/${name}) format('woff2');`) + '\n'
      }
    } catch {
      issues.push(`Could not fetch “${family}” for embedding (offline?) — the EPUB falls back to the reader's serif for it.`)
    }
  }
  if (count) {
    css += `body { font-family: '${project.settings.typography.fontFamily}', Georgia, serif; }\n`
  }
  return { css, files: count }
}
