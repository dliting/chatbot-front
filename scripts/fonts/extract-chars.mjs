// Font subset maintenance: collect the set of unique characters appearing in
// all static source text (templates, i18n strings, styles, html entries) of
// the library and the chatapp example. Writes scripts/fonts/extracted-chars.txt
// (one line of unique chars). Consumed by subset-fonts.py.
// Run from the repo root (subset-fonts.py does this for you).
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOTS = [
  'src',
  'index.html',
  'examples/chatapp/frontend/src',
  'examples/chatapp/frontend/index.html',
]
const EXTS = new Set(['.vue', '.ts', '.js', '.scss', '.css', '.html'])
const SKIP_DIRS = new Set(['node_modules', 'dist', '__tests__', 'coverage'])

const chars = new Set()

function walk(p) {
  const st = statSync(p)
  if (st.isDirectory()) {
    for (const name of readdirSync(p)) {
      if (SKIP_DIRS.has(name)) continue
      walk(join(p, name))
    }
  } else if (EXTS.has(p.slice(p.lastIndexOf('.')))) {
    const text = readFileSync(p, 'utf8')
    for (const ch of text) chars.add(ch)
  }
}

for (const root of ROOTS) walk(root)

// Control/format characters are excluded by pyftsubset anyway; drop \r\n\t
chars.delete('\r')
chars.delete('\n')
chars.delete('\t')

const sorted = [...chars].sort((a, b) => a.codePointAt(0) - b.codePointAt(0)).join('')
writeFileSync(new URL('./extracted-chars.txt', import.meta.url), sorted, 'utf8')
process.stderr.write(`extracted ${chars.size} unique chars\n`)
