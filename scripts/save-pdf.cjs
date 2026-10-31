const { chromium } = require('playwright-core')
const fs = require('fs'), path = require('path')
;(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 } })).newPage()
  await page.goto('file:///' + path.resolve('dist-selfcontained/pc/The_Writers_Companion_pc.html').replace(/\\/g, '/'))
  await page.waitForTimeout(2500)
  await page.locator('.book-card').first().locator('.book-cover').click()
  await page.waitForTimeout(1500)
  await page.getByRole('button', { name: 'Print layout' }).click()
  await page.waitForTimeout(4000)
  // capture the EPUB blob the app produces, from the single-file build
  await page.getByRole('button', { name: 'Export' }).click()
  await page.waitForTimeout(800)
  await page.evaluate(() => {
    window.__blobs = []
    const orig = URL.createObjectURL.bind(URL)
    URL.createObjectURL = (b) => { window.__blobs.push(b); return orig(b) }
  })
  await page.getByRole('button', { name: /Export EPUB 3/ }).click()
  await page.waitForTimeout(3000)
  const b64 = await page.evaluate(async () => {
    const b = window.__blobs[window.__blobs.length - 1]
    if (!b) return null
    const buf = new Uint8Array(await b.arrayBuffer())
    let s = ''
    for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i])
    return btoa(s)
  })
  const out = path.join(process.env.TMPDIR, 'shots', 'single-pc.epub')
  fs.writeFileSync(out, Buffer.from(b64, 'base64'))
  const jszip = require('jszip')
  const zip = await jszip.loadAsync(fs.readFileSync(out))
  const names = Object.keys(zip.files)
  const mimetype = await zip.files.mimetype.async('string')
  console.log('EPUB from the single-file build:', fs.statSync(out).size, 'bytes |', names.length, 'entries | mimetype:', mimetype)
  console.log('has OPF/nav/NCX:', names.includes('OEBPS/content.opf'), names.includes('OEBPS/nav.xhtml'), names.includes('OEBPS/toc.ncx'))
  await browser.close()
})()
