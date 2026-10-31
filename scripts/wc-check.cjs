// Function check for The Writers Companion: runs the real single-file build from file://.
const { chromium } = require('playwright-core');
const path = require('path');
const file = 'file:///' + path.resolve(__dirname, '..', 'dist-selfcontained', 'pc', 'The_Writers_Companion_pc.html').replace(/\\/g, '/');
(async () => {
    const b = await chromium.launch({ headless: true });
    const pg = await (await b.newContext({ viewport: { width: 1500, height: 950 } })).newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    pg.on('dialog', d => d.accept());
    await pg.goto(file); await pg.waitForTimeout(2500);
    const r = {};
    r.licenseGate = (await pg.locator('text=freeware').count()) > 0;
    r.titleMentionsNewName = (await pg.title()).includes('Writers Companion');
    await pg.getByRole('button', { name: /Yes/ }).first().click(); await pg.waitForTimeout(1500);
    r.libraryHeading = (await pg.locator('h1').first().textContent()).includes('Writers Companion');
    r.noOldName = !(await pg.content()).toLowerCase().includes('bookforge');
    r.shelfBooks = await pg.locator('.shelf, .book, [class*=cover]').count() > 0;
    r.storageKeysSeparate = await pg.evaluate(() => Object.keys(localStorage).every(k => !k.startsWith('bookforge.')) && Object.keys(localStorage).some(k => k.startsWith('writerscompanion.')));
    r.dbName = await pg.evaluate(async () => (await indexedDB.databases()).map(d => d.name).join());
    // open a worked example and reach the editor
    const ex = pg.locator('text=/Field Manual|Bear Who|Wuthering|Annotated/').first();
    if (await ex.count()) { await ex.click(); await pg.waitForTimeout(1500); }
    r.editorOpens = (await pg.locator('.ProseMirror').count()) > 0;
    if (r.editorOpens) {
        await pg.locator('.ProseMirror').first().click();
        await pg.keyboard.type(' Test sentence.'); await pg.waitForTimeout(400);
        r.typing = (await pg.locator('.ProseMirror').first().textContent()).includes('Test sentence');
    }
    for (const tab of ['Print', 'Cover', 'Export', 'Write']) {
        const t = pg.getByRole('tab', { name: new RegExp('^' + tab) }).or(pg.getByRole('button', { name: new RegExp('^' + tab) })).first();
        if (await t.count()) { await t.click().catch(() => {}); await pg.waitForTimeout(500); r['tab_' + tab] = true; }
    }
    r.errors = errs.slice(0, 4);
    console.log(JSON.stringify(r, null, 1));
    await b.close();
})();
