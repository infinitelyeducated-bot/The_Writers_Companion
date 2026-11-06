// GUI skins: each skin repaints the workspace by overriding the CSS variables
// the whole stylesheet is written against. Book pages are untouched — a skin
// changes the room, never the manuscript.

export interface Skin {
  id: string
  name: string
  vars: Record<string, string>
}

/** Relative luminance (0 black … 1 white) of a #rrggbb colour. */
function lum(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
}

/** Surface tokens every skin needs but only the default spells out: input
 *  fields, the writing desk behind the page, the print-preview table, and the
 *  text colour that sits on an accent-filled button. */
function derived(bg: string, panel2: string, accent: string): Record<string, string> {
  const dark = lum(bg) < 0.2
  return {
    '--field': dark ? panel2 : '#ffffff',
    '--editor-bg': bg,
    '--preview-bg': dark ? bg : panel2,
    '--on-accent': lum(accent) > 0.45 ? '#111111' : '#ffffff',
    'color-scheme': dark ? 'dark' : 'light',
  }
}

const S = (
  id: string,
  name: string,
  bg: string,
  panel: string,
  panel2: string,
  ink: string,
  ink2: string,
  muted: string,
  line: string,
  line2: string,
  accent: string,
  accent2: string,
  accentSoft: string,
): Skin => ({
  id,
  name,
  vars: {
    ...derived(bg, panel2, accent),
    '--bg': bg,
    '--panel': panel,
    '--panel-2': panel2,
    '--ink': ink,
    '--ink-2': ink2,
    '--muted': muted,
    '--line': line,
    '--line-2': line2,
    '--accent': accent,
    '--accent-2': accent2,
    '--accent-soft': accentSoft,
  },
})

export const SKINS: Skin[] = [
  // the stylesheet's own palette ("Inkwell": warm paper, ink-blue accent)
  { id: 'default', name: 'Inkwell (default)', vars: {} },
  S('inkwell-dark', 'Inkwell Night', '#13161d', '#1a1e27', '#232835', '#e7e9ef', '#b8bdcb', '#8b91a3', '#2b3140', '#3a4154', '#8ea2ff', '#aebcff', '#232c4f'),
  // the original parchment-and-leather look, kept for anyone who prefers it
  S('classic', 'Classic Parchment', '#f6f3ee', '#fffdfa', '#f0ebe2', '#1d1b18', '#4a453d', '#7c7468', '#e2dbcf', '#d3c9b8', '#8a5a2b', '#b5793a', '#f2e7d8'),
  // ── the requested six ──────────────────────────────────────────────────────
  S('rocknroll', 'Rock and Roll', '#13090b', '#1f1014', '#2b161c', '#f4e3e7', '#d9b8c0', '#9e7b85', '#3a1f27', '#56303c', '#e4363f', '#ff6b5e', '#3d1118'),
  S('space', 'Space', '#060a16', '#0d1424', '#141e35', '#e8edf7', '#b9c4dd', '#7e8aa8', '#1d2941', '#2b3a5c', '#5b8cff', '#8fb4ff', '#14213f'),
  S('carnival', 'Carnival', '#fff4e0', '#fffaf0', '#ffe9c7', '#3a2410', '#6b4a24', '#a97f4f', '#f3d9ad', '#e4bc7d', '#e0218a', '#ff8c42', '#ffe0ef'),
  S('robots', 'Robots', '#1a1d21', '#24282e', '#2f353d', '#e6eaef', '#b9c1cc', '#848e9b', '#383f49', '#4a535f', '#19c2c8', '#5de0e6', '#122f33'),
  S('terminator', 'Terminator', '#0a0a0a', '#141414', '#1e1e1e', '#e8e8e8', '#bdbdbd', '#8a8a8a', '#262626', '#3a3a3a', '#e10600', '#ff4d3a', '#2a0505'),
  S('pitcorgi', "Pitbulls & Corgis", '#fdf3e7', '#fffaf2', '#f6e3cc', '#4a3321', '#7a5c3e', '#a98c6c', '#eed9bd', '#dcbd94', '#c96f2f', '#e89a56', '#f7e2cd'),
  // ── nature & place ────────────────────────────────────────────────────────
  S('forest', 'Deep Forest', '#0e1a12', '#15241a', '#1d3123', '#e3eee5', '#b5cbbb', '#7f9a87', '#24402e', '#33543e', '#4caf6e', '#7ed09a', '#11301d'),
  S('ocean', 'Open Ocean', '#07131d', '#0d1f2d', '#143042', '#e2eef6', '#aecadb', '#7795a8', '#1b3a50', '#2a4f6a', '#1e9ad6', '#56bdf0', '#0c2a3d'),
  S('desert', 'Desert Noon', '#f7ead3', '#fdf6e8', '#f0ddba', '#443214', '#73592e', '#a3875c', '#e8d2a8', '#d4b67f', '#c0662c', '#da8a4e', '#f4decb'),
  S('tundra', 'Tundra', '#eef3f6', '#f8fbfd', '#dfe9ef', '#20303a', '#4a616e', '#7f949f', '#d2dfe7', '#b4c8d3', '#3d7ea6', '#6aa5c8', '#dcebf3'),
  S('volcano', 'Volcano', '#190c08', '#241310', '#331a14', '#f6e6df', '#dcb4a6', '#a67f72', '#3f221a', '#5a3225', '#f05d23', '#ff8b4a', '#38140a'),
  S('rainforest', 'Rainforest', '#0b1f16', '#11291d', '#173827', '#e2f2e7', '#aed3ba', '#78a187', '#1e4631', '#2d5f43', '#27c07a', '#63dfa5', '#0e3a26'),
  S('aurora', 'Aurora', '#0a1022', '#111a33', '#182445', '#e9ecfb', '#bcc5e8', '#8690b8', '#20305a', '#2e4278', '#4adfb0', '#8cf1d0', '#0f2d3e'),
  S('canyon', 'Canyon', '#f3e2d2', '#faf0e4', '#ecd5bc', '#48291a', '#7a4c33', '#a9795c', '#e3c6a8', '#cfa981', '#b23a2a', '#d9644c', '#f3d4c8'),
  // ── eras & genres ─────────────────────────────────────────────────────────
  S('noir', 'Film Noir', '#101010', '#1a1a1a', '#242424', '#ececec', '#c0c0c0', '#8c8c8c', '#2e2e2e', '#444444', '#d9d9d9', '#ffffff', '#2a2a2a'),
  S('western', 'Old West', '#efe2c8', '#f8efdc', '#e6d2ae', '#3e2c16', '#6d5331', '#9c8158', '#dcc49a', '#c2a06c', '#8c5a24', '#b07f3e', '#eedcbb'),
  S('steampunk', 'Steampunk', '#1d1510', '#2a1f16', '#3a2c1f', '#f1e4d2', '#d2b899', '#9c8468', '#443325', '#5f4833', '#c9892c', '#e8b04b', '#39260f'),
  S('cyberpunk', 'Cyberpunk', '#0c0518', '#150a26', '#1f1038', '#f2e7ff', '#cdb3ef', '#9377b8', '#2a1748', '#3d2367', '#ff2bd1', '#00e5ff', '#2d0a3d'),
  S('vaporwave', 'Vaporwave', '#1a1033', '#241747', '#30205e', '#f6eaff', '#d8bff2', '#a284c4', '#3b2a70', '#503a92', '#ff71ce', '#01cdfe', '#3a1660'),
  S('artdeco', 'Art Deco', '#10141a', '#182028', '#202b36', '#f0ead8', '#cfc3a3', '#948a6e', '#2a3845', '#3c4f60', '#d4af37', '#e8cc6a', '#2c2a16'),
  S('medieval', 'Illuminated', '#f4ecd9', '#fbf6e9', '#ecdfc0', '#3a2a1a', '#684e2e', '#997c54', '#e2d2ab', '#ccb380', '#8f1d21', '#b8432f', '#f0d9d3'),
  S('grunge', 'Grunge', '#191714', '#23201c', '#2e2a24', '#e8e3da', '#c0b8a9', '#8d8577', '#363129', '#4c453a', '#a8893c', '#c7a957', '#2e2817'),
  S('synthwave', 'Synthwave', '#150826', '#1f0e38', '#2b154e', '#ffeafd', '#e3b8e9', '#a97fb4', '#371d60', '#4d2a84', '#ff3caa', '#ffb84d', '#35104f'),
  S('ancient', 'Papyrus', '#efe4c4', '#f8f0d8', '#e6d6ad', '#3c2f14', '#6a572c', '#9a8356', '#dcc795', '#c3a567', '#9c6b1e', '#bf8c36', '#eee0b4'),
  // ── animals & whimsy ──────────────────────────────────────────────────────
  S('blackcat', 'Black Cat', '#141216', '#1d1a20', '#28242c', '#efeaf2', '#c8c0cf', '#938b9c', '#322d38', '#46404e', '#f2b705', '#ffd34e', '#302a10'),
  S('honeybee', 'Honeybee', '#fff8e0', '#fffdf0', '#fdedb8', '#3a2e08', '#6d591f', '#a08a44', '#f4e2a0', '#e3c96e', '#e3a008', '#f7c437', '#fdf0c0'),
  S('koi', 'Koi Pond', '#eaf4f2', '#f6fbfa', '#d9ebe8', '#1e3835', '#406662', '#73938f', '#cde3df', '#a9ccc6', '#e2543e', '#f08060', '#fbe2da'),
  S('owl', 'Night Owl', '#17141f', '#201c2b', '#2b2539', '#ece8f4', '#c4bcd4', '#8f87a2', '#352e47', '#4a4060', '#b78add', '#d4adf2', '#2a1f3d'),
  S('fox', 'Fox Den', '#faefe4', '#fff8f0', '#f3dfc9', '#432a16', '#75502f', '#a67e58', '#ecd4b6', '#d9b587', '#d2622a', '#ef8a4e', '#f9dfc9'),
  S('wolf', 'Wolf Pack', '#171a1e', '#20242a', '#2b3038', '#e9edf2', '#bfc7d1', '#8b949f', '#333a44', '#49525e', '#8aa6c0', '#b1c8dd', '#232f3b'),
  S('dragon', 'Dragon Hoard', '#1a0e0e', '#251414', '#331b1b', '#f4e6e1', '#d8b7ab', '#a27f72', '#402020', '#5c2e2e', '#cf9b2a', '#eec04f', '#3b2609'),
  // ── moods ─────────────────────────────────────────────────────────────────
  S('midnight', 'Midnight Ink', '#0d1117', '#161b22', '#21262d', '#e6edf3', '#b1bac4', '#7d8590', '#30363d', '#484f58', '#58a6ff', '#79c0ff', '#0d2742'),
  S('rosegold', 'Rose Gold', '#fbf0ee', '#fff8f7', '#f6e0dc', '#44262a', '#7a4a50', '#aa7f84', '#f0d6d2', '#ddb6b0', '#c76b6e', '#e1948f', '#f9dfdc'),
  S('lavender', 'Lavender Dusk', '#f3effa', '#faf8fe', '#e8e0f4', '#2f2440', '#564875', '#8579a0', '#ded3ef', '#c2b1e0', '#7d5bbe', '#a287d8', '#ece2fa'),
  S('mint', 'Fresh Mint', '#edf8f2', '#f8fdfa', '#dbf0e5', '#1c3a2c', '#3f6b54', '#729784', '#cfe8da', '#a9d4bd', '#2d9e6b', '#5dbf92', '#def2e7'),
  S('charcoal', 'Charcoal Sketch', '#1c1c1c', '#262626', '#303030', '#eaeaea', '#c2c2c2', '#8e8e8e', '#383838', '#4e4e4e', '#bdbdbd', '#e0e0e0', '#333333'),
  S('tomato', 'Tomato Garden', '#fdf2ec', '#fffaf7', '#f8e0d4', '#3e2117', '#6f4433', '#a1745f', '#f0d3c4', '#ddb199', '#d6452c', '#ee7152', '#fadcd2'),
  S('espresso', 'Espresso Bar', '#211713', '#2c1f19', '#3a2a21', '#f2e8e1', '#d4bfb1', '#9e8a7c', '#453226', '#5f4636', '#b07b4f', '#d1a071', '#3a2a1a'),
  S('glacier', 'Glacier', '#eff6fa', '#f9fcfe', '#dfecf4', '#1c3240', '#436173', '#78919f', '#d2e4ee', '#b0cdde', '#2f8fbe', '#64b4d9', '#ddeef7'),
  S('meadow', 'Meadow', '#f4f8e8', '#fbfdf4', '#e7f0d0', '#2c3a14', '#55682e', '#879a5e', '#dce8c0', '#c2d496', '#6c9a2f', '#93bd55', '#e9f2d4'),
]

const KEY = 'writerscompanion.skin'

export function savedSkin(): string {
  try {
    return localStorage.getItem(KEY) || 'default'
  } catch {
    return 'default'
  }
}

export function applySkin(id: string) {
  const skin = SKINS.find((s) => s.id === id) || SKINS[0]
  const root = document.documentElement
  // clear previous overrides, then set this skin's
  for (const s of SKINS) for (const k of Object.keys(s.vars)) root.style.removeProperty(k)
  for (const [k, v] of Object.entries(skin.vars)) root.style.setProperty(k, v)
  root.setAttribute('data-skin', skin.id)
  try {
    localStorage.setItem(KEY, skin.id)
  } catch {
    /* private mode */
  }
}
