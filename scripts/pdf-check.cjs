// Capture the interior PDF the way Chrome's print dialog would produce it.
// (Headless "print to PDF" is the same pipeline: the page's @page CSS defines
// sheet size and the print stylesheet defines the page boxes.)
const { chromium } = require('playwright-core')
const path = require('path')

;(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
  const out = path.join(process.env.TMPDIR || '.', 'shots')
  require('fs').mkdirSync(out, { recursive: true })

  await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.locator('.book-cover').first().click()
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: 'Print layout' }).click()
  await page.waitForTimeout(3000)

  const popupPromise = page.waitForEvent('popup')
  await page.getByRole('button', { name: /Interior PDF/ }).click()
  const popup = await popupPromise
  await popup.waitForLoadState('domcontentloaded')
  await popup.waitForTimeout(4500)
  const sheets = await popup.locator('.print-sheet').count()
  const firstText = await popup.locator('.print-sheet').nth(8).innerText()
  console.log('sheets:', sheets, '| page 9 text:', JSON.stringify(firstText.slice(0, 80)))
  // crop marks / bleed off by default; capture the print media layout
  await popup.emulateMedia({ media: 'print' })
  await popup.waitForTimeout(500)
  const overflow = await popup.evaluate(() => {
    const r = []
    document.querySelectorAll('.print-sheet').forEach((s, i) => {
      const pg = s.querySelector('.book-page')
      const body = s.querySelector('.page-body')
      if (!pg || !body) return
      const cs = getComputedStyle(pg)
      const avail = pg.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
      const used = Math.ceil(body.getBoundingClientRect().height)
      if (used > avail + 4) r.push({ page: i + 1, used, avail })
    })
    return r
  })
  console.log('print overflow:', JSON.stringify(overflow))
  await popup.pdf({ path: path.join(out, 'interior.pdf'), width: '6in', height: '9in', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } })
  console.log('pdf written')
  console.log('ERRORS:', errors.length ? errors.join('\n') : 'none')
  await browser.close()
})().catch((e) => { console.error('FATAL', e); process.exit(1) })
