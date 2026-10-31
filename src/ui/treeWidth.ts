import { useEffect, useState } from 'react'

// Chapter-column width. 100% = 230px, the width the column actually reached
// at the old "85%" (a CSS cap stopped it growing past that on most windows).
// The slider's top end is computed from the window, so every notch moves the
// column — there is no dead stretch at the right of the bar any more.

export const TREE_BASE_PX = 230
export const TREE_MIN_PCT = 60
/** the editor keeps at least this much room */
const EDITOR_MIN_PX = 480

/** Widest the column can usefully be in a window this wide, as a percentage. */
export function treeMaxPct(windowWidth: number): number {
  const px = Math.max(TREE_BASE_PX, windowWidth - EDITOR_MIN_PX)
  const pct = Math.floor((px / TREE_BASE_PX) * 100 / 5) * 5
  return Math.max(100, Math.min(300, pct))
}

export function treePx(pct: number | undefined): number {
  return Math.round(TREE_BASE_PX * (pct ?? 100) / 100)
}

/** Track the window so the slider range follows a resize. */
export function useTreeMaxPct(): number {
  const [max, setMax] = useState(() => treeMaxPct(typeof window === 'undefined' ? 1440 : window.innerWidth))
  useEffect(() => {
    const on = () => setMax(treeMaxPct(window.innerWidth))
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return max
}
