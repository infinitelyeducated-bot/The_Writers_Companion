const { chromium } = require('playwright-core')
;(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  const page = await (await browser.newContext({ viewport: { width: 1200, height: 900 } })).newPage()
  await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  const info = await page.evaluate(async () => {
    const est = await navigator.storage.estimate()
    return { quotaMB: Math.round(est.quota / 1048576), usageMB: Math.round(est.usage / 1048576), persisted: await navigator.storage.persisted() }
  })
  console.log('storage:', JSON.stringify(info))
  await browser.close()
})()
