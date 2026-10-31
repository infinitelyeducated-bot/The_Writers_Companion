# The Writers Companion type catalog

Print → Font and Cover → Typeface now share one catalog (`src/fonts/catalog.ts`).
Faces load from Google Fonts **when you pick them**, so the 1.38 MB single-file
build does not grow. The service worker caches each family the first time it is
used (up to 240 files, one year).

**213 unique families** in 11 groups.

| Group | Count | What it is for |
|---|---|---|
| Book text — serif | ~30 | novels, memoirs, academic prose |
| Book text — sans & mono | ~18 | technical manuals, screenplays |
| Display & cover | ~16 | titles, jackets |
| Latin handwriting & script | ~16 | invitations, inscriptions |
| Blackletter, uncial, medieval | ~8 | Gothic, Carolingian flavour |
| Ancient Near East & Egypt | 30 | hieroglyphs, cuneiform, Coptic, Phoenician, Avestan, … |
| Aegean, Anatolia, early Europe | 14 | Linear A/B, runes, Ogham, Gothic, Glagolitic, Etruscan |
| Indic & Central Asian historical | 28 | Brahmi, Kharoshthi, Grantha, Phags-pa, Tifinagh, … |
| East Asian historical & symbols | 18 | Tangut, Nüshu, Yi, music, math, Mayan numerals |
| Africa, Americas, constructed | 16 | Adlam, Vai, Bamum, Cherokee, Deseret, Shavian |
| Living world scripts | 19 | Arabic, Hebrew, Devanagari, CJK (large downloads) |

## Dead languages & scripts (the ones you asked for)

These only paint characters that exist in that writing system. Latin prose in
“Noto Sans Egyptian Hieroglyphs” will look like a fallback serif; paste
hieroglyphs (or use a Unicode input method) and they appear.

- **Egypt & Nubia:** Egyptian Hieroglyphs, Anatolian Hieroglyphs, Meroitic, Coptic
- **Mesopotamia:** Cuneiform (Sumerian / Akkadian / Hittite), Old Persian, Ugaritic
- **Anatolia:** Carian, Lycian, Lydian
- **Levant & Iran:** Phoenician, Samaritan, Imperial Aramaic, Nabataean, Palmyrene, Hatran, Elymaic, Avestan, Inscriptional Pahlavi / Parthian, Psalter Pahlavi, Manichaean, Mandaic, Syriac, Chorasmian, Sogdian, Old Sogdian, Yezidi, Old South / North Arabian
- **Aegean:** Linear A, Linear B, Cypriot, Cypro-Minoan
- **Europe:** Old Italic (Etruscan), Gothic, Runic, Ogham, Glagolitic, Elbasan, Caucasian Albanian, Old Permic, Old Hungarian, Old Turkic
- **India & Inner Asia:** Brahmi, Kharoshthi, Grantha, Siddham, Sharada, Zanabazar Square, Soyombo, Marchen, Phags-pa, Old Uyghur, Mongolian, Tibetan
- **East Asia:** Tangut (Xixia), Nüshu, Yi
- **Africa:** Tifinagh, Geʽez / Ethiopic, Adlam, N’Ko, Vai, Bamum, Osmanya, Mende Kikakui
- **Americas & constructed:** Cherokee, Canadian Aboriginal Syllabics, Osage, Deseret, Shavian, Duployan, SignWriting

Google Fonts hosts on the order of **1,900 families**. This catalog is every
Noto historical / minority script that is actually published on fonts.google.com,
plus a working set of Latin book, display and handwriting faces. Adding the rest
of Google Fonts is a line in the catalog, not a rebuild.

## Caveats

- CJK (`Noto Sans JP / KR / SC / TC`) are large. First pick will take a few seconds.
- EPUB still serialises as Georgia-family CSS. A reader without the webfont will
  not show hieroglyphs until we embed the face in the zip (not done in this pass).
- Print-to-PDF embeds whatever Chrome used on the page, so a picked Noto face
  does go into the interior PDF once it has loaded.
