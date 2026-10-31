import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { installLayoutCss } from './layout/pageCss'
import { TARGET } from './target'
import { prefetchGroup } from './fonts/catalog'
import { applySkin, savedSkin } from './ui/skins'
import { App } from './App.tsx'

// the editable book stylesheet loads last so it overrides the defaults
installLayoutCss()
// expose the platform target to CSS and to the export shims
document.documentElement.dataset.target = TARGET
prefetchGroup('Book text — serif')
// repaint with the saved skin before first render so there is no flash
applySkin(savedSkin())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
