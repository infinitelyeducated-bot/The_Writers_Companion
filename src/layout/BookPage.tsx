import type { Block, PMNode, Project } from '../model/types'
import type { Page, PaginationResult } from './paginate'
import { inlineHtml } from './paginate'
import { chapterNumberLabel, partNumberLabel } from '../model/docUtils'
import { artForPage, cssGradient, emptyPageArt } from '../pageArt'
import { PageArtAbove, PageArtBackdrop } from '../ui/PageArtLayers'

// ─────────────────────────────────────────────────────────────────────────────
// Book page renderer. The same component tree is used for the on-screen print
// preview and for the print stylesheet that Chrome turns into the interior PDF.
// ─────────────────────────────────────────────────────────────────────────────

export function pageBoxStyle(project: Project, pagination: PaginationResult, page: Page): React.CSSProperties {
  const { settings } = project
  const typ = settings.typography
  const inset = {
    top: settings.margins.top,
    bottom: settings.margins.bottom,
    inside: settings.margins.inside + pagination.gutter,
    outside: settings.margins.outside,
  }
  return {
    width: `${settings.trim.width}in`,
    height: `${settings.trim.height}in`,
    paddingTop: `${inset.top}in`,
    paddingBottom: `${inset.bottom}in`,
    paddingLeft: `${page.side === 'recto' ? inset.inside : inset.outside}in`,
    paddingRight: `${page.side === 'recto' ? inset.outside : inset.inside}in`,
    fontFamily: `'${typ.fontFamily}', 'Noto Sans Symbols 2', Georgia, 'Times New Roman', serif`,
    fontSize: `${typ.fontSize}pt`,
    lineHeight: typ.lineHeight,
    textAlign: typ.justify ? 'justify' : 'left',
    hyphens: typ.hyphenate ? 'auto' : 'manual',
  }
}

export const ROMAN = (n: number) => {
  const map: [number, string][] = [
    [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'],
    [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i'],
  ]
  let out = ''
  let v = n
  for (const [num, sym] of map) {
    while (v >= num) { out += sym; v -= num }
  }
  return out
}

export function folioLabel(page: Page): string {
  if (page.folio == null) return ''
  return page.folioType === 'roman' ? ROMAN(page.folio) : String(page.folio)
}

export interface PageRenderProps {
  page: Page
  project: Project
  pagination: PaginationResult
  /** render guides (margins, bleed) — never printed */
  guides?: boolean
  /** scale for preview */
  scale?: number
  className?: string
  assets?: Record<string, string>
}

export function BookPage({ page, project, pagination, guides, scale = 1, className = '', assets }: PageRenderProps) {
  const { settings } = project
  const typ = settings.typography
  const style: React.CSSProperties = { ...pageBoxStyle(project, pagination, page), transform: scale !== 1 ? `scale(${scale})` : undefined }

  const block = page.blockId ? project.doc.blocks.find((b) => b.id === page.blockId) : undefined
  const gfx = page.graphic
  const gset = settings.graphics
  // A sidebar narrows the text column; the graphic sits in the freed column on
  // the outside edge unless the book asks for a fixed side.
  const sidebarFraction = gfx?.mode === 'sidebar' ? gset.sidebarWidth : 0
  const textWidth = settings.trim.width - settings.margins.inside - settings.margins.outside - pagination.gutter
  const sidebarIn = textWidth * sidebarFraction
  // 'alternate' puts the bar in the outside margin on every page (it always sits
  // on the outer edge as the reader turns pages).
  const sidebarAtInside = gfx?.mode === 'sidebar' && gset.sidebarSide === 'inside'
  const insetInside = settings.margins.inside + pagination.gutter
  const insetOutside = settings.margins.outside
  const headerText = page.header.show ? (page.side === 'recto' ? page.header.recto : page.header.verso) : ''
  const folio = folioLabel(page)
  // anchors come from THIS pagination, so art follows its text even before
  // the new layout has been saved back to the project
  const artMap = project.settings.pageArt || {}
  const keys = pagination.anchors
  const art =
    (project.settings.pageArtAllKey ? artMap[project.settings.pageArtAllKey] : artForPage(artMap, page.index, keys)) ||
    emptyPageArt()

  return (
    <div className={`book-page-shell`} style={{ width: `${settings.trim.width}in`, height: `${settings.trim.height}in`, transform: style.transform, transformOrigin: 'top left', overflow: 'hidden' }}>
    <div className={`book-page layout-${settings.layout || 'trade'} ${page.side} ptype-${page.type} ${className}`} style={{ ...style, transform: undefined, background: art.gradient?.stops.length ? cssGradient(art.gradient) : undefined }} data-page={page.index}>
      <PageArtBackdrop art={art} srcs={assets || {}} idPrefix={'pg-' + page.index} includeAbove={false} />
      {guides && (
        <>
          <div className="guide-margin" />
          <div className="guide-bleed" />
          <div className="guide-baseline" />
        </>
      )}
      {page.type === 'blank' && <div className="blank-page" />}

      {page.type === 'title' && <TitlePage project={project} />}
      {page.type === 'copyright' && <CopyrightPage project={project} />}

      {page.type === 'toc' && (
        <div className="toc-page">
          <h1 className="toc-head">{page.isChapterOpen ? 'Contents' : '\u00a0'}</h1>
          {page.tocEntries && (
            <div className="toc-lines">
              {page.tocEntries.map((t, i) => (
                <TocRow key={i} title={t.title} level={t.level} pageNo={t.pageNo} leaderDots={settings.toc.leaderDots} />
              ))}
            </div>
          )}
        </div>
      )}

      {headerText && (
        <div className={`run-head ${page.side}`} data-head="running" style={{ top: `${settings.margins.top / 2}in`, textTransform: settings.runningHeads.smallCaps ? 'uppercase' : undefined, letterSpacing: settings.runningHeads.smallCaps ? '0.08em' : undefined, fontSize: `${Math.max(7.5, typ.fontSize - 2.5)}pt` }}>
          {headerText}
        </div>
      )}

      {gfx?.mode === 'vignette' && (
        <div
          className={`page-vignette ${gset.vignettePosition} ${gset.vignetteAlign}`}
          style={{
            height: `${gfx.heightIn}in`,
            width: `${gfx.widthIn}in`,
            opacity: gfx.opacity,
            top: gset.vignettePosition === 'top' ? `${settings.margins.top * 0.35}in` : undefined,
            bottom: gset.vignettePosition === 'bottom' ? `${settings.margins.bottom * 0.32}in` : undefined,
            left: gset.vignetteAlign === 'inside' ? `${(page.side === 'recto' ? insetInside : insetOutside)}in` : undefined,
            right: gset.vignetteAlign === 'inside' ? `${(page.side === 'recto' ? insetOutside : insetInside)}in` : undefined,
            ...(gset.vignetteAlign === 'center' ? { left: '50%', transform: 'translateX(-50%)' } : {}),
            ...(gset.vignetteAlign === 'outside'
              ? page.side === 'recto'
                ? { right: `${insetOutside}in` }
                : { left: `${insetOutside}in` }
              : {}),
          }}
        >
          <img src={gfx.src} alt="" />
        </div>
      )}

      {gfx?.mode === 'sidebar' && (
        <div
          className={'page-sidebar' + (gfx.frame ? ' framed' : '')}
          data-opacity={gfx.opacity}
          style={{
            width: `${sidebarIn}in`,
            top: `${settings.margins.top}in`,
            height: `${settings.trim.height - settings.margins.top - settings.margins.bottom}in`,
            opacity: gfx.opacity,
            ...(sidebarAtInside
              ? page.side === 'recto'
                ? { left: `${insetInside}in` }
                : { right: `${insetOutside}in` }
              : page.side === 'recto'
                ? { right: `${insetOutside}in` }
                : { left: `${insetOutside}in` }),
          }}
        >
          <img src={gfx.src} alt="" />
        </div>
      )}

      {gset.border !== 'none' && page.type !== 'blank' && page.type !== 'plate' && (
        <div className={`page-border ${gset.border}`} aria-hidden="true">
          {gset.border === 'ornament' && <span className="pb-orn">❦</span>}
        </div>
      )}

      {page.type === 'plate' && page.plate && (
        <div className="plate-page">
          <img src={page.plate.src} alt="" />
          {page.plate.caption && <p className="plate-caption">{page.plate.caption}</p>}
        </div>
      )}

      <div
        className="page-body"
        style={{
          zIndex: 5,
          ...(gfx?.mode === 'sidebar'
            ? sidebarAtInside
              ? page.side === 'recto'
                ? { paddingLeft: `${sidebarIn + 0.12}in` }
                : { paddingRight: `${sidebarIn + 0.12}in` }
              : page.side === 'recto'
                ? { paddingRight: `${sidebarIn + 0.12}in` }
                : { paddingLeft: `${sidebarIn + 0.12}in` }
            : {}),
        }}
      >
        {page.isChapterOpen && (page.type === 'chapter' || page.type === 'part') && block && (
          <OpeningChrome block={block} project={project} isPart={page.type === 'part'} />
        )}
        {page.isChapterOpen && (page.type === 'front' || page.type === 'back' || page.type === 'endnotes') && block && (
          <div className="open-chrome matter-open">
            <h1>{block.title}</h1>
            {settings.chapterOpening.ornament !== 'none' && <div className="orn">{ornamentChar(settings.chapterOpening.ornament)}</div>}
          </div>
        )}
        {page.type !== 'toc' && page.items.map((it, i) => (
          <FlowItemView key={i} item={it} first={!!it.first} project={project} page={page} isFirstOnPage={i === 0} />
        ))}
      </div>

      <PageArtAbove art={art} srcs={assets || {}} idPrefix={'pg-' + page.index} />

      {page.showFolio && settings.folios.enabled && folio && (
        <div
          className={`folio ${settings.folios.position} ${page.side}`}
          data-head="folio"
          style={{ bottom: `${settings.margins.bottom / 2.4}in`, top: settings.folios.position === 'topOutside' ? `${settings.margins.top / 2}in` : undefined, fontSize: `${typ.fontSize - 2}pt` }}
        >
          {folio}
        </div>
      )}
    </div>
    </div>
  )
}

function ornamentChar(o: string) {
  return { asterism: '⁂', fleuron: '❦', diamond: '◆', rule: '———', none: '' }[o] || ''
}

function OpeningChrome({ block, project, isPart }: { block: Block; project: Project; isPart: boolean }) {
  const { settings } = project
  const num = isPart ? partNumberLabel(project.doc, block) : chapterNumberLabel(project.doc, block)
  const showNum = settings.chapterOpening.chapterNumbers !== 'none' && num
  return (
    <div className={`open-chrome ${isPart ? 'part-open' : ''}`}>
      {showNum && (
        <div className="open-label">
          {isPart ? 'Part ' : settings.chapterOpening.chapterNumbers === 'words' ? 'Chapter ' : 'Chapter '}
          {settings.chapterOpening.chapterNumbers === 'words' ? wordNum(Number(num) || 0) : num}
        </div>
      )}
      <h1 className="open-title">{block.title}</h1>
      {settings.chapterOpening.ornament !== 'none' && <div className="orn">{ornamentChar(settings.chapterOpening.ornament)}</div>}
    </div>
  )
}

const WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty', 'Twenty-One', 'Twenty-Two', 'Twenty-Three', 'Twenty-Four', 'Twenty-Five']
export const wordNum = (n: number) => WORDS[n] || String(n)

function TocRow({ title, level, pageNo, leaderDots }: { title: string; level: 1 | 2; pageNo: string; leaderDots: boolean }) {
  return (
    <div className={'toc-row' + (level === 2 ? ' lvl2' : '')}>
      <span className="toc-t2">{title}</span>
      {leaderDots && <span className="toc-fill" aria-hidden="true" />}
      <span className="toc-p2">{pageNo}</span>
    </div>
  )
}

function TitlePage({ project }: { project: Project }) {
  const { meta } = project
  return (
    <div className="title-page">
      <div className="tp-top">
        <h1 className="tp-title">{meta.title}</h1>
        {meta.subtitle && <p className="tp-sub">{meta.subtitle}</p>}
      </div>
      <div className="tp-bottom">
        <div className="tp-rule" />
        <p className="tp-author">{meta.author}</p>
        {meta.publisher && <p className="tp-pub">{meta.publisher}</p>}
      </div>
    </div>
  )
}

const THIS_YEAR = new Date().getFullYear()

function CopyrightPage({ project }: { project: Project }) {
  const { meta } = project
  return (
    <div className="copyright-page">
      <p className="cp-title">{meta.title}</p>
      {meta.subtitle && <p>{meta.subtitle}</p>}
      <p>Copyright © {meta.copyrightYear || THIS_YEAR} by {meta.author}</p>
      <p>All rights reserved. No part of this book may be reproduced in any form without written permission from the author, except brief quotations in a review.</p>
      <p>This is a work of fiction. Names, characters, places, and incidents are products of the author’s imagination or are used fictitiously.</p>
      {meta.isbn && <p>ISBN {meta.isbn}</p>}
      {meta.publisher && <p>Published by {meta.publisher}</p>}
      <p className="cp-small">First edition, {meta.copyrightYear || THIS_YEAR}.</p>
    </div>
  )
}

function FlowItemView({ item, first, project, page, isFirstOnPage }: { item: { kind: string; html?: string; imgSrc?: string; imgW?: number }; first: boolean; project: Project; page: Page; isFirstOnPage: boolean }) {
  const typ = project.settings.typography
  const isEmpty = !item.html || !String(item.html).trim()
  const pStyle: React.CSSProperties = {
    textIndent: first || isEmpty ? 0 : `${typ.firstLineIndent}em`,
    margin: `0 0 ${typ.paragraphSpacing}em`,
  }
  switch (item.kind) {
    case 'p': {
      const scFirst = isFirstOnPage && page.isChapterOpen && project.settings.chapterOpening.smallCapsFirstLine && first
      const drop = isFirstOnPage && page.isChapterOpen && project.settings.chapterOpening.dropCap && first
      const cls = [drop ? 'dropcap' : '', scFirst ? 'sc-first' : ''].filter(Boolean).join(' ')
      return <p style={pStyle} className={cls || undefined} dangerouslySetInnerHTML={{ __html: item.html || '' }} />
    }
    case 'h2':
      return <h2 className="sec-h2" dangerouslySetInnerHTML={{ __html: item.html || '' }} />
    case 'h3':
      return <h3 className="sec-h3" dangerouslySetInnerHTML={{ __html: item.html || '' }} />
    case 'bq':
      return <blockquote className="bq" dangerouslySetInnerHTML={{ __html: item.html || '' }} />
    case 'bq-attr':
      return <p className="bq-attr" dangerouslySetInnerHTML={{ __html: item.html || '' }} />
    case 'ul':
      return <ul dangerouslySetInnerHTML={{ __html: item.html || '' }} />
    case 'ol':
      return <ol dangerouslySetInnerHTML={{ __html: item.html || '' }} />
    case 'break':
      return <div className="sb">{ornamentChar(project.settings.chapterOpening.ornament) || '❦'}</div>
    case 'img':
      return (
        <figure className="img">
          {item.imgSrc ? <img src={item.imgSrc} alt="" style={{ width: `${item.imgW || 100}%` }} /> : <div className="img-ph" style={{ width: `${item.imgW || 100}%` }} />}
          {item.html && <figcaption dangerouslySetInnerHTML={{ __html: item.html }} />}
        </figure>
      )
    case 'fn-note':
      return (
        <div className="page-fn">
          <div className="fn-body" dangerouslySetInnerHTML={{ __html: item.html || '' }} />
        </div>
      )
    default:
      return null
  }
}

/** Render a scene's flow items to HTML (for measurement / fallback). */
export function flowToHtml(nodes: PMNode[], project: Project): string {
  const fnNums = new Map<string, number>()
  let n = 0
  const walk = (ns: PMNode[]) => {
    for (const node of ns) {
      if (node.type === 'footnoteRef' && !fnNums.has(node.attrs.id)) fnNums.set(node.attrs.id, ++n)
      else if ('content' in node && node.content) walk(node.content as PMNode[])
    }
  }
  walk(nodes)
  void project
  return inlineHtml(nodes, fnNums)
}
