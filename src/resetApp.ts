// "Reset The Writers Companion to default": erase everything this copy of The Writers Companion has
// stored in this browser — every book, picture, note and snapshot, plus the
// interface preferences (skin, menu font, goals-box and toolbar positions) —
// and reload. On an empty library the app seeds the sample novella and the
// seven worked examples again, so the result is The Writers Companion as first opened.
//
// The licence acceptance is cleared too, so the first-launch agreement shows
// again, exactly as on a fresh install.

import { db } from './db/db'

/** Every key The Writers Companion keeps outside IndexedDB starts with this prefix. */
const PREFIX = 'writerscompanion.'

function clearPrefixed(store: Storage) {
  const keys: string[] = []
  for (let i = 0; i < store.length; i++) {
    const k = store.key(i)
    if (k && k.startsWith(PREFIX)) keys.push(k)
  }
  keys.forEach((k) => store.removeItem(k))
}

export async function resetWritersCompanion(): Promise<void> {
  // all four tables in one transaction: a half-erased library is worse than
  // a failed reset
  await db.transaction('rw', db.projects, db.assets, db.notes, db.snapshots, db.appSnapshots, async () => {
    await Promise.all([db.projects.clear(), db.assets.clear(), db.notes.clear(), db.snapshots.clear(), db.appSnapshots.clear()])
  })
  try {
    clearPrefixed(localStorage)
    clearPrefixed(sessionStorage)
  } catch {
    /* storage unavailable: the books are gone, preferences may linger */
  }
  // drop any open book from the address so the reload lands on the library
  location.hash = ''
  location.reload()
}
