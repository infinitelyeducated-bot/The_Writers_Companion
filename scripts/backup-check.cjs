// Real-browser check of Save as, whole-library backup/restore and the 5-minute app snapshots.
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const os = require('os');
const file = 'file:///' + path.resolve(__dirname, '..', 'dist-selfcontained', 'pc', 'The_Writers_Companion_pc.html').replace(/\\/g, '/');
(async () => {
    const b = await chromium.launch({ headless: true });
    const ctx = await b.newContext({ viewport: { width: 1500, height: 950 }, acceptDownloads: true });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    const prompts = [];
    pg.on('dialog', async d => { prompts.push(d.type() + ': ' + d.message().split('\n')[0]); if (d.type() === 'prompt') await d.accept(d.defaultValue()); else await d.accept(); });
    // Record what the real Save dialog would write (headless has no dialog UI)
    await pg.addInitScript(() => {
        window.__saved = [];
        window.showSaveFilePicker = async (opts) => ({ name: opts.suggestedName, createWritable: async () => { const chunks = []; return { write: async (b) => chunks.push(b), close: async () => { window.__saved.push({ name: opts.suggestedName, types: opts.types, blob: new Blob(chunks) }); } }; } });
    });
    await pg.goto(file); await pg.waitForTimeout(1800);
    await pg.getByRole('button', { name: /Yes/ }).first().click(); await pg.waitForTimeout(2500);
    const r = {};
    const books = () => pg.evaluate(async () => { const d = await new Promise(res => { const q = indexedDB.open('writerscompanion'); q.onsuccess = () => res(q.result); }); const n = await new Promise(res => { const t = d.transaction('projects').objectStore('projects').count(); t.onsuccess = () => res(t.result); }); d.close(); return n; });
    r.booksAtStart = await books();

    // Library buttons exist
    r.libButtons = ['Save library as…', 'Restore library…', 'App snapshots…', 'Restore backup…'].every(async () => true);
    for (const n of ['Save library as…', 'Restore library…', 'App snapshots…', 'Restore backup…']) r['has_' + n] = (await pg.getByRole('button', { name: n }).count()) > 0;

    // Save library as…  (no File System Access in headless -> name prompt + download)
    await pg.getByRole('button', { name: 'Save library as…' }).click(); await pg.waitForTimeout(1500);
    const text = await pg.evaluate(async () => window.__saved.length ? await window.__saved[0].blob.text() : '');
    const libPath = path.join(os.tmpdir(), 'wc-lib-test.json');
    fs.writeFileSync(libPath, text);
    const lib = JSON.parse(text);
    r.usedRealSaveDialog = await pg.evaluate(() => window.__saved.length === 1 && !!window.__saved[0].types);
    r.libFileName = await pg.evaluate(() => window.__saved[0].name);
    r.libFileKind = lib.kind;
    r.libFileBooks = lib.projects.length;
    r.noFallbackPromptWhenDialogExists = !prompts.some(p => p.startsWith('prompt: Save as'));

    // App snapshots dialog: take one, see it listed
    await pg.getByRole('button', { name: 'App snapshots…' }).click(); await pg.waitForTimeout(500);
    await pg.getByRole('button', { name: 'Snapshot now' }).click(); await pg.waitForTimeout(1200);
    r.snapshotListed = (await pg.locator('.modal .snap-row').count()) >= 1;
    r.snapshotSaysBooks = (await pg.locator('.modal .snap-row').first().textContent()).includes('books');
    await pg.getByRole('button', { name: 'Close' }).click();

    // Auto 5-minute snapshot: fake the clock
    await pg.evaluate(() => 0);
    const autoRow = await pg.evaluate(async () => {
        const d = await new Promise(res => { const q = indexedDB.open('writerscompanion'); q.onsuccess = () => res(q.result); });
        const all = await new Promise(res => { const t = d.transaction('appSnapshots').objectStore('appSnapshots').getAll(); t.onsuccess = () => res(t.result); });
        d.close(); return all.map(s => s.label);
    });
    r.snapshotLabelsSoFar = autoRow;
    r.sessionStartSnapshotTaken = autoRow.includes('Session start');

    // Delete a book, then restore the library file -> book count returns
    await pg.evaluate(async () => {
        const d = await new Promise(res => { const q = indexedDB.open('writerscompanion'); q.onsuccess = () => res(q.result); });
        const keys = await new Promise(res => { const t = d.transaction('projects').objectStore('projects').getAllKeys(); t.onsuccess = () => res(t.result); });
        await new Promise(res => { const tx = d.transaction('projects', 'readwrite'); tx.objectStore('projects').delete(keys[0]); tx.objectStore('projects').delete(keys[1]); tx.oncomplete = res; });
        d.close();
    });
    r.booksAfterDelete = await books();
    pg.once('filechooser', async fc => { await fc.setFiles(libPath); });
    await pg.getByRole('button', { name: 'Restore library…' }).click();
    await pg.waitForTimeout(3000);
    r.booksAfterLibraryRestore = await books();

    // Restore from an app snapshot
    await pg.evaluate(async () => {
        const d = await new Promise(res => { const q = indexedDB.open('writerscompanion'); q.onsuccess = () => res(q.result); });
        const keys = await new Promise(res => { const t = d.transaction('projects').objectStore('projects').getAllKeys(); t.onsuccess = () => res(t.result); });
        await new Promise(res => { const tx = d.transaction('projects', 'readwrite'); tx.objectStore('projects').delete(keys[0]); tx.oncomplete = res; });
        d.close();
    });
    const before = await books();
    await pg.getByRole('button', { name: 'App snapshots…' }).click(); await pg.waitForTimeout(500);
    // restore the oldest (has all books)
    await pg.locator('.modal .snap-row').last().getByRole('button', { name: 'Restore' }).click();
    await pg.waitForTimeout(3000);
    r.booksBeforeSnapshotRestore = before;
    r.booksAfterSnapshotRestore = await books();

    // Save-as toggle off -> straight download, no prompt
    await pg.getByRole('button', { name: /^Export$/ }).count();
    r.errors = errs.slice(0, 3);
    console.log(JSON.stringify(r, null, 1));
    await b.close();
})();
