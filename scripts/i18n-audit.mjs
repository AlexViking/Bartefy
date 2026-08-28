#!/usr/bin/env node
/** i18n audit.
 *
 *  Two checks, both cheap enough to run in CI:
 *
 *   1. Missing keys — every k="..." / t('...') referenced in the source that
 *      is not present in en.json. These render as the raw key at the user.
 *   2. Unused keys — everything in en.json that no source file references.
 *      Dead copy translators would otherwise be paid to translate.
 *
 *  It deliberately does NOT try to find hardcoded English in JSX: that needs
 *  the rendered DOM, which is what the data-i18n attribute is for. Run the app
 *  and sweep for text nodes whose ancestors carry no data-i18n.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const SRC = 'src'
const EN = 'src/i18n/locales/en.json'

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.tsx?$/.test(p)) out.push(p)
  }
  return out
}

function flatten(obj, prefix = '', out = new Set()) {
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('_')) continue
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object') flatten(v, key, out)
    else out.add(key)
  }
  return out
}

const en = JSON.parse(readFileSync(EN, 'utf8'))
const defined = flatten(en)

// i18next plural keys: "x_other" is reachable via "x".
for (const k of [...defined]) {
  if (k.endsWith('_other')) defined.add(k.slice(0, -'_other'.length))
}

const used = new Map() // key -> files
const KEY = /(?:\bk=|\bt\(|\bbody=|\btitle=|\blabel=|\bhint=|\bhelp=|\baction=|\bactionLabel=|\bsecondaryLabel=|\bplaceholder=|\bdescription=|data-i18n=)\s*\{?\s*['"`]([a-z][a-zA-Z0-9]*(?:\.[a-zA-Z0-9]+)+)['"`]/g

for (const file of walk(SRC)) {
  if (file.includes('/i18n/locales/')) continue
  let src = readFileSync(file, 'utf8')
  // Doc comments carry example keys that are not real references.
  src = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
  for (const m of src.matchAll(KEY)) {
    const rel = relative('.', file)
    if (!used.has(m[1])) used.set(m[1], new Set())
    used.get(m[1]).add(rel)
  }
}

const missing = [...used.keys()].filter((k) => !defined.has(k)).sort()
const unused = [...defined].filter((k) => !used.has(k) && !k.endsWith('_other')).sort()

console.log(`en.json defines ${defined.size} keys; source references ${used.size}.\n`)

if (missing.length) {
  console.log(`✗ ${missing.length} referenced but MISSING from en.json:`)
  for (const k of missing) console.log(`    ${k}  ← ${[...used.get(k)].join(', ')}`)
  console.log()
} else {
  console.log('✓ No missing keys.\n')
}

if (unused.length) {
  console.log(`· ${unused.length} defined but unused (fine while screens are still being built):`)
  for (const k of unused) console.log(`    ${k}`)
  console.log()
}

process.exit(missing.length ? 1 : 0)
