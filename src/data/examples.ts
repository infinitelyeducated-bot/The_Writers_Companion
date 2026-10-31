import { newChapter, newBlock, para } from '../model/types'
import type { Block, BookDoc, FrontKind, BackKind, PMNode, Project } from '../model/types'
import { LAYOUTS, settingsFor, layoutById, type LayoutSpec } from './layouts'

// ─────────────────────────────────────────────────────────────────────────────
// Example books. One per layout family, each a working excerpt rather than
// lorem ipsum: real structure (poems, speeches, slug lines) so the layout can
// be judged, and short enough to read in a minute.
// ─────────────────────────────────────────────────────────────────────────────

type Role = 'p' | 'h2' | 'h3' | 'bq' | 'brk' | 'stanza' | 'speech' | 'stage' | 'slug' | 'action' | 'transition' | 'ol' | 'ul' | 'img' | 'num'

interface Line {
  role: Role
  text?: string
  attrib?: string
  items?: string[]
  imageId?: string
  caption?: string
}

interface ExampleSpec {
  layout: LayoutSpec
  meta: Parameters<typeof buildMeta>[0]
  sections: {
    type: 'frontmatter' | 'part' | 'chapter' | 'backmatter'
    title: string
    kind?: FrontKind | BackKind
    scenes: Line[][]
  }[]
}

function buildMeta(m: {
  title: string
  subtitle?: string
  author: string
  genre: string
  description: string
  publisher?: string
  year?: string
}) {
  return {
    title: m.title,
    subtitle: m.subtitle || '',
    author: m.author,
    language: 'en',
    genre: m.genre,
    notes: '',
    isbn: '',
    publisher: m.publisher || '',
    copyrightYear: m.year || String(new Date().getFullYear()),
    description: m.description,
  }
}

function lineToNode(l: Line, images?: Record<string, string>): PMNode {
  const t = (s: string): PMNode => ({ type: 'text', text: s })
  switch (l.role) {
    case 'h2':
      return { type: 'heading', attrs: { level: 2 }, content: [t(l.text || '')] }
    case 'h3':
      return { type: 'heading', attrs: { level: 3 }, content: [t(l.text || '')] }
    case 'bq':
      return { type: 'blockquote', attrs: { attribution: l.attrib }, content: [{ type: 'paragraph', content: [t(l.text || '')] }] }
    case 'brk':
      return { type: 'sceneBreak' }
    case 'ol':
      return {
        type: 'orderedList',
        content: (l.items || []).map((i) => ({ type: 'listItem', content: [{ type: 'paragraph', content: [t(i)] }] })),
      }
    case 'ul':
      return {
        type: 'bulletList',
        content: (l.items || []).map((i) => ({ type: 'listItem', content: [{ type: 'paragraph', content: [t(i)] }] })),
      }
    case 'img':
      return { type: 'image', attrs: { imageId: images?.[l.imageId || ''] || '', alt: l.text || '', caption: l.caption, width: 100 } }
    case 'speech': {
      // "MARY. Text…" → bold character run, then the line
      const [who, ...rest] = (l.text || '').split('. ')
      return {
        type: 'paragraph',
        content: [
          { type: 'text', text: who + '.', marks: [{ type: 'bold' }] },
          { type: 'text', text: ' ' + rest.join('. ') },
        ],
      }
    }
    case 'stage':
      return { type: 'paragraph', content: [{ type: 'text', text: l.text || '', marks: [{ type: 'italic' }] }] }
    case 'slug':
      return { type: 'paragraph', content: [{ type: 'text', text: l.text || '', marks: [{ type: 'bold' }] }] }
    case 'transition':
      return { type: 'paragraph', content: [{ type: 'text', text: l.text || '' }] }
    default:
      return { type: 'paragraph', content: [t(l.text || '')] }
  }
}

function buildDoc(spec: ExampleSpec, images?: Record<string, string>): BookDoc {
  const doc: BookDoc = { version: 1, blocks: [], scenes: {}, footnotes: {} }
  let n = 0
  for (const s of spec.sections) {
    const id = `blk_${spec.layout.id}_${n++}`
    const sceneIds: string[] = []
    s.scenes.forEach((lines, i) => {
      const sid = `sc_${spec.layout.id}_${n++}_${i}`
      doc.scenes[sid] = lines.map((l) => lineToNode(l, images))
      sceneIds.push(sid)
    })
    const block: Block = {
      id,
      type: s.type,
      title: s.title,
      kind: s.kind as never,
      sceneIds,
    }
    doc.blocks.push(block)
  }
  return doc
}

// ── The examples ─────────────────────────────────────────────────────────────

const tradeSpec: ExampleSpec = {
  layout: layoutById('trade'),
  meta: buildMeta({
    title: 'The Salt Line',
    subtitle: 'A novel',
    author: 'Ines Calloway',
    genre: 'Literary Fiction',
    description: 'A surveyor is sent to chart a coastline that keeps moving, and finds the village that lives on it has been waiting for her.',
    publisher: 'Harbour & Vane',
  }),
  sections: [
    { type: 'frontmatter', title: 'Title Page', kind: 'titlepage', scenes: [[]] },
    { type: 'frontmatter', title: 'Copyright', kind: 'copyright', scenes: [[]] },
    { type: 'frontmatter', title: 'Dedication', kind: 'dedication', scenes: [[{ role: 'p', text: 'For everyone who lives on a coast that will not hold still.' }]] },
    { type: 'frontmatter', title: 'Epigraph', kind: 'epigraph', scenes: [[{ role: 'bq', text: 'The map is not the land, but it is the only argument the land will accept.', attrib: '— Surveyor’s handbook, 1961' }]] },
    {
      type: 'chapter',
      title: 'Chapter One',
      scenes: [[
        { role: 'p', text: 'The tide came in four minutes early the morning Delia arrived, and the fishermen on the shingle counted it the way you count a stranger’s footsteps in your hall.' },
        { role: 'p', text: 'She had come with a case of instruments and a letter from the Board, and the letter said the coast was to be resurveyed because the coast had moved. Delia had read the letter three times on the train and each time found something new in it to dislike.' },
        { role: 'p', text: '“You will want the low water,” said the woman at the boathouse, not a question.' },
        { role: 'p', text: '“I will want the last seventy years of them,” said Delia.' },
        { role: 'brk' },
        { role: 'p', text: 'The village sat at the end of a line of posts driven into the mud, each post with a date cut into it. 1898. 1911. 1934. The dates stopped in the war, then started again, thinner. Delia walked the line twice before she understood it was not a boundary. It was a record. Someone had been writing the coast down, post by post, for as long as there had been a coast to write.' },
        { role: 'p', text: '“We are the survey,” said the woman who brought her tea. “You are the map. There is a difference, and it is the difference between a thing that is true and a thing that has been drawn.”' },
        { role: 'h2', text: 'The Line' },
        { role: 'p', text: 'By the third day Delia had begun to understand that the numbers were not going to agree with her, and that the disagreement was not the sea’s fault. The sea was doing what the sea did. It was the land that had been lying.' },
        { role: 'ol', items: ['Measure the posts. Record the dates.', 'Compare with the Board’s chart of 1952.', 'When the figures refuse to reconcile, believe the figures.'] },
        { role: 'p', text: 'She wrote the third item down and then sat looking at it for a long while, the way you look at a sentence you have written that is more true than you intended.' },
        { role: 'bq', text: 'A coastline is a disagreement between water and paper.', attrib: '— Delia Fenshaw, field notebook' },
      ]],
    },
    {
      type: 'chapter',
      title: 'Chapter Two',
      scenes: [[
        { role: 'p', text: 'On the fourth day the woman at the boathouse showed her the ledger.' },
        { role: 'p', text: 'It was not a ledger. It was a coat of notebooks, sewn into a canvas cover, and when Delia opened it the pages smelled of salt and pencil and forty summers of somebody’s patience.' },
        { role: 'p', text: '“Who kept this?” she asked.' },
        { role: 'p', text: '“The last one who asked how far out the tide went,” said the woman, “and then came back to write it down every year.”' },
        { role: 'brk' },
        { role: 'p', text: 'There were eleven names in the cover, in eleven hands. The last was not a name at all but a date, still wet, this morning’s ink.' },
      ]],
    },
    { type: 'backmatter', title: 'Acknowledgments', kind: 'acknowledgments', scenes: [[{ role: 'p', text: 'Thank you to the tide tables, the archivists, and everyone who answered a letter from a stranger.' }]] },
    { type: 'backmatter', title: 'About the Author', kind: 'aboutAuthor', scenes: [[{ role: 'p', text: 'Ines Calloway writes about land, water, and the documents that try to keep them apart. This is her first novel.' }]] },
  ],
}

const childrenSpec: ExampleSpec = {
  layout: layoutById('children'),
  meta: buildMeta({
    title: 'The Bear Who Borrowed the Moon',
    author: 'Nell Okafor',
    genre: "Children's Picture Book",
    description: 'Bear finds that the moon has gone home without saying goodbye, and sets out to borrow it back.',
  }),
  sections: [
    { type: 'frontmatter', title: 'Title Page', kind: 'titlepage', scenes: [[]] },
    { type: 'frontmatter', title: 'Copyright', kind: 'copyright', scenes: [[]] },
    {
      type: 'chapter',
      title: 'One',
      scenes: [[
        { role: 'p', text: 'Bear woke up and the sky was empty.' },
        { role: 'p', text: 'The moon had been there when he went to sleep. It had been round and pale and very sure of itself. Now there was only a dark blue nothing, like a pocket with a hole in it.' },
        { role: 'p', text: '“Where has it gone?” said Bear.' },
        { role: 'p', text: '“Home,” said Owl, who was usually right and never helpful.' },
      ]],
    },
    {
      type: 'chapter',
      title: 'Two',
      scenes: [[
        { role: 'p', text: 'So Bear put on his coat and took a jar, because if you are going to borrow something you should bring something to carry it in.' },
        { role: 'p', text: 'He walked past the sleeping river. He walked past the sleeping stones. He walked until the hill got tired of being walked on and sat down.' },
        { role: 'p', text: 'At the top of the hill, someone had left the moon in a tree, like a coat on a chair.' },
      ]],
    },
    {
      type: 'chapter',
      title: 'Three',
      scenes: [[
        { role: 'p', text: '“Excuse me,” said Bear. “Have you finished with this?”' },
        { role: 'p', text: 'The moon did not answer, because moons are very old and have a lot on their minds.' },
        { role: 'p', text: 'Bear climbed up anyway. He climbed carefully, the way you climb when you are carrying something that is not yours yet.' },
        { role: 'p', text: 'And then he sat with it a while. Because sometimes the thing you have been looking for is only waiting to be looked at.' },
      ]],
    },
    { type: 'backmatter', title: 'About the Author', kind: 'aboutAuthor', scenes: [[{ role: 'p', text: 'Nell Okafor writes picture books about animals with sensible plans and one very good idea.' }]] },
  ],
}

const poetrySpec: ExampleSpec = {
  layout: layoutById('poetry'),
  meta: buildMeta({
    title: 'Small Weather',
    author: 'Ana Reyes',
    genre: 'Poetry',
    description: 'Forty poems about the weather inside a house.',
  }),
  sections: [
    { type: 'frontmatter', title: 'Title Page', kind: 'titlepage', scenes: [[]] },
    { type: 'frontmatter', title: 'Copyright', kind: 'copyright', scenes: [[]] },
    { type: 'frontmatter', title: 'Dedication', kind: 'dedication', scenes: [[{ role: 'p', text: 'For M., who keeps the windows.' }]] },
    { type: 'frontmatter', title: 'Epigraph', kind: 'epigraph', scenes: [[{ role: 'bq', text: 'Weather is what happens to a house from the outside in.', attrib: '— Anonymous' }]] },
    {
      type: 'chapter',
      title: 'First Frost',
      scenes: [[
        { role: 'p', text: 'The heating says a word I do not know' },
        { role: 'p', text: 'and the window agrees with it.' },
        { role: 'p', text: '      Outside, the garden' },
        { role: 'p', text: '            has put on its gloves.' },
        { role: 'num', text: '' },
        { role: 'p', text: 'I make tea for two' },
        { role: 'p', text: 'out of habit,' },
        { role: 'p', text: '      and drink both cups' },
        { role: 'p', text: '            and call it company.' },
      ]],
    },
    {
      type: 'chapter',
      title: 'The House Learns the Names of the Rain',
      scenes: [[
        { role: 'p', text: 'Drizzle is the one that arrives without knocking.' },
        { role: 'p', text: 'Shower is brisk, and leaves early.' },
        { role: 'p', text: '      Downpour is a relative' },
        { role: 'p', text: '            who stays the night.' },
        { role: 'num' },
        { role: 'p', text: 'And the rain that comes sideways? That one' },
        { role: 'p', text: 'the house calls by its first name' },
        { role: 'p', text: '      and stands back' },
        { role: 'p', text: '            to let it through.' },
      ]],
    },
    {
      type: 'chapter',
      title: 'Receipt',
      scenes: [[
        { role: 'p', text: 'One table. Two chairs.' },
        { role: 'p', text: 'A window that has been open since March' },
        { role: 'p', text: '      and has opinions about November.' },
        { role: 'num' },
        { role: 'p', text: 'All of it kept. All of it' },
        { role: 'p', text: '      still in the room.' },
      ]],
    },
    { type: 'backmatter', title: 'Notes', kind: 'endnotes', scenes: [[]] },
    { type: 'backmatter', title: 'Acknowledgments', kind: 'acknowledgments', scenes: [[{ role: 'p', text: 'Some of these poems first appeared in *The Quarterly Review* and *Small Hours*.' }]] },
  ],
}

const playSpec: ExampleSpec = {
  layout: layoutById('play'),
  meta: buildMeta({
    title: 'The Inventory',
    subtitle: 'A play in one act',
    author: 'Tomás Ibarra',
    genre: 'Drama',
    description: 'Two sisters inventory their mother’s house the weekend before the sale, and find more than furniture.',
  }),
  sections: [
    { type: 'frontmatter', title: 'Title Page', kind: 'titlepage', scenes: [[]] },
    { type: 'frontmatter', title: 'Copyright', kind: 'copyright', scenes: [[]] },
    {
      type: 'frontmatter',
      title: 'Dramatis Personae',
      kind: 'dramatisPersonae',
      scenes: [[
        { role: 'p', text: 'MIRIAM (48) — the elder sister. Organised. Not calm.' },
        { role: 'p', text: 'RUTH (41) — the younger. Arrives late, always. Has brought nothing.' },
        { role: 'p', text: 'A HOUSE — the third character. Speaks through its furniture.' },
        { role: 'p', text: 'Setting: a front room, late afternoon. Everything is labelled with a sticker.' },
      ]],
    },
    {
      type: 'chapter',
      title: 'ACT ONE',
      scenes: [[
        { role: 'stage', text: 'Late afternoon. A front room, half-dismantled. Stickers on every object, each with a number. MIRIAM is at a table with a clipboard. A clock somewhere is out of step with itself.' },
        { role: 'speech', text: 'MIRIAM. Forty-one.' },
        { role: 'stage', text: 'She writes. Pause.' },
        { role: 'speech', text: 'MIRIAM. Forty-two. Chair. Dining, with a mark on it. Table. Oak.' },
        { role: 'stage', text: 'A key in the lock. RUTH enters, carrying nothing, in a coat that is still wet.' },
        { role: 'speech', text: 'RUTH. You started.' },
        { role: 'speech', text: 'MIRIAM. You were supposed to be here at two.' },
        { role: 'speech', text: 'RUTH. I’m here at the thing occurring. That’s not nothing.' },
        { role: 'stage', text: 'MIRIAM does not look up. RUTH goes to the window, then away from the window.' },
        { role: 'speech', text: 'RUTH. Are you going to number me?' },
        { role: 'speech', text: 'MIRIAM. Forty-three.' },
        { role: 'brk' },
        { role: 'stage', text: 'A long pause. The clock gets more out of step, then somehow right.' },
        { role: 'speech', text: 'RUTH. She used to sit here when the light went. Just here. She said the room needed to be told it was evening.' },
        { role: 'speech', text: 'MIRIAM. I know.' },
        { role: 'speech', text: 'RUTH. You don’t, though. You know it the way you know a number.' },
        { role: 'stage', text: 'MIRIAM puts the pen down. This is, for her, an enormous gesture.' },
        { role: 'speech', text: 'MIRIAM. Then sit. Tell me about the light.' },
        { role: 'stage', text: 'RUTH sits. The clock, for a moment, is exactly on time.' },
      ]],
    },
    { type: 'backmatter', title: 'Music & Permissions', kind: 'playMusic', scenes: [[{ role: 'p', text: 'No music is required. Any recording used in performance must be licensed by the producing company.' }]] },
    { type: 'backmatter', title: 'About the Author', kind: 'aboutAuthor', scenes: [[{ role: 'p', text: 'Tomás Ibarra writes for the stage and for radio. The Inventory was first produced at the Lantern Theatre.' }]] },
  ],
}

const screenplaySpec: ExampleSpec = {
  layout: layoutById('screenplay'),
  meta: buildMeta({
    title: 'NIGHT SHIFT',
    author: 'Jo Alden',
    genre: 'Screenplay',
    description: 'A convenience store clerk and the last customer of the night.',
  }),
  sections: [
    { type: 'frontmatter', title: 'Title Page', kind: 'titlepage', scenes: [[]] },
    { type: 'frontmatter', title: 'Copyright', kind: 'copyright', scenes: [[]] },
    {
      type: 'chapter',
      title: 'Scene 1',
      scenes: [[
        { role: 'slug', text: 'INT. CORNER STORE — 3:47 A.M.' },
        { role: 'p', text: 'Fluorescent light on a floor that has never been clean. TELLER (24) sits behind the counter with a paperback open at a page he has not turned in an hour.' },
        { role: 'p', text: 'The door BEEPS. A MAN (60s) enters, in a coat that has been rained on more than once tonight.' },
        { role: 'p', text: 'He goes to the drinks fridge. Stands there. The fridge hums.' },
        { role: 'transition', text: 'MAN: You’re open.' },
        { role: 'p', text: 'TELLER doesn’t look up.' },
        { role: 'transition', text: 'TELLER: That’s generally the arrangement.' },
      ],
      [
        { role: 'slug', text: 'INT. CORNER STORE — LATER' },
        { role: 'p', text: 'The MAN has a carton of milk he does not want. It sits between them on the counter like a small hostage.' },
        { role: 'p', text: 'TELLER finally looks at him. Really looks.' },
        { role: 'transition', text: 'TELLER: Bad night?' },
        { role: 'p', text: 'The MAN considers the question with the seriousness of a man who has not been asked it in some time.' },
        { role: 'transition', text: 'MAN: It’s the same night. That’s the thing. It’s the same night all the way through.' },
        { role: 'p', text: 'The TELLER closes the book, on the finger he has been keeping in it.' },
        { role: 'transition', text: 'TELLER: Then you should sit down. It goes faster if you sit down.' },
        { role: 'p', text: 'The MAN sits on the stool. The fridge hums. Outside, the street stays exactly as it was.' },
        { role: 'transition', text: 'FADE OUT.' },
      ]],
    },
    { type: 'backmatter', title: 'About the Author', kind: 'aboutAuthor', scenes: [[{ role: 'p', text: 'Jo Alden writes short films and long nights.' }]] },
  ],
}

const technicalSpec: ExampleSpec = {
  layout: layoutById('technical'),
  meta: buildMeta({
    title: 'The Writers Companion: A Field Manual',
    subtitle: 'How a manuscript becomes a book',
    author: 'The Writers Companion Documentation',
    genre: 'Reference',
    description: 'How printing, pagination and EPUB actually work in The Writers Companion, with checklists.',
  }),
  sections: [
    { type: 'frontmatter', title: 'Title Page', kind: 'titlepage', scenes: [[]] },
    { type: 'frontmatter', title: 'Copyright', kind: 'copyright', scenes: [[]] },
    { type: 'frontmatter', title: 'Preface', kind: 'preface', scenes: [[{ role: 'p', text: 'This manual explains what the software does to your words between the manuscript and the printed page, and how to check it.' }]] },
    {
      type: 'chapter',
      title: 'Chapter 1',
      scenes: [
        [
          { role: 'h2', text: '1.1 Page geometry' },
          { role: 'p', text: 'A printed page is described by four margins and a trim size. Because pages alternate sides, the margins are mirrored: the inside margin faces the binding on every page.' },
          { role: 'ol', items: ['Choose a trim size.', 'Set top, bottom, inside and outside margins.', 'Leave the gutter automatic unless the printer specifies one.'] },
          { role: 'h3', text: '1.1.1 Why the gutter widens' },
          { role: 'p', text: 'A thick book swallows more of the inside margin in the binding. Automatic gutter follows the print-on-demand rule tables so the text does not disappear into the spine.' },
          { role: 'h2', text: '1.2 Run a preflight' },
          { role: 'p', text: 'Before exporting, read every item in the readiness column. A red item will be rejected by most printers; an amber one will print but look wrong.' },
        ],
        [
          { role: 'ul', items: ['Page count within the printer range.', 'Gutter adequate for the page count.', 'All margins, top and bottom included, at least a quarter inch.', 'Images at least 300 ppi at their placed size.'] },
          { role: 'p', text: 'The checks are deliberately conservative. They will occasionally warn about a book that would in fact print fine, and never pass one that would not.' },
        ],
      ],
    },
    { type: 'backmatter', title: 'Glossary', kind: 'glossary', scenes: [[
      { role: 'ul', items: ['Recto — a right-hand page, odd folio.', 'Verso — a left-hand page, even folio.', 'Gutter — the inside margin, sometimes added to.', 'Folio — the page number as printed.'] },
    ]] },
    { type: 'backmatter', title: 'Index', kind: 'index', scenes: [[
      { role: 'p', text: 'Gutter, 4 · Folio, 12 · Recto, 12 · Trim size, 3 · Verso, 12' },
    ]] },
  ],
}

const memoirSpec: ExampleSpec = {
  layout: layoutById('memoir'),
  meta: buildMeta({
    title: 'Kitchen Light',
    subtitle: 'Notes from the long middle',
    author: 'Henry Varick',
    genre: 'Memoir',
    description: 'Seven kitchens and one marriage, told through what was cooked in them.',
  }),
  sections: [
    { type: 'frontmatter', title: 'Title Page', kind: 'titlepage', scenes: [[]] },
    { type: 'frontmatter', title: 'Copyright', kind: 'copyright', scenes: [[]] },
    { type: 'frontmatter', title: 'Epigraph', kind: 'epigraph', scenes: [[{ role: 'bq', text: 'We are what we cannot stop making.', attrib: '— my mother, over a pan' }]] },
    { type: 'frontmatter', title: 'Dedication', kind: 'dedication', scenes: [[{ role: 'p', text: 'For the ones who ate it anyway.' }]] },
    {
      type: 'chapter',
      title: 'One',
      scenes: [[
        { role: 'p', text: 'The first kitchen I remember had one cupboard, and the cupboard had a door that would not stay shut, and my mother solved this with a chair.' },
        { role: 'p', text: 'That was the whole of our engineering: a chair against a door. I have lived in houses since then with soft-close drawers and hinges that cost more than that kitchen, and I have never once felt as sure of anything.' },
        { role: 'h2', text: 'The chair' },
        { role: 'p', text: 'It was not a chair you sat in. It was a chair you leaned. That distinction mattered, because my father would sit in it on Sundays and then there was nowhere to lean and the door would drift open of its own accord, as if it had been waiting.' },
        { role: 'bq', text: 'Everything in that house was held shut by something else in it.', attrib: '— from a letter, 1994' },
        { role: 'p', text: 'I have been trying, in this book, to be exact about small things. Exactness is the only courtesy I know of that does not cost anything.' },
      ]],
    },
    { type: 'backmatter', title: 'Acknowledgments', kind: 'acknowledgments', scenes: [[{ role: 'p', text: 'To the readers of the early drafts, and to the chair.' }]] },
    { type: 'backmatter', title: 'About the Author', kind: 'aboutAuthor', scenes: [[{ role: 'p', text: 'Henry Varick has written for newspapers and for no one in particular. This is his third book.' }]] },
  ],
}

export const EXAMPLE_SECTIONS: Record<string, ExampleSpec> = {
  trade: tradeSpec,
  children: childrenSpec,
  poetry: poetrySpec,
  play: playSpec,
  screenplay: screenplaySpec,
  technical: technicalSpec,
  memoir: memoirSpec,
}

export interface ExampleInfo {
  id: string
  name: string
  tag: string
  blurb: string
  title: string
  author: string
  trim: string
  /** Guidance on the finished length a writer should aim for in this form. */
  typicalLength: string
  /** Guidance on the finished page count a writer should aim for in this form. */
  typicalPages: string
}

const TYPICAL_LENGTHS: Record<string, string> = {
  trade: 'Aim for 50,000–120,000 words · a novel that fits the 828-page ceiling',
  children: 'Aim for 300–1,000 words · read-aloud length',
  poetry: 'Aim for 3,000–15,000 words · roughly 50–100 poems',
  play: 'Aim for 8,000–25,000 words · a full evening on stage',
  screenplay: 'Aim for 20,000–25,000 words · about 90–120 pages, a minute a page',
  technical: 'Aim for 20,000–100,000 words · length serves the subject',
  memoir: 'Aim for 50,000–100,000 words · memoir-length, like a novel',
}

const TYPICAL_PAGES: Record<string, string> = {
  trade: 'Aim for roughly 200–400 pages at 6 × 9',
  children: 'Aim for 24–32 pages · the standard picture-book length',
  poetry: 'Aim for roughly 60–120 pages at 5.5 × 8.5',
  play: 'Aim for roughly 70–120 pages at 5.5 × 8.5',
  screenplay: 'Aim for 90–120 pages · about one page per minute of screen time',
  technical: 'Aim for roughly 150–350 pages at 7 × 10 · let the subject decide',
  memoir: 'Aim for roughly 200–350 pages at 5.25 × 8',
}

export const EXAMPLES: ExampleInfo[] = Object.values(EXAMPLE_SECTIONS).map((s) => ({
  id: s.layout.id,
  name: s.layout.name,
  tag: s.layout.tag,
  blurb: s.layout.blurb,
  title: s.meta.title,
  author: s.meta.author,
  trim: (() => {
    const t = s.layout.settings.trim!
    return `${t.width} × ${t.height} in`
  })(),
  typicalLength: TYPICAL_LENGTHS[s.layout.id] || 'No fixed length · watch the page count, not the word count',
  typicalPages: TYPICAL_PAGES[s.layout.id] || 'No fixed length · watch the page count, not the word count',
}))

/** Build a complete, ready-to-open project for a layout family. */
export function buildExample(layoutId: string, images?: Record<string, string>): Project {
  const spec = EXAMPLE_SECTIONS[layoutId] || tradeSpec
  const settings = settingsFor(spec.layout.id)
  const meta = buildMeta(spec.meta)
  const doc = buildDoc(spec, images)
  // ensure the fixed sections exist even if the example omitted them
  const has = (kind: string) => doc.blocks.some((b) => b.kind === kind)
  if (!has('titlepage')) doc.blocks.unshift({ id: 'blk_tp_' + layoutId, type: 'frontmatter', title: 'Title Page', kind: 'titlepage' as never, sceneIds: [] })
  if (!has('copyright')) doc.blocks.splice(1, 0, { id: 'blk_cp_' + layoutId, type: 'frontmatter', title: 'Copyright', kind: 'copyright' as never, sceneIds: [] })
  return {
    id: 'proj_' + Math.random().toString(36).slice(2, 10),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    meta,
    settings,
    doc,
    coverHex: settings.cover.background,
  }
}

/** An empty project in a given layout family. */
export function buildBlank(layoutId: string): Project {
  const spec = layoutById(layoutId as never)
  const settings = settingsFor(spec.id)
  const meta = buildMeta({ title: 'Untitled Book', author: 'Anonymous', genre: spec.tag, description: '' })
  const scenes: BookDoc['scenes'] = {}
  const blocks: Block[] = []
  for (const k of spec.front) {
    const id = 'blk_' + Math.random().toString(36).slice(2, 9)
    const sid = 'sc_' + Math.random().toString(36).slice(2, 9)
    scenes[sid] = [para()]
    blocks.push({ id, type: 'frontmatter', title: titleForKind(k), kind: k as never, sceneIds: [sid] })
  }
  const ch = newChapter(spec.firstChapter, '')
  blocks.push(ch.block)
  Object.assign(scenes, ch.scenes)
  for (const k of spec.back) {
    const { block, scenes: s } = newBlock('backmatter', titleForKind(k), k)
    blocks.push(block)
    Object.assign(scenes, s)
  }
  return {
    id: 'proj_' + Math.random().toString(36).slice(2, 10),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    meta,
    settings,
    doc: { version: 1, blocks, scenes, footnotes: {} },
    coverHex: settings.cover.background,
  }
}

function titleForKind(kind: string): string {
  const map: Record<string, string> = {
    titlepage: 'Title Page',
    copyright: 'Copyright',
    dedication: 'Dedication',
    epigraph: 'Epigraph',
    foreword: 'Foreword',
    preface: 'Preface',
    introduction: 'Introduction',
    prologue: 'Prologue',
    dramatisPersonae: 'Dramatis Personae',
    cast: 'Cast of Characters',
    characterList: 'Character List',
    epilogue: 'Epilogue',
    acknowledgments: 'Acknowledgments',
    aboutAuthor: 'About the Author',
    alsoBy: 'Also By',
    appendix: 'Appendix',
    glossary: 'Glossary',
    bibliography: 'Bibliography',
    afterword: 'Afterword',
    endnotes: 'Notes',
    index: 'Index',
    colophon: 'Colophon',
    playMusic: 'Music & Permissions',
  }
  return map[kind] || kind
}

export { LAYOUTS }
