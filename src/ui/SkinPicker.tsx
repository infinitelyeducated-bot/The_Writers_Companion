import { useEffect, useState } from 'react'
import { SKINS, applySkin, savedSkin } from './skins'

/** Dropdown that repaints the GUI. The book's pages never change. */
export function SkinPicker() {
  const [skin, setSkin] = useState<string>(() => savedSkin())

  useEffect(() => {
    applySkin(skin)
  }, [skin])

  return (
    <label
      className="skin-picker"
      title="Skins change the workspace around your book — panels, buttons, accents. The printed pages and exports are never affected."
    >
      <span className="skin-ico" aria-hidden="true">🎨</span>
      <select value={skin} onChange={(e) => setSkin(e.target.value)} aria-label="Workspace skin">
        {SKINS.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </label>
  )
}
