const { chromium } = require('playwright-core')
;(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  for (const [ch, pa] of [[100, 10], [400, 12], [900, 12]]) {
    const page = await (await browser.newContext({ viewport: { width: 1200, height: 900 } })).newPage()
    page.on('pageerror', (e) => console.log('PAGEERROR', e.message))
    await page.goto('http://localhost:5180/stress.html', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)
    await page.fill('#chapters', String(ch))
    await page.fill('#paras', String(pa))
    const t0 = Date.now()
    await page.click('#run')
    await page.waitForFunction(() => document.querySelector('#out').textContent.includes('heap after'), null, { timeout: 300000 })
    const txt = await page.locator('#out').innerText()
    console.log(`--- ${ch} chapters x ${pa} paras  (wall ${Date.now() - t0} ms) ---\n${txt}`)
    await page.close()
  }
  await browser.close()
})()
