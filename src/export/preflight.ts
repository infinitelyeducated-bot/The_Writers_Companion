import type { Project } from '../model/types'

// ─────────────────────────────────────────────────────────────────────────────
// KDP-style preflight checks.
// ─────────────────────────────────────────────────────────────────────────────

export type CheckLevel = 'error' | 'warn' | 'info' | 'pass'

export interface Check {
  id: string
  level: CheckLevel
  title: string
  detail: string
  fix?: string
}

export interface PreflightInput {
  project: Project
  pageCount: number
  gutter: number
  textWidthIn: number
  textHeightIn: number
  missingImages: string[]
  assetDpi: { name: string; dpi: number; placedIn: number }[]
  emptyChapters: string[]
}

export function kdpGutterFor(pageCount: number): number {
  if (pageCount <= 24) return 0
  if (pageCount <= 150) return 0.375
  if (pageCount <= 300) return 0.5
  if (pageCount <= 500) return 0.625
  if (pageCount <= 700) return 0.75
  if (pageCount <= 828) return 0.875
  return 1.0
}

export function runPreflight(input: PreflightInput): Check[] {
  const { project, pageCount, gutter, textWidthIn, textHeightIn, missingImages, assetDpi, emptyChapters } = input
  const { settings, meta } = project
  const checks: Check[] = []
  const needed = kdpGutterFor(pageCount)

  // page count
  if (pageCount < 24) {
    checks.push({ id: 'pages', level: 'error', title: 'Too few pages for print', detail: `Interior is ${pageCount} pages. KDP requires at least 24 pages for a paperback.` })
  } else if (pageCount > 828) {
    checks.push({ id: 'pages', level: 'error', title: 'Too many pages for one volume', detail: `${pageCount} pages exceeds KDP's 828-page limit. Split the book or change trim size.` })
  } else {
    checks.push({ id: 'pages', level: 'pass', title: `Page count: ${pageCount}`, detail: `Within KDP's 24–828 page range for black & white paperback.` })
  }

  // gutter
  if (settings.margins.autoGutter) {
    if (gutter < needed) {
      checks.push({ id: 'gutter', level: 'error', title: 'Gutter too small', detail: `At ${pageCount} pages KDP requires a ${needed}″ inside margin; yours is ${gutter}″.`, fix: 'Enable auto-gutter or raise the gutter override.' })
    } else {
      checks.push({ id: 'gutter', level: 'pass', title: `Gutter ${gutter}″`, detail: `Meets the ${needed}″ minimum for ${pageCount} pages (auto-widened).` })
    }
  } else {
    if (gutter < needed) {
      checks.push({ id: 'gutter', level: 'error', title: 'Gutter too small', detail: `Manual gutter ${gutter}″ is below the ${needed}″ required at ${pageCount} pages.`, fix: 'Turn on auto-gutter or raise the override.' })
    } else checks.push({ id: 'gutter', level: 'pass', title: `Gutter ${gutter}″ (manual)`, detail: `Meets the ${needed}″ minimum for ${pageCount} pages.` })
  }

  // outside margin minimum (KDP: >= 0.25")
  if (settings.margins.outside < 0.25) {
    checks.push({ id: 'outside', level: 'error', title: 'Outside margin below 0.25″', detail: `Outside margin is ${settings.margins.outside}″; KDP requires at least 0.25″.` })
  } else checks.push({ id: 'outside', level: 'pass', title: `Outside margin ${settings.margins.outside}″`, detail: 'Meets the 0.25″ minimum.' })

  if (settings.margins.top < 0.25 || settings.margins.bottom < 0.25) {
    checks.push({ id: 'tbmargin', level: 'error', title: 'Top/bottom margin below 0.25″', detail: `Top ${settings.margins.top}″, bottom ${settings.margins.bottom}″.` })
  }

  // text block width
  if (textWidthIn < 2.5) {
    checks.push({ id: 'textwidth', level: 'warn', title: 'Narrow text block', detail: `Text measure is ${textWidthIn.toFixed(2)}″ — under 2.5″ causes frequent hyphenation and loose lines.`, fix: 'Reduce inside/outside margins or use a larger trim size.' })
  }
  if (textHeightIn / (textWidthIn * 1.5) > 1.55) {
    checks.push({ id: 'linesperpage', level: 'warn', title: 'Very long measure', detail: `About ${Math.round((textHeightIn * 72) / (settings.typography.fontSize * settings.typography.lineHeight))} lines per page — above the comfortable 30–40 range.`, fix: 'Increase font size or line height.' })
  }

  // bleed
  if (settings.bleed) {
    checks.push({ id: 'bleed', level: 'pass', title: `Bleed ${settings.bleedSize}″ configured`, detail: 'Full-bleed images must extend at least 0.125″ past the trim.' })
    if (!settings.cropMarks) checks.push({ id: 'cropmarks', level: 'warn', title: 'Bleed without crop marks', detail: 'Most printers want crop marks when bleed is used. Enable crop marks on export.' })
  } else {
    checks.push({ id: 'bleed', level: 'info', title: 'No bleed', detail: 'Only needed if images or colour panels run to the page edge.' })
  }

  // missing images
  if (missingImages.length) {
    checks.push({ id: 'images', level: 'error', title: `${missingImages.length} image(s) missing`, detail: missingImages.join(', ') })
  }

  // image resolution
  const lowDpi = assetDpi.filter((a) => a.dpi < 300)
  if (lowDpi.length) {
    checks.push({
      id: 'dpi',
      level: lowDpi.some((a) => a.dpi < 200) ? 'error' : 'warn',
      title: `${lowDpi.length} image(s) below 300 ppi`,
      detail: lowDpi.map((a) => `${a.name} at ${Math.round(a.dpi)} ppi when placed ${a.placedIn.toFixed(1)}″ wide`).join('; '),
      fix: 'Replace with higher-resolution art or reduce the placed width.',
    })
  } else if (assetDpi.length) {
    checks.push({ id: 'dpi', level: 'pass', title: 'All images ≥ 300 ppi', detail: `${assetDpi.length} placed image(s) checked.` })
  }

  // fonts
  checks.push({ id: 'fonts', level: 'info', title: 'Fonts', detail: 'The interior PDF is produced by your browser with the selected typefaces embedded as subsets. Use Google Fonts or system serif faces with a full italic set for best results.' })

  // empty chapters
  if (emptyChapters.length) {
    checks.push({ id: 'empty', level: 'warn', title: `${emptyChapters.length} empty section(s)`, detail: emptyChapters.join(', ') })
  }

  // metadata
  if (!meta.title || meta.title === 'Untitled Book') checks.push({ id: 'title', level: 'warn', title: 'Missing title', detail: 'Set a title in Book details — it drives the title page, running heads, cover and EPUB.' })
  if (!meta.author || meta.author === 'Anonymous') checks.push({ id: 'author', level: 'warn', title: 'Missing author name', detail: 'Set the author in Book details.' })
  if (!meta.isbn) checks.push({ id: 'isbn', level: 'info', title: 'No ISBN', detail: 'KDP supplies a free ISBN for paperback; add yours for wider distribution.' })

  // TOC
  if (settings.toc.enabled) checks.push({ id: 'toc', level: 'pass', title: 'Table of contents', detail: 'Auto-generated with live page references.' })

  // endnotes / footnotes
  if (settings.footnoteMode === 'page') checks.push({ id: 'fn', level: 'info', title: 'Footnotes at page bottom', detail: 'Measured into each page; long notes reduce the text area on that page.' })

  return checks
}

export function worstLevel(checks: Check[]): CheckLevel {
  if (checks.some((c) => c.level === 'error')) return 'error'
  if (checks.some((c) => c.level === 'warn')) return 'warn'
  return 'pass'
}
