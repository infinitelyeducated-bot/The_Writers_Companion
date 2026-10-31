import { useEffect } from 'react'
import { APP_SNAPSHOT_MINUTES, createAppSnapshot } from '../db/db'

/**
 * Whole-app safety snapshots. Every five minutes (and once shortly after the app
 * opens, and once as the window is hidden or closed) the entire library is copied
 * into its own table: every book, its notes and its pictures. A snapshot is skipped
 * when nothing has changed since the last one. The newest twelve are kept, which is
 * an hour of history. Restore any of them from the Library → App snapshots dialog.
 *
 * This is separate from each book's own version history (Snapshot now, in the
 * editor): that protects one manuscript; this protects the whole workspace.
 */
export function useAppSnapshots(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const take = (label: string) => void createAppSnapshot(label).catch(() => {})
    const first = window.setTimeout(() => take('Session start'), 8000)
    const every = window.setInterval(() => take('Every 5 minutes'), APP_SNAPSHOT_MINUTES * 60 * 1000)
    const onHide = () => {
      if (document.visibilityState === 'hidden') take('Window hidden')
    }
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(every)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [enabled])
}
