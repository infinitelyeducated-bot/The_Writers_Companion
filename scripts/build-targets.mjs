// Build a self-contained single-file app per target: PC, Android, iOS.
// Every target is one .html with all JS and CSS inlined, plus a small
// target-specific shell (manifest/jsdom hint may differ per platform, styling
// hooks, and a save/print shim for webviews).
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const targets = {
  pc: {
    label: 'Desktop',
    html: { appTitle: 'The Writers Companion — desktop', themeColor: '#1d2b3a' },
  },
  android: {
    label: 'Android',
    html: { appTitle: 'The Writers Companion', themeColor: '#1d2b3a', android: true },
  },
  ios: {
    label: 'iOS',
    html: { appTitle: 'The Writers Companion', themeColor: '#1d2b3a', ios: true },
  },
}

const hero = {
  pc: 'The Writers Companion — the whole book-making workspace, on your computer.',
  android: 'The Writers Companion for Android — write anywhere, lay out the book, print from a desktop.',
  ios: 'The Writers Companion for iOS — write and revise on the move; export the finished book from a Mac.',
}

for (const [id, t] of Object.entries(targets)) {
  const outDir = path.join(root, 'dist-selfcontained', id)
  await build({
    configFile: false,
    root,
    // no service worker in the single-file builds: the file is already offline
    plugins: [react(), viteSingleFile({ removeViteModuleLoader: true, inlinePattern: [] })],
    // index.html links the manifest for the hosted build; drop it here
    publicDir: false,
    define: {
      __WC_TARGET__: JSON.stringify(id),
    },
    build: {
      outDir,
      emptyOutDir: true,
      assetsInlineLimit: 100 * 1024 * 1024,
      cssCodeSplit: false,
      sourcemap: false,
      chunkSizeWarningLimit: 5000,
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  })
  // rename to a single deliverable and inject the platform shell
  const assets = fs.readdirSync(outDir)
  const html = assets.find((f) => f.endsWith('.html'))
  let doc = fs.readFileSync(path.join(outDir, html), 'utf8')
  doc = doc
    .replace(/<link rel="manifest"[^>]*>\s*/, '')
    .replace(/<link[^>]*icons?\/[^>]*>\s*/g, '')
    .replace(/<link[^>]*favicon[^>]*>\s*/g, '')
    .replace(/<title>.*?<\/title>/, `<title>${t.html.appTitle}</title>`)
    .replace('</head>', `  <meta name="wc-target" content="${id}" />\n  <meta name="description" content="${hero[id]}" />\n  </head>`)
    .replace('<html lang="en">', `<html lang="en" data-target="${id}">`)
  fs.writeFileSync(path.join(outDir, `The_Writers_Companion_${id}.html`), doc)
  // keep only the single file
  for (const f of fs.readdirSync(outDir)) {
    if (f !== `The_Writers_Companion_${id}.html`) fs.rmSync(path.join(outDir, f), { recursive: true, force: true })
  }
  // image_folder sits beside the launcher: originals saved from the Picture
  // panel belong here, untouched, for faster reuse across books
  const imgDir = path.join(outDir, 'image_folder')
  fs.mkdirSync(imgDir, { recursive: true })
  fs.writeFileSync(
    path.join(imgDir, 'README.txt'),
    'The Writers Companion image_folder\n\nSaving to this folder preserves the original Image file from any alterations and/or for faster reuse.\n\nWhen "Save to image_folder" asks where to put the file, choose this directory.\n',
  )
  const size = fs.statSync(path.join(outDir, `The_Writers_Companion_${id}.html`)).size
  console.log(`${id.padEnd(8)} → dist-selfcontained/${id}/The_Writers_Companion_${id}.html  ${(size / 1024 / 1024).toFixed(2)} MB`)
}
