const { chromium } = require('playwright-core')
const path = require('path')

;(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 }, acceptDownloads: true })
  const page = await ctx.newPage()
  const errors = []
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()) })
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
  const out = path.join(process.env.TMPDIR || '.', 'shots')
  require('fs').mkdirSync(out, { recursive: true })

  await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.screenshot({ path: path.join(out, '01-library.png'), fullPage: true })
  console.log('library cards:', await page.locator('.book-card').count())

  await page.locator('.book-cover').first().click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(out, '02-write.png') })
  console.log('tree rows:', await page.locator('.tree-row').count())
  console.log('editor text len:', (await page.locator('.manuscript').innerText().catch(() => '')).length)

  await page.locator('.manuscript').click()
  await page.keyboard.press('Control+End')
  await page.keyboard.type(' "Test -- dashes ..." ')
  await page.waitForTimeout(900)
  const typed = await page.locator('.manuscript').innerText()
  console.log('typed tail:', JSON.stringify(typed.slice(-40)))

  await page.getByRole('button', { name: 'Print layout' }).click()
  await page.waitForTimeout(4000)
  await page.screenshot({ path: path.join(out, '03-print.png') })
  console.log('pages:', await page.locator('.preview-toolbar .muted').first().innerText())
  console.log('checks:', await page.locator('.check').count())

  await page.locator('label:has-text("All pages") input').click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(out, '04-allpages.png') })
  await page.locator('.all-pages .thumb').nth(9).scrollIntoViewIfNeeded()
  await page.waitForTimeout(600)
  await page.screenshot({ path: path.join(out, '04b-allpages.png') })

  await page.getByRole('button', { name: 'Cover', exact: true }).click()
  await page.waitForTimeout(1200)
  await page.screenshot({ path: path.join(out, '05-cover.png') })

  await page.getByRole('button', { name: 'Export' }).click()
  await page.waitForTimeout(800)
  await page.screenshot({ path: path.join(out, '06-export.png') })
  console.log('before epub, errors:', errors.join(' || ') || 'none')
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
    const buf = await b.arrayBuffer()
    let s = ''
    const bytes = new Uint8Array(buf)
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
    return btoa(s)
  })
  const epubPath = path.join(out, 'book.epub')
  require('fs').writeFileSync(epubPath, Buffer.from(b64, 'base64'))
  console.log('epub saved:', epubPath, require('fs').statSync(epubPath).size)
  await page.waitForTimeout(500)
  console.log('log:', (await page.locator('.log-line').allInnerTexts()).join(' || '))

  console.log('ERRORS:', errors.length ? errors.join('\n') : 'none')
  await browser.close()
})().catch((e) => { console.error('FATAL', e); process.exit(1) })
