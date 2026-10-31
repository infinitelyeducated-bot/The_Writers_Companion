const { chromium } = require('playwright-core')
const path = require('path')
const fs = require('fs')

const files = {
  pc: 'dist-selfcontained/pc/The_Writers_Companion_pc.html',
  android: 'dist-selfcontained/android/The_Writers_Companion_android.html',
  ios: 'dist-selfcontained/ios/The_Writers_Companion_ios.html',
}
const devices = { pc: { width: 1440, height: 900 }, android: { width: 412, height: 915 }, ios: { width: 390, height: 844 } }

;(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  for (const [id, file] of Object.entries(files)) {
    const ctx = await browser.newContext({ viewport: devices[id], acceptDownloads: true, isMobile: id !== 'pc', hasTouch: id !== 'pc' })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    // load from the filesystem — no server at all
    await page.goto('file:///' + path.resolve(file).replace(/\\/g, '/'))
    await page.waitForTimeout(2500)
    const info = await page.evaluate(() => ({
      target: document.documentElement.dataset.target,
      books: document.querySelectorAll('.book-card').length,
      examples: document.querySelectorAll('.example-card').length,
      external: [...document.querySelectorAll('script[src], link[rel=stylesheet]')].length,
      size: document.documentElement.outerHTML.length,
    }))
    await page.locator('.book-card').first().locator('.book-cover').click()
    await page.waitForTimeout(1500)
    if (id === 'pc') {
      await page.getByRole('button', { name: 'Print layout' }).click()
    } else {
      await page.locator('.mobile-tabs button', { hasText: 'Print' }).click()
    }
    await page.waitForTimeout(4000)
    const pages = await page.locator('.preview-toolbar .muted').first().innerText()
    const pdfBtn = await page.locator('.pt-right .btn.primary').last().innerText()
    await page.screenshot({ path: path.join(process.env.TMPDIR, 'shots', `single-${id}.png`), fullPage: false })
    console.log(`${id}: target=${info.target} books=${info.books} examples=${info.examples} external-refs=${info.external} | ${pages} | button="${pdfBtn.trim()}" | errors=${errors.length}`)
    if (errors.length) console.log('   ', errors.slice(0, 3).join(' | '))
    await ctx.close()
  }
  await browser.close()
})()
