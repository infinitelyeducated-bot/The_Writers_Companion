const { chromium } = require('playwright-core');
const path = require('path');
const file = 'file:///' + path.resolve(__dirname, '..', 'dist-selfcontained', 'pc', 'The_Writers_Companion_pc.html').replace(/\\/g, '/');
(async () => {
    const b = await chromium.launch({ headless: true });
    const ctx = await b.newContext({ viewport: { width: 1500, height: 950 }, acceptDownloads: true });
    const pg = await ctx.newPage();
    const errs = []; pg.on('pageerror', e => errs.push(e.message));
    pg.on('dialog', d => d.accept(d.type() === 'prompt' ? d.defaultValue() : undefined));
    await pg.addInitScript(() => {
        window.__saved = [];
        window.showSaveFilePicker = async (o) => ({ name: o.suggestedName, createWritable: async () => { const c = []; return { write: async (x) => c.push(x), close: async () => { window.__saved.push({ name: o.suggestedName, size: new Blob(c).size, desc: o.types && o.types[0].description }); } }; } });
    });
    await pg.goto(file); await pg.waitForTimeout(1500);
    await pg.getByRole('button', { name: /Yes/ }).first().click(); await pg.waitForTimeout(2200);
    await pg.locator('.example-card').first().locator('button', { hasText: 'Open example' }).click(); await pg.waitForTimeout(1500);
    await pg.getByRole('button', { name: 'Export', exact: true }).click(); await pg.waitForTimeout(1200);
    const r = {};
    const run = async (label, name) => { await pg.getByRole('button', { name }).first().click(); await pg.waitForTimeout(2500); };
    await run('docx', /Export \.docx/); await run('md', /Export \.md/); await run('epub', /Export EPUB 3/);
    await pg.getByRole('button', { name: /Backup project/ }).first().click(); await pg.waitForTimeout(1000);
    r.viaSaveDialog = await pg.evaluate(() => window.__saved.map(s => `${s.name} (${s.desc}, ${s.size} B)`));
    // toggle off -> straight download
    await pg.getByLabel(/Ask me where to save/).uncheck();
    const [dl] = await Promise.all([pg.waitForEvent('download'), pg.getByRole('button', { name: /Export \.md/ }).click()]);
    r.toggleOffDownloadsDirectly = dl.suggestedFilename();
    r.noExtraSaveDialog = (await pg.evaluate(() => window.__saved.length)) === r.viaSaveDialog.length;
    r.activityLog = (await pg.locator('.export-log .log-line').allTextContents()).slice(0, 4);
    // cancel path: picker rejects with AbortError
    await pg.getByLabel(/Ask me where to save/).check();
    await pg.evaluate(() => { window.showSaveFilePicker = async () => { const e = new Error('x'); e.name = 'AbortError'; throw e; }; });
    await pg.getByRole('button', { name: /Export \.docx/ }).click(); await pg.waitForTimeout(1500);
    r.cancelLogged = (await pg.locator('.export-log .log-line').first().textContent()).includes('cancelled');
    r.errors = errs.slice(0, 2);
    console.log(JSON.stringify(r, null, 1));
    await b.close();
})();
