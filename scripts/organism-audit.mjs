/**
 * Alignment + legibility audit for the V6 organism gallery.
 *
 *   npm run audit:organisms
 *
 * Why this exists: `tsc` and `npm run build` have both passed on broken UI in
 * this project. The gate is visual, and this is the part of it a machine can
 * do — it drives the real page at each platform's REAL viewport and reports
 * content that is hidden, cut, escaping, or merely unreadable.
 *
 * Two lessons are baked in:
 *   - Audit each platform frame at the viewport it represents. Measuring a
 *     1440px frame inside a 390px window reported 68 problems, 66 of them the
 *     harness's own constraint rather than a defect.
 *   - "Does not clip" is a lower bar than "is legible". A 3-column tile passed
 *     every overflow test and still looked cramped, so wrapping is checked too.
 */

import puppeteer from 'puppeteer'
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { extname, join } from 'node:path'

const ROOT = 'dist-preview'
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
}

const server = createServer((req, res) => {
  let p = join(ROOT, decodeURIComponent(req.url.split('?')[0]))
  if (!existsSync(p) || !extname(p)) p = join(ROOT, 'organisms.html')
  try {
    const body = readFileSync(p)
    res.writeHead(200, { 'Content-Type': TYPES[extname(p)] || 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404); res.end('not found')
  }
}).listen(4321)

const OUT = '/private/tmp/claude-502/-Users-Alex-Dev-2026-Aug-17-BARTEFY-V3/95ba02df-7780-4e16-afbd-b90e982f357c/scratchpad'

/** Everything measured inside the page, for the organisms currently mounted. */
function inspect() {
  const out = []
  document.querySelectorAll(`[data-organism][data-platform="${window.__P}"]`).forEach((o) => {
    const lang = /[Ⴀ-ჿ]/.test(o.innerText) ? 'KA' : 'EN'
    const id = `${o.dataset.organism}/${o.dataset.platform}/${o.dataset.variant}/${lang}`
    const ob = o.getBoundingClientRect()

    // 1. a scroller that actually overflows is content the user cannot see
    o.querySelectorAll('*').forEach((el) => {
      if (/auto|scroll/.test(getComputedStyle(el).overflowX) && el.scrollWidth > el.clientWidth + 2)
        out.push(`${id}: SCROLLS, ${el.scrollWidth - el.clientWidth}px hidden`)
    })

    // 2. leaf text cut off
    o.querySelectorAll('*').forEach((el) => {
      if (el.children.length === 0 && el.scrollWidth > el.clientWidth + 2 && el.innerText.trim())
        out.push(`${id}: TRUNCATED "${el.innerText.slice(0, 18)}"`)
    })

    // 3. content escaping the organism's own box, either edge.
    //    Empty nodes are skipped: Radix's Progress indicator is translated
    //    off-canvas by design, which is how the bar fills.
    o.querySelectorAll('li,h3,p,span,button,div').forEach((el) => {
      if (!el.innerText.trim()) return
      const r = el.getBoundingClientRect()
      if (r.right > ob.right + 2)
        out.push(`${id}: ESCAPES-R ${Math.round(r.right - ob.right)}px "${el.innerText.slice(0, 18)}"`)
      if (r.left < ob.left - 2)
        out.push(`${id}: ESCAPES-L ${Math.round(ob.left - r.left)}px "${el.innerText.slice(0, 18)}"`)
    })

    // 4. legibility, not just overflow
    o.querySelectorAll('p,h3').forEach((el) => {
      const lh = parseFloat(getComputedStyle(el).lineHeight || '20')
      const lines = Math.round(el.getBoundingClientRect().height / lh)
      if (lines >= 5) out.push(`${id}: ${el.tagName} wraps to ${lines} lines`)
    })
    const badge = o.querySelector('[class*="rounded-pill"]')
    if (badge && Math.round(badge.getBoundingClientRect().height / 18) >= 3)
      out.push(`${id}: badge wraps to 3+ lines`)

    // 5. repeated elements must be one uniform size, and all present
    const lis = [...o.querySelectorAll('ol li')]
    if (lis.length) {
      const widths = [...new Set(lis.map((l) => Math.round(l.getBoundingClientRect().width)))]
      if (widths.length > 1) out.push(`${id}: UNEVEN items ${widths.join(',')}`)
      const visible = lis.filter((l) => l.getBoundingClientRect().right <= ob.right + 2).length
      if (visible < lis.length) out.push(`${id}: only ${visible}/${lis.length} visible`)
    }
  })
  return [...new Set(out)]
}

/** Click a tab by its label. Radix unmounts inactive tabs, so every
 *  organism x platform pair has to be visited or it is silently unaudited —
 *  adding tabs once dropped coverage from 32 organisms to 12 with no warning. */
/** Click a tab by its label, with a REAL pointer event.
 *
 *  Radix ignores a synthetic `el.click()` dispatched inside page.evaluate --
 *  it listens for pointer events. That silently did nothing, so the audit
 *  only ever measured the first organism while reporting "clean" for all of
 *  them. Always click through an ElementHandle.
 */
async function clickTab(page, listIndex, label) {
  const handle = await page.evaluateHandle(
    ({ i, l }) => {
      const list = document.querySelectorAll('[role="tablist"]')[i]
      if (!list) return null
      return [...list.querySelectorAll('[role="tab"]')].find((t) => t.textContent === l) ?? null
    },
    { i: listIndex, l: label },
  )
  const el = handle.asElement()
  if (!el) return false
  await el.click()
  await new Promise((r) => setTimeout(r, 300))
  return true
}

const VIEWS = [
  ['mobile', 390, 900], ['tablet', 768, 1100],
  ['desktop', 1440, 1000], ['wide', 1920, 1000],
]

const browser = await puppeteer.launch()
let total = 0

for (const [name, w, h] of VIEWS) {
  const page = await browser.newPage()
  await page.setViewport({ width: w, height: h })
  await page.goto('http://localhost:4321/organisms.html', { waitUntil: 'networkidle0' })
  await new Promise((r) => setTimeout(r, 1200))
  await page.evaluate((n) => { window.__P = n }, name === 'wide' ? 'desktop' : name)

  const organisms = await page.evaluate(() =>
    [...(document.querySelectorAll('[role="tablist"]')[0]?.querySelectorAll('[role="tab"]') ?? [])]
      .map((t) => t.textContent),
  )

  const found = []
  let checked = 0
  for (const org of organisms) {
    await clickTab(page, 0, org)
    const platforms = await page.evaluate(() =>
      [...(document.querySelectorAll('[role="tablist"]')[1]?.querySelectorAll('[role="tab"]') ?? [])]
        .map((t) => t.textContent),
    )
    // Only the tab matching this viewport: a 1440px frame inside a 390px
    // window is the harness's constraint, not a defect.
    const want = name === 'wide' ? 'desktop' : name
    const target = platforms.find((pl) => pl.toLowerCase().includes(want))
    if (target) {
      await clickTab(page, 1, target)
      // Confirm the frame really switched: a click that silently did nothing
      // is how this audit reported "clean" on zero renders.
      await page
        .waitForFunction(
          (want) =>
            [...document.querySelectorAll('[data-organism]')].some(
              (o) => o.dataset.platform === want,
            ),
          { timeout: 3000 },
          name === 'wide' ? 'desktop' : name,
        )
        .catch(() => {})
      found.push(...(await page.evaluate(inspect)))
      checked += await page.evaluate(
        () => document.querySelectorAll(`[data-organism][data-platform="${window.__P}"]`).length,
      )
    }
  }

  if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth))
    found.push(`${name}: PAGE scrolls sideways`)

  if (checked === 0) found.push(`${name}: AUDITED NOTHING — no frame mounted (tab label mismatch?)`)

  const unique = [...new Set(found)]
  console.log(`\n--- ${name} ${w}px (${checked} organism renders checked) ---`)
  console.log(unique.length ? unique.join('\n') : 'clean')
  total += unique.length
  await page.screenshot({ path: `${OUT}/audit-${name}.png`, fullPage: true })
  await page.close()
}

console.log(`\nTOTAL PROBLEMS: ${total}`)
await browser.close()
server.close()
process.exit(total ? 1 : 0)
