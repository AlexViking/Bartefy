/* Rebuilds everything the tracker shows, in the only order that works:
 *
 *   1. apply-shell.mjs     each Stitch page → its revision (no search, side nav)
 *   2. build-revisions.mjs our organism redesigns, patched into those revisions
 *   3. build-parts.mjs     cut every organism out for the live previews
 *
 *   node v6-pages/rebuild.mjs            (from client/)
 *
 * Add a line to PAGES when a new Stitch page arrives.
 */
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const run = (script, ...args) => execFileSync('node', [path.join(here, script), ...args], { stdio: 'inherit', cwd: here })

// [Stitch source, revision, active side-nav row]
const PAGES = [
  ['01-discover-desktop', '02-discover-desktop-r1', 'discover'],
  ['03-active-swaps-desktop', '04-active-swaps-desktop-r1', 'swaps'],
  ['05-points-tiers-desktop', '06-points-tiers-desktop-r1', 'points'],
  ['07-my-finds-desktop', '08-my-finds-desktop-r1', 'finds'],
  // Chat lives under Active Swaps & Offers — the side nav has no Chat row.
  ['09-chat-desktop', '10-chat-desktop-r1', 'swaps'],
  // No Stitch page for Profile: the shell alone (from S4), filled by build-revisions.mjs.
  ['07-my-finds-desktop', '11-profile-shell', 'profile'],
  // Same, with nothing active in the nav — for Notifications and the rest.
  ['07-my-finds-desktop', '11-plain-shell', 'none'],
  // Admirers (who put a find on the table for yours) — its own nav row.
  ['07-my-finds-desktop', '11-admirers-shell', 'eyeing'],
]

for (const [src, out, active] of PAGES) {
  console.log(`== ${src}`)
  run('apply-shell.mjs', `stitch/${src}.html`, `stitch/${out}.html`, active, `Revision of ${src} — standing shell decisions only.`)
}
run('build-revisions.mjs')
run('build-parts.mjs')
