import { cssGradient, emptyPageArt, type PageArt, type PageArtLayer } from '../pageArt'

function needsFilter(layer: PageArtLayer): boolean {
  const r = layer.r ?? 1
  const g = layer.g ?? 1
  const b = layer.b ?? 1
  const c = layer.chroma ?? 1
  return r !== 1 || g !== 1 || b !== 1 || c !== 1
}

export function ChannelFilter({ id, layer }: { id: string; layer: PageArtLayer }) {
  if (!needsFilter(layer)) return null
  const r = layer.r ?? 1
  const g = layer.g ?? 1
  const b = layer.b ?? 1
  const c = layer.chroma ?? 1
  return (
    <svg width="0" height="0" aria-hidden="true" className="page-art-filter">
      <filter id={id} colorInterpolationFilters="sRGB">
        <feColorMatrix type="saturate" values={String(c)} />
        <feColorMatrix type="matrix" values={`${r} 0 0 0 0  0 ${g} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`} />
      </filter>
    </svg>
  )
}

export function PageArtBackdrop({
  art,
  srcs,
  idPrefix,
  className,
  includeAbove = true,
}: {
  art?: PageArt
  srcs: Record<string, string>
  idPrefix: string
  className?: string
  includeAbove?: boolean
}) {
  const a = art || emptyPageArt()
  return (
    <div
      className={'page-art-backdrop' + (className ? ' ' + className : '')}
      style={{ background: a.gradient?.stops.length ? cssGradient(a.gradient) : 'transparent' }}
      aria-hidden="true"
    >
      <ArtLayerImg which="below" layer={a.below} srcs={srcs} idPrefix={idPrefix} />
      <ArtLayerImg which="text" layer={a.text} srcs={srcs} idPrefix={idPrefix} />
      {includeAbove && <ArtLayerImg which="above" layer={a.above} srcs={srcs} idPrefix={idPrefix} />}
    </div>
  )
}

export function PageArtAbove({
  art,
  srcs,
  idPrefix,
}: {
  art?: PageArt
  srcs: Record<string, string>
  idPrefix: string
}) {
  const a = art || emptyPageArt()
  if (!a.above.imageId || !srcs[a.above.imageId]) return null
  return (
    <div className="page-art-above" aria-hidden="true">
      <ArtLayerImg which="above" layer={a.above} srcs={srcs} idPrefix={idPrefix + '-over'} />
    </div>
  )
}

function ArtLayerImg({
  which,
  layer,
  srcs,
  idPrefix,
}: {
  which: string
  layer: PageArtLayer
  srcs: Record<string, string>
  idPrefix: string
}) {
  const src = layer.imageId ? srcs[layer.imageId] : undefined
  if (!src) return null
  const fid = `${idPrefix}-${which}`
  const filter = needsFilter(layer)
  const stretch = layer.fit === 'stretch'
  return (
    <>
      <ChannelFilter id={fid} layer={layer} />
      <img
        className={'page-art-layer layer-' + which}
        src={src}
        alt=""
        style={{
          objectPosition: `${layer.x}% ${layer.y}%`,
          objectFit: stretch ? 'fill' : 'contain',
          transform: !stretch && layer.scale !== 1 ? `scale(${layer.scale})` : undefined,
          transformOrigin: `${layer.x}% ${layer.y}%`,
          opacity: layer.opacity,
          filter: filter ? `url(#${fid})` : undefined,
        }}
      />
    </>
  )
}
