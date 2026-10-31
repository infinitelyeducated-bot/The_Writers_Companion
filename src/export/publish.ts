import JSZip from 'jszip'
import type { Asset, Project } from '../model/types'
import { totalWords } from '../model/docUtils'
import { buildEpub, safeName } from './epub'
import { exportDocx } from '../io/docx'
import { docToMarkdown } from '../io/markdown'
import { DESTINATIONS } from './destinations'

// ─────────────────────────────────────────────────────────────────────────────
// Publishing package.
//
// No retailer accepts an upload from third-party software, and a browser app
// must not hold your account login. So this builds the next best thing: for each
// store you pick, the exact files it wants, the listing details laid out in the
// order its form asks for them (ready to paste), and a checklist of the steps.
// The retailer's own page does the actual upload.
//
// Only limits that Amazon KDP publishes and that are stable are checked here
// (title, description, keywords, paperback page range). Everything else is left
// to the retailer's form, because stores change their rules and a wrong "limit"
// is worse than none. Each listing says to confirm on the store's own page.
// ─────────────────────────────────────────────────────────────────────────────

export interface Retailer {
  id: string
  name: string
  ebook: boolean
  print: boolean
  /** which files this store's ebook upload takes */
  ebookFiles: ('epub' | 'docx')[]
  steps: string[]
}

const BY_ID = Object.fromEntries(DESTINATIONS.map((d) => [d.id, d]))

export const RETAILERS: Retailer[] = [
  { id: 'kdp', name: 'Amazon KDP', ebook: true, print: true, ebookFiles: ['epub', 'docx'], steps: [
    'Sign in at kdp.amazon.com and choose Create → Kindle eBook (or Paperback).',
    'Enter the details from kdp.txt: title, subtitle, author, description, keywords, categories.',
    'Kindle eBook: upload the EPUB in /ebook and the cover image. Turn on the previewer and read it through.',
    'Paperback: upload the interior PDF and the cover PDF made on the Print layout and Cover tabs, then check the previewer.',
    'Set territories, price and royalty, then publish. Review usually takes up to 72 hours.',
  ] },
  { id: 'apple', name: 'Apple Books', ebook: true, print: false, ebookFiles: ['epub'], steps: [
    'Sign in to Apple Books for Authors (itunespartner.apple.com/books).',
    'Create a new book and enter the details from apple.txt.',
    'Upload the EPUB from /ebook and the cover image. Run EPUBCheck first if you have it.',
    'Set price and territories, then submit for review.',
  ] },
  { id: 'play', name: 'Google Play Books', ebook: true, print: false, ebookFiles: ['epub'], steps: [
    'Sign in to the Google Play Books Partner Center.',
    'Add a book and enter the details from play.txt.',
    'Upload the EPUB from /ebook and the cover image.',
    'Set pricing and territories, then publish.',
  ] },
  { id: 'kobo', name: 'Kobo Writing Life', ebook: true, print: false, ebookFiles: ['epub', 'docx'], steps: [
    'Sign in at kobo.com/writinglife and choose Create new eBook.',
    'Enter the details from kobo.txt.',
    'Upload the EPUB from /ebook and the cover image.',
    'Set price and territories, then publish.',
  ] },
  { id: 'bn', name: 'Barnes & Noble Press', ebook: true, print: true, ebookFiles: ['epub', 'docx'], steps: [
    'Sign in at press.barnesandnoble.com and start a new project (eBook or Print).',
    'Enter the details from bn.txt.',
    'eBook: upload the EPUB. Print: upload the interior PDF and the cover PDF.',
    'Set price, then publish.',
  ] },
  { id: 'd2d', name: 'Draft2Digital', ebook: true, print: true, ebookFiles: ['epub', 'docx'], steps: [
    'Sign in at draft2digital.com and add a book.',
    'Enter the details from d2d.txt.',
    'Upload the EPUB (or the DOCX) from /ebook and the cover image.',
    'Choose which stores and libraries to distribute to, set price, then publish.',
  ] },
  { id: 'ingram', name: 'IngramSpark', ebook: true, print: true, ebookFiles: ['epub'], steps: [
    'Sign in at myaccount.ingramspark.com and create a title.',
    'Enter the details from ingram.txt. An ISBN is required for IngramSpark titles.',
    'Print: upload the interior PDF and the cover PDF (exact trim, fonts embedded, correct bleed). Ebook: upload the EPUB.',
    'Approve the proof, set wholesale discount and returns, then submit.',
  ] },
  { id: 'lulu', name: 'Lulu', ebook: false, print: true, ebookFiles: [], steps: [
    'Sign in at lulu.com/create and choose your book size.',
    'Enter the details from lulu.txt.',
    'Upload the interior PDF and the cover PDF made on the Print layout and Cover tabs.',
    'Review the preview, order a proof, then publish.',
  ] },
]

const LANGS: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian', pt: 'Portuguese', nl: 'Dutch' }

/** Suggested BISAC subject by layout family. A starting point only: confirm in the store's category picker. */
const BISAC: Record<string, string> = {
  romance: 'FIC027000 · Fiction / Romance / General',
  fantasy: 'FIC009000 · Fiction / Fantasy / General',
  scifi: 'FIC028000 · Fiction / Science Fiction / General',
  mystery: 'FIC022000 · Fiction / Mystery & Detective / General  (or FIC031000 · Thrillers / General)',
  paranormal: 'FIC012000 · Fiction / Occult & Supernatural',
  adventure: 'FIC002000 · Fiction / Action & Adventure',
  historical: 'FIC014000 · Fiction / Historical / General',
  horror: 'FIC015000 · Fiction / Horror',
  literary: 'FIC019000 · Fiction / Literary',
  shortstories: 'FIC029000 · Fiction / Short Stories (single author)',
  memoir: 'BIO026000 · Biography & Autobiography / Personal Memoirs',
  family: 'BIO026000 · Biography & Autobiography / Personal Memoirs',
  retirees: 'BIO026000 · Biography & Autobiography / Personal Memoirs',
  trade: 'FIC019000 · Fiction / Literary  (choose the genre that fits your book)',
  firstnovel: 'FIC019000 · Fiction / Literary  (choose the genre that fits your book)',
  series: 'FIC009000 · Fiction / Fantasy / General  (choose the genre that fits your book)',
  selfpub: 'FIC022000 · Fiction / Mystery & Detective / General  (choose the genre that fits your book)',
  hobby: 'FIC019000 · Fiction / Literary  (choose the genre that fits your book)',
  ya: 'YAF000000 · Young Adult Fiction  (then narrow to your genre)',
  children: 'JUV000000 · Juvenile Fiction  (then narrow to your subject)',
  poetry: 'POE000000 · Poetry / General',
  play: 'DRA000000 · Drama / General',
  screenplay: 'PER004000 · Performing Arts / Film / Screenwriting',
  technical: 'TEC000000 · Technology & Engineering / General  (choose the subject that fits)',
  professional: 'BUS000000 · Business & Economics / General  (choose the subject that fits)',
}

export type Level = 'error' | 'warn' | 'ok'
export interface Readiness {
  level: Level
  title: string
  detail: string
}

export interface PublishContext {
  project: Project
  assets: Asset[]
  pageCount: number
}

const PLACEHOLDER_TITLES = ['untitled book', 'untitled']
const PLACEHOLDER_AUTHORS = ['anonymous', '']

/** Things worth fixing before you upload anywhere. */
export function readiness({ project, assets, pageCount }: PublishContext): Readiness[] {
  const { meta, settings, doc } = project
  const out: Readiness[] = []
  const words = totalWords(doc)
  const chapters = doc.blocks.filter((b) => b.type === 'chapter')
  const add = (level: Level, title: string, detail: string) => out.push({ level, title, detail })

  if (PLACEHOLDER_TITLES.includes(meta.title.trim().toLowerCase())) add('error', 'Title is still the placeholder', 'Set the real title on the Write tab (Book details).')
  else add('ok', 'Title set', meta.title)
  if (PLACEHOLDER_AUTHORS.includes(meta.author.trim().toLowerCase())) add('error', 'Author name is missing', 'Retailers need the name that appears on the cover and title page.')
  else add('ok', 'Author set', meta.author)
  if (!meta.description.trim()) add('error', 'No book description', 'Every store asks for one: it is the sales copy readers see.')
  else if (meta.description.length > 4000) add('error', 'Description is over 4,000 characters', `It is ${meta.description.length}. Amazon KDP cuts it off at 4,000.`)
  else if (meta.description.trim().length < 150) add('warn', 'Description is very short', `Only ${meta.description.trim().length} characters. A fuller description sells more books.`)
  else add('ok', 'Description set', `${meta.description.trim().length} characters`)
  if (words < 100) add('error', 'The book is almost empty', `${words} words.`)
  else add('ok', 'Manuscript has text', `${words.toLocaleString()} words in ${chapters.length} chapter${chapters.length === 1 ? '' : 's'}`)
  const empty = chapters.filter((b) => b.sceneIds.every((s) => !(doc.scenes[s] || []).some((n) => JSON.stringify(n).includes('"text"'))))
  if (empty.length) add('warn', `${empty.length} empty chapter${empty.length === 1 ? '' : 's'}`, empty.slice(0, 4).map((b) => b.title).join(', ') + (empty.length > 4 ? '…' : ''))
  if (!meta.isbn.trim()) add('warn', 'No ISBN entered', 'Optional for Amazon ebooks and paperbacks (KDP can assign one). Required by IngramSpark. Enter it in Book details if you have one.')
  else add('ok', 'ISBN set', meta.isbn)
  if (settings.cover.coverImageId && assets.some((a) => a.id === settings.cover.coverImageId)) add('ok', 'Cover image uploaded', 'It goes into the package for the stores that need a separate cover file.')
  else add('warn', 'No uploaded cover image', 'The EPUB gets a generated cover. Stores also want a separate cover image: upload one on the Export tab, or save the ebook cover PNG from the Cover tab.')
  if (pageCount <= 0) add('warn', 'Page count not measured yet', 'Open the Print layout tab once so the book is paginated. Paperbacks need 24–828 pages; ebooks have no page limit.')
  else if (pageCount < 24) add('warn', `Only ${pageCount} pages`, 'Amazon paperbacks need at least 24 pages. Ebooks have no minimum.')
  else if (pageCount > 828) add('warn', `${pageCount} pages is over the paperback maximum`, 'Amazon KDP paperbacks stop at 828 pages. Ebooks are fine.')
  else add('ok', `${pageCount} pages`, `Within the 24–828 page paperback range at ${settings.trim.width}″ × ${settings.trim.height}″.`)
  return out
}

const hr = '─'.repeat(64)

function field(label: string, value: string, note = ''): string {
  return `${label}\n${value || '(not set)'}${note ? '\n' + note : ''}\n`
}

/** Paste-ready listing details for one retailer, in the order its form asks. */
export function listingText(ctx: PublishContext, r: Retailer): string {
  const { project, pageCount } = ctx
  const { meta, settings, doc } = project
  const dest = BY_ID[r.id]
  const words = totalWords(doc)
  const lang = LANGS[meta.language] || meta.language
  const titleFull = meta.subtitle ? `${meta.title}: ${meta.subtitle}` : meta.title
  const kdp = r.id === 'kdp'
  const lines: string[] = []
  lines.push(`${r.name.toUpperCase()}: LISTING DETAILS`)
  lines.push(`Book: ${titleFull} by ${meta.author}`)
  lines.push(`Upload page: ${dest?.url || ''}`)
  lines.push('These details come from your book. Confirm the form on the store’s own page: stores change their fields and rules.')
  lines.push(hr)
  lines.push('')
  lines.push(field('TITLE', meta.title, kdp ? `${meta.title.length} of 200 characters${meta.title.length > 200 ? '  ⚠ TOO LONG' : ''}` : ''))
  lines.push(field('SUBTITLE', meta.subtitle, kdp ? 'On KDP the subtitle counts toward the 200-character title limit.' : ''))
  lines.push(field('AUTHOR', meta.author))
  lines.push(field('LANGUAGE', lang))
  lines.push(field('PUBLISHER', meta.publisher || '(leave blank to publish under your own name)'))
  lines.push(field('COPYRIGHT YEAR', meta.copyrightYear))
  lines.push(field('ISBN', meta.isbn, meta.isbn ? '' : r.id === 'ingram' ? 'IngramSpark requires one.' : 'Optional here; the store can usually assign one.'))
  lines.push(field('DESCRIPTION', meta.description, kdp ? `${meta.description.length} of 4,000 characters${meta.description.length > 4000 ? '  ⚠ TOO LONG' : ''}` : `${meta.description.length} characters`))
  lines.push(field('GENRE (as you entered it)', meta.genre))
  lines.push(field('SUGGESTED CATEGORY (BISAC)', BISAC[settings.layout] || 'Choose in the store’s category picker.', 'A starting point: confirm it fits, and use the store’s own picker.'))
  if (kdp) lines.push(field('KEYWORDS', '(add up to 7 on the KDP form: phrases readers would search for)', 'Not stored in the book, so write them on the portal.'))
  lines.push(hr)
  lines.push('')
  lines.push('ABOUT THE FILES')
  if (r.ebook) lines.push(`• Ebook: ${r.ebookFiles.includes('epub') ? 'EPUB 3' : 'DOCX'} in the /ebook folder.${r.ebookFiles.length > 1 ? ' This store also accepts a ' + r.ebookFiles.filter((f) => f !== 'epub').map((f) => f.toUpperCase()).join('/') + ' (in /manuscript).' : ''}`)
  if (r.print) lines.push(`• Paperback: interior PDF and cover PDF. These are made on the Print layout and Cover tabs (the browser’s Save as PDF), so they are not inside this zip. Trim ${settings.trim.width}″ × ${settings.trim.height}″, ${pageCount > 0 ? pageCount + ' pages' : 'page count not measured yet (open Print layout)'}${settings.bleed ? ', bleed ' + settings.bleedSize + '″' : ', no bleed'}.`)
  lines.push(`• Length: ${words.toLocaleString()} words${pageCount > 0 ? ', ' + pageCount + ' pages' : ''}.`)
  lines.push('')
  lines.push('STEPS')
  r.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`))
  lines.push('')
  return lines.join('\n')
}

function csvCell(s: string): string {
  return '"' + String(s).replace(/"/g, '""') + '"'
}

export interface PackageOptions {
  retailers: string[]
  includeDocx: boolean
  includeMarkdown: boolean
  includeBackup: boolean
}

export interface PackageResult {
  blob: Blob
  fileName: string
  files: string[]
  notes: string[]
}

export async function buildPublishPackage(ctx: PublishContext, opts: PackageOptions): Promise<PackageResult> {
  const { project, assets } = ctx
  const name = safeName(project.meta.title)
  const chosen = RETAILERS.filter((r) => opts.retailers.includes(r.id))
  const needsEbook = chosen.some((r) => r.ebook)
  const zip = new JSZip()
  const files: string[] = []
  const notes: string[] = []
  const put = (path: string, data: string | Blob | Uint8Array) => {
    zip.file(path, data)
    files.push(path)
  }

  if (needsEbook) {
    const epub = await buildEpub(project, assets)
    put(`ebook/${epub.fileName}`, epub.blob)
    epub.issues.forEach((i) => notes.push(i))
  }
  const cover = project.settings.cover.coverImageId ? assets.find((a) => a.id === project.settings.cover.coverImageId) : undefined
  if (cover) {
    const blob = await (await fetch(cover.dataUrl)).blob()
    const ext = (cover.mime.split('/')[1] || 'png').replace('jpeg', 'jpg').replace('svg+xml', 'svg')
    put(`ebook/${name}-cover.${ext}`, blob)
  } else if (needsEbook) {
    notes.push('No cover image uploaded: the EPUB has a generated cover, and no separate cover file is in the package.')
  }
  if (opts.includeDocx && chosen.some((r) => r.ebookFiles.includes('docx'))) put(`manuscript/${name}.docx`, await exportDocx(project))
  if (opts.includeMarkdown) put(`manuscript/${name}.md`, docToMarkdown(project.doc))
  if (opts.includeBackup) put(`${name}.writerscompanion.json`, JSON.stringify({ project, assets: assets.filter((a) => a.projectId === project.id) }, null, 2))

  for (const r of chosen) put(`listings/${r.id}.txt`, listingText(ctx, r))

  const m = project.meta
  const meta = {
    title: m.title, subtitle: m.subtitle, author: m.author, language: m.language, publisher: m.publisher, copyrightYear: m.copyrightYear,
    isbn: m.isbn, genre: m.genre, description: m.description, pages: ctx.pageCount, words: totalWords(project.doc),
    trim: `${project.settings.trim.width}x${project.settings.trim.height}`, suggestedBisac: BISAC[project.settings.layout] || '',
  }
  put('listings/book-metadata.json', JSON.stringify(meta, null, 2))
  put('listings/book-metadata.csv', Object.keys(meta).map(csvCell).join(',') + '\n' + Object.values(meta).map((v) => csvCell(String(v))).join(',') + '\n')

  const ready = readiness(ctx)
  const report = [
    `PUBLISHING PACKAGE: ${m.title}`,
    `Built ${new Date().toLocaleString()} by The Writers Companion`,
    `Stores: ${chosen.map((r) => r.name).join(', ') || '(none)'}`,
    hr,
    '',
    'READINESS',
    ...ready.map((x) => `${x.level === 'ok' ? '[ok]   ' : x.level === 'warn' ? '[check]' : '[FIX]  '} ${x.title}: ${x.detail}`),
    '',
    ...(notes.length ? ['NOTES', ...notes.map((n) => '• ' + n), ''] : []),
    'WHAT IS IN THIS ZIP',
    ...files.map((f) => '• ' + f),
    '',
    'WHAT IS NOT IN THIS ZIP',
    '• The interior PDF and the print cover PDF. Make them on the Print layout and Cover tabs.',
    '• Your account login. No store accepts uploads from other software, so you upload on each store’s own page, using the files and the pasted details here.',
    '',
  ].join('\n')
  put('README-publishing.txt', report)

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
  return { blob, fileName: `${name}-publishing-package.zip`, files, notes }
}
