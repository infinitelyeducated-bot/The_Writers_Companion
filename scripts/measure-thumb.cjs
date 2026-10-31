const { chromium } = require('playwright-core')
;(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 } })).newPage()
  await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  await page.locator('.book-cover').first().click()
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: 'Print layout' }).click()
  await page.waitForTimeout(3000)
  await page.locator('label:has-text("All pages") input').click()
  await page.waitForTimeout(1200)
  console.log(await page.evaluate(() => {
    const r = []
    document.querySelectorAll('.all-pages .page-slot').forEach((s, i) => {
      if (i > 2) return
      const shell = s.querySelector('.book-page-shell')
      const pg = s.querySelector('.book-page')
      r.push({ i, slot: s.getBoundingClientRect().width, shell: shell && shell.getBoundingClientRect().width, pg: pg && pg.getBoundingClientRect().width, cs: pg && getComputedStyle(pg).zoom })
    })
    return r
  }))
  await browser.close()
})()
