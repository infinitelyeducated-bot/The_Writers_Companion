import type { CoverSettings, Project } from '../model/types'

// ─────────────────────────────────────────────────────────────────────────────
// Full-wrap print cover geometry + rendering (front, spine, back, bleed).
// ─────────────────────────────────────────────────────────────────────────────

export interface CoverGeometry {
  trimW: number
  trimH: number
  bleed: number
  spine: number
  wrapW: number
  wrapH: number
  safe: number
  barcodeW: number
  barcodeH: number
}

export function spineWidth(pages: number, ppi: number): number {
  const w = pages * ppi
  return Math.max(0.0625, Math.round(w * 1000) / 1000)
}

export function coverGeometry(project: Project, pageCount: number, withBleed: boolean): CoverGeometry {
  const { trim, cover } = project.settings
  const bleed = withBleed ? project.settings.bleedSize || 0.125 : 0
  const spine = spineWidth(pageCount, cover.paperPpi)
  return {
    trimW: trim.width,
    trimH: trim.height,
    bleed,
    spine,
    wrapW: trim.width * 2 + spine + bleed * 2,
    wrapH: trim.height + bleed * 2,
    safe: 0.25,
    barcodeW: 2,
    barcodeH: 1.2,
  }
}

export function coverStyle(c: CoverSettings): React.CSSProperties {
  return {
    background: c.background,
    color: c.textColor,
    ['--accent' as string]: c.accentColor,
    fontFamily: `'${c.fontFamily}', Georgia, serif`,
  }
}

export function wrapLines(text: string, max: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) {
      if (cur) lines.push(cur)
      cur = w
    } else cur = (cur + ' ' + w).trim()
  }
  if (cur) lines.push(cur)
  return lines
}
