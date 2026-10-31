// Layout verification: dumps pagination structure + measures every page's
// rendered content against its text block (overflow detection).
const { chromium } = require('playwright-core')
const path = require('path')

;(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()) })
  const out = path.join(process.env.TMPDIR || '.', 'shots')
  require('fs').mkdirSync(out, { recursive: true })

  await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await page.locator('.book-cover').first().click()
  await page.waitForTimeout(1200)
  await page.getByRole('button', { name: 'Print layout' }).click()
  await page.waitForTimeout(3000)
  await page.locator('label:has-text("All pages") input').click()
  await page.waitForTimeout(1500)

  const report = await page.evaluate(() => {
    const out = []
    document.querySelectorAll('.all-pages .book-page').forEach((el) => {
      const body = el.querySelector('.page-body')
      const cs = getComputedStyle(el)
      const pt = parseFloat(cs.paddingTop)
      const pb = parseFloat(cs.paddingBottom)
      const head = el.querySelector('.run-head')
      const headH = head ? parseFloat(getComputedStyle(head).fontSize) * 1.4 + 8 : 0
      const avail = el.clientHeight - pt - pb - headH
      const used = body ? Math.ceil(body.getBoundingClientRect().height) : 0
      out.push({
        page: el.getAttribute('data-page'),
        type: (el.className.match(/ptype-(\w+)/) || [])[1],
        side: el.classList.contains('recto') ? 'R' : 'V',
        folio: (el.querySelector('.folio') || {}).textContent || '',
        head: (el.querySelector('.run-head') || {}).textContent || '',
        avail: Math.round(avail),
        used: Math.round(used),
        over: Math.round(used - avail),
        first: body ? (body.textContent || '').trim().slice(0, 46).replace(/\s+/g, ' ') : '',
        last: body ? Array.from(body.children).slice(-2).map((c) => (c.textContent || '').trim().slice(-30).replace(/\s+/g, ' ')).join(' // ') : '',
        fns: el.querySelectorAll('.page-fn').length,
        html: body ? body.innerHTML.slice(0, 1200) : '',
      })
    })
    return out
  })
  console.log('page | type | side | folio | head | avail | used | over | first text')
  for (const r of report) {
    const flag = r.over > 4 ? '  <<< OVERFLOW' : ''
    console.log([r.page, r.type, r.side, r.folio, r.head.slice(0, 18), r.avail, r.used, r.over, r.first].join(' | ') + flag)
    if (r.over > 4) { console.log('      last:', r.last, ' fns:', r.fns); console.log('      html:', r.html.replace(/style="[^"]*"/g, '')) }
  }
  const toc = await page.evaluate(() => {
    const t = []
    document.querySelectorAll('.toc-line').forEach((l) => t.push(l.innerText.replace(/\s+/g, ' ')))
    return t
  })
  console.log('TOC:', JSON.stringify(toc))
  console.log('ERRORS:', errors.length ? errors.join('\n') : 'none')
  await browser.close()
})().catch((e) => { console.error('FATAL', e); process.exit(1) })
