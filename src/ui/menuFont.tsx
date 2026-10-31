import { useEffect, useState } from 'react'

interface MenuFontDef {
  id: string
  label: string
  stack: string
}

interface MenuFontGroup {
  heading: string
  fonts: MenuFontDef[]
}

export const MENU_FONT_GROUPS: MenuFontGroup[] = [
  {
    heading: 'Interface & text',
    fonts: [
      { id: 'system', label: 'System default', stack: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" },
      { id: 'literata', label: 'Literata', stack: "'Literata', Georgia, serif" },
      { id: 'georgia', label: 'Georgia', stack: "Georgia, 'Times New Roman', serif" },
      { id: 'garamond', label: 'EB Garamond', stack: "'EB Garamond', Georgia, serif" },
      { id: 'lora', label: 'Lora', stack: "'Lora', Georgia, serif" },
      { id: 'crimson', label: 'Crimson Pro', stack: "'Crimson Pro', Georgia, serif" },
      { id: 'source-serif', label: 'Source Serif 4', stack: "'Source Serif 4', Georgia, serif" },
      { id: 'cormorant-garamond', label: 'Cormorant Garamond', stack: "'Cormorant Garamond', Georgia, serif" },
      { id: 'cormorant', label: 'Cormorant', stack: "'Cormorant', Georgia, serif" },
      { id: 'spectral', label: 'Spectral', stack: "'Spectral', Georgia, serif" },
      { id: 'merriweather', label: 'Merriweather', stack: "'Merriweather', Georgia, serif" },
      { id: 'libre-baskerville', label: 'Libre Baskerville', stack: "'Libre Baskerville', Georgia, serif" },
      { id: 'cardo', label: 'Cardo', stack: "'Cardo', Georgia, serif" },
      { id: 'alegreya', label: 'Alegreya', stack: "'Alegreya', Georgia, serif" },
      { id: 'bitter', label: 'Bitter', stack: "'Bitter', Georgia, serif" },
      { id: 'neuton', label: 'Neuton', stack: "'Neuton', Georgia, serif" },
      { id: 'old-standard', label: 'Old Standard TT', stack: "'Old Standard TT', Georgia, serif" },
      { id: 'pt-serif', label: 'PT Serif', stack: "'PT Serif', Georgia, serif" },
      { id: 'zilla-slab', label: 'Zilla Slab', stack: "'Zilla Slab', Georgia, serif" },
      { id: 'josefin-sans', label: 'Josefin Sans', stack: "'Josefin Sans', Verdana, sans-serif" },
      { id: 'inknut', label: 'Inknut Antiqua', stack: "'Inknut Antiqua', Georgia, serif" },
      { id: 'eczar', label: 'Eczar', stack: "'Eczar', Georgia, serif" },
      { id: 'biorhyme', label: 'BioRhyme', stack: "'BioRhyme', Georgia, serif" },
      { id: 'fraunces', label: 'Fraunces', stack: "'Fraunces', Georgia, serif" },
      { id: 'dm-serif-display', label: 'DM Serif Display', stack: "'DM Serif Display', Georgia, serif" },
      { id: 'dm-serif-text', label: 'DM Serif Text', stack: "'DM Serif Text', Georgia, serif" },
      { id: 'instrument-serif', label: 'Instrument Serif', stack: "'Instrument Serif', Georgia, serif" },
      { id: 'newsreader', label: 'Newsreader', stack: "'Newsreader', Georgia, serif" },
      { id: 'roboto-serif', label: 'Roboto Serif', stack: "'Roboto Serif', Georgia, serif" },
      { id: 'dm-sans', label: 'DM Sans', stack: "'DM Sans', Verdana, sans-serif" },
      { id: 'work-sans', label: 'Work Sans', stack: "'Work Sans', Verdana, sans-serif" },
      { id: 'karla', label: 'Karla', stack: "'Karla', Verdana, sans-serif" },
      { id: 'manrope', label: 'Manrope', stack: "'Manrope', Verdana, sans-serif" },
      { id: 'montserrat', label: 'Montserrat', stack: "'Montserrat', Verdana, sans-serif" },
      { id: 'raleway', label: 'Raleway', stack: "'Raleway', Verdana, sans-serif" },
      { id: 'space-grotesk', label: 'Space Grotesk', stack: "'Space Grotesk', Verdana, sans-serif" },
      { id: 'syne', label: 'Syne', stack: "'Syne', Verdana, sans-serif" },
      { id: 'courier', label: 'Courier Prime (mono)', stack: "'Courier Prime', 'Courier New', monospace" },
      { id: 'mono', label: 'System mono', stack: "ui-monospace, Menlo, Consolas, monospace" },
    ],
  },
  {
    heading: 'Display & decorative',
    fonts: [
      { id: 'playfair', label: 'Playfair Display', stack: "'Playfair Display', Georgia, serif" },
      { id: 'abril-fatface', label: 'Abril Fatface', stack: "'Abril Fatface', Georgia, serif" },
      { id: 'rozha-one', label: 'Rozha One', stack: "'Rozha One', Georgia, serif" },
      { id: 'ultra', label: 'Ultra', stack: "'Ultra', Georgia, serif" },
      { id: 'cinzel', label: 'Cinzel', stack: "'Cinzel', Georgia, serif" },
      { id: 'cinzel-decorative', label: 'Cinzel Decorative', stack: "'Cinzel Decorative', Georgia, serif" },
      { id: 'italiana', label: 'Italiana', stack: "'Italiana', Georgia, serif" },
      { id: 'marcellus', label: 'Marcellus', stack: "'Marcellus', Georgia, serif" },
      { id: 'bagel-fat-one', label: 'Bagel Fat One', stack: "'Bagel Fat One', Georgia, serif" },
      { id: 'rye', label: 'Rye', stack: "'Rye', Georgia, serif" },
      { id: 'smokum', label: 'Smokum', stack: "'Smokum', Georgia, serif" },
      { id: 'sancreek', label: 'Sancreek', stack: "'Sancreek', Georgia, serif" },
      { id: 'creepster', label: 'Creepster', stack: "'Creepster', Georgia, serif" },
      { id: 'nosifer', label: 'Nosifer', stack: "'Nosifer', Georgia, serif" },
      { id: 'metamorphous', label: 'Metamorphous', stack: "'Metamorphous', Georgia, serif" },
      { id: 'modern-antiqua', label: 'Modern Antiqua', stack: "'Modern Antiqua', Georgia, serif" },
    ],
  },
  {
    heading: 'Scripts & handwriting',
    fonts: [
      { id: 'tangerine', label: 'Tangerine', stack: "'Tangerine', cursive" },
      { id: 'dancing-script', label: 'Dancing Script', stack: "'Dancing Script', cursive" },
      { id: 'sacramento', label: 'Sacramento', stack: "'Sacramento', cursive" },
      { id: 'bad-script', label: 'Bad Script', stack: "'Bad Script', cursive" },
      { id: 'great-vibes', label: 'Great Vibes', stack: "'Great Vibes', cursive" },
      { id: 'amatic-sc', label: 'Amatic SC', stack: "'Amatic SC', cursive" },
      { id: 'caveat', label: 'Caveat', stack: "'Caveat', cursive" },
      { id: 'shadows-into-light', label: 'Shadows Into Light', stack: "'Shadows Into Light', cursive" },
      { id: 'permanent-marker', label: 'Permanent Marker', stack: "'Permanent Marker', cursive" },
      { id: 'special-elite', label: 'Special Elite', stack: "'Special Elite', cursive" },
      { id: 'jim-nightshade', label: 'Jim Nightshade', stack: "'Jim Nightshade', cursive" },
      { id: 'petit-formal', label: 'Petit Formal Script', stack: "'Petit Formal Script', cursive" },
    ],
  },
  {
    heading: 'Blackletter & themed',
    fonts: [
      { id: 'unifraktur', label: 'UnifrakturMaguntia', stack: "'UnifrakturMaguntia', serif" },
      { id: 'pirata-one', label: 'Pirata One', stack: "'Pirata One', serif" },
      { id: 'new-rocker', label: 'New Rocker', stack: "'New Rocker', serif" },
      { id: 'im-fell', label: 'IM Fell English', stack: "'IM Fell English', Georgia, serif" },
      { id: 'medievalsharp', label: 'MedievalSharp', stack: "'MedievalSharp', serif" },
      { id: 'uncial', label: 'Uncial Antiqua', stack: "'Uncial Antiqua', serif" },
    ],
  },
]

/** Flat list, kept for backwards compatibility (stored ids are unchanged). */
export const MENU_FONTS: MenuFontDef[] = MENU_FONT_GROUPS.flatMap((g) => g.fonts)

export type MenuFontId = (typeof MENU_FONTS)[number]['id']

const KEY = 'writerscompanion.menuFont'

function readStored(): MenuFontId {
  try {
    const v = localStorage.getItem(KEY)
    if (MENU_FONTS.some((f) => f.id === v)) return v as MenuFontId
  } catch {
    /* ignore */
  }
  return 'system'
}

function stackFor(id: MenuFontId): string {
  return MENU_FONTS.find((f) => f.id === id)?.stack ?? MENU_FONTS[0].stack
}

export function applyMenuFont(id: MenuFontId) {
  document.documentElement.style.setProperty('--menu-font', stackFor(id))
}

/** Persisted menu/UI font. Applies immediately and on every launch. */
export function useMenuFont(): [MenuFontId, (id: MenuFontId) => void] {
  const [font, setFont] = useState<MenuFontId>(() => {
    const initial = readStored()
    // apply synchronously on first read so first paint already uses it
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--menu-font', stackFor(initial))
    }
    return initial
  })

  useEffect(() => {
    applyMenuFont(font)
    try {
      localStorage.setItem(KEY, font)
    } catch {
      /* ignore */
    }
  }, [font])

  return [font, setFont]
}

export function MenuFontPicker({ value, onChange }: { value: MenuFontId; onChange: (id: MenuFontId) => void }) {
  return (
    <label className="menu-font-picker" title="Menu font — changes the app's own interface text, not your book">
      <span className="muted small">Menu font</span>
      <select value={value} onChange={(e) => onChange(e.target.value as MenuFontId)} aria-label="Menu font">
        {MENU_FONT_GROUPS.map((g) => (
          <optgroup key={g.heading} label={g.heading}>
            {g.fonts.map((f) => (
              <option key={f.id} value={f.id} style={{ fontFamily: f.stack }}>
                {f.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  )
}
