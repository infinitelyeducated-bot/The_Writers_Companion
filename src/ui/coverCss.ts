export const COVER_CSS = `
.cover-wrap { box-shadow: 0 10px 40px rgba(0,0,0,.35); }
.cw-bg { position: absolute; inset: 0; }
.cw-panel { position: relative; overflow: hidden; background-size: cover; background-position: center; z-index: 1; }
.cw-back-inner { position: absolute; inset: 0; padding: 12% 11%; display: flex; flex-direction: column; justify-content: flex-start; gap: 0.5em; }
.cw-backtext { max-width: 92%; }
.cw-backtext p { margin: 0 0 0.85em; line-height: 1.5; text-indent: 0; }
.cw-pub { margin-top: auto; letter-spacing: 0.22em; opacity: .8; font-size: .75em !important; }
.cw-barcode { position: absolute; right: 0.3in; bottom: 0.3in; background: #fff; display: flex; align-items: center; justify-content: center; }
.cw-barcode-box { width: 92%; height: 86%; border: 1px solid #999; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 2px; }
.cw-barcode-lines { flex: 1; width: 82%; background: repeating-linear-gradient(90deg, #111 0 2px, #fff 2px 4px, #111 4px 5px, #fff 5px 8px); margin: 6px 0; }
.cw-barcode-box span { font: 8px sans-serif; color: #333; margin-bottom: 2px; }
.cw-spine { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.cw-spine-text { writing-mode: vertical-rl; transform: rotate(180deg); display: flex; align-items: center; gap: 1.2em; white-space: nowrap; letter-spacing: 0.12em; text-transform: uppercase; }
.cw-spine-title { font-weight: 700; }
.cw-spine-author { opacity: .85; }
.cw-front { position: relative; }
.cw-front-inner { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 9% 10%; z-index: 2; }
.cw-title { margin: 0; font-weight: 700; letter-spacing: 0.01em; text-shadow: 0 2px 20px rgba(0,0,0,.25); }
.cw-sub { margin: 0.7em 0 0; font-style: italic; opacity: .9; }
.cw-rule { width: 1.6in; height: 2px; background: var(--accent); margin: 1.3em 0; }
.cw-author { margin: 0; letter-spacing: 0.24em; text-transform: uppercase; }
.cw-band { position: absolute; left: 0; right: 0; top: 0; background: var(--accent); opacity: .92; z-index: 1; }
.cw-frame { position: absolute; inset: 6%; border: 2px solid var(--accent); z-index: 1; pointer-events: none; }
.cw-mini-rule { width: 0.8in; height: 1px; background: var(--accent); margin-bottom: 1.4em; }
.cg-trim { position: absolute; border: 1px dashed rgba(255,0,0,.75); pointer-events: none; z-index: 5; }
.cg-spine { position: absolute; border: 1px dashed rgba(0,150,255,.9); pointer-events: none; z-index: 5; }
.cg-safe { position: absolute; border: 1px dotted rgba(255,255,255,.55); pointer-events: none; z-index: 5; }
.cg-label { position: absolute; font: 8px/1.2 monospace; color: rgba(255,255,255,.85); background: rgba(0,0,0,.45); padding: 2px 5px; z-index: 6; pointer-events: none; white-space: nowrap; }
.ebook-cover { position: relative; overflow: hidden; box-shadow: 0 14px 40px rgba(0,0,0,.35); background-size: cover; background-position: center; }
.eb-inner { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 9%; }
.eb-inner h1 { margin: 0; font-weight: 700; line-height: 1.06; }
.eb-sub { margin: 0.6em 0 0; font-style: italic; opacity: .9; }
.eb-line { width: 40%; height: 2px; background: var(--accent); margin: 1.1em 0; }
.eb-author { margin: 0; letter-spacing: .22em; text-transform: uppercase; }
.eb-band { position: absolute; top: 0; left: 0; right: 0; height: 26%; background: var(--accent); opacity: .92; }
.eb-frame { position: absolute; inset: 5%; border: 2px solid var(--accent); }
.eb-rule { width: 60px; height: 1px; background: var(--accent); margin-bottom: 18px; }
`
