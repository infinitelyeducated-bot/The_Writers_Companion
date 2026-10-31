// Generate the PWA / store icons from one drawing, at every size needed.
const { chromium } = require('playwright-core')
const fs = require('fs')
const path = require('path')

const svg = (maskable) => {
  const pad = maskable ? 0.16 : 0.06          // maskable icons need a safe margin
  const s = 1 - pad * 2
  const book = `
    <g transform="translate(${pad * 512} ${pad * 512}) scale(${s})">
      <rect width="512" height="512" rx="${maskable ? 0 : 96}" fill="#1d2b3a"/>
      <g fill="none" stroke="#d8b25e" stroke-width="18" stroke-linecap="round">
        <path d="M256 150c-42-26-96-30-136-16v230c40-14 94-10 136 16"/>
        <path d="M256 150c42-26 96-30 136-16v230c-40-14-94-10-136 16"/>
        <path d="M256 150v230"/>
      </g>
      <circle cx="256" cy="404" r="10" fill="#d8b25e"/>
    </g>`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${book}</svg>`
}

;(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  const page = await (await browser.newContext()).newPage()
  const out = path.join(__dirname, '..', 'public', 'icons')
  fs.mkdirSync(out, { recursive: true })
  const jobs = [
    ['icon-192.png', 192, false],
    ['icon-512.png', 512, false],
    ['icon-512-maskable.png', 512, true],
    ['apple-touch-icon.png', 180, false],
    ['favicon-32.png', 32, false],
  ]
  for (const [name, size, maskable] of jobs) {
    const svgText = svg(maskable)
    await page.setViewportSize({ width: size, height: size })
    await page.setContent(`<body style="margin:0;background:transparent">${svgText.replace('width="512" height="512"', `width="${size}" height="${size}"`)}</body>`)
    await page.screenshot({ path: path.join(out, name), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } })
    console.log('wrote', name, size)
  }
  // also a plain SVG favicon
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), svg(false))
  await browser.close()
})()
