import type { Asset, Project } from '../model/types'
import { coverGeometry, coverStyle, wrapLines, type CoverGeometry } from './geometry'

export function CoverWrap({ project, pageCount, assets, guides, forPrint, scale = 1, showBarcode = true }: {
  project: Project
  pageCount: number
  assets: Asset[]
  guides?: boolean
  forPrint?: boolean
  scale?: number
  showBarcode?: boolean
}) {
  const c = project.settings.cover
  const g = coverGeometry(project, pageCount, forPrint ? project.settings.bleed : project.settings.bleed)
  const { meta } = project
  const frontImg = c.coverImageId ? assets.find((a) => a.id === c.coverImageId)?.dataUrl : undefined
  const backImg = c.backImageId ? assets.find((a) => a.id === c.backImageId)?.dataUrl : undefined
  const titleLines = wrapLines(meta.title, 16)
  const spineTitle = meta.title.length > 34 ? meta.title.slice(0, 32) + '…' : meta.title
  const showSpineText = c.spineText && g.spine >= 0.25

  const titleFont = c.titleSize / 100 * 0.8
  const authorFont = c.authorSize / 100 * 0.6

  return (
    <div
      className={`cover-wrap layout-${c.layout}`}
      style={{
        ...coverStyle(c),
        width: `${g.wrapW}in`,
        height: `${g.wrapH}in`,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        padding: `${g.bleed}in`,
        boxSizing: 'border-box',
        display: 'grid',
        gridTemplateColumns: `${g.trimW}in ${g.spine}in ${g.trimW}in`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* bleed background */}
      <div className="cw-bg" style={{ background: c.background }} />

      {/* BACK */}
      <div className="cw-panel cw-back" style={{ backgroundImage: backImg ? `url(${backImg})` : undefined }}>
        {c.layout === 'frame' && <div className="cw-frame" />}
        <div className="cw-back-inner">
          {c.backText && (
            <div className="cw-backtext" style={{ fontSize: `${authorFont * 0.62}in` }}>
              {c.backText.split(/\n\s*\n/).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          )}
          {c.publisherLogoText && <div className="cw-pub" style={{ fontSize: `${authorFont * 0.5}in` }}>{c.publisherLogoText}</div>}
        </div>
        {showBarcode && (
          <div className="cw-barcode" style={{ width: `${g.barcodeW}in`, height: `${g.barcodeH}in` }}>
            <div className="cw-barcode-box">
              <div className="cw-barcode-lines" />
              <span>ISBN</span>
            </div>
          </div>
        )}
      </div>

      {/* SPINE */}
      <div className="cw-spine">
        <div className="cw-spine-text" style={{ fontSize: `${Math.max(9, Math.min(16, g.spine * 26))}px` }}>
          {showSpineText ? (
            <>
              <span className="cw-spine-title">{spineTitle}</span>
              <span className="cw-spine-author">{meta.author}</span>
            </>
          ) : null}
        </div>
      </div>

      {/* FRONT */}
      <div className="cw-panel cw-front" style={{ backgroundImage: frontImg ? `url(${frontImg})` : undefined }}>
        {c.layout === 'band' && <div className="cw-band" style={{ height: `${(titleFont * titleLines.length * 1.4 + 0.9).toFixed(2)}in` }} />}
        {c.layout === 'frame' && <div className="cw-frame" />}
        <div className="cw-front-inner">
          {c.layout === 'minimal' && <div className="cw-mini-rule" />}
          <h1 className="cw-title" style={{ fontSize: `${titleFont}in`, lineHeight: 1.08 }}>
            {titleLines.map((l, i) => <span key={i}>{l}<br /></span>)}
          </h1>
          {meta.subtitle && <p className="cw-sub" style={{ fontSize: `${authorFont * 0.78}in` }}>{meta.subtitle}</p>}
          {c.layout !== 'minimal' && <div className="cw-rule" />}
          <p className="cw-author" style={{ fontSize: `${authorFont}in` }}>{meta.author}</p>
        </div>
      </div>

      {guides && <CoverGuides g={g} project={project} />}
    </div>
  )
}

function CoverGuides({ g, project }: { g: CoverGeometry; project: Project }) {
  const b = g.bleed
  return (
    <>
      <div className="cg-trim" style={{ left: `${b}in`, top: `${b}in`, width: `${g.wrapW - 2 * b}in`, height: `${g.wrapH - 2 * b}in` }} />
      <div className="cg-spine" style={{ left: `${b + g.trimW}in`, top: `${b}in`, width: `${g.spine}in`, height: `${g.trimH}in` }} />
      <div className="cg-safe" style={{ left: `${b + g.safe}in`, top: `${b + g.safe}in`, width: `${g.wrapW - 2 * b - 2 * g.safe}in`, height: `${g.trimH - 2 * g.safe}in` }} />
      <div className="cg-label" style={{ left: `${b + g.trimW / 2}in`, top: `${b + 0.15}in` }}>BACK · {project.settings.trim.width}″</div>
      <div className="cg-label" style={{ left: `${b + g.trimW + g.spine / 2}in`, top: `${b + 0.15}in`, transform: 'translateX(-50%)' }}>SPINE {g.spine.toFixed(3)}″</div>
      <div className="cg-label" style={{ left: `${b + g.trimW + g.spine + g.trimW / 2}in`, top: `${b + 0.15}in`, transform: 'translateX(-50%)' }}>FRONT · {project.settings.trim.height}″</div>
      <div className="cg-label" style={{ left: '50%', bottom: '0.04in', transform: 'translateX(-50%)' }}>
        WRAP {g.wrapW.toFixed(3)}″ × {g.wrapH.toFixed(3)}″ · bleed {g.bleed}″
      </div>
    </>
  )
}

/** Ebook cover at digital proportions (1600 × 2560). */
export function EbookCover({ project, assets, width = 400 }: { project: Project; assets: Asset[]; width?: number }) {
  const c = project.settings.cover
  const { meta } = project
  const frontImg = c.coverImageId ? assets.find((a) => a.id === c.coverImageId)?.dataUrl : undefined
  const titleLines = wrapLines(meta.title, 16)
  const height = Math.round((width * 2560) / 1600)
  return (
    <div
      className={`ebook-cover layout-${c.layout}`}
      style={{ ...coverStyle(c), width, height, backgroundImage: frontImg ? `url(${frontImg})` : undefined }}
    >
      {c.layout === 'band' && <div className="eb-band" />}
      {c.layout === 'frame' && <div className="eb-frame" />}
      <div className="eb-inner">
        {c.layout === 'minimal' && <div className="eb-rule" />}
        <h1 style={{ fontSize: width * 0.085 }}>{titleLines.map((l, i) => <span key={i}>{l}<br /></span>)}</h1>
        {meta.subtitle && <p className="eb-sub" style={{ fontSize: width * 0.032 }}>{meta.subtitle}</p>}
        {c.layout !== 'minimal' && <div className="eb-line" />}
        <p className="eb-author" style={{ fontSize: width * 0.038 }}>{meta.author}</p>
      </div>
    </div>
  )
}
