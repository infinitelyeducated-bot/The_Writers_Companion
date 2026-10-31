// ─────────────────────────────────────────────────────────────────────────────
// The Writers Companion — data model. This file is the contract every other module reads.
// ─────────────────────────────────────────────────────────────────────────────

import type { PageArt } from '../pageArt'

export type TrimPreset = '5x8' | '5.25x8' | '5.5x8.5' | '6x9' | '7x10' | '8.5x11' | 'custom'

export interface Trim {
  preset: TrimPreset
  width: number // inches
  height: number // inches
}

/**
 * Layout family. Each one is a coherent set of page, type and section rules —
 * not a colour theme. Children's books run picture-led with no indents;
 * poetry hangs and does not justify; plays set speeches with character and
 * stage direction; screenplays use monospaced slug lines; trade fiction is
 * the conventional novel page; technical books are dense with headings.
 */
export type LayoutFamily = 'trade' | 'children' | 'poetry' | 'play' | 'screenplay' | 'technical' | 'memoir'

export type FrontKind =
  | 'titlepage'
  | 'copyright'
  | 'dedication'
  | 'epigraph'
  | 'foreword'
  | 'preface'
  | 'introduction'
  | 'prologue'
  | 'dramatisPersonae'
  | 'cast'
  | 'characterList'

export type BackKind =
  | 'epilogue'
  | 'acknowledgments'
  | 'aboutAuthor'
  | 'alsoBy'
  | 'appendix'
  | 'glossary'
  | 'bibliography'
  | 'afterword'
  | 'endnotes'
  | 'index'
  | 'colophon'
  | 'playMusic'

export const FRONT_KINDS: { kind: FrontKind; label: string; fixed?: boolean }[] = [
  { kind: 'titlepage', label: 'Title Page', fixed: true },
  { kind: 'copyright', label: 'Copyright', fixed: true },
  { kind: 'dedication', label: 'Dedication' },
  { kind: 'epigraph', label: 'Epigraph' },
  { kind: 'foreword', label: 'Foreword' },
  { kind: 'preface', label: 'Preface' },
  { kind: 'introduction', label: 'Introduction' },
  { kind: 'prologue', label: 'Prologue' },
  { kind: 'dramatisPersonae', label: 'Dramatis Personae' },
  { kind: 'cast', label: 'Cast of Characters' },
  { kind: 'characterList', label: 'Character List' },
]

export const BACK_KINDS: { kind: BackKind; label: string }[] = [
  { kind: 'epilogue', label: 'Epilogue' },
  { kind: 'acknowledgments', label: 'Acknowledgments' },
  { kind: 'aboutAuthor', label: 'About the Author' },
  { kind: 'alsoBy', label: 'Also By' },
  { kind: 'appendix', label: 'Appendix' },
  { kind: 'glossary', label: 'Glossary' },
  { kind: 'bibliography', label: 'Bibliography' },
  { kind: 'afterword', label: 'Afterword' },
  { kind: 'endnotes', label: 'Notes' },
  { kind: 'index', label: 'Index' },
  { kind: 'colophon', label: 'Colophon' },
  { kind: 'playMusic', label: 'Music & Permissions' },
]

// ── Inline / block content (ProseMirror-ish JSON) ────────────────────────────

export interface PMMark {
  type: 'bold' | 'italic' | 'underline' | 'strike' | 'superscript' | 'subscript' | 'smallCaps' | 'link' | 'fontFamily' | 'fontSize' | 'textPaint' | 'indexTerm'
  attrs?: Record<string, unknown>
}

export type PMNode =
  | { type: 'text'; text: string; marks?: PMMark[] }
  | { type: 'hardBreak' }
  | { type: 'footnoteRef'; attrs: { id: string } }
  | { type: 'image'; attrs: { imageId: string; alt?: string; caption?: string; width?: number } }
  | { type: 'paragraph'; content?: PMNode[] }
  | { type: 'heading'; attrs: { level: 2 | 3 }; content?: PMNode[] }
  | { type: 'blockquote'; attrs?: { attribution?: string }; content?: PMNode[] }
  | { type: 'bulletList' | 'orderedList'; content?: PMNode[] }
  | { type: 'listItem'; content?: PMNode[] }
  | { type: 'sceneBreak' }
  | { type: 'horizontalRule' }

export type BlockType = 'frontmatter' | 'part' | 'chapter' | 'backmatter'

export interface Block {
  id: string
  type: BlockType
  /** Display heading. For chapters this is the chapter title. */
  title: string
  /** front/back matter kind */
  kind?: FrontKind | BackKind
  /** number shown to the reader; parts/chapters derive it unless overridden */
  numberOverride?: string
  /** ordered scenes (paragraph blocks) belonging to this block */
  sceneIds: string[]
  /** collapsed in the tree UI */
  collapsed?: boolean
}

export interface BookDoc {
  version: 1
  blocks: Block[]
  /** sceneId -> PM doc content array */
  scenes: Record<string, PMNode[]>
  /** footnoteId -> text (html-free plain text) */
  footnotes: Record<string, string>
}

// ── Settings ─────────────────────────────────────────────────────────────────

export interface MarginSettings {
  top: number // inches
  bottom: number
  inside: number
  outside: number
  /** gutter auto-widen from page count */
  autoGutter: boolean
  gutterOverride?: number
}

export interface TypographySettings {
  fontFamily: string
  fontSize: number // pt
  lineHeight: number // multiple
  firstLineIndent: number // em
  justify: boolean
  paragraphSpacing: number // em
  hyphenate: boolean
}

export interface ChapterOpeningSettings {
  rectoStart: boolean
  blankPageBetween: boolean
  dropCap: boolean
  ornament: 'none' | 'asterism' | 'fleuron' | 'diamond' | 'rule'
  ornamentChar?: string
  smallCapsFirstLine: boolean
  startOnNewPage: boolean
  chapterNumbers: 'arabic' | 'words' | 'none'
}

export interface RunningHeadSettings {
  enabled: boolean
  verso: 'bookTitle' | 'author' | 'none'
  recto: 'chapter' | 'part' | 'bookTitle' | 'none'
  suppressOnChapterOpen: boolean
  suppressOnFrontMatter: boolean
  smallCaps: boolean
}

export interface FolioSettings {
  enabled: boolean
  position: 'bottomCenter' | 'bottomOutside' | 'topOutside'
  romanFrontMatter: boolean
  suppressOnChapterOpen: boolean
  suppressOnPartPages: boolean
}

export interface TocSettings {
  enabled: boolean
  depth: 'chapters' | 'sections'
  includeFrontMatter: boolean
  leaderDots: boolean
}

export interface VerseSettings {
  /** poetry: hanging indent for run-on lines */
  hangingIndent: number // em
  /** stanza gap */
  stanzaSpacing: number // em
  /** plays: character names in small caps and centred set-up */
  playStyle: 'modern' | 'classical'
  /** screenplays */
  screenplayFont: 'courier' | 'serif'
  sceneNumbers: boolean
  /** page numbers */
}

export interface PictureSettings {
  /** full-bleed artwork on every spread */
  fullBleed: boolean
  /** large type, short lines */
  largeType: boolean
  /** illustration captions under the picture */
  captions: boolean
  /** art position on the spread */
  artPlacement: 'top' | 'bottom' | 'full'
  artHeight: number // fraction of page height for top/bottom art
}

export interface CoverSettings {
  background: string
  textColor: string
  accentColor: string
  fontFamily: string
  titleSize: number
  authorSize: number
  layout: 'classic' | 'band' | 'minimal' | 'frame'
  backText: string
  spineText: boolean
  paperPpi: number // inches per page
  showGuides: boolean
  coverImageId?: string
  backImageId?: string
  publisherLogoText?: string
}

export interface EpubSettings {
  includeCover: boolean
  titlePage: boolean
  endnotes: boolean
  /** pack the used Google Fonts into the EPUB as woff2 (needs network at export) */
  embedFonts?: boolean
}

/** Page graphics: vignettes, side bars and full-page plates. */
export type PageGraphicMode = 'off' | 'vignette' | 'sidebar' | 'plate'

export interface PageGraphicsSettings {
  mode: PageGraphicMode
  /** show on chapter-opening pages too (not just continuation pages) */
  onChapterOpen: boolean
  /** front / back matter pages */
  onMatter: boolean
  /** vignette */
  vignetteImageId?: string
  vignetteSize: number // inches, max height
  vignetteAlign: 'center' | 'outside' | 'inside'
  vignettePosition: 'top' | 'bottom'
  vignetteOpacity: number // 0..1
  vignetteEvery: number // 1 = every page, 2 = every other page
  /** side bar */
  sidebarWidth: number // fraction of the text block (0.2–0.45)
  sidebarSide: 'outside' | 'inside' | 'alternate'
  sidebarImageId?: string
  sidebarFrame: boolean
  sidebarOpacity?: number
  /** plate: graphic on its own page, facing the chapter opening */
  plateImageId?: string
  plateCaption: boolean
  /** decorative border, no image needed */
  border: 'none' | 'rule' | 'double' | 'ornament'
}

export interface BookSettings {
  /** per-page pictures keyed by physical page number ("1", "2", …) */
  pageArt?: Record<string, PageArt>
  /** when set, every page renders the art of this page key ("use for all pages") */
  pageArtAllKey?: string
  /** workspace autosave interval in minutes (5-minute steps, default 5) */
  autosaveMinutes?: number
  /** writing goal in words (0/undefined = no goal) */
  writingGoal?: number
  /** chapter (left) column width, % of 230px (100 = normal; top end depends on the window) */
  treeWidth?: number
  /** layout family (see LayoutFamily) */
  layout: LayoutFamily
  trim: Trim
  margins: MarginSettings
  typography: TypographySettings
  chapterOpening: ChapterOpeningSettings
  runningHeads: RunningHeadSettings
  folios: FolioSettings
  toc: TocSettings
  bleed: boolean
  bleedSize: number // inches
  cropMarks: boolean
  footnoteMode: 'page' | 'end'
  graphics: PageGraphicsSettings
  /** poem / play / screenplay specific conventions */
  verse: VerseSettings
  /** children's picture-book spreads */
  picture: PictureSettings
  cover: CoverSettings
  epub: EpubSettings
}

export interface BookMeta {
  title: string
  subtitle: string
  author: string
  language: string
  genre: string
  notes: string
  isbn: string
  publisher: string
  copyrightYear: string
  description: string
}

export interface Project {
  id: string
  createdAt: number
  updatedAt: number
  meta: BookMeta
  settings: BookSettings
  doc: BookDoc
  /** cached last pagination summary (page count etc.) */
  lastPaginated?: { pageCount: number; spineWidth: number; at: number; /** page anchors, one per physical page */ keys?: string[] }
  coverHex?: string // card accent colour
}

export interface Snapshot {
  id: string
  projectId: string
  label: string
  createdAt: number
  wordCount: number
  doc: BookDoc
  /** layout + art + typography at the time (older snapshots lack it) */
  settings?: BookSettings
}

export interface Asset {
  id: string
  projectId: string
  name: string
  mime: string
  dataUrl: string
  width: number
  height: number
  bytes: number
  createdAt: number
  /** GIF frame count (animations stay animated on screen) */
  frames?: number
}

export interface Note {
  id: string
  projectId: string
  title: string
  body: string // html
  createdAt: number
  updatedAt: number
  pinned?: boolean
  /** page anchor this note belongs to (same keys as page art); none = whole book */
  pageKey?: string
}

// ── Defaults ─────────────────────────────────────────────────────────────────

export const uid = (prefix = 'id') =>
  prefix + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

export const TRIM_PRESETS: { id: TrimPreset; label: string; w: number; h: number }[] = [
  { id: '5x8', label: '5 × 8 in', w: 5, h: 8 },
  { id: '5.25x8', label: '5.25 × 8 in', w: 5.25, h: 8 },
  { id: '5.5x8.5', label: '5.5 × 8.5 in', w: 5.5, h: 8.5 },
  { id: '6x9', label: '6 × 9 in', w: 6, h: 9 },
  { id: '7x10', label: '7 × 10 in', w: 7, h: 10 },
  { id: '8.5x11', label: '8.5 × 11 in', w: 8.5, h: 11 },
  { id: 'custom', label: 'Custom', w: 6, h: 9 },
]

export const defaultSettings = (): BookSettings => ({
  layout: 'trade',
  trim: { preset: '6x9', width: 6, height: 9 },
  margins: { top: 0.75, bottom: 0.75, inside: 0.75, outside: 0.6, autoGutter: true },
  typography: {
    fontFamily: 'Literata',
    fontSize: 11.5,
    lineHeight: 1.5,
    firstLineIndent: 1.5,
    justify: true,
    paragraphSpacing: 0,
    hyphenate: true,
  },
  chapterOpening: {
    rectoStart: true,
    blankPageBetween: true,
    dropCap: false,
    ornament: 'asterism',
    smallCapsFirstLine: true,
    startOnNewPage: true,
    chapterNumbers: 'arabic',
  },
  runningHeads: {
    enabled: true,
    verso: 'bookTitle',
    recto: 'chapter',
    suppressOnChapterOpen: true,
    suppressOnFrontMatter: true,
    smallCaps: true,
  },
  folios: {
    enabled: true,
    position: 'bottomCenter',
    romanFrontMatter: true,
    suppressOnChapterOpen: true,
    suppressOnPartPages: true,
  },
  toc: { enabled: true, depth: 'chapters', includeFrontMatter: false, leaderDots: true },
  bleed: false,
  bleedSize: 0.125,
  cropMarks: false,
  footnoteMode: 'page',
  graphics: {
    mode: 'off',
    onChapterOpen: false,
    onMatter: false,
    vignetteSize: 0.9,
    vignetteAlign: 'center',
    vignettePosition: 'bottom',
    vignetteOpacity: 0.85,
    vignetteEvery: 1,
    sidebarWidth: 0.3,
    sidebarSide: 'alternate',
    sidebarFrame: true,
    sidebarOpacity: 1,
    plateCaption: true,
    border: 'none',
  },
  cover: {
    background: '#1d2b3a',
    textColor: '#f3ece1',
    accentColor: '#c9a227',
    fontFamily: 'Playfair Display',
    titleSize: 64,
    authorSize: 26,
    layout: 'classic',
    backText:
      'A story about the spaces between what we say and what we mean. Set in a city that never quite sleeps, it follows a bookseller who discovers that every volume on her shelves remembers a different version of the same night.',
    spineText: true,
    paperPpi: 0.002252,
    showGuides: false,
    publisherLogoText: 'WRITERS COMPANION PRESS',
  },
  verse: { hangingIndent: 1.5, stanzaSpacing: 1, playStyle: 'modern', screenplayFont: 'courier', sceneNumbers: false },
  picture: { fullBleed: false, largeType: true, captions: false, artPlacement: 'top', artHeight: 0.55 },
  epub: { includeCover: true, titlePage: true, endnotes: true },
})

export const defaultMeta = (): BookMeta => ({
  title: 'Untitled Book',
  subtitle: '',
  author: 'Anonymous',
  language: 'en',
  genre: 'Literary Fiction',
  notes: '',
  isbn: '',
  publisher: '',
  copyrightYear: String(new Date().getFullYear()),
  description: '',
})

// ── Factories ────────────────────────────────────────────────────────────────

export const para = (text = ''): PMNode =>
  text
    ? { type: 'paragraph', content: [{ type: 'text', text }] }
    : { type: 'paragraph' }

export function newChapter(title: string, sceneText = ''): { block: Block; scenes: Record<string, PMNode[]> } {
  const sceneId = uid('scene')
  return {
    block: { id: uid('ch'), type: 'chapter', title, sceneIds: [sceneId] },
    scenes: { [sceneId]: sceneText ? [para(sceneText)] : [para()] },
  }
}

export function newBlock(type: BlockType, title: string, kind?: FrontKind | BackKind): { block: Block; scenes: Record<string, PMNode[]> } {
  const sceneId = uid('scene')
  return {
    block: { id: uid('blk'), type, title, kind, sceneIds: [sceneId] },
    scenes: { [sceneId]: [para()] },
  }
}

export interface LayoutSpec {
  id: LayoutFamily
  name: string
  blurb: string
  /** which front/back matter a new book of this family starts with */
  front: FrontKind[]
  back: BackKind[]
  /** first chapter title */
  firstChapter: string
  apply: Partial<BookSettings>
  meta?: Partial<BookMeta>
  cover: Partial<CoverSettings>
}

export function emptyDoc(meta: BookMeta, front: FrontKind[] = ['titlepage', 'copyright'], firstChapter = 'Chapter One'): BookDoc {
  const scenes: Record<string, PMNode[]> = {}
  const blocks: Block[] = []

  for (const k of front) {
    const { block, scenes: s } = newBlock('frontmatter', FRONT_KINDS.find((f) => f.kind === k)!.label, k)
    blocks.push(block)
    Object.assign(scenes, s)
  }
  const c1 = newChapter(firstChapter, '')
  blocks.push(c1.block)
  Object.assign(scenes, c1.scenes)

  void meta
  return { version: 1, blocks, scenes, footnotes: {} }
}

export const newProject = (meta?: Partial<BookMeta>): Project => {
  const m = { ...defaultMeta(), ...meta }
  return {
    id: uid('proj'),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    meta: m,
    settings: defaultSettings(),
    doc: emptyDoc(m),
    coverHex: '#1d2b3a',
  }
}
