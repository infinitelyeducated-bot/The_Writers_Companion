import JSZip from 'jszip'
import type { BookDoc, PMNode, Project } from '../model/types'
import { gradientFallback } from '../editor/typeMarks'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function runProps(n: PMNode): { pre: string; post: string } {
  const marks = (n.type === 'text' ? n.marks : undefined) || []
  const has = (t: string) => marks.some((m) => m.type === t)
  let pre = ''
  let post = ''
  if (has('bold')) { pre += '<w:b/>'; post = '</w:b>' + post }
  if (has('italic')) { pre += '<w:i/>'; post = '</w:i>' + post }
  if (has('underline')) { pre += '<w:u w:val="single"/>'; post = '</w:u>' + post }
  if (has('strike')) { pre += '<w:strike/>'; post = '</w:strike>' + post }
  if (has('smallCaps')) { pre += '<w:smallCaps/>'; post = '</w:smallCaps>' + post }
  const ff = marks.find((m) => m.type === 'fontFamily')
  if (ff?.attrs?.family) pre += `<w:rFonts w:ascii="${esc(String(ff.attrs.family))}" w:hAnsi="${esc(String(ff.attrs.family))}"/>`
  const fs = marks.find((m) => m.type === 'fontSize')
  if (fs?.attrs?.size) {
    const half = Math.round(Number(fs.attrs.size) * 2)
    pre += `<w:sz w:val="${half}"/><w:szCs w:val="${half}"/>`
  }
  const tp = marks.find((m) => m.type === 'textPaint')
  const ink = (tp?.attrs?.gradient ? gradientFallback(String(tp.attrs.gradient)) : null) || (tp?.attrs?.color ? String(tp.attrs.color) : null)
  if (ink) {
    const hex = ink.replace('#', '')
    if (/^[0-9a-fA-F]{6}$/.test(hex)) pre += `<w:color w:val="${hex}"/>`
  }
  void post
  return { pre: pre ? `<w:rPr>${pre}</w:rPr>` : '', post: '' }
}

function runs(nodes: PMNode[] | undefined): string {
  if (!nodes) return ''
  let out = ''
  for (const n of nodes) {
    if (n.type === 'text') {
      const { pre } = runProps(n)
      out += `<w:r>${pre}<w:t xml:space="preserve">${esc(n.text)}</w:t></w:r>`
    } else if (n.type === 'hardBreak') {
      out += '<w:r><w:br/></w:r>'
    } else if (n.type === 'footnoteRef') {
      out += '<w:r><w:rPr><w:vertAlign w:val="superscript"/></w:rPr><w:footnoteReference w:id="1"/></w:r>'
    }
  }
  return out
}

const P = (text: string, style?: string) =>
  `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}<w:r><w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`

const kids = (n: unknown): PMNode[] => (('content' in (n as object)) ? ((n as { content?: PMNode[] }).content || []) : [])

function bodyXml(doc: BookDoc): string {
  const out: string[] = []
  for (const block of doc.blocks) {
    if (block.type === 'chapter') {
      out.push(P(block.title || 'Chapter', 'Heading1'))
    } else {
      out.push(P(block.title, block.type === 'part' ? 'Heading1' : 'Heading1'))
    }
    for (const sid of block.sceneIds) {
      const nodes = doc.scenes[sid] || []
      let first = true
      for (const n of nodes) {
        if (n.type === 'paragraph') {
          const pPr = first ? '' : '<w:pPr><w:ind w:firstLine="360"/></w:pPr>'
          out.push(`<w:p>${pPr}${runs(n.content)}</w:p>`)
          first = false
        } else if (n.type === 'heading') {
          out.push(P(plain(n.content), n.attrs.level === 2 ? 'Heading2' : 'Heading3'))
          first = false
        } else if (n.type === 'blockquote') {
          for (const c of n.content || []) {
            if (c.type === 'paragraph') out.push(`<w:p><w:pPr><w:pStyle w:val="Quote"/></w:pPr>${runs(c.content)}</w:p>`)
          }
          if (n.attrs?.attribution) out.push(P(n.attrs.attribution, 'Quote'))
          first = false
        } else if (n.type === 'bulletList' || n.type === 'orderedList') {
          for (const li of n.content || []) {
            const txt = (kids(li)).map((p) => runs(kids(p))).join('')
            out.push(`<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:ind w:left="720" w:hanging="360"/></w:pPr>${txt}</w:p>`)
          }
          first = false
        } else if (n.type === 'sceneBreak' || n.type === 'horizontalRule') {
          out.push(P('* * *', 'SceneBreak'))
          first = true
        } else if (n.type === 'image') {
          out.push(`<w:p><w:r><w:t>[image: ${esc(n.attrs.caption || n.attrs.alt || '')}]</w:t></w:r></w:p>`)
          first = true
        }
      }
    }
  }
  return out.join('')
}

const plain = (nodes: PMNode[] | undefined): string =>
  (nodes || []).map((n) => (n.type === 'text' ? n.text : '')).join('')

export async function exportDocx(project: Project): Promise<Blob> {
  const zip = new JSZip()
  const { meta } = project
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`,
  )
  zip.file(
    '_rels/.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
  )
  zip.file(
    'word/_rels/document.xml.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
  )
  const sect = `<w:sectPr><w:pgSz w:w="${Math.round(project.settings.trim.width * 1440)}" w:h="${Math.round(project.settings.trim.height * 1440)}"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>`
  zip.file(
    'word/document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${bodyXml(project.doc)}${sect}</w:body></w:document>`,
  )
  const h1 = (size: number) =>
    `<w:style w:type="paragraph" w:styleId="Heading${size}"><w:name w:val="heading ${size}"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="${size === 1 ? 360 : 240}" w:after="${size === 1 ? 240 : 120}"/><w:jc w:val="center"/><w:outlineLvl w:val="${size - 1}"/></w:pPr><w:rPr><w:b/><w:sz w:val="${size === 1 ? 36 : size === 2 ? 28 : 24}"/></w:rPr></w:style>`
  zip.file(
    'word/styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia"/><w:sz w:val="23"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="288" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
${h1(1)}${h1(2)}${h1(3)}
<w:style w:type="paragraph" w:styleId="Quote"><w:name w:val="Quote"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="720" w:right="720"/><w:spacing w:before="120" w:after="120"/></w:pPr><w:rPr><w:i/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="SceneBreak"><w:name w:val="Scene Break"/><w:basedOn w:val="Normal"/><w:pPr><w:jc w:val="center"/><w:spacing w:before="240" w:after="240"/></w:pPr></w:style>
<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/></w:style>
</w:styles>`,
  )
  const now = new Date().toISOString()
  zip.file(
    'docProps/core.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>${esc(meta.title)}</dc:title><dc:creator>${esc(meta.author)}</dc:creator><dc:language>${esc(meta.language)}</dc:language><cp:lastModifiedBy>The Writers Companion</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`,
  )
  zip.file(
    'docProps/app.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>The Writers Companion</Application></Properties>`,
  )
  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
}
