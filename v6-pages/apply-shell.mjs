/* Applies the agreed V6 shell to a Stitch page and writes a revision.
 *
 *   node v6-pages/apply-shell.mjs <source.html> <out.html> <active-nav-id> "<note>"
 *
 * Decisions it encodes (Alex, 2026-09-26):
 *   1. No search. The deck is random; nobody searches.
 *   2. Navigation leaves the top bar for a left side nav (256px, collapses to
 *      a 72px rail). The top bar keeps brand, streak, points, bell, account.
 *
 * active-nav-id: discover | swaps | finds | points | profile | settings
 */
import fs from 'node:fs'
import { brandHead } from './brand.mjs'

const [src, out, active = 'discover', note = ''] = process.argv.slice(2)
if (!src || !out) {
  console.error('usage: apply-shell.mjs <source.html> <out.html> <active-nav-id> "<note>"')
  process.exit(1)
}
let s = fs.readFileSync(src, 'utf8')

// Stitch pages do not share one header (S5 has no search and a 64px bar), so
// each cut is optional and reported rather than required.
function cut(re, label) {
  if (!re.test(s)) return console.log('  (no ' + label + ' in this page)')
  s = s.replace(re, '')
  console.log('  removed ' + label)
}
// 1. Search in the top bar.
cut(/<div class="hidden xl:flex items-center flex-1 max-w-xl mx-space-sm">[\s\S]*?Within 10 km \(Hunter\)<\/button><\/div><\/div>/, 'top-bar search')
// 2. Top-bar nav — the first <nav> inside <header>.
{
  const h0 = s.indexOf('<header'), h1 = s.indexOf('</header>')
  const header = s.slice(h0, h1)
  const nav = header.match(/<nav class="hidden lg:flex[\s\S]*?<\/nav>/)
  if (nav) {
    s = s.slice(0, h0) + header.replace(nav[0], '') + s.slice(h1)
    console.log('  removed top-bar nav')
  } else console.log('  (no top-bar nav in this page)')
}
// 3. No price estimates (Alex, 2026-09-27): Bartefy never puts a money value
//    on a find. Stitch draws them as "Est. $180", "Valuation: ~$380" and an
//    "Estimated Valuation" field in the listing form.
{
  const n0 = s.length
  s = s.replace(/<span[^>]*>\s*Est\. \$[^<]*<\/span>/g, '')
  s = s.replace(/<span[^>]*>\s*Valuation: ~\$[^<]*<\/span>/g, '')
  s = s.replace(/<div class="space-y-1\.5">\s*<label[^>]*>Estimated Valuation[\s\S]*?<\/div>\s*<\/div>/, '')
  if (s.length !== n0) console.log('  removed price estimates')
  if (/Est\. \$|Valuation: ~\$|Estimated Valuation/.test(s)) throw new Error('a price estimate survived — extend the cuts above')
}
// The side nav starts under the bar, whatever height this page gave it.
const barHeight = /<header[^>]*>\s*<div class="h-16/.test(s) ? 'top-16' : 'top-20'
// Account name + tier: there is room for it now.
s = s.replace('<div class="hidden 2xl:flex flex-col text-left leading-tight">', '<div class="hidden lg:flex flex-col text-left leading-tight">')

const ITEM = 'flex items-center gap-3 px-3 min-h-11 py-2 rounded-lg text-[14px] leading-5 font-bold tracking-[0.02em] transition-colors'
const IDLE = ITEM + ' text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
const ACTIVE = ITEM + ' bg-primary-container text-on-primary-container font-bold shadow-sm'
const icon = (n) => `<span class="material-symbols-outlined text-[20px] shrink-0">${n}</span>`

const RED = ['bg-error-container text-on-error-container', '3 expiring']
const GREEN = ['bg-secondary-container text-on-secondary-container', '6/6 Live']
// Counts never read past 99 (Alex, 2026-09-29: "do not exceed 99+").
const cap = (n) => (n > 99 ? '99+' : String(n))
const EYEING_N = 128
const SUN = ['bg-tertiary-fixed text-on-tertiary-fixed', `${cap(EYEING_N)} admirers`]
const PRIMARY = [
  { id: 'discover', icon: 'style', label: 'Discover Deck' },
  { id: 'swaps', icon: 'handshake', label: 'Active Swaps &amp; Offers', badge: RED, dot: 'bg-error' },
  { id: 'finds', icon: 'inventory_2', label: 'My finds', badge: GREEN, dot: 'bg-secondary' },
  // Who put a find on the table for yours, for free (hidden offers). Collector only.
  { id: 'eyeing', icon: 'favorite', label: 'Admirers', badge: SUN, dot: 'bg-tertiary' },
  { id: 'points', icon: 'toll', label: 'Points &amp; Tiers' },
]
const SECONDARY = [
  { id: 'profile', icon: 'person', label: 'Profile' },
  { id: 'settings', icon: 'settings', label: 'Settings' },
]

// Where each row goes. Only the pages that have a V6 revision are real links;
// the rest say so instead of doing nothing (data-missing → a toast).
const HREF = {
  discover: '02-discover-desktop-r1.html',
  swaps: '04-active-swaps-desktop-r1.html',
  finds: '08-my-finds-desktop-r1.html',
  points: '06-points-tiers-desktop-r1.html',
  eyeing: '20-admirers-b.html',
}
// Every ＋ opens the V6 listing form (build-revisions.mjs → 18-add-b.html).
const ADD_HREF = '18-add-b.html'
const target = (d) => (HREF[d.id] ? `href="${HREF[d.id]}"` : `href="#" data-missing="${d.label.replace('&amp;', '&')} has no V6 design yet"`)

// Status badges sit BELOW the label: inline they overflow 256px.
const row = (d) => {
  const on = d.id === active
  const b = d.badge ? `<span class="self-start mt-1 ${d.badge[0]} text-[11px] leading-[14px] font-bold tracking-[0.05em] px-1.5 py-0.5 rounded-full">${d.badge[1]}</span>` : ''
  return `<a ${on ? 'aria-current="page" ' : ''}class="${on ? ACTIVE : IDLE}" ${target(d)}>${icon(d.icon)}<span class="flex flex-col min-w-0 flex-1"><span class="truncate">${d.label}</span>${b}</span></a>`
}
// Rail: icon only; the name shows in a tooltip to the right on hover/focus.
const railTip = (label) => `<span role="tooltip" class="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 whitespace-nowrap rounded-md bg-inverse-surface text-inverse-on-surface px-2.5 py-1.5 text-[12px] leading-4 font-semibold shadow-md opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150">${label}</span>`
const railRow = (d) => {
  const on = d.id === active
  const c = (on ? ACTIVE : IDLE).replace('gap-3 px-3 min-h-11 py-2', 'group relative justify-center w-12 h-12 mx-auto')
  const dot = d.dot ? `<span class="absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${d.dot} ring-2 ring-surface"></span>` : ''
  const tip = d.badge ? `${d.label} · ${d.badge[1]}` : d.label
  return `<a ${on ? 'aria-current="page" ' : ''}class="${c}" ${target(d)} aria-label="${tip}">${icon(d.icon)}${dot}${railTip(tip)}</a>`
}

const LANGS = [['en', 'EN', 'English'], ['ka', 'KA', 'ქართული'], ['de', 'DE', 'Deutsch'], ['fr', 'FR', 'Français'], ['es', 'ES', 'Español'], ['lv', 'LV', 'Latviešu']]

/* The shell's behaviour, so the pages can be clicked through:
 *   - Collapse / Expand swap the 256px nav for the 72px rail; remembered
 *     across pages (localStorage "v6.navCollapsed"). Tablet (768–1023px)
 *     always shows the rail. Phone has neither — the TabBar is not drawn yet.
 *   - Language opens a menu; Dark theme flips its label. Neither has a design
 *     to switch to yet, so both say so.
 *   - Anything with data-missing shows a toast instead of navigating.
 * Plain CSS, not Tailwind classes: build-parts.mjs cuts the asides out without
 * this <style>, and the cut copies must stay visible. */
const SHELL_STYLE = `<style id="v6-shell">
#side-nav-collapsed{display:none}
@media (min-width:768px) and (max-width:1023.98px){#side-nav-collapsed{display:flex}.v6-main{padding-left:72px}#nav-expand{display:none}}
@media (min-width:1024px){html.nav-collapsed #side-nav{display:none}html.nav-collapsed #side-nav-collapsed{display:flex}html.nav-collapsed .v6-main{padding-left:72px}}
#v6-toast{transition:opacity .2s cubic-bezier(.2,0,0,1),transform .2s cubic-bezier(.2,0,0,1)}
/* The B in the top bar sits in the same column as the side nav: 16px in (the
   full nav's padding), 12px when collapsed or on tablet (a 48px item centred
   in the 72px rail). */
@media (min-width:768px) and (max-width:1023.98px){.v6-brand-slot{padding-left:12px!important}}
@media (min-width:1024px){html.nav-collapsed .v6-brand-slot{padding-left:12px!important}}
/* The slot is as wide as the side nav, so whatever follows it in the bar (a
   page's context — Discover's area chip) starts on the content's left edge. */
@media (min-width:768px) and (max-width:1023.98px){.v6-brand-slot{width:72px}}
@media (min-width:1024px){.v6-brand-slot{width:256px}html.nav-collapsed .v6-brand-slot{width:72px}}
/* B | Bartefy only beside the full side nav; the B alone over the rail. */
@media (max-width:1023.98px){.v6-brand-word{display:none!important}}
@media (min-width:1024px){html.nav-collapsed .v6-brand-word{display:none!important}}
.v6-tabs{display:none}
@media (max-width:767.98px){html:not(.tabs-points) .v6-tabs-you{display:block}html.tabs-points .v6-tabs-points{display:block}.v6-main{padding-bottom:96px}#v6-toast{bottom:92px}}
</style>
<script>try{if(localStorage.getItem('v6.navCollapsed')==='1')document.documentElement.classList.add('nav-collapsed')}catch(e){}</script>`

const SHELL_SCRIPT = `<div id="v6-toast" role="status" aria-live="polite" class="fixed left-1/2 bottom-6 z-[80] -translate-x-1/2 translate-y-2 opacity-0 pointer-events-none rounded-lg bg-inverse-surface text-inverse-on-surface px-4 py-2.5 text-[13px] leading-5 font-semibold shadow-lg"></div>
<script>
(() => {
  const html = document.documentElement
  const toast = document.getElementById('v6-toast')
  let t
  const say = (msg) => {
    toast.textContent = msg
    toast.style.opacity = '1'; toast.style.transform = 'translate(-50%, 0)'
    clearTimeout(t); t = setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translate(-50%, 8px)' }, 2400)
  }
  const setCollapsed = (on) => {
    html.classList.toggle('nav-collapsed', on)
    try { localStorage.setItem('v6.navCollapsed', on ? '1' : '0') } catch (e) {}
  }
  // Bottom sheets (phone): #sheet-<id>, opened by [data-sheet-open=id].
  const sheet = (id, on) => {
    const el = document.getElementById('sheet-' + id)
    if (!el) return false
    el.hidden = !on
    document.body.style.overflow = on ? 'hidden' : ''
    return true
  }
  const closeSheets = () => document.querySelectorAll('[data-sheet]').forEach((el) => { el.hidden = true; document.body.style.overflow = '' })
  const menus = () => document.querySelectorAll('[data-lang-menu]')
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-missing], #nav-collapse, #nav-expand, [data-lang-btn], [data-lang], [data-theme-btn], [data-add-find], [data-sheet-open], [data-sheet-close]')
    if (!el || !el.matches('[data-lang-btn], [data-lang]')) menus().forEach((m) => { if (!m.contains(e.target)) m.hidden = true })
    if (!el) return
    if (el.matches('[data-missing]')) { e.preventDefault(); say(el.dataset.missing) }
    else if (el.matches('[data-sheet-close]')) closeSheets()
    else if (el.matches('[data-sheet-open]')) { e.preventDefault(); closeSheets(); if (!sheet(el.dataset.sheetOpen, true)) say('Nothing to open here') }
    else if (el.id === 'nav-collapse') setCollapsed(true)
    else if (el.id === 'nav-expand') setCollapsed(false)
    else if (el.matches('[data-lang-btn]')) { const m = el.parentElement.querySelector('[data-lang-menu]'); m.hidden = !m.hidden; el.setAttribute('aria-expanded', String(!m.hidden)) }
    else if (el.matches('[data-lang]')) {
      document.querySelectorAll('[data-lang-code]').forEach((c) => (c.textContent = el.dataset.code))
      document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.lang === el.dataset.lang)))
      menus().forEach((m) => (m.hidden = true))
      if (el.dataset.lang !== 'en') say(el.dataset.name + ' — the mock stays in English; the app has the ' + (el.dataset.lang === 'ka' ? 'full pack' : 'EN fallback'))
    } else if (el.matches('[data-theme-btn]')) {
      const dark = el.getAttribute('aria-pressed') !== 'true'
      document.querySelectorAll('[data-theme-btn]').forEach((b) => {
        b.setAttribute('aria-pressed', String(dark))
        b.querySelector('.material-symbols-outlined').textContent = dark ? 'light_mode' : 'dark_mode'
        b.querySelector('[data-theme-label]').textContent = dark ? 'Light theme' : 'Dark theme'
      })
      if (dark) say('No dark V6 design yet — the page stays light')
    } else if (el.matches('[data-add-find]')) {
      // Stitch's old listing dialog is retired: ＋ always goes to the V6 form.
      closeSheets()
    }
  })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { menus().forEach((m) => (m.hidden = true)); closeSheets() } })
  // Deep links for the tracker: #add opens the listing form, #sheet-<id> a sheet,
  // ?tabs=points shows the alternative tab bar.
  if (location.hash === '#add') { const m = document.getElementById('listingModal'); if (m) { m.classList.remove('hidden'); m.classList.add('flex') } }
  if (location.hash.startsWith('#sheet-')) sheet(location.hash.slice(7), true)
  if (new URLSearchParams(location.search).get('tabs') === 'points') html.classList.add('tabs-points')
})()
</script>`

/* ── Phone navigation (Alex, 2026-09-27: "how will phone V6 navigation look?")
 * A bottom tab bar — Discover · Swaps · ＋Add · Finds · You — under the phone
 * top bar from topbar R2. "You" opens a sheet with the account, Points &
 * Tiers, Profile, Settings, language, theme and sign out.
 * Alternative arm (?tabs=points): Points takes the fifth slot; You moves to
 * the avatar in the top bar. Both are drawn so they can be compared. */
const AVATAR = (s.match(/<img alt="Profile"[^>]*?src="([^"]+)"/) || [])[1]
const avatarImg = (cls) => (AVATAR ? `<img alt="" class="${cls} rounded-full object-cover" src="${AVATAR}">` : `<span class="${cls} rounded-full grid place-items-center bg-surface-container-high material-symbols-outlined text-[18px]">person</span>`)
const TAB = 'group flex flex-col items-center justify-center gap-1 h-full outline-none'
const tab = ({ id, icon: g, label, href, badge, you }) => {
  const on = id === active
  const pill = `relative grid place-items-center w-14 h-8 rounded-full transition-colors ${on ? 'bg-primary-fixed text-primary' : 'text-on-surface-variant group-active:bg-surface-container-high'}`
  const glyph = you ? avatarImg('w-7 h-7') : `<span class="material-symbols-outlined text-[24px]" ${on ? `style="font-variation-settings:'FILL' 1"` : ''}>${g}</span>`
  const b = badge ? `<span class="absolute -top-1 right-1.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-error text-on-error text-[10px] font-bold leading-none ring-2 ring-surface-container-lowest">${badge}</span>` : ''
  const go = you ? 'href="#" data-sheet-open="you"' : href ? `href="${href}"` : ''
  return `<a ${on ? 'aria-current="page" ' : ''}class="${TAB}" ${go}><span class="${pill}">${glyph}${b}</span><span class="text-[11px] leading-[14px] ${on ? 'font-bold text-primary' : 'font-semibold text-on-surface-variant'}">${label}</span></a>`
}
const ADD_TAB = `<a data-add-find href="${ADD_HREF}" class="${TAB}" aria-label="Add a find"><span class="-mt-6 grid place-items-center w-14 h-14 rounded-full bg-coral text-ink shadow-[0_6px_16px_rgba(238,139,106,0.4)] ring-4 ring-surface-container-lowest"><span class="material-symbols-outlined text-[28px]">add</span></span><span class="text-[11px] leading-[14px] font-semibold text-on-surface-variant">Add</span></a>`
const tabBar = (fifth, cls) => `<nav aria-label="Main" data-tabs="${fifth}" class="${cls} v6-tabs fixed inset-x-0 bottom-0 z-40 bg-surface-container-lowest shadow-[0_-1px_12px_rgba(0,0,0,0.07)] pb-[env(safe-area-inset-bottom)]"><div class="grid grid-cols-5 h-16">
${tab({ id: 'discover', icon: 'style', label: 'Discover', href: HREF.discover })}
${tab({ id: 'swaps', icon: 'handshake', label: 'Swaps', href: HREF.swaps, badge: '3' })}
${ADD_TAB}
${tab({ id: 'finds', icon: 'inventory_2', label: 'Finds', href: HREF.finds })}
${fifth === 'you' ? tab({ id: 'you', label: 'You', you: true, badge: cap(EYEING_N) }) : tab({ id: 'points', icon: 'toll', label: 'Points', href: HREF.points })}
</div></nav>`

const sheetRow = (g, label, extra = '', attrs = '') => `<a ${attrs} class="flex items-center gap-3 px-5 h-14 text-[15px] text-on-surface active:bg-surface-container-low">${`<span class="material-symbols-outlined text-[22px] text-on-surface-variant">${g}</span>`}<span class="flex-1">${label}</span>${extra}</a>`
const chev = '<span class="material-symbols-outlined text-[20px] text-outline">chevron_right</span>'
const YOU_SHEET = `<div id="sheet-you" data-sheet hidden class="fixed inset-0 z-[70]">
<div data-sheet-close class="absolute inset-0 bg-inverse-surface/40"></div>
<div role="dialog" aria-label="You" class="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-surface-container-lowest shadow-[0_-12px_40px_rgba(31,27,24,0.2)] pb-[env(safe-area-inset-bottom)]">
<div class="flex justify-center pt-2.5 pb-1"><span class="w-10 h-1 rounded-full bg-outline-variant"></span></div>
<a href="12-profile-b.html" class="flex items-center gap-3 px-5 py-3">${avatarImg('w-12 h-12')}<span class="flex-1 min-w-0"><span class="block text-[16px] leading-6 font-bold text-on-surface">Maya L.</span><span class="block text-[13px] leading-5 text-on-surface-variant">Hunter tier · View profile</span></span>${chev}</a>
<a href="${HREF.points}" class="mx-4 my-2 flex items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3"><span class="material-symbols-outlined text-[24px] text-tertiary">toll</span><span class="flex-1"><span class="block text-[16px] leading-6 font-bold text-on-surface">420 pts</span><span class="block text-[13px] leading-5 text-on-surface-variant">Points &amp; Tiers · 180 more for Collector</span></span>${chev}</a>
<div class="h-px bg-surface-variant mx-5 my-1"></div>
${sheetRow('favorite', 'Admirers', `<span class="min-w-[22px] h-5 px-1.5 grid place-items-center rounded-full bg-error text-on-error text-[11px] font-bold leading-none">${cap(EYEING_N)}</span>${chev}`, 'href="20-admirers-b.html"')}
${sheetRow('person', 'Profile', chev, 'href="12-profile-b.html"')}
${sheetRow('settings', 'Settings', chev, 'href="13-settings-b.html"')}
<div class="relative">
<button type="button" data-lang-btn aria-expanded="false" class="w-full flex items-center gap-3 px-5 h-14 text-[15px] text-on-surface text-left active:bg-surface-container-low"><span class="material-symbols-outlined text-[22px] text-on-surface-variant">translate</span><span class="flex-1">Language</span><span data-lang-code class="text-[11px] leading-[14px] font-bold tracking-[0.05em] bg-surface-container-high px-2 py-0.5 rounded-full">EN</span></button>
<div data-lang-menu role="menu" hidden class="mx-4 mb-2 rounded-xl ring-1 ring-surface-variant py-1">
${LANGS.map(([id, code, name]) => `<button type="button" role="menuitemradio" aria-checked="${id === 'en'}" data-lang="${id}" data-code="${code}" data-name="${name}" class="group w-full flex items-center gap-3 px-3 h-11 text-left text-[15px] text-on-surface"><span class="w-7 text-[11px] font-bold tracking-[0.05em] text-on-surface-variant">${code}</span><span class="flex-1">${name}</span><span class="material-symbols-outlined text-[18px] text-primary opacity-0 group-aria-checked:opacity-100">check</span></button>`).join('')}
</div></div>
<button type="button" data-theme-btn aria-pressed="false" class="w-full flex items-center gap-3 px-5 h-14 text-[15px] text-on-surface text-left active:bg-surface-container-low"><span class="material-symbols-outlined text-[22px] text-on-surface-variant">dark_mode</span><span data-theme-label class="flex-1">Dark theme</span></button>
<div class="h-px bg-surface-variant mx-5 my-1"></div>
${sheetRow('logout', 'Sign out', '', 'href="#" data-missing="Sign out is not part of the mock"')}
<p class="px-5 pt-2 pb-5 text-[11px] text-outline">Bartefy v6.0.0 · build 8e6d1c3</p>
</div></div>`

const PHONE_NAV = `<!-- V6 phone navigation (apply-shell.mjs): tab bar + the "You" sheet. -->
${tabBar('you', 'v6-tabs-you')}
${tabBar('points', 'v6-tabs-points')}
${YOU_SHEET}`

const SIDE_NAV = `<!-- V6 side navigation (apply-shell.mjs). Everything that takes you somewhere
     lives here; the top bar keeps only brand + live status + account. -->
${SHELL_STYLE}
<aside id="side-nav" class="hidden lg:flex fixed ${barHeight} bottom-0 left-0 w-64 z-40 flex-col gap-space-xs bg-surface px-space-md py-space-md shadow-[1px_0_8px_rgba(0,0,0,0.04)] overflow-y-auto">
<a data-add-find class="flex items-center justify-center gap-2 h-11 mb-space-sm rounded-xl bg-coral text-ink text-[14px] leading-5 font-bold tracking-[0.02em] shadow-sm hover:brightness-95 transition-colors" href="${ADD_HREF}"><span class="material-symbols-outlined text-[20px]">add_circle</span>Add a find</a>
<nav aria-label="Main" class="flex flex-col gap-space-xs">
${PRIMARY.map(row).join('\n')}
</nav>
<!-- Profile, Settings, Language and Theme live in the account menu (top bar)
     and the phone "You" sheet — Alex, 2026-09-27: not in two places. -->
<div class="mt-auto flex flex-col gap-space-xs pt-space-sm">
<div class="h-px bg-surface-variant mb-space-sm"></div>
<button id="nav-collapse" class="${IDLE}" type="button">${icon('left_panel_close')}<span class="flex-1 text-left">Collapse</span></button>
</div>
</aside>
<!-- Collapsed variant (72px): the tablet rail, and desktop after "Collapse".
     Shown by the #v6-shell style above, never by a class. -->
<aside id="side-nav-collapsed" class="fixed ${barHeight} bottom-0 left-0 w-[72px] z-40 flex-col gap-space-xs bg-surface py-space-md shadow-[1px_0_8px_rgba(0,0,0,0.04)]">
<a data-add-find class="group relative flex items-center justify-center w-12 h-12 mx-auto mb-space-sm rounded-full bg-coral text-ink shadow-sm hover:brightness-95" href="${ADD_HREF}" aria-label="Add a find"><span class="material-symbols-outlined text-[22px]">add</span>${railTip('Add a find')}</a>
${PRIMARY.map(railRow).join('\n')}
<div class="mt-auto"><button id="nav-expand" type="button" aria-label="Expand" class="${IDLE.replace('gap-3 px-3 min-h-11 py-2', 'group relative justify-center w-12 h-12 mx-auto')}">${icon('left_panel_open')}${railTip('Expand')}</button></div>
</aside>
`
const at = s.indexOf('</header>') + '</header>'.length
if (at < 9) throw new Error('no </header>')
s = s.slice(0, at) + SIDE_NAV + s.slice(at)

// The page's own <main> and <footer> (not the inner <main> some pages nest).
s = s.replace(/<main class="w-full pt-/, '<main class="v6-main w-full lg:pl-64 pt-')
// 4. No footer (Alex, 2026-09-27): "it does not do anything" — an app screen
//    has no page end. Every Stitch page draws one; all of them go.
s = s.replace(/<footer class="w-full [\s\S]*?<\/footer>/, '')
if (s.includes('<footer')) throw new Error('a footer survived — extend the cut above')
s = s.replace('</body>', `${PHONE_NAV}\n${SHELL_SCRIPT}\n</body>`)
if (!s.includes('lg:pl-64 pt-')) throw new Error('no top-level <main class="w-full pt-…"> to make room in')

s = s.replace(/<html[^>]*>/, (tag) => `${tag}
<!-- V6 revision of ${src.split('/').pop()} -- generated by apply-shell.mjs.
     Standing decisions: no search; nav in a left side nav.
     ${note} -->`)

// 5. Brand Book colours and type (Alex, 2026-09-27) — see brand.mjs.
s = brandHead(s)

fs.writeFileSync(out, s)
console.log('wrote', out)
