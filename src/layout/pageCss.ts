import css from './writerscompanion.css?inline'

/**
 * The user's book stylesheet, `src/layout/writerscompanion.css`, wrapped with one
 * tiny rule so it keeps working inside the separate print window used to make
 * the interior PDF.
 *
 * The wrapper matters because `.page-body` claims the full height of the page
 * and the PDF window measures it as a normal-flow block; without this rule a
 * user override that changes paragraph spacing would be measured against the
 * wrong box and pages could overflow. It is one line, and it only applies
 * where the page is not being measured for real.
 */
export const LAYOUT_CSS = `
.book-page-shell .page-body { height: 100%; overflow: visible; }
${css}
`

/** Inject the book stylesheet once, at the end of <head>, so it wins. */
export function installLayoutCss(doc: Document = document) {
  if (doc.getElementById('writerscompanion-user-css')) return
  const style = doc.createElement('style')
  style.id = 'writerscompanion-user-css'
  style.textContent = LAYOUT_CSS
  doc.head.appendChild(style)
}
