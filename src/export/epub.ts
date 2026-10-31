import JSZip from 'jszip'
import type { Asset, Project } from '../model/types'
import { buildEpubXhtml, xhtmlDoc } from './epubXhtml'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const EPUB_CSS = `
@namespace epub "http://www.idpf.org/2007/ops";
body { font-family: Georgia, "Literata", serif; line-height: 1.5; margin: 0 5%; }
h1, h2, h3 { font-weight: normal; text-align: center; line-height: 1.2; page-break-after: avoid; }
h1 { font-size: 1.8em; margin: 2em 0 1.5em; }
h2 { font-size: 1.3em; margin: 1.6em 0 0.8em; }
h3 { font-size: 1.1em; margin: 1.4em 0 0.6em; }
p { margin: 0; text-indent: 1.5em; text-align: justify; }
h1 + p, h2 + p, h3 + p, blockquote + p, figure + p, .sb + p, .titlepage p, .cp { text-indent: 0; }
blockquote { margin: 1.2em 2em; font-style: italic; }
blockquote p { text-indent: 0; }
.attrib { text-align: right; font-style: normal; font-size: 0.9em; margin-top: 0.4em; }
.sb { text-align: center; text-indent: 0; margin: 1.2em 0; }
figure.img { margin: 1.4em 0; text-align: center; text-indent: 0; }
figure.img img { max-width: 100%; height: auto; }
figcaption { font-size: 0.85em; font-style: italic; margin-top: 0.4em; text-align: center; }
.titlepage { text-align: center; margin-top: 20%; }
.titlepage h1 { font-size: 2.2em; margin-bottom: 2em; }
.titlepage .author { text-indent: 0; font-size: 1.2em; letter-spacing: 0.08em; }
.cover-wrap { margin: 0; padding: 0; text-align: center; }
img.cover { max-width: 100%; max-height: 100vh; }
sup a { text-decoration: none; }
.note { text-indent: 0; margin: 0.6em 0; font-size: 0.92em; }
.note a.back { text-decoration: none; }
.sc { font-variant: small-caps; }
.note .n { font-weight: bold; }
ul, ol { margin: 0.8em 0 0.8em 1.5em; }
li { margin: 0.3em 0; text-align: left; }
.part-title { font-size: 2em; margin-top: 30%; }
`

export interface EpubResult {
  blob: Blob
  fileName: string
  files: number
  issues: string[]
}

export async function buildEpub(project: Project, assets: Asset[]): Promise<EpubResult> {
  const zip = new JSZip()
  const { meta, settings } = project
  const bookId = 'urn:uuid:' + uuidFromSeed(project.id)
  const lang = meta.language || 'en'

  // mimetype must be first and uncompressed
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  )

  // images
  const imgFolder = zip.folder('OEBPS/images')!
  const imageFiles: { href: string; mime: string; id: string }[] = []
  const imageHref = (assetId: string): string | null => {
    const a = assets.find((x) => x.id === assetId)
    if (!a) return null
    const existing = imageFiles.find((f) => f.id === a.id)
    if (existing) return existing.href
    const ext = a.mime.includes('png') ? 'png' : a.mime.includes('jpeg') ? 'jpg' : a.mime.includes('gif') ? 'gif' : a.mime.includes('svg') ? 'svg' : 'jpg'
    const href = `img-${imageFiles.length + 1}.${ext}`
    const base64 = a.dataUrl.split(',')[1] || ''
    imgFolder.file(href, base64, { base64: true })
    imageFiles.push({ href, mime: a.mime, id: a.id })
    return href
  }

  // cover image: user-uploaded cover or a generated SVG cover
  let coverHref: string | null = null
  const coverAsset = settings.cover.coverImageId ? assets.find((a) => a.id === settings.cover.coverImageId) : undefined
  if (settings.epub.includeCover) {
    if (coverAsset) {
      coverHref = imageHref(coverAsset.id)
    } else {
      coverHref = 'cover.svg'
      imgFolder.file('cover.svg', svgCover(project))
    }
  }

  const chapters = buildEpubXhtml(project.doc, { title: meta.title, author: meta.author, language: lang }, {
    endnotes: settings.footnoteMode === 'end' || settings.epub.endnotes,
    coverHref,
    imageHref,
  })

  const issues: string[] = []
  let fontCss = ''
  let fontFiles: { name: string }[] = []
  if (settings.epub.embedFonts) {
    const { embedEpubFonts } = await import('./epubFonts')
    const res = await embedEpubFonts(zip, project, issues)
    fontCss = res.css
    fontFiles = Array.from({ length: res.files }, (_, i) => ({ name: `f${i + 1}.woff2` }))
    if (res.files) issues.push(`Embedded ${res.files} font file(s); the EPUB uses the book's real faces.`)
  }
  zip.file('OEBPS/styles/book.css', fontCss + EPUB_CSS)
  if (!coverHref) issues.push('No cover image: ebook cover omitted (enable it in Cover settings).')
  if (settings.footnoteMode === 'page') issues.push('Footnotes in print layout are page-bottom; the EPUB uses endnotes (EPUB has no page-bottom notes).')

  const manifest: string[] = []
  const spine: string[] = []
  chapters.forEach((c) => {
    const cid = c.href.replace(/\.xhtml$/, '').replace(/[^a-zA-Z0-9-]/g, '-')
    const isCover = c.href === 'cover.xhtml'
    const isNotes = c.href === 'endnotes.xhtml'
    zip.file(
      `OEBPS/${c.href}`,
      xhtmlDoc(c.title, c.body, lang, 'styles/book.css', isCover ? 'cover-page' : isNotes ? 'endnotes' : ''),
    )
    manifest.push(`    <item id="${cid}" href="${c.href}" media-type="application/xhtml+xml"${isNotes ? ' properties="svg"' : ''}/>`)
    spine.push(`    <itemref idref="${cid}"/>`)
  })

  imageFiles.forEach((f) => {
    const cid = 'img-' + f.href.replace(/[^a-zA-Z0-9]/g, '-')
    const isCover = coverHref === f.href
    manifest.push(`    <item id="${cid}" href="images/${f.href}" media-type="${f.mime}"${isCover ? ' properties="cover-image"' : ''}/>`)
  })
  if (coverHref === 'cover.svg') {
    manifest.push(`    <item id="img-cover-svg" href="images/cover.svg" media-type="image/svg+xml" properties="cover-image"/>`)
  }
  manifest.push(`    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`)
  manifest.push(`    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`)
  manifest.push(`    <item id="css" href="styles/book.css" media-type="text/css"/>`)
  fontFiles.forEach((f, i) => {
    manifest.push(`    <item id="font-${i + 1}" href="fonts/${f.name}" media-type="font/woff2"/>`)
  })

  const navItems = chapters
    .filter((c) => c.inNav)
    .map((c) => `      <li><a href="${c.href}">${esc(c.title)}</a></li>`)
    .join('\n')

  zip.file(
    'OEBPS/nav.xhtml',
    xhtmlDoc(
      'Contents',
      `<nav epub:type="toc" id="toc">
    <h1>Contents</h1>
    <ol>
${navItems}
    </ol>
  </nav>
  <nav epub:type="landmarks" id="landmarks" hidden="hidden">
    <ol>
      <li><a epub:type="bodymatter" href="${chapters.find((c) => c.href !== 'cover.xhtml' && c.href !== 'titlepage.xhtml')?.href || chapters[0].href}">Start of Content</a></li>
    </ol>
  </nav>`,
      lang,
    ),
  )

  const navPoints = chapters
    .filter((c) => c.inNav)
    .map(
      (c, i) => `    <navPoint id="np${i + 1}" playOrder="${i + 1}">
      <navLabel><text>${esc(c.title)}</text></navLabel>
      <content src="${c.href}"/>
    </navPoint>`,
    )
    .join('\n')

  zip.file(
    'OEBPS/toc.ncx',
    `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="${esc(lang)}">
  <head>
    <meta name="dtb:uid" content="${esc(bookId)}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${esc(meta.title)}</text></docTitle>
  <docAuthor><text>${esc(meta.author)}</text></docAuthor>
  <navMap>
${navPoints}
  </navMap>
</ncx>`,
  )

  const modified = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="${esc(lang)}">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${esc(bookId)}</dc:identifier>
    <dc:title>${esc(meta.title)}</dc:title>
    ${meta.subtitle ? `<dc:title id="subtitle">${esc(meta.subtitle)}</dc:title>` : ''}
    <dc:creator id="creator">${esc(meta.author)}</dc:creator>
    <dc:language>${esc(lang)}</dc:language>
    <dc:date>${new Date().toISOString().slice(0, 10)}</dc:date>
    ${meta.description ? `<dc:description>${esc(meta.description)}</dc:description>` : ''}
    ${meta.publisher ? `<dc:publisher>${esc(meta.publisher)}</dc:publisher>` : ''}
    ${meta.genre ? `<dc:subject>${esc(meta.genre)}</dc:subject>` : ''}
    <meta property="dcterms:modified">${modified}</meta>
    ${coverHref ? `<meta name="cover" content="${coverHref === 'cover.svg' ? 'img-cover-svg' : 'img-' + coverHref.replace(/[^a-zA-Z0-9]/g, '-')}"/>` : ''}
  </metadata>
  <manifest>
${manifest.join('\n')}
  </manifest>
  <spine toc="ncx">
${spine.join('\n')}
  </spine>
</package>`,
  )

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip', compression: 'DEFLATE' })
  const fileName = safeName(meta.title) + '.epub'
  return { blob, fileName, files: chapters.length + imageFiles.length + 4, issues }
}

function uuidFromSeed(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const hex = (n: number, len: number) => n.toString(16).padStart(len, '0').slice(-len)
  const a = hex(h, 8)
  const b = hex((h ^ 0x9e3779b9) >>> 0, 4)
  const c = '4' + hex((h ^ 0x85ebca6b) >>> 0, 3)
  const d = '8' + hex((h ^ 0xc2b2ae35) >>> 0, 3)
  const e = hex((h ^ 0x27d4eb2f) >>> 0, 4) + hex((h ^ 0x165667b1) >>> 0, 8)
  return `${a}-${b}-${c}-${d}-${e}`
}

export function safeName(s: string): string {
  return s.replace(/[^\w\d\- ]+/g, '').trim().replace(/\s+/g, '-') || 'book'
}

/** Simple generated SVG cover used when no cover art is uploaded. */
export function svgCover(project: Project): string {
  const { meta, settings } = project
  const c = settings.cover
  const W = 1600
  const H = 2560
  const titleLines = wrap(meta.title, 14).slice(0, 4)
  const titleY = 780 - (titleLines.length - 1) * 90
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${c.background}"/>
  <rect x="60" y="60" width="${W - 120}" height="${H - 120}" fill="none" stroke="${c.accentColor}" stroke-width="6"/>
  <rect x="90" y="${H / 2 - 10}" width="220" height="4" fill="${c.accentColor}"/>
  ${titleLines.map((l, i) => `<text x="${W / 2}" y="${titleY + i * 170}" font-family="Georgia, serif" font-size="150" fill="${c.textColor}" text-anchor="middle">${esc(l)}</text>`).join('\n  ')}
  ${meta.subtitle ? `<text x="${W / 2}" y="${titleY + titleLines.length * 170 + 40}" font-family="Georgia, serif" font-size="72" fill="${c.textColor}" text-anchor="middle" opacity="0.85">${esc(meta.subtitle)}</text>` : ''}
  <text x="${W / 2}" y="${H - 380}" font-family="Georgia, serif" font-size="86" fill="${c.textColor}" text-anchor="middle" letter-spacing="8">${esc(meta.author.toUpperCase())}</text>
</svg>`
}

function wrap(s: string, max: number): string[] {
  const words = s.split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) {
      if (cur) lines.push(cur)
      cur = w
    } else cur = (cur + ' ' + w).trim()
  }
  if (cur) lines.push(cur)
  return lines
}
