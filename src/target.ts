/**
 * Platform target.
 *
 * Three single-file builds are produced — desktop, Android, iOS — from the same
 * source. `__WC_TARGET__` is replaced at build time by `scripts/build-targets.mjs`
 * (and is 'web' in the hosted/PWA build). The differences are deliberately
 * small and behavioural rather than cosmetic:
 *
 *   pc      — a print window plus Save-as-PDF, the full three-column workspace.
 *   android — saving goes through the share sheet (downloads are unreliable in
 *             a WebView); no print window, since phone browsers cannot print
 *             a PDF reliably.
 *   ios     — same save path as Android, plus the iOS safe-area insets and the
 *             "standalone" viewport corrections Apple's WebView needs.
 */
declare const __WC_TARGET__: string | undefined

export type Target = 'web' | 'pc' | 'android' | 'ios'

export const TARGET: Target = (() => {
  try {
    return (typeof __WC_TARGET__ === 'string' ? __WC_TARGET__ : 'web') as Target
  } catch {
    return 'web'
  }
})()

export const isTouch = () => TARGET === 'android' || TARGET === 'ios'
export const canOpenPrintWindow = () => TARGET === 'pc' || TARGET === 'web'

/** Label shown on export buttons, because "download" is a lie on a phone. */
export const saveVerb = () => (isTouch() ? 'Share' : 'Download')
