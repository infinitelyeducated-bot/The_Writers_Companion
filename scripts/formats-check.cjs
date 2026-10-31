// Exports every format from the real app and inspects the actual output.
const { chromium } = require('playwright-core');
const path = require('path');
const JSZip = require('jszip');
const file = 'file:///' + path.resolve(__dirname, '..', 'dist-selfcontained', 'pc', 'The_Writers_Companion_pc.html').replace(/\\/g, '/');
(async () => {
    const b = await chromium.launch({ headless: true });
    const pg = await (await b.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
    const errs = []; pg.on('pageerror', e => errs.push(e.message));
    pg.on('dialog', d => d.accept());
    await pg.addInitScript(() => {
        window.__saved = [];
        window.showSaveFilePicker = async (o) => ({ name: o.suggestedName, createWritable: async () => { const c = []; return { write: async (x) => c.push(x), close: async () => { const bl = new Blob(c); const buf = new Uint8Array(await bl.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 8192) s += String.fromCharCode(...buf.subarray(i, i + 8192)); window.__saved.push({ name: o.suggestedName, b64: btoa(s) }); } }; } });
    });
    const openExample = async (idx) => {
        await pg.goto(file); await pg.waitForTimeout(1200);
        const yes = pg.getByRole('button', { name: /^Yes/ }); if (await yes.count()) { await yes.first().click(); await pg.waitForTimeout(2000); }
        await pg.locator('.example-card').nth(idx).locator('button', { hasText: 'Open example' }).click(); await pg.waitForTimeout(1200);
        await pg.getByRole('button', { name: 'Export', exact: true }).click(); await pg.waitForTimeout(900);
    };
    const grab = async (btn) => {
        const before = await pg.evaluate(() => window.__saved.length);
        await pg.getByRole('button', { name: btn }).first().click();
        await pg.waitForFunction(n => window.__saved.length > n, before, { timeout: 8000 });
        return pg.evaluate(() => { const s = window.__saved[window.__saved.length - 1]; return { name: s.name, b64: s.b64 }; });
    };
    const txt = o => Buffer.from(o.b64, 'base64').toString('utf8');
    const r = {};
    await openExample(0); // Trade fiction, "The Salt Line"
    const t = await grab(/Export \.txt/); const tt = txt(t);
    r.txt = { name: t.name, hasTitle: tt.startsWith('THE SALT LINE'), hasChapterHeading: /CHAPTER ONE/.test(tt), hasSceneBreak: tt.includes('* * *'), noMarkup: !/<|\*\*|\\\\/.test(tt.replace(/\* \* \*/g, '')) };
    const h = await grab(/Export \.html/); const ht = txt(h);
    r.html = { name: h.name, doctype: ht.startsWith('<!doctype html>'), hasToc: ht.includes('<nav>'), chapters: (ht.match(/<section /g) || []).length, escapes: !ht.includes('<script') };
    const f = await grab(/Export \.rtf/); const ft = txt(f);
    r.rtf = { name: f.name, startsRtf: ft.startsWith('{\\rtf1'), balancedBraces: (ft.match(/(?<!\\)\{/g) || []).length === (ft.match(/(?<!\\)\}/g) || []).length, hasTitle: ft.includes('The Salt Line') };
    const z = await grab(/One file per chapter/);
    const zip = await JSZip.loadAsync(Buffer.from(z.b64, 'base64'));
    r.chaptersZip = { name: z.name, files: Object.keys(zip.files) };
    // Screenplay example for Fountain
    const names = await pg.evaluate(() => 0);
    await openExample(4); // Screenplay is the 5th card
    const fo = await grab(/Export \.fountain/); const fot = txt(fo);
    r.fountain = { name: fo.name, titleBlock: fot.startsWith('Title: NIGHT SHIFT'), sceneHeading: /^INT\. CORNER STORE/m.test(fot), characterCue: /^TELLER\n/m.test(fot) || /^MAN\n/m.test(fot), transition: /^> FADE OUT/m.test(fot) };
    r.errors = errs.slice(0, 3);
    console.log(JSON.stringify(r, null, 1));
    console.log('\n--- txt sample ---\n' + tt.split('\n').slice(0, 14).join('\n'));
    console.log('\n--- fountain sample ---\n' + fot.split('\n').slice(0, 16).join('\n'));
    await b.close();
})();
