const { chromium } = require('playwright-core')
const path = require('path')
;(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.locator('.book-cover').first().click()
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: 'Print layout' }).click()
  await page.waitForTimeout(3000)
  const popupPromise = page.waitForEvent('popup')
  await page.getByRole('button', { name: /Interior PDF/ }).click()
  const popup = await popupPromise
  await popup.waitForTimeout(4000)
  const html = await popup.evaluate(() => {
    const pg = document.querySelectorAll('.book-page')[6]
    return pg.outerHTML
  })
  require('fs').writeFileSync(path.join(process.env.TMPDIR, 'shots', 'toc-page.html'), html)
  console.log(html.length)
  await browser.close()
})()
