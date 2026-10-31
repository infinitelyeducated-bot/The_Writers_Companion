# The Writers Companion — Spec

A local-first book production app: organise a manuscript, write it, and derive a
print interior PDF, a print cover PDF, an ebook cover, and an EPUB 3 from **one**
structured JSON manuscript.

No login. No server. Data lives in IndexedDB (Dexie). PDF/EPUB are produced in the
browser.

---

## 1. Principles

1. **One source of truth.** `BookDoc` (structured JSON, ProseMirror-style nodes) is the
   only manuscript representation. Editor, DOCX/MD import & export, print interior,
   TOC page numbers, footnotes/endnotes, cover text, and EPUB all read/derive from it.
2. **Derived, never stored twice.** Word counts, TOC page numbers, pagination, spine
   width, and readiness checks are computed. Only the *last successful pagination
   result* is cached (so cover/TOC can be sized without re-paginating).
3. **Print = the same renderer as preview.** The print preview renders the exact page
   boxes (fixed page size, mirrored margins, running heads, folios) that the print
   stylesheet emits to PDF via Chrome print-to-PDF. No second layout engine.
4. **Images are binary in IndexedDB**, referenced by `imageId`, exported as separate
   files (EPUB `OEBPS/images`, DOCX media).
5. **Everything reversible.** Autosave + snapshot history with restore, plus JSON
   project backup/restore.

---

## 2. Data model

```
Project  (library card + all settings)
 ├ id, meta{title, subtitle, author, language, genre, notes, isbn, publisher, copyrightYear}
 ├ settings{trim, margins, typography, runningHeads, folios, chapterOpening, ornaments, dropCap,
 │           footnotes:'page'|'end', toc{enabled, depth}, bleed, cover{...}, epub{...}}
 ├ doc: BookDoc                         ← single source of truth
 ├ snapshots[] (id, projectId, label, createdAt, wordCount, doc)   [separate table]
 └ assets[]    (id, projectId, name, mime, dataUrl, w, h, bytes)  [separate table]

BookDoc
 ├ blocks: Block[]         ordered: front matter, parts, chapters, back matter
 └ scenes: { [chapterId]: Block[] }   ← nested scene/section blocks per chapter

Block (discriminated union)
 ├ { type:'frontmatter'|'backmatter', id, kind: FrontKind|BackKind, title, sceneId }
 ├ { type:'part', id, title, sceneId }        sceneId → opening prose for the part page
 └ { type:'chapter', id, title, sceneId, kind?: 'scene' }  (kind 'scene' = flat scene, no heading)
```

* **Front/back matter kinds:** titlepage, copyright, dedication, epigraph, foreword,
  preface, introduction, acknowledgments, aboutAuthor, alsoBy, appendix, glossary,
  bibliography, endnotes (auto), afterword.
* **Chapter contents:** an ordered list of scene/section blocks
  `{ type:'heading'|'paragraph'|'blockquote'|'bulletList'|'orderedList'|'image'|'sceneBreak'|'footnoteBlock' }`.
  Headings inside a chapter carry `level: 2|3`.
* Footnote markers inside paragraphs are inline `{ type:'footnote', id, text }`; the
  page/endnote renderer collects them.

### Word counting
`countWords(doc)` — counts words in all prose nodes; scene-break / image nodes count 0.

### Snapshot policy
Autosave debounces 600 ms to IndexedDB. A snapshot is taken automatically on the first
save of a session and every 10 minutes of editing (max 50, oldest pruned), and manually
on demand with a label.

---

## 3. Editor

TipTap (ProseMirror) with book-appropriate schema: paragraph, h2/h3 (section headings),
blockquote, bullet/ordered lists, images, horizontal rule = scene break (`* * *`),
footnote marker node. Chapter title is edited outside the doc (heading field).

* **Smart typography input rules**: `"..."`→curly quotes, `--`→en dash, `---`→em dash,
  `...`→ellipsis. Also available as a one-shot "Typographise selection/doc" command.
* **First-line indent**: CSS `text-indent: 1.5em` on body paragraphs, suppressed after
  headings, images, block quotes, lists, scene breaks and at chapter starts — in the
  editor and identically in print.
* Live word count for chapter and book (status bar).

## 4. Import / export (manuscript)

* **.docx** → mammoth → HTML → normalise: Heading 1 = chapter/part boundary, Heading 2/3 =
  section headings; paragraphs joined when a previous line ends without terminal
  punctuation *and* is short (line-break-broken paragraph repair); smart punctuation
  applied.
* **.md / .txt** → marked (md) or plain text (txt); `#` = part/chapter, `##`/`###` =
  sections; blank-line-separated blocks. Same repair pass for .txt.
* **Export .docx** (hand-built OOXML, minimal but valid), **.md** (serialise structure).

## 5. Print layout

* Trim: 5×8, 5.25×8, 5.5×8.5, 6×9, 7×10, 8.5×11, custom (inches).
* Mirrored margins: top, bottom, inside (gutter added), outside. Gutter auto-widens by
  page count (KDP: 24 pp→0.375", 150→0.5", 300→0.625", 500→0.75", 700→0.875", 828→1").
* Running heads: verso = book title, recto = part/chapter title; suppressed on chapter
  openings, part pages, front matter, back matter (configurable).
* Folios: roman numerals in front matter (starting after title/copyright page), arabic
  restarting at 1 for the first chapter; suppressed on openings and part pages.
* Chapter openings on recto: insert a blank page when needed. Blank pages get no header
  or folio. Part pages likewise.
* Optional chapter ornaments (⁂ ❦ ✦ etc.), drop caps, small-caps first line.
* **TOC** auto-generated with page numbers from the pagination result (leader dots).
* **Footnotes** at page bottom (measured and pulled into the page box) or **endnotes**
  collected at the back under an auto "Notes" section.
* Pagination engine: deterministic measurement — blocks are rendered into a fixed-width
  measuring column, heights accumulated against the page text height, splitting at
  paragraph boundaries (line-level splitting for long paragraphs).
* **PDF**: dedicated print route renders page-per-div with `@page{size:trim;margin:0}`
  and Chrome print-to-PDF (background graphics on, no headers/footers). Optional crop
  marks / bleed.
* **KDP readiness check**: gutter vs page count, margins vs min, bleed consistency,
  embedded image DPI (w/h vs placed width at 300 ppi), font embedding note, empty
  chapters, TOC freshness.

## 6. Cover

Full wrap: `width = bleed + (2×trimW) + spine + bleed`, `height = bleed + trimH + bleed`.
Spine = `pages × paperPpi` (KDP white 0.002252"/page; cream 0.0025"), min 0.06".
Back | spine | front laid out in a CSS grid with exact column widths; safe-area guides.
Exports: print cover PDF (with 0.125" bleed by default, optional guides hidden) and
ebook cover JPG/PNG at 1600×2560 ratio (front only).

## 7. EPUB 3

JSZip-built: `mimetype` (stored), `META-INF/container.xml`, `OEBPS/content.opf`
(metadata, dc:*, cover-image, nav), `nav.xhtml` + `toc.ncx`, one XHTML per chapter/scene
document, images, endnotes.xhtml with backlinks, cover.xhtml. XHTML serialised with
valid namespaces and escaping. Designed to pass EPUBCheck.

---

## 8. Build slices

1. Library + tree + editor + autosave + snapshots  ✅
2. Import/export DOCX & MD
3. Pagination + print preview + interior PDF + KDP check
4. Cover designer + cover PDFs
5. EPUB 3 export
