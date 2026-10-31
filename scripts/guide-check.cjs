const { chromium } = require('playwright-core');
const path = require('path');
const file = 'file:///' + path.resolve(__dirname, '..', 'dist-selfcontained', 'pc', 'The_Writers_Companion_pc.html').replace(/\\/g, '/');
(async () => {
    const b = await chromium.launch({ headless: true });
    const pg = await (await b.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
    const errs = []; pg.on('pageerror', e => errs.push(e.message));
    pg.on('dialog', d => d.accept());
    await pg.goto(file); await pg.waitForTimeout(1500);
    const r = {};
    // ---- gateway on a clean browser
    r.gateShown = (await pg.getByRole('heading', { name: /Before you open/ }).count()) === 1;
    r.gateText = (await pg.locator('.gate-body').innerText()).replace(/\s+/g, ' ');
    r.hasQuestion = r.gateText.includes('Do you agree');
    r.buttons = await pg.locator('.modal-actions button').allTextContents();
    r.appHiddenBehindGate = (await pg.locator('.library').count()) === 0;
    // No: nothing stored, stays closed
    await pg.getByRole('button', { name: 'No', exact: true }).click(); await pg.waitForTimeout(400);
    r.declineScreen = (await pg.getByRole('heading', { name: /chose not to accept/ }).count()) === 1;
    r.nothingStoredOnNo = await pg.evaluate(() => !Object.keys(localStorage).some(k => k.startsWith('writerscompanion.license')));
    await pg.goto(file); await pg.waitForTimeout(1200);
    r.askedAgainAfterNo = (await pg.getByRole('button', { name: 'Yes', exact: true }).count()) === 1;
    // Yes
    await pg.getByRole('button', { name: 'Yes', exact: true }).click(); await pg.waitForTimeout(2200);
    r.appOpensAfterYes = (await pg.locator('.library').count()) === 1;
    await pg.goto(file); await pg.waitForTimeout(1500);
    r.notAskedAgainAfterYes = (await pg.getByRole('heading', { name: /Before you open/ }).count()) === 0 && (await pg.locator('.library').count()) === 1;
    // ---- guide
    await pg.getByRole('button', { name: 'Guide' }).click(); await pg.waitForTimeout(1500);
    const g = await pg.locator('#writerscompanion-guide-content').innerText();
    r.guideLength = g.length;
    for (const [k, v] of Object.entries({
        gatewayQuote: 'I wish you the best!!!', noOwnership: 'claims no ownership of anything you', charity: 'local literacy or community charity',
        examples25: '25 examples are already in your library', familiesTable: 'Eighteen more families', fantasyRow: 'EB Garamond 12.5 pt',
        fountain: 'Fountain (.fountain)', rtf: 'Rich Text (.rtf)', txt: 'Plain text (.txt)', html: 'Web page (.html)', chapterZip: 'One file per chapter (.zip)',
        saveAs: 'Ask me where to save each file', appSnaps: 'Automatic whole-app snapshots', publishing: 'Publishing package',
    })) r['guide_' + k] = g.includes(v);
    r.guideStaleFreeware = /freeware|seven examples|Yes — open/i.test(g);
    r.errors = errs.slice(0, 3);
    console.log(JSON.stringify(r, null, 1));
    await b.close();
})();
