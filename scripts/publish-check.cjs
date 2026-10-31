const { chromium } = require('playwright-core');
const path = require('path'), fs = require('fs'), os = require('os');
const JSZip = require('jszip');
const file = 'file:///' + path.resolve(__dirname, '..', 'dist-selfcontained', 'pc', 'The_Writers_Companion_pc.html').replace(/\\/g, '/');
(async () => {
    const b = await chromium.launch({ headless: true });
    const pg = await (await b.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
    const errs = []; pg.on('pageerror', e => errs.push(e.message));
    pg.on('dialog', d => d.accept());
    await pg.addInitScript(() => {
        window.__saved = [];
        window.showSaveFilePicker = async (o) => ({ name: o.suggestedName, createWritable: async () => { const c = []; return { write: async (x) => c.push(x), close: async () => { const bl = new Blob(c); const buf = await bl.arrayBuffer(); window.__saved.push({ name: o.suggestedName, b64: btoa(String.fromCharCode(...new Uint8Array(buf))) }); } }; } });
    });
    await pg.goto(file); await pg.waitForTimeout(1500);
    await pg.getByRole('button', { name: /Yes/ }).first().click(); await pg.waitForTimeout(2200);
    await pg.locator('.example-card').first().locator('button', { hasText: 'Open example' }).click(); await pg.waitForTimeout(1500);
    await pg.getByRole('button', { name: 'Export', exact: true }).click(); await pg.waitForTimeout(1200);
    const r = {};
    r.panelShown = (await pg.locator('.publish-card').count()) === 1;
    r.readiness = (await pg.locator('.pub-line').allTextContents()).map(t => t.replace(/\s+/g, ' ').slice(0, 90));
    r.storeBoxes = await pg.locator('.pub-store').count();
    await pg.getByRole('button', { name: 'Select all' }).click();
    await pg.locator('.pub-preview-select').selectOption('kdp'); await pg.waitForTimeout(300);
    const listing = await pg.locator('.pub-listing').textContent();
    r.kdpListingHasFields = ['TITLE', 'AUTHOR', 'DESCRIPTION', 'KEYWORDS', 'SUGGESTED CATEGORY', 'STEPS', 'of 200 characters', 'of 4,000 characters'].every(k => listing.includes(k));
    await pg.getByRole('button', { name: 'Close preview' }).click();
    await pg.getByRole('button', { name: /Build package/ }).click(); await pg.waitForTimeout(6000);
    const saved = await pg.evaluate(() => window.__saved.map(s => ({ name: s.name, b64: s.b64 })));
    r.savedName = saved[0] && saved[0].name;
    if (saved[0]) {
        const zip = await JSZip.loadAsync(Buffer.from(saved[0].b64, 'base64'));
        r.zipFiles = Object.keys(zip.files).filter(f => !zip.files[f].dir).sort();
        const epub = await JSZip.loadAsync(await zip.file(r.zipFiles.find(f => f.endsWith('.epub'))).async('nodebuffer'));
        r.epubValidShape = !!epub.file('mimetype') && !!epub.file('META-INF/container.xml');
        r.kdpTxtFirstLines = (await zip.file('listings/kdp.txt').async('string')).split('\n').slice(0, 3);
        r.readmeSaysNotIncluded = (await zip.file('README-publishing.txt').async('string')).includes('WHAT IS NOT IN THIS ZIP');
        const csv = await zip.file('listings/book-metadata.csv').async('string');
        r.csvHasHeaderAndRow = csv.trim().split('\n').length === 2;
    }
    r.errors = errs.slice(0, 3);
    console.log(JSON.stringify(r, null, 1));
    await b.close();
})();
