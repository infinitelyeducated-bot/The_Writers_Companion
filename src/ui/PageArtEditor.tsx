import { useRef, useState } from 'react'
import { useProject } from '../state/project'
import {
  cssGradient,
  emptyPageArt,
  type ArtLayer,
  type PageArt,
  type PageArtLayer,
  type PageGradient,
  artForPage,
  artKeyFor,
  pageForKey,
} from '../pageArt'
import { ChannelFilter } from './PageArtLayers'
import { downloadBlob } from '../util/download'

const LAYERS: { id: ArtLayer; label: string; hint: string }[] = [
  { id: 'below', label: 'Below text', hint: 'Under the words. Empty = transparent, so the page shows through.' },
  { id: 'text', label: 'With text', hint: 'Also under the words (transparent by default) so the below-layer image shows through. Type stays fully opaque on top.' },
  { id: 'above', label: 'Above text', hint: 'Overlays the words. Empty = transparent.' },
]

const PRESETS: { name: string; g: PageGradient }[] = [
  { name: 'None', g: { kind: 'linear', angle: 180, stops: [] } },
  { name: 'Ivory', g: { kind: 'linear', angle: 180, stops: [{ at: 0, color: '#f7f1e4' }, { at: 1, color: '#e8dcc4' }] } },
  { name: 'Night', g: { kind: 'linear', angle: 180, stops: [{ at: 0, color: '#1a2430' }, { at: 1, color: '#0b1016' }] } },
  { name: 'Sunset', g: { kind: 'linear', angle: 160, stops: [{ at: 0, color: '#f4c27a' }, { at: 0.55, color: '#d36b4f' }, { at: 1, color: '#5a2a4a' }] } },
  { name: 'Forest', g: { kind: 'radial', angle: 0, stops: [{ at: 0, color: '#dce8c8' }, { at: 1, color: '#2f4a32' }] } },
  { name: 'Wash', g: { kind: 'linear', angle: 90, stops: [{ at: 0, color: 'rgba(255,255,255,0)' }, { at: 1, color: 'rgba(30,20,10,.18)' }] } },
]

export function PageArtEditor({ page }: { page: number }) {
  const { project, updateSettings, uploadImage, assetMap, assets } = useProject()
  // Store under the text anchor of this page (the n-th page of a chapter), so
  // the picture follows its text when the book reflows.
  const keys = project.lastPaginated?.keys
  const pageKey = artKeyFor(page, keys)
  const pageLabel = String(page)
  const art = artForPage(project.settings.pageArt, page, keys) || emptyPageArt()
  const [layer, setLayer] = useState<ArtLayer>('below')
  const fileRef = useRef<HTMLInputElement>(null)
  const current = art[layer]

  const put = (next: PageArt) => {
    const map = { ...(project.settings.pageArt || {}) }
    // retire a legacy number key once this page has an anchor
    if (pageKey !== pageLabel) delete map[pageLabel]
    map[pageKey] = next
    updateSettings({ pageArt: map })
  }
  const patchLayer = (patch: Partial<PageArtLayer>) => put({ ...art, [layer]: { ...current, ...patch } })
  const patchGrad = (g: PageGradient | undefined) => put({ ...art, gradient: g && g.stops.length ? g : undefined })

  // Adding a picture stores it in the current workspace (the book's own
  // IndexedDB, which the single-file The_Writers_Companion*.html carries with it) and is
  // remembered against THIS page, so the page keeps its own image history.
  const pickFile = async (file: File) => {
    const asset = await uploadImage(file)
    patchLayer({ imageId: asset.id })
    rememberOnPage(asset.id)
  }

  // Every image ever placed on this page (any layer), newest last. The
  // navigator steps through them without re-uploading.
  const pageImages = (() => {
    const ids = new Set<string>()
    for (const k of ['below', 'text', 'above'] as const) {
      const id = art[k].imageId
      if (id && assetMap[id]) ids.add(id)
    }
    for (const id of art.history || []) if (assetMap[id]) ids.add(id)
    return [...ids]
  })()

  const rememberOnPage = (assetId: string) => {
    const history = [...new Set([...(art.history || []), assetId])]
    put({ ...art, [layer]: { ...current, imageId: assetId }, history })
  }

  const stepImage = (dir: 1 | -1) => {
    if (!pageImages.length) return
    const at = current.imageId ? pageImages.indexOf(current.imageId) : -1
    const next = pageImages[(at + dir + pageImages.length) % pageImages.length]
    patchLayer({ imageId: next })
  }

  const allKey = project.settings.pageArtAllKey
  const useForAll = allKey === pageKey

  // Save the untouched original into image_folder/ next to the launcher.
  // Browsers download into the user's download directory; the suggested
  // filename carries the image_folder/ prefix so Chromium offers that path.
  const saveOriginal = async () => {
    const a = current.imageId ? assets.find((x) => x.id === current.imageId) : null
    if (!a) return
    const blob = await (await fetch(a.dataUrl)).blob()
    const ext = (a.mime.split('/')[1] || 'png').replace('jpeg', 'jpg').replace('svg+xml', 'svg')
    const base = (a.name || 'image').replace(/\.[a-z0-9]+$/i, '')
    await downloadBlob(blob, `${base}.${ext}`)
  }

  return (
    <div className="page-art">
      <p className="hint">
        Each interior page has its own picture. Layers start empty (transparent). Type is always drawn fully opaque on top of whatever is below.
      </p>
      <label
        className="chk"
        title="On: every page in the book shows this page's picture. Off: each page shows only its own picture, as described above."
      >
        <input
          type="checkbox"
          checked={useForAll}
          onChange={(e) => updateSettings({ pageArtAllKey: e.target.checked ? pageKey : undefined })}
        />
        Use selected image for all pages
      </label>
      {allKey && !useForAll && (
        <p className="hint">⚠ Page {pageForKey(allKey, keys) || '?'}’s picture is currently applied to all pages — untick the toggle there, or tick it here to take over.</p>
      )}
      {pageImages.length > 1 && (
        <div className="page-art-nav">
          <span className="muted small">Images saved to page {pageLabel}</span>
          <div className="btn-row">
            <button type="button" className="btn tiny ghost" onClick={() => stepImage(-1)}>‹ previous</button>
            <span className="muted small">
              {current.imageId && pageImages.indexOf(current.imageId) >= 0 ? pageImages.indexOf(current.imageId) + 1 : '–'} / {pageImages.length}
            </span>
            <button type="button" className="btn tiny ghost" onClick={() => stepImage(1)}>next ›</button>
          </div>
        </div>
      )}
      <div className="page-art-tabs" role="tablist">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            type="button"
            role="tab"
            className={layer === l.id ? 'on' : ''}
            onClick={() => setLayer(l.id)}
          >
            {l.label}
          </button>
        ))}
      </div>
      <p className="muted small">{LAYERS.find((l) => l.id === layer)?.hint}</p>

      <div className="page-art-preview" style={{ background: cssGradient(art.gradient) }}>
        <LayerThumb layer={art.below} src={art.below.imageId ? assetMap[art.below.imageId] : undefined} z={1} />
        <div className="page-art-ghost">Aa</div>
        <LayerThumb layer={art.text} src={art.text.imageId ? assetMap[art.text.imageId] : undefined} z={2} />
        <LayerThumb layer={art.above} src={art.above.imageId ? assetMap[art.above.imageId] : undefined} z={3} />
      </div>

      <h4>Background gradient</h4>
      <div className="grad-presets">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            className="grad-swatch"
            title={p.name}
            style={{ background: p.g.stops.length ? cssGradient(p.g) : 'repeating-conic-gradient(#ddd 0 25%, #fff 0 50%) 0 0 / 12px 12px' }}
            onClick={() => patchGrad(p.g.stops.length ? p.g : undefined)}
          />
        ))}
      </div>
      {art.gradient && art.gradient.stops.length > 0 && (
        <div className="grad-edit">
          <label className="field">
            <span>Angle</span>
            <input
              type="range"
              min={0}
              max={360}
              value={art.gradient.angle}
              onChange={(e) => patchGrad({ ...art.gradient!, angle: Number(e.target.value) })}
            />
          </label>
          {art.gradient.stops.map((s, i) => (
            <div key={i} className="grad-stop">
              <input
                type="color"
                value={toHex(s.color)}
                onChange={(e) => {
                  const stops = art.gradient!.stops.map((st, j) => (j === i ? { ...st, color: e.target.value } : st))
                  patchGrad({ ...art.gradient!, stops })
                }}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(s.at * 100)}
                onChange={(e) => {
                  const stops = art.gradient!.stops.map((st, j) => (j === i ? { ...st, at: Number(e.target.value) / 100 } : st))
                  patchGrad({ ...art.gradient!, stops })
                }}
              />
            </div>
          ))}
        </div>
      )}

      <h4>This layer</h4>
      <div className="btn-row">
        <button type="button" className="btn tiny ghost" onClick={() => fileRef.current?.click()}>
          {current.imageId ? 'Replace picture' : 'Add picture'}
        </button>
        {current.imageId && (
          <button
            type="button"
            className="btn tiny ghost"
            onClick={() => void saveOriginal()}
            title="Saving to this folder preserves the original Image file from any alterations and/or for faster reuse"
          >
            Save to image_folder
          </button>
        )}
        {current.imageId && (
          <button type="button" className="btn tiny ghost" onClick={() => patchLayer({ imageId: undefined })}>
            Clear layer
          </button>
        )}
      </div>
      <p className="hint">
        Added pictures are stored in this workspace (the book itself). “Save to image_folder”
        writes the untouched original next to the Writers Companion launcher — put it in the
        <code> image_folder</code> directory when the browser asks where to save.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void pickFile(f)
          e.target.value = ''
        }}
      />
      {current.imageId && (
        <>
          <label className="chk">
            <input
              type="checkbox"
              checked={current.fit === 'stretch'}
              onChange={(e) => patchLayer({ fit: e.target.checked ? 'stretch' : 'contain' })}
            />
            Stretch to fit the page (ignores proportions)
          </label>
          <label className="field">
            <span>Size {Math.round(current.scale * 100)}%</span>
            <input type="range" min={10} max={300} value={Math.round(current.scale * 100)} disabled={current.fit === 'stretch'} onChange={(e) => patchLayer({ scale: Number(e.target.value) / 100 })} />
          </label>
          <label className="field">
            <span>Opacity {Math.round(current.opacity * 100)}%</span>
            <input type="range" min={0} max={100} value={Math.round(current.opacity * 100)} onChange={(e) => patchLayer({ opacity: Number(e.target.value) / 100 })} />
          </label>
          <label className="field">
            <span>Across {Math.round(current.x)}%</span>
            <input type="range" min={0} max={100} value={current.x} onChange={(e) => patchLayer({ x: Number(e.target.value) })} />
          </label>
          <label className="field">
            <span>Down {Math.round(current.y)}%</span>
            <input type="range" min={0} max={100} value={current.y} onChange={(e) => patchLayer({ y: Number(e.target.value) })} />
          </label>
          <h4>Colour on this layer</h4>
          <p className="muted small">Fade a channel toward transparent, or pull colour out of the picture.</p>
          <label className="field ch-r">
            <span>Red {Math.round((current.r ?? 1) * 100)}%</span>
            <input type="range" min={0} max={100} value={Math.round((current.r ?? 1) * 100)} onChange={(e) => patchLayer({ r: Number(e.target.value) / 100 })} />
          </label>
          <label className="field ch-g">
            <span>Green {Math.round((current.g ?? 1) * 100)}%</span>
            <input type="range" min={0} max={100} value={Math.round((current.g ?? 1) * 100)} onChange={(e) => patchLayer({ g: Number(e.target.value) / 100 })} />
          </label>
          <label className="field ch-b">
            <span>Blue {Math.round((current.b ?? 1) * 100)}%</span>
            <input type="range" min={0} max={100} value={Math.round((current.b ?? 1) * 100)} onChange={(e) => patchLayer({ b: Number(e.target.value) / 100 })} />
          </label>
          <label className="field">
            <span>Colour {(current.chroma ?? 1) === 0 ? 'removed' : Math.round((current.chroma ?? 1) * 100) + '%'}</span>
            <input type="range" min={0} max={100} value={Math.round((current.chroma ?? 1) * 100)} onChange={(e) => patchLayer({ chroma: Number(e.target.value) / 100 })} />
          </label>
          <div className="btn-row">
            <button type="button" className="btn tiny ghost" onClick={() => patchLayer({ chroma: 0 })}>
              Remove colour
            </button>
            <button type="button" className="btn tiny ghost" onClick={() => patchLayer({ r: 1, g: 1, b: 1, chroma: 1 })}>
              Reset colour
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function LayerThumb({ layer, src, z }: { layer: PageArtLayer; src?: string; z: number }) {
  if (!src) return null
  const fid = 'thumb-' + z + '-' + (layer.imageId || 'x')
  const stretch = layer.fit === 'stretch'
  return (
    <>
      <ChannelFilter id={fid} layer={layer} />
      <img
        className="page-art-thumb"
        src={src}
        alt=""
        style={{
          zIndex: z,
          objectPosition: `${layer.x}% ${layer.y}%`,
          objectFit: stretch ? 'fill' : 'contain',
          transform: !stretch && layer.scale !== 1 ? `scale(${layer.scale})` : undefined,
          transformOrigin: `${layer.x}% ${layer.y}%`,
          opacity: layer.opacity,
          filter: `url(#${fid})`,
        }}
      />
    </>
  )
}

function toHex(c: string): string {
  if (c.startsWith('#') && c.length === 7) return c
  return '#888888'
}
