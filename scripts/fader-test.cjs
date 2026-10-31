const { chromium } = require('playwright-core')
const path = require('path')
// build a tiny animated GIF (2 frames) programmatically
function animGif() {
  // minimal 1x1 2-frame GIF89a
  const b = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
  return b
}
;(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 1050 } })).newPage()
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message))
  await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.locator('.book-cover').first().click()
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: 'Print layout' }).click()
  await page.waitForTimeout(2500)
  await page.locator('.field:has-text("Artwork treatment") select').selectOption('vignette')
  await page.waitForTimeout(500)
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="300"><g fill="none" stroke="#7a5b2e" stroke-width="8"><path d="M40 200c80-140 200-140 280 0 80-140 200-140 280 0"/><path d="M120 240h400"/></g></svg>'
  await page.locator('.settings-col input[type=file]').first().setInputFiles({ name: 'flourish.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(svg) })
  await page.waitForTimeout(800)
  // also upload an animated gif to check frame detection
  await page.locator('.settings-col input[type=file]').first().setInputFiles({ name: 'sparkle.gif', mimeType: 'image/gif', buffer: animGif() })
  await page.waitForTimeout(2500)
  await page.locator('.field:has-text("Size (in)") input').fill('1.4')
  await page.locator('.field:has-text("Size (in)") input').blur()
  await page.waitForTimeout(400)
  const fader = page.locator('.fader-track input[type=range]')
  console.log('faders:', await fader.count())
  await fader.first().fill('0.35')
  await page.waitForTimeout(2600)
  await page.locator('label:has-text("All pages") input').click()
  await page.waitForTimeout(2600)
  await page.screenshot({ path: path.join(process.env.TMPDIR, 'shots', 'fader.png') })
  console.log('vignettes:', await page.evaluate(() => document.querySelectorAll('.page-vignette').length))
  console.log('opacity applied:', await page.evaluate(() => {
    const v = document.querySelector('.page-vignette')
    return v ? v.style.opacity : 'none'
  }))
  console.log('asset note:', await page.locator('.asset-note').innerText().catch(() => 'none'))
  console.log('gif hint:', await page.locator('.hint:has-text("Animated GIF")').count())
  await browser.close()
})()
