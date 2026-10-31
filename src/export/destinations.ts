// Where a finished book can go. The Writers Companion is local-first (no accounts, no
// server), so it cannot push bytes into another company's cloud by itself.
// What it can do honestly: produce exactly the file each service wants, then
// open that service's upload page so the file is one drag away.

export type Wants = 'EPUB' | 'PDF' | 'DOCX' | 'EPUB + PDF'

export interface Destination {
  id: string
  name: string
  kind: 'storage' | 'retailer'
  url: string
  wants: Wants
  note: string
}

export const DESTINATIONS: Destination[] = [
  // ── storage ────────────────────────────────────────────────────────────────
  { id: 'gdrive', name: 'Google Drive', kind: 'storage', url: 'https://drive.google.com/drive/my-drive', wants: 'EPUB + PDF', note: 'Drag any export into My Drive. Good off-machine backup for the .writerscompanion.json too.' },
  { id: 'dropbox', name: 'Dropbox', kind: 'storage', url: 'https://www.dropbox.com/home', wants: 'EPUB + PDF', note: 'Drag exports into any folder. Keep a dated copy of the project backup.' },
  { id: 'onedrive', name: 'OneDrive', kind: 'storage', url: 'https://onedrive.live.com/', wants: 'EPUB + PDF', note: 'Drag exports in; Word opens the .docx straight from here.' },
  { id: 'box', name: 'Box', kind: 'storage', url: 'https://app.box.com/folder/0', wants: 'EPUB + PDF', note: 'Drag exports into any folder.' },
  { id: 'icloud', name: 'iCloud Drive', kind: 'storage', url: 'https://www.icloud.com/iclouddrive/', wants: 'EPUB + PDF', note: 'Upload from the browser; the file appears in Files on iPhone and iPad.' },
  { id: 'mega', name: 'MEGA', kind: 'storage', url: 'https://mega.nz/fm', wants: 'EPUB + PDF', note: 'Encrypted storage; drag exports into the file manager.' },

  // ── retailers / publishing portals ────────────────────────────────────────
  { id: 'kdp', name: 'Amazon KDP', kind: 'retailer', url: 'https://kdp.amazon.com/en_US/title-setup/kindle', wants: 'EPUB + PDF', note: 'Kindle ebook takes the EPUB; the paperback takes the interior PDF plus the cover PDF. The readiness panel on Print layout is written to KDP’s rules.' },
  { id: 'apple', name: 'Apple Books', kind: 'retailer', url: 'https://itunespartner.apple.com/books/', wants: 'EPUB', note: 'Publish via iTunes Connect / Apple Books for Authors. EPUB 3 required — run EPUBCheck first.' },
  { id: 'play', name: 'Google Play Books', kind: 'retailer', url: 'https://play.google.com/books/publish/', wants: 'EPUB + PDF', note: 'The Partner Center accepts the EPUB for flowing text and a PDF for fixed layout.' },
  { id: 'kobo', name: 'Kobo Writing Life', kind: 'retailer', url: 'https://www.kobo.com/writinglife', wants: 'EPUB', note: 'Straightforward EPUB upload, worldwide reach, good royalty terms.' },
  { id: 'bn', name: 'Barnes & Noble Press', kind: 'retailer', url: 'https://press.barnesandnoble.com/', wants: 'EPUB + PDF', note: 'Nook ebook from the EPUB; print books from interior + cover PDFs.' },
  { id: 'd2d', name: 'Draft2Digital', kind: 'retailer', url: 'https://www.draft2digital.com/', wants: 'EPUB', note: 'One upload distributes to many stores and libraries (includes Smashwords). Takes EPUB or DOCX.' },
  { id: 'ingram', name: 'IngramSpark', kind: 'retailer', url: 'https://myaccount.ingramspark.com/', wants: 'EPUB + PDF', note: 'Print distribution to bookstores and libraries. Strict on PDFs: embed fonts, exact trim, correct bleed.' },
  { id: 'lulu', name: 'Lulu', kind: 'retailer', url: 'https://www.lulu.com/create', wants: 'PDF', note: 'Print-on-demand with many trim sizes. Wants the interior PDF and a one-piece cover PDF.' },
]

export const storageDestinations = () => DESTINATIONS.filter((d) => d.kind === 'storage')
export const retailerDestinations = () => DESTINATIONS.filter((d) => d.kind === 'retailer')
