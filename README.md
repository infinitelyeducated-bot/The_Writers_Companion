# The Writers Companion

> **A separate project, grown from BookForge.** It starts with every BookForge feature (the manuscript editor, print layout, cover design, EPUB/DOCX/Markdown export, 228-face type catalog, worked examples) and is the home for a larger writer's library. It keeps its own code, its own repository and its own browser storage (`writerscompanion.*`), so it never reads or overwrites BookForge data on the same computer.

A book production app that runs entirely in your browser. You write and organise a
manuscript, lay it out as real printed pages, design the cover, and export a print
interior PDF, a print-ready cover PDF and an EPUB 3 ebook — all from one copy of the text.

Nothing is uploaded anywhere. There is no account, no server and no internet requirement
after the first load. Everything is stored in your browser's own database on this machine.

The Writers Companion is **freeware**. The first-launch agreement is the licence: you may use it; you
do not own it, and you may not sell, rebrand or redistribute it as your product. There is
no warranty and no support. Clicking **Yes — open The Writers Companion** records that on this device
so you are only asked once.

---

## What you can do (every function)

| You want to… | Where | How it works |
|---|---|---|
| Start over | Library → **Reset The Writers Companion to default** (red) | Erases every book and setting in this browser and returns The Writers Companion to first launch. Asks first; cannot be undone. |
| Accept the licence | First launch | Read the freeware terms. **Yes** opens the app; **No** closes it. |
| Browse books | Library | Covers on a shelf. Search by title, author or genre. |
| Start a book | Library → New book | Title, author, genre, then a **layout family** (trade, children's, poetry, play, screenplay, technical, memoir). |
| Open a worked example | Library shelf | Seven complete short books, one per family, plus the sample novella. Duplicate one to keep the original. |
| Restore a backup | Library → Restore backup… | A `.writerscompanion.json` file replaces nothing until you pick it; leftover images/notes from an old copy of that book are cleared first. |
| Preview a typeface | Library type bar | Search 228 families (hieroglyphs, runes, storybook faces…). Copy a sample into the clipboard. Opening a book does not change its body face until you apply type in the editor. |
| Write | Write tab | Three columns: manuscript tree, editor, notes. |
| Change face or size of *some* words | Editor toolbar, next to **B I U** | Pick a face and/or size. It applies to the **highlight**, or to **whatever you type next** — same stored-mark behaviour as bold. Unmarked body still uses the book's print typeface. |
| Small caps | **Aa** in the toolbar (⌘⇧K) | Real small caps, not strikethrough. Survives print, EPUB, DOCX and Markdown. |
| Add a picture to a page | Write: **Picture** tab (or Print / Cover / Export) | **Each interior page has its own picture** and its own image history — flip through everything saved to that page with ‹ › . Three layers, all empty (transparent) by default. Type is always fully opaque on top. **Use selected image for all pages** repeats one page's picture book-wide; off restores per-page art. |
| See that picture while writing | Write → **Edit** | Exclusive tabs. Edit shows that page’s picture in position; flip **Interior page** to see another page’s art. |
| Recolour a layer | Picture → Colour on this layer | Red / Green / Blue mix (0 = that channel gone). **Colour** 100% → 0% greyscale (**Remove colour**). Prints with the interior. |
| Aim for a typical length | Status bar (bottom of the workspace) | Left: “how many pages are typical” for this layout family. Right: live word count. Hover the left line for the word-count guidance from the example cards. |
| Lay out pages | Print layout | Trim, margins, gutter, body type, chapter openings, running heads, contents, footnotes, page graphics, bleed. Live spread preview. |
| Check it will print | Print layout, right column | KDP-style readiness: page count, gutter, margins, image DPI, empty chapters, bleed vs crop marks. |
| Interior PDF | Print layout → Interior PDF | Desktop: print window → Save as PDF. Phones: the button explains you need a computer. |
| Design the jacket | Cover | Full wrap (back + spine + front) from page count × paper thickness. Print PDF or ebook PNG. |
| Export the book | Export | EPUB 3, DOCX, Markdown, project backup JSON. Import the reverse. |
| Keep history | Editor, bottom | Snapshots on session start, every ten minutes, and before destructive work. Snapshots now carry **settings too** (layout, art, typography), so Restore brings the whole workspace back. |
| Set a goal & autosave | **◎ box, right of + Part** (lower-left on other tabs) | Closed by default. Writing goal in words with a progress bar, and the workspace autosave interval — every 5 minutes by default, changeable in 5-minute steps up to 60. |
| Find & replace | **Search bar in the app bar** (next to the type tools) | Searches every chapter and scene. Match case, whole word; smart quotes match straight ones. Replace all takes a snapshot first. Hover the bar for the full description. |
| Mark index terms | **✦ in the editor toolbar** | Select a word, press ✦. Build the index on Print layout: an alphabetical Index block lands in the back matter with real page numbers. |
| Stretch a picture | Picture → this layer | **Stretch to fit** fills the page exactly (ignores proportions); otherwise the picture keeps its shape and the Size slider applies. |
| Keep an original image | Picture → **Save to image_folder** | Writes the untouched original for reuse; an `image_folder` directory ships beside each launcher. Saving there preserves the original from any alterations. |
| Move art on the page | Print layout preview | **Alt-drag** on a page that has art to place the picture; sliders remain the fine control. |
| Real faces in e-readers | Export → EPUB 3 → **Embed webfonts** | Packs the used Google Fonts as woff2 into the EPUB (hieroglyphs, runes, storybook faces survive). Needs network at export; capped at 8 MB. |
| Send the book out | Export → Storage / Retailers | Open Google Drive, Dropbox, OneDrive, Box, iCloud, MEGA — or KDP, Apple Books, Google Play, Kobo, B&N, Draft2Digital, IngramSpark, Lulu — each labelled with the file it wants. |
| Change the whole book’s body face | Print layout → Typography | Default face and size for unmarked text and for measuring pages. Different from the inline toolbar marks. |

---

## Open it

- **Double-click `Run_App_The_Writers_Companion.cmd`** to open the single-file desktop build (`dist-selfcontained/pc/The_Writers_Companion_pc.html`). No install, no server, nothing is opened to the network.
- Online: https://infinitelyeducated-bot.github.io/The_Writers_Companion/

## Getting it running

You need Node.js 20 or newer.

```bash
cd The_Writers_Companion
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173). For a build that runs
faster and can be served from a plain web server:

```bash
npm run build      # makes a dist/ folder
npm run preview    # serves that build
```

The first time it opens it creates a sample novella, *The Keeping of the Light*, so there
is something real to click on. Delete it whenever you like.

**One thing to know about storage:** each browser address is its own little world. If you
work at `localhost:5173` and then open `127.0.0.1:5173`, you will see a second, separate
library. Pick one address and stay with it, or your books will appear to "disappear".

---

## Layout families, and seven worked examples

A book is not just words in a typeface. A children's picture book, a poem, a play and a
crime novel all have their own conventions about page size, indents, spacing, headings and
what goes in the front matter. The Writers Companion calls these **layout families**. Choosing one sets
up the whole page — trim size, margins, typeface, leading, indentation, running heads,
folio style, chapter-opening rules, the sections a new book starts with, and a matching
cover palette.

You choose the family when you create a book: **New book → Layout family**. You can also
change it later from **Print layout → Layout family**. Switching keeps your text, notes and
artwork, but replaces the page and type rules.

Quick comparison:

| Family | Page | What makes it itself |
|---|---|---|
| **Trade fiction** | 6 × 9 | Indented paragraphs, justified, running heads, chapters open recto, TOC with leader dots |
| **Children's picture book** | 8.5 × 8.5 | 17 pt type, no indents, no running heads, one image in a side bar on the outer edge of every page |
| **Poetry collection** | 5.5 × 8.5 | Ragged right, no indents, stanza spacing, indented run-on lines preserved, each poem starts a new page, no leader dots |
| **Stage play** | 5.5 × 8.5 | Cast list up front, character names in capitals, stage directions italic, centred folios, no TOC |
| **Screenplay** | 8.5 × 11 | Courier at 12 pt, 1.05 leading, wide left margin for notes, folios top-outside, no running heads |
| **Technical manual** | 7 × 10 | Tight leading, left-aligned headings, numbered steps, TOC down to sections, endnotes, index |
| **Literary memoir** | 5.25 × 8 | Drop caps, warm serif, word-numbered chapters, vignette every fourth page, ornaments between sections |

**Seven examples are already in your library**, one per family. Each is a short but
complete book rather than filler text. Open any of them, then:

- **Print layout** to see the pages it produces and change any rule;
- **Duplicate** it in the library to make it your own start;
- **Layout family** at the top of the print settings to switch styles; your artwork is kept,
  everything else changes.

The seven examples and the sample novella are seeded the first time you open the app. They
are ordinary books — edit or delete them as you like; deleting one just removes it, and it
will not come back on reload.

### Trade fiction

Best for novels, novellas and short-story collections.

- **Page:** 6 × 9, comfortable top/bottom margins and auto gutter.
- **Type:** Literata 11.5 pt, generous 1.5 leading, justified, 1.5-em first-line indents,
  automatic hyphenation.
- **Structure:** starts with title page, copyright, dedication and epigraph; ends with
  acknowledgments and about the author. Chapters begin on a right-hand page, with numbered
  labels such as “Chapter One”.
- **Running pages:** book title on left pages, chapter title on right pages; page numbers
  centred at the bottom; roman numerals in the front matter. Suppressed where chapters open.
- **Contents:** chapter-level table of contents with dotted leaders.
- **Cover:** dark classic jacket with gold accent.
- **Example included:** *The Salt Line* by Ines Calloway, with two chapters, a dedication,
  epigraph, block quote and numbered list.
- **Tip:** keep paragraphs as ordinary unindented prose in the editor; The Writers Companion applies
  the novel indent for you.

### Children's picture book

Best for read-aloud books where illustration and large readable text matter most.

- **Page:** square 8.5 × 8.5, wide even margins.
- **Type:** Source Serif 4 at 17 pt, 1.6 leading, left-aligned, no first-line indents, extra
  paragraph spacing, no hyphenation.
- **Structure:** title page, copyright and author note by default; chapters are named
  “Page One”, “Page Two”, and so on because spreads, not chapters, are the unit.
- **Art:** an unframed sidebar image on the outer edge of every page, including chapter
  openings; choose or replace it under Page graphics.
- **Running pages:** none. Folios only, at the outer bottom corner. No contents page.
- **Cover:** warm band-style cover in orange and green.
- **Example included:** *The Bear Who Borrowed the Moon* by Nell Okafor, three short
  read-aloud chapters.
- **Tip:** keep sentences short and paragraphs separate; long justified paragraphs would
  defeat the large-type design.

### Poetry collection

Best for collections where line breaks, white space and page placement are the design.

- **Page:** 5.5 × 8.5, taller top and bottom margins to give poems room to breathe.
- **Type:** EB Garamond 12 pt, 1.55 leading, ragged right, no indents, no hyphenation.
- **Structure:** title page, copyright, dedication and epigraph up front; acknowledgments,
  author note and index at the back. Each poem starts on a fresh page and is not forced to
  a right-hand page.
- **Running pages:** book title and poem title in the header, centred folios, roman
  numerals in front matter. No leader dots in the contents, which suits a short list.
- **Line treatment:** run-on lines keep their editor indentation; empty paragraphs become
  stanza breaks.
- **Cover:** pale minimal cover with quiet brown accent.
- **Example included:** *Small Weather* by Ana Reyes, three poems including “First Frost”
  and “Receipt”.
- **Tip:** do not fake stanzas with blank Heading blocks; use empty Body paragraphs so
  pagination treats them as vertical space.

### Stage play

Best for acting editions and reading copies of plays.

- **Page:** 5.5 × 8.5, wider inside margin so the binding never eats dialogue.
- **Type:** Crimson Pro 11.5 pt, 1.45 leading, ragged right, no indents, modest paragraph
  spacing, no hyphenation.
- **Structure:** starts with title page, copyright and a cast list; dialogue lives in
  scenes such as “ACT ONE”. Character names are written in capitals, followed by dialogue;
  stage directions are italic.
- **Back matter:** author note plus a music and permissions page, since productions often
  need this.
- **Running pages:** titles in the header and centred folios; no contents page.
- **Cover:** dark framed cover with theatrical red accent.
- **Example included:** *The Inventory* by Tomás Ibarra, a one-act play with a cast of
  three, dialogue, entrances and pauses.
- **Tip:** write one speech per paragraph and keep stage directions in their own italic
  paragraphs; that is what the layout expects.

### Screenplay

Best for film and TV scripts that must follow industry page conventions.

- **Page:** US Letter, 8.5 × 11, with a wide 1.5-inch inside margin for binding and notes.
  The gutter is fixed rather than automatic.
- **Type:** Courier Prime 12 pt, tight 1.05 leading, ragged right, generous paragraph gaps,
  no hyphenation. Courier is deliberate: one page is roughly one minute of screen time.
- **Structure:** title page and copyright only. The example uses “FADE IN:” and numbered
  scenes such as “Scene 1”.
- **Scene elements:** caps slug lines such as “INT. CORNER STORE — LATER”, action
  paragraphs, and speaker labels such as “TELLER:” before dialogue.
- **Running pages:** none. Folios only, at the top outer edge. No contents page.
- **Cover:** black minimal cover with gold accent.
- **Example included:** *NIGHT SHIFT* by Jo Alden, two convenience-store scenes.
- **Tip:** do not justify or indent screenplay text; doing so breaks the one-page-per-minute
  rhythm readers and producers expect.

### Technical manual

Best for guides, references, documentation and other books people look things up in.

- **Page:** 7 × 10, wider all round than fiction so headings, lists and figures fit.
- **Type:** Source Serif 4 at 10.5 pt, tight 1.42 leading, justified, no first-line indent,
  wider paragraph spacing and hyphenation on for dense text.
- **Structure:** title page, copyright, preface and introduction up front; appendix,
  glossary, bibliography and index at the back. Starts at “Chapter 1” with numbered
  headings such as “1.1 Page geometry”.
- **Contents:** goes down to section headings, includes front matter, and uses leader dots.
  Footnotes default to page bottom; endnotes are available.
- **Art:** image captions are switched on; plate captions are available for diagrams.
- **Running pages:** titles in the header and folios at the outer bottom.
- **Cover:** dark blue classic cover with technical-blue accent.
- **Example included:** *The Writers Companion: A Field Manual*, including page-geometry rules, a
  preflight checklist, glossary entries and an index sample.
- **Tip:** use H2/H3 for real sections, ordered lists for steps, and unordered lists for
  look-up entries; all three are styled for this family.

### Literary memoir

Best for memoirs, essay collections and reflective non-fiction.

- **Page:** 5.25 × 8, slightly smaller than a novel; warm and old-book in feeling.
- **Type:** Lora 11 pt, generous 1.6 leading, justified, 1.25-em indent, hyphenation on.
- **Structure:** title page, copyright, epigraph, dedication and foreword up front;
  acknowledgments and author note at the back. Chapters use words, such as “One”.
- **Openings:** drop cap, small-caps first line, a rule ornament, and right-hand starts
  with word-numbered labels.
- **Art:** a faint centred vignette every fourth page by default, not on chapter openings.
- **Running pages:** author name on left pages, chapter title on right pages, folios at the
  outer bottom.
- **Cover:** warm grey framed cover.
- **Example included:** *Kitchen Light* by Henry Varick, kitchen-centred memoir with an
  epigraph, titled section, block quote and acknowledgments.
- **Tip:** let chapters be short essays; the drop cap, rules and vignette are designed for
  frequent openings rather than one very long chapter.

---

## The library

The first screen lists your books as covers on a shelf.

- **New book** — asks for a title, author and genre, then a **layout family**, and drops
  you into the editor.
- **Open** — click a cover.
- **Duplicate** — makes a full copy (manuscript, notes, snapshots and images, with image
  ids remapped), useful for trying a different layout without risking the original.
- **Delete** — removes the book, its revision history, its notes and its images. Ask
  yourself first whether you have a backup.
- **Import manuscript…** — bring in a `.docx`, `.md`, `.txt` or `.html` file and The Writers Companion
  makes a new book out of it (more on how it reads those files further down).
- **Restore backup…** — load a `.writerscompanion.json` project file. Confirms chapters, parts,
  words and repaired paragraphs when the file came from an import; leftover assets from
  an older copy of the same book are deleted first so restore is clean.
- **Search** — filters by title, author or genre as you type.
- **Reset The Writers Companion to default** — the red button beside *+ New book*. It erases
  everything this copy of The Writers Companion has stored in your browser — every book, picture, note and
  snapshot, plus your skin, menu font and panel positions — and starts over exactly as
  first opened: the licence screen, then the sample novella and the seven examples. A
  popup asks first, and says plainly: *this can't be undone; you'll lose everything not
  saved elsewhere.* To keep a book, save a JSON backup before you reset. The
  `writerscompanion-*.html` file itself is never changed by anything in the app, so there is
  nothing to undo in it — your work only ever lived in the browser.
- **Type bar** — searchable catalog of 228 families. Copy a sample (hieroglyphs, runes,
  “Once upon a time”) to paste later. This preview does not rewrite an existing book.
- **Typical length / typical pages** on each example card — guidance only; the app never
  enforces it. The same lines appear on the workspace status bar once a book is open.

---

## Writing

Open a book and you are on the **Write** tab: the manuscript column on the left, the
editor on the right, and a status bar along the bottom.

### The manuscript column (left)

**Width slider** — under *+ Chapter / + Part* at the bottom of the column. 100% is the
normal width (230px). Slide down to 60% to give the editor more room, or up to read long
chapter titles in full. The top of the slider is set by your window — the widest the
column can go while the editor stays usable — so every notch moves the column; there is
no dead stretch at the end. Double-click to reset to 100%. The width is saved with the
book.

Your book is a list of *blocks*: front matter, parts, chapters and back matter. Chapters
can hold several scenes.

- **Drag the grip (⠿)** to move a block up or down. Drag a chapter above a part, a part
  above a chapter — the order is yours.
- **Double-click a title** to rename it.
- **⋯** opens a small menu: rename, duplicate, delete, add a scene, collapse the scenes.
- **+** at the top adds a new part, chapter, or any piece of front or back matter
  (dedication, epigraph, foreword, preface, introduction, prologue, epilogue,
  acknowledgments, about the author, also-by, appendix, glossary, bibliography,
  afterword, notes).
- The number beside each block is its word count.

**Front matter** and **back matter** are ordinary blocks, which means you can reorder them
freely and the app follows your order. Chapter numbering comes from position, so if you
insert a chapter in the middle everything renumbers itself. You can override a chapter's
displayed number in the small bar under its title.

### The editor column (middle)

The text editor is built for long-form prose rather than business documents:

- **Body paragraphs** get a first-line indent, as novels do — and the indent is
  automatically dropped after a heading, an image, a block quote, a list or a scene
  break, and at the start of a new scene. That is the convention readers expect, and you
  should not have to fight it.
- **Section headings** (the `H2` and `H3` buttons) give you dividers inside a chapter.
- **Block quotes** with an attribution line (the `❝` button, then `—` to set the
  attribution).
- **Bulleted and numbered lists.**
- **Scene breaks** — the `❦` button, or just type `* * *` on its own line.
- **Images** — the `▣` button. Pick a file and it is embedded in the book.
- **Footnotes** — the `†` button. Click the little marker afterwards to edit the note.
- **Links**, underline, bold, italic, **small caps** (`Aa`, or ⌘⇧K).
- **Typeface and size** sit in that same toolbar, not in the app bar. Changing them
  does **not** restyle the whole book. Highlight words and pick a face or size, or pick
  first and keep typing — both marks stack (a 24 pt hieroglyph next to 11.5 pt Literata
  is allowed). Next to them: **lettering colour** (any colour), a **gradient** (solid /
  gold / sunset / ocean / forest / ember), and an **opacity** slider. Type starts fully
  opaque so it always reads over a picture. The book's default face (Print layout →
  Typography) is still used for unmarked body text and for measuring pages.
- **Edit / Preview / Picture / Notes** — four exclusive tabs at the right of the editor
  bar. Only one is selected. The app bar shows the **chapter count top-centre**; the
  bottom status bar shows the **current page** (“page 4 of 128” — the interior page
  chosen on Write or shown on Print layout) to the left of the **book word total** —
  every one of these carries a mouseover description. **Edit** is
  the manuscript; if the current interior page has art, it is drawn in position under
  the type. **Preview** is the scene as a printed page, on its own. **Picture** is the
  layer editor (see **Pictures on the page** below). Switching away from Picture does
  not discard the art; Edit shows it again in the same place.
- **Typographise** (the `“A”` button) converts straight quotes, `--` and `...` in the
  current scene into proper typography if you pasted text from elsewhere.

**Tab indents four spaces.** Press Tab at the start of a line and the line steps in four
spaces; press it again to step further. Shift-Tab takes four back. Inside a list, Tab keeps
its usual meaning and nests the item. Indents are kept as non-breaking spaces while you
write — in justified text ordinary spaces would stretch across the measure — and are
converted to ordinary spaces when the page, DOCX or EPUB is produced.

**Typography happens as you type.** Quotes curl the right way, `--` becomes an en dash,
`---` an em dash, and `...` an ellipsis. You type plainly and the page looks right.

**Saving is automatic** — the badge at top right says *Saved* when it has caught up. There
is no save button to forget. Leaving the tab, hiding the window or exporting flushes any
pending save first.

**Status bar** (bottom of the workspace, every tab): typical-page guidance for this layout
family on the left (“Aim for roughly 200–400 pages at 6 × 9”, and so on); live word count
on the right. Hover the left line for the matching word-count aim from the example cards.

**Skins** — the 🎨 dropdown (app bar, and on the library shelf) repaints the workspace:
panels, buttons, lines and accents. **40 alternate skins** ship alongside the classic:
the requested six — Rock and Roll, Space, Carnival, Robots, Terminator, Pitbulls &
Corgis — plus nature (Deep Forest, Open Ocean, Desert Noon, Tundra, Volcano, Rainforest,
Aurora, Canyon), eras and genres (Film Noir, Old West, Steampunk, Cyberpunk, Vaporwave,
Art Deco, Illuminated, Grunge, Synthwave, Papyrus), animals (Black Cat, Honeybee, Koi
Pond, Night Owl, Fox Den, Wolf Pack, Dragon Hoard) and moods (Midnight Ink, Rose Gold,
Lavender Dusk, Fresh Mint, Charcoal Sketch, Tomato Garden, Espresso Bar, Glacier,
Meadow). The choice is remembered on this device. Skins change the room, never the
manuscript: printed pages, PDFs and EPUBs are untouched.

**The ◎ box** (goals) is mounted at the bottom of the chapter column, right of
**+ Part**; click it and it opens upward. On Print layout, Cover and Export, which have
no chapter column, it sits in the lower-left corner instead. **Drag it anywhere**: hold
the gloved hand (🧤) on its left edge — it closes into a fist (✊) while you carry the
box — and let go to park it. The spot is remembered on this device; double-click the
glove to put it back beside + Part. Open the box for:

- **Writing goal** — a word target with a progress bar; the status-bar count feeds it.
- **Autosave interval** — the workspace saves every **5 minutes** by default, adjustable
  in 5-minute steps (5–60). Typing still saves within a second; this is the extra net.

**Find & replace** lives as a search bar in the app bar, next to the save badge. Type to
see every match across all chapters with context; options for match case and whole word;
smart quotes match straight ones. **Replace all** snapshots the book first, so it can be
undone from Version history. Hover the bar for the tool description.

**Index terms**: select a word and press **✦** in the toolbar (dotted underline in the
editor, invisible in print). On Print layout, **Build index from marked terms** writes an
alphabetical Index into the back matter with the real page numbers of this layout —
rebuild it after layout changes, the way you would refresh a TOC.

**The bottom status bar** holds, left to right: the typical-pages guidance for this
layout family, **Version history** and **Snapshot now**, the **page navigator** (‹ page ›)
with its **▣ has picture / □ no picture** indicator — click it to jump to the next page
that has a picture — and finally the current page and the book word total.

**Version history** lives in that bottom bar. The Writers Companion takes a snapshot when
you start working, every ten minutes of editing, and whenever you are about to do
something destructive (delete a chapter, import a file, restore an old version). You can
also press *Snapshot now* and give it a name you will recognise. *Restore* puts the book
back to that moment — and takes a snapshot of where you were first, so restoring is never
a one-way door.

The **Preview page** button shows the current scene as it will look on a printed page,
without leaving the editor.

### Notes (tab beside Picture)

A place for research, character notes, timelines and references, opened from the
**Notes** tab next to Picture. Like pictures, **notes can belong to a page**:

- **Page N** lists the notes saved to the interior page you are on. Change page with the
  navigator in the bottom bar and the list follows. **+ Note** saves a new note to that
  page.
- **All notes** lists every note in the book, each labelled with its page (or *whole
  book*). **+ Note** here makes a book-wide note that belongs to no page.
- **⇣ Page N / ⊘ Unpin page** on an open note attaches it to the current page or makes it
  book-wide.

Page notes use the same text anchors as pictures, so a note follows its page when the
book reflows. Star a note to pin it to the top. Notes never appear in any export.

---

## Typefaces

The Writers Companion ships a catalog of **228 families**, loaded on demand from Google Fonts so the
single-file build stays about 1.4 MB. System faces (Georgia, Palatino, Times New Roman,
Courier New) never hit the network.

- Search by name, script or tag: `hieroglyph`, `cuneiform`, `runic`, `linear`, `disney`,
  `storybook`.
- Script faces only draw their writing system. Latin typed in Noto Sans Egyptian
  Hieroglyphs falls back to a serif — use **Click to copy** on the sample (`𓀀…`, `ᚠᚢᚦ…`)
  and paste it into the manuscript.
- **Inline marks** (editor toolbar) change only the selection or following typing.
- **Book default** (Print layout → Typography, and Cover → Typeface) is the face used for
  unmarked body text, running heads, and measuring pages. Cover type is independent of
  body type.
- EPUB still uses a Georgia stack in its CSS (webfonts are not packed in the zip).
  Print-to-PDF embeds whatever Chrome has loaded.

See `FONTS.md` in the repo for the full grouped list.

---

## Pictures on the page

Every interior page can carry a **different** picture. On Write, **Edit**, **Preview**
and **Picture** are independent tabs — pick one. The same layer editor also lives under
**This page · picture** on Print / Cover / Export.

1. Choose the **interior page number** (Print uses the page you are looking at; Edit has
   its own page stepper so you can see each page’s art).
2. Pick a **layer** — all three start **empty and transparent**:
   - **Below text** — the picture under the words. This is the one you usually fill.
   - **With text** — also under the letters, so a below-layer image shows through.
   - **Above text** — overlays the words (ornaments, frames).
3. A checkerboard in the mini preview means “nothing here yet”. Type is never transparent
   by default: letters stay fully visible on top of whatever is below.
4. **Add picture** stores the file with the book (in this browser's storage) and
   remembers it **against that page**.
   Every image ever placed on a page stays in that page's own list: when a page holds more
   than one, an **Images saved to page N** navigator appears with ‹ previous / next ›, so
   you can flip between them without re-uploading.
5. **Use selected image for all pages** — a toggle at the top of the panel. On: every page
   in the book renders this page's picture (one wallpaper everywhere). Off: normal
   behaviour returns — each page shows only its own picture. If another page holds the
   toggle, the panel says so and you can take it over from here.
6. Then, per layer:
   - **Stretch to fit the page** — fills the page exactly, ignoring proportions
   - **Size** 10–300% (when not stretched)
   - **Opacity** of the whole layer
   - **Across / Down** position — or **Alt-drag the picture on the Print layout preview**
   - **Save to image_folder** — writes the untouched original out of the workspace.
     Each launcher ships with an `image_folder` directory beside it; saving there
     *preserves the original image file from any alterations and/or for faster reuse*.
5. **Background gradient** sits behind all three layers: None, Ivory, Night, Sunset,
   Forest, Wash. Angle and stop colours are editable.
6. **Colour on this layer** (once a picture is on it):
   - **Red / Green / Blue** 0–100% — fade that channel toward transparent.
   - **Colour** 100% original → 0% greyscale. **Remove colour** jumps to 0%.
   - **Reset colour** returns all four to 100%.

Every page carries its own number: Edit shows it **bottom-centre of the page** (— 4 —),
and the **page navigator** sits in the bottom status bar, beside *Snapshot now* — step
‹ › or type a number to work on that page. The rows above the manuscript — app bar, chapter bar, *Number shown*, and the
formatting toolbar — are kept compact, one thin line between each. The **typeface and
settings toolbar** runs the full width of the editor as a single row and stays
pinned at the top while you scroll, so face, size, colour and the rest
are reachable at all times.

The toolbar can also be **dragged**: a gloved hand (🧤) sits on its left edge as the
handle. Left-click and hold — the glove closes into a grabbing fist (✊) — and the whole
toolbar unlatches and floats wherever you carry it; release the mouse and the hand lets
go, leaving the bar parked there. Drag it back near the top of the page and it **snaps
into its home position**, pinned again. Home is where it lives unless you deliberately
float it.

Switching back to **Edit** shows that page’s picture **under** the words (the paper is
transparent; letters stay fully opaque). If you added art on another interior page, Edit
jumps to the first page that has a picture — or use **Interior page** to flip. Print
layout draws the same image behind the type, not over it.
The toolbar stays opaque so buttons remain readable. The same layers print on the
interior PDF. Preview never shares selection with Edit or Picture.

**Pictures follow their text.** A picture is saved to *the n-th page of a chapter*, not
to a bare page number, so when you add a paragraph and chapter 2 slides from page 5 to
page 6, its picture moves with it. (Title, copyright and contents pages, which belong to
no chapter, keep their page number.) Books made before this change are converted the
first time Print layout repaginates. Changing layout family keeps your page art;
switching books does not leak it.

---

## Importing a manuscript

**File → Import** (in the Export tab) accepts Word, Markdown, plain text and HTML.

- **`.docx`** — heading level 1 and 2 become chapter or part breaks; deeper headings become
  section headings. Images in the document are pulled out and kept.
- **`.md`** — `#` starts a part (if the line begins with "Part", "Book" or "Volume") or a
  chapter; `##` and `###` become section headings.
- **`.txt`** — blank lines separate paragraphs; short unpunctuated lines and lines like
  "Chapter 7" are treated as headings.
- **Broken paragraphs are repaired.** When a document has been broken mid-sentence by hard
  line breaks (very common when people paste from Word or PDF), The Writers Companion rejoins a short
  line with no full stop to the line after it. It reports how many it fixed.

You are shown what it found before anything replaces your work, and your current
manuscript is snapshotted first.

**Exporting back** gives you a `.docx` with proper headings, indents and styles, or a `.md`
file that round-trips cleanly through the importer.

---

## Print layout

The **Print layout** tab is where the book becomes a physical object. The left column is
settings, the middle is a live preview, the right is a readiness check.

### Page setup

- **Trim size** — 5×8, 5.25×8, 5.5×8.5, 6×9, 7×10, 8.5×11, or any size you type.
- **Margins** — top, bottom, inside (gutter side) and outside. Because pages are mirrored,
  "inside" means the right-hand margin on a left page and the left-hand margin on a right
  page.
- **Gutter** — the extra space in the middle of the spread that disappears into the bind.
  Leave *auto gutter* on and it widens automatically with the page count, following the
  print-on-demand rules (a thin book needs little, a thick one needs a lot). Turn it off
  to set it by hand.
- **Typography** — the book's **default** typeface and size (for unmarked text), line
  spacing, indent size, paragraph spacing, justified or ragged right, hyphenation on or
  off. Inline face/size marks from the editor still print on top of this.
- **Chapter openings** — start chapters on right-hand (recto) pages, insert a blank page
  to reach recto, a new page per chapter, a drop cap (optically tightened so it does not
  collide with the first lines), small-caps first line, an ornament (asterism, fleuron,
  diamond or rule), and chapter numbers as digits, words or omitted.
- **Running heads and folios** — the small text at the top of each page and the page
  numbers. Choose what goes on the left page (book title or author) and the right page
  (chapter title, part title or book title), and suppress them where convention says you
  should: on chapter-opening pages and in front and back matter.
- **Contents and notes** — switch the table of contents on or off, show or hide the leader
  dots, include front matter in it, set **contents depth** (chapters and parts, or down to
  section headings), and choose whether footnotes sit at the bottom of the page they
  belong to or are gathered together as endnotes at the back. Multi-page contents are
  laid out last so folio numbers are real, not guessed.

### What the preview shows

The preview shows pages at true size, in spreads, exactly as they will print. It has a
zoom control, a guides toggle that draws the margins and baselines over the page, and an
*All pages* view that shows the whole interior as thumbnails.

Every layout change repaginates the book a moment after you stop changing things. Nothing
is estimated: pages are filled by measuring real text in the real typeface.

### What The Writers Companion does to your text on the page

- Chapters begin on a right-hand page; if that needs a blank left-hand page to make the
  numbers work, one is inserted and carries no header or page number.
- Front matter is numbered in roman numerals, and the main text restarts at page 1.
- The table of contents is generated with the real page numbers, worked out after the
  book has been laid out.
- Footnotes are measured into the page they belong to, so text shortens on those pages
  rather than notes spilling off the bottom.
- Running heads disappear on chapter openings and part pages.

### Page graphics

An optional layer of artwork, under *Page graphics* in the settings column:

- **Vignette on the page** — a small image set on the page away from the text, with a size,
  a position (top or bottom), an alignment (centred, outer edge, inner edge) and a
  **fader** that sets how visible it is. You can also tell it to appear only every second,
  third or nth page. Upload PNG, JPEG, GIF, WebP or SVG.
- **Image in a side bar** — carves a column out of the text, 20–45% of the width wide, on
  the outer or inner edge. Because the text column narrows, the book legitimately gets
  longer, and the page count updates to say so. There is a frame option and its own fader.
- **Full-page plates** — a picture on its own page, placed opposite each chapter opening
  so it faces the chapter. It can carry the chapter title as a caption.
- **Decorative border** — a single rule, a double rule, or a rule box with a fleuron,
  independent of any image.

Animated GIFs play in the preview, but a printed PDF can only hold one frame and EPUB
readers vary, so the panel tells you when you have uploaded one.

**This page · picture** (above Page graphics) is the per-page layer editor described in
**Pictures on the page**. Use it when a single spread needs art that should not repeat
on every chapter.

### The readiness check (right column)

This is the part that tells you whether a print shop will accept the file. It checks:

- page count against the printable minimum and maximum;
- whether the gutter is wide enough for a book of this length;
- whether the outside, top and bottom margins meet the minimum;
- whether the text column is so narrow or so deep that lines will look loose or a page
  will look cramped;
- whether any image is placed larger than its resolution supports;
- whether the images in the book actually exist;
- whether you have left a chapter empty;
- whether you have set a title and author;
- whether bleed is switched on without crop marks.

Each item says what is wrong and, where there is a fix, what to do about it. Green ticks,
amber warnings, red errors.

### Exporting the PDF

**Interior PDF** opens a print window laid out at the exact trim size. Choose *Save as
PDF*, set the paper size to the trim size, margins to none, and background graphics on. You
get one PDF page per book page, matching the preview exactly. With bleed and crop marks
enabled, the sheet grows by the bleed and crops marks are drawn.

---

## Cover

The **Cover** tab designs the whole printed jacket: back cover, spine and front, sized from
the trim size and the current page count.

- **Spine width** is calculated, not guessed: page count × paper thickness. White paper is
  thinner than cream, so switching paper changes the spine — as it would at a printer.
- The full wrap is **bleed + back + spine + front + bleed** in inches, shown live.
- **Artwork** — upload a front and/or back image.
- **Style** — Classic, Colour band, Minimal or Frame; typeface; background, text and accent
  colours; title and author sizes; spine text (only offered when the spine is wide enough
  to hold it, which is the printer's rule too); back-cover blurb; imprint name.
- **Guides** show the trim line, the spine and the safe area inside the edges. They never
  print.
- **Print cover PDF** exports the full wrap at size with bleed, ready for the printer.
- **Ebook cover PNG** exports just the front at 1600 × 2560 pixels, the digital cover
  proportion.

---

## Exporting

The **Export** tab gathers everything else:

- **EPUB 3** — one file containing the whole book: metadata, cover, a navigable table of
  contents, front matter, images and endnotes, one XHTML document per chapter.
- **DOCX** — the manuscript with proper Word headings and indents.
- **Markdown** — the manuscript as `.md`.
- **Project backup (.json)** — the whole project, including notes, revision history and
  images, in one file. This is your insurance policy; keep one.
- **Import** — the flip side, described above.
- A short activity log of what you have just exported.

The cover image you upload here is also what the EPUB uses.

### Send to storage, publish to retailers

Two panels at the end of the Export tab list where a finished book usually goes:

- **Storage** — Google Drive, Dropbox, OneDrive, Box, iCloud Drive, MEGA. **Open ↗**
  opens the service's file page; drag the exported file in. The Writers Companion has no accounts
  and uploads nothing by itself — your book leaves this machine only when you drag it.
- **Retailers** — Amazon KDP, Apple Books, Google Play Books, Kobo Writing Life,
  Barnes & Noble Press, Draft2Digital, IngramSpark, Lulu. Each row is labelled with the
  file that service wants (EPUB, PDF, or both) and a note on its quirks; hover for the
  full text. Export that file first, then upload it on their page.

Pricing, accounts and content review belong to each store. The Writers Companion's job ends at a
file that passes their checks — for print, run the KDP readiness panel first.

Export also carries a **This page · picture** panel (pick a page number) so you can attach
art without leaving the tab.

---

## Where your work lives, and how to keep it

Everything — text, images, notes, revision history — is stored in your browser's
IndexedDB on this machine. There is no account and no cloud.

That also means:

- Clearing your browser's site data for this address **deletes your books**. Use *Backup
  project* regularly, and keep the `.json` somewhere safe.
- Using a different browser, a private window, or a different address gives you a
  different, empty library.
- The app works offline once loaded, except for the web fonts it fetches from Google
  Fonts on first use.

---

## What it doesn't do

Worth being straight about, so you don't look for features that aren't there:

- **No collaboration or accounts.** One writer, one machine.
- **No spell check or grammar suggestions** beyond what your browser's own spell checker
  offers inside the editor.
- **No automatic chapter splitting** of an existing manuscript except by heading level;
  if your Word file has no headings, everything arrives as one chapter and you split it
  with *Split → new scene*.
- **The print PDF is produced by your browser's print engine.** That means fonts must be
  installed or web-loaded, and the result is a PDF generated by Chrome rather than by a
  dedicated typesetter. It is production-usable, but paged CSS engines (Paged.js, Vivliostyle)
  can do finer widow and orphan control than The Writers Companion currently attempts.
- **EPUB webfonts are optional.** Tick *Embed webfonts* on Export to pack the used faces
  into the file (needs network at export, capped at 8 MB); otherwise readers use their
  own serif.
- **EPUB is not yet machine-validated** against EPUBCheck in this build. The file is
  structured to the EPUB 3 spec — mimetype first and uncompressed, container, package
  document, nav, NCX, backlinks — but run it through EPUBCheck before publishing.
- **Parts and chapters sometimes share a spread.** A part page followed immediately by a
  chapter does not always force a fresh right-hand page.
- The **PDF text layer** for the table of contents page repeats its entries when the text
  is copied out. The page prints correctly; it is a quirk of text extraction.

---

## Limits: what fits in one book

Three different ceilings apply, and only one of them belongs to The Writers Companion.

### 1. What the printer will accept (the real limit, for print)

These are the rules The Writers Companion's readiness check enforces, and they govern most print-on-demand
paperbacks:

- **Pages: 24 minimum, 828 maximum** in a single volume. Below 24 there is not enough spine
  to carry glue and a title; above 828 the block will not bind reliably. Go over either and
  the check turns red.
- **Gutter** widens with length: 0.375″ up to 150 pages, 0.5″ up to 300, 0.625″ up to 500,
  0.75″ up to 700, 0.875″ up to 828. Longer books need wider inside margins, which is why
  the text block narrows as the page count rises.
- **No hard word limit** — a page holds what it holds. At around 320 words a page and 828
  pages, one volume tops out somewhere near **250,000 words**; War and Peace at 6 × 9 is
  about 1,200 pages, so it needs splitting into volumes whatever software you use.
- **Image resolution: at least 300 ppi at the size it is placed.** A 2,000 px image shown
  4 inches wide is 500 ppi and fine; the same image shown 8 inches wide is 250 ppi and gets
  flagged. There is no count limit on images, only this quality threshold.
- Bleed, if used, is 0.125″ on every edge, and must be consistent throughout.

### 2. What The Writers Companion itself handles

Measured, not guessed:

| Manuscript | Words | Pages produced | Layout time |
|---|---|---|---|
| 100 chapters | 68,000 | 368 | 0.3 s |
| 400 chapters | 328,000 | 1,864 | 1.6 s |
| 900 chapters | 740,000 | 4,192 | 3.6 s |

Pagination is synchronous and roughly linear — about 1,000 words per 5 ms — so a long novel
re-lays out in well under a second each time you change a setting. Memory stays small
(17 MB of heap for a 740,000-word book) because the manuscript is text, not images.

The practical ceiling is therefore **the printer's, not the app's**: book layouts in the
hundreds of pages are instant, and only at several thousand pages would the browser's own
memory become the constraint.

### 3. Storage on this machine

Everything is stored in this browser profile. Chrome grants about **10 GB** per site here;
Firefox has its own allowance. Text is negligible — a 100,000-word manuscript is under 1 MB.

**Images are the only thing that fills it.** Each image is stored about a third larger than
the original (the price of storing it as text). The Writers Companion now refuses any single image over
**20 MB** with a clear message rather than failing silently, which is roughly the size
printer PDFs and ebook readers cope with comfortably anyway. A book with a hundred
photographs at 2 MB each is 200 MB and poses no problem; heavy coffee-table photography at
10 MB a page would hit the storage ceiling after a few hundred pages.

If you are planning a picture-heavy book, keep original scans elsewhere and put resized
versions (about 300 ppi at the printed size) into The Writers Companion — better for the printed page,
the PDF and the EPUB alike.

---

## Offline, and on a phone or tablet

The desktop browser is the primary way to use The Writers Companion, and everything below is additive —
nothing about the desktop layout changes.

### It already works with no internet

There is no server: your books live in this browser, and every export (PDF, EPUB, DOCX, cover)
is generated on the device. The only thing that needed a connection was loading the page and
the web fonts. The Writers Companion now installs a service worker that caches the whole app on first
visit, so after that it opens and works fully offline. Verified by loading it, cutting the
network, reloading, and paginating a book: the library, the editor and the print preview all
worked with the connection off.

The web fonts are cached the first time they load. For a book that matters, install the
typefaces on your system, or open the app once while online.

### Installing it as an app

**On a PC (Chrome or Edge):** open the app, click the install icon in the address bar (or
⋮ → *Install The Writers Companion*). You get a window of its own in the taskbar, no browser chrome, and
a start-menu entry.

**On Android (Chrome):** open the app, then ⋮ → *Add to Home screen* → *Install*. It launches
full-screen like a native app.

**On iPhone / iPad (Safari):** Share → *Add to Home Screen*. It opens without Safari's
chrome. Note that iOS gives web apps less storage than desktop and may clear it if the
device is very low on space, so keep a project backup.

### How it adapts on a phone

Below 860 pixels wide the layout reflows rather than shrinking:

- the manuscript tree becomes a drawer, opened with **☰ Chapters**;
- the tab strip moves to a bottom bar within thumb reach, above the home indicator;
- the print settings sit above the preview instead of beside it, and a page is shown at
  about half scale so a whole page fits the screen;
- the readiness check moves below the preview and stays visible (it used to be hidden on
  narrow screens);
- the toolbar scrolls sideways, and the editor uses full width with touch-sized controls.

The interface responds to the notch and home-indicator safe areas when installed.

### What is not the same on mobile

Honest list, so nothing surprises you at publication time:

- **Exporting a PDF on a phone gives you the browser's share/save sheet**, not a desktop
  save dialog. The PDF is still produced identically; it is where it lands that differs.
- **Pop-up based exports (interior PDF, cover PDF) need pop-ups allowed.** On iOS Safari
  these are blocked by default, so PDF export is best done on a desktop.
- **Large books are slower on a phone.** Pagination that takes 0.3 seconds on a laptop takes
  a few seconds on an older phone; the app stays responsive, it simply takes longer.
- **Storage is tighter.** iOS caps web storage more aggressively than desktop, so keep
  project backups and avoid storing full-resolution photography there.

### Distributing native Android and iOS builds

The Writers Companion is a web app, so a native wrapper is the shortest path to app-store builds. The
project is already shaped for it: the build is entirely static and the service worker
caches everything.

1. Install Capacitor: `npm i @capacitor/core @capacitor/cli`, then `npx cap init`.
2. Add the platforms: `npx cap add android` and `npx cap add ios` (iOS builds need a Mac
   with Xcode; Android needs Android Studio).
3. Build and copy: `npm run build && npx cap copy`.
4. Open in the native IDE (`npx cap open android` / `ios`) and run or publish.

Two things to plan for before shipping to a store, because they are not handled in the web
version:

- **File download and print behaviour.** Web download attributes and `window.print()` do not
  behave the same inside a native webview. Use a Capacitor file plugin to write the PDF and
  EPUB to the device, and a share sheet to hand them on — the export functions already return
  Blobs, so this is a wrapper, not a rewrite.
- **Data durability.** A webview's storage can be cleared by the operating system. For a
  native build, move storage from IndexedDB to SQLite (a Capacitor community plugin) or add
  automatic export of the project JSON to the device's documents folder.

Because it is a PWA, you can also distribute without app stores: install it from a website,
which is how the offline and home-screen versions above work.

---

## The one file to edit: `src/layout/writerscompanion.css`

If you want to change how the book looks beyond what the Print layout panel offers,
there is a single stylesheet for it:

```
src/layout/writerscompanion.css
```

It loads last, in the editor and on the printed page alike, so a rule written there
overrides the built-in styling and appears in the print preview **and** the interior PDF at
the same time. It is commented throughout with the class names of every part of a page —
running heads, page numbers, chapter openings, scene breaks, block quotes, footnotes, the
table of contents, title page, and each layout family — so you can find the thing you want
to change without reading the source.

**Try it:** open the file, find this at the top of section 2, and uncomment the two lines:

```css
.book-page .folio[data-head="folio"] {
  font-weight: 700;
  color: #8a5a2b;
}
```

Save, then look at the Print layout tab. I verified this end to end: changing the page-number
colour to red turned page numbers red in the preview and in an exported PDF, and restoring
the file put them back.

Things worth knowing:

- **The interface is not in this file.** The library, editor and panels are styled
  separately, so nothing you write here can break the workspace around your book.
- **Paragraph spacing is measured with the same rules**, so changing it in this file also
  changes where pages break — it does not just move text visually.
- Extensions that are switched off in a comment cost nothing. Leave what you do not want
  commented out.
- If a rule does not seem to apply, check the class combination: `.book-page.ptype-chapter`
  means "chapter opening pages only", and `.layout-poetry .page-body` means "only in the
  poetry layout".

---

## Three self-contained builds: desktop, Android, iOS

Besides the hosted version, The Writers Companion builds into **one single HTML file per platform** —
JavaScript, CSS, fonts and all. No installer, no server, no internet: the file *is* the app.

```bash
node scripts/build-targets.mjs
```

produces:

| File | Size | Use it for |
|---|---|---|
| `dist-selfcontained/pc/The_Writers_Companion_pc.html` | 1.3 MB | opening in Chrome/Edge/Firefox on a computer |
| `dist-selfcontained/android/The_Writers_Companion_android.html` | 1.3 MB | a file manager on Android — it opens in Chromium |
| `dist-selfcontained/ios/The_Writers_Companion_ios.html` | 1.3 MB | the Files app on iPhone/iPad — it opens in Safari |

Double-click the desktop file and it runs. Your library is stored by the browser for that
file, so keep it somewhere permanent (not a downloads folder you clear).

### How the three differ

They are built from one source and share one stylesheet; the differences are behavioural
and deliberately small, because the layout is already responsive:

| | Desktop | Android | iOS |
|---|---|---|---|
| Workspace | three columns, top tabs | tree drawer, bottom tabs, settings above preview | same as Android, plus notch and home-indicator insets |
| Saving files | ordinary download | the Android share sheet | the iOS share sheet |
| Interior PDF | print window → Save as PDF | button says so and explains | button says so and explains |
| Cover PDF | full wrap with bleed | not offered | not offered |
| Ebook cover PNG, EPUB, DOCX, Markdown, backup | yes | yes | yes |
| Text sizing | as set in the panel | as set | inputs forced to 16px so Safari does not zoom on focus |

The reason PDF export is desktop-only is honest: it works by opening a print window and
using the browser's print-to-PDF. Phones do not have that. The book keeps its full layout,
so opening the same file on a computer exports the interior unchanged — and the app says so
rather than failing silently.

### Verified from a `file://` URL

Each build was opened straight from disk with no server, in a 1440×900 desktop viewport and
in 412×915 / 390×844 phone viewports:

- all three load with no external references beyond the Google Fonts stylesheet;
- the seeded library (8 books, 7 examples) appears and a book paginates (13 pages);
- the PDF button reads *“Interior PDF”* on desktop and *“Interior PDF (needs a desktop)”* on
  the phones;
- the EPUB export produces a valid archive (19 entries, `mimetype` first and uncompressed,
  OPF, nav and NCX present) from the single-file build.

### Before you ship a native app

These files are the web layer. To put them in an app store, wrap one with Capacitor
(`npx cap add android` / `ios`, then copy the built file into the web root). Two things to
change for a native container: file saving must go through a native file plugin rather than
the share sheet, and storage should move from IndexedDB to SQLite — a webview's storage can
be cleared by the operating system.

---

## For the curious: how it is built

React and TypeScript on Vite. The editor is TipTap (ProseMirror). Storage is IndexedDB
through Dexie. Markdown is handled by marked, Word import by mammoth, EPUB packaging by
JSZip. ZIP and Word export are written directly, without a library.

The manuscript is a single structured JSON document — blocks of parts, chapters, scenes,
with each scene as an ordered list of paragraphs, headings, quotes and so on. The editor,
the print layout, the cover sizing, the EPUB and the exports all read that one document.
There is no second copy to keep in step, which is why changing a sentence changes the page
count, the spine width and the ebook in one go.

`SPEC.md` describes the data model in detail; `scripts/` holds the automated checks used
during development (layout overflow audit, PDF page-count and text checks, smoke tests).

---

## A quick first run

1. Accept the freeware licence (**Yes — open The Writers Companion**).
2. Open the sample book's cover.
3. On **Write**, drag *Chapter One* above the part and watch the numbering change.
4. Type a line with `"quotes" -- and an ellipsis...` and see it fix itself.
5. Highlight a word, pick a face and a size next to **B I U**, then type after the caret
   — only that run changes.
6. Open the **Picture** tab, add an image on **Below text**, drag Colour toward 0, then
   switch to **Edit**: the picture is still under the words, in the same place.
7. Glance at the bottom bar: typical pages for this family on the left, word count on
   the right.
8. Open **Print layout**, change the trim to 5.5 × 8.5, and watch the page count move.
9. Turn on *Drop cap*, set the ornament to *Fleuron*, and check *Include chapter-opening
   pages* under Page graphics with a vignette at 40% visibility.
10. Press **Interior PDF**, save, and open it. It is your book, as a book.
