import type { BackKind, BookSettings, CoverSettings, FrontKind, LayoutFamily, TrimPreset } from '../model/types'
import type { LayoutSpec } from './layouts'

// ─────────────────────────────────────────────────────────────────────────────
// Audience and genre layout families. Every one is a complete set of house
// rules (trim, face, leading, chapter openings, matter, cover) tuned to what
// that kind of book usually looks like on the shelf. All values are things the
// print engine already understands.
// ─────────────────────────────────────────────────────────────────────────────

const TRIMS: Record<string, { preset: TrimPreset; width: number; height: number }> = {
  '5x8': { preset: '5x8', width: 5, height: 8 },
  '5.25x8': { preset: '5.25x8', width: 5.25, height: 8 },
  '5.5x8.5': { preset: '5.5x8.5', width: 5.5, height: 8.5 },
  '6x9': { preset: '6x9', width: 6, height: 9 },
}

interface Look {
  trim: keyof typeof TRIMS
  font: string
  size: number
  leading: number
  indent?: number
  justify?: boolean
  spacing?: number
  dropCap?: boolean
  ornament?: 'none' | 'asterism' | 'fleuron' | 'diamond' | 'rule'
  numbers?: 'arabic' | 'words' | 'none'
  smallCaps?: boolean
  heads?: 'bookTitle/chapter' | 'author/bookTitle' | 'none'
  folio?: 'bottomCenter' | 'bottomOutside' | 'topOutside'
  toc?: boolean
  captions?: boolean
  margins?: [number, number, number, number]
}

function family(
  id: LayoutFamily,
  name: string,
  tag: string,
  blurb: string,
  first: string,
  front: FrontKind[],
  back: BackKind[],
  look: Look,
  cover: Partial<CoverSettings>,
): LayoutSpec {
  const m = look.margins || [0.75, 0.75, 0.75, 0.6]
  const heads = look.heads || 'bookTitle/chapter'
  const settings: Partial<BookSettings> = {
    trim: TRIMS[look.trim],
    margins: { top: m[0], bottom: m[1], inside: m[2], outside: m[3], autoGutter: true },
    typography: {
      fontFamily: look.font,
      fontSize: look.size,
      lineHeight: look.leading,
      firstLineIndent: look.indent ?? 1.4,
      justify: look.justify ?? true,
      paragraphSpacing: look.spacing ?? 0,
      hyphenate: look.justify ?? true,
    },
    chapterOpening: {
      rectoStart: true,
      blankPageBetween: false,
      dropCap: look.dropCap ?? false,
      ornament: look.ornament ?? 'asterism',
      smallCapsFirstLine: look.smallCaps ?? true,
      startOnNewPage: true,
      chapterNumbers: look.numbers ?? 'arabic',
    },
    runningHeads:
      heads === 'none'
        ? { enabled: false, verso: 'none', recto: 'none', suppressOnChapterOpen: true, suppressOnFrontMatter: true, smallCaps: false }
        : heads === 'author/bookTitle'
          ? { enabled: true, verso: 'author', recto: 'bookTitle', suppressOnChapterOpen: true, suppressOnFrontMatter: true, smallCaps: true }
          : { enabled: true, verso: 'bookTitle', recto: 'chapter', suppressOnChapterOpen: true, suppressOnFrontMatter: true, smallCaps: true },
    folios: { enabled: true, position: look.folio || 'bottomCenter', romanFrontMatter: true, suppressOnChapterOpen: true, suppressOnPartPages: true },
    toc: { enabled: look.toc ?? false, depth: 'chapters', includeFrontMatter: false, leaderDots: true },
    picture: { fullBleed: false, largeType: false, captions: look.captions ?? false, artPlacement: 'top', artHeight: 0.5 },
  }
  return {
    id,
    name,
    tag,
    blurb,
    front,
    back,
    firstChapter: first,
    settings,
    cover: { fontFamily: look.font, titleSize: 60, authorSize: 24, layout: 'classic', ...cover },
  }
}

const F = (...k: FrontKind[]) => k
const B = (...k: BackKind[]) => k

export const MORE_LAYOUTS: LayoutSpec[] = [
  // ── for writers ────────────────────────────────────────────────────────────
  family('firstnovel', 'First-time novelists', 'Debut novel',
    'The safe, professional first book: 5.5×8.5, comfortable leading, indented paragraphs, ornamented scene breaks, running heads and a dedication. It looks like a book a publisher would stand behind.',
    'Chapter One', F('titlepage', 'copyright', 'dedication', 'epigraph'), B('acknowledgments', 'aboutAuthor'),
    { trim: '5.5x8.5', font: 'Literata', size: 11.5, leading: 1.5, indent: 1.5, toc: true, numbers: 'words' },
    { background: '#22303c', textColor: '#f4eee3', accentColor: '#e0b45a', layout: 'band' }),
  family('series', 'Series authors', 'Series book',
    'Built for book two and beyond: 5.25×8 for a matching shelf, drop caps, chapter numbers in words, author-and-title running heads, a character list up front and an Also By page in the back.',
    'Chapter One', F('titlepage', 'copyright', 'dedication', 'characterList'), B('epilogue', 'alsoBy', 'aboutAuthor', 'acknowledgments'),
    { trim: '5.25x8', font: 'Crimson Pro', size: 11.5, leading: 1.45, dropCap: true, numbers: 'words', heads: 'author/bookTitle', ornament: 'diamond' },
    { background: '#2b1d3a', textColor: '#f3e9ff', accentColor: '#c7a4ff', layout: 'band' }),
  family('professional', 'Busy professionals', 'Business book',
    'A clean, fast-reading book for people with a point to make: 6×9, left-aligned text with space between paragraphs, plain numbered chapters, a contents page with sections and an appendix.',
    'Chapter 1', F('titlepage', 'copyright', 'preface', 'introduction'), B('appendix', 'bibliography', 'aboutAuthor'),
    { trim: '6x9', font: 'Source Serif 4', size: 11, leading: 1.45, indent: 0, justify: false, spacing: 0.6, ornament: 'none', smallCaps: false, toc: true, numbers: 'arabic' },
    { background: '#14323f', textColor: '#ffffff', accentColor: '#4fc3d4', layout: 'minimal', fontFamily: 'Work Sans' }),
  family('family', 'Grandparents & family stories', 'Family story',
    'A keepsake for the people who come next: large, easy type, warm leading, picture captions on, a foreword for the family and an afterword for the stories you could not fit.',
    'First Story', F('titlepage', 'copyright', 'dedication', 'foreword'), B('afterword', 'acknowledgments'),
    { trim: '6x9', font: 'Lora', size: 13, leading: 1.6, indent: 1.2, numbers: 'none', ornament: 'fleuron', toc: true, captions: true, margins: [0.85, 0.85, 0.85, 0.7] },
    { background: '#5a3b2e', textColor: '#fff4e4', accentColor: '#f0c27a', layout: 'frame' }),
  family('retirees', 'Retirees', 'Life writing',
    'A reflective book in comfortable large print: 5.5×8.5, 12.5-point serif, generous margins, short numbered essays, an epilogue and room for photographs.',
    'Essay One', F('titlepage', 'copyright', 'dedication', 'preface'), B('epilogue', 'acknowledgments', 'aboutAuthor'),
    { trim: '5.5x8.5', font: 'Merriweather', size: 12.5, leading: 1.6, indent: 1.2, numbers: 'arabic', ornament: 'asterism', toc: true, captions: true, margins: [0.85, 0.85, 0.85, 0.7] },
    { background: '#243b32', textColor: '#f1f4ec', accentColor: '#e3c36a', layout: 'classic' }),
  family('hobby', 'Hobby writers', 'Notebook book',
    'A small, friendly 5×8 book for writing you love doing: unnumbered chapters, fleuron breaks, a contents page, no pressure about word counts.',
    'First Entry', F('titlepage', 'copyright', 'dedication'), B('afterword', 'aboutAuthor'),
    { trim: '5x8', font: 'Alegreya', size: 11.5, leading: 1.5, indent: 1.3, numbers: 'none', ornament: 'fleuron', toc: true, margins: [0.7, 0.7, 0.7, 0.55] },
    { background: '#3e5a3a', textColor: '#f6f3e3', accentColor: '#f0d27a', layout: 'frame' }),
  family('selfpub', 'Self-publishers', 'Ready to upload',
    'Everything an upload wants: 5.5×8.5, full front matter with copyright and colophon, an Also By page, an About the Author page and a closing review request, so the file is ready for KDP or IngramSpark.',
    'Chapter 1', F('titlepage', 'copyright', 'dedication', 'epigraph'), B('acknowledgments', 'alsoBy', 'aboutAuthor', 'colophon'),
    { trim: '5.5x8.5', font: 'Source Serif 4', size: 11.5, leading: 1.5, indent: 1.5, toc: true, numbers: 'arabic' },
    { background: '#7a2b2b', textColor: '#fff6ee', accentColor: '#ffd27a', layout: 'band' }),

  // ── genres ─────────────────────────────────────────────────────────────────
  family('romance', 'Romance', 'Romance',
    'Soft and inviting: 5.5×8.5, airy leading, a drop cap, fleuron scene breaks and chapter numbers in words, on a warm cover.',
    'Chapter One', F('titlepage', 'copyright', 'dedication', 'epigraph'), B('epilogue', 'acknowledgments', 'alsoBy', 'aboutAuthor'),
    { trim: '5.5x8.5', font: 'Cormorant Garamond', size: 13, leading: 1.5, indent: 1.4, dropCap: true, numbers: 'words', ornament: 'fleuron' },
    { background: '#6b2a43', textColor: '#fff0f3', accentColor: '#ffb3c6', layout: 'frame' }),
  family('fantasy', 'Fantasy', 'Fantasy',
    'An epic in 6×9: classical serif, drop caps, diamond breaks, a prologue and character list up front, a glossary at the back and a cover with a crest.',
    'Chapter One', F('titlepage', 'copyright', 'dedication', 'epigraph', 'characterList', 'prologue'), B('epilogue', 'glossary', 'acknowledgments', 'aboutAuthor'),
    { trim: '6x9', font: 'EB Garamond', size: 12.5, leading: 1.45, dropCap: true, numbers: 'words', ornament: 'diamond', toc: true },
    { background: '#1c2b2a', textColor: '#f0e8d0', accentColor: '#d4a84a', layout: 'frame', fontFamily: 'Cinzel Decorative' }),
  family('scifi', 'Sci-Fi', 'Science fiction',
    'Crisp and modern: 6×9, a clean transitional serif, rule dividers, plain numbered chapters, an appendix for the technical notes and a glossary.',
    'Chapter 1', F('titlepage', 'copyright', 'dedication', 'epigraph'), B('appendix', 'glossary', 'acknowledgments', 'aboutAuthor'),
    { trim: '6x9', font: 'Newsreader', size: 11.5, leading: 1.45, indent: 1.3, numbers: 'arabic', ornament: 'rule', smallCaps: false },
    { background: '#0b1a2e', textColor: '#e6f1ff', accentColor: '#5ad1ff', layout: 'minimal', fontFamily: 'Space Grotesk' }),
  family('mystery', 'Mystery, thriller & suspense', 'Mystery / Thriller',
    'Built for pace: 5.5×8.5, tight 1.4 leading, short chapters with plain numbers, rule dividers and bold, high-contrast covers. The page never slows the reader down.',
    'Chapter 1', F('titlepage', 'copyright', 'dedication'), B('acknowledgments', 'alsoBy', 'aboutAuthor'),
    { trim: '5.5x8.5', font: 'Merriweather', size: 11, leading: 1.45, indent: 1.3, numbers: 'arabic', ornament: 'rule', smallCaps: false },
    { background: '#161616', textColor: '#f5f5f5', accentColor: '#e03a3a', layout: 'band', fontFamily: 'Montserrat' }),
  family('paranormal', 'Paranormal', 'Paranormal',
    'Atmospheric and a little uncanny: 5.5×8.5, a calligraphic serif, diamond breaks, chapter numbers in words and a deep violet cover.',
    'Chapter One', F('titlepage', 'copyright', 'dedication', 'epigraph', 'prologue'), B('epilogue', 'acknowledgments', 'alsoBy', 'aboutAuthor'),
    { trim: '5.5x8.5', font: 'Spectral', size: 11.5, leading: 1.5, dropCap: true, numbers: 'words', ornament: 'diamond' },
    { background: '#1d1330', textColor: '#efe4ff', accentColor: '#b57bff', layout: 'frame', fontFamily: 'Cinzel' }),
  family('adventure', 'Action & adventure', 'Adventure',
    'Muscular and quick: 6×9, a sturdy slab serif, tight leading, plain numbered chapters, no ornament and a bold banded cover.',
    'Chapter 1', F('titlepage', 'copyright', 'dedication'), B('epilogue', 'acknowledgments', 'aboutAuthor'),
    { trim: '6x9', font: 'Bitter', size: 11, leading: 1.4, indent: 1.3, numbers: 'arabic', ornament: 'none', smallCaps: false },
    { background: '#7a3a12', textColor: '#fff4e0', accentColor: '#ffc24a', layout: 'band', fontFamily: 'Bitter' }),
  family('historical', 'Historical fiction', 'Historical',
    'A period page: 6×9, an old-style serif, drop caps, fleuron breaks and the scholarly extras readers expect: an epigraph, an author\u2019s note, a glossary and a bibliography.',
    'Chapter I', F('titlepage', 'copyright', 'dedication', 'epigraph'), B('afterword', 'glossary', 'bibliography', 'acknowledgments', 'aboutAuthor'),
    { trim: '6x9', font: 'Old Standard TT', size: 11.5, leading: 1.5, indent: 1.5, dropCap: true, numbers: 'words', ornament: 'fleuron', toc: true },
    { background: '#3a2a1c', textColor: '#f3e8d2', accentColor: '#c9a063', layout: 'frame' }),
  family('horror', 'Horror', 'Horror',
    'Quiet and cold: 5.5×8.5, a sharp, restrained serif, spare asterism breaks, chapter numbers in words and a near-black cover with one red note.',
    'Chapter One', F('titlepage', 'copyright', 'dedication', 'epigraph'), B('acknowledgments', 'alsoBy', 'aboutAuthor'),
    { trim: '5.5x8.5', font: 'Spectral', size: 11.5, leading: 1.5, numbers: 'words', ornament: 'asterism' },
    { background: '#0c0c0c', textColor: '#e8e8e8', accentColor: '#b3201f', layout: 'minimal', fontFamily: 'Cinzel' }),
  family('literary', 'Drama & literary', 'Literary fiction',
    'Restrained and spacious: 5.5×8.5, a refined text face, no drop cap, no ornament, unnumbered chapter titles, wide margins and folios at the top outside corner.',
    'One', F('titlepage', 'copyright', 'dedication', 'epigraph'), B('acknowledgments', 'aboutAuthor'),
    { trim: '5.5x8.5', font: 'Newsreader', size: 12, leading: 1.5, indent: 1.4, numbers: 'none', ornament: 'none', smallCaps: true, folio: 'topOutside', margins: [0.85, 0.8, 0.85, 0.7] },
    { background: '#e8e2d6', textColor: '#1f1f1f', accentColor: '#7a1f1f', layout: 'minimal' }),
  family('ya', 'Young adult', 'Young adult',
    'Open and contemporary: 5.5×8.5, an easy 12-point serif, short chapters with plain numbers, no ornaments and a bright, graphic cover.',
    'Chapter 1', F('titlepage', 'copyright', 'dedication'), B('acknowledgments', 'alsoBy', 'aboutAuthor'),
    { trim: '5.5x8.5', font: 'Lora', size: 12, leading: 1.55, indent: 1.2, numbers: 'arabic', ornament: 'none', smallCaps: false, heads: 'none' },
    { background: '#ff6b4a', textColor: '#1a1a1a', accentColor: '#fff1a8', layout: 'band', fontFamily: 'Montserrat' }),
  family('shortstories', 'Novellas & short stories', 'Collection',
    'A collection page: 5.25×8, each story opens a new right-hand page with its title and no number, a contents page, and a quiet author-and-title running head.',
    'First Story', F('titlepage', 'copyright', 'dedication', 'epigraph'), B('acknowledgments', 'aboutAuthor'),
    { trim: '5.25x8', font: 'Crimson Pro', size: 12, leading: 1.5, indent: 1.4, numbers: 'none', ornament: 'asterism', toc: true, heads: 'author/bookTitle' },
    { background: '#2a3547', textColor: '#f2efe6', accentColor: '#d9b46a', layout: 'classic' }),
]
