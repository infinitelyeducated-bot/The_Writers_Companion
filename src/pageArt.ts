import type { CSSProperties } from 'react'
import type { LayoutFamily } from './model/types'
import { RAW_EXAMPLES } from './data/examples2'

export type ArtLayer = 'below' | 'text' | 'above'

export interface GradientStop {
  at: number
  color: string
}

export interface PageGradient {
  kind: 'linear' | 'radial'
  angle: number
  stops: GradientStop[]
}

export interface PageArtLayer {
  imageId?: string
  opacity: number
  scale: number
  x: number
  y: number
  /** Channel mix 0–1. 1 = original. */
  r?: number
  g?: number
  b?: number
  /** 1 = full colour, 0 = greyscale (colour removed). */
  chroma?: number
  /** 'contain' keeps proportions (default); 'stretch' fills the page exactly. */
  fit?: 'contain' | 'stretch'
}

export interface PageArt {
  gradient?: PageGradient
  below: PageArtLayer
  text: PageArtLayer
  above: PageArtLayer
  /** every image ever placed on this page, for the per-page navigator */
  history?: string[]
}

export const emptyLayer = (): PageArtLayer => ({
  opacity: 1,
  scale: 1,
  x: 50,
  y: 50,
  r: 1,
  g: 1,
  b: 1,
  chroma: 1,
})

// ── anchoring ────────────────────────────────────────────────────────────────
// Art used to be stored under the physical page number, so adding a paragraph
// in chapter 1 left every picture behind on the old page number. Pages are now
// keyed to the text they hold: "b:<blockId>:<n>" = the n-th page of that block.
// Pages with no block (title, copyright, contents, blanks) keep "p:<index>".
// Legacy numeric keys ("12") are still read, and are converted to anchors the
// first time the book is paginated.

export interface PageLike {
  index: number
  blockId?: string
}

export function anchorKeys(pages: PageLike[]): string[] {
  const seen = new Map<string, number>()
  return pages.map((p) => {
    if (!p.blockId) return `p:${p.index}`
    const n = seen.get(p.blockId) || 0
    seen.set(p.blockId, n + 1)
    return `b:${p.blockId}:${n}`
  })
}

/** Storage key for physical page `n`, given the last pagination's anchors. */
export function artKeyFor(n: number, keys?: string[]): string {
  return keys?.[n - 1] || String(n)
}

/** Art for physical page `n`: anchor first, then the legacy number. */
export function artForPage(map: Record<string, PageArt> | undefined, n: number, keys?: string[]): PageArt | undefined {
  if (!map) return undefined
  const k = keys?.[n - 1]
  return (k && map[k]) || map[String(n)]
}

/** Physical page number a storage key currently lands on (0 if unknown). */
export function pageForKey(key: string, keys?: string[]): number {
  const i = keys ? keys.indexOf(key) : -1
  if (i >= 0) return i + 1
  const n = Number(key)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Move legacy numeric keys onto anchors for the current layout. */
export function migrateArtKeys(
  map: Record<string, PageArt> | undefined,
  allKey: string | undefined,
  keys: string[],
): { map: Record<string, PageArt>; allKey: string | undefined; changed: boolean } {
  const out: Record<string, PageArt> = { ...(map || {}) }
  let changed = false
  for (const k of Object.keys(out)) {
    if (!/^\d+$/.test(k)) continue
    const anchor = keys[Number(k) - 1]
    if (!anchor) continue
    if (!out[anchor]) out[anchor] = out[k]
    delete out[k]
    changed = true
  }
  let nextAll = allKey
  if (allKey && /^\d+$/.test(allKey) && keys[Number(allKey) - 1]) {
    nextAll = keys[Number(allKey) - 1]
    changed = true
  }
  return { map: out, allKey: nextAll, changed }
}

export function hasPagePicture(art?: PageArt): boolean {
  if (!art) return false
  return !!(art.below.imageId || art.text.imageId || art.above.imageId || art.gradient?.stops.length)
}

/** SVG feColorMatrix: saturate, then scale R/G/B. */
export function channelMatrix(layer: PageArtLayer): { saturate: number; rgb: string } {
  const r = layer.r ?? 1
  const g = layer.g ?? 1
  const b = layer.b ?? 1
  const c = layer.chroma ?? 1
  return {
    saturate: c,
    rgb: `${r} 0 0 0 0  0 ${g} 0 0 0  0 0 ${b} 0 0  0 0 0 1 0`,
  }
}

export function layerBoxStyle(layer: PageArtLayer, src: string, filterId?: string): CSSProperties {
  return {
    backgroundImage: `url(${src})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: `${layer.x}% ${layer.y}%`,
    backgroundSize: `${Math.round(layer.scale * 100)}% auto`,
    opacity: layer.opacity,
    filter: filterId ? `url(#${filterId})` : undefined,
  }
}

export const emptyPageArt = (): PageArt => ({
  below: emptyLayer(),
  text: emptyLayer(),
  above: emptyLayer(),
})

export function cssGradient(g?: PageGradient): string {
  if (!g || !g.stops.length) return 'transparent'
  const stops = [...g.stops]
    .sort((a, b) => a.at - b.at)
    .map((s) => `${s.color} ${Math.round(s.at * 100)}%`)
    .join(', ')
  if (g.kind === 'radial') return `radial-gradient(circle at 50% 50%, ${stops})`
  return `linear-gradient(${g.angle}deg, ${stops})`
}

export function layerStyle(layer: PageArtLayer, src?: string): CSSProperties {
  if (!src) return { background: 'transparent' }
  return {
    backgroundImage: `url(${src})`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: `${layer.x}% ${layer.y}%`,
    backgroundSize: `${Math.round(layer.scale * 100)}% auto`,
    opacity: layer.opacity,
  }
}

const RAW_P: Record<string, string> = Object.fromEntries(RAW_EXAMPLES.map((r) => [r.id, r.pages]))
const RAW_L: Record<string, string> = Object.fromEntries(RAW_EXAMPLES.map((r) => [r.id, r.length]))

export const TYPICAL_PAGES: Partial<Record<LayoutFamily, string>> = {
  trade: 'Aim for roughly 200–400 pages at 6 × 9',
  children: 'Aim for 24–32 pages · the standard picture-book length',
  poetry: 'Aim for roughly 60–120 pages at 5.5 × 8.5',
  play: 'Aim for roughly 70–120 pages at 5.5 × 8.5',
  screenplay: 'Aim for 90–120 pages · about one page per minute of screen time',
  technical: 'Aim for roughly 150–350 pages at 7 × 10 · let the subject decide',
  memoir: 'Aim for roughly 200–350 pages at 5.25 × 8',
}

export const TYPICAL_LENGTHS: Partial<Record<LayoutFamily, string>> = {
  trade: 'Aim for 50,000–120,000 words · a novel that fits the 828-page ceiling',
  children: 'Aim for 300–1,000 words · read-aloud length',
  poetry: 'Aim for 3,000–15,000 words · roughly 50–100 poems',
  play: 'Aim for 8,000–25,000 words · a full evening on stage',
  screenplay: 'Aim for 20,000–25,000 words · about 90–120 pages, a minute a page',
  technical: 'Aim for 20,000–100,000 words · length serves the subject',
  memoir: 'Aim for 50,000–100,000 words · memoir-length, like a novel',
}

export function typicalFor(layout: LayoutFamily | string): { pages: string; length: string } {
  const id = (layout || 'trade') as LayoutFamily
  return {
    pages: TYPICAL_PAGES[id] || RAW_P[id] || 'No fixed length · watch the page count, not the word count',
    length: TYPICAL_LENGTHS[id] || RAW_L[id] || 'No fixed length · watch the page count, not the word count',
  }
}
