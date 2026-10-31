// Smart typography: curly quotes, en/em dashes, ellipses.
// Applied (a) as you type via TipTap input rules, (b) in bulk on import and on demand.

const OPEN_DQ = /(^|[\s(\[{<—–\u2014\u2013/'"`\u2018\u201c])"/g

export function smarten(input: string): string {
  let s = input
  // ellipsis
  s = s.replace(/\.\.\./g, '…')
  // em dash: --- (three+), en dash: --
  s = s.replace(/-{3,}/g, '—')
  s = s.replace(/(?<![-\u2014])--(?![-\u2014])/g, '–')
  // spacing around dashes
  s = s.replace(/\s+—\s*/g, '—').replace(/\s+–\s*/g, ' – ')
  // double quotes
  s = s.replace(OPEN_DQ, '$1“')
  s = s.replace(/"/g, '”')
  // single quotes / apostrophes
  s = s.replace(/(^|[\s(\[{<—–/'"`])'/g, '$1‘')
  s = s.replace(/'/g, '’')
  return s
}

/** Typographise plain text but leave HTML tags untouched. */
export function smartenHtml(html: string): string {
  return html
    .split(/(<[^>]+>)/g)
    .map((part) => (part.startsWith('<') ? part : smarten(part)))
    .join('')
}

/** Walk ProseMirror JSON and smarten every text node. */
export function smartenNodes<T>(nodes: T): T {
  const walk = (n: any): any => {
    if (!n || typeof n !== 'object') return n
    if (Array.isArray(n)) return n.map(walk)
    if (n.type === 'text' && typeof n.text === 'string') return { ...n, text: smarten(n.text) }
    if (n.content) return { ...n, content: n.content.map(walk) }
    return n
  }
  return walk(nodes)
}

// TipTap input-rule texts (prefix + trigger char)
export const smartInputRules = {
  ellipsis: '...',
  emDash: '---',
  enDash: '--',
  doubleQuoteOpen: '"',
  doubleQuoteClose: '"',
  singleQuote: "'",
}
