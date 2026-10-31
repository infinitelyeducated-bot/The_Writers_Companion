const { chromium } = require('playwright-core')
const path = require('path')
;(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1050 } })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message))
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()) })
  const out = path.join(process.env.TMPDIR, 'shots')
  await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2000)
  console.log('books on shelf:', await page.locator('.book-card').count())
  console.log('examples:', await page.locator('.example-card').count())
  await page.screenshot({ path: path.join(out, 'x0-library.png'), fullPage: false })

  const ids = await page.evaluate(() => {
    return [...document.querySelectorAll('.example-card .ex-name')].map((e) => e.textContent)
  })
  console.log('families:', ids.join(' | '))

  // open each example and check pagination + trim
  for (let i = 0; i < 7; i++) {
    await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1200)
    const card = page.locator('.example-card').nth(i)
    const name = await card.locator('.ex-name').innerText()
    await card.locator('button', { hasText: 'Open example' }).click()
    await page.waitForTimeout(1500)
    await page.getByRole('button', { name: 'Print layout' }).click()
    await page.waitForTimeout(3500)
    await page.locator('label:has-text("All pages") input').click()
    await page.waitForTimeout(1500)
    const stats = await page.locator('.preview-toolbar .muted').first().innerText()
    const over = await page.evaluate(() => {
      let n = 0
      document.querySelectorAll('.all-pages .book-page').forEach((el) => {
        const body = el.querySelector('.page-body')
        if (!body) return
        const cs = getComputedStyle(el)
        const avail = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
        if (body.getBoundingClientRect().height > avail + 4) n++
      })
      return n
    })
    console.log(`${name}: ${stats} | pages=${await page.locator('.all-pages .book-page').count()} | overflowing=${over}`)
    await page.screenshot({ path: path.join(out, `x${i + 1}-${name.split(' ')[0].toLowerCase()}.png`) })
  }
  await browser.close()
})()
