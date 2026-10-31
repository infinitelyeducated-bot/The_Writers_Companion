import { useProject } from '../state/project'
import { artForPage, hasPagePicture, pageForKey } from '../pageArt'

/**
 * Page navigator for the bottom status frame: steps the interior page that
 * Write works on (its picture shows under the type, its number sits at the
 * bottom of the page), says whether that page has a picture, and can jump
 * straight to the next page that has one.
 */
export function PageNavigator({ page, onPage, pageCount }: { page: number; onPage: (n: number) => void; pageCount: number }) {
  const { project } = useProject()
  const map = project.settings.pageArt || {}
  const keys = project.lastPaginated?.keys
  const allKey = project.settings.pageArtAllKey
  const max = pageCount > 0 ? pageCount : Infinity
  const go = (n: number) => onPage(Math.max(1, Math.min(max, n)))

  const withArt = Object.keys(map)
    .filter((k) => hasPagePicture(map[k]))
    .map((k) => pageForKey(k, keys))
    .filter((n) => n > 0)
    .sort((a, b) => a - b)
  const has = hasPagePicture(allKey ? map[allKey] : artForPage(map, page, keys))
  const nextArt = withArt.find((n) => n > page) ?? withArt[0]

  return (
    <span
      className="pagenav"
      title="Page navigator — steps the interior page Write is working on. Its picture shows under the type and its number sits at the bottom of the page."
    >
      <button type="button" className="btn tiny ghost" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Previous page">‹</button>
      <input
        type="number"
        min={1}
        max={pageCount || undefined}
        value={page}
        onChange={(e) => go(Number(e.target.value) || 1)}
        aria-label="Interior page"
      />
      <button type="button" className="btn tiny ghost" onClick={() => go(page + 1)} disabled={page >= max} aria-label="Next page">›</button>
      <button
        type="button"
        className={'pagenav-art' + (has ? ' on' : '')}
        disabled={!withArt.length}
        onClick={() => nextArt && go(nextArt)}
        title={
          allKey
            ? 'One picture is applied to every page (Picture → Use selected image for all pages).'
            : withArt.length
              ? `${has ? 'This page has a picture.' : 'No picture on this page.'} Click to jump to the next page that has one (${withArt.length} in the book).`
              : 'No page in this book has a picture yet — add one from the Picture tab.'
        }
      >
        {has ? '▣ has picture' : '□ no picture'}
      </button>
    </span>
  )
}
