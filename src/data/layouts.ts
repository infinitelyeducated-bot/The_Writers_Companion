import { defaultSettings } from '../model/types'
import { MORE_LAYOUTS } from './layouts2'
import type { BackKind, BookMeta, BookSettings, CoverSettings, FrontKind, LayoutFamily } from '../model/types'

// ─────────────────────────────────────────────────────────────────────────────
// Layout families. Each is a full set of house rules: page size, margins,
// leading, section conventions, cover palette. Picking one gives you a book
// that already looks like the kind of book it is.
// ─────────────────────────────────────────────────────────────────────────────

export interface LayoutSpec {
  id: LayoutFamily
  name: string
  blurb: string
  front: FrontKind[]
  back: BackKind[]
  firstChapter: string
  settings: Partial<BookSettings>
  meta?: Partial<BookMeta>
  cover: Partial<CoverSettings>
  /** short label used on cards */
  tag: string
}

const BASE_LAYOUTS: LayoutSpec[] = [
  {
    id: 'trade',
    name: 'Trade fiction',
    tag: 'Novel',
    blurb: 'The conventional novel page: 6×9, generous leading, indented paragraphs, running heads, chapter openings on the recto.',
    front: ['titlepage', 'copyright', 'dedication', 'epigraph'],
    back: ['acknowledgments', 'aboutAuthor'],
    firstChapter: 'Chapter One',
    settings: {
      trim: { preset: '6x9', width: 6, height: 9 },
      margins: { top: 0.75, bottom: 0.75, inside: 0.75, outside: 0.6, autoGutter: true },
      typography: { fontFamily: 'Literata', fontSize: 11.5, lineHeight: 1.5, firstLineIndent: 1.5, justify: true, paragraphSpacing: 0, hyphenate: true },
      chapterOpening: { rectoStart: true, blankPageBetween: true, dropCap: false, ornament: 'asterism', smallCapsFirstLine: true, startOnNewPage: true, chapterNumbers: 'arabic' },
      runningHeads: { enabled: true, verso: 'bookTitle', recto: 'chapter', suppressOnChapterOpen: true, suppressOnFrontMatter: true, smallCaps: true },
      folios: { enabled: true, position: 'bottomCenter', romanFrontMatter: true, suppressOnChapterOpen: true, suppressOnPartPages: true },
      toc: { enabled: true, depth: 'chapters', includeFrontMatter: false, leaderDots: true },
      graphics: { mode: 'off', onChapterOpen: false, onMatter: false, vignetteSize: 0.9, vignetteAlign: 'center', vignettePosition: 'bottom', vignetteOpacity: 0.85, vignetteEvery: 1, sidebarWidth: 0.3, sidebarSide: 'alternate', sidebarFrame: true, sidebarOpacity: 1, plateCaption: true, border: 'none' },
      verse: { hangingIndent: 1.5, stanzaSpacing: 1, playStyle: 'modern', screenplayFont: 'courier', sceneNumbers: false },
      picture: { fullBleed: false, largeType: false, captions: false, artPlacement: 'top', artHeight: 0.55 },
    },
    cover: { background: '#1b2a33', textColor: '#f3ece1', accentColor: '#d8b25e', fontFamily: 'Literata', titleSize: 64, authorSize: 26, layout: 'classic' },
  },
  {
    id: 'children',
    name: "Children's picture book",
    tag: 'Picture book',
    blurb: '8.5×8.5 square, huge type, no indents, one wide illustration per spread, no running heads — the art carries the page.',
    front: ['titlepage', 'copyright'],
    back: ['aboutAuthor'],
    firstChapter: 'Page One',
    settings: {
      trim: { preset: 'custom', width: 8.5, height: 8.5 },
      margins: { top: 0.5, bottom: 0.5, inside: 0.55, outside: 0.55, autoGutter: true },
      typography: { fontFamily: 'Source Serif 4', fontSize: 17, lineHeight: 1.6, firstLineIndent: 0, justify: false, paragraphSpacing: 0.55, hyphenate: false },
      chapterOpening: { rectoStart: true, blankPageBetween: false, dropCap: false, ornament: 'none', smallCapsFirstLine: false, startOnNewPage: true, chapterNumbers: 'none' },
      runningHeads: { enabled: false, verso: 'none', recto: 'none', suppressOnChapterOpen: true, suppressOnFrontMatter: true, smallCaps: false },
      folios: { enabled: true, position: 'bottomOutside', romanFrontMatter: false, suppressOnChapterOpen: false, suppressOnPartPages: true },
      toc: { enabled: false, depth: 'chapters', includeFrontMatter: false, leaderDots: false },
      graphics: { mode: 'sidebar', onChapterOpen: true, onMatter: false, vignetteSize: 1, vignetteAlign: 'center', vignettePosition: 'bottom', vignetteOpacity: 1, vignetteEvery: 1, sidebarWidth: 0.45, sidebarSide: 'alternate', sidebarFrame: false, sidebarOpacity: 1, plateCaption: false, border: 'none' },
      verse: { hangingIndent: 0, stanzaSpacing: 0.8, playStyle: 'modern', screenplayFont: 'serif', sceneNumbers: false },
      picture: { fullBleed: false, largeType: true, captions: false, artPlacement: 'top', artHeight: 0.5 },
    },
    cover: { background: '#f4a259', textColor: '#3b2418', accentColor: '#2f6b5e', fontFamily: 'Source Serif 4', titleSize: 78, authorSize: 30, layout: 'band' },
  },
  {
    id: 'poetry',
    name: 'Poetry collection',
    tag: 'Poetry',
    blurb: '5.5×8.5, ragged right, no paragraph indents, wide stanza spacing, each poem begins a fresh page, front matter numbered in roman.',
    front: ['titlepage', 'copyright', 'dedication', 'epigraph'],
    back: ['acknowledgments', 'aboutAuthor', 'index'],
    firstChapter: 'First Poem',
    settings: {
      trim: { preset: '5.5x8.5', width: 5.5, height: 8.5 },
      margins: { top: 0.8, bottom: 0.9, inside: 0.7, outside: 0.6, autoGutter: true },
      typography: { fontFamily: 'EB Garamond', fontSize: 12, lineHeight: 1.55, firstLineIndent: 0, justify: false, paragraphSpacing: 0, hyphenate: false },
      chapterOpening: { rectoStart: false, blankPageBetween: false, dropCap: false, ornament: 'none', smallCapsFirstLine: false, startOnNewPage: true, chapterNumbers: 'none' },
      runningHeads: { enabled: true, verso: 'bookTitle', recto: 'chapter', suppressOnChapterOpen: true, suppressOnFrontMatter: true, smallCaps: true },
      folios: { enabled: true, position: 'bottomCenter', romanFrontMatter: true, suppressOnChapterOpen: true, suppressOnPartPages: true },
      toc: { enabled: true, depth: 'chapters', includeFrontMatter: false, leaderDots: false },
      graphics: { mode: 'off', onChapterOpen: false, onMatter: false, vignetteSize: 0.6, vignetteAlign: 'center', vignettePosition: 'bottom', vignetteOpacity: 0.6, vignetteEvery: 1, sidebarWidth: 0.25, sidebarSide: 'alternate', sidebarFrame: false, sidebarOpacity: 1, plateCaption: false, border: 'none' },
      verse: { hangingIndent: 2, stanzaSpacing: 1.2, playStyle: 'modern', screenplayFont: 'serif', sceneNumbers: false },
      picture: { fullBleed: false, largeType: false, captions: false, artPlacement: 'top', artHeight: 0.5 },
    },
    cover: { background: '#ede6da', textColor: '#2b2b2b', accentColor: '#8a5a2b', fontFamily: 'Cormorant Garamond', titleSize: 70, authorSize: 24, layout: 'minimal' },
  },
  {
    id: 'play',
    name: 'Stage play',
    tag: 'Play',
    blurb: '5.5×8.5 acting edition: cast list up front, speeches with character names in capitals, stage directions italic and indented, no running heads over dialogue.',
    front: ['titlepage', 'copyright', 'dramatisPersonae'],
    back: ['aboutAuthor', 'playMusic'],
    firstChapter: 'ACT ONE',
    settings: {
      trim: { preset: '5.5x8.5', width: 5.5, height: 8.5 },
      margins: { top: 0.8, bottom: 0.8, inside: 0.8, outside: 0.6, autoGutter: true },
      typography: { fontFamily: 'Crimson Pro', fontSize: 11.5, lineHeight: 1.45, firstLineIndent: 0, justify: false, paragraphSpacing: 0.35, hyphenate: false },
      chapterOpening: { rectoStart: true, blankPageBetween: false, dropCap: false, ornament: 'none', smallCapsFirstLine: false, startOnNewPage: true, chapterNumbers: 'none' },
      runningHeads: { enabled: true, verso: 'bookTitle', recto: 'chapter', suppressOnChapterOpen: true, suppressOnFrontMatter: true, smallCaps: true },
      folios: { enabled: true, position: 'bottomCenter', romanFrontMatter: true, suppressOnChapterOpen: true, suppressOnPartPages: true },
      toc: { enabled: false, depth: 'chapters', includeFrontMatter: false, leaderDots: false },
      graphics: { mode: 'off', onChapterOpen: false, onMatter: false, vignetteSize: 0.6, vignetteAlign: 'center', vignettePosition: 'bottom', vignetteOpacity: 0.7, vignetteEvery: 1, sidebarWidth: 0.25, sidebarSide: 'alternate', sidebarFrame: false, sidebarOpacity: 1, plateCaption: false, border: 'none' },
      verse: { hangingIndent: 0, stanzaSpacing: 0.8, playStyle: 'modern', screenplayFont: 'serif', sceneNumbers: false },
      picture: { fullBleed: false, largeType: false, captions: false, artPlacement: 'top', artHeight: 0.5 },
    },
    cover: { background: '#2b1f1a', textColor: '#efe4d0', accentColor: '#c0563a', fontFamily: 'EB Garamond', titleSize: 62, authorSize: 24, layout: 'frame' },
  },
  {
    id: 'screenplay',
    name: 'Screenplay',
    tag: 'Screenplay',
    blurb: 'The industry standard: 8.5×11, Courier at 12pt, scene headings in caps, character names in from the dialogue.',
    front: ['titlepage', 'copyright'],
    back: [],
    firstChapter: 'FADE IN:',
    settings: {
      trim: { preset: '8.5x11', width: 8.5, height: 11 },
      margins: { top: 1, bottom: 1, inside: 1.5, outside: 1, autoGutter: false, gutterOverride: 0.25 },
      typography: { fontFamily: 'Courier Prime', fontSize: 12, lineHeight: 1.05, firstLineIndent: 0, justify: false, paragraphSpacing: 0.35, hyphenate: false },
      chapterOpening: { rectoStart: false, blankPageBetween: false, dropCap: false, ornament: 'none', smallCapsFirstLine: false, startOnNewPage: true, chapterNumbers: 'none' },
      runningHeads: { enabled: false, verso: 'none', recto: 'none', suppressOnChapterOpen: true, suppressOnFrontMatter: true, smallCaps: false },
      folios: { enabled: true, position: 'topOutside', romanFrontMatter: false, suppressOnChapterOpen: false, suppressOnPartPages: false },
      toc: { enabled: false, depth: 'chapters', includeFrontMatter: false, leaderDots: false },
      graphics: { mode: 'off', onChapterOpen: false, onMatter: false, vignetteSize: 0.6, vignetteAlign: 'center', vignettePosition: 'bottom', vignetteOpacity: 0.7, vignetteEvery: 1, sidebarWidth: 0.25, sidebarSide: 'alternate', sidebarFrame: false, sidebarOpacity: 1, plateCaption: false, border: 'none' },
      verse: { hangingIndent: 0, stanzaSpacing: 0.6, playStyle: 'modern', screenplayFont: 'courier', sceneNumbers: false },
      picture: { fullBleed: false, largeType: false, captions: false, artPlacement: 'top', artHeight: 0.5 },
    },
    cover: { background: '#111111', textColor: '#f5f5f5', accentColor: '#e0b34c', fontFamily: 'Lora', titleSize: 58, authorSize: 22, layout: 'minimal' },
  },
  {
    id: 'technical',
    name: 'Technical manual',
    tag: 'Technical',
    blurb: '7×10 reference layout: labels, numbered steps, dense leading, nested headings, endnotes and an index — built for looking things up.',
    front: ['titlepage', 'copyright', 'preface', 'introduction'],
    back: ['appendix', 'glossary', 'bibliography', 'index'],
    firstChapter: 'Chapter 1',
    settings: {
      trim: { preset: '7x10', width: 7, height: 10 },
      margins: { top: 0.8, bottom: 0.75, inside: 0.9, outside: 0.7, autoGutter: true },
      typography: { fontFamily: 'Source Serif 4', fontSize: 10.5, lineHeight: 1.42, firstLineIndent: 0, justify: true, paragraphSpacing: 0.5, hyphenate: true },
      chapterOpening: { rectoStart: true, blankPageBetween: true, dropCap: false, ornament: 'none', smallCapsFirstLine: false, startOnNewPage: true, chapterNumbers: 'arabic' },
      runningHeads: { enabled: true, verso: 'bookTitle', recto: 'chapter', suppressOnChapterOpen: true, suppressOnFrontMatter: false, smallCaps: false },
      folios: { enabled: true, position: 'bottomOutside', romanFrontMatter: true, suppressOnChapterOpen: false, suppressOnPartPages: true },
      toc: { enabled: true, depth: 'sections', includeFrontMatter: true, leaderDots: true },
      graphics: { mode: 'off', onChapterOpen: false, onMatter: false, vignetteSize: 0.8, vignetteAlign: 'center', vignettePosition: 'bottom', vignetteOpacity: 0.8, vignetteEvery: 1, sidebarWidth: 0.28, sidebarSide: 'outside', sidebarFrame: true, sidebarOpacity: 1, plateCaption: true, border: 'none' },
      verse: { hangingIndent: 0, stanzaSpacing: 0.6, playStyle: 'modern', screenplayFont: 'serif', sceneNumbers: false },
      picture: { fullBleed: false, largeType: false, captions: true, artPlacement: 'top', artHeight: 0.45 },
    },
    cover: { background: '#152238', textColor: '#e9eef6', accentColor: '#5fa8d3', fontFamily: 'Lora', titleSize: 58, authorSize: 24, layout: 'classic' },
  },
  {
    id: 'memoir',
    name: 'Literary memoir',
    tag: 'Memoir',
    blurb: '5.25×8, warm serif, drop caps, section rules, ornaments between chapters — closer to an essay collection than a novel.',
    front: ['titlepage', 'copyright', 'epigraph', 'dedication', 'foreword'],
    back: ['acknowledgments', 'aboutAuthor'],
    firstChapter: 'One',
    settings: {
      trim: { preset: '5.25x8', width: 5.25, height: 8 },
      margins: { top: 0.7, bottom: 0.85, inside: 0.72, outside: 0.55, autoGutter: true },
      typography: { fontFamily: 'Lora', fontSize: 11, lineHeight: 1.6, firstLineIndent: 1.25, justify: true, paragraphSpacing: 0, hyphenate: true },
      chapterOpening: { rectoStart: true, blankPageBetween: true, dropCap: true, ornament: 'rule', smallCapsFirstLine: true, startOnNewPage: true, chapterNumbers: 'words' },
      runningHeads: { enabled: true, verso: 'author', recto: 'chapter', suppressOnChapterOpen: true, suppressOnFrontMatter: true, smallCaps: true },
      folios: { enabled: true, position: 'bottomOutside', romanFrontMatter: true, suppressOnChapterOpen: true, suppressOnPartPages: true },
      toc: { enabled: true, depth: 'chapters', includeFrontMatter: false, leaderDots: true },
      graphics: { mode: 'vignette', onChapterOpen: false, onMatter: false, vignetteSize: 0.7, vignetteAlign: 'center', vignettePosition: 'bottom', vignetteOpacity: 0.55, vignetteEvery: 4, sidebarWidth: 0.26, sidebarSide: 'alternate', sidebarFrame: false, sidebarOpacity: 1, plateCaption: false, border: 'none' },
      verse: { hangingIndent: 1, stanzaSpacing: 1, playStyle: 'modern', screenplayFont: 'serif', sceneNumbers: false },
      picture: { fullBleed: false, largeType: false, captions: false, artPlacement: 'top', artHeight: 0.5 },
    },
    cover: { background: '#3d3b33', textColor: '#efe9dc', accentColor: '#c2a878', fontFamily: 'Lora', titleSize: 60, authorSize: 24, layout: 'frame' },
  },
]

/** The seven original craft families plus the audience and genre families. */
export const LAYOUTS: LayoutSpec[] = [...BASE_LAYOUTS, ...MORE_LAYOUTS]

export const layoutById = (id: LayoutFamily): LayoutSpec => LAYOUTS.find((l) => l.id === id) || LAYOUTS[0]

/** Merge a layout family into a fresh settings object. */
export function settingsFor(id: LayoutFamily): BookSettings {
  const base = defaultSettings()
  const spec = layoutById(id)
  return {
    ...base,
    ...spec.settings,
    layout: id,
    margins: { ...base.margins, ...spec.settings.margins },
    typography: { ...base.typography, ...spec.settings.typography },
    chapterOpening: { ...base.chapterOpening, ...spec.settings.chapterOpening },
    runningHeads: { ...base.runningHeads, ...spec.settings.runningHeads },
    folios: { ...base.folios, ...spec.settings.folios },
    toc: { ...base.toc, ...spec.settings.toc },
    graphics: { ...base.graphics, ...spec.settings.graphics },
    verse: { ...base.verse, ...spec.settings.verse },
    picture: { ...base.picture, ...spec.settings.picture },
    cover: { ...base.cover, ...spec.cover },
  }
}
