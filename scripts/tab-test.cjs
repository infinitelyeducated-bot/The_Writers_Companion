const { chromium } = require('playwright-core')
;(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 } })).newPage()
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message))
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()) })

  // fresh origin so the poetry example is the first card
  await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  const poetry = page.locator('.example-card', { hasText: 'Poetry collection' })
  await poetry.locator('button', { hasText: 'Open example' }).click()
  await page.waitForTimeout(1500)

  const ed = page.locator('.manuscript')
  await ed.click()
  await page.keyboard.press('Control+End')
  await page.keyboard.press('Enter')
  await page.keyboard.type('indented line')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Home')
  await page.keyboard.press('Tab')
  await page.keyboard.type('tabbed line')

  const html = await ed.innerHTML()
  const paras = await page.evaluate(() => [...document.querySelectorAll('.manuscript p')].slice(-3).map((p) => p.textContent))
  console.log('last paragraphs:', JSON.stringify(paras))
  console.log('contains nbsp:', html.includes('\u00a0'))
  console.log('nbsp run of 4:', /(\u00a0){4}/.test(html))

  // shift-tab removes them
  await page.keyboard.press('Shift+Tab')
  console.log('after shift-tab:', JSON.stringify((await page.evaluate(() => [...document.querySelectorAll('.manuscript p')].slice(-3).map((p) => p.textContent)))))

  // what the print page shows
  await page.getByRole('button', { name: 'Print layout' }).click()
  await page.waitForTimeout(3500)
  await page.locator('label:has-text("All pages") input').click()
  await page.waitForTimeout(1500)
  const printed = await page.evaluate(() => {
    const pages = [...document.querySelectorAll('.book-page')]
    const last = pages[pages.length - 1].innerText
    return last
  })
  console.log('print spoiler (last page):', JSON.stringify(printed.slice(0, 160)))
  console.log('ordinary spaces on the page:', /\u00a0/.test(printed) ? 'NO - nbsp leaked' : 'yes')
  await browser.close()
})()
