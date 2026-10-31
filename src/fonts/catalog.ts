// The Writers Companion type catalog.
// Faces are loaded from Google Fonts on demand (one stylesheet per pick), so the
// 1.4 MB single-file build does not grow. Offline, the stack falls back to a
// system serif / the Noto Symbols face if it was cached by the PWA.

export type FontVariant = 'text' | 'regular'

export interface Typeface {
  /** CSS font-family name, also the Google Fonts family. */
  family: string
  /** Short note shown in the picker (script / language). */
  note?: string
  /** 'text' requests italic+bold; 'regular' is a single Regular cut (most Noto scripts). */
  variant: FontVariant
  /**
   * Characters to copy-paste when the writing system is not on a Latin keyboard.
   * Shown under the picker so the face can be previewed immediately.
   */
  sample?: string
  /** Extra search tokens (language names, “disney”, “storybook”, “hieroglyph”). */
  tags?: string
}

export interface TypeGroup {
  heading: string
  faces: Typeface[]
}

const T = (family: string, note?: string, extra?: Partial<Typeface>): Typeface => ({ family, note, variant: 'text', ...extra })
const R = (family: string, note?: string, extra?: Partial<Typeface>): Typeface => ({ family, note, variant: 'regular', ...extra })

export const TYPE_GROUPS: TypeGroup[] = [
  {
    heading: 'Book text — serif',
    faces: [
      T('Literata', 'default trade face'),
      T('EB Garamond'),
      T('Crimson Pro'),
      T('Lora'),
      T('Source Serif 4'),
      T('Libre Baskerville'),
      T('Merriweather'),
      T('Spectral'),
      T('Cardo', 'classicists’ face'),
      T('Alegreya'),
      T('Bitter'),
      T('Neuton'),
      T('Old Standard TT'),
      T('PT Serif'),
      T('Zilla Slab'),
      T('Fraunces'),
      T('Newsreader'),
      T('Roboto Serif'),
      T('DM Serif Text'),
      T('Instrument Serif'),
      T('Cormorant Garamond'),
      T('Cormorant'),
      T('Inknut Antiqua'),
      T('Eczar'),
      T('BioRhyme'),
      T('Noto Serif'),
      T('Noto Serif Display'),
      { family: 'Georgia', note: 'system', variant: 'regular' },
      { family: 'Palatino', note: 'system', variant: 'regular' },
      { family: 'Times New Roman', note: 'system', variant: 'regular' },
    ],
  },
  {
    heading: 'Book text — sans & mono',
    faces: [
      T('Source Sans 3'),
      T('IBM Plex Sans'),
      T('IBM Plex Serif'),
      T('Noto Sans'),
      T('DM Sans'),
      T('Work Sans'),
      T('Karla'),
      T('Manrope'),
      T('Montserrat'),
      T('Raleway'),
      T('Josefin Sans'),
      T('Space Grotesk'),
      T('Syne'),
      T('Atkinson Hyperlegible', 'high-legibility'),
      T('Courier Prime', 'screenplay'),
      T('IBM Plex Mono'),
      T('Source Code Pro'),
      { family: 'Courier New', note: 'system mono', variant: 'regular' },
    ],
  },
  {
    heading: 'Display & cover',
    faces: [
      T('Playfair Display', 'storybook serif', { tags: 'disney fairytale storybook jacket', sample: 'Once upon a time' }),
      R('Abril Fatface', 'fat display', { tags: 'poster storybook', sample: 'Once upon a time' }),
      R('Rozha One', 'Deva-inspired display', { tags: 'storybook jacket', sample: 'Once upon a time' }),
      R('Ultra', 'wood type', { tags: 'western poster', sample: 'ONCE UPON A TIME' }),
      T('Cinzel', 'roman caps', { tags: 'inscription marble', sample: 'ONCE UPON A TIME' }),
      T('Cinzel Decorative', 'illuminated caps', { tags: 'disney castle storybook fairytale', sample: 'Once Upon a Time' }),
      R('Italiana', 'high-contrast serif', { tags: 'fashion jacket', sample: 'Once upon a time' }),
      R('Marcellus', 'roman storybook', { tags: 'disney storybook fairytale', sample: 'Once upon a time' }),
      R('DM Serif Display', 'sharp display', { tags: 'jacket', sample: 'Once upon a time' }),
      R('Yeseva One', 'storybook heading', { tags: 'disney fairytale storybook', sample: 'Once upon a time' }),
      R('Prata', 'bridal display', { tags: 'storybook', sample: 'Once upon a time' }),
      R('Goudy Bookletter 1911', 'old-style book', { tags: 'storybook classic', sample: 'Once upon a time' }),
      R('Berkshire Swash', 'swash storybook', { tags: 'disney fairytale storybook', sample: 'Once upon a time' }),
      R('Bagel Fat One', 'round display', { tags: 'kids poster', sample: 'Once upon a time' }),
      R('Rye', 'western', { tags: 'western poster', sample: 'ONCE UPON A TIME' }),
      R('Smokum', 'circus wood', { tags: 'western circus', sample: 'ONCE UPON A TIME' }),
      R('Sancreek', 'tuscan', { tags: 'western', sample: 'ONCE UPON A TIME' }),
      R('Creepster', 'horror', { tags: 'halloween', sample: 'Once upon a time' }),
      R('Nosifer', 'drip horror', { tags: 'halloween', sample: 'Once upon a time' }),
      R('Metamorphous', 'uncial-ish', { tags: 'fantasy', sample: 'Once upon a time' }),
      R('Modern Antiqua', 'baroque', { tags: 'ornate', sample: 'Once upon a time' }),
      R('Aladin', 'genie storybook', { tags: 'disney aladdin storybook fairytale', sample: 'Once upon a time' }),
      R('Rum Raisin', 'soft kids', { tags: 'kids storybook', sample: 'Once upon a time' }),
      R('Fredoka', 'round kids', { tags: 'kids storybook', sample: 'Once upon a time' }),
      R('Henny Penny', 'fairytale display', { tags: 'disney storybook fairytale kids', sample: 'Once upon a time' }),
      R('Mystery Quest', 'haunted storybook', { tags: 'halloween storybook', sample: 'Once upon a time' }),
      R('Emilys Candy', 'sweet display', { tags: 'kids storybook', sample: 'Once upon a time' }),
      R('Cherry Cream Soda', 'soda script', { tags: 'kids', sample: 'Once upon a time' }),
      R('Ranchers', 'western kids', { tags: 'western kids', sample: 'ONCE UPON A TIME' }),
      R('Freckle Face', 'hand kids', { tags: 'kids storybook', sample: 'Once upon a time' }),
      R('Luckiest Guy', 'comic display', { tags: 'kids comic', sample: 'ONCE UPON A TIME' }),
      R('Bangers', 'comic', { tags: 'comic kids', sample: 'ONCE UPON A TIME' }),
    ],
  },
  {
    heading: 'Latin handwriting & script',
    faces: [
      T('Tangerine'),
      T('Dancing Script'),
      R('Sacramento'),
      R('Bad Script'),
      R('Great Vibes'),
      T('Amatic SC'),
      T('Caveat'),
      R('Shadows Into Light'),
      R('Permanent Marker'),
      R('Special Elite'),
      R('Jim Nightshade'),
      R('Petit Formal Script'),
      R('Pinyon Script'),
      R('Allura'),
      R('Alex Brush'),
      R('Italianno'),
      R('Parisienne'),
    ],
  },
  {
    heading: 'Blackletter, uncial, medieval',
    faces: [
      R('UnifrakturMaguntia'),
      R('UnifrakturCook'),
      R('Pirata One'),
      R('New Rocker'),
      T('IM Fell English'),
      R('IM Fell English SC'),
      R('MedievalSharp'),
      R('Uncial Antiqua'),
    ],
  },
  {
    heading: 'Ancient Near East & Egypt',
    faces: [
      R('Noto Sans Egyptian Hieroglyphs', 'Middle / Late Egyptian', { tags: 'hieroglyph egypt dead', sample: '𓀀𓁐𓂀𓃭𓆣 𓊪𓏏𓇯' }),
      R('Noto Sans Anatolian Hieroglyphs', 'Luwian', { tags: 'hieroglyph luwian hittite', sample: '𔐀𔐁𔐂𔐃𔐄' }),
      R('Noto Sans Meroitic', 'Meroitic hieroglyphs & cursive', { tags: 'nubia egypt dead', sample: '𐦠𐦡𐦢𐦣𐦤' }),
      R('Noto Sans Coptic', 'Coptic / late Egyptian', { tags: 'egypt christian dead', sample: 'Ⲁⲗⲫⲁ Ⲃⲏⲧⲁ Ⲗⲟⲅⲟⲥ' }),
      R('Noto Sans Cuneiform', 'Sumerian, Akkadian, Hittite', { tags: 'sumer akkadian mesopotamia dead', sample: '𒀭𒂗𒆤 𒊩𒌆𒀭𒈹' }),
      R('Noto Sans Old Persian', 'cuneiform', { tags: 'achemenid dead', sample: '𐎠𐎡𐎢𐎣𐎤' }),
      R('Noto Sans Ugaritic', undefined, { tags: 'ugarit dead', sample: '𐎀𐎁𐎂𐎃𐎄' }),
      R('Noto Sans Carian', undefined, { tags: 'anatolia dead', sample: '𐊠𐊡𐊢𐊣𐊤' }),
      R('Noto Sans Lycian', undefined, { tags: 'anatolia dead', sample: '𐊀𐊁𐊂𐊃𐊄' }),
      R('Noto Sans Lydian', undefined, { tags: 'anatolia dead', sample: '𐤠𐤡𐤢𐤣𐤤' }),
      R('Noto Sans Phoenician', undefined, { tags: 'phoenicia canaan dead', sample: '𐤀𐤁𐤂𐤃𐤄' }),
      R('Noto Sans Samaritan', undefined, { tags: 'hebrew dead', sample: 'ࠀࠁࠂࠃࠄ' }),
      R('Noto Sans Imperial Aramaic', undefined, { tags: 'aramaic dead', sample: '𐡀𐡁𐡂𐡃𐡄' }),
      R('Noto Sans Nabataean', undefined, { tags: 'petra aramaic dead', sample: '𐢀𐢁𐢂𐢃𐢄' }),
      R('Noto Sans Palmyrene', undefined, { tags: 'syria dead', sample: '𐡠𐡡𐡢𐡣𐡤' }),
      R('Noto Sans Hatran', undefined, { tags: 'aramaic dead', sample: '𐣠𐣡𐣢𐣣𐣤' }),
      R('Noto Sans Elymaic', undefined, { tags: 'iran dead', sample: '𐿠𐿡𐿢𐿣𐿤' }),
      R('Noto Sans Old South Arabian', 'Sabaean / Ḥimyaritic', { tags: 'yemen sabaean dead', sample: '𐩠𐩡𐩢𐩣𐩤' }),
      R('Noto Sans Old North Arabian', undefined, { tags: 'arabia dead', sample: '𐪀𐪁𐪂𐪃𐪄' }),
      R('Noto Sans Inscriptional Pahlavi', undefined, { tags: 'iran sasanian dead', sample: '𐭠𐭡𐭢𐭣𐭤' }),
      R('Noto Sans Inscriptional Parthian', undefined, { tags: 'iran dead', sample: '𐭀𐭁𐭂𐭃𐭄' }),
      R('Noto Sans Psalter Pahlavi', undefined, { tags: 'iran dead', sample: '𐮀𐮁𐮂𐮃𐮄' }),
      R('Noto Sans Avestan', 'Avestan / Zoroastrian', { tags: 'zoroaster iran dead', sample: '𐬀𐬁𐬂𐬃𐬄' }),
      R('Noto Sans Manichaean', undefined, { tags: 'manichaean dead', sample: '𐫀𐫁𐫂𐫃𐫄' }),
      R('Noto Sans Mandaic', undefined, { tags: 'mandaic aramaic', sample: 'ࡀࡁࡂࡃࡄ' }),
      R('Noto Sans Syriac', undefined, { tags: 'syriac aramaic', sample: 'ܐܒܓܕܗ' }),
      R('Noto Sans Chorasmian', undefined, { tags: 'iran dead', sample: '𐾰𐾱𐾲𐾳𐾴' }),
      R('Noto Sans Old Sogdian', undefined, { tags: 'sogdiana dead', sample: '𐼀𐼁𐼂𐼃𐼄' }),
      R('Noto Sans Sogdian', undefined, { tags: 'sogdiana dead', sample: '𐼰𐼱𐼲𐼳𐼴' }),
      R('Noto Sans Yezidi', undefined, { tags: 'yezidi kurdish', sample: '𐺀𐺁𐺂𐺃𐺄' }),
    ],
  },
  {
    heading: 'Aegean, Anatolia, early Europe',
    faces: [
      R('Noto Sans Linear A', 'Minoan', { tags: 'crete minoan dead', sample: '𐘀𐘁𐘂𐘃𐘄' }),
      R('Noto Sans Linear B', 'Mycenaean Greek', { tags: 'mycenae greece dead', sample: '𐀀𐀁𐀂𐀃𐀄' }),
      R('Noto Sans Cypriot', 'Cypriot syllabary', { tags: 'cyprus dead', sample: '𐠀𐠁𐠂𐠃𐠄' }),
      R('Noto Sans Cypro Minoan', undefined, { tags: 'cyprus minoan dead', sample: '𒾐𒾑𒾒𒾓𒾔' }),
      R('Noto Sans Old Italic', 'Etruscan, Oscan, Umbrian', { tags: 'etruscan italy dead', sample: '𐌀𐌁𐌂𐌃𐌄' }),
      R('Noto Sans Gothic', 'Wulfila’s alphabet', { tags: 'gothic germanic dead', sample: '𐌰𐌱𐌲𐌳𐌴' }),
      R('Noto Sans Runic', 'Elder / Younger Futhark', { tags: 'viking norse futhark dead', sample: 'ᚠᚢᚦᚨᚱᚲ' }),
      R('Noto Sans Ogham', 'Primitive Irish', { tags: 'ireland celtic dead', sample: 'ᚁᚂᚃᚄᚅ' }),
      R('Noto Sans Glagolitic', 'Old Church Slavonic', { tags: 'slavonic dead', sample: 'ⰀⰁⰂⰃⰄ' }),
      R('Noto Sans Elbasan', 'Albanian', { tags: 'albania dead', sample: '𐔀𐔁𐔂𐔃𐔄' }),
      R('Noto Sans Caucasian Albanian', undefined, { tags: 'caucasus dead', sample: '𐔰𐔱𐔲𐔳𐔴' }),
      R('Noto Sans Old Permic', undefined, { tags: 'komi dead', sample: '𐍐𐍑𐍒𐍓𐍔' }),
      R('Noto Sans Old Hungarian', 'rovás', { tags: 'hungary rovas dead', sample: '𐲀𐲁𐲂𐲃𐲄' }),
      R('Noto Sans Old Turkic', 'Orkhon', { tags: 'orkhon turkic dead', sample: '𐰀𐰁𐰂𐰃𐰄' }),
    ],
  },
  {
    heading: 'Indic & Central Asian historical',
    faces: [
      R('Noto Sans Brahmi', undefined, { tags: 'india ashoka dead', sample: '𑀅𑀆𑀇𑀈𑀉' }),
      R('Noto Sans Kharoshthi', undefined, { tags: 'gandhara dead', sample: '𐨀𐨁𐨂𐨃𐨅' }),
      R('Noto Sans Grantha'),
      R('Noto Sans Siddham'),
      R('Noto Sans Nandinagari'),
      R('Noto Sans Bhaiksuki'),
      R('Noto Sans Sharada'),
      R('Noto Sans Takri'),
      R('Noto Sans Kaithi'),
      R('Noto Sans Mahajani'),
      R('Noto Sans Modi'),
      R('Noto Sans Khojki'),
      R('Noto Sans Khudawadi'),
      R('Noto Sans Multani'),
      R('Noto Sans Tirhuta'),
      R('Noto Sans Newa'),
      R('Noto Sans Gunjala Gondi'),
      R('Noto Sans Masaram Gondi'),
      R('Noto Sans Sora Sompeng'),
      R('Noto Sans Warang Citi'),
      R('Noto Sans Ol Chiki'),
      R('Noto Sans Zanabazar Square'),
      R('Noto Sans Soyombo'),
      R('Noto Sans Marchen'),
      R('Noto Sans PhagsPa'),
      R('Noto Sans Old Uyghur'),
      R('Noto Sans Mongolian'),
      R('Noto Serif Tibetan'),
      R('Noto Sans Tifinagh', 'Berber / Libyco-Berber'),
    ],
  },
  {
    heading: 'East Asian historical & symbols',
    faces: [
      R('Noto Serif Tangut', 'Xixia', { tags: 'xixia china dead', sample: '𗀀𗀁𗀂𗀃𗀄' }),
      R('Noto Sans Nushu', undefined, { tags: 'nushu china women dead', sample: '𛆁𛆂𛆃𛆄𛆅' }),
      R('Noto Sans Yi', undefined, { tags: 'yi china', sample: 'ꀀꀁꀂꀃꀄ' }),
      R('Noto Sans Miao'),
      R('Noto Sans Nyiakeng Puachue Hmong'),
      R('Noto Sans Pahawh Hmong'),
      R('Noto Sans Pau Cin Hau'),
      R('Noto Sans Hanifi Rohingya'),
      R('Noto Sans Wancho'),
      R('Noto Sans Mro'),
      R('Noto Sans Tangsa'),
      R('Noto Sans Nag Mundari'),
      R('Noto Sans Medefaidrin'),
      R('Noto Sans Symbols', 'misc. signs'),
      R('Noto Sans Symbols 2', 'phaistos, byzantine, alchemical'),
      R('Noto Sans Math'),
      R('Noto Music'),
      R('Noto Sans Mayan Numerals'),
      R('Noto Znamenny Musical Notation'),
    ],
  },
  {
    heading: 'Africa, Americas, constructed',
    faces: [
      R('Noto Sans Adlam'),
      R('Noto Sans NKo'),
      R('Noto Sans Vai'),
      R('Noto Sans Bamum'),
      R('Noto Sans Osmanya'),
      R('Noto Sans Mende Kikakui'),
      R('Noto Sans Bassa Vah'),
      T('Noto Sans Ethiopic', 'Geʽez / Amharic', { tags: 'ethiopia geez amharic', sample: 'ሀለሐመሠ' }),
      T('Noto Serif Ethiopic', undefined, { tags: 'ethiopia geez', sample: 'ሀለሐመሠ' }),
      R('Noto Sans Cherokee', undefined, { tags: 'cherokee sequoyah', sample: 'ᎠᎡᎢᎣᎤ' }),
      R('Noto Sans Canadian Aboriginal', 'Unified Canadian Aboriginal Syllabics', { tags: 'inuktitut cree syllabics', sample: 'ᐁᐯᑌᑫᒉ' }),
      R('Noto Sans Osage', undefined, { tags: 'osage', sample: '𐒰𐒱𐒲𐒳𐒴' }),
      R('Noto Sans Deseret', undefined, { tags: 'mormon deseret constructed', sample: '𐐀𐐁𐐂𐐃𐐄' }),
      R('Noto Sans Shavian', 'Shavian alphabet', { tags: 'shaw constructed', sample: '𐑐𐑑𐑒𐑓𐑔' }),
      R('Noto Sans Duployan'),
      R('Noto Sans SignWriting'),
    ],
  },
  {
    heading: 'Living world scripts',
    faces: [
      T('Noto Naskh Arabic', undefined, { tags: 'arabic', sample: 'كان يا ما كان' }),
      T('Noto Sans Arabic', undefined, { tags: 'arabic', sample: 'كان يا ما كان' }),
      R('Noto Nastaliq Urdu', undefined, { tags: 'urdu persian', sample: 'اردو' }),
      T('Noto Sans Hebrew', undefined, { tags: 'hebrew', sample: 'בראשית' }),
      T('Noto Serif Hebrew', undefined, { tags: 'hebrew', sample: 'בראשית' }),
      T('Noto Sans Devanagari', undefined, { tags: 'hindi sanskrit', sample: 'नमस्ते' }),
      T('Noto Serif Devanagari', undefined, { tags: 'hindi sanskrit', sample: 'नमस्ते' }),
      T('Noto Sans Tamil', undefined, { tags: 'tamil', sample: 'வணக்கம்' }),
      T('Noto Sans Bengali', undefined, { tags: 'bengali bangla', sample: 'নমস্কার' }),
      T('Noto Sans Thai', undefined, { tags: 'thai', sample: 'สวัสดี' }),
      T('Noto Sans Georgian', undefined, { tags: 'georgian', sample: 'გამარჯობა' }),
      T('Noto Serif Georgian', undefined, { tags: 'georgian', sample: 'გამარჯობა' }),
      T('Noto Sans Armenian', undefined, { tags: 'armenian', sample: 'Բարեւ' }),
      T('Noto Serif Armenian', undefined, { tags: 'armenian', sample: 'Բարեւ' }),
      T('Noto Sans JP', 'Japanese — large download', { tags: 'japanese cjk', sample: 'こんにちは' }),
      T('Noto Sans KR', 'Korean — large download', { tags: 'korean hangul cjk', sample: '안녕하세요' }),
      T('Noto Sans SC', 'Simplified Chinese — large download', { tags: 'chinese simplified cjk', sample: '你好世界' }),
      T('Noto Sans TC', 'Traditional Chinese — large download', { tags: 'chinese traditional cjk', sample: '你好世界' }),
      T('Noto Serif JP', 'Japanese serif — large download', { tags: 'japanese cjk', sample: 'こんにちは' }),
    ],
  },
]

const SYSTEM = new Set(['Georgia', 'Palatino', 'Times New Roman', 'Courier New'])

export const ALL_FACES: Typeface[] = (() => {
  const seen = new Set<string>()
  const out: Typeface[] = []
  for (const g of TYPE_GROUPS) {
    for (const f of g.faces) {
      if (seen.has(f.family)) continue
      seen.add(f.family)
      out.push(f)
    }
  }
  return out
})()

export const FACE_BY_FAMILY = new Map(ALL_FACES.map((f) => [f.family, f]))

function familyParam(face: Typeface): string {
  const name = face.family.replace(/ /g, '+')
  if (SYSTEM.has(face.family)) return ''
  if (face.variant === 'text') return `family=${name}:ital,wght@0,400;0,700;1,400`
  return `family=${name}`
}

/** One Google Fonts CSS URL covering `faces` (skip system fonts). */
export function cssHrefFor(faces: Typeface[]): string | null {
  const parts = faces.map(familyParam).filter(Boolean)
  if (!parts.length) return null
  return `https://fonts.googleapis.com/css2?${parts.join('&')}&display=swap`
}

export function cssHrefForFamily(family: string): string | null {
  const face = FACE_BY_FAMILY.get(family) || { family, variant: 'regular' as const }
  if (SYSTEM.has(family)) return null
  return cssHrefFor([face])
}

const injected = new Set<string>()

/** Inject a stylesheet for this family if we have not already. Safe to call often. */
export function loadFontFamily(family: string): Promise<void> {
  if (!family || SYSTEM.has(family) || injected.has(family)) {
    return document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve()
  }
  const href = cssHrefForFamily(family)
  if (!href) return Promise.resolve()
  injected.add(family)
  if (typeof document === 'undefined') return Promise.resolve()
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
  const ready = document.fonts
    ? document.fonts.load(`16px "${family}"`).then(() => undefined).catch(() => undefined)
    : Promise.resolve()
  return ready
}

/** Prefetch a whole group (used for the small book-text set at startup). */
export function prefetchGroup(heading: string) {
  const g = TYPE_GROUPS.find((x) => x.heading === heading)
  if (!g) return
  const href = cssHrefFor(g.faces.filter((f) => !SYSTEM.has(f.family)))
  if (!href || typeof document === 'undefined') return
  if (injected.has(heading)) return
  injected.add(heading)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

export function stackFor(family: string): string {
  if (SYSTEM.has(family)) {
    if (family === 'Courier New') return "Courier New, ui-monospace, monospace"
    return `'${family}', Georgia, 'Times New Roman', serif`
  }
  return `'${family}', 'Noto Sans Symbols 2', Georgia, serif`
}

export function searchBlob(face: Typeface, heading: string): string {
  return [face.family, face.note, face.tags, heading, face.sample].filter(Boolean).join(' ').toLowerCase()
}

export const SIZE_PRESETS: { label: string; pt: number }[] = [
  { label: 'Caption 8', pt: 8 },
  { label: 'Footnote 9', pt: 9 },
  { label: 'Small 10', pt: 10 },
  { label: 'Book 11', pt: 11 },
  { label: 'Trade 11.5', pt: 11.5 },
  { label: 'Comfortable 12', pt: 12 },
  { label: 'Large 14', pt: 14 },
  { label: 'Subtitle 18', pt: 18 },
  { label: 'Chapter 24', pt: 24 },
  { label: 'Display 36', pt: 36 },
  { label: 'Poster 48', pt: 48 },
  { label: 'Cover 64', pt: 64 },
]

export function copySample(text: string) {
  if (!text) return
  void navigator.clipboard?.writeText(text).catch(() => {
    window.prompt('Copy this sample:', text)
  })
}
