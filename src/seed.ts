import { useEffect } from 'react'
import { db, saveProject } from './db/db'
import { newProject } from './model/types'
import { demoDoc } from './data/demo'
import { coverColor } from './ui/Library'
import { EXAMPLES, buildExample } from './data/examples'

/** Seed a demo book once, so the app is never an empty shell on first run.
 *  Disabled until the freeware licence is accepted, so declining leaves no trace. */
export function useSeedDemo(enabled = true) {
  useEffect(() => {
    if (!enabled) return
    void (async () => {
      const count = await db.projects.count()
      if (count > 0) return
      const p = newProject({
        title: 'The Keeping of the Light',
        subtitle: 'A novella',
        author: 'Mara Ellsworth',
        genre: 'Literary Fiction',
        publisher: 'Writers Companion Press',
        copyrightYear: '2026',
        description: 'A lighthouse keeper, a historian, and eleven days the records chose to forget.',
      })
      p.doc = demoDoc()
      p.coverHex = coverColor(p.id)
      p.settings.cover.background = '#1b2a33'
      p.settings.cover.accentColor = '#d8b25e'
      await saveProject(p)
      // one worked example per layout family, so the library shows the range
      for (const ex of EXAMPLES) {
        const e = buildExample(ex.id)
        e.id = 'proj_ex_' + ex.id
        e.meta.notes = `[example:${ex.id}] A worked example of the ${ex.name} layout. Edit freely, or duplicate it to start your own book.`
        await saveProject(e)
      }
    })()
  }, [enabled])
}
