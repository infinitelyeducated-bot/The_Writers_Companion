// Opens every example from the real single-file build and checks it lays out.
const { chromium } = require('playwright-core');
const path = require('path');
const file = 'file:///' + path.resolve(__dirname, '..', 'dist-selfcontained', 'pc', 'The_Writers_Companion_pc.html').replace(/\\/g, '/');
(async () => {
    const b = await chromium.launch({ headless: true });
    const ctx = await b.newContext({ viewport: { width: 1500, height: 950 } });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    pg.on('dialog', d => d.accept());
    await pg.goto(file); await pg.waitForTimeout(2000);
    await pg.getByRole('button', { name: /Yes/ }).first().click(); await pg.waitForTimeout(2500);
    const names = await pg.locator('.example-card .ex-name').allTextContents();
    console.log('example cards:', names.length);
    console.log('duplicate names:', names.length - new Set(names).size);
    const bad = [];
    for (let i = 0; i < names.length; i++) {
        await pg.locator('.example-card').nth(i).locator('button', { hasText: 'Open example' }).click();
        await pg.waitForTimeout(900);
        const hasEditor = (await pg.locator('.ProseMirror').count()) > 0;
        const title = await pg.locator('input[value], h1, .app-title').first().inputValue().catch(() => '');
        await pg.getByRole('button', { name: 'Print layout' }).click();
        await pg.waitForTimeout(3500);
        const pages = await pg.locator('.book-page').count();
        if (!hasEditor || pages < 1) bad.push(`${names[i]} (editor=${hasEditor}, pages=${pages})`);
        // back to library
        await pg.goto(file); await pg.waitForTimeout(900);
    }
    console.log('examples that failed to open/lay out:', bad.length ? bad.join('; ') : 'none');
    console.log('page errors:', errs.length, errs.slice(0, 2).join(' | '));
    await b.close();
})();
