const { chromium } = require('playwright-core')
const path = require('path')
;(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()) })
  const base = 'http://127.0.0.1:8080'
  // 1st visit: install the service worker
  await page.goto(base + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  const sw = await page.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration()
    return { registered: !!r, active: !!(r && r.active), scope: r && r.scope }
  })
  console.log('service worker:', JSON.stringify(sw))
  const man = await page.evaluate(async () => (await fetch('/manifest.webmanifest')).json())
  console.log('manifest:', man.name, man.display, man.icons.length + ' icons')
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  // go offline and reload — proves the app shell is cached
  await ctx.setOffline(true)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  const offline = await page.evaluate(() => ({
    title: document.title,
    books: document.querySelectorAll('.book-card').length,
    examples: document.querySelectorAll('.example-card').length,
    online: navigator.onLine,
  }))
  console.log('OFFLINE reload:', JSON.stringify(offline))
  // and can we open a book + paginate offline?
  await page.locator('.book-cover').first().click()
  await page.waitForTimeout(1500)
  const w = await page.locator('.word-total').innerText()
  await page.getByRole('button', { name: 'Print layout' }).click()
  await page.waitForTimeout(4000)
  const pages = await page.locator('.preview-toolbar .muted').first().innerText()
  console.log('offline editing works:', w, '|', pages)
  await ctx.setOffline(false)
  await browser.close()
})()
