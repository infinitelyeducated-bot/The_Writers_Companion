const { chromium } = require('playwright-core')
;(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 } })).newPage()
  await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.locator('.book-cover').first().click()
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: 'Print layout' }).click()
  await page.waitForTimeout(2500)
  await page.locator('label:has-text("All pages") input').click()
  await page.waitForTimeout(800)
  console.log(await page.evaluate(() => {
    const out = []
    for (const sel of ['.preview-scroll', '.all-pages-wrap', '.all-pages', '.thumb', '.page-slot', '.book-page']) {
      const el = document.querySelector(sel)
      if (!el) { out.push(sel + ' MISSING'); continue }
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      out.push(`${sel} w=${Math.round(r.width)} h=${Math.round(r.height)} x=${Math.round(r.x)} display=${cs.display} cols=${cs.gridTemplateColumns.slice(0,60)} zoom=${cs.zoom}`)
    }
    return out.join('\n')
  }))
  await browser.close()
})()
