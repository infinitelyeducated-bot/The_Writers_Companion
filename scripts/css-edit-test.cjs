const { chromium } = require('playwright-core')
;(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 } })).newPage()
  await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2200)
  await page.locator('.book-card').first().locator('.book-cover').click()
  await page.waitForTimeout(1600)
  await page.getByRole('button', { name: 'Print layout' }).click()
  await page.waitForTimeout(4000)
  await page.locator('label:has-text("All pages") input').click()
  await page.waitForTimeout(1500)
  const applied = await page.evaluate(() => {
    const folio = document.querySelector('.book-page .folio[data-head="folio"]')
    const sb = document.querySelector('.book-page .sb')
    return {
      folioColor: folio ? getComputedStyle(folio).color : 'no folio visible',
      folioWeight: folio ? getComputedStyle(folio).fontWeight : null,
      sceneBreakColor: sb ? getComputedStyle(sb).color : 'no scene break visible',
      injected: !!document.getElementById('writerscompanion-user-css'),
    }
  })
  console.log('user css applied:', JSON.stringify(applied))
  await browser.close()
})()
