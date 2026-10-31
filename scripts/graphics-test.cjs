const { chromium } = require('playwright-core')
const path = require('path')
const fs = require('fs')

// build a small vignette PNG (ornamental flourish) and a tall sidebar JPG-ish PNG
function png(w, h, draw) {
  // write via canvas in the browser instead — simpler: use an SVG data URL uploaded as a file
  return null
}
;(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  const page = await (await browser.newContext({ viewport: { width: 1600, height: 1000 } })).newPage()
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message))
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()) })
  const out = path.join(process.env.TMPDIR || '.', 'shots')
  await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.locator('.book-cover').first().click()
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: 'Print layout' }).click()
  await page.waitForTimeout(2500)

  // generate two PNGs in-page and hand them to the uploader via DataTransfer
  const upload = async (label, svg) => {
    const dataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
    // upload via the file input inside the settings column; find the one in the graphics section
    const input = page.locator('.settings-col input[type=file]').first()
    const b64 = dataUrl.split(',')[1]
    await input.setInputFiles({ name: label + '.svg', mimeType: 'image/svg+xml', buffer: Buffer.from(Buffer.from(b64, 'base64')) })
    await page.waitForTimeout(1200)
  }

  await page.locator('.field:has-text("Artwork treatment") select').selectOption('vignette')
  await page.waitForTimeout(500)
  await upload('flourish', '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="300"><g fill="none" stroke="#7a5b2e" stroke-width="6"><path d="M20 150c60-90 140-90 200 0 60-90 140-90 200 0"/><path d="M40 190h300"/></g></svg>')
  await page.waitForTimeout(2500)
  await page.locator('label:has-text("All pages") input').click()
  await page.waitForTimeout(2500)
  await page.screenshot({ path: path.join(out, "g1-vignette.png") }); console.log("vignettes:", await page.evaluate(() => document.querySelectorAll(".page-vignette").length), "pages:", await page.evaluate(() => document.querySelectorAll(".book-page").length))
  await page.locator('label:has-text("All pages") input').click()
  await page.waitForTimeout(1200)
  console.log('pages with vignette:', await page.evaluate(() => document.querySelectorAll('.page-vignette').length))

  // sidebar
  await page.locator('.field:has-text("Artwork treatment") select').selectOption('sidebar')
  await page.waitForTimeout(400)
  await upload('plate', '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="1400"><rect width="500" height="1400" fill="#2f4636"/><circle cx="250" cy="500" r="140" fill="none" stroke="#d8b25e" stroke-width="10"/><path d="M120 900h260M120 980h260M120 1060h200" stroke="#d8b25e" stroke-width="8"/></svg>')
  await page.waitForTimeout(2500)
  await page.locator('label:has-text("All pages") input').click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(out, 'g2-sidebar.png') })
  await page.locator('label:has-text("All pages") input').click()
  await page.waitForTimeout(800)
  console.log('pages with sidebar:', await page.evaluate(() => document.querySelectorAll('.page-sidebar').length))

  // plate
  await page.locator('.field:has-text("Artwork treatment") select').selectOption('plate')
  await page.waitForTimeout(400)
  await upload('plate2', '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500"><rect width="1200" height="1500" fill="#efe6d4"/><circle cx="600" cy="600" r="320" fill="none" stroke="#7a5b2e" stroke-width="14"/><path d="M300 1200h600" stroke="#7a5b2e" stroke-width="10"/></svg>')
  await page.waitForTimeout(2500)
  await page.locator('label:has-text("All pages") input').click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(out, 'g3-plate.png') })
  console.log('plate pages:', await page.evaluate(() => document.querySelectorAll('.ptype-plate').length))
  console.log('page count label:', await page.locator('.preview-toolbar .muted').first().innerText())
  await browser.close()
})()
