/* Organism revisions — our redesigns of individual Stitch organisms.
 *
 *   node v6-pages/build-revisions.mjs        (from client/)
 *
 * Run AFTER apply-shell.mjs (which regenerates the page revisions from the
 * Stitch originals and would wipe these patches) and BEFORE build-parts.mjs.
 *
 * For each revision:
 *   1. writes an organism sheet  stitch/organisms/<name>.html  showing every
 *      state side by side, in the Stitch page's own <head> (same tokens)
 *   2. swaps the organism into the page revision, between two comment
 *      markers from the Stitch source, so it can be seen in context
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { brandHead } from './brand.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8')
const write = (f, s) => {
  fs.mkdirSync(path.dirname(path.join(here, f)), { recursive: true })
  fs.writeFileSync(path.join(here, f), s)
  console.log('wrote', f)
}
const headOf = (html) => html.slice(html.indexOf('<head>'), html.indexOf('</head>') + '</head>'.length)
const icon = (name, cls = '') => `<span class="material-symbols-outlined ${cls}">${name}</span>`

/* ORZOMI — Bartefy's parent company (Alex, 2026-09-28: "put it somewhere so I
 * can see it"). The vendor vector from src/components/ui/orzomi.tsx, unmodified;
 * currentColor, sized by height. */
const ORZOMI_PATH = 'M540 94v754h-476v-754zm-454 22v710h432v-710z M306.6 298.8c0-49.62-40.18-89.8-89.8-89.8-49.62 0-89.8 40.18-89.8 89.8 0 49.62 40.18 89.8 89.8 89.8 49.62 0 89.8-40.18 89.8-89.8zm-20.32 0c0 38.34-31.14 69.48-69.48 69.48-38.35 0-69.48-31.14-69.48-69.48 0-38.35 31.13-69.48 69.48-69.48 38.34 0 69.48 31.13 69.48 69.48z M339 243h54.51c24.05 0 37.68 13.5 37.68 35.1 0 14.39-8.82 26.09-24.05 30.59l28.86 45h-22.45l-27.25-42.3h-28.86v42.3h-18.44zm18.44 49.49h32.87c13.62 0 21.64-5.4 21.64-15.3 0-9.9-8.02-15.3-21.64-15.3h-32.87z M172.03 416h88.94v16.15l-63.67 75.09h66.7v17.76h-95v-16.15l63.67-75.09h-60.64z M477.8 470.8c0-49.62-40.18-89.8-89.8-89.8-49.62 0-89.8 40.18-89.8 89.8 0 49.62 40.18 89.8 89.8 89.8 49.62 0 89.8-40.18 89.8-89.8zm-20.32 0c0 38.34-31.14 69.48-69.48 69.48-38.34 0-69.48-31.14-69.48-69.48 0-38.35 31.14-69.48 69.48-69.48 38.34 0 69.48 31.13 69.48 69.48z M154 591h18.58l44.42 70.4 43.42-70.4h19.58v110.4h-22.35v-72l-34.5 59.6h-12.3l-34.5-59.6v72h-22.35z M399 591v111h-23v-111z'
const orzomiMark = (h = 34) => `<svg viewBox="64 94 476 754" fill="none" aria-hidden="true" style="height:${h}px;width:auto" class="shrink-0"><path fill="currentColor" fill-rule="evenodd" d="${ORZOMI_PATH}"/></svg>`
// "A product of ORZOMI" — one wording everywhere (OrzomiByline.tsx), muted by opacity.
const orzomiByline = (cls = '') => `<a href="https://orzomi.com" target="_blank" rel="noopener noreferrer" class="group inline-flex items-center gap-3 font-body-sm text-[13px] tracking-[0.01em] text-on-surface opacity-55 hover:opacity-90 transition-opacity ${cls}">${orzomiMark(34)}A product of ORZOMI</a>`
// Shared pieces later blocks reuse (the person card kit is filled by the Profile block).
const V6_KIT = {}
// B | Bartefy — the Brand Book lockup the app top bar uses (tile · hairline · wordmark).
const lockup = (big) => `<span class="flex items-center gap-4"><span class="grid place-items-center ${big ? 'w-12 h-12' : 'w-11 h-11'} rounded-[22%] bg-[#1B6B55]"><img alt="" class="block w-auto max-w-none" style="height:${big ? 30 : 27}px" src="../brand/symbol-white.png"></span><span aria-hidden="true" class="block w-px h-8 bg-[#1B6B55]/25"></span><img alt="Bartefy" class="block w-[${big ? 110 : 100}px] h-auto" src="../brand/wordmark-green.png"></span>`

/* ───────────────────────────── deck_actions R1 ─────────────────────────────
 * Alex, 2026-09-26: remove the "← Pass → Offer" key legend; make the buttons
 * look good; five buttons.
 *
 * The five are the app's real actions (components/hunt/ActionButtons.tsx):
 * Undo · Pass · Put on Table (want) · Super · Boost. The mock's "Eye" is
 * dropped — it meant something the app does not do — and Boost, missing from
 * the mock, is back.
 *
 * Rules applied (project-v6-organism-recipe):
 *   - ONE loud element: only Put on Table is filled (terracotta).
 *   - Uniform sizes: every circle is the same size; colour marks the primary,
 *     not scale.
 *   - Status marks, not buttons, carry colour: the cost / lock badges.
 *   - Motion: transform only, 200ms cubic-bezier(0.2,0,0,1). No looping.
 */
function deckActions({ size = 'wide', undo = 'locked', points = 420 } = {}) {
  const phone = size === 'compact'
  const col = phone ? 'w-[66px]' : 'w-20'
  const circle = phone ? 'w-[52px] h-[52px]' : 'w-16 h-16'
  const glyph = phone ? 'text-[24px]' : 'text-[28px]'
  const label = phone ? 'text-[11px] leading-[14px] font-semibold' : 'font-label-md text-label-md'

  const base =
    'relative grid place-items-center rounded-full transition-[transform,box-shadow] duration-200 ease-[cubic-bezier(0.2,0,0,1)] group-hover:-translate-y-0.5 group-active:translate-y-0 group-active:scale-95 group-focus-visible:ring-[3px] group-focus-visible:ring-primary/40'
  const quiet = `${base} bg-surface-container-lowest ring-1 ring-outline-variant/50 shadow-[0_2px_8px_rgba(31,27,24,0.08)] group-hover:shadow-[0_8px_18px_rgba(31,27,24,0.14)]`
  const loud = `${base} bg-primary text-on-primary shadow-[0_6px_18px_rgba(27,107,85,0.32)] group-hover:shadow-[0_10px_24px_rgba(27,107,85,0.38)]`

  const badge = (content, tone) =>
    `<span class="absolute -top-1 -right-1.5 flex items-center gap-0.5 h-5 px-1.5 rounded-full ring-2 ring-surface-container-lowest font-label-sm text-[10px] leading-none ${tone}">${content}</span>`
  const cost = (n) =>
    points >= n
      ? badge(`${icon('toll', 'text-[12px]')}${n}`, 'bg-tertiary-fixed text-on-tertiary-fixed')
      : badge(`${icon('toll', 'text-[12px]')}${n}`, 'bg-surface-container-high text-outline')

  const btn = ({ id, name, glyphName, glyphTone, loudBtn = false, extra = '', dim = false, title }) => `
<button type="button" class="group flex flex-col items-center gap-1.5 ${col} outline-none ${dim ? 'opacity-55' : ''}" data-action="${id}" aria-label="${title ?? name}" title="${title ?? name}">
  <span class="${loudBtn ? loud : quiet} ${circle}">${icon(glyphName, `${glyph} ${loudBtn ? '' : glyphTone}`)}${extra}</span>
  <span class="${label} whitespace-nowrap ${loudBtn ? 'text-primary font-bold' : 'text-on-surface-variant'}">${name}</span>
</button>`

  const undoBtn =
    undo === 'locked'
      ? btn({ id: 'undo', name: 'Undo', glyphName: 'undo', glyphTone: 'text-outline', extra: badge(icon('lock', 'text-[12px]'), 'bg-tertiary-fixed text-on-tertiary-fixed'), title: 'Undo your last pass — a Collector perk' })
      : undo === 'ready'
        ? btn({ id: 'undo', name: 'Undo', glyphName: 'undo', glyphTone: 'text-on-surface' })
        : btn({ id: 'undo', name: 'Undo', glyphName: 'undo', glyphTone: 'text-outline', dim: true, title: 'Nothing to undo yet' })

  return `<div class="w-full bg-surface-container-lowest rounded-xl ${phone ? 'px-2 py-3' : 'px-space-lg py-4'} shadow-md" data-organism="deck_actions" data-variant="${size}">
<div role="group" aria-label="Decide on this find" class="flex items-start justify-center ${phone ? 'gap-1' : 'gap-6'}">
${undoBtn}
${btn({ id: 'pass', name: 'Pass', glyphName: 'close', glyphTone: 'text-on-surface' })}
${btn({ id: 'want', name: 'Put on Table', glyphName: 'handshake', loudBtn: true, title: 'Put one of your finds on the table for this one' })}
${btn({ id: 'super', name: 'Super', glyphName: 'bolt', glyphTone: 'text-tertiary', extra: cost(50), dim: points < 50, title: points < 50 ? 'Super offer — you need 50 pts' : 'Super offer — lands at the top of their offers (50 pts)' })}
${btn({ id: 'boost', name: 'Boost', glyphName: 'trending_up', glyphTone: 'text-secondary', extra: cost(75), dim: points < 75, title: points < 75 ? 'Boost one of your finds — you need 75 pts' : 'Boost one of your finds for a day (75 pts)' })}
</div>
</div>`
}

/* ─────────────────────────────── build ─────────────────────────────── */
const S1 = read('stitch/01-discover-desktop.html')
// Sheets wear the Brand Book palette too (brand.mjs), like the page revisions.
const head = brandHead(headOf(S1))

const state = (id, title, note, width, body) => `
<section id="${id}" data-part="${id}" class="mb-10">
  <h2 class="font-headline-sm text-headline-sm text-on-surface">${title}</h2>
  <p class="font-body-sm text-body-sm text-on-surface-variant mb-3">${note}</p>
  <div style="width:${width}px">${body}</div>
</section>`

write(
  'stitch/organisms/deck-actions-r1.html',
  `<!DOCTYPE html><html lang="en">
<!-- deck_actions R1 — generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-background font-body-md text-on-surface antialiased p-10">
<h1 class="font-headline-lg text-headline-lg mb-2">Deck action bar — R1</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-8 max-w-2xl">Five buttons: Undo · Pass · Put on Table · Super · Boost. No key legend. One filled button; equal sizes; cost and lock shown as small badges.</p>
${state('wide', 'Wide — desktop, Hunter (undo locked)', 'Under the card, 8 of 12 columns.', 736, deckActions({ size: 'wide', undo: 'locked' }))}
${state('collector', 'Wide — desktop, Collector after a pass', 'Undo is live: no lock, full-strength icon.', 736, deckActions({ size: 'wide', undo: 'ready' }))}
${state('low', 'Wide — not enough points', '30 pts: Super and Boost dim, their badges go grey. Still tappable — the tap explains how to earn.', 736, deckActions({ size: 'wide', undo: 'empty', points: 30 }))}
${state('compact', 'Compact — phone, 358px', 'Same five, 52px circles, labels kept.', 358, deckActions({ size: 'compact', undo: 'locked' }))}
</body></html>`,
)

// Put it in the Discover page revision, between the Stitch comment markers.
const PAGE = 'stitch/02-discover-desktop-r1.html'
let page = read(PAGE)
const START = '<!-- Card Actions Bar (Physical Barter Trigger Controls) -->'
const END = '<!-- Interactive Barter Table Drawer Modal'
const a = page.indexOf(START)
const b = page.indexOf(END)
if (a < 0 || b < 0) throw new Error(`${PAGE}: deck_actions markers not found — was it regenerated from a different source?`)
page =
  page.slice(0, a) +
  `<!-- deck_actions R1 (build-revisions.mjs) -->\n<div class="max-md:hidden">${deckActions({ size: 'wide', undo: 'locked' })}</div><div class="md:hidden">${deckActions({ size: 'compact', undo: 'locked' })}</div>\n` +
  page.slice(b)
write(PAGE, page)

/* ─────────────────────────────── topbar R2 ───────────────────────────────
 * Alex, 2026-09-27: detail goes in tooltips; clicking a chip shows the
 * organism behind it. Agreed rule for the four things on the right:
 *
 *   hover → a one-line tooltip          (desktop + tablet only)
 *   click → a popover under the trigger (desktop + tablet)
 *         → a bottom sheet             (phone — no hover, no room)
 *
 *   streak chip → #03 streak, popover size · points chip → points wallet
 *   bell → notifications list · account → menu (Profile, Settings, Sign out,
 *   version)
 *
 * Every size is driven by `platform`, never by md:/lg: classes — those read
 * the window, and the sheet draws a phone bar inside a 1600px window.
 */
const AVATAR_SRC = S1.match(/<img alt="Profile"[^>]*?src="([^"]+)"/)[1]
const EASE = 'duration-200 ease-[cubic-bezier(0.2,0,0,1)]'
const filled = (name, cls = '') => `<span class="material-symbols-outlined ${cls}" style="font-variation-settings:'FILL' 1">${name}</span>`
const RAMP = [2, 3, 4, 5, 6, 7, 7] // visitValue() in lib/points.ts — a full week is 34

/* Streak states (project-v6-streak-redo): first · unclaimed · claimed ·
 * grace · broken · offline. `day` is the day the chip is about. */
const STREAK = {
  claimed: { day: 4, tip: 'Day 4 · +5 pts claimed today' },
  unclaimed: { day: 4, tip: 'Day 4 is waiting · claim +5 pts' },
  grace: { day: 4, tip: 'Your streak ends in 1h 52m' },
  broken: { day: 1, tip: 'New run · your last streak reached 6 days' },
  first: { day: 1, tip: 'Day 1 · +2 pts claimed' },
  offline: { day: 4, tip: 'Offline · your streak is safe, it syncs later' },
}

const tooltip = (text, show) =>
  `<span role="tooltip" class="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 whitespace-nowrap rounded-md bg-inverse-surface text-inverse-on-surface px-2.5 py-1.5 font-label-md text-label-md shadow-md transition-opacity duration-150 ${show ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-[.is-open]:!opacity-0'}">${text}</span>`

// A popover under its trigger — or, `inline`, drawn on its own for the sheet.
const pop = (id, w, body, { open, inline, align = 'right-0' }) =>
  `<div data-pop="${id}" ${open || inline ? '' : 'hidden'} class="${inline ? 'relative' : `absolute ${align} top-full mt-2 z-30`} ${w} rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/50 shadow-[0_16px_40px_rgba(31,27,24,0.18)] text-left overflow-hidden">${body}</div>`

const CHIP = `inline-flex items-center gap-1.5 h-9 px-3 rounded-full ring-1 ring-inset transition-[background-color,box-shadow] ${EASE} outline-none focus-visible:ring-2 focus-visible:ring-primary/50`
const chipTone = (open) => (open ? 'bg-surface-container-lowest ring-outline-variant shadow-sm' : 'bg-surface-container-low ring-transparent hover:bg-surface-container-high hover:ring-outline-variant/60')
// Links between the page revisions. The sheets live one folder down
// (stitch/organisms/), the pages in stitch/ — the page patch sets LINK_BASE = ''.
let LINK_BASE = '../'
const PAGE_FILE = { discover: '02-discover-desktop-r1.html', swaps: '04-active-swaps-desktop-r1.html', points: '06-points-tiers-desktop-r1.html', finds: '08-my-finds-desktop-r1.html', chat: '10-chat-desktop-r1.html' }
const go = (id) => `href="${LINK_BASE}${PAGE_FILE[id]}"`
// Brand assets live in v6-pages/brand/: one level up from the pages, two from the sheets.
const BRAND_ASSET = () => (LINK_BASE === '' ? '../brand/' : '../../brand/')
const missing = (what) => `href="#" data-missing="${what}"`
const footLink = (text, target = 'href="#"') =>
  `<a ${target} class="flex items-center justify-between px-4 py-3 border-t border-surface-variant font-label-lg text-label-lg text-primary hover:bg-surface-container-low">${text}${icon('arrow_forward', 'text-[18px]')}</a>`

// 7 uniform dots. Done = gold, today = terracotta (ringed if unclaimed), later = empty.
function dots(state) {
  const { day } = STREAK[state]
  return `<span class="flex items-center gap-1 ml-0.5" aria-hidden="true">${RAMP.map((_, i) => {
    const d = i + 1
    const tone =
      state === 'offline' ? (d <= day ? 'bg-outline' : 'bg-outline-variant/70')
      : d < day ? 'bg-tertiary-fixed-dim'
      : d === day ? (state === 'unclaimed' || state === 'grace' ? 'ring-[1.5px] ring-inset ring-primary' : 'bg-primary')
      : 'bg-outline-variant/70'
    return `<span class="w-1.5 h-1.5 rounded-full ${tone}"></span>`
  }).join('')}</span>`
}

function streakChip(state, { compact = false, open = false } = {}) {
  const { day } = STREAK[state]
  const muted = state === 'offline'
  const flame = filled('local_fire_department', `text-[18px] ${muted ? 'text-outline' : state === 'grace' ? 'text-error' : 'text-primary'}`)
  const count = state === 'unclaimed' || state === 'grace' ? day - 1 : day
  const tail =
    state === 'unclaimed' ? `<span class="ml-0.5 px-1.5 h-5 inline-flex items-center rounded-full bg-primary text-on-primary text-[11px] leading-none font-bold">+5</span>`
    : state === 'grace' ? `<span class="px-1.5 h-5 inline-flex items-center rounded-full bg-error-container text-on-error-container text-[11px] font-bold">1h 52m</span>`
    : state === 'offline' ? icon('cloud_off', 'text-[16px] text-outline')
    : ''
  return `<button type="button" data-pop-trigger="streak" aria-haspopup="dialog" aria-expanded="${open}" aria-label="Streak: ${STREAK[state].tip}" class="${CHIP} ${chipTone(open)}">${flame}<span class="font-ticker-number text-ticker-number ${muted ? 'text-outline' : 'text-on-surface'}">${count}</span>${compact ? '' : dots(state)}${tail}</button>`
}

function pointsChip(points, { open = false } = {}) {
  const low = points < 50
  return `<button type="button" data-pop-trigger="points" aria-haspopup="dialog" aria-expanded="${open}" aria-label="${points} points" class="${CHIP} ${chipTone(open)}">${icon('toll', `text-[18px] ${low ? 'text-outline' : 'text-tertiary'}`)}<span class="font-ticker-number text-ticker-number text-on-surface">${points}</span><span class="font-label-sm text-label-sm text-on-surface-variant">pts</span></button>`
}

function bellBtn(unread, { open = false } = {}) {
  return `<button type="button" data-pop-trigger="bell" aria-haspopup="dialog" aria-expanded="${open}" aria-label="Notifications${unread ? `, ${unread} new` : ''}" class="relative grid place-items-center w-10 h-10 rounded-full transition-colors ${EASE} ${open ? 'bg-surface-container-high text-on-surface' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}">${icon('notifications', 'text-[22px]')}${unread ? '<span class="absolute top-2 right-2 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-surface"></span>' : ''}</button>`
}

const TIER = {
  hunter: { label: 'Hunter', tone: 'text-on-surface-variant', mark: '' },
  collector: { label: 'Collector', tone: 'text-tertiary', mark: filled('star', 'text-[13px]') },
  curator: { label: 'Curator', tone: 'text-primary', mark: filled('workspace_premium', 'text-[13px]') },
}
function accountBtn(tier, { compact = false, open = false } = {}) {
  const t = TIER[tier]
  const who = compact ? '' : `<span class="flex flex-col text-left leading-tight"><span class="font-label-md text-label-md text-on-surface font-semibold">Maya L.</span><span class="inline-flex items-center gap-0.5 font-label-sm text-label-sm ${t.tone}">${t.mark}${t.label}</span></span>`
  return `<button type="button" data-pop-trigger="account" aria-haspopup="menu" aria-expanded="${open}" class="flex items-center gap-2 h-11 pl-1 pr-2 rounded-full transition-colors ${EASE} ${open ? 'bg-surface-container-high' : 'hover:bg-surface-container-high'}"><img alt="" class="w-8 h-8 rounded-full object-cover shadow-sm" src="${AVATAR_SRC}">${who}${icon('expand_more', `text-on-surface-variant text-[18px] transition-transform ${EASE} ${open ? 'rotate-180' : ''}`)}</button>`
}

/* ── popover bodies ── */
function streakPanel(state) {
  const { day } = STREAK[state]
  const title = { claimed: '4-day streak', unclaimed: 'Day 4 is ready', grace: 'Keep your 4 days', broken: 'A new run starts today', first: 'Your first day', offline: '4-day streak' }[state]
  const line = {
    claimed: '<span class="text-secondary font-semibold">+5 pts claimed today.</span> Tomorrow pays +6.',
    unclaimed: 'Claim today and your run keeps going.',
    grace: '<b class="text-on-surface">Ends in 1h 52m.</b> Claim now to keep the run.',
    broken: 'Your last streak reached 6 days. <span class="text-secondary font-semibold">+2 pts claimed.</span>',
    first: '<span class="text-secondary font-semibold">+2 pts claimed.</span> Come back tomorrow for +3.',
    offline: 'You are offline. Your streak is safe — it syncs when you are back.',
  }[state]
  const pips = RAMP.map((v, i) => {
    const d = i + 1
    let tone, glyph
    if (state === 'offline') { tone = 'bg-surface-container-low text-outline'; glyph = icon(d <= day ? 'check_circle' : 'lock', 'text-[18px]') }
    else if (d < day) { tone = 'bg-surface-container-low text-on-surface-variant'; glyph = icon('check_circle', 'text-[18px] text-secondary') }
    else if (d === day && (state === 'unclaimed' || state === 'grace')) { tone = 'bg-surface-container-lowest ring-2 ring-inset ring-primary text-primary'; glyph = filled('local_fire_department', 'text-[18px]') }
    else if (d === day) { tone = 'bg-primary text-on-primary'; glyph = filled('local_fire_department', 'text-[18px]') }
    else { tone = 'bg-surface-container-low/70 text-outline'; glyph = icon(d === 7 ? 'star' : 'lock', 'text-[18px]') }
    return `<li class="flex flex-col items-center justify-center gap-0.5 h-16 rounded-lg ${tone}"><span class="text-[10px] leading-none font-bold tracking-[0.05em]">${d === day && state !== 'offline' ? 'TODAY' : 'D' + d}</span>${glyph}<span class="font-ticker-number text-[12px] leading-none">+${v}</span></li>`
  }).join('')
  const action =
    state === 'unclaimed' ? `<button type="button" class="mt-4 w-full h-11 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-[0_6px_18px_rgba(27,107,85,0.28)] hover:bg-on-primary-fixed-variant transition-colors">Claim +5 pts</button>`
    : state === 'grace' ? `<button type="button" class="mt-4 w-full h-11 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-[0_6px_18px_rgba(27,107,85,0.28)] hover:bg-on-primary-fixed-variant transition-colors">Keep my streak · +5 pts</button>`
    : `<p class="mt-3 font-body-sm text-body-sm text-on-surface-variant">${state === 'offline' ? 'Last synced 09:14.' : 'Next day unlocks in <b class="text-on-surface">14h 22m</b>. A full week pays <b class="text-on-surface">34 pts</b>.'}</p>`
  const quiet = state === 'offline' ? 'bg-surface-container-high text-outline' : 'bg-primary-fixed text-primary'
  return `<div class="p-4"><div class="flex items-start gap-3"><span class="grid place-items-center w-10 h-10 rounded-lg shrink-0 ${quiet}">${filled('local_fire_department', 'text-[22px]')}</span><div class="min-w-0"><p class="font-headline-sm text-headline-sm text-on-surface">${title}</p><p class="font-body-sm text-body-sm text-on-surface-variant">${line}</p></div></div><ol class="mt-4 grid grid-cols-7 gap-1.5">${pips}</ol>${action}</div>${footLink('See it in Points &amp; Tiers', go('points'))}`
}

function pointsPanel(points) {
  const toCollector = Math.max(0, 600 - points)
  const pct = Math.min(100, Math.round((points / 600) * 100))
  const rows = [
    ['local_fire_department', 'Visit every day', '+2–7'],
    ['add_photo_alternate', 'List a find', '+20'],
    ['handshake', 'An offer of yours is accepted', '+60'],
    ['task_alt', 'Finish a swap', '+160'],
    ['group_add', 'A friend finishes their first swap', '+400'],
  ]
  return `<div class="p-4">
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Your points</p>
<p class="flex items-baseline gap-1.5 mt-1">${icon('toll', 'text-[24px] text-tertiary self-center')}<span class="font-headline-lg text-headline-lg text-on-surface">${points}</span><span class="font-label-md text-label-md text-on-surface-variant">pts</span></p>
<div class="mt-3"><div class="h-2 rounded-full bg-surface-container-high overflow-hidden"><div class="h-full rounded-full bg-tertiary-fixed-dim" style="width:${pct}%"></div></div>
<p class="mt-1.5 font-body-sm text-body-sm text-on-surface-variant">${toCollector ? `<b class="text-on-surface">${toCollector} more</b> unlocks Collector for a month.` : 'Enough for a month of Collector.'}</p></div>
${points < 50 ? `<p class="mt-3 rounded-lg bg-surface-container-low px-3 py-2 font-body-sm text-body-sm text-on-surface-variant">Super needs 50 pts, Boost needs 75.</p>` : ''}
<p class="mt-4 mb-1 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Ways to earn</p>
<ul class="flex flex-col">${rows.map(([g, t, v]) => `<li class="flex items-center gap-3 py-1.5">${icon(g, 'text-[18px] text-on-surface-variant')}<span class="flex-1 font-body-sm text-body-sm text-on-surface">${t}</span><span class="font-ticker-number text-ticker-number text-secondary">${v}</span></li>`).join('')}</ul>
</div>${footLink('Open Points &amp; Tiers', go('points'))}`
}

const NOTIFS = [
  { g: 'handshake', t: 'Someone wants one of your finds', b: 'Liam V. put Levi’s Type III on the table for your Marantz 2215B', at: '12 min', unread: true, to: 'swaps' },
  { g: 'celebration', t: 'It’s a swap — say hello', b: 'Sora K. agreed: Teak Planter ↔ Ceramic Pour-Over Set', at: '1 h', unread: true, to: 'chat' },
  { g: 'chat', t: 'New message', b: 'Julian: “Saturday at the library works?”', at: '3 h', unread: true, to: 'chat' },
  { g: 'task_alt', t: 'Swap finished', b: 'Rate your swap with Anna', at: 'Yesterday', unread: false, to: 'swaps' },
]
function bellPanel(empty) {
  const head = `<div class="flex items-center justify-between px-4 pt-4 pb-2"><p class="font-headline-sm text-headline-sm text-on-surface">Notifications</p>${empty ? '' : '<a href="#" class="font-label-md text-label-md text-primary hover:underline">Mark all read</a>'}</div>`
  if (empty)
    return `${head}<div class="flex flex-col items-center text-center px-6 pt-4 pb-8"><span class="grid place-items-center w-12 h-12 rounded-full bg-surface-container-low text-outline">${icon('notifications', 'text-[24px]')}</span><p class="mt-3 font-label-lg text-label-lg text-on-surface">Nothing waiting</p><p class="mt-1 font-body-sm text-body-sm text-on-surface-variant">Offers, matches and finished swaps show up here.</p></div>`
  return `${head}<ul class="flex flex-col pb-1">${NOTIFS.map((n) => `<li><a ${go(n.to)} class="flex items-start gap-3 px-4 py-2.5 hover:bg-surface-container-low ${n.unread ? '' : 'opacity-75'}"><span class="relative grid place-items-center w-9 h-9 rounded-full shrink-0 bg-surface-container-high text-on-surface-variant">${icon(n.g, 'text-[18px]')}${n.unread ? '<span class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-error ring-2 ring-surface-container-lowest"></span>' : ''}</span><span class="min-w-0 flex-1"><span class="block font-label-lg text-label-lg ${n.unread ? 'text-on-surface' : 'text-on-surface-variant'}">${n.t}</span><span class="block font-body-sm text-body-sm text-on-surface-variant truncate">${n.b}</span></span><span class="font-label-sm text-label-sm text-outline whitespace-nowrap pt-0.5">${n.at}</span></a></li>`).join('')}</ul>${footLink('See all notifications', `href="${LINK_BASE}14-notifications-b.html"`)}`
}

// The account menu = the phone "You" sheet (Alex, 2026-09-27): everything
// about you, nothing about where to go. Language and theme moved here from
// the side nav; the shell script (apply-shell.mjs) drives both.
const MENU_LANGS = [['en', 'EN', 'English'], ['ka', 'KA', 'ქართული'], ['de', 'DE', 'Deutsch'], ['fr', 'FR', 'Français'], ['es', 'ES', 'Español'], ['lv', 'LV', 'Latviešu']]
function accountPanel(tier) {
  const t = TIER[tier]
  const ROW = 'w-full flex items-center gap-3 px-4 h-11 font-body-md text-body-md text-on-surface text-left hover:bg-surface-container-low'
  const item = (g, label) => `<a ${missing(label === 'Sign out' ? 'Sign out is not part of the mock' : label + ' has no V6 design yet')} role="menuitem" class="${ROW}">${icon(g, 'text-[20px] text-on-surface-variant')}${label}</a>`
  const lang = `<div><button type="button" data-lang-btn aria-expanded="false" class="${ROW}">${icon('translate', 'text-[20px] text-on-surface-variant')}<span class="flex-1">Language</span><span data-lang-code class="text-[11px] leading-[14px] font-bold tracking-[0.05em] bg-surface-container-high px-2 py-0.5 rounded-full">EN</span></button>
<div data-lang-menu role="menu" hidden class="mx-3 mb-1 rounded-lg ring-1 ring-surface-variant py-1">${MENU_LANGS.map(([id, code, name]) => `<button type="button" role="menuitemradio" aria-checked="${id === 'en'}" data-lang="${id}" data-code="${code}" data-name="${name}" class="group w-full flex items-center gap-3 px-3 h-9 text-left text-[14px] text-on-surface hover:bg-surface-container-low"><span class="w-7 text-[11px] font-bold tracking-[0.05em] text-on-surface-variant">${code}</span><span class="flex-1">${name}</span>${icon('check', 'text-[18px] text-primary opacity-0 group-aria-checked:opacity-100')}</button>`).join('')}</div></div>`
  const theme = `<button type="button" data-theme-btn aria-pressed="false" class="${ROW}">${icon('dark_mode', 'text-[20px] text-on-surface-variant')}<span data-theme-label class="flex-1">Dark theme</span></button>`
  return `<div class="flex items-center gap-3 px-4 py-3 border-b border-surface-variant"><img alt="" class="w-10 h-10 rounded-full object-cover" src="${AVATAR_SRC}"><span class="min-w-0"><span class="block font-label-lg text-label-lg text-on-surface">Maya L.</span><span class="inline-flex items-center gap-0.5 font-label-sm text-label-sm ${t.tone}">${t.mark}${t.label} tier</span></span></div>
<div role="menu" class="py-1"><a href="${LINK_BASE}12-profile-b.html" role="menuitem" class="${ROW}">${icon('person', 'text-[20px] text-on-surface-variant')}<span class="flex-1">Profile</span></a><a href="${LINK_BASE}13-settings-b.html" role="menuitem" class="${ROW}">${icon('settings', 'text-[20px] text-on-surface-variant')}<span class="flex-1">Settings</span></a><a href="${LINK_BASE}19-staff-b.html" role="menuitem" class="${ROW}">${icon('shield_person', 'text-[20px] text-on-surface-variant')}<span class="flex-1">Staff tools</span><span class="font-label-sm text-[10px] text-outline uppercase tracking-wider">staff only</span></a><div class="h-px bg-surface-variant my-1"></div>${lang}${theme}<div class="h-px bg-surface-variant my-1"></div>${item('logout', 'Sign out')}</div>
<div class="flex flex-col gap-2 px-4 py-3 border-t border-surface-variant bg-surface-container-low">${orzomiByline('!text-[12px] !gap-2.5 whitespace-nowrap').replace('height:34px', 'height:26px')}<span class="font-label-sm text-[11px] text-outline tracking-normal font-medium">Bartefy v6.0.0 · build 8e6d1c3</span></div>`
}

/* ── the bar ── */
function topbar({ platform = 'desktop', streak = 'claimed', points = 420, unread = 3, tier = 'hunter', open = null, hover = [], fixed = false, cls = '', context = '' } = {}) {
  const phone = platform === 'phone'
  const tablet = platform === 'tablet'
  const bar = phone ? 'h-14 px-4 gap-2' : tablet ? 'h-16 pr-6 gap-3' : 'h-20 pr-gutter-desktop gap-space-md'
  // The symbol only (Alex, 2026-09-27: "only the B"), as the Brand Book's app
  // icon: white symbol on a Barter Green tile, 22% radius, symbol at 62% of
  // the tile height. The tile is exactly the size of a collapsed side-nav
  // item (48px) and, when the nav is collapsed, sits in the same column as
  // those icons — the slot's left padding is set by the shell (12px rail /
  // 16px full nav). Phone: 40px.
  const tile = phone ? 'w-10 h-10' : 'w-12 h-12'
  // Expanded side nav (Alex, 2026-09-27): B | Bartefy — the tile, a hairline,
  // the wordmark (Green on white, 100px wide, above the 80px minimum). The
  // shell hides the line + wordmark when the nav is collapsed or on tablet,
  // so the B alone stays in the rail's column. Phone: the B alone.
  // An exception to Brand Book §04 ("don't place the symbol next to the
  // wordmark") that Alex chose; the hairline keeps it from reading "BBartefy".
  const word = phone || platform === 'tablet' ? '' : `<span class="v6-brand-word flex items-center gap-4"><span aria-hidden="true" class="block w-px h-8 bg-[#1B6B55]/25"></span><img alt="" class="block w-[100px] h-auto" src="${BRAND_ASSET()}wordmark-green.png"></span>`
  const brand = `<div class="v6-brand-slot shrink-0 ${phone ? '' : platform === 'tablet' ? 'pl-3' : 'pl-4'}"><a ${go('discover')} aria-label="Bartefy — Discover" class="group flex items-center gap-4 rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#1B6B55]"><span class="v6-brand grid place-items-center ${tile} rounded-[22%] bg-[#1B6B55] group-hover:bg-[#0E3B30] transition-colors"><img alt="Bartefy" class="block w-auto max-w-none" style="height:${phone ? 25 : 30}px" src="${BRAND_ASSET()}symbol-white.png"></span>${word}</a></div>`
  // On a phone the triggers open bottom sheets, so no popovers hang off them.
  const slot = (id, trigger, tip, panel, w, align) =>
    `<div class="relative group">${phone ? trigger.replace('data-pop-trigger=', 'data-sheet-open=') : trigger}${phone || !tip ? '' : tooltip(tip, hover.includes(id))}${phone ? '' : pop(id, w, panel, { open: open === id, align })}</div>`
  const right = [
    slot('streak', streakChip(streak, { compact: phone, open: open === 'streak' }), STREAK[streak].tip, streakPanel(streak), 'w-[360px]'),
    slot('points', pointsChip(points, { open: open === 'points' }), points < 50 ? `${points} points · Super needs 50` : `${points} points`, pointsPanel(points), 'w-[340px]'),
    slot('bell', bellBtn(unread, { open: open === 'bell' }), unread ? `${unread} new` : 'Notifications', bellPanel(!unread), 'w-[380px]'),
    phone ? '' : slot('account', accountBtn(tier, { compact: tablet, open: open === 'account' }), null, accountPanel(tier), 'w-64'),
  ].join('')
  return `<header data-organism="topbar" data-variant="${platform}" data-live class="${cls} ${fixed ? 'fixed top-0 left-0 right-0 z-50' : 'relative z-10'} w-full bg-white/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="${bar} w-full flex items-center justify-between">${brand}${context && !phone ? `<div data-bar-context class="flex-1 min-w-0 flex items-center gap-3 pl-4">${context}</div>` : ''}<div class="flex items-center ${phone ? 'gap-1.5' : 'gap-space-sm'} shrink-0">${right}</div></div></header>`
}

/* ── Discover's context: the page name + the area the deck draws from ──
 * Alex, 2026-09-28: the middle of the bar is empty on a laptop and a desktop.
 * No search (a standing cut), so the bar says what the deck IS: finds within
 * 10 km of Silver Lake. The slot starts on the content's left edge (the brand
 * slot is as wide as the side nav — apply-shell.mjs). Radius caps come from
 * lib/membership.ts: Hunter 10 km, Collector 50 km, Curator no cap. */
const AREA_KM = [2, 5, 10]
function areaChip({ km = 10, open = false } = {}) {
  return `<button type="button" data-pop-trigger="area" aria-haspopup="dialog" aria-expanded="${open}" aria-label="Area: Silver Lake, within ${km} km" class="${CHIP} ${chipTone(open)}">${icon('location_on', 'text-[18px] text-primary')}<span class="font-label-lg text-label-lg text-on-surface">Silver Lake</span><span class="font-body-sm text-body-sm text-on-surface-variant">· <span data-area-km>${km}</span> km</span>${icon('expand_more', 'text-[18px] text-on-surface-variant -mr-1')}</button>`
}
function areaPanel(km = 10) {
  const seg = (k) => `<button type="button" data-radius="${k}" aria-pressed="${k === km}" class="h-9 rounded-lg font-label-lg text-label-lg ring-1 ring-inset transition-colors ring-outline-variant text-on-surface hover:bg-surface-container-low aria-pressed:bg-primary aria-pressed:text-on-primary aria-pressed:ring-primary">${k} km</button>`
  const locked = (k) => `<button type="button" data-missing="${k} km comes with Collector — see Points &amp; Tiers" class="h-9 rounded-lg font-label-lg text-label-lg ring-1 ring-inset ring-outline-variant/70 text-outline inline-flex items-center justify-center gap-1">${icon('lock', 'text-[14px]')}${k}</button>`
  return `<div class="p-4 flex flex-col gap-4">
<div><p class="font-headline-sm text-headline-sm text-on-surface">Finds near you</p><p class="font-body-sm text-body-sm text-on-surface-variant">Your deck shows finds inside this area.</p></div>
<div class="flex items-center gap-3 rounded-lg bg-surface-container-low px-3 h-12">${icon('location_on', 'text-[20px] text-primary')}<span class="flex-1 font-label-lg text-label-lg text-on-surface">Silver Lake, Los Angeles</span><a href="#" data-missing="Changing your area opens the city picker — no V6 design yet" class="font-label-md text-label-md text-primary hover:underline">Change</a></div>
<div><p class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">How far</p><div class="grid grid-cols-5 gap-1.5">${AREA_KM.map(seg).join('')}${locked(25)}${locked(50)}</div></div>
</div>${footLink('Collector reaches 50 km', go('points'))}`
}
const discoverContext = ({ open = false } = {}) => `<h1 class="font-headline-md text-headline-md text-on-surface shrink-0">Discover</h1><div class="relative group">${areaChip({ open })}${tooltip('Finds within 10 km of Silver Lake', false).replace('left-1/2 -translate-x-1/2', 'left-0')}${pop('area', 'w-[340px]', areaPanel(), { open, align: 'left-0' })}</div>`
// Picking a distance: the chip follows. (The real deck would refetch.)
const AREA_SCRIPT = `<script>
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-radius]'); if (!b) return
  document.querySelectorAll('[data-radius]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)))
  document.querySelectorAll('[data-area-km]').forEach((x) => (x.textContent = b.dataset.radius))
})
</script>`

// Click a trigger → its popover; click elsewhere or Esc → closed.
const POP_SCRIPT = `<script>
(() => {
  const close = (except) => document.querySelectorAll('[data-live] [data-pop]').forEach((p) => {
    if (p === except) return
    p.hidden = true
    p.parentElement.classList.remove('is-open')
    const t = p.parentElement.querySelector('[data-pop-trigger]')
    if (t) t.setAttribute('aria-expanded', 'false')
  })
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-pop]')) return
    const t = e.target.closest('[data-live] [data-pop-trigger]')
    const p = t && t.parentElement.querySelector('[data-pop]')
    close(p)
    if (p) { p.hidden = !p.hidden; p.parentElement.classList.toggle('is-open', !p.hidden); t.setAttribute('aria-expanded', String(!p.hidden)) }
  })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })
})()
</script>`

// Phone: the same panel, as a bottom sheet over the page.
const phoneSheet = (panel) => `<div class="relative w-[390px] h-[720px] overflow-hidden rounded-[28px] ring-1 ring-outline-variant bg-background">
${topbar({ platform: 'phone', open: 'streak' })}
<div class="p-4 flex flex-col gap-3 opacity-60"><div class="h-[420px] rounded-xl bg-surface-container-high"></div><div class="h-14 rounded-xl bg-surface-container"></div></div>
<div class="absolute inset-0 z-20 bg-inverse-surface/40"></div>
<div class="absolute z-30 left-0 right-0 bottom-0 rounded-t-2xl bg-surface-container-lowest shadow-[0_-12px_40px_rgba(31,27,24,0.2)]"><div class="flex justify-center pt-2.5 pb-1"><span class="w-10 h-1 rounded-full bg-outline-variant"></span></div>${panel}<div class="h-5"></div></div>
</div>`

const sect = (id, title, note, width, minH, body) => `
<section id="${id}" data-part="${id}" class="mb-12">
  <h2 class="font-headline-sm text-headline-sm text-on-surface"><a href="#${id}" class="hover:underline">${title}</a></h2>
  <p class="font-body-sm text-body-sm text-on-surface-variant mb-3 max-w-3xl">${note}</p>
  <div data-frame class="bg-background ring-1 ring-surface-variant rounded-lg" style="width:${width}px;min-height:${minH}px">${body}</div>
</section>`

const row = (items) => `<div class="flex flex-wrap items-start gap-6 p-6">${items.join('')}</div>`
const cap = (label, inner) => `<figure class="flex flex-col items-start gap-2"><figcaption class="font-label-md text-label-md text-on-surface-variant">${label}</figcaption>${inner}</figure>`

const TOC = [
  ['live', 'Try it'], ['hover', 'Tooltips'], ['streak-open', 'Streak'], ['streak-states', 'Streak states'],
  ['points-open', 'Points'], ['bell-open', 'Bell'], ['bell-empty', 'Bell — empty'], ['account-open', 'Account'],
  ['chips', 'Chip states'], ['tablet', 'Tablet'], ['phone', 'Phone'], ['phone-sheet', 'Phone sheet'],
]

write(
  'stitch/organisms/topbar-r2.html',
  `<!DOCTYPE html><html lang="en">
<!-- topbar R2 — generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-surface-container-low font-body-md text-on-surface antialiased p-10">
<h1 class="font-headline-lg text-headline-lg mb-2">Top bar — R2, every state</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-4 max-w-3xl">Brand on the left; streak · points · bell · account on the right. <b>Hover</b> shows a one-line tooltip. <b>Click</b> opens a popover under the trigger (desktop, tablet) or a bottom sheet (phone). No search, no nav — those live in the side nav.</p>
<nav class="flex flex-wrap gap-2 mb-10">${TOC.map(([id, l]) => `<a href="#${id}" class="px-3 h-8 inline-flex items-center rounded-full bg-surface-container-lowest ring-1 ring-surface-variant font-label-md text-label-md hover:bg-surface-container-high">${l}</a>`).join('')}</nav>

${sect('live', 'Try it — desktop, 1440', 'Live: hover each item for its tooltip, click to open. Click outside or press Esc to close.', 1440, 560, topbar())}
${sect('hover', 'Tooltips — one per hover', 'One line each. The account has none: its name and tier are already written out.', 1440, 0, ['streak', 'points', 'bell'].map((h) => `<div class="h-[128px]">${topbar({ hover: [h] })}</div>`).join(''))}
${sect('streak-open', 'Streak chip → #03 streak, popover size', 'The 7-day ramp, today’s reward and the countdown. Today is the one filled tile; done days carry a green check.', 1440, 380, topbar({ open: 'streak' }))}
${sect('streak-states', 'Streak popover — the other states', 'Unclaimed and grace are the only states with a button — the one loud thing on screen.', 1440, 380, row([
    cap('Unclaimed today', pop('s-u', 'w-[360px]', streakPanel('unclaimed'), { inline: true })),
    cap('Grace window — about to break', pop('s-g', 'w-[360px]', streakPanel('grace'), { inline: true })),
    cap('Broken — a new run started', pop('s-b', 'w-[360px]', streakPanel('broken'), { inline: true })),
    cap('Offline', pop('s-o', 'w-[360px]', streakPanel('offline'), { inline: true })),
  ]))}
${sect('points-open', 'Points chip → points wallet, popover size', 'Balance, progress to the next tier, and the five ways to earn — the same numbers as lib/points.ts.', 1440, 500, topbar({ open: 'points' }))}
${sect('bell-open', 'Bell → notifications', 'The app’s real notification types. Unread rows carry a red dot; read ones fade.', 1440, 420, topbar({ open: 'bell' }))}
${sect('bell-empty', 'Bell → nothing waiting', 'No dot on the bell; the popover explains what will show up.', 1440, 280, topbar({ unread: 0, open: 'bell' }))}
${sect('account-open', 'Account → menu', 'Everything about you — the same list as the phone “You” sheet: Profile · Settings · Language · Dark theme · Sign out, build stamp at the bottom.', 1440, 480, topbar({ open: 'account' }))}
${sect('chips', 'Chip states', 'Each chip on its own, with the tooltip it shows.', 1440, 0, row([
    ...Object.keys(STREAK).map((s) => cap(`Streak — ${s}<br><span class="text-outline font-normal">“${STREAK[s].tip}”</span>`, streakChip(s))),
    cap('Points — normal', pointsChip(420)),
    cap('Points — under 50', pointsChip(30)),
    cap('Bell — new', bellBtn(3)),
    cap('Bell — nothing new', bellBtn(0)),
    ...Object.keys(TIER).map((t) => cap(`Account — ${TIER[t].label}`, accountBtn(t))),
  ]))}
${sect('tablet', 'Tablet — 1024', 'Same bar, 64px tall. The account shrinks to its avatar; the side nav is the 72px rail.', 1024, 64, topbar({ platform: 'tablet' }))}
${sect('phone', 'Phone — 390', 'Brand, streak (no dots), points, bell. No account — Profile is in the tab bar. Every tap opens a bottom sheet.', 390, 56, topbar({ platform: 'phone' }))}
${sect('phone-sheet', 'Phone — streak as a bottom sheet', 'Same panel as the desktop popover, full width. Swipe down or tap the dim area to close.', 390, 720, phoneSheet(streakPanel('claimed')))}
${POP_SCRIPT}
</body></html>`,
)

// The same bar on every page revision that uses the Stitch S1 header (R1–R4).
LINK_BASE = ''
const phoneSheet2 = (id, label, panel) => `<div id="sheet-${id}" data-sheet hidden class="fixed inset-0 z-[70] md:hidden">
<div data-sheet-close class="absolute inset-0 bg-inverse-surface/40"></div>
<div role="dialog" aria-label="${label}" class="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-surface-container-lowest shadow-[0_-12px_40px_rgba(31,27,24,0.2)] pb-[env(safe-area-inset-bottom)]"><div class="flex justify-center pt-2.5 pb-1"><span class="w-10 h-1 rounded-full bg-outline-variant"></span></div>${panel}</div></div>`
const PHONE_SHEETS = [phoneSheet2('streak', 'Streak', streakPanel('claimed')), phoneSheet2('points', 'Points', pointsPanel(420)), phoneSheet2('bell', 'Notifications', bellPanel(false))].join('\n')
// R5 (Chat) draws its own header from a different design system — left alone.
for (const f of ['stitch/02-discover-desktop-r1.html', 'stitch/04-active-swaps-desktop-r1.html', 'stitch/06-points-tiers-desktop-r1.html', 'stitch/08-my-finds-desktop-r1.html', 'stitch/11-profile-shell.html', 'stitch/11-plain-shell.html', 'stitch/11-admirers-shell.html']) {
  let s = read(f)
  const a = s.indexOf('<header class="fixed top-0')
  const b = s.indexOf('</header>', a)
  if (a < 0 || b < 0) throw new Error(`${f}: no Stitch header to replace`)
  // Desktop/tablet bar from 768px; the phone bar below it. The phone bar's
  // triggers open bottom sheets (apply-shell.mjs handles [data-sheet-open]).
  const discover = f.includes('02-discover')
  s = s.slice(0, a) + `<!-- topbar R2 (build-revisions.mjs) -->\n${topbar({ fixed: true, cls: 'max-md:hidden', context: discover ? discoverContext() : '' })}\n${topbar({ platform: 'phone', fixed: true, cls: 'md:hidden' })}` + s.slice(b + '</header>'.length)
  s = s.replace('</body>', `${PHONE_SHEETS}\n${POP_SCRIPT}\n${discover ? AREA_SCRIPT + '\n' : ''}</body>`)
  write(f, s)
}

/* ───────────────────────────── handover_desk R1 ─────────────────────────────
 * Alex, 2026-09-27: "I do not care what they are talking about or where they
 * meet. I just need to know if they agreed on the swap, and when they actually
 * swapped they both confirm — double confirmation — so the chat is disabled,
 * the swap is performed, and both items are no longer available on Discover."
 *
 * So the card does ONE job: the agreement and the double confirmation. The
 * map, meetup spot, chat peek, QR token and GPS check from S2 are gone.
 *
 * It mirrors the engine exactly (lib/barter.ts, migration 016):
 *   accept offer      → barter_matches 'active', both items 'reserved'
 *   confirm_barter    → a_confirmed / b_confirmed; when both: 'completed',
 *                       both items 'traded', chat closes, +160 pts each
 *   cancel_barter     → either side, alone; items back to 'active'
 * There is no "un-confirm" RPC, so a confirmation cannot be taken back — the
 * dialog says so before it is sent.
 */
const S2 = read('stitch/03-active-swaps-desktop.html')
const imgByAlt = (html, start) => {
  const i = html.indexOf(`data-alt="${start}`)
  const tag = html.slice(html.lastIndexOf('<img', i), html.indexOf('>', i) + 1)
  return tag.match(/src="([^"]+)"/)[1]
}
const LEICA = imgByAlt(S2, 'Classic compact film camera Leica')
const WALKMAN = imgByAlt(S2, 'Iconic vintage Sony Walkman')
const SAMIRA = imgByAlt(S2, 'Portrait photo of Samira Patel')

// The default partner and pair — the swap every R1 frame shows.
const SWAP0 = { name: 'Samira P.', first: 'Samira', avatar: SAMIRA, ago: 'Agreed 2 days ago', give: { title: 'Leica Mini 35mm Compact', src: LEICA }, get: { title: 'Sony Walkman WM-D6C Pro', short: 'Walkman', src: WALKMAN } }

// who: none | me | them | both · status: active | completed | cancelled
function handoverDesk({ size = 'full', who = 'none', status = 'active', p = SWAP0 } = {}) {
  const phone = size === 'phone'
  const compact = size === 'compact'
  const done = status === 'completed'
  const off = status === 'cancelled'
  const meOk = done || who === 'me' || who === 'both'
  const themOk = done || who === 'them' || who === 'both'

  // Banner: a quiet tint while active; solid green only when it is done —
  // the celebration is the one loud thing in a state with no button.
  const banner = done
    ? ['bg-secondary text-on-secondary', 'celebration', 'It’s a bartefy!', `You and ${p.first} both confirmed. The swap is done.`, 'Swapped today']
    : off
      ? ['bg-surface-container-high text-on-surface-variant', 'block', 'Swap called off', `${p.first} called it off. Both finds are back in the deck.`, 'Yesterday']
      : ['bg-secondary-fixed text-on-secondary-fixed', 'handshake', `You agreed to swap with ${p.first}`, 'Meet however you like. Confirm here once the finds have changed hands.', `${p.ago}`]

  const itemTag = done
    ? `<span class="inline-flex items-center gap-1 px-2 h-6 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm">${icon('task_alt', 'text-[14px]')}Swapped</span>`
    : off
      ? `<span class="inline-flex items-center gap-1 px-2 h-6 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">${icon('style', 'text-[14px]')}Back in the deck</span>`
      : `<span class="inline-flex items-center gap-1 px-2 h-6 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">${icon('visibility_off', 'text-[14px]')}Off the deck</span>`
  const thumb = compact ? 'w-12 h-12' : phone ? 'w-16 h-16' : 'w-20 h-20'
  const item = (label, tone, src, name) => `<div class="flex items-center gap-3 min-w-0 flex-1 ${off ? 'opacity-70' : ''}"><img alt="" class="${thumb} rounded-lg object-cover shadow-sm shrink-0" src="${src}"><div class="min-w-0"><p class="font-label-sm text-label-sm uppercase tracking-wider ${tone}">${label}</p><p class="font-headline-sm text-headline-sm text-on-surface leading-tight line-clamp-2">${name}</p>${compact ? '' : `<div class="mt-1.5">${itemTag}</div>`}</div></div>`
  const pair = `<div class="flex ${phone ? 'flex-col items-stretch gap-3' : 'items-center gap-4'}">${item('You give', 'text-primary', p.give.src, `${p.give.title}`)}<span class="grid place-items-center w-9 h-9 rounded-full bg-surface-container-low text-on-surface-variant shrink-0 ${phone ? 'self-center rotate-90' : ''}">${icon('sync_alt', 'text-[20px]')}</span>${item('You get', 'text-secondary', p.get.src, `${p.get.title}`)}</div>`

  // Two people, two ticks. Uniform rows; colour marks who has confirmed.
  const person = (name, avatar, ok) => `<li class="flex items-center gap-3 h-12">${avatar}<span class="flex-1 font-label-lg text-label-lg text-on-surface">${name}</span>${ok
    ? `<span class="inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md">${filled('check_circle', 'text-[16px]')}Confirmed</span>`
    : off ? `<span class="inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-surface-container-high text-outline font-label-md text-label-md">—</span>`
    : `<span class="inline-flex items-center gap-1 px-2.5 h-7 rounded-full bg-surface-container-high text-on-surface-variant font-label-md text-label-md">${icon('hourglass_empty', 'text-[16px]')}Not yet</span>`}</li>`
  const me = `<img alt="" class="w-9 h-9 rounded-full object-cover" src="${AVATAR_SRC}">`
  const them = `<img alt="" class="w-9 h-9 rounded-full object-cover" src="${p.avatar}">`

  const LOUD = 'w-full h-12 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-[0_6px_18px_rgba(27,107,85,0.28)] hover:bg-on-primary-fixed-variant transition-colors inline-flex items-center justify-center gap-2'
  const QUIET = 'inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high transition-colors'
  const say = (t) => `<p class="font-body-sm text-body-sm text-on-surface-variant">${t}</p>`
  let action
  if (done) action = `${say('The chat is closed and read-only. Both finds have left Bartefy.')}<p class="mt-2 inline-flex items-center gap-1.5 font-label-lg text-label-lg text-secondary">${icon('toll', 'text-[18px] text-tertiary')}+160 pts earned</p>`
  else if (off) action = say('Nothing to confirm. You can still read the chat.')
  else if (who === 'me') action = `<div class="flex items-start gap-2 rounded-lg bg-surface-container-low px-3 py-2.5">${icon('hourglass_top', 'text-[18px] text-on-surface-variant mt-0.5')}${say(`<b class="text-on-surface">Waiting for ${p.first}.</b> The chat stays open until ${p.first} confirms too.`)}</div>`
  else if (who === 'them') action = `<button type="button" data-open="confirm" data-first="${p.first}" data-get="${p.get.title}" data-src="${p.get.src}" class="${LOUD}">${icon('task_alt', 'text-[20px]')}Confirm — I have the ${p.get.short}</button>${say(`${p.first} already confirmed. Yours is the last one.`)}`
  else action = `<button type="button" data-open="confirm" data-first="${p.first}" data-get="${p.get.title}" data-src="${p.get.src}" class="${LOUD}">${icon('task_alt', 'text-[20px]')}We swapped — confirm</button>${say(`Only once the finds have changed hands. ${p.first} confirms on their side too.`)}`

  const links = off || done
    ? `<a ${go('chat')} class="${QUIET}">${icon('chat', 'text-[18px]')}Read the chat</a>`
    : `<a ${go('chat')} class="${QUIET}">${icon('chat', 'text-[18px]')}Open chat</a><a href="#" data-missing="Call it off opens the trouble sheet (reasons, then both finds go back in the deck) — no V6 design yet" class="${QUIET}">${icon('block', 'text-[18px]')}Call it off</a>`

  const confirmBox = `<div class="flex flex-col gap-3"><p class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">${done ? 'Both confirmed' : off ? 'Confirmations' : 'Did the swap happen?'}</p><ul class="flex flex-col divide-y divide-surface-variant">${person('You', me, meOk)}${person(`${p.name}`, them, themOk)}</ul><div class="flex flex-col gap-2">${action}</div></div>`

  if (size === 'pane') {
    // Right side of Swaps (list + detail): the pair as big photos that grow
    // with the pane (Alex, 2026-09-28: "whenever you have space, give images
    // more space"), the confirmations as one row under them.
    const big = (label, tone, f) => `<figure class="flex flex-col gap-2 min-w-0 ${off ? 'opacity-70' : ''}"><p class="font-label-sm text-label-sm uppercase tracking-wider ${tone}">${label}</p><img alt="" class="v6-pane-photo w-full aspect-[4/3] rounded-xl object-cover" src="${f.src}"><figcaption class="flex items-start justify-between gap-3"><p class="font-headline-sm text-headline-sm text-on-surface leading-tight">${f.title}</p><span class="shrink-0">${itemTag}</span></figcaption></figure>`
    const chip = (name, face, ok) => `<li class="flex items-center gap-2 whitespace-nowrap"><img alt="" class="w-8 h-8 rounded-full object-cover" src="${face}"><span class="font-label-lg text-label-lg text-on-surface">${name}</span>${ok
      ? `<span class="inline-flex items-center gap-1 px-2 h-6 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md">${filled('check_circle', 'text-[14px]')}Confirmed</span>`
      : `<span class="inline-flex items-center gap-1 px-2 h-6 rounded-full bg-surface-container-high text-on-surface-variant font-label-md text-label-md">${icon('hourglass_empty', 'text-[14px]')}${off ? '—' : 'Not yet'}</span>`}</li>`
    return `<article data-organism="handover_desk" data-variant="pane" class="flex-1 min-h-0 flex flex-col">
<div class="flex items-center justify-between gap-4 px-6 py-4 ${banner[0]}"><div class="flex items-center gap-3">${filled(banner[1], 'text-[24px]')}<div><p class="font-label-lg text-label-lg">${banner[2]}</p><p class="font-body-sm text-body-sm opacity-90">${banner[3]}</p></div></div><span class="font-label-md text-label-md opacity-80 whitespace-nowrap">${banner[4]}</span></div>
<div class="flex-1 min-h-0 overflow-y-auto px-6 pt-5 pb-4 flex flex-col gap-4">
<div class="grid grid-cols-2 gap-6">${big('You give', 'text-primary', p.give)}${big('You get', 'text-secondary', p.get)}</div>
${off || done ? '' : `<p class="flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant">${icon('info', 'text-[18px] mt-0.5')}Both finds left the deck when you agreed. If the swap is called off, they go straight back.</p>`}
</div>
<div class="flex flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4 border-t border-surface-variant">
<div><p class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">${done ? 'Both confirmed' : off ? 'Confirmations' : 'Did the swap happen?'}</p><ul class="flex flex-wrap items-center gap-x-5 gap-y-2">${chip('You', AVATAR_SRC, meOk)}${chip(p.name, p.avatar, themOk)}</ul></div>
<div class="ml-auto w-full max-w-[380px] flex flex-col gap-1.5">${action}</div>
</div>
<div class="flex items-center gap-1 px-4 py-2 border-t border-surface-variant bg-surface-container-low/50">${links}</div>
</article>`
  }

  if (compact) {
    // Chat header: pair + the two ticks + the one action, in one strip.
    const tick = (ok) => ok ? filled('check_circle', 'text-[20px] text-secondary') : icon('radio_button_unchecked', 'text-[20px] text-outline')
    const btn = done ? `<span class="font-label-md text-label-md text-secondary">Swapped · chat closed</span>`
      : off ? `<span class="font-label-md text-label-md text-on-surface-variant">Called off</span>`
      : who === 'me' ? `<span class="font-label-md text-label-md text-on-surface-variant">Waiting for ${p.first}</span>`
      : `<button type="button" data-open="confirm" class="h-9 px-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md whitespace-nowrap">We swapped</button>`
    return `<div data-organism="handover_desk" data-variant="compact" class="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container-lowest ring-1 ring-surface-variant shadow-sm">
<img alt="" class="w-10 h-10 rounded-lg object-cover" src="${p.give.src}">${icon('sync_alt', 'text-[18px] text-on-surface-variant')}<img alt="" class="w-10 h-10 rounded-lg object-cover" src="${p.get.src}">
<div class="flex items-center gap-1 ml-1" title="You · ${p.first}">${tick(meOk)}${tick(themOk)}</div>
<div class="ml-auto">${btn}</div></div>`
  }

  return `<article data-organism="handover_desk" data-variant="${size}" class="rounded-xl bg-surface-container-lowest ring-1 ring-surface-variant/70 shadow-md overflow-hidden">
<div class="flex ${phone ? 'flex-col items-start gap-2' : 'items-center justify-between gap-4'} px-5 py-4 ${banner[0]}"><div class="flex items-center gap-3">${filled(banner[1], 'text-[24px]')}<div><p class="font-label-lg text-label-lg">${banner[2]}</p><p class="font-body-sm text-body-sm opacity-90">${banner[3]}</p></div></div><span class="font-label-md text-label-md opacity-80 whitespace-nowrap ${phone ? 'pl-9' : ''}">${banner[4]}</span></div>
<div class="${phone ? 'flex flex-col gap-5 p-4' : 'grid grid-cols-12 gap-6 p-6'}">
<div class="${phone ? '' : 'col-span-7'} flex flex-col gap-4">${pair}${off || done ? '' : `<p class="flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant">${icon('info', 'text-[18px] mt-0.5')}Both finds left the deck when you agreed, so nobody else can ask for them. If the swap is called off, they go straight back.</p>`}</div>
<div class="${phone ? 'pt-4 border-t border-surface-variant' : 'col-span-5 pl-6 border-l border-surface-variant'}">${confirmBox}</div>
</div>
<div class="flex items-center gap-1 px-4 py-2 border-t border-surface-variant bg-surface-container-low/50">${links}</div>
</article>`
}

// The confirmation step — a confirmation cannot be taken back.
const confirmDialog = `<div data-organism="handover_desk" data-variant="dialog" class="relative w-full p-8 bg-inverse-surface/40 rounded-xl grid place-items-center">
<div role="dialog" aria-modal="true" class="w-[420px] rounded-2xl bg-surface-container-lowest shadow-[0_24px_60px_rgba(31,27,24,0.3)] p-6">
<div class="flex items-center gap-3"><img alt="" class="w-14 h-14 rounded-lg object-cover" src="${WALKMAN}"><div><p class="font-headline-sm text-headline-sm text-on-surface">Do you have the Walkman?</p><p class="font-body-sm text-body-sm text-on-surface-variant">Sony Walkman WM-D6C Pro, from Samira P.</p></div></div>
<p class="mt-4 font-body-md text-body-md text-on-surface">Confirm only once the swap has really happened. When you both have:</p>
<ul class="mt-2 flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
<li class="flex gap-2">${icon('chat_bubble', 'text-[18px]')}The chat closes and becomes read-only.</li>
<li class="flex gap-2">${icon('inventory_2', 'text-[18px]')}Both finds leave Bartefy for good.</li>
<li class="flex gap-2">${icon('toll', 'text-[18px] text-tertiary')}You each get +160 pts.</li></ul>
<p class="mt-3 font-body-sm text-body-sm text-on-surface-variant">You can’t take this back.</p>
<div class="mt-5 flex gap-2 justify-end"><button type="button" class="h-11 px-4 rounded-xl font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high">Not yet</button><button type="button" class="h-11 px-5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-[0_6px_18px_rgba(27,107,85,0.28)]">Yes, we swapped</button></div>
</div></div>`

LINK_BASE = '../' // the sheet sits in stitch/organisms/
write(
  'stitch/organisms/handover-desk-r1.html',
  `<!DOCTYPE html><html lang="en">
<!-- handover_desk R1 — generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-background font-body-md text-on-surface antialiased p-10">
<h1 class="font-headline-lg text-headline-lg mb-2">Agreed swap card — R1</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-8 max-w-3xl">One job: show that the two of you agreed, and collect both confirmations. No map, no meetup, no chat preview, no QR. When both confirm, the chat closes and both finds leave Bartefy for good.</p>
${state('agreed', '1 · Agreed — nobody has confirmed', 'The one loud thing is the confirm button. Both finds are already off the deck.', 1152, handoverDesk())}
${state('me', '2 · You confirmed — waiting for Samira', 'No button: there is nothing left for you to do. The chat stays open.', 1152, handoverDesk({ who: 'me' }))}
${state('them', '3 · Samira confirmed — your turn', 'The button names what you should now be holding.', 1152, handoverDesk({ who: 'them' }))}
${state('confirm', '3a · The confirm dialog', 'Opened by the confirm button. A confirmation cannot be taken back.', 1152, confirmDialog)}
${state('done', '4 · Both confirmed — it’s a bartefy', 'Solid green only now. Chat read-only; both finds traded; +160 pts each.', 1152, handoverDesk({ status: 'completed' }))}
${state('off', '5 · Called off', 'Either person can call it off alone, before both confirm. Both finds go back in the deck.', 1152, handoverDesk({ status: 'cancelled' }))}
${state('compact', 'Compact — top of the chat thread (592px)', 'Pair, one tick per person (you · Samira), and the one action.', 592, [handoverDesk({ size: 'compact' }), handoverDesk({ size: 'compact', who: 'me' }), handoverDesk({ size: 'compact', status: 'completed' })].join('<div class="h-3"></div>'))}
${state('phone', 'Phone — 358px', 'Stacked: banner, pair, confirmations.', 358, handoverDesk({ size: 'phone' }))}
</body></html>`,
)
LINK_BASE = ''

{
  const f = 'stitch/04-active-swaps-desktop-r1.html'
  let s = read(f)
  const START = '<!-- 3. Agreed Swaps & Handover Coordination Section -->'
  const END = '<!-- 4. Always-Free Safeguards Guarantee Banner -->'
  const a = s.indexOf(START), b = s.indexOf(END)
  if (a < 0 || b < 0) throw new Error(`${f}: handover_desk markers not found`)
  s = s.slice(0, a) + `<!-- handover_desk R1 (build-revisions.mjs) -->
<section class="mb-14">
<div class="flex items-end justify-between mb-6 gap-2"><div><div class="flex items-center gap-2">${icon('handshake', 'text-secondary text-[24px]')}<h2 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Agreed swaps</h2></div>
<p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Swaps you both said yes to. Each of you confirms once it has happened.</p></div>
<span class="font-label-sm text-label-sm bg-secondary-container text-on-secondary-container font-bold px-3 py-1 rounded-full w-fit">1 agreed</span></div>
${handoverDesk()}
</section>
` + s.slice(b)
  write(f, s)
}

/* ───────────────────────────── offer_composer R1 ─────────────────────────────
 * Alex, 2026-09-27:
 *   1. "We do not estimate price anywhere." No "Est. $", no "delta", no
 *      "(Even)". A standing rule now — apply-shell.mjs strips every estimate
 *      Stitch draws, on every page.
 *   2. "Choose item from your active inventory — what if I have 50 items?"
 *      Hunter has 6 live finds; Collector and Curator are unlimited
 *      (lib/membership.ts), so 50 is real.
 *
 * The picker, rethought:
 *   - Photos, not rows. People recognise their own things by the picture.
 *     A 5-across grid of square tiles (3 on a phone): 50 finds = 10 rows.
 *   - "Fits what Julian wants" first — your finds whose category is in their
 *     wants_in_return (both exist today; WantsRow.matchCount is still a 0).
 *   - Category chips built from YOUR finds, only when you have more than 12.
 *     A filter of your own stuff, not a search — there is no search box.
 *   - Finds already in a swap are not shown at all (the engine refuses them).
 *     One already offered for THIS find shows, dimmed, "Offered".
 *   - Super (50 pts) is a switch in the footer; Multi (2–4 finds, 150 pts) is
 *     a mode of the same grid. The sweetener is gone: no points transfer exists.
 */
const S4 = read('stitch/07-my-finds-desktop.html')
const S5 = read('stitch/09-chat-desktop.html')
const PH = {
  marantz: imgByAlt(S4, 'A classic vintage 1970s Marantz'),
  fujicase: imgByAlt(S4, 'Premium handcrafted rich cognac'),
  lamy: imgByAlt(S4, 'Iconic Bauhaus design black'),
  blanket: imgByAlt(S4, 'Heavy deep forest green'),
  braun: imgByAlt(S4, 'Minimalist vintage white Braun'),
  pourover: imgByAlt(S4, 'Mid-century modern hand-thrown ceramic'),
  levis: imgByAlt(S1, 'Square crop of an authentic faded blue'),
  planter: imgByAlt(S1, 'Square crop of an authentic mid-century modern'),
  lamp: imgByAlt(S2, 'Vintage solid brass banker lamp'),
  fender: imgByAlt(S2, 'Detailed professional photograph of a vintage 1968 Fender'),
  terracotta: imgByAlt(S2, 'Set of three hand-thrown terracotta'),
  bike: imgByAlt(S5, 'Matte sage green Specialized'),
  leica: LEICA,
  walkman: WALKMAN,
}
const OLYMPUS = imgByAlt(S1, 'Detailed macro shot of a vintage silver')
const CATS = { audio: 'Audio', cameras: 'Cameras', clothing: 'Clothing', home: 'Home', writing: 'Writing', outdoors: 'Outdoors' }
// Maya's finds. Photos repeat inside a category — the mock has 14 photos.
const FINDS = [
  ['audio', ['marantz', 'walkman', 'fender'], ['Marantz 2215B Receiver', 'Sony Walkman WM-D6C', 'Fender Vibro-Champ Amp', 'Sansui AU-217 Amplifier', 'Koss Pro-4AA Headphones', 'Grundig Transistor Radio', 'Akai Reel-to-Reel Deck', 'Nakamichi Cassette Deck', 'Bose 901 Speaker']],
  ['cameras', ['leica', 'fujicase'], ['Leica Mini 35mm', 'Fuji X100 Leather Half-Case', 'Canon AE-1 Body', 'Polaroid SX-70', 'Minolta Rokkor 50mm Lens', 'Yashica Mat 124G', 'Pentax K1000']],
  ['clothing', ['levis'], ['Levi’s Type III Jacket', 'Barbour Waxed Jacket', 'Pendleton Board Shirt', 'Red Wing Moc Toes', 'Carhartt Chore Coat', 'Wool Fisherman Sweater', '1970s Silk Scarf', 'Hand-Tooled Leather Belt', 'Harris Tweed Blazer', 'Denim Overalls']],
  ['home', ['braun', 'pourover', 'planter', 'lamp', 'terracotta'], ['Braun AB1 Travel Clock', 'Ceramic Pour-Over Set', 'Ceramic Planter', 'Brass Banker Lamp', 'Terracotta Planters ×3', 'Teak Serving Tray', 'Enamel Coffee Pot', 'Arabia Finland Mugs ×4', 'Glass Decanter', 'Rattan Magazine Rack', 'Cast Iron Skillet', 'Copper Kettle']],
  ['writing', ['lamy'], ['Lamy 2000 Fountain Pen', 'Parker 51 Pen', 'Leather Desk Blotter', 'Brass Letter Opener', 'Rotring Rapidograph Set', 'Pelikan M400 Pen']],
  ['outdoors', ['blanket', 'bike'], ['Wool Camp Blanket', 'Specialized Sirrus Bike', 'Coleman Lantern', 'Trangia Stove Set', 'Canvas Rucksack', 'Enamel Camp Mugs']],
].flatMap(([cat, photos, titles]) => titles.map((title, i) => ({ id: `${cat}-${i}`, cat, title, src: PH[photos[i % photos.length]] })))
const byTitle = (t) => FINDS.find((f) => f.title === t)
// Hunter: the 6 finds S4 shows live.
const SIX = ['Marantz 2215B Receiver', 'Fuji X100 Leather Half-Case', 'Lamy 2000 Fountain Pen', 'Wool Camp Blanket', 'Braun AB1 Travel Clock', 'Ceramic Pour-Over Set'].map(byTitle)
const WANTS = ['audio'] // Julian's wants_in_return categories

function findTile(f, { picked = false, offered = false, phone = false } = {}) {
  return `<button type="button" data-find="${f.id}" data-cat="${f.cat}" data-title="${f.title}" data-src="${f.src}" aria-pressed="${picked}" ${offered ? 'disabled' : ''} class="group relative flex flex-col text-left rounded-xl p-1.5 bg-surface-container-lowest ring-1 ring-surface-variant transition-[box-shadow,transform] ${EASE} ${offered ? 'opacity-50 cursor-not-allowed' : 'hover:ring-outline-variant hover:-translate-y-0.5'} aria-pressed:ring-2 aria-pressed:ring-primary aria-pressed:shadow-[0_6px_16px_rgba(27,107,85,0.18)]">
<span class="relative block aspect-square rounded-lg overflow-hidden bg-surface-container"><img alt="" class="w-full h-full object-cover" src="${f.src}" loading="lazy">
<span class="absolute top-1.5 right-1.5 grid place-items-center w-6 h-6 rounded-full bg-primary text-on-primary shadow opacity-0 scale-75 transition ${EASE} group-aria-pressed:opacity-100 group-aria-pressed:scale-100">${icon('check', 'text-[16px]')}</span>
${offered ? `<span class="absolute left-1.5 bottom-1.5 px-1.5 h-5 inline-flex items-center rounded-full bg-inverse-surface/80 text-inverse-on-surface text-[10px] font-bold">Offered</span>` : ''}</span>
<span class="mt-1.5 px-0.5 ${phone ? 'text-[12px] leading-4' : 'font-label-md text-label-md'} font-semibold text-on-surface line-clamp-2 h-8">${f.title}</span></button>`
}

function offerComposer({ finds = FINDS, picked = [], cat = 'all', mode = 'one', points = 420, phone = false, superOn = false, offered = [] } = {}) {
  const fits = finds.filter((f) => WANTS.includes(f.cat))
  const counts = finds.reduce((m, f) => ((m[f.cat] = (m[f.cat] || 0) + 1), m), {})
  const chips = finds.length > 12
  const multi = mode === 'multi'
  const pickedFinds = picked.map((id) => finds.find((f) => f.id === id)).filter(Boolean)
  const pad = phone ? 'px-4' : 'px-6'
  const cols = phone ? 'grid-cols-3 gap-2' : 'grid-cols-5 gap-3'
  const tile = (f) => findTile(f, { picked: picked.includes(f.id), offered: offered.includes(f.id), phone })

  if (!finds.length) {
    return `<div data-composer class="${phone ? 'w-full' : 'w-[760px]'} rounded-2xl bg-surface-container-lowest shadow-[0_24px_60px_rgba(31,27,24,0.25)] overflow-hidden">
${composerHead(phone)}
<div class="flex flex-col items-center text-center px-8 py-12"><span class="grid place-items-center w-14 h-14 rounded-full bg-surface-container-low text-on-surface-variant">${icon('inventory_2', 'text-[28px]')}</span>
<p class="mt-4 font-headline-sm text-headline-sm text-on-surface">Nothing of yours on the table yet</p>
<p class="mt-1 max-w-sm font-body-sm text-body-sm text-on-surface-variant">Put one of your finds on the table first — then you can offer it for Julian’s camera.</p>
<button type="button" class="mt-6 h-11 px-6 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg inline-flex items-center gap-2 shadow-[0_6px_18px_rgba(27,107,85,0.28)]">${icon('add_circle', 'text-[20px]')}Add a find</button></div></div>`
  }

  // Their find ⇄ yours. The right slot fills as you pick.
  const yours = multi
    ? pickedFinds.length
      ? `<span class="flex -space-x-3">${pickedFinds.slice(0, 4).map((f) => `<img alt="" class="w-12 h-12 rounded-lg object-cover ring-2 ring-surface-container-lowest" src="${f.src}">`).join('')}</span><span class="min-w-0"><span class="block font-label-sm text-label-sm uppercase tracking-wider text-secondary">You offer</span><span class="block font-label-lg text-label-lg text-on-surface">${pickedFinds.length} finds — Julian picks one</span></span>`
      : placeholderSlot('Pick 2–4 of your finds')
    : pickedFinds.length
      ? `<img alt="" class="w-12 h-12 rounded-lg object-cover shrink-0" src="${pickedFinds[0].src}"><span class="min-w-0"><span class="block font-label-sm text-label-sm uppercase tracking-wider text-secondary">You offer</span><span class="block font-label-lg text-label-lg text-on-surface truncate">${pickedFinds[0].title}</span></span>`
      : placeholderSlot('Pick one of your finds below')
  const pair = `<div class="flex items-center gap-3 ${pad} py-3 bg-surface-container-low border-y border-surface-variant">
<div class="flex items-center gap-3 min-w-0 flex-1"><img alt="" class="w-12 h-12 rounded-lg object-cover shrink-0" src="${OLYMPUS}"><span class="min-w-0"><span class="block font-label-sm text-label-sm uppercase tracking-wider text-primary">Julian’s</span><span class="block font-label-lg text-label-lg text-on-surface truncate">Olympus OM-1 35mm SLR</span></span></div>
<span class="grid place-items-center w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface-variant shrink-0">${icon('sync_alt', 'text-[18px]')}</span>
<div data-yours class="flex items-center gap-3 min-w-0 flex-1">${yours}</div></div>`

  const sectionHead = (title, right = '') => `<div class="flex items-center justify-between gap-3 mb-2"><p class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">${title}</p>${right}</div>`
  const fitsBlock = fits.length
    ? `<div data-fits class="${cat === 'all' ? '' : 'hidden'}">${sectionHead(`${icon('favorite', 'text-[14px] align-[-2px] text-primary')} Fits what Julian wants`)}<p class="-mt-1 mb-2 font-body-sm text-body-sm text-on-surface-variant">Julian is looking for <b class="text-on-surface">Audio</b> · “a Technics turntable, a typewriter or a field recorder”</p><div class="grid ${cols}">${fits.slice(0, phone ? 3 : 5).map(tile).join('')}</div></div>`
    : ''
  const chipRow = chips
    ? `<div class="flex gap-2 mb-3 ${phone ? 'overflow-x-auto -mx-4 px-4' : 'flex-wrap'}">${[['all', 'All', finds.length], ...Object.keys(CATS).filter((c) => counts[c]).map((c) => [c, CATS[c], counts[c]])].map(([c, l, n]) => `<button type="button" data-chip="${c}" aria-pressed="${cat === c}" class="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-full ring-1 ring-inset ring-surface-variant bg-surface-container-lowest font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high aria-pressed:bg-inverse-surface aria-pressed:text-inverse-on-surface aria-pressed:ring-inverse-surface transition-colors">${l}<span class="opacity-70">${n}</span></button>`).join('')}</div>`
    : ''
  // A find shown under "Fits" is not repeated in the grid while "All" is on;
  // any other chip shows its whole category, fits included.
  const inFits = new Set(fits.slice(0, phone ? 3 : 5).map((f) => f.id))
  const rest = chips ? finds : finds.filter((f) => !inFits.has(f.id))
  const gridTile = (f) => {
    const show = cat === 'all' ? !inFits.has(f.id) : f.cat === cat
    return tile(f).replace('<button ', `<button ${inFits.has(f.id) ? 'data-fit="1" ' : ''}${show ? '' : 'hidden '}`)
  }
  const allBlock = `<div>${sectionHead(chips ? `All your finds · ${finds.length}` : `Your other finds · ${rest.length}`)}${chipRow}<div data-grid class="grid ${cols}">${rest.map(gridTile).join('')}</div>
<p class="mt-3 font-body-sm text-body-sm text-outline">Finds already in a swap are not shown.</p></div>`

  const canSend = multi ? pickedFinds.length >= 2 : pickedFinds.length === 1
  const low = points < 50
  // Alex, 2026-09-29: "Offer 2–4 at once" was a small link above the grid and
  // got lost. It is now a switch card right beside Super offer — the two ways
  // to spend on an offer, side by side. Turning one on turns the other off.
  const lowMulti = points < 150
  const sw = (attr, on, tone) => `<span ${attr} role="switch" aria-checked="${on}" class="relative inline-flex w-10 h-6 rounded-full transition-colors ${EASE} ${on ? tone : 'bg-surface-container-highest'} shrink-0"><span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface-container-lowest shadow transition-transform ${EASE} ${on ? 'translate-x-4' : ''}"></span></span>`
  const optCard = (attrs, off, inner) => `<label ${attrs} class="flex items-center gap-2.5 min-w-0 rounded-xl ring-1 ring-inset ring-outline-variant px-3 py-2 ${off ? 'opacity-40 pointer-events-none' : 'cursor-pointer hover:bg-surface-container-low'}">${inner}</label>`
  const optText = (g, tone, t, sub) => `<span class="min-w-0"><span class="block font-label-lg text-label-lg text-on-surface whitespace-nowrap">${filled(g, `text-[16px] align-[-3px] ${tone}`)} ${t}</span><span class="block text-[12px] leading-4 text-on-surface-variant">${sub}</span></span>`
  const superRow = `<div data-offer-opts class="grid grid-cols-2 gap-2 ${phone ? '' : 'flex-1 max-w-[440px]'}">
${optCard('data-super-opt', low || multi, `${sw('data-super', superOn && !multi, 'bg-tertiary')}${optText('bolt', 'text-tertiary', 'Super offer', low ? `You have ${points} pts` : '50 pts · goes to the top')}`)}
${finds.length > 1 ? optCard('data-multi-toggle', lowMulti, `${sw('data-multi-sw', multi, 'bg-primary')}${optText('layers', 'text-primary', '2–4 at once', lowMulti ? `You have ${points} pts` : '150 pts · they pick one')}`) : ''}</div>`
  const sendLabel = multi ? (pickedFinds.length >= 2 ? `Offer ${pickedFinds.length} finds` : 'Pick at least 2') : 'Put it on the table'
  const send = `<button type="button" id="modal-confirm" data-send ${canSend ? '' : 'disabled'} class="h-11 px-5 rounded-xl font-label-lg text-label-lg inline-flex items-center justify-center gap-2 transition-colors ${phone ? 'w-full' : ''} ${canSend ? 'bg-primary text-on-primary shadow-[0_6px_18px_rgba(27,107,85,0.28)] hover:bg-on-primary-fixed-variant' : 'bg-surface-container-high text-outline cursor-not-allowed'}">${icon('handshake', 'text-[20px]')}<span data-send-label>${sendLabel}</span></button>`
  const foot = phone
    ? `<div class="flex flex-col gap-3 ${pad} py-3 border-t border-surface-variant bg-surface-container-lowest">${superRow}${send}</div>`
    : `<div class="flex items-center justify-between gap-4 ${pad} py-4 border-t border-surface-variant bg-surface-container-lowest">${superRow}<div class="flex items-center gap-2 shrink-0"><button type="button" id="modal-cancel" class="h-11 px-4 rounded-xl font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high">Cancel</button>${send}</div></div>`

  return `<div data-composer data-mode="${mode}" class="${phone ? 'w-full h-full rounded-t-2xl' : 'w-[760px] h-[760px] rounded-2xl'} flex flex-col bg-surface-container-lowest shadow-[0_24px_60px_rgba(31,27,24,0.25)] overflow-hidden">
${phone ? '<div class="flex justify-center pt-2.5"><span class="w-10 h-1 rounded-full bg-outline-variant"></span></div>' : ''}${composerHead(phone)}${pair}
<div class="flex-1 overflow-y-auto ${pad} py-4 flex flex-col gap-6">${chips || multi ? '' : ''}${fitsBlock}${allBlock}</div>
${foot}</div>`
}
function composerHead(phone) {
  return `<div class="flex items-start justify-between gap-3 ${phone ? 'px-4 pt-2 pb-3' : 'px-6 pt-5 pb-4'}"><div class="flex items-center gap-3"><span class="grid place-items-center w-10 h-10 rounded-lg bg-primary-fixed text-primary shrink-0">${icon('table_restaurant', 'text-[22px]')}</span><div><p class="font-headline-sm text-headline-sm text-on-surface">Put it on the table</p><p class="font-body-sm text-body-sm text-on-surface-variant">Offer one of your finds for Julian’s camera.</p></div></div><button type="button" id="modal-close" aria-label="Close" class="grid place-items-center w-9 h-9 rounded-full text-on-surface-variant hover:bg-surface-container-high">${icon('close', 'text-[20px]')}</button></div>`
}
const placeholderSlot = (t) => `<span class="grid place-items-center w-12 h-12 rounded-lg border-2 border-dashed border-outline-variant text-outline shrink-0">${icon('add', 'text-[20px]')}</span><span class="font-body-sm text-body-sm text-on-surface-variant">${t}</span>`

// Picking, chips and the multi switch — so the sheet and the Discover page can be tried.
const COMPOSER_SCRIPT = `<script>
(() => {
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
  const slot = (t) => '<span class="grid place-items-center w-12 h-12 rounded-lg border-2 border-dashed border-outline-variant text-outline shrink-0"><span class="material-symbols-outlined text-[20px]">add</span></span><span class="font-body-sm text-body-sm text-on-surface-variant">' + t + '</span>'
  const label = (t, big) => '<span class="min-w-0"><span class="block font-label-sm text-label-sm uppercase tracking-wider text-secondary">You offer</span><span class="block font-label-lg text-label-lg text-on-surface truncate">' + esc(t) + '</span></span>'
  function sync(root) {
    const multi = root.dataset.mode === 'multi'
    const seen = new Set()
    const picked = [...root.querySelectorAll('[data-find][aria-pressed=true]')].filter((b) => !seen.has(b.dataset.find) && seen.add(b.dataset.find))
    const yours = root.querySelector('[data-yours]')
    if (multi) yours.innerHTML = picked.length ? '<span class="flex -space-x-3">' + picked.map((b) => '<img alt="" class="w-12 h-12 rounded-lg object-cover ring-2 ring-surface-container-lowest" src="' + b.dataset.src + '">').join('') + '</span>' + label(picked.length + ' finds — Julian picks one') : slot('Pick 2–4 of your finds')
    else yours.innerHTML = picked.length ? '<img alt="" class="w-12 h-12 rounded-lg object-cover shrink-0" src="' + picked[0].dataset.src + '">' + label(picked[0].dataset.title) : slot('Pick one of your finds below')
    const ok = multi ? picked.length >= 2 : picked.length === 1
    const send = root.querySelector('[data-send]')
    send.disabled = !ok
    send.className = send.className.replace(/bg-primary text-on-primary shadow-\\S+ hover:bg-on-primary-fixed-variant|bg-surface-container-high text-outline cursor-not-allowed/, ok ? 'bg-primary text-on-primary shadow-[0_6px_18px_rgba(27,107,85,0.28)] hover:bg-on-primary-fixed-variant' : 'bg-surface-container-high text-outline cursor-not-allowed')
    root.querySelector('[data-send-label]').textContent = multi ? (picked.length >= 2 ? 'Offer ' + picked.length + ' finds' : 'Pick at least 2') : 'Put it on the table'
  }
  document.addEventListener('click', (e) => {
    const root = e.target.closest('[data-composer]')
    if (!root) return
    const tile = e.target.closest('[data-find]')
    if (tile && !tile.disabled) {
      const id = tile.dataset.find
      const all = root.querySelectorAll('[data-find="' + id + '"]')
      const on = tile.getAttribute('aria-pressed') !== 'true'
      if (root.dataset.mode === 'multi') {
        const n = new Set([...root.querySelectorAll('[data-find][aria-pressed=true]')].map((b) => b.dataset.find)).size
        if (on && n >= 4) return
      } else root.querySelectorAll('[data-find]').forEach((b) => b.setAttribute('aria-pressed', 'false'))
      all.forEach((b) => b.setAttribute('aria-pressed', String(on)))
      return sync(root)
    }
    const chip = e.target.closest('[data-chip]')
    if (chip) {
      const c = chip.dataset.chip
      root.querySelectorAll('[data-chip]').forEach((b) => b.setAttribute('aria-pressed', String(b === chip)))
      root.querySelectorAll('[data-grid] [data-find]').forEach((b) => { b.hidden = c === 'all' ? b.dataset.fit === '1' : b.dataset.cat !== c })
      const fits = root.querySelector('[data-fits]'); if (fits) fits.classList.toggle('hidden', c !== 'all')
      return
    }
    const flip = (el, on, tone) => { el.setAttribute('aria-checked', String(on)); el.classList.toggle(tone, on); el.classList.toggle('bg-surface-container-highest', !on); el.firstElementChild.classList.toggle('translate-x-4', on) }
    if (e.target.closest('[data-multi-toggle]')) {
      e.preventDefault()
      const t = e.target.closest('[data-multi-toggle]')
      const multi = root.dataset.mode !== 'multi'
      root.dataset.mode = multi ? 'multi' : 'one'
      flip(t.querySelector('[data-multi-sw]'), multi, 'bg-primary')
      // One or the other: 2–4 at once turns Super off and greys it.
      const sp = root.querySelector('[data-super]')
      if (sp) { const l = sp.closest('label'); if (multi) flip(sp, false, 'bg-tertiary'); l.classList.toggle('opacity-40', multi); l.classList.toggle('pointer-events-none', multi) }
      root.querySelectorAll('[data-find]').forEach((b) => b.setAttribute('aria-pressed', 'false'))
      return sync(root)
    }
    const sw = e.target.closest('label')?.querySelector('[data-super]')
    if (sw && !sw.closest('label').classList.contains('opacity-40')) {
      e.preventDefault()
      flip(sw, sw.getAttribute('aria-checked') !== 'true', 'bg-tertiary')
    }
  })
  // Discover page: "Put on Table" opens the composer (#offer deep-links it).
  const modal = document.getElementById('barter-modal')
  if (modal && location.hash === '#offer') modal.classList.remove('hidden')
  if (modal) {
    document.addEventListener('click', (e) => {
      if (e.target.closest('[data-action=want]')) modal.classList.remove('hidden')
      else if (e.target === modal || e.target.closest('#modal-close, #modal-cancel')) modal.classList.add('hidden')
    })
  }
})()
</script>`

const ID = (t) => byTitle(t).id
const backdrop = (inner, h = 840) => `<div class="w-full grid place-items-center p-8 bg-inverse-surface/40 rounded-xl" style="min-height:${h}px">${inner}</div>`
const phoneFrame = (inner) => `<div class="relative w-[390px] h-[844px] overflow-hidden rounded-[28px] ring-1 ring-outline-variant bg-inverse-surface/40"><div class="absolute inset-x-0 bottom-0 top-10">${inner}</div></div>`

write(
  'stitch/organisms/offer-composer-r1.html',
  `<!DOCTYPE html><html lang="en">
<!-- offer_composer R1 — generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-background font-body-md text-on-surface antialiased p-10">
<h1 class="font-headline-lg text-headline-lg mb-2">“Put it on the table” — R1</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-8 max-w-3xl">No prices anywhere. Your finds as photos: what fits Julian first, then everything else, with category chips once you have more than 12. <b>Try it</b> — tap finds, chips, the Super switch and “Offer 2–4 at once”.</p>
${state('many', '1 · 50 finds (Collector / Curator) — nothing picked yet', 'Fits first, then all 50 in a 5-across grid with chips. The grid scrolls inside the dialog; header, pair and footer stay put. The Leica was already offered for this camera.', 1000, backdrop(offerComposer({ offered: [ID('Leica Mini 35mm')] })))}
${state('picked', '2 · One picked', 'The pair fills in; the button wakes up. Picking another swaps the choice.', 1000, backdrop(offerComposer({ picked: [ID('Marantz 2215B Receiver')] })))}
${state('filtered', '3 · Filtered to Home', 'A chip narrows YOUR finds. “Fits what Julian wants” steps aside while a chip is on.', 1000, backdrop(offerComposer({ cat: 'home', picked: [ID('Brass Banker Lamp')] })))}
${state('multi', '4 · Several at once (multi offer, 150 pts)', 'Up to 4. Julian sees them grouped and picks one. The Super switch gives way to the multi price.', 1000, backdrop(offerComposer({ mode: 'multi', picked: [ID('Marantz 2215B Receiver'), ID('Sony Walkman WM-D6C'), ID('Fender Vibro-Champ Amp')] })))}
${state('super', '5 · Super offer on', 'Switch on: lands at the top of Julian’s offers for 50 pts.', 1000, backdrop(offerComposer({ picked: [ID('Marantz 2215B Receiver')], superOn: true })))}
${state('few', '6 · Hunter — 6 finds', 'Under 12 finds: no chips. What fits first, then the rest.', 1000, backdrop(offerComposer({ finds: SIX, picked: [], points: 30 }), 700))}
${state('empty', '7 · No finds yet', 'The only thing to do is put a find on the table.', 1000, backdrop(offerComposer({ finds: [] }), 420))}
${state('phone', '8 · Phone — bottom sheet', 'Same sheet, 3 across, chips scroll sideways, footer pinned.', 390, phoneFrame(offerComposer({ phone: true, picked: [ID('Marantz 2215B Receiver')] })))}
${COMPOSER_SCRIPT}
</body></html>`,
)

{
  const f = 'stitch/02-discover-desktop-r1.html'
  let s = read(f)
  const START = '<!-- Interactive Barter Table Drawer Modal'
  const a = s.indexOf(START)
  const b = s.indexOf('</main>', a)
  if (a < 0 || b < 0) throw new Error(`${f}: offer_composer markers not found`)
  s = s.slice(0, a) + `<!-- offer_composer R1 (build-revisions.mjs) -->
<div class="hidden fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-4" id="barter-modal"><div class="max-md:hidden">${offerComposer({ offered: [ID('Leica Mini 35mm')] })}</div><div class="md:hidden fixed inset-x-0 bottom-0 top-10">${offerComposer({ phone: true, offered: [ID('Leica Mini 35mm')] })}</div></div>
` + s.slice(b)
  s = s.replace('</body>', `${COMPOSER_SCRIPT}\n</body>`)
  write(f, s)
}


/* ───────────────────────────── phone navigation R1 ─────────────────────────────
 * Alex, 2026-09-27: "how will phone V6 navigation look?"
 * Built into the page revisions themselves (apply-shell.mjs: tab bar + You
 * sheet; above: phone top bar + its sheets). This sheet only frames those real
 * pages at 390 × 844 — every frame is live and clickable.
 */
const phoneLive = (src) => `<div class="w-[390px] h-[844px] rounded-[28px] overflow-hidden ring-1 ring-outline-variant bg-background shadow-lg"><iframe src="../${src}" width="390" height="844" class="block border-0" title="${src}"></iframe></div>`
write(
  'stitch/organisms/phone-nav-r1.html',
  `<!DOCTYPE html><html lang="en">
<!-- phone navigation R1 — generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-surface-container-low font-body-md text-on-surface antialiased p-10">
<h1 class="font-headline-lg text-headline-lg mb-2">Phone navigation — R1</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-2 max-w-3xl">Bottom tab bar: <b>Discover · Swaps · ＋Add · Finds · You</b>. The phone top bar (brand, streak, points, bell) stays; each of those opens a bottom sheet. <b>You</b> holds the account, Points &amp; Tiers, Profile, Settings, language, theme and sign out.</p>
<p class="font-body-md text-body-md text-on-surface-variant mb-8 max-w-3xl">Every frame below is the real page at 390 × 844 — tap anything.</p>
<div class="flex flex-wrap gap-10">
${state('discover', '1 · Discover', 'Tab bar at the bottom; the active tab gets a filled pill. Add is the one raised button.', 390, phoneLive('02-discover-desktop-r1.html'))}
${state('swaps', '2 · Swaps', 'The red count is the same “3 expiring” the desktop side nav shows.', 390, phoneLive('04-active-swaps-desktop-r1.html'))}
${state('you', '3 · You', 'Account, points, Profile, Settings, Language (inline list), Dark theme, Sign out, build stamp.', 390, phoneLive('02-discover-desktop-r1.html#sheet-you'))}
${state('streak', '4 · Streak chip tapped', 'Top-bar chips open the same panels as the desktop popovers, as sheets.', 390, phoneLive('02-discover-desktop-r1.html#sheet-streak'))}
${state('offer', '5 · Put on Table', 'The offer composer as a full-height sheet (offer_composer R1).', 390, phoneLive('02-discover-desktop-r1.html#offer'))}
${state('add', '6 · ＋Add', 'Opens the listing form (on My Finds).', 390, phoneLive('08-my-finds-desktop-r1.html#add'))}
${state('alt', '7 · Alternative: Points as the fifth tab', 'Points gets its own tab; You then has no tab — its rows would move behind an avatar in the top bar. Compare with 1.', 390, phoneLive('06-points-tiers-desktop-r1.html?tabs=points'))}
</div>
</body></html>`,
)


/* ── Discover: no streak banner (Alex, 2026-09-27) ──
 * The streak showed twice: the top-bar chip and the #03 banner right under
 * it. The chip (and its popover) is the streak everywhere; the banner goes,
 * and the deck moves up. */
{
  const f = 'stitch/02-discover-desktop-r1.html'
  let s = read(f)
  const a = s.indexOf('<!-- 1. Top Banner / Daily Visit Streak Ramp -->')
  const b = s.indexOf('<!-- 2. Two-Column Workspace -->')
  if (a < 0 || b < 0) throw new Error(`${f}: streak banner markers not found`)
  s = s.slice(0, a) + '<!-- streak banner removed (build-revisions.mjs): the top-bar chip is the streak -->\n' + s.slice(b)
  write(f, s)
}

/* ───────────────────────────── Discover right rail R1 ─────────────────────────────
 * Alex, 2026-09-27: Expiring Offers (#11), My Table (#12) and Hunter Tier (#05)
 * take too much room — "collapse it in a smaller footprint". Stitch's rail is
 * 1,204px tall next to a ~900px deck.
 *
 * One pattern for all three: a card whose header is ONE line that always
 * carries the key signal (the next deadline, what is live, how full you are),
 * and folds down to just that line. Open or closed is remembered per card.
 * The explainer paragraphs go (they were the same every visit); decisions
 * (Pass / Review & Accept) leave the rail — a row opens the offer on Active
 * Swaps, where #14 does the deciding.
 * Facts fixed on the way: no "Level 2"; Collector = unlimited finds and swaps,
 * 50 km (membership.ts), not "15 finds"; no $ price; no "+10 pts".
 */
const RAIL_OFFERS = [
  { title: 'Levi’s Type III Denim', who: 'Liam V.', mine: 'Marantz 2215B', left: '04h 18m', urgent: true, src: imgByAlt(S1, 'Square crop of an authentic faded blue') },
  { title: 'Mid-Century Teak Planter', who: 'Sora K.', mine: 'Ceramic Pour-Over Set', left: '09h 42m', urgent: false, src: imgByAlt(S1, 'Square crop of an authentic mid-century modern') },
]
const RAIL_FINDS = SIX.map((f, i) => ({ ...f, offers: [2, 0, 1, 0, 0, 0][i] }))

function railCard({ id, glyph, glyphTone, title, summary, badge = '', open = true, body, foot }) {
  return `<section data-rail-card="${id}" class="rounded-xl bg-surface-container-lowest shadow-sm ring-1 ring-surface-variant/60 overflow-hidden">
<button type="button" data-rail-toggle aria-expanded="${open}" class="group w-full flex items-center gap-2.5 px-4 h-14 text-left hover:bg-surface-container-low/60 transition-colors">
${filled(glyph, `text-[20px] ${glyphTone} shrink-0`)}<span class="min-w-0 flex-1"><span class="block font-label-lg text-label-lg text-on-surface">${title}</span><span class="block font-body-sm text-[12px] leading-4 text-on-surface-variant truncate">${summary}</span></span>${badge}${icon('expand_more', `text-[20px] text-outline shrink-0 transition-transform ${EASE} group-aria-expanded:rotate-180`)}</button>
<div data-rail-body ${open ? '' : 'hidden'}>${body}${foot ? `<a ${foot[1]} class="flex items-center justify-between px-4 h-10 border-t border-surface-variant font-label-md text-label-md text-primary hover:bg-surface-container-low">${foot[0]}${icon('arrow_forward', 'text-[16px]')}</a>` : ''}</div>
</section>`
}
const timer = (o) => `<span class="shrink-0 px-2 h-6 inline-flex items-center rounded-full font-ticker-number text-[12px] ${o.urgent ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface-variant'}">${o.left}</span>`

function expiringCard({ offers = RAIL_OFFERS, open = true } = {}) {
  if (!offers.length)
    return `<section data-rail-card="expiring" class="rounded-xl bg-surface-container-lowest ring-1 ring-surface-variant/60 flex items-center gap-2.5 px-4 h-14">${icon('alarm', 'text-[20px] text-outline')}<span class="font-label-lg text-label-lg text-on-surface-variant">No offers waiting</span></section>`
  const first = offers[0]
  return railCard({
    id: 'expiring', glyph: 'alarm', glyphTone: first.urgent ? 'text-error' : 'text-on-surface-variant', open,
    title: `${offers.length} offer${offers.length > 1 ? 's' : ''} expiring`,
    // The header must not repeat the first row: it carries only the deadline.
    // Coral is a fill, never text on white (no contrast): Ink numbers.
    summary: `Next ends in <b class="font-ticker-number text-on-surface">${first.left}</b>`,
    body: `<ul class="flex flex-col pb-1">${offers.map((o) => `<li><a ${go('swaps')} class="flex items-center gap-3 px-4 py-2 hover:bg-surface-container-low"><img alt="" class="w-10 h-10 rounded-lg object-cover shrink-0" src="${o.src}"><span class="min-w-0 flex-1"><span class="block font-label-md text-label-md text-on-surface truncate">${o.title}</span><span class="block text-[12px] leading-4 text-on-surface-variant truncate">${o.who} · for your ${o.mine}</span></span>${timer(o)}</a></li>`).join('')}</ul>`,
    foot: ['Review on Active Swaps', go('swaps')],
  })
}

function tableCard({ finds = RAIL_FINDS, open = true } = {}) {
  if (!finds.length)
    return railCard({ id: 'table', glyph: 'table_restaurant', glyphTone: 'text-on-surface-variant', open, title: 'My table', summary: 'Nothing on it yet',
      body: `<div class="px-4 pb-4"><a href="${LINK_BASE}18-add-b.html" data-add-find class="flex items-center justify-center gap-2 h-12 rounded-lg border-2 border-dashed border-outline-variant text-on-surface-variant font-label-md text-label-md hover:bg-surface-container-low">${icon('add', 'text-[20px]')}Put your first find on the table</a></div>` })
  const withOffers = finds.filter((f) => f.offers).length
  return railCard({
    id: 'table', glyph: 'table_restaurant', glyphTone: 'text-on-surface-variant', open,
    title: 'My table',
    summary: `${finds.length} live${withOffers ? ` · ${withOffers} with offers` : ''}`,
    body: `<div class="grid grid-cols-6 gap-1.5 px-4 pb-3">${finds.map((f) => `<a ${go('finds')} title="${f.title}${f.offers ? ` — ${f.offers} offer${f.offers > 1 ? 's' : ''}` : ''}" class="relative block aspect-square rounded-lg overflow-hidden ring-1 ring-surface-variant hover:ring-outline-variant"><img alt="${f.title}" class="w-full h-full object-cover" src="${f.src}">${f.offers ? `<span class="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-primary text-on-primary text-[10px] font-bold leading-none">${f.offers}</span>` : ''}</a>`).join('')}</div>`,
    foot: ['Manage my finds', go('finds')],
  })
}

// A full meter is a fact, not an error: neutral ink, and the word "Full".
const meter = (label, used, max) => {
  const pct = Math.round((used / max) * 100)
  return `<div><div class="flex items-center justify-between text-[12px] leading-4"><span class="text-on-surface-variant">${label}</span><span class="font-ticker-number text-[12px] text-on-surface">${used} / ${max}${used >= max ? ' <span class="ml-1 font-sans text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Full</span>' : ''}</span></div><div class="mt-1 h-1.5 rounded-full bg-surface-container-high overflow-hidden"><div class="h-full rounded-full bg-on-surface-variant" style="width:${pct}%"></div></div></div>`
}
function tierCard({ tier = 'hunter', finds = 6, swaps = 3, open = true } = {}) {
  if (tier === 'collector')
    return railCard({ id: 'tier', glyph: 'star', glyphTone: 'text-tertiary', open, title: 'Collector', summary: 'Unlimited finds and swaps · 50 km',
      body: `<p class="px-4 pb-3 text-[12px] leading-4 text-on-surface-variant">Renews on 12 Oct for 600 pts. Undo your last pass is on.</p>`, foot: ['Points &amp; Tiers', go('points')] })
  return railCard({
    id: 'tier', glyph: 'shield', glyphTone: 'text-on-surface-variant', open,
    title: 'Hunter', summary: `${finds} of 6 finds · ${swaps} of 3 swaps · 10 km`,
    body: `<div class="flex flex-col gap-3 px-4 pb-3">${meter('Live finds', finds, 6)}${meter('Swaps on the go', swaps, 3)}</div>`,
    foot: ['Collector — unlimited, 50 km · 600 pts', go('points')],
  })
}

const railStack = (o = {}) => `<div data-rail class="flex flex-col gap-3 w-full">${expiringCard(o.expiring)}${tableCard(o.table)}${tierCard(o.tier)}</div>`

// Open/closed per card, remembered (localStorage "v6.rail.<id>").
const RAIL_SCRIPT = `<script>
(() => {
  const key = (c) => 'v6.rail.' + c.dataset.railCard
  const set = (c, open) => {
    const b = c.querySelector('[data-rail-toggle]'), body = c.querySelector('[data-rail-body]')
    if (!b || !body) return
    b.setAttribute('aria-expanded', String(open)); body.hidden = !open
  }
  if (document.body.dataset.railMemory !== 'off')
    document.querySelectorAll('[data-rail-card]').forEach((c) => { try { const v = localStorage.getItem(key(c)); if (v) set(c, v === '1') } catch (e) {} })
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-rail-toggle]'); if (!b) return
    const c = b.closest('[data-rail-card]'); const open = b.getAttribute('aria-expanded') !== 'true'
    set(c, open)
    if (document.body.dataset.railMemory !== 'off') try { localStorage.setItem(key(c), open ? '1' : '0') } catch (e) {}
  })
})()
</script>`

write(
  'stitch/organisms/discover-rail-r1.html',
  `<!DOCTYPE html><html lang="en">
<!-- Discover right rail R1 — generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body data-rail-memory="off" class="bg-background font-body-md text-on-surface antialiased p-10">
<h1 class="font-headline-lg text-headline-lg mb-2">Discover right rail — R1</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-8 max-w-3xl">Expiring offers, My table and your tier as three compact cards. Each header is one line that always shows the key number; click it to fold the card down to that line. Stitch’s rail was 1,204px tall — open, this one is about 560; folded, under 200. On Discover it also stays in view while the page scrolls.</p>
<div class="flex flex-wrap items-start gap-10">
${state('open', '1 · All open (default)', 'Hunter at the limit, 2 offers expiring.', 357, railStack())}
${state('folded', '2 · All folded', 'Headers only — the next deadline, what is live, how full you are.', 357, railStack({ expiring: { open: false }, table: { open: false }, tier: { open: false } }))}
${state('quiet', '3 · Nothing urgent, room to spare', 'No offers waiting: one muted line. Tier under the limit.', 357, railStack({ expiring: { offers: [] }, tier: { finds: 3, swaps: 1 } }))}
${state('new', '4 · Brand-new trader', 'Empty table: one dashed “put your first find” button.', 357, railStack({ expiring: { offers: [] }, table: { finds: [] }, tier: { finds: 0, swaps: 0 } }))}
${state('collector', '5 · Collector', 'No meters — nothing to run out of. One line of what the tier gives.', 357, railStack({ tier: { tier: 'collector' } }))}
</div>
${RAIL_SCRIPT}
</body></html>`,
)

{
  const f = 'stitch/02-discover-desktop-r1.html'
  let s = read(f)
  const a = s.indexOf('<!-- RIGHT SIDEBAR')
  const open = s.indexOf('<aside', a)
  const close = s.indexOf('</aside>', open)
  if (a < 0 || open < 0 || close < 0) throw new Error(`${f}: right rail not found`)
  s = s.slice(0, a) + `<!-- Discover right rail R1 (build-revisions.mjs) — sticky, three foldable cards -->
<aside class="lg:col-span-4 flex flex-col gap-space-md lg:sticky lg:top-24 self-start">
${railStack()}
</aside>` + s.slice(close + '</aside>'.length)
  s = s.replace('</body>', `${RAIL_SCRIPT}\n</body>`)
  write(f, s)
}

/* ───────────────────────────── Deck stage R1 ─────────────────────────────
 * #06 find card · #07 owner trust bar · #08 looking-for box · #09 deck actions
 * Alex, 2026-09-27: "I want to see the find card and under it the action bar.
 * I do not want to scroll down to reach the action bar. It swipes left and
 * right — this is the main functionality of the app."
 *
 * The rethink:
 *   - The card is sized from the WINDOW (height = viewport − top bar − action
 *     bar), so card + action bar always fit — 1280×720, 1440×900, 1920×1080,
 *     phone. The photo is the card.
 *   - Owner (#07) and wants (#08) move ONTO the photo, in the bottom scrim:
 *     distance, title, one owner line (no stars — cut in V4; trust = swaps),
 *     one "Wants" line, and the match as a white pill that opens the composer
 *     with that find already picked. That pill is the conversion.
 *   - Everything long — description, full wish, owner, report — goes behind
 *     "i" (or ↑ / tapping the title): a panel that slides up INSIDE the card.
 *   - Drag: left = Pass, right = Put on Table (opens the composer; the card
 *     leaves only once the offer is sent). Stamps fade in as you drag. Keys:
 *     ← → ↑ ↓. Tap the left/right third of the photo for the next photo.
 *   - Removed: "Fair Barter Target" (a valuation), "Tier: Vintage Optics"
 *     (clashed with membership tiers → the category), hashtags, subtitle,
 *     ★ rating, the ghost stack (the real next card sits behind instead).
 */
const DECK = [
  {
    title: 'Olympus OM-1 35mm SLR', cond: 'Excellent', cat: 'Cameras', km: '3.2 km', city: 'Silver Lake',
    owner: { name: 'Julian R.', swaps: 18, desk: 4, src: imgByAlt(S1, 'Portrait of Julian Ross') },
    wants: 'A working Technics turntable, a mechanical typewriter or a portable field recorder.', wantsShort: 'Technics turntable, typewriter, field recorder', wantsCats: ['Audio'],
    match: { id: 'audio-0', title: 'Marantz 2215B', src: PH.marantz },
    photos: [OLYMPUS, imgByAlt(S5, 'Editorial close-up of a vintage black Olympus')],
    notes: 'Clean prism with no silvering. Shutter fires accurately from B to 1/1000s; new light seals and mirror foam. The 50mm f/1.8 lens is free of fungus and haze. Comes with a braided cotton strap.',
  },
  {
    title: 'Fender Vibro-Champ Amp (1968)', cond: 'Good', cat: 'Music', km: '4.8 km', city: 'Echo Park',
    owner: { name: 'Marcus V.', swaps: 24, desk: 7, src: imgByAlt(S2, 'Close up portrait photo of Marcus Vance') },
    wants: 'An old rangefinder, a Polaroid, or a good leather camera case.', wantsShort: 'Rangefinder, Polaroid, leather camera case', wantsCats: ['Cameras'],
    match: { id: 'cameras-1', title: 'Fuji X100 Half-Case', src: PH.fujicase },
    photos: [PH.fender],
    notes: 'Original 6V6 power tube, recapped last spring. Hums a little at full volume, which is half the charm. Speaker cone is clean and the grille cloth is intact.',
  },
  {
    title: 'Brass Banker’s Lamp', cond: 'Very good', cat: 'Home', km: '2.1 km', city: 'Los Feliz',
    owner: { name: 'Elena R.', swaps: 7, desk: 3, src: imgByAlt(S2, 'Portait of Elena Rostova') },
    wants: 'A fountain pen that writes smoothly — Lamy, Pelikan or Parker.', wantsShort: 'A smooth fountain pen', wantsCats: ['Writing'],
    match: { id: 'writing-0', title: 'Lamy 2000', src: PH.lamy },
    photos: [PH.lamp],
    notes: 'Solid brass base, original green cased-glass shade without chips. Rewired with a braided cloth cord and a new pull switch.',
  },
  {
    title: 'Specialized Sirrus Hybrid Bike', cond: 'Good', cat: 'Outdoors', km: '6.5 km', city: 'Highland Park',
    owner: { name: 'Sara M.', swaps: 12, desk: 5, src: imgByAlt(S5, 'Authentic candid portrait of Sara M.') },
    wants: 'Climbing gear — shoes (EU 39), a harness or a crash pad.', wantsShort: 'Climbing shoes, harness, crash pad', wantsCats: ['Sports'],
    match: null,
    photos: [PH.bike],
    notes: 'Medium frame, 21 gears, new brake pads and chain in August. A few scuffs on the top tube. Rides like new.',
  },
]

function deckCard(c, k, { details = false, stamp = null, drag = 0 } = {}) {
  const chip = (t) => `<span class="px-2.5 h-7 inline-flex items-center rounded-full bg-black/45 backdrop-blur text-white text-[12px] font-semibold">${t}</span>`
  const t = drag ? `transform:translateX(${drag}px) rotate(${drag / 20}deg)` : ''
  return `<article data-deck-card="${k}" aria-roledescription="card" aria-label="${c.title}" class="absolute inset-0 rounded-2xl overflow-hidden bg-inverse-surface shadow-[0_1px_2px_rgba(23,25,30,0.06),0_6px_16px_rgba(23,25,30,0.08)] select-none touch-none" style="${t}">
<div data-photo-pane class="absolute inset-0">
<div class="absolute inset-0">${c.photos.map((p, i) => `<img data-photo="${i}" alt="" draggable="false" class="absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${i ? 'opacity-0' : ''}" src="${p}">`).join('')}</div>
${c.photos.length > 1 ? `<button type="button" data-photo-step="-1" aria-label="Previous photo" class="absolute left-0 top-0 h-3/5 w-1/3"></button><button type="button" data-photo-step="1" aria-label="Next photo" class="absolute right-0 top-0 h-3/5 w-1/3"></button>` : ''}
<button type="button" data-photo-full="zone" aria-label="See the photos full screen" class="absolute left-1/3 top-0 h-3/5 w-1/3"></button>
<button type="button" data-photo-full="btn" aria-label="See the photos full screen" class="absolute top-5 grid place-items-center w-9 h-9 rounded-full bg-black/45 backdrop-blur text-white hover:bg-black/60">${icon('open_in_full', 'text-[18px]')}</button>
<div class="absolute top-2.5 inset-x-3 flex gap-1">${c.photos.map((_, i) => `<span data-seg="${i}" class="h-1 flex-1 rounded-full ${i ? 'bg-white/40' : 'bg-white'}"></span>`).join('')}</div>
<div data-portrait-only class="absolute top-6 left-3 flex gap-1.5">${chip(c.cond)}${chip(c.cat)}</div>
<button type="button" data-details-open data-portrait-only aria-label="Details" class="absolute top-5 right-3 grid place-items-center w-9 h-9 rounded-full bg-black/45 backdrop-blur text-white hover:bg-black/60">${icon('info', 'text-[20px]')}</button>
<span data-stamp="pass" class="pointer-events-none absolute top-20 right-6 rotate-12 px-4 py-1.5 rounded-xl border-[3px] border-white bg-inverse-surface/70 text-white text-[26px] font-extrabold tracking-[0.2em] ${stamp === 'pass' ? '' : 'opacity-0'}">PASS</span>
<span data-stamp="offer" class="pointer-events-none absolute top-20 left-6 -rotate-12 px-4 py-1.5 rounded-xl border-[3px] border-white bg-primary text-on-primary text-[26px] font-extrabold tracking-[0.2em] ${stamp === 'offer' ? '' : 'opacity-0'}">OFFER</span>
<div data-portrait-only class="absolute inset-x-0 bottom-0 pt-28 pb-4 px-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white flex flex-col gap-2">
<p class="flex items-center gap-1 text-[12px] leading-4 font-semibold text-white/85">${icon('near_me', 'text-[14px]')}${c.km} · ${c.city}</p>
<button type="button" data-details-open class="text-left font-headline-lg text-[26px] leading-[30px] line-clamp-2 hover:underline decoration-white/40">${c.title}</button>
<div class="flex items-center gap-2 min-w-0"><img alt="" draggable="false" class="w-7 h-7 rounded-full object-cover ring-2 ring-white/70" src="${c.owner.src}"><button type="button" data-person="${c.owner.name}" class="font-label-lg text-label-lg hover:underline decoration-white/50">${c.owner.name}</button><span class="text-[13px] text-white/75">· ${c.owner.swaps} swaps</span></div>
<p class="flex items-baseline gap-2 min-w-0 text-[13px] leading-5"><span class="shrink-0 text-[11px] font-bold uppercase tracking-wider text-white/70">Wants</span><span class="truncate">${c.wantsShort}</span></p>
${c.match ? `<button type="button" data-match="${c.match.id}" class="self-start inline-flex items-center gap-2 h-9 pl-1 pr-3.5 rounded-full bg-white text-on-surface text-[13px] font-semibold shadow-md hover:bg-surface-container-low">${`<img alt="" draggable="false" class="w-7 h-7 rounded-full object-cover" src="${c.match.src}">`}Your ${c.match.title} fits — offer it${icon('arrow_forward', 'text-[16px] text-primary')}</button>` : ''}
</div>
</div>
${deckPanel(c)}
<div data-details data-portrait-only aria-hidden="${!details}" class="absolute inset-x-0 bottom-0 top-[28%] rounded-t-2xl bg-surface-container-lowest text-on-surface overflow-y-auto transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)] ${details ? '' : 'translate-y-full'}">
<div class="sticky top-0 flex items-start gap-3 px-5 pt-4 pb-3 bg-surface-container-lowest border-b border-surface-variant"><div class="min-w-0 flex-1"><p class="font-headline-sm text-headline-sm leading-6">${c.title}</p><p class="text-[13px] text-on-surface-variant">${c.cond} · ${c.cat} · ${c.km} · ${c.city}</p></div><button type="button" data-details-close aria-label="Close details" class="grid place-items-center w-9 h-9 rounded-full hover:bg-surface-container-high text-on-surface-variant shrink-0">${icon('expand_more', 'text-[22px]')}</button></div>
<div class="px-5 py-4 flex flex-col gap-5">
<section><p class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-1">About this find</p><p class="font-body-md text-body-md">${c.notes}</p></section>
<section><p class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-1">${c.owner.name.split(' ')[0]} wants</p><p class="font-body-md text-body-md">${c.wants}</p><div class="mt-2 flex gap-1.5">${c.wantsCats.map((w) => `<span class="px-2 h-6 inline-flex items-center rounded-full bg-surface-container-high text-[12px] font-semibold text-on-surface-variant">${w}</span>`).join('')}</div>${c.match ? '' : `<p class="mt-2 text-[13px] text-on-surface-variant">None of your finds fits this — you can still offer one.</p>`}</section>
<section class="flex items-center gap-3"><img alt="" class="w-11 h-11 rounded-full object-cover" src="${c.owner.src}"><div class="min-w-0 flex-1"><p class="font-label-lg text-label-lg">${c.owner.name}</p><p class="text-[13px] text-on-surface-variant">${c.owner.swaps} swaps done</p></div><button type="button" data-person="${c.owner.name}" class="font-label-md text-label-md text-primary hover:underline">About ${c.owner.name.split(' ')[0]}</button></section>
<a href="#" data-missing="Report opens the report sheet (no V6 design yet)" class="self-start inline-flex items-center gap-1.5 text-[13px] text-outline hover:text-on-surface-variant">${icon('flag', 'text-[16px]')}Report this find</a>
</div></div>
</article>`
}

/* Wide card (Alex, 2026-09-28: "massive empty space around cards" on a 17"
 * laptop and a 22–24" screen). The card's height is fixed by the window, so a
 * portrait card can't grow into the width. When the deck column has room
 * (a container query — the side nav and the rail both eat into it) the card
 * turns landscape: photo on the left at the same size, and what sat behind
 * "i" becomes a panel on the right, always open. The action bar spans both.
 * Narrower columns (expanded nav at 1440, tablet, phone) keep the portrait
 * card exactly as R1 drew it. */
function deckPanel(c) {
  const tag = (t) => `<span class="px-2.5 h-7 inline-flex items-center rounded-full bg-surface-container-high text-on-surface-variant text-[12px] font-semibold">${t}</span>`
  const first = c.owner.name.split(' ')[0]
  return `<aside data-deck-panel aria-label="About ${c.title}" class="absolute top-0 right-0 bottom-0 flex-col bg-surface-container-lowest text-on-surface" style="width:var(--panel-w)">
<div class="flex-1 min-h-0 overflow-y-auto px-6 pt-6 pb-4 flex flex-col gap-5">
<div class="flex flex-col gap-2"><div class="flex flex-wrap gap-1.5">${tag(c.cond)}${tag(c.cat)}</div>
<h2 class="font-headline-lg text-[28px] leading-[34px]">${c.title}</h2>
<p class="flex items-center gap-1 text-[13px] leading-5 text-on-surface-variant">${icon('near_me', 'text-[16px]')}${c.km} · ${c.city}</p></div>
<button type="button" data-person="${c.owner.name}" aria-label="About ${first}" class="w-full text-left flex items-center gap-3 rounded-xl bg-surface-container-low p-3 hover:bg-surface-container-high transition-colors"><img alt="" draggable="false" class="w-11 h-11 rounded-full object-cover" src="${c.owner.src}"><span class="min-w-0 flex-1"><span class="block font-label-lg text-label-lg">${c.owner.name}</span><span class="block text-[13px] text-on-surface-variant">${c.owner.swaps} swaps done</span></span>${icon('chevron_right', 'text-[22px] text-on-surface-variant')}</button>
<section><p class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-1">${first} wants</p><p class="font-body-md text-body-md">${c.wants}</p><div class="mt-2 flex gap-1.5">${c.wantsCats.map(tag).join('')}</div></section>
<section><p class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-1">About this find</p><p class="font-body-md text-body-md">${c.notes}</p></section>
<a href="#" data-missing="Report opens the report sheet (no V6 design yet)" class="self-start inline-flex items-center gap-1.5 text-[13px] text-outline hover:text-on-surface-variant">${icon('flag', 'text-[16px]')}Report this find</a>
</div>
<div class="shrink-0 px-6 py-4 border-t border-surface-variant">${c.match
    ? `<button type="button" data-match="${c.match.id}" class="w-full flex items-center gap-3 p-2 pr-4 rounded-xl bg-primary-container text-on-primary-container text-left hover:brightness-[0.97]"><img alt="" draggable="false" class="w-11 h-11 rounded-lg object-cover" src="${c.match.src}"><span class="flex-1 min-w-0"><span class="block font-label-lg text-label-lg">Your ${c.match.title} fits</span><span class="block text-[13px] leading-5">It’s on ${first}’s list — offer it</span></span>${icon('arrow_forward', 'text-[20px] text-primary')}</button>`
    : `<p class="flex items-start gap-2 text-[13px] leading-5 text-on-surface-variant">${icon('info', 'text-[18px]')}None of your finds fits ${first}’s list — you can still put one on the table.</p>`}</div>
</aside>`
}

const DECK_STYLE = `<style id="deck-stage">
[data-deck-col]{container-type:inline-size}
[data-deck]{--deck-h:max(460px,calc(100dvh - 252px));--photo-w:max(520px,calc(var(--deck-h) * .78));--panel-w:0px;width:min(100%,var(--photo-w))}
[data-deck-stack]{height:var(--deck-h)}
[data-deck-panel]{display:none}
/* Full-screen photos (Alex, 2026-09-29: Item detail is cut — the card is the
   find, so its photos open full screen right from it). Beside the i. */
[data-photo-full="btn"]{right:56px}
[data-viewer][hidden]{display:none!important}
@container (min-width:860px){
  [data-photo-full="btn"]{right:calc(var(--panel-w) + 12px)}
  [data-deck]{--panel-w:360px;width:min(100%,calc(var(--photo-w) + var(--panel-w)))}
  [data-deck-panel]{display:flex}
  [data-photo-pane]{right:var(--panel-w)}
  [data-portrait-only]{display:none}
}
@container (min-width:1200px){[data-deck]{--panel-w:420px}}
@media (max-width:767.98px){[data-deck]{--deck-h:max(400px,calc(100dvh - 292px));width:100%}}
</style>`

function deckStage({ cards = DECK, top = 0, details = false, end = false } = {}) {
  const order = cards.map((c, k) => [c, k])
  return `${DECK_STYLE}<section data-deck aria-label="Discover deck" class="mx-auto flex flex-col gap-3">
<div data-deck-stack class="relative">
<div data-deck-end class="absolute inset-0 rounded-2xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-center px-8 gap-2">${icon('style', 'text-[40px] text-outline')}<p class="font-headline-sm text-headline-sm text-on-surface">That’s everything within 10 km for now</p><p class="font-body-sm text-body-sm text-on-surface-variant max-w-xs">New finds land every day. Put one of yours on the table meanwhile — it shows up in other people’s decks.</p><button type="button" data-deck-restart class="mt-3 h-10 px-4 rounded-xl ring-1 ring-outline-variant font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high">Start the mock deck again</button></div>
${order.reverse().map(([c, k]) => {
  const d = k - top
  const style = end || d < 0 ? 'opacity:0;pointer-events:none' : d === 0 ? '' : d === 1 ? 'transform:translateY(14px) scale(.95);pointer-events:none' : 'opacity:0;pointer-events:none'
  return deckCard(c, k, { details: details && d === 0 }).replace('class="absolute inset-0 rounded-2xl', `style="${style}" class="absolute inset-0 rounded-2xl`).replace(/ style=""/, '')
}).join('\n')}
</div>
<div class="relative z-[1]"><div class="max-md:hidden">${deckActions({ size: 'wide', undo: 'locked' })}</div><div class="md:hidden">${deckActions({ size: 'compact', undo: 'locked' })}</div></div>
</section>`
}

// The photo viewer lives at the body level, outside the deck's container query.
const VIEWER = `<div data-viewer hidden role="dialog" aria-modal="true" aria-label="Photos" class="fixed inset-0 z-[95] flex flex-col text-white" style="background:rgba(10,12,14,.97)">
<div class="shrink-0 flex items-center gap-3 px-4 h-14"><span data-v-count class="font-ticker-number text-[14px] text-white/80">1 / 1</span><p data-v-title class="flex-1 min-w-0 truncate text-center font-label-lg text-label-lg"></p><button type="button" data-v-close aria-label="Close" class="grid place-items-center w-11 h-11 rounded-full hover:bg-white/10">${icon('close', 'text-[26px]')}</button></div>
<div data-v-stage class="relative flex-1 min-h-0 select-none touch-none"><img data-v-img alt="" draggable="false" class="absolute inset-0 w-full h-full object-contain transition-opacity duration-200" src="">
<button type="button" data-v-step="-1" aria-label="Previous photo" class="absolute left-3 top-1/2 -translate-y-1/2 grid place-items-center w-12 h-12 rounded-full bg-white/15 hover:bg-white/25">${icon('chevron_left', 'text-[28px]')}</button>
<button type="button" data-v-step="1" aria-label="Next photo" class="absolute right-3 top-1/2 -translate-y-1/2 grid place-items-center w-12 h-12 rounded-full bg-white/15 hover:bg-white/25">${icon('chevron_right', 'text-[28px]')}</button></div>
<div data-v-thumbs class="shrink-0 flex justify-center gap-2 px-4 pt-3 pb-[max(14px,env(safe-area-inset-bottom))]"></div>
</div>`
const DECK_SCRIPT = `${VIEWER}<script>
(() => {
  const stage = document.querySelector('[data-deck]'); if (!stage) return
  const cards = [...stage.querySelectorAll('[data-deck-card]')].sort((a, b) => a.dataset.deckCard - b.dataset.deckCard)
  const EASE = 'transform .24s cubic-bezier(.2,0,0,1), opacity .24s cubic-bezier(.2,0,0,1)'
  let i = 0, pending = false
  // Full-screen photos: the card's own photos, starting at the one showing.
  const viewer = document.querySelector('[data-viewer]'); let vp = [], vi = 0
  const vshow = (k) => {
    vi = (k + vp.length) % vp.length
    viewer.querySelector('[data-v-img]').src = vp[vi]
    viewer.querySelector('[data-v-count]').textContent = (vi + 1) + ' / ' + vp.length
    viewer.querySelectorAll('[data-v-thumb]').forEach((t) => t.setAttribute('aria-pressed', String(+t.dataset.vThumb === vi)))
  }
  const vopen = (c) => {
    const imgs = [...c.querySelectorAll('[data-photo]')]
    vp = imgs.map((im) => im.src)
    const cur = Math.max(0, imgs.findIndex((im) => im.style.opacity === '1' || (!im.style.opacity && !im.classList.contains('opacity-0'))))
    viewer.querySelector('[data-v-title]').textContent = c.getAttribute('aria-label')
    viewer.querySelectorAll('[data-v-step]').forEach((b) => (b.hidden = vp.length < 2))
    viewer.querySelector('[data-v-thumbs]').innerHTML = vp.length < 2 ? '' : vp.map((src, k) => '<button type="button" data-v-thumb="' + k + '" aria-pressed="false" class="w-14 h-14 rounded-lg overflow-hidden ring-2 ring-transparent aria-pressed:ring-white opacity-60 aria-pressed:opacity-100"><img alt="" class="w-full h-full object-cover" src="' + src + '"></button>').join('')
    viewer.hidden = false; vshow(cur)
  }
  let vx = null
  viewer.addEventListener('pointerdown', (e) => { if (e.target.closest('[data-v-stage]') && !e.target.closest('button')) vx = e.clientX })
  viewer.addEventListener('pointerup', (e) => { if (vx === null) return; const dx = e.clientX - vx; vx = null; if (Math.abs(dx) > 50 && vp.length > 1) vshow(vi + (dx < 0 ? 1 : -1)) })
  viewer.addEventListener('click', (e) => {
    if (e.target.closest('[data-v-close]')) { viewer.hidden = true; return }
    const s = e.target.closest('[data-v-step]'); if (s) return vshow(vi + +s.dataset.vStep)
    const t = e.target.closest('[data-v-thumb]'); if (t) return vshow(+t.dataset.vThumb)
  })
  const toast = (m) => { const t = document.getElementById('v6-toast'); if (!t) return; t.textContent = m; t.style.opacity = '1'; t.style.transform = 'translate(-50%,0)'; clearTimeout(toast.t); toast.t = setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translate(-50%,8px)' }, 2400) }
  const top = () => cards[i]
  const name = () => top() ? top().querySelector('.font-label-lg').textContent : ''
  const layout = () => cards.forEach((c, k) => {
    const d = k - i
    c.style.transition = EASE
    if (d < 0) return
    c.style.pointerEvents = d === 0 ? 'auto' : 'none'
    c.style.opacity = d <= 1 ? '1' : '0'
    c.style.transform = d === 0 ? 'none' : 'translateY(14px) scale(.95)'
    c.style.zIndex = String(10 - d)
  })
  const stamps = (c, dx) => { c.querySelector('[data-stamp=pass]').style.opacity = String(Math.min(1, Math.max(0, -dx / 110))); c.querySelector('[data-stamp=offer]').style.opacity = String(Math.min(1, Math.max(0, dx / 110))) }
  const fly = (dir) => {
    const c = top(); if (!c) return
    closeDetails(c)
    c.style.transition = EASE
    c.style.transform = 'translateX(' + dir * 130 + '%) rotate(' + dir * 16 + 'deg)'
    c.style.opacity = '0'; c.style.pointerEvents = 'none'
    i++; setTimeout(layout, 10)
  }
  const back = (c) => { c.style.transition = EASE; c.style.transform = 'none'; stamps(c, 0) }
  const modal = document.getElementById('barter-modal')
  const composer = () => [...document.querySelectorAll('#barter-modal [data-composer]')].find((r) => r.offsetParent !== null)
  const offer = (pick, superOn) => {
    if (!top() || !modal) return
    pending = true; modal.classList.remove('hidden')
    const root = composer(); if (!root) return
    if (pick) { const t = root.querySelector('[data-find="' + pick + '"]'); if (t && t.getAttribute('aria-pressed') !== 'true') t.click() }
    const sw = root.querySelector('[data-super]')
    if (sw && superOn && sw.getAttribute('aria-checked') !== 'true') sw.closest('label').click()
  }
  const openDetails = (c) => { const d = c.querySelector('[data-details]'); d.classList.remove('translate-y-full'); d.setAttribute('aria-hidden', 'false') }
  const closeDetails = (c) => { const d = c && c.querySelector('[data-details]'); if (d) { d.classList.add('translate-y-full'); d.setAttribute('aria-hidden', 'true') } }
  const step = (c, s) => {
    const imgs = [...c.querySelectorAll('[data-photo]')], segs = [...c.querySelectorAll('[data-seg]')]
    let n = imgs.findIndex((im) => im.style.opacity !== '0' && !im.classList.contains('opacity-0'))
    n = Math.min(imgs.length - 1, Math.max(0, n + s))
    imgs.forEach((im, k) => { im.classList.remove('opacity-0'); im.style.opacity = k === n ? '1' : '0' })
    segs.forEach((sg, k) => { sg.className = sg.className.replace(/bg-white(\\/40)?/, k === n ? 'bg-white' : 'bg-white/40') })
  }

  // Drag: left = pass, right = offer.
  let drag = null
  stage.addEventListener('pointerdown', (e) => {
    const c = e.target.closest('[data-deck-card]')
    if (!c || c !== top() || e.target.closest('[data-details], [data-deck-panel], a, [data-match], [data-details-open], [data-person]')) return
    // Capture only once it really moves — capturing on touch-down sent every
    // tap to the card, so the photo buttons never got their click.
    drag = { c, x: e.clientX, y: e.clientY, dx: 0, moved: false, id: e.pointerId }
    c.style.transition = 'none'
  })
  stage.addEventListener('pointermove', (e) => {
    if (!drag) return
    drag.dx = e.clientX - drag.x; const dy = e.clientY - drag.y
    if (!drag.moved && Math.abs(drag.dx) > 6) { drag.moved = true; try { drag.c.setPointerCapture(drag.id) } catch (err) {} }
    drag.c.style.transform = 'translateX(' + drag.dx + 'px) translateY(' + dy * 0.15 + 'px) rotate(' + drag.dx / 22 + 'deg)'
    stamps(drag.c, drag.dx)
  })
  const end = () => {
    if (!drag) return
    const { c, dx, moved } = drag; drag = null
    if (dx < -110) fly(-1)
    else if (dx > 110) { back(c); offer() }
    else back(c)
    if (moved) stage.dataset.justDragged = '1', setTimeout(() => delete stage.dataset.justDragged, 50)
  }
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end)

  document.addEventListener('click', (e) => {
    if (stage.dataset.justDragged) { e.preventDefault(); return }
    const a = e.target.closest('[data-action]')
    if (a && stage.contains(a)) {
      const act = a.dataset.action
      if (act === 'pass') fly(-1)
      else if (act === 'want') offer()
      else if (act === 'super') offer(null, true)
      else if (act === 'undo') toast('Undo your last pass is a Collector perk')
      else if (act === 'boost') toast('Boost puts one of YOUR finds at the top of decks for a day · 75 pts')
      return
    }
    const m = e.target.closest('[data-match]'); if (m) return offer(m.dataset.match)
    const pf = e.target.closest('[data-photo-full]'); if (pf) return vopen(pf.closest('[data-deck-card]'))
    const st = e.target.closest('[data-photo-step]'); if (st) return step(st.closest('[data-deck-card]'), +st.dataset.photoStep)
    if (e.target.closest('[data-details-open]')) return openDetails(e.target.closest('[data-deck-card]'))
    if (e.target.closest('[data-details-close]')) return closeDetails(e.target.closest('[data-deck-card]'))
    if (e.target.closest('[data-deck-restart]')) { i = 0; cards.forEach((c) => { c.style.transform = ''; stamps(c, 0) }); return layout() }
    // The composer: an offer that is sent takes the card away; cancel leaves it.
    if (pending && e.target.closest('#barter-modal [data-send]:not([disabled])')) {
      const c = top(), who = name(), mine = (composer() || document).querySelector('[data-find][aria-pressed=true]')
      pending = false; modal.classList.add('hidden'); fly(1)
      // They had already put this find on the table for yours: it's a match.
      if (c && c.dataset.mirror && window.v6Match) window.v6Match({ name: c.dataset.mirror, a: mine ? mine.dataset.src : '', b: c.querySelector('[data-photo]').src })
      else toast('Offer on the table — ' + who + ' will see it')
    } else if (pending && (e.target === modal || e.target.closest('#modal-close, #modal-cancel'))) pending = false
  }, true)

  document.addEventListener('keydown', (e) => {
    if (!viewer.hidden) { if (e.key === 'Escape') viewer.hidden = true; else if (e.key === 'ArrowLeft') vshow(vi - 1); else if (e.key === 'ArrowRight') vshow(vi + 1); return }
    if (e.target.closest('input, textarea, select') || (modal && !modal.classList.contains('hidden'))) return
    const c = top(); if (!c) return
    if (e.key === 'ArrowLeft') fly(-1)
    else if (e.key === 'ArrowRight') offer()
    else if (e.key === 'ArrowUp') { e.preventDefault(); openDetails(c) }
    else if (e.key === 'ArrowDown') { e.preventDefault(); closeDetails(c) }
  })
  layout()
  if (location.hash === '#details') openDetails(top())
  if (location.hash === '#end') { i = cards.length; cards.forEach((c) => (c.style.opacity = '0')) }
})()
</script>`

// Discover: the whole left column becomes the deck stage (card + action bar).
{
  const f = 'stitch/02-discover-desktop-r1.html'
  let s = read(f)
  const a = s.indexOf('<!-- LEFT: MAIN DECK STAGE')
  const b = s.indexOf('<!-- offer_composer R1 (build-revisions.mjs) -->')
  if (a < 0 || b < 0) throw new Error(`${f}: deck stage markers not found`)
  s = s.slice(0, a) + `<!-- deck stage R1 (build-revisions.mjs): card sized to the window + action bar under it -->
<main data-deck-col class="w-full lg:flex-1 lg:min-w-0 flex flex-col">
${deckStage()}
` + s.slice(b)
  // 2026-09-28: Stitch's 1280px, 8/4 grid left big screens half empty. Now the
  // rail keeps a fixed width against the right edge and the deck column takes
  // everything else; the card centres in it.
  const swap = (from, to) => { if (!s.includes(from)) throw new Error(`${f}: layout marker not found: ${from}`); s = s.replace(from, to) }
  swap('<div class="relative w-full max-w-7xl mx-auto px-margin md:px-gutter-desktop', '<div class="relative w-full px-margin md:px-gutter-desktop')
  swap('<div class="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">', '<div class="flex flex-col lg:flex-row gap-space-lg lg:gap-gutter-desktop items-start">')
  swap('<aside class="lg:col-span-4 flex flex-col', '<aside class="w-full lg:w-[clamp(320px,22vw,400px)] lg:shrink-0 flex flex-col')
  // Stitch's own deck script drove the old card, buttons, modal and arrow keys
  // by id; the deck stage replaces all of that and it would throw on null.
  const k = s.indexOf("getElementById('swap-card-top')")
  if (k > 0) { const sa = s.lastIndexOf('<script>', k), sb = s.indexOf('</script>', k) + '</script>'.length; s = s.slice(0, sa) + s.slice(sb) }
  s = s.replace('</body>', `${DECK_SCRIPT}\n</body>`)
  write(f, s)
}

// The sheet: the real page at four window sizes (scaled), plus drawn states.
const fit = (w, h, scale, hash = '') => `<div class="rounded-lg overflow-hidden ring-1 ring-outline-variant bg-background shadow-md" style="width:${Math.round(w * scale)}px;height:${Math.round(h * scale)}px"><iframe src="../02-discover-desktop-r1.html${hash}" width="${w}" height="${h}" class="border-0 block" style="transform:scale(${scale});transform-origin:0 0" title="Discover at ${w}×${h}"></iframe></div>`
const cardAt = (w, h, inner) => `<div class="relative" style="width:${w}px;height:${h}px">${inner}</div>`
write(
  'stitch/organisms/deck-stage-r1.html',
  `<!DOCTYPE html><html lang="en">
<!-- deck stage R1 — generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-surface-container-low font-body-md text-on-surface antialiased p-10">
<h1 class="font-headline-lg text-headline-lg mb-2">Deck — find card + action bar, R1</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-2 max-w-3xl">The card is sized from the window, so the card and the action bar always fit — no scrolling to reach Pass or Put on Table. Owner and wants live on the photo; the match is one white pill. Everything long is behind <b>i</b>.</p>
<p class="font-body-md text-body-md text-on-surface-variant mb-8 max-w-3xl"><b>Try it</b> in the frames or on the Discover page: drag the card left (Pass) or right (Put on Table), press ← → ↑ ↓, tap the photo’s edges, tap the match pill.</p>
<div class="flex flex-wrap items-start gap-10">
${state('fit-1440', '1440 × 900 (laptop)', 'Shown at 50%. Card, action bar and rail — no scroll.', 720, fit(1440, 900, 0.5))}
${state('fit-1920', '1920 × 1080 (desktop)', 'Shown at 40%. The card grows with the window.', 768, fit(1920, 1080, 0.4))}
${state('fit-1280', '1280 × 720 (small laptop)', 'Shown at 55%. The tightest desktop — still fits.', 704, fit(1280, 720, 0.55))}
${state('fit-phone', 'Phone 390 × 844', 'Actual size. Card between the top bar and the action bar, tab bar below.', 390, fit(390, 844, 1))}
</div>
<div class="flex flex-wrap items-start gap-10 mt-4">
${state('rest', 'The card at rest', 'Photo is the card. Bottom scrim: distance · title · owner line (no stars) · Wants line · the match pill.', 500, cardAt(500, 640, deckCard(DECK[0], 0)))}
${state('details', 'i — details slide up inside the card', 'About this find, the full wish, the owner, report. ↓ or the chevron closes it.', 500, cardAt(500, 640, deckCard(DECK[0], 0, { details: true })))}
${state('drag-pass', 'Dragging left — PASS', 'The stamp fades in with the distance; let go past 110px to pass.', 500, cardAt(500, 640, deckCard(DECK[0], 0, { stamp: 'pass', drag: -80 })))}
${state('drag-offer', 'Dragging right — OFFER', 'Past 110px the composer opens; the card leaves only when the offer is sent.', 500, cardAt(500, 640, deckCard(DECK[0], 0, { stamp: 'offer', drag: 80 })))}
${state('nomatch', 'No match', 'None of your finds fits their wants: no pill — the Wants line stays.', 500, cardAt(500, 640, deckCard(DECK[3], 3)))}
${state('end', 'End of the deck', 'Nothing left within your radius.', 500, cardAt(500, 640, deckStage({ end: true }).replace(/<div class="max-md:hidden">[\s\S]*$/, '</div></section>')))}
</div>
</body></html>`,
)

/* ───────────────────────────── Active Swaps at volume ─────────────────────────────
 * Alex, 2026-09-28: "I need to see, if I get 6 expiring proposals and 14 agreed
 * swaps, how it looks … I do not want the user to run away when they see so
 * many elements on one page." Two pages from the R2 revision, same data:
 *
 *   A  04-active-swaps-volume-a.html  — as drawn (Stitch cards, R1 agreed card),
 *                                        just more of them.
 *   B  04-active-swaps-volume-b.html  — proposal: one screen, list + detail.
 *      Left, a list of one-line rows grouped by what each one waits on;
 *      right, the one you picked in full. The page itself never scrolls.
 *
 * 14 agreed swaps is Collector or Curator — Hunter stops at 3 on the go
 * (lib/membership.ts). */
{
const anyAlt = (start) => { for (const h of [S1, S2, S4, S5]) if (h.includes(`data-alt="${start}`)) return imgByAlt(h, start); throw new Error(`no image: ${start}`) }
const FACE = {
  marcusV: anyAlt('Close up portrait photo of Marcus Vance'), elenaR: anyAlt('Portait of Elena Rostova'), julian: anyAlt('Portrait of Julian Ross'),
  sara: anyAlt('Authentic candid portrait of Sara M.'), samira: SAMIRA, marcusT: anyAlt('Editorial portrait of Marcus T.'), elenaK: anyAlt('Warm natural portrait of Elena K.'),
}
const TINTS = ['bg-sky', 'bg-lilac', 'bg-mint', 'bg-sun']
const avatar = (who, size = 'w-10 h-10', text = 'text-[13px]') => who.face
  ? `<img alt="" class="${size} rounded-full object-cover shrink-0" src="${who.face}">`
  : `<span class="${size} rounded-full grid place-items-center shrink-0 ${TINTS[who.name.length % 4]} text-ink ${text} font-bold">${who.name.split(' ').map((w) => w[0]).join('').replace('.', '')}</span>`
const mine = (t) => byTitle(t)
const OFFERS = [
  { id: 'o1', who: { name: 'Marcus V.', face: FACE.marcusV, swaps: 24, km: '4.8 km' }, theirs: { title: 'Fender Vibro-Champ Amp', src: PH.fender, meta: 'Music · Good' }, yours: mine('Marantz 2215B Receiver'), left: '3h 44m', h: 3.7, note: 'I’ve been hunting for this receiver to pair with my turntable. Evenings work best for me.' },
  { id: 'o2', who: { name: 'Elena R.', face: FACE.elenaR, swaps: 7, km: '2.1 km' }, theirs: { title: 'Brass Banker’s Lamp', src: PH.lamp, meta: 'Home · Very good' }, yours: mine('Terracotta Planters ×3'), left: '11h 20m', h: 11.3 },
  { id: 'o3', who: { name: 'Julian R.', face: FACE.julian, swaps: 18, km: '3.2 km' }, theirs: { title: 'Olympus OM-1 35mm SLR', src: OLYMPUS, meta: 'Cameras · Excellent' }, yours: mine('Fuji X100 Leather Half-Case'), left: '14h 05m', h: 14, super: true, note: 'Your case would fit my X100 perfectly.' },
  { id: 'o4', who: { name: 'Sara M.', face: FACE.sara, swaps: 12, km: '6.5 km' }, theirs: { title: 'Specialized Sirrus Hybrid Bike', src: PH.bike, meta: 'Outdoors · Good' }, yours: mine('Wool Camp Blanket'), left: '18h 30m', h: 18.5 },
  { id: 'o5', who: { name: 'Liam V.', swaps: 5, km: '5.9 km' }, theirs: { title: 'Levi’s Type III Denim Jacket', src: PH.levis, meta: 'Clothing · Good' }, yours: mine('Sony Walkman WM-D6C'), left: '21h 10m', h: 21.2 },
  { id: 'o6', who: { name: 'Sora K.', swaps: 2, km: '1.4 km' }, theirs: { title: 'Mid-Century Teak Planter', src: PH.planter, meta: 'Home · Very good' }, yours: mine('Ceramic Pour-Over Set'), left: '23h 40m', h: 23.7 },
]
const SENT = [
  { id: 's1', who: { name: 'Marcus T.', face: FACE.marcusT, swaps: 31, km: '7.2 km' }, theirs: { title: 'Akai Reel-to-Reel Deck', src: PH.marantz, meta: 'Audio · Good' }, yours: mine('Braun AB1 Travel Clock'), left: '19h 02m' },
  { id: 's2', who: { name: 'Elena K.', face: FACE.elenaK, swaps: 9, km: '3.9 km' }, theirs: { title: 'Hand-thrown Ceramic Vase', src: PH.pourover, meta: 'Home · Excellent' }, yours: mine('Lamy 2000 Fountain Pen'), left: '22h 48m' },
]
// 14 agreed: 2 where the other side already confirmed (your turn), 4 where you
// did (waiting), 8 nobody yet — one of them silent for 12 days.
const G = (title, short, src) => ({ title, short, src })
function swapOf([name, face, who, ago, give, get, stale], id) {
  return { id, who, stale, p: { name, first: name.split(' ')[0], avatar: face ? face : `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="${['#7EB3DD', '#AE9FDC', '#D6EBDF', '#EDC857'][name.length % 4]}"/><text x="20" y="25" font-family="Figtree,sans-serif" font-size="14" font-weight="700" text-anchor="middle" fill="#17191E">${name.split(' ').map((w) => w[0]).join('').replace('.', '')}</text></svg>`)}`, ago, give: { title: give, src: mine(give).src }, get } }
}
// Archive (Alex, 2026-09-29): swaps both sides confirmed. The chat closes, but
// you can still look back at what you swapped and what was said.
const ARCHIVE = [
  ['Elena R.', FACE.elenaR, 'both', 'Swapped 24 Sep', 'Yashica Mat 124G', G('Brass Banker’s Lamp', 'lamp', PH.lamp)],
  ['Ines G.', null, 'both', 'Swapped 19 Sep', 'Pentax K1000', G('Denim Chore Jacket', 'jacket', PH.levis)],
  ['Marcus V.', FACE.marcusV, 'both', 'Swapped 11 Sep', 'Nakamichi Cassette Deck', G('Enamel Coffee Pot', 'coffee pot', PH.pourover)],
  ['Noah B.', null, 'both', 'Swapped 2 Sep', 'Copper Kettle', G('Stoneware Planter', 'planter', PH.terracotta)],
].map((t, i) => swapOf(t, `d${i + 1}`))
const AGREED = [
  ['Samira P.', FACE.samira, 'them', 'Agreed 2 days ago', 'Leica Mini 35mm', G('Sony Walkman WM-D6C Pro', 'Walkman', WALKMAN)],
  ['Noah B.', null, 'them', 'Agreed 4 days ago', 'Canon AE-1 Body', G('Braun AB1 Travel Clock', 'clock', PH.braun)],
  ['Marcus T.', FACE.marcusT, 'me', 'Agreed yesterday', 'Koss Pro-4AA Headphones', G('Fender Vibro-Champ Amp', 'amp', PH.fender)],
  ['Ines G.', null, 'me', 'Agreed 3 days ago', 'Pendleton Board Shirt', G('Wool Camp Blanket', 'blanket', PH.blanket)],
  ['Elena K.', FACE.elenaK, 'me', 'Agreed 5 days ago', 'Parker 51 Pen', G('Ceramic Pour-Over Set', 'pour-over set', PH.pourover)],
  ['Tomás R.', null, 'me', 'Agreed 6 days ago', 'Coleman Lantern', G('Brass Banker’s Lamp', 'lamp', PH.lamp)],
  ['Aiko H.', null, 'none', 'Agreed today', 'Polaroid SX-70', G('Lamy 2000 Fountain Pen', 'pen', PH.lamy)],
  ['Priya S.', null, 'none', 'Agreed today', 'Teak Serving Tray', G('Terracotta Planters ×3', 'planters', PH.terracotta)],
  ['Julian R.', FACE.julian, 'none', 'Agreed yesterday', 'Sansui AU-217 Amplifier', G('Olympus OM-1 35mm SLR', 'camera', OLYMPUS)],
  ['Ben O.', null, 'none', 'Agreed 2 days ago', 'Barbour Waxed Jacket', G('Levi’s Type III Jacket', 'jacket', PH.levis)],
  ['Sara M.', FACE.sara, 'none', 'Agreed 3 days ago', 'Trangia Stove Set', G('Specialized Sirrus Bike', 'bike', PH.bike)],
  ['Lena W.', null, 'none', 'Agreed 4 days ago', 'Minolta Rokkor 50mm Lens', G('Fuji X100 Half-Case', 'case', PH.fujicase)],
  ['Omar F.', null, 'none', 'Agreed 8 days ago', 'Red Wing Moc Toes', G('Mid-Century Teak Planter', 'planter', PH.planter)],
  ['Chloe D.', null, 'none', 'Agreed 12 days ago', 'Grundig Transistor Radio', G('Marantz 2215B Receiver', 'receiver', PH.marantz), true],
].map((t, i) => swapOf(t, `a${i + 1}`))

const src04 = read('stitch/04-active-swaps-desktop-r1.html')

/* ── A: as drawn, at volume ── */
{
  let s = src04.replace('<title>', '<title>AT VOLUME (A) · ')
  const tileA = s.indexOf('<!-- Card 2 Body -->'), tileB = s.indexOf('<!-- Negotiation Quick-Check Radar Card -->')
  if (tileA < 0 || tileB < 0) throw new Error('volume A: offer tile markers not found')
  const tile = s.slice(tileA, tileB)
  const ELENA_FACE = FACE.elenaR
  const clone = (o) => tile.replaceAll('Elena Rostova', o.who.name).replaceAll('Elena', o.who.name.split(' ')[0]).replaceAll('Expires in 11h 20m', `Expires in ${o.left}`)
    .replace(ELENA_FACE, o.who.face || FACE.samira).replace(PH.terracotta, o.yours.src).replace(PH.lamp, o.theirs.src)
    .replace('Terracotta Planter Set', o.yours.title).replace('Brass Banker\'s Lamp', o.theirs.title)
  const end = s.indexOf('<!-- handover_desk R1 (build-revisions.mjs) -->')
  const gridEnd = s.lastIndexOf('</div>', end) // closes the offers block
  s = s.slice(0, gridEnd) + `<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">${OFFERS.slice(2).map(clone).join('\n')}</div>\n` + s.slice(gridEnd)
  const hA = s.indexOf('<!-- handover_desk R1 (build-revisions.mjs) -->'), hB = s.indexOf('<!-- 4. Always-Free Safeguards Guarantee Banner -->')
  s = s.slice(0, hA) + `<!-- 14 agreed swaps, R1 card each -->
<section class="mb-14"><div class="flex items-end justify-between mb-6 gap-2"><div><div class="flex items-center gap-2">${icon('handshake', 'text-secondary text-[24px]')}<h2 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Agreed swaps</h2></div>
<p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Swaps you both said yes to. Each of you confirms once it has happened.</p></div>
<span class="font-label-sm text-label-sm bg-secondary-container text-on-secondary-container font-bold px-3 py-1 rounded-full w-fit">14 agreed</span></div>
<div class="flex flex-col gap-6">${AGREED.map((a) => handoverDesk({ who: a.who, p: a.p })).join('\n')}</div></section>
` + s.slice(hB)
  write('stitch/04-active-swaps-volume-a.html', s)
}

/* ── B: one screen — list + detail ── */
{
  const pill = (o) => {
    const tone = o.h < 6 ? 'bg-coral text-ink' : o.h < 12 ? 'bg-sun text-ink' : 'bg-surface-container-high text-on-surface-variant'
    return `<span class="inline-flex items-center gap-1 h-6 px-2 rounded-full ${tone} font-ticker-number text-[12px] leading-none whitespace-nowrap">${icon('schedule', 'text-[14px]')}${o.left}</span>`
  }
  const ROW = 'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-surface-container-high aria-selected:bg-primary-container aria-selected:hover:bg-primary-container'
  const offerRow = (o, sent = false) => `<button type="button" role="tab" data-pick="${o.id}" aria-selected="false" class="${ROW}">
<img alt="" class="w-12 h-12 rounded-lg object-cover shrink-0" src="${o.theirs.src}">
<span class="min-w-0 flex-1"><span class="flex items-center gap-1.5 font-label-lg text-label-lg text-on-surface"><span class="truncate">${o.theirs.title}</span>${o.super ? filled('bolt', 'text-[16px] text-ink shrink-0') : ''}</span><span class="block truncate font-body-sm text-body-sm text-on-surface-variant">${sent ? `${o.who.name}’s · for your ${o.yours.title}` : `${o.who.name} · for your ${o.yours.title}`}</span></span>
${sent ? `<span class="font-label-md text-label-md text-outline whitespace-nowrap">${o.left}</span>` : pill(o)}</button>`
  /* Chat lives here (Alex, 2026-09-28: "Chat is something the user goes back
   * and forth to — why not have it on this page?"). An agreed swap's row is its
   * conversation: who, the last message, unread count; the pair stays as the
   * thumbnail. The separate Chat page and its thread list (#34) are folded in. */
  const UNREAD = { Samira: 2, Aiko: 1, Julian: 1 }
  const THREAD_BASE = (a) => {
    const g = a.p.give.title, t = a.p.get.title, f = a.p.first
    return [
      ['sys', `You agreed to swap · ${a.p.ago.replace('Agreed ', '')}`],
      ['me', `Hi ${f}! Glad we agreed. When suits you?`],
      ['them', `Hey! Weekday evenings are easiest for me. Is the ${g} all working?`],
      ['me', `Yes, I tested it last week. The coffee place by the park?`],
      ['them', `Perfect. Thursday at 6?`],
      ['me', `Thursday at 6. See you then!`],
    ]
  }
  const threadFor = (a, i) => {
    const f = a.p.first
    let m = THREAD_BASE(a)
    if (a.stale) m = m.slice(0, 3).map((x, k) => (k === 0 ? ['sys', 'You agreed to swap · 12 days ago'] : x))
    else if (a.who === 'none') m = m.slice(0, 2 + (i % 4))
    if (a.p.first === 'Samira') m.push(['them-voice', '0:12'], ['them', `Just to say — I have the Leica. Loving it already!`])
    // Unread means THEY wrote last.
    if (UNREAD[f] && ![...m].reverse().find((x) => x[0] !== 'sys')[0].startsWith('them')) m.push(['them', 'Sounds good. Send me a time that works.'])
    if (a.who === 'them') m.push(['sys', `${f} confirmed the swap happened · your turn`])
    if (a.who === 'me') m.push(['sys', `You confirmed the swap happened · waiting for ${f}`])
    if (a.who === 'both') m.push(['them', `Got it home — works like a charm. Thanks Maya!`], ['sys', `You both confirmed · it’s a bartefy! · ${a.p.ago.replace('Swapped ', '')}`])
    return m
  }
  const lastLine = (a, i) => {
    const m = threadFor(a, i).filter((x) => x[0] !== 'sys').pop()
    if (!m) return 'Say hello'
    const who = m[0] === 'me' ? 'You' : a.p.first
    return m[0] === 'them-voice' ? `${who}: Voice note · ${m[1]}` : `${who}: ${m[1]}`
  }
  const agreedRow = (a) => {
    const i = AGREED.indexOf(a), n = UNREAD[a.p.first] || 0
    return `<button type="button" role="tab" data-pick="${a.id}" aria-selected="false" class="${ROW}">
<span class="relative w-12 h-12 shrink-0"><img alt="" class="absolute left-0 top-0 w-9 h-9 rounded-lg object-cover ring-2 ring-surface-container-lowest" src="${a.p.give.src}"><img alt="" class="absolute right-0 bottom-0 w-9 h-9 rounded-lg object-cover ring-2 ring-surface-container-lowest" src="${a.p.get.src}"></span>
<span class="min-w-0 flex-1"><span class="flex items-baseline gap-2"><span class="truncate font-label-lg text-label-lg text-on-surface">${a.p.name}</span><span class="truncate font-body-sm text-[12px] text-outline">· ${a.p.get.title}</span></span><span data-last class="block truncate font-body-sm text-body-sm ${n ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}">${a.stale ? 'No news for 12 days' : lastLine(a, i)}</span></span>
<span class="flex flex-col items-end gap-1 shrink-0"><span class="font-body-sm text-[12px] text-outline">${a.stale ? '12d' : a.p.ago.replace('Agreed ', '').replace(' days ago', 'd').replace('yesterday', '1d').replace('today', 'now')}</span>${n ? `<span data-unread class="min-w-[20px] h-5 px-1.5 grid place-items-center rounded-full bg-primary text-on-primary text-[11px] font-bold">${n}</span>` : a.stale ? icon('schedule', 'text-[16px] text-outline') : '<span class="h-5"></span>'}</span></button>`
  }
  // Archive: read-only. Same header and thread as an agreed swap; no confirm,
  // no Call it off, and the composer is replaced by a closed note.
  const archiveRow = (a) => `<button type="button" role="tab" data-pick="${a.id}" aria-selected="false" class="${ROW}">
<span class="relative w-12 h-12 shrink-0"><img alt="" class="absolute left-0 top-0 w-9 h-9 rounded-lg object-cover ring-2 ring-surface-container-lowest" src="${a.p.give.src}"><img alt="" class="absolute right-0 bottom-0 w-9 h-9 rounded-lg object-cover ring-2 ring-surface-container-lowest" src="${a.p.get.src}"></span>
<span class="min-w-0 flex-1"><span class="flex items-baseline gap-2"><span class="truncate font-label-lg text-label-lg text-on-surface">${a.p.name}</span><span class="truncate font-body-sm text-[12px] text-outline">· ${a.p.get.title}</span></span><span class="block truncate font-body-sm text-body-sm text-on-surface-variant">Your ${a.p.give.title} for their ${a.p.get.title}</span></span>
<span class="flex flex-col items-end gap-1 shrink-0"><span class="font-body-sm text-[12px] text-outline whitespace-nowrap">${a.p.ago.replace('Swapped ', '')}</span>${filled('task_alt', 'text-[18px] text-secondary')}</span></button>`
  const archiveDetail = (a) => {
    let h = agreedDetail(a)
    const when = a.p.ago.replace('Swapped ', '')
    const sub = (re, to) => { const n = h.replace(re, to); if (n === h) throw new Error('archive detail: pattern not found ' + re); h = n }
    sub(/<div data-chat-act class="shrink-0">[\s\S]*?<\/div>\n<details/, `<div data-chat-act class="shrink-0"><span class="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-mint text-forest font-label-md text-label-md whitespace-nowrap">${filled('task_alt', 'text-[18px]')}Swapped · ${when}</span></div>\n<details`)
    sub(/<p class="mt-1 flex items-center gap-3">[\s\S]*?<\/p><\/div>/, `<p class="mt-1 font-body-sm text-[12px] text-on-surface-variant">You both confirmed · ${when}</p></div>`)
    sub(/<a href="#" data-missing="Call it off[\s\S]*?<\/a>\n/, '')
    sub(/Both finds left the deck when you agreed\. If the swap is called off, they go straight back\./, `Swapped ${when}. Kept here so you can look back at what you swapped and what was said.`)
    sub(/<form data-composer[\s\S]*?<\/form>/, `<p data-closed class="shrink-0 flex items-center justify-center gap-2 px-4 pt-3 pb-[max(14px,env(safe-area-inset-bottom))] border-t border-surface-variant font-body-sm text-body-sm text-on-surface-variant">${icon('lock', 'text-[16px]')}This swap is done — the chat is closed.</p>`)
    return h
  }
  const group = (id, title, count, note, rows, open = true) => `<section data-group="${id}" class="flex flex-col">
<button type="button" data-fold aria-expanded="${open}" class="group sticky top-0 z-[1] flex items-center gap-2 px-3 h-11 bg-surface-container-lowest text-left">
<span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface">${title}</span><span class="font-ticker-number text-[12px] text-on-surface-variant">${count}</span>${note ? `<span class="font-body-sm text-body-sm text-outline truncate">· ${note}</span>` : ''}
${icon('expand_more', 'ml-auto text-[20px] text-on-surface-variant transition-transform group-aria-[expanded=false]:-rotate-90')}</button>
<div data-rows class="flex flex-col gap-0.5 pb-2" ${open ? '' : 'hidden'}>${rows.join('')}</div></section>`

  const turn = AGREED.filter((a) => a.who === 'them'), wait = AGREED.filter((a) => a.who === 'me'), none = AGREED.filter((a) => a.who === 'none')
  // Phone + tablet (Alex, 2026-09-28: "we have little space — be creative"):
  // offers become a swipeable strip of photo cards, soonest first.
  const offerStrip = `<section data-offer-strip class="pt-2 pb-3">
<div class="flex items-baseline gap-2 px-3 mb-2"><h2 class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface">Offers to you</h2><span class="font-ticker-number text-[12px] text-on-surface-variant">${OFFERS.length}</span><span class="ml-auto font-body-sm text-[12px] text-outline">swipe · soonest first</span></div>
<div class="v6-strip flex gap-3 overflow-x-auto snap-x snap-mandatory px-3 pb-1">${OFFERS.map((o) => `<button type="button" data-pick="${o.id}" aria-selected="false" class="snap-start shrink-0 w-[72%] max-w-[300px] relative aspect-[4/3] rounded-2xl overflow-hidden text-left">
<img alt="" class="absolute inset-0 w-full h-full object-cover" src="${o.theirs.src}">
<span class="absolute top-2.5 left-2.5">${pill(o)}</span>${o.super ? `<span class="absolute top-2.5 right-2.5 grid place-items-center w-7 h-7 rounded-full bg-sun text-ink">${filled('bolt', 'text-[16px]')}</span>` : ''}
<span class="absolute inset-x-0 bottom-0 p-3 pt-10 bg-gradient-to-t from-black/85 via-black/50 to-transparent text-white flex flex-col gap-1.5">
<span class="font-label-lg text-label-lg leading-tight line-clamp-1">${o.theirs.title}</span>
<span class="flex items-center gap-1.5 min-w-0 text-[12px]"><span class="truncate">${o.who.name} · for your</span><img alt="" class="w-6 h-6 rounded object-cover ring-1 ring-white/70 shrink-0" src="${o.yours.src}"></span></span></button>`).join('')}</div></section>`
  const list = `<nav aria-label="Offers and swaps" class="flex flex-col divide-y divide-surface-variant">
${group('offers', 'Offers to you', OFFERS.length, 'yes or no within 24h', OFFERS.map((o) => offerRow(o)))}
${group('turn', 'Your turn to confirm', turn.length, 'they already did', turn.map(agreedRow))}
${group('none', 'Agreed — not swapped yet', none.length, '', none.map(agreedRow))}
${group('wait', 'Waiting for them', wait.length, 'you confirmed', wait.map(agreedRow), false)}
${group('sent', 'Your offers', SENT.length, 'waiting for an answer', SENT.map((o) => offerRow(o, true)), false)}
${group('archive', 'Archive', ARCHIVE.length, 'swapped · chat closed', ARCHIVE.map(archiveRow), false)}
</nav>`

  const LOUD = 'h-11 px-5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-[0_6px_18px_rgba(27,107,85,0.28)] hover:bg-on-primary-fixed-variant inline-flex items-center gap-2'
  const QUIET = 'h-11 px-4 rounded-xl font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high inline-flex items-center gap-2'
  const findBlock = (label, tone, f, meta) => `<figure class="flex flex-col gap-2 min-w-0"><p class="font-label-sm text-label-sm uppercase tracking-wider ${tone}">${label}</p><img alt="" class="v6-pane-photo w-full aspect-[4/3] rounded-xl object-cover" src="${f.src}"><figcaption><p class="font-headline-sm text-headline-sm text-on-surface leading-tight">${f.title}</p>${meta ? `<p class="font-body-sm text-body-sm text-on-surface-variant">${meta}</p>` : ''}</figcaption></figure>`
  const offerDetail = (o, sent = false) => {
    const first = o.who.name.split(' ')[0]
    return `<article data-detail="${o.id}" hidden class="flex flex-col h-full">
<header data-offer-head class="flex items-center gap-3 px-6 py-5 border-b border-surface-variant"><button type="button" data-back aria-label="Back to the list" class="place-items-center w-10 h-10 -ml-2 rounded-full text-on-surface hover:bg-surface-container-high shrink-0">${icon('arrow_back', 'text-[22px]')}</button>${avatar(o.who, 'w-12 h-12', 'text-[15px]')}<div class="min-w-0 flex-1"><p data-offer-title class="font-headline-sm text-headline-sm text-on-surface">${sent ? `You offered ${first} a swap` : `${o.who.name} offers you a swap`}${o.super ? `<span title="Super offer" aria-label="Super offer" class="ml-1.5 inline-grid place-items-center w-6 h-6 rounded-full bg-sun align-[-3px]">${filled('bolt', 'text-[15px] text-ink')}</span>` : ''}</p><p class="font-body-sm text-body-sm text-on-surface-variant">${o.who.swaps} swaps · ${o.who.km} away<span data-desk-link> · <button type="button" data-person="${o.who.name}" class="text-primary hover:underline">About ${first}</button></span></p></div>
${sent ? `<span class="font-label-md text-label-md text-on-surface-variant">Ends in ${o.left}</span>` : `<span class="flex flex-col items-end gap-1">${pill(o)}<span data-expires-note class="font-body-sm text-[12px] text-outline">then it expires</span></span>`}</header>
<div class="flex-1 min-h-0 overflow-y-auto px-6 py-6 flex flex-col gap-6">
<div data-wide-only class="grid grid-cols-2 gap-6">${findBlock('You give', 'text-primary', o.yours, 'Your find')}${findBlock('You get', 'text-secondary', o.theirs, o.theirs.meta)}</div>
<div data-compact-only class="flex-col gap-3">
<figure class="relative"><img alt="" class="w-full aspect-[4/3] rounded-2xl object-cover" src="${o.theirs.src}"><span class="absolute top-3 left-3 px-2.5 h-7 inline-flex items-center rounded-full bg-white/90 font-label-sm text-label-sm uppercase tracking-wider text-secondary">You get</span></figure>
<div><p class="font-headline-sm text-headline-sm text-on-surface leading-tight">${o.theirs.title}</p><p class="font-body-sm text-body-sm text-on-surface-variant">${o.theirs.meta}</p></div>
<div class="flex items-center gap-3 rounded-xl bg-surface-container-low p-2 pr-3"><img alt="" class="w-14 h-14 rounded-lg object-cover" src="${o.yours.src}"><div class="min-w-0 flex-1"><p class="font-label-sm text-label-sm uppercase tracking-wider text-primary">You give</p><p class="font-label-lg text-label-lg text-on-surface truncate">${o.yours.title}</p></div>${icon('sync_alt', 'text-[20px] text-on-surface-variant')}</div>
</div>
${o.note ? `<blockquote class="flex gap-3 rounded-xl bg-surface-container-low px-4 py-3">${icon('chat_bubble', 'text-[20px] text-on-surface-variant')}<div><p class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">${first} says</p><p class="font-body-md text-body-md text-on-surface">“${o.note}”</p></div></blockquote>` : ''}
</div>
<footer data-offer-foot class="flex items-center gap-3 px-6 py-4 border-t border-surface-variant">
${sent
  ? `<p class="flex-1 font-body-sm text-body-sm text-on-surface-variant">Waiting for ${first}. If there is no answer in ${o.left}, the offer expires and your find is free again.</p>`
  : `<p data-foot-note class="flex-1 font-body-sm text-body-sm text-on-surface-variant">Accepting takes both finds off the deck and opens a chat with ${first}.</p><button type="button" data-missing="Declined — ${first} is told kindly, no reason needed" class="${QUIET}">Decline</button><button type="button" data-missing="Accepted — it moves to Agreed and the chat with ${first} opens" class="${LOUD}">${icon('handshake', 'text-[20px]')}Accept swap</button>`}
</footer></article>`
  }
  const bubble = ([k, t]) => k === 'sys'
    ? `<p class="self-center my-1 px-3 py-1 rounded-full bg-surface-container-low font-body-sm text-[12px] text-on-surface-variant">${t}</p>`
    : k === 'them-voice'
      ? `<div class="self-start flex items-center gap-2.5 max-w-[70%] px-3 py-2 rounded-xl rounded-tl-none bg-stone text-ink"><button type="button" data-missing="Voice notes play here (live in today’s app)" class="grid place-items-center w-8 h-8 rounded-full bg-primary text-on-primary">${filled('play_arrow', 'text-[20px]')}</button><span class="flex items-center gap-[3px]" aria-hidden="true">${[6, 12, 18, 10, 16, 22, 14, 8, 18, 12, 20, 9, 14, 6, 11].map((h) => `<span class="w-[3px] rounded-full bg-ink/50" style="height:${h}px"></span>`).join('')}</span><span class="font-ticker-number text-[12px]">${t}</span></div>`
      : `<p class="${k === 'me' ? 'self-end bg-primary text-on-primary rounded-tr-none' : 'self-start bg-stone text-ink rounded-tl-none'} max-w-[70%] px-3.5 py-2 rounded-xl font-body-md text-body-md">${t}</p>`
  const agreedDetail = (a) => {
    const i = AGREED.indexOf(a), f = a.p.first
    const meOk = a.who === 'me', themOk = a.who === 'them'
    const tick = (name, ok) => `<span class="inline-flex items-center gap-1 font-body-sm text-[12px] ${ok ? 'text-secondary' : 'text-on-surface-variant'}">${ok ? filled('check_circle', 'text-[14px]') : icon('radio_button_unchecked', 'text-[14px]')}${name}</span>`
    const confirmAttrs = `data-open="confirm" data-first="${f}" data-get="${a.p.get.title}" data-src="${a.p.get.src}"`
    const act = meOk
      ? `<span data-waiting class="font-label-md text-label-md text-on-surface-variant whitespace-nowrap">Waiting for ${f}</span>`
      : `<button type="button" ${confirmAttrs} class="h-10 px-4 w-full justify-center rounded-xl bg-primary text-on-primary font-label-lg text-label-lg whitespace-nowrap inline-flex items-center gap-1.5 hover:bg-on-primary-fixed-variant">${icon('task_alt', 'text-[18px]')}${themOk ? `Confirm — I have the ${a.p.get.short}` : 'We swapped'}</button>`
    const big = (label, tone, x) => `<figure class="flex flex-col gap-1.5 min-w-0"><p class="font-label-sm text-label-sm uppercase tracking-wider ${tone}">${label}</p><img alt="" class="v6-chat-photo w-full aspect-[4/3] rounded-xl object-cover" src="${x.src}"><figcaption class="font-label-lg text-label-lg text-on-surface">${x.title}</figcaption></figure>`
    return `<article data-detail="${a.id}" hidden class="h-full flex flex-col">
<header data-chat-head class="shrink-0 flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 border-b border-surface-variant">
<button type="button" data-back aria-label="Back to the list" class="place-items-center w-10 h-10 -ml-2 rounded-full text-on-surface hover:bg-surface-container-high shrink-0">${icon('arrow_back', 'text-[22px]')}</button>
<button type="button" data-swap-toggle aria-expanded="false" title="See the swap" class="group relative flex items-center shrink-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/50"><img alt="" class="w-11 h-11 rounded-lg object-cover" src="${a.p.give.src}">${icon('sync_alt', 'mx-1 text-[16px] text-on-surface-variant')}<img alt="" class="w-11 h-11 rounded-lg object-cover" src="${a.p.get.src}"><span class="absolute -bottom-1 -right-1 grid place-items-center w-5 h-5 rounded-full bg-surface-container-lowest ring-1 ring-outline-variant text-on-surface-variant">${icon('expand_more', 'text-[16px] transition-transform group-aria-expanded:rotate-180')}</span></button>
<div class="min-w-0 flex-1"><p class="flex items-center gap-2 min-w-0"><img alt="" class="w-6 h-6 rounded-full object-cover" src="${a.p.avatar}"><span class="font-label-lg text-label-lg text-on-surface whitespace-nowrap shrink-0">${a.p.name}</span><span class="v6-chat-desc min-w-0 font-body-sm text-[12px] text-outline truncate">· your ${a.p.give.title} for their ${a.p.get.title}</span></p>
<p class="mt-1 flex items-center gap-3">${tick('You', meOk)}${tick(f, themOk)}</p></div>
<div data-chat-act class="shrink-0">${act}</div>
<details class="relative shrink-0"><summary aria-label="More" class="list-none grid place-items-center w-10 h-10 rounded-lg text-on-surface-variant hover:bg-surface-container-high cursor-pointer">${icon('more_vert', 'text-[20px]')}</summary>
<div class="absolute right-0 top-full mt-1 z-10 w-56 py-1 rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/50 shadow-[0_16px_40px_rgba(31,27,24,0.18)]">
<button type="button" data-person="${a.p.name}" class="w-full text-left flex items-center gap-3 px-3 h-10 text-[14px] hover:bg-surface-container-low">${icon('person', 'text-[18px] text-on-surface-variant')}About ${f}</button>
<a href="#" data-missing="Call it off opens the trouble sheet (reasons, then both finds go back in the deck) — no V6 design yet" class="flex items-center gap-3 px-3 h-10 text-[14px] hover:bg-surface-container-low">${icon('block', 'text-[18px] text-on-surface-variant')}Call it off</a>
<a href="#" data-missing="Report opens the report sheet (no V6 design yet)" class="flex items-center gap-3 px-3 h-10 text-[14px] hover:bg-surface-container-low">${icon('flag', 'text-[18px] text-on-surface-variant')}Report ${f}</a>
</div></details>
</header>
<div data-swap-photos hidden class="shrink-0 px-4 py-4 border-b border-surface-variant bg-surface-container-low/40"><div class="grid grid-cols-2 gap-4">${big('You give', 'text-primary', a.p.give)}${big('You get', 'text-secondary', a.p.get)}</div><p class="mt-3 flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant">${icon('info', 'text-[18px]')}Both finds left the deck when you agreed. If the swap is called off, they go straight back.</p></div>
<div data-thread class="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-2">${threadFor(a, i).map(bubble).join('')}${a.stale ? `<p class="self-center mt-2 max-w-md text-center font-body-sm text-body-sm text-on-surface-variant">No messages for 12 days. Send ${f} a note — or call it off from ⋮, and both finds go back in the deck.</p>` : ''}</div>
<form data-composer class="shrink-0 flex items-center gap-2 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] border-t border-surface-variant">
<button type="button" data-missing="Add a photo to the chat (live in today’s app)" aria-label="Add a photo" class="grid place-items-center w-10 h-10 rounded-lg text-on-surface-variant hover:bg-surface-container-high">${icon('add_photo_alternate', 'text-[22px]')}</button>
<input data-msg type="text" autocomplete="off" placeholder="Message ${f}…" class="flex-1 min-w-0 h-11 px-4 rounded-full bg-surface-container-low border-0 font-body-md text-body-md focus:ring-2 focus:ring-primary/40 outline-none">
<button type="button" data-missing="Hold to record a voice note, let go to send (live in today’s app)" aria-label="Voice note" class="grid place-items-center w-10 h-10 rounded-lg text-on-surface-variant hover:bg-surface-container-high">${icon('mic', 'text-[22px]')}</button>
<button type="submit" aria-label="Send" class="grid place-items-center w-11 h-11 rounded-full bg-primary text-on-primary hover:bg-on-primary-fixed-variant">${filled('send', 'text-[20px]')}</button>
</form></article>`
  }

  const body = `<!-- Active Swaps at volume, B (build-revisions.mjs): one screen, list + detail -->
<style>[data-swaps] [hidden]{display:none!important}
/* Photos take the room the window gives them, never pushing the actions off screen. */
[data-swaps] .v6-pane-photo{max-height:max(180px,calc(100dvh - 520px))}
[data-swaps] .v6-chat-photo{max-height:max(140px,calc(50dvh - 200px))}
[data-swaps] details>summary::-webkit-details-marker{display:none}
.v6-strip{scrollbar-width:none}.v6-strip::-webkit-scrollbar{display:none}
[data-offer-strip],[data-compact-only],[data-back]{display:none}
/* Below 1024 (phone, tablet): the list is the page; the one you tap opens
   full screen over everything, with a back arrow. */
@media (max-width:1023.98px){
  [data-swaps]{display:block;padding:0}
  [data-list-aside]{border-radius:0;box-shadow:none;overflow:visible;min-height:calc(100dvh - 80px)}
  [data-list-scroll]{overflow:visible;padding:4px 4px 16px}
  [data-offer-strip]{display:block}
  [data-compact-only]{display:flex}
  [data-group="offers"]{display:none}
  [data-fold]{top:80px}
  [data-back]{display:grid}
  [data-wide-only],[data-foot-note]{display:none!important}
  [data-detail-pane]{position:fixed;inset:0;z-index:60;border-radius:0;display:none}
  html.swaps-open [data-detail-pane]{display:block}
  html.swaps-open{overflow:hidden}
  [data-offer-head]{padding:12px 16px}
  [data-offer-foot]{padding:12px 16px max(12px,env(safe-area-inset-bottom))}
  [data-offer-foot]>button{flex:1;justify-content:center}
  [data-thread]>*{max-width:84%!important}
  [data-thread]{padding:12px}
  [data-detail]>.overflow-y-auto{padding:16px}
}
@media (min-width:768px){[data-phone-title]{display:none!important}}
@media (max-width:767.98px){
  [data-swaps]{margin-top:-24px}
  [data-fold]{top:56px}
  [data-offer-title]{font-size:16px;line-height:22px}
  [data-desk-link],[data-expires-note]{display:none}
  [data-list-aside]{min-height:calc(100dvh - 56px - 64px)}
  [data-chat-act]{order:9;width:100%}
  [data-chat-head] [data-swap-toggle] img{width:36px;height:36px}
  [data-chat-head] .v6-chat-desc{display:none}
  [data-confirm-dialog]{place-items:end center;padding:0}
  [data-confirm-dialog]>div{width:100%;border-radius:20px 20px 0 0;padding-bottom:max(24px,env(safe-area-inset-bottom))}
}</style>
<div data-swaps class="px-margin md:px-gutter-desktop pt-6 pb-6 flex flex-col lg:flex-row gap-6 lg:h-[calc(100dvh-80px)]">
<aside data-list-aside class="lg:w-[clamp(340px,28vw,480px)] lg:shrink-0 min-h-0 flex flex-col rounded-xl bg-surface-container-lowest ring-1 ring-surface-variant/70 overflow-hidden">
<div data-compact-only data-phone-title class="items-baseline gap-2 px-3 pt-3"><h1 class="font-headline-md text-headline-md text-on-surface">Swaps &amp; offers</h1><span class="font-body-sm text-body-sm text-on-surface-variant">14 agreed</span></div>
<div data-list-scroll class="flex-1 min-h-0 overflow-y-auto p-2">${offerStrip}${list}</div></aside>
<section data-detail-pane aria-live="polite" class="flex-1 min-w-0 min-h-0 rounded-xl bg-surface-container-lowest ring-1 ring-surface-variant/70 overflow-hidden">
${OFFERS.map((o) => offerDetail(o)).join('\n')}
${SENT.map((o) => offerDetail(o, true)).join('\n')}
${AGREED.map(agreedDetail).join('\n')}
${ARCHIVE.map(archiveDetail).join('\n')}
</section>
<div data-confirm-dialog hidden class="fixed inset-0 z-[60] bg-inverse-surface/40 grid place-items-center p-4">
<div role="dialog" aria-modal="true" class="w-[420px] max-w-full rounded-2xl bg-surface-container-lowest shadow-[0_24px_60px_rgba(31,27,24,0.3)] p-6">
<div class="flex items-center gap-3"><img data-c-img alt="" class="w-14 h-14 rounded-lg object-cover"><div><p class="font-headline-sm text-headline-sm text-on-surface">Do you have the <span data-c-get></span>?</p><p class="font-body-sm text-body-sm text-on-surface-variant">From <span data-c-first></span>.</p></div></div>
<p class="mt-4 font-body-md text-body-md text-on-surface">Confirm only once the swap has really happened. When you both have:</p>
<ul class="mt-2 flex flex-col gap-1.5 font-body-sm text-body-sm text-on-surface-variant">
<li class="flex gap-2">${icon('chat_bubble', 'text-[18px]')}The chat closes and becomes read-only.</li>
<li class="flex gap-2">${icon('inventory_2', 'text-[18px]')}Both finds leave Bartefy for good.</li>
<li class="flex gap-2">${icon('toll', 'text-[18px] text-tertiary')}You each get +160 pts.</li></ul>
<p class="mt-3 font-body-sm text-body-sm text-on-surface-variant">You can’t take this back.</p>
<div class="mt-5 flex gap-2 justify-end"><button type="button" data-c-close class="h-11 px-4 rounded-xl font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high">Not yet</button><button type="button" data-c-close data-missing="Confirmed — it moves to Waiting for them until they confirm too" class="h-11 px-5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-[0_6px_18px_rgba(27,107,85,0.28)]">Yes, we swapped</button></div>
</div></div></div>
<script>
(() => {
  const compact = () => matchMedia('(max-width:1023.98px)').matches
  const close = () => document.documentElement.classList.remove('swaps-open')
  const pick = (id, open = true) => {
    if (open && compact()) document.documentElement.classList.add('swaps-open')
    document.querySelectorAll('[data-pick]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.pick === id)))
    document.querySelectorAll('[data-detail]').forEach((d) => (d.hidden = d.dataset.detail !== id))
    const d = document.querySelector('[data-detail="' + id + '"]'), t = d && d.querySelector('[data-thread]')
    if (t) t.scrollTop = t.scrollHeight
    const row = document.querySelector('[data-pick="' + id + '"]'), u = row && row.querySelector('[data-unread]')
    if (u) { u.remove(); row.querySelector('[data-last]').classList.replace('text-on-surface', 'text-on-surface-variant'); row.querySelector('[data-last]').classList.remove('font-semibold') }
    try { history.replaceState(null, '', '#' + id) } catch (e) {}
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-back]')) return close()
    const r = e.target.closest('[data-pick]'); if (r) return pick(r.dataset.pick)
    const sw = e.target.closest('[data-swap-toggle]')
    if (sw) { const open = sw.getAttribute('aria-expanded') !== 'true'; sw.setAttribute('aria-expanded', String(open)); sw.closest('article').querySelector('[data-swap-photos]').hidden = !open; return }
    const f = e.target.closest('[data-fold]'); if (!f) return
    const open = f.getAttribute('aria-expanded') !== 'true'
    f.setAttribute('aria-expanded', String(open)); f.nextElementSibling.hidden = !open
  })
  // Sending appends your bubble and becomes the row's last line.
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-composer]'); if (!form) return
    e.preventDefault()
    const input = form.querySelector('[data-msg]'), text = input.value.trim(); if (!text) return
    const art = form.closest('[data-detail]'), t = art.querySelector('[data-thread]')
    const b = document.createElement('p'); b.className = 'self-end bg-primary text-on-primary rounded-tr-none max-w-[70%] px-3.5 py-2 rounded-xl font-body-md text-body-md'; b.textContent = text
    t.appendChild(b); t.scrollTop = t.scrollHeight; input.value = ''
    const last = document.querySelector('[data-pick="' + art.dataset.detail + '"] [data-last]'); if (last) last.textContent = 'You: ' + text
  })
  // ↑ ↓ walk the visible rows (not while typing).
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea')) return
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    const rows = [...document.querySelectorAll('[data-pick]')].filter((b) => b.offsetParent)
    const i = rows.findIndex((b) => b.getAttribute('aria-selected') === 'true')
    const n = rows[Math.max(0, Math.min(rows.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))]
    if (n) { e.preventDefault(); pick(n.dataset.pick); n.scrollIntoView({ block: 'nearest' }) }
  })
  // "We swapped — confirm" → the R1 dialog, for whichever swap it is.
  const dlg = document.querySelector('[data-confirm-dialog]')
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-open="confirm"]')
    if (b) {
      dlg.querySelector('[data-c-img]').src = b.dataset.src
      dlg.querySelectorAll('[data-c-get]').forEach((x) => (x.textContent = b.dataset.get))
      dlg.querySelectorAll('[data-c-first]').forEach((x) => (x.textContent = b.dataset.first))
      dlg.hidden = false; return
    }
    if (e.target.closest('[data-c-close]') || e.target === dlg) dlg.hidden = true
  })
  document.addEventListener('keydown', (e) => { if (e.key !== 'Escape') return; if (!dlg.hidden) dlg.hidden = true; else close() })
  // #a1 opens that one; #a1+photos / #a1+confirm for the review frames.
  const [start, flag] = location.hash.slice(1).split('+')
  const known = !!document.querySelector('[data-pick="' + start + '"]')
  pick(known ? start : 'o1', known)
  const cur = document.querySelector('[data-detail="' + (known ? start : 'o1') + '"]')
  if (flag === 'photos') cur.querySelector('[data-swap-toggle]').click()
  if (flag === 'confirm') cur.querySelector('[data-open="confirm"]').click()
})()
</script>
`
  let s = src04.replace('<title>', '<title>AT VOLUME (B) · ')
  const a = s.indexOf('<!-- Ambient Top Texture Accent -->'), b = s.indexOf('</main>', a)
  if (a < 0 || b < 0) throw new Error('volume B: content markers not found')
  s = s.slice(0, a) + body + s.slice(b)
  // The bar names the page, like Discover.
  const h = s.indexOf('<header data-organism="topbar" data-variant="desktop"'), he = s.indexOf('</header>', h)
  if (h < 0 || he < 0) throw new Error('volume B: desktop top bar not found')
  const keep = LINK_BASE; LINK_BASE = ''
  s = s.slice(0, h) + topbar({ fixed: true, cls: 'max-md:hidden', tier: 'collector', context: `<h1 class="font-headline-md text-headline-md text-on-surface shrink-0">Swaps &amp; offers</h1><span class="font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap">6 offers · 14 agreed</span>` }) + s.slice(he + '</header>'.length)
  LINK_BASE = keep
  write('stitch/04-active-swaps-volume-b.html', s)
}

/* ── Phone sheet: the real page in 390 × 844 frames, one per screen ── */
{
  const frame = (hash, w = 390, h = 844, scale = 1) => `<div class="rounded-[28px] overflow-hidden ring-1 ring-outline-variant bg-background shadow-md" style="width:${Math.round(w * scale)}px;height:${Math.round(h * scale)}px"><iframe src="../04-active-swaps-volume-b.html${hash}" width="${w}" height="${h}" class="border-0 block" style="transform:scale(${scale});transform-origin:0 0" title="Swaps ${hash || 'list'}"></iframe></div>`
  write(
    'stitch/organisms/swaps-phone-r1.html',
    `<!DOCTYPE html><html lang="en">
<!-- Swaps on the phone — generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-surface-container-low font-body-md text-on-surface antialiased p-10">
<h1 class="font-headline-lg text-headline-lg mb-2">Swaps &amp; offers — phone</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-2 max-w-3xl">The list is the page. Offers are a swipeable strip of photo cards (soonest first); agreed swaps are chat rows below. Tap anything and it opens full screen, over the tab bar, with a back arrow. Same data as the desktop page: 6 offers, 14 agreed.</p>
<p class="font-body-md text-body-md text-on-surface-variant mb-8 max-w-3xl"><b>Every frame is the real page</b> — swipe the strip, tap rows, go back, type in a chat. Tablet (768–1023) works the same way.</p>
<div class="flex flex-wrap items-start gap-10">
${state('list', '1 · The list', 'Top bar, title, the offer strip, then chat rows grouped by what they wait on. Tab bar below.', 390, frame(''))}
${state('offer', '2 · An offer', 'Their find big (what you are deciding on); yours as one row under it. Decline · Accept pinned to the bottom.', 390, frame('#o1'))}
${state('super', '2b · A Super offer', 'The Super line on top; otherwise the same.', 390, frame('#o3'))}
${state('chat', '3 · A chat — your turn to confirm', 'Two-line swap strip: back · pair · name · ticks · ⋮, then the confirm button full width. Messages, then the composer.', 390, frame('#a1'))}
${state('photos', '3b · Tap the pair — the photos open', 'Both finds big above the chat; tap again to fold.', 390, frame('#a1+photos'))}
${state('confirm', '3c · Confirm — a bottom sheet', 'The same dialog as desktop, as a sheet from the bottom.', 390, frame('#a1+confirm'))}
${state('waiting', '3d · You confirmed — waiting', 'No button, one line: waiting for them.', 390, frame('#a3'))}
${state('stale', '3e · No news for 12 days', 'The nudge sits in the thread.', 390, frame('#a14'))}
</div>
</body></html>`,
  )
}
}

/* ───────────────────────────── My finds, proposal B ─────────────────────────────
 * Alex, 2026-09-28: "don't you think 'My finds' and 'Inventory' are the same?"
 * — yes: the page and the side nav are now just "My finds". Then: "let's see
 * how you can manage this page", after Swaps & offers (list + detail, one
 * screen, photos get the room) — so the same pattern, with photos first:
 *
 *   left   a photo grid of your finds; tabs On the table · Paused (Saved cut
 *          2026-09-29 — Bartefy has no saving);
 *          a one-line "Needs you" that jumps to what needs you; category
 *          chips only past 12 finds (the composer's rule). No buttons on cards.
 *   right  the find you picked: big photo, its clock (30 days, Renew), the
 *          offers on it (→ Swaps), its swap (→ the chat), what you want back,
 *          how many are eyeing it (→ Eyeing), and ONE loud action for its state.
 *   top    "My finds" + the capacity chip (6 of 6) — the header card is gone.
 *
 * Two files, same code: Hunter at 6 of 6, and Collector with 50 finds.
 * Everything checked against the app: renew_item (+30 days from now),
 * pause (status 'paused'), Boost 75 pts / 1 day, Hunter 6 live, saves.
 * Cut from Stitch: valuations, #ref codes, Counter-offer, "sweetening"
 * points, Auto-Renew, Trust Score, velocity stats. */
{
const face = (alt) => { for (const h of [S1, S2, S4, S5]) if (h.includes(`data-alt="${alt}`)) return imgByAlt(h, alt); throw new Error(alt) }
const P = { marcus: face('Close up portrait photo of Marcus Vance'), julian: face('Portrait of Julian Ross'), elena: face('Portait of Elena Rostova'), sara: face('Authentic candid portrait of Sara M.'), samira: SAMIRA }
const CONDS = ['Like new', 'Good', 'Well loved', 'Good', 'Like new', 'Needs work']
const WANTS_BY_CAT = { audio: 'A turntable or a film camera', cameras: 'Audio gear — a receiver or headphones', clothing: 'Outdoor gear or a good leather bag', home: 'Plants, pottery or a reading lamp', writing: 'Notebooks, a desk lamp or ink', outdoors: 'Camping gear or a bike rack' }
const mk = (f, i, extra = {}) => ({ ...f, cond: CONDS[i % CONDS.length], wants: WANTS_BY_CAT[f.cat], days: 30 - ((i * 7) % 27), saves: (i * 5) % 17, offers: [], state: 'live', ...extra })
const off = (name, face, title, src, left, h, sup) => ({ name, face, title, src, left, h, super: sup })

const HUNTER = [
  mk(byTitle('Marantz 2215B Receiver'), 0, { days: 22, saves: 8, offers: [off('Marcus V.', P.marcus, 'Fender Vibro-Champ Amp', PH.fender, '3h 44m', 3.7), off('Liam V.', null, 'Levi’s Type III Denim Jacket', PH.levis, '21h 10m', 21)], o: 'o1' }),
  mk(byTitle('Fuji X100 Leather Half-Case'), 1, { days: 3, saves: 5, offers: [off('Julian R.', P.julian, 'Olympus OM-1 35mm SLR', OLYMPUS, '14h 05m', 14, true)], o: 'o3' }),
  mk(byTitle('Lamy 2000 Fountain Pen'), 2, { days: 28, saves: 14, boost: '18h left' }),
  mk(byTitle('Wool Camp Blanket'), 3, { state: 'swap', swap: { name: 'Ines G.', ago: '3 days ago', mine: true, id: 'a4', get: 'Pendleton Board Shirt' }, days: 19, saves: 6 }),
  mk(byTitle('Braun AB1 Travel Clock'), 4, { days: 29, saves: 5, fresh: true }),
  mk(byTitle('Ceramic Pour-Over Set'), 5, { days: 15, saves: 9, offers: [off('Sora K.', null, 'Mid-Century Teak Planter', PH.planter, '23h 40m', 23.7)], o: 'o6' }),
  mk(byTitle('Canon AE-1 Body'), 6, { state: 'paused', saves: 3 }),
  mk(byTitle('Polaroid SX-70'), 7, { state: 'paused', saves: 11 }),
]
// Collector: all 50 of Maya's finds. The Hunter six keep their story; the
// rest get a spread of states so the grid shows what 50 really looks like.
const COLLECTOR = FINDS.map((f, i) => {
  const h = HUNTER.find((x) => x.id === f.id)
  if (h) return h.state === 'paused' ? { ...h, state: 'live', days: 12 } : h
  if (i % 13 === 5) return mk(f, i, { state: 'paused' })
  if (i % 9 === 4) return mk(f, i, { state: 'swap', swap: { name: ['Noah B.', 'Aiko H.', 'Priya S.', 'Ben O.', 'Lena W.'][i % 5], ago: `${1 + (i % 6)} days ago`, id: 'a' + (6 + (i % 8)), get: 'a find of theirs' } })
  const x = mk(f, i)
  if (i % 17 === 8) x.days = 2
  if (i % 6 === 2) x.offers = [off('Ben O.', null, 'Barbour Waxed Jacket', PH.levis, `${8 + (i % 14)}h 10m`, 8 + (i % 14))]
  return x
})

const pillTone = (h) => (h < 6 ? 'bg-coral text-ink' : h < 12 ? 'bg-sun text-ink' : 'bg-surface-container-high text-on-surface-variant')
const initials = (n) => n.split(' ').map((w) => w[0]).join('').replace('.', '')
const faceOr = (name, src, size = 'w-9 h-9') => src ? `<img alt="" class="${size} rounded-full object-cover shrink-0" src="${src}">` : `<span class="${size} rounded-full grid place-items-center shrink-0 ${['bg-sky', 'bg-lilac', 'bg-mint', 'bg-sun'][name.length % 4]} text-ink text-[12px] font-bold">${initials(name)}</span>`
const badge = (cls, ic, text) => `<span class="inline-flex items-center gap-1 h-6 px-2 rounded-full ${cls} text-[12px] font-bold leading-none shadow-sm">${ic ? icon(ic, 'text-[14px]') : ''}${text}</span>`

// One badge per photo, the most urgent: expiring > offers > swap > boost > new.
function cardBadge(f) {
  if (f.state === 'paused') return badge('bg-white/90 text-on-surface-variant', 'pause', 'Paused')
  if (f.state === 'swap') return badge('bg-mint text-forest', 'handshake', 'In a swap')
  if (f.days <= 3) return badge('bg-sun text-ink', 'schedule', `${f.days} days left`)
  if (f.offers.length) return badge('bg-coral text-ink', null, `${f.offers.length} offer${f.offers.length > 1 ? 's' : ''}`)
  if (f.boost) return badge('bg-sun text-ink', 'bolt', 'Boosted')
  if (f.fresh) return badge('bg-white/90 text-on-surface', null, 'New')
  return ''
}
const cardMeta = (f) => f.state === 'paused' ? 'Paused · not in any deck' : f.state === 'swap' ? `With ${f.swap.name} · off the deck` : `${f.days} days left`
const card = (f) => `<button type="button" data-pick="${f.id}" data-cat="${f.cat}" aria-selected="false" class="group text-left min-w-0 rounded-xl p-1.5 -m-1.5 transition-colors hover:bg-surface-container-low aria-selected:bg-primary-container">
<span class="relative block aspect-[4/3] rounded-lg overflow-hidden bg-surface-container"><img alt="" loading="lazy" class="w-full h-full object-cover ${f.state === 'paused' ? 'grayscale opacity-70' : ''}" src="${f.src}"><span class="absolute top-2 left-2">${cardBadge(f)}</span></span>
<span class="block mt-2 px-0.5 font-label-lg text-label-lg text-on-surface truncate">${f.title}</span>
<span class="block px-0.5 font-body-sm text-[12px] leading-4 ${f.days <= 3 && f.state === 'live' ? 'text-on-surface' : 'text-on-surface-variant'} truncate">${cardMeta(f)}</span></button>`
const LOUD = 'whitespace-nowrap h-11 px-5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-[0_6px_18px_rgba(27,107,85,0.28)] hover:bg-on-primary-fixed-variant inline-flex items-center justify-center gap-2'
const QUIET = 'h-11 px-3.5 rounded-xl font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high inline-flex items-center justify-center gap-1.5'
const SUNNY = 'h-11 px-3.5 rounded-xl bg-sun/60 text-ink font-label-lg text-label-lg hover:bg-sun inline-flex items-center justify-center gap-1.5'
const BACK = `<button type="button" data-back aria-label="Back to my finds" class="place-items-center w-10 h-10 -ml-2 rounded-full text-on-surface hover:bg-surface-container-high shrink-0">${icon('arrow_back', 'text-[22px]')}</button>`
const section = (label, body) => `<section class="flex flex-col gap-2"><p class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">${label}</p>${body}</section>`

function findDetail(f, { full }) {
  const live = f.state === 'live', urgent = live && f.days <= 3
  const clock = live
    ? `<div class="rounded-xl ${urgent ? 'bg-sun/35' : 'bg-surface-container-low'} px-4 py-3"><div class="flex items-center justify-between gap-3"><p class="font-label-lg text-label-lg text-on-surface">${urgent ? `Leaves the deck in ${f.days} days` : `In the deck · ${f.days} days left`}</p>${urgent ? '' : `<button type="button" data-missing="Renewed — 30 more days from today" class="font-label-md text-label-md text-primary hover:underline">Renew now</button>`}</div><div class="mt-2 h-1.5 rounded-full bg-surface-variant overflow-hidden"><div class="h-full rounded-full ${urgent ? 'bg-ink/70' : 'bg-primary'}" style="width:${Math.round((f.days / 30) * 100)}%"></div></div><p class="mt-1.5 font-body-sm text-[12px] text-on-surface-variant">Every find stays 30 days. Renewing is free and starts a new 30 from today.</p></div>`
    : f.state === 'paused'
      ? `<div class="rounded-xl bg-surface-container-low px-4 py-3"><p class="font-label-lg text-label-lg text-on-surface">Paused — nobody sees it</p><p class="font-body-sm text-body-sm text-on-surface-variant">${full ? 'Your table is full (6 of 6). Pause another find to make room, or go Collector for no limit.' : 'Put it back and it joins the deck for a fresh 30 days.'}</p></div>`
      : `<div class="rounded-xl bg-mint/60 px-4 py-3 flex items-center gap-3">${icon('handshake', 'text-[22px] text-forest')}<div class="min-w-0 flex-1"><p class="font-label-lg text-label-lg text-forest">In a swap with ${f.swap.name}</p><p class="font-body-sm text-body-sm text-forest/80">Agreed ${f.swap.ago} · off the deck until it’s done or called off.</p></div><a href="04-active-swaps-volume-b.html#${f.swap.id}" class="shrink-0 font-label-md text-label-md text-forest underline">Open chat</a></div>`
  const offers = f.offers.length ? section(`${f.offers.length} offer${f.offers.length > 1 ? 's' : ''} for it`, `<div class="flex flex-col rounded-xl ring-1 ring-surface-variant divide-y divide-surface-variant">${f.offers.map((o) => `<a href="04-active-swaps-volume-b.html#${f.o || 'o1'}" class="flex items-center gap-3 px-3 py-2.5 hover:bg-surface-container-low"><img alt="" class="w-11 h-11 rounded-lg object-cover" src="${o.src}"><span class="min-w-0 flex-1"><span class="block font-label-lg text-label-lg text-on-surface truncate">${o.title}${o.super ? ` ${filled('bolt', 'text-[14px]')}` : ''}</span><span class="block font-body-sm text-[12px] text-on-surface-variant">from ${o.name}</span></span><span class="inline-flex items-center gap-1 h-6 px-2 rounded-full ${pillTone(o.h)} font-ticker-number text-[12px]">${icon('schedule', 'text-[14px]')}${o.left}</span></a>`).join('')}</div>`) : ''
  // No saving in Bartefy (Alex, 2026-09-29). The count is now the hidden
  // Put-on-Tables on this find — who they are is the Eyeing page (Collector).
  const saves = f.saves && f.state !== 'paused' ? `<p class="flex items-center gap-2 font-body-sm text-body-sm text-on-surface-variant">${icon('visibility', 'text-[18px]')}<span><b class="text-on-surface">${f.saves} admirers</b> want it.</span><a href="20-admirers-b.html" class="ml-auto inline-flex items-center gap-1 text-primary font-label-md text-label-md hover:underline">${icon('lock', 'text-[14px]')}See who</a></p>` : ''
  // One loud action, chosen by state.
  const main = f.state === 'paused'
    ? (full ? `<button type="button" data-missing="Your table is full — pause another find first" class="${LOUD} opacity-50 cursor-not-allowed">${icon('play_arrow', 'text-[20px]')}Put it back</button>` : `<button type="button" data-missing="Back on the table — 30 days from today" class="${LOUD}">${icon('play_arrow', 'text-[20px]')}Put it back</button>`)
    : f.state === 'swap' ? `<a href="04-active-swaps-volume-b.html#${f.swap.id}" class="${LOUD}">${icon('chat', 'text-[20px]')}Open chat</a>`
    : urgent ? `<button type="button" data-missing="Renewed — 30 more days from today" class="${LOUD}">${icon('autorenew', 'text-[20px]')}Renew · 30 days</button>`
    : f.offers.length ? `<a href="04-active-swaps-volume-b.html#${f.o || 'o1'}" class="${LOUD}">${icon('handshake', 'text-[20px]')}Review offer${f.offers.length > 1 ? 's' : ''}</a>`
    : f.boost ? `<span class="${SUNNY} cursor-default">${filled('bolt', 'text-[18px]')}Boosted · ${f.boost}</span>`
    : `<button type="button" data-missing="Boosted — first in nearby decks for a day · 75 pts" class="${SUNNY}">${filled('bolt', 'text-[18px]')}Boost · 75 pts</button>`
  const pause = f.state === 'live' ? `<button type="button" data-missing="Paused — it leaves the deck and frees a slot" class="${QUIET}">${icon('pause', 'text-[18px]')}<span data-lbl>Pause</span></button>` : ''
  return `<article data-detail="${f.id}" hidden class="h-full flex flex-col">
<header data-find-head class="shrink-0 flex items-center gap-2 px-5 pt-4 pb-3">${BACK}<div class="min-w-0 flex-1"><p class="font-headline-sm text-headline-sm text-on-surface leading-tight">${f.title}</p><p class="font-body-sm text-body-sm text-on-surface-variant">${CATS[f.cat]} · ${f.cond}</p></div>
<details class="relative shrink-0"><summary aria-label="More" class="list-none grid place-items-center w-10 h-10 rounded-lg text-on-surface-variant hover:bg-surface-container-high cursor-pointer">${icon('more_vert', 'text-[20px]')}</summary><div class="absolute right-0 top-full mt-1 z-10 w-52 py-1 rounded-xl bg-surface-container-lowest ring-1 ring-outline-variant/50 shadow-[0_16px_40px_rgba(31,27,24,0.18)]"><a href="#" data-missing="Opens it in Discover the way others see it" class="flex items-center gap-3 px-3 h-10 text-[14px] hover:bg-surface-container-low">${icon('visibility', 'text-[18px] text-on-surface-variant')}See it as others do</a><a href="#" data-missing="Removed — it leaves Bartefy (you can’t undo this)" class="flex items-center gap-3 px-3 h-10 text-[14px] hover:bg-surface-container-low">${icon('delete', 'text-[18px] text-on-surface-variant')}Remove this find</a></div></details></header>
<div class="flex-1 min-h-0 overflow-y-auto px-5 pb-5 flex flex-col gap-5">
<img alt="" class="v6-find-photo w-full aspect-[4/3] rounded-xl object-cover ${f.state === 'paused' ? 'grayscale' : ''}" src="${f.src}">
${clock}${offers}
${section('You want in return', `<p class="font-body-md text-body-md text-on-surface">${f.wants}</p><div class="flex gap-1.5"><span class="px-2 h-6 inline-flex items-center rounded-full bg-surface-container-high text-[12px] font-semibold text-on-surface-variant">${CATS[{ audio: 'cameras', cameras: 'audio', clothing: 'outdoors', home: 'home', writing: 'writing', outdoors: 'outdoors' }[f.cat]]}</span></div>`)}
${saves}
</div>
<footer data-find-foot class="shrink-0 flex items-center gap-2 px-5 py-3 border-t border-surface-variant"><button type="button" data-missing="Edit opens the listing form with this find filled in" class="${QUIET}">${icon('edit', 'text-[18px]')}<span data-lbl>Edit</span></button>${pause}<span class="flex-1"></span>${main}</footer>
</article>`
}

function findsPage(data, { tier }) {
  const collector = tier === 'collector'
  const table = data.filter((f) => f.state !== 'paused'), paused = data.filter((f) => f.state === 'paused')
  const liveN = table.length, full = !collector && liveN >= 6
  const expiring = table.filter((f) => f.state === 'live' && f.days <= 3), withOffers = table.filter((f) => f.offers.length), swaps = table.filter((f) => f.state === 'swap')
  const offerN = withOffers.reduce((n, f) => n + f.offers.length, 0)
  // Needs you: one line of jumps, most urgent first.
  const jump = (list, text, tone) => list.length ? `<button type="button" data-jump="${list[0].id}" class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full ${tone} font-label-md text-label-md whitespace-nowrap hover:brightness-95">${text}${icon('arrow_forward', 'text-[14px]')}</button>` : ''
  const needs = [jump(expiring, `${expiring.length} leaving the deck soon`, 'bg-sun/60 text-ink'), jump(withOffers, `${offerN} offer${offerN > 1 ? 's' : ''} waiting`, 'bg-coral/70 text-ink'), jump(swaps, `${swaps.length} in a swap`, 'bg-mint text-forest')].join('')
  const cats = Object.keys(CATS).filter((c) => table.some((f) => f.cat === c))
  const chips = table.length > 12 ? `<div data-cat-chips class="flex gap-1.5 overflow-x-auto v6-strip">${['all', ...cats].map((c, i) => `<button type="button" data-cat-chip="${c}" aria-pressed="${i === 0}" class="shrink-0 h-8 px-3 rounded-full ring-1 ring-inset ring-outline-variant font-label-md text-label-md text-on-surface-variant aria-pressed:bg-ink aria-pressed:text-white aria-pressed:ring-ink">${c === 'all' ? `All ${table.length}` : `${CATS[c]} <span class="opacity-70">${table.filter((f) => f.cat === c).length}</span>`}</button>`).join('')}</div>` : ''
  const addTile = full
    ? `<button type="button" data-missing="Your table is full (6 of 6). Pause a find to make room — or Collector has no limit (600 pts)" data-add-tile class="self-start text-left min-w-0"><span class="aspect-[4/3] rounded-lg border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-1 px-4 text-center">${icon('lock', 'text-[24px] text-outline')}<span class="font-label-lg text-label-lg text-on-surface-variant">Table full · 6 of 6</span><span class="font-body-sm text-[12px] text-outline">Pause one to add another</span></span></button>`
    : `<a href="18-add-b.html" data-add-find data-add-tile class="self-start text-left min-w-0"><span class="aspect-[4/3] rounded-lg border-2 border-dashed border-primary/40 text-primary flex flex-col items-center justify-center gap-1 hover:bg-primary-container/50 transition-colors">${icon('add_circle', 'text-[28px]')}<span class="font-label-lg text-label-lg">Put a find on the table</span></span></a>`
  const grid = (items, fn, tile = '') => `<div class="v6-find-grid ${items.length <= 12 ? 'v6-find-grid-few' : ''} grid gap-x-4 gap-y-5">${tile}${items.map(fn).join('')}</div>`
  const tab = (id, label, n, on) => `<button type="button" role="tab" data-tab="${id}" aria-selected="${on}" class="h-10 px-1 border-b-2 border-transparent font-label-lg text-label-lg text-on-surface-variant aria-selected:border-primary aria-selected:text-on-surface whitespace-nowrap">${label} <span class="font-ticker-number text-[12px] opacity-70">${n}</span></button>`
  const order = (a, b) => ((a.state === 'live' && a.days <= 3 ? 0 : a.offers.length ? 1 : a.state === 'swap' ? 2 : 3) - (b.state === 'live' && b.days <= 3 ? 0 : b.offers.length ? 1 : b.state === 'swap' ? 2 : 3))
  const sorted = [...table].sort(order)
  const first = sorted[0].id

  const capacity = collector
    ? `<button type="button" data-pop-trigger="cap" class="${CHIP} ${chipTone(false)}">${filled('star', 'text-[16px] text-ink')}<span class="font-label-lg text-label-lg text-on-surface">${liveN} on the table</span><span class="font-body-sm text-body-sm text-on-surface-variant">· no limit</span></button>`
    : `<button type="button" data-pop-trigger="cap" class="${CHIP} ${chipTone(false)}"><span class="font-label-lg text-label-lg text-on-surface">${liveN} of 6</span><span class="w-16 h-1.5 rounded-full bg-surface-variant overflow-hidden"><span class="block h-full bg-primary rounded-full" style="width:${Math.min(100, (liveN / 6) * 100)}%"></span></span><span class="font-body-sm text-body-sm text-on-surface-variant">${full ? 'full' : 'live'}</span>${icon('expand_more', 'text-[18px] text-on-surface-variant -mr-1')}</button>`
  const capPanel = `<div class="p-4 flex flex-col gap-3"><p class="font-headline-sm text-headline-sm text-on-surface">${collector ? 'Collector — no limit' : `Hunter — ${liveN} of 6 finds`}</p><p class="font-body-sm text-body-sm text-on-surface-variant">${collector ? 'Put as many finds on the table as you like, and hunt out to 50 km.' : 'Finds in a swap count until the swap is done. Paused ones don’t.'}</p>${collector ? '' : `<div class="rounded-lg bg-surface-container-low px-3 py-2.5"><p class="font-label-lg text-label-lg text-on-surface">Collector</p><p class="font-body-sm text-body-sm text-on-surface-variant">No limit on finds, 50 km, Undo · 600 pts</p></div>`}</div>${collector ? '' : footLink('See Points &amp; Tiers', go('points'))}`
  const context = `<h1 class="font-headline-md text-headline-md text-on-surface shrink-0">My finds</h1><div class="relative group">${capacity}${pop('cap', 'w-[320px]', capPanel, { open: false, align: 'left-0' })}</div>`

  const body = `<!-- My finds, proposal B (build-revisions.mjs): grid + detail, one screen -->
<style>[data-finds] [hidden]{display:none!important}
.v6-strip{scrollbar-width:none}.v6-strip::-webkit-scrollbar{display:none}
[data-finds] details>summary::-webkit-details-marker{display:none}
.v6-find-grid{grid-template-columns:repeat(auto-fill,minmax(190px,1fr))}.v6-find-grid-few{grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
[data-finds] .v6-find-photo{max-height:max(200px,calc(100dvh - 560px))}
[data-back],[data-compact-only]{display:none}
@media (max-width:1023.98px){
  [data-finds]{display:block;padding:0}
  [data-finds-main]{border-radius:0;box-shadow:none;min-height:calc(100dvh - 80px)}
  [data-grid-scroll]{overflow:visible}
  [data-finds-tabs]{position:sticky;top:80px;z-index:2}
  [data-back]{display:grid}[data-compact-only]{display:flex}
  [data-detail-pane]{position:fixed;inset:0;z-index:60;border-radius:0;display:none}
  html.finds-open [data-detail-pane]{display:block}
  html.finds-open{overflow:hidden}
  [data-finds] .v6-find-photo{max-height:none}
  [data-find-foot]{padding-bottom:max(12px,env(safe-area-inset-bottom))}
}
@media (min-width:768px){[data-phone-title]{display:none!important}}
@media (max-width:767.98px){
  [data-finds]{margin-top:-24px}
  [data-finds-tabs]{top:56px}
  .v6-find-grid{grid-template-columns:repeat(2,minmax(0,1fr));column-gap:12px}
  [data-finds-main]{min-height:calc(100dvh - 56px - 64px)}
  [data-add-tile]{display:none}
  [data-find-foot] [data-lbl]{display:none}
}</style>
<div data-finds class="px-margin md:px-gutter-desktop pt-6 pb-6 flex flex-col lg:flex-row gap-6 lg:h-[calc(100dvh-80px)]">
<section data-finds-main class="flex-1 min-w-0 min-h-0 flex flex-col rounded-xl bg-surface-container-lowest ring-1 ring-surface-variant/70 overflow-hidden">
<div data-compact-only data-phone-title class="items-center gap-3 px-4 pt-4"><h1 class="font-headline-md text-headline-md text-on-surface">My finds</h1><span class="ml-auto">${capacity.replace('data-pop-trigger="cap"', 'data-missing="' + (collector ? 'Collector: no limit on finds' : `Hunter: ${liveN} of 6 finds. Collector has no limit — 600 pts`) + '"')}</span></div>
<div data-finds-tabs class="shrink-0 bg-surface-container-lowest px-4 pt-2 flex flex-col gap-3 border-b border-surface-variant">
<div role="tablist" class="flex gap-6">${tab('table', 'On the table', table.length, true)}${tab('paused', 'Paused', paused.length, false)}</div></div>
<div data-grid-scroll class="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-6">
<div data-pane="table" class="flex flex-col gap-4">${needs ? `<div class="flex items-center gap-2 overflow-x-auto v6-strip"><span class="shrink-0 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mr-1">Needs you</span>${needs}</div>` : ''}${chips}${grid(sorted, card, addTile)}</div>
<div data-pane="paused" hidden class="flex flex-col gap-4"><p class="font-body-sm text-body-sm text-on-surface-variant">Paused finds are in nobody’s deck and don’t count toward your limit.${full ? ' Your table is full — pause a live find to bring one of these back.' : ''}</p>${paused.length ? grid(paused, card) : `<p class="py-10 text-center font-body-md text-body-md text-on-surface-variant">Nothing paused.</p>`}</div>
</div></section>
<aside data-detail-pane class="lg:w-[clamp(380px,30vw,500px)] lg:shrink-0 min-h-0 rounded-xl bg-surface-container-lowest ring-1 ring-surface-variant/70 overflow-hidden">
${data.map((f) => findDetail(f, { full })).join('\n')}
</aside></div>
<script>
(() => {
  const compact = () => matchMedia('(max-width:1023.98px)').matches
  const close = () => document.documentElement.classList.remove('finds-open')
  const pick = (id, open = true) => {
    if (open && compact()) document.documentElement.classList.add('finds-open')
    // On a phone nothing is "picked" until you tap it.
    if (open || !compact()) document.querySelectorAll('[data-pick]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.pick === id)))
    document.querySelectorAll('[data-detail]').forEach((d) => (d.hidden = d.dataset.detail !== id))
    try { history.replaceState(null, '', '#' + id) } catch (e) {}
  }
  const showTab = (t) => {
    document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === t)))
    document.querySelectorAll('[data-pane]').forEach((p) => (p.hidden = p.dataset.pane !== t))
    const firstCard = document.querySelector('[data-pane="' + t + '"] [data-pick]'); if (firstCard) pick(firstCard.dataset.pick, false)
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-back]')) return close()
    const t = e.target.closest('[data-tab]'); if (t) return showTab(t.dataset.tab)
    const j = e.target.closest('[data-jump]'); if (j) { const c = document.querySelector('[data-pick="' + j.dataset.jump + '"]'); c.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return pick(j.dataset.jump) }
    const ch = e.target.closest('[data-cat-chip]')
    if (ch) { document.querySelectorAll('[data-cat-chip]').forEach((x) => x.setAttribute('aria-pressed', String(x === ch))); const c = ch.dataset.catChip; document.querySelectorAll('[data-pane="table"] [data-pick]').forEach((b) => (b.hidden = c !== 'all' && b.dataset.cat !== c)); return }
    const r = e.target.closest('[data-pick]'); if (r) return pick(r.dataset.pick)
  })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })
  const [start] = location.hash.slice(1).split('+')
  const card = start && document.querySelector('[data-pick="' + start + '"]')
  if (card) { showTab(card.closest('[data-pane]').dataset.pane); pick(start, true) } else pick('${first}', false)
})()
</script>
`
  let s = read('stitch/08-my-finds-desktop-r1.html').replace('<title>', `<title>${collector ? 'MY FINDS (B, 50 finds) · ' : 'MY FINDS (B) · '}`)
  const a = s.indexOf('<!-- Subtle Ambient Glow Canvas -->'), b = s.indexOf('<!-- FAST LISTING DRAWER')
  if (a < 0 || b < 0) throw new Error('finds B: content markers not found')
  // Close the two wrappers the replaced block opened (<main> … <div class="flex flex-col w-full">).
  s = s.slice(0, a) + body + s.slice(b)
  const h = s.indexOf('<header data-organism="topbar" data-variant="desktop"'), he = s.indexOf('</header>', h)
  const keep = LINK_BASE; LINK_BASE = ''
  s = s.slice(0, h) + topbar({ fixed: true, cls: 'max-md:hidden', tier, context }) + s.slice(he + '</header>'.length)
  LINK_BASE = keep
  return s
}
write('stitch/08-my-finds-b.html', findsPage(HUNTER, { tier: 'hunter' }))
write('stitch/08-my-finds-b-50.html', findsPage(COLLECTOR, { tier: 'collector' }))
}

/* ───────────────────────────── Points & tiers, proposal B ─────────────────────────────
 * Alex, 2026-09-28: "go for the last page. Points and Tiers." Same approach as
 * Swaps and My finds — one screen, calm, one loud thing, every number from
 * lib/points.ts and lib/membership.ts:
 *
 *   left   the wallet (balance, how far to Collector, this week) and the five
 *          ways to earn — the streak's seven days sit in the daily-visit row,
 *          the invite's Copy link in the friend row.
 *   right  tabs: Tiers (points only — no $, no card: Stripe isn't live) ·
 *          Perks (the two you buy here; the three you spend where they happen)
 *          · History (every point, newest first).
 *
 * Cut from Stitch: "Protocol 027", "Swap Tender", "Audit ID", "cryptographically
 * hashed", the Tier column, @handles, $ prices, "Subscribe with Card", keyword
 * alerts / saved searches (search is cut), ratings (stars are cut), postage
 * labels (no shipping), "Purchase" on Super/Multi/Boost (spent in the moment). */
{
// Mirrors lib/points.ts TIER_PRICES / PERK_PRICES exactly.
const TIER_PRICE = { collector: 600, curator: 1500 }
const PERK_PRICE = { boost: 75, eyeing: 50, radius: 120, super: 50, multi: 150 }
const BAL = 420, MONTH_LISTED = 4, STREAK_DAY = 4
const next = { id: 'collector', name: 'Collector', price: TIER_PRICE.collector }
const EARN = [
  { ic: 'add_photo_alternate', t: 'Put a find on the table', d: `The first 10 a month · <b>${MONTH_LISTED} of 10</b> this month`, pts: '+20', bar: MONTH_LISTED / 10 },
  { ic: 'handshake', t: 'Someone accepts your offer', d: 'When they say yes to a swap you offered', pts: '+60' },
  { ic: 'task_alt', t: 'A swap is done', d: 'When you both confirm the finds changed hands', pts: '+160' },
  { ic: 'person_add', t: 'A friend’s first swap', d: 'Invite someone; you get it when they finish their first swap', pts: '+400', invite: true },
  { ic: 'local_fire_department', t: 'Come back each day', d: `Day ${STREAK_DAY} today · a full week pays 34`, pts: '+2 to +7', streak: true },
]
const LEDGER = [
  ['Today', 'local_fire_department', 'Daily visit · day 4', '', +5],
  ['Yesterday', 'bolt', 'Boost', 'Lamy 2000 Fountain Pen', -75],
  ['Yesterday', 'local_fire_department', 'Daily visit · day 3', '', +4],
  ['Yesterday', 'task_alt', 'Swap done', 'Minolta X-700 ⇄ Brass Banker’s Lamp', +160],
  ['Mon 26 Sep', 'local_fire_department', 'Daily visit · day 2', '', +3],
  ['Mon 26 Sep', 'handshake', 'Offer accepted', 'Your Leica Mini 35mm, by Samira P.', +60],
  ['Sun 25 Sep', 'local_fire_department', 'Daily visit · day 1', '', +2],
  ['Sun 25 Sep', 'add_photo_alternate', 'Find on the table', 'Braun AB1 Travel Clock', +20],
  ['Thu 22 Sep', 'rocket_launch', 'Super offer', 'For Julian’s Olympus OM-1', -50],
  ['Wed 21 Sep', 'add_photo_alternate', 'Find on the table', 'Ceramic Pour-Over Set', +20],
  ['Tue 20 Sep', 'add_photo_alternate', 'Find on the table', 'Lamy 2000 Fountain Pen', +20],
  ['Mon 19 Sep', 'add_photo_alternate', 'Find on the table', 'Fuji X100 Leather Half-Case', +20],
  ['Sat 10 Sep', 'task_alt', 'Swap done', 'Pentax K1000 ⇄ Wool Fisherman Sweater', +160],
  ['Fri 2 Sep', 'handshake', 'Offer accepted', 'Your Minolta X-700, by Tomás R.', +60],
]
const WEEK = LEDGER.slice(0, 8).filter((r) => r[4] > 0).reduce((n, r) => n + r[4], 0)

const pips = Array.from({ length: 7 }, (_, i) => {
  const d = i + 1, done = d < STREAK_DAY, today = d === STREAK_DAY
  return `<span title="Day ${d} · +${Math.min(d + 1, 7)}" class="grid place-items-center w-7 h-7 rounded-md text-[11px] font-bold ${today ? 'bg-primary text-on-primary' : done ? 'bg-sun/70 text-ink' : 'bg-surface-container-high text-outline'}">${today ? filled('local_fire_department', 'text-[15px]') : done ? icon('check', 'text-[15px]') : `+${Math.min(d + 1, 7)}`}</span>`
}).join('')
const earnRow = (e) => `<li class="flex items-start gap-3 py-3">
<span class="grid place-items-center w-9 h-9 rounded-lg bg-surface-container-low text-on-surface-variant shrink-0">${icon(e.ic, 'text-[20px]')}</span>
<div class="min-w-0 flex-1"><div class="flex items-baseline justify-between gap-2"><p class="font-label-lg text-label-lg text-on-surface">${e.t}</p><span class="font-ticker-number text-[13px] text-primary whitespace-nowrap">${e.pts}</span></div>
<p class="font-body-sm text-[12px] leading-4 text-on-surface-variant mt-0.5">${e.d}</p>
${e.bar != null ? `<div class="mt-2 h-1 rounded-full bg-surface-variant overflow-hidden"><div class="h-full bg-primary rounded-full" style="width:${e.bar * 100}%"></div></div>` : ''}
${e.streak ? `<div class="mt-2 flex gap-1">${pips}</div><p class="mt-1 font-body-sm text-[11px] text-outline">Tomorrow pays +6 · a missed day starts again at +2</p>` : ''}
${e.invite ? `<div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1"><button type="button" data-missing="Invite link copied — bartefy.com/i/maya-l" class="whitespace-nowrap inline-flex items-center gap-1.5 h-8 px-3 rounded-lg ring-1 ring-inset ring-outline-variant font-label-md text-label-md text-primary hover:bg-surface-container-low">${icon('link', 'text-[16px]')}Copy invite link</button><span class="font-body-sm text-[11px] text-outline">1 friend joined · no swap yet</span></div>` : ''}
</div></li>`

const toNext = next.price - BAL
const wallet = `<div data-wallet class="p-5 flex flex-col gap-3">
<div class="flex items-center gap-2 text-on-surface-variant">${icon('toll', 'text-[20px] text-ink')}<span class="font-label-sm text-label-sm uppercase tracking-wider">Your points</span></div>
<div class="flex items-baseline gap-3"><span class="font-display text-[48px] leading-none font-semibold text-on-surface tracking-tight">${BAL}</span><span class="font-body-md text-body-md text-on-surface-variant">pts</span><span class="ml-auto inline-flex items-center h-6 px-2 rounded-full bg-mint text-forest text-[12px] font-bold">+${WEEK} earned this week</span></div>
<div><div class="flex items-baseline justify-between"><span class="font-body-sm text-body-sm text-on-surface">${toNext} more for <b>Collector</b></span><span class="font-ticker-number text-[12px] text-on-surface-variant">${BAL} / ${next.price}</span></div><div class="mt-1.5 h-2 rounded-full bg-surface-variant overflow-hidden"><div class="h-full bg-primary rounded-full" style="width:${(BAL / next.price) * 100}%"></div></div><p class="mt-1.5 font-body-sm text-[12px] text-outline">About one finished swap and a listing.</p></div>
</div>`
const rail = `<aside data-points-rail class="lg:w-[clamp(340px,26vw,420px)] lg:shrink-0 min-h-0 flex flex-col rounded-xl bg-surface-container-lowest ring-1 ring-surface-variant/70 overflow-hidden">
<div class="flex-1 min-h-0 overflow-y-auto">${wallet}<div data-earn class="border-t border-surface-variant px-5 pt-4"><p class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Ways to earn</p><ul class="divide-y divide-surface-variant">${EARN.map(earnRow).join('')}</ul></div></div></aside>`

// Tiers — points only. The perks come from lib/membership.ts, minus what the
// product cut (saved searches, ratings, postage) — flagged, not silently kept.
const TIER_LIST = [
  { id: 'hunter', name: 'Hunter', blurb: 'The whole loop, close to home. Most people never need more.', price: 0, perks: ['Hunt within 10 km', '6 finds on the table', '3 swaps on the go', 'Chat, meeting up, reporting — always free'] },
  { id: 'collector', name: 'Collector', blurb: 'For the person who swaps most weekends and hates missing a good find.', price: TIER_PRICE.collector, perks: ['Hunt out to 50 km', 'No limit on finds or swaps', 'See your admirers — and swap on the spot', 'Undo your last pass', 'One spotlight a week'] },
  { id: 'curator', name: 'Curator', blurb: 'For clear-outs and traders moving dozens of things a month.', price: TIER_PRICE.curator, perks: ['Everything in Collector', 'No distance limit, many cities', '3 spotlights a week', 'List many finds at once', 'Views, passes and wants per find', 'A curator mark on your profile'] },
]
const tierCard = (t) => {
  const mine = t.id === 'hunter', short = t.price - BAL
  const cta = mine
    ? `<p class="h-11 flex items-center justify-center gap-1.5 rounded-xl bg-surface-container-low font-label-lg text-label-lg text-on-surface-variant">${icon('check', 'text-[18px]')}Your tier</p>`
    : short > 0
      ? `<div><button type="button" disabled class="w-full h-11 rounded-xl ring-1 ring-inset ring-outline-variant font-label-lg text-label-lg text-on-surface-variant cursor-not-allowed inline-flex items-center justify-center gap-1.5">${icon('lock', 'text-[16px]')}${short.toLocaleString('en')} more pts</button><p class="mt-1.5 text-center font-body-sm text-[12px] text-outline">Redeem when you have ${t.price.toLocaleString('en')}</p></div>`
      : `<button type="button" data-missing="${t.name} for 30 days — ${t.price} pts" class="w-full h-11 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg">Redeem · ${t.price.toLocaleString('en')} pts</button>`
  return `<article data-tier="${t.id}" class="snap-start shrink-0 flex flex-col gap-4 rounded-xl p-5 ${mine ? 'ring-2 ring-primary bg-primary-container/30' : 'ring-1 ring-surface-variant bg-surface-container-lowest'}">
<div><div class="flex items-center justify-between gap-2"><p class="font-headline-md text-headline-md text-on-surface">${t.name}</p>${mine ? '<span class="inline-flex items-center h-6 px-2 rounded-full bg-primary text-on-primary text-[11px] font-bold uppercase tracking-wider">Yours</span>' : ''}</div>
<p class="mt-1 flex items-baseline gap-1.5"><span class="font-display text-[28px] leading-8 font-semibold text-on-surface">${t.price ? t.price.toLocaleString('en') : 'Free'}</span>${t.price ? '<span class="font-body-sm text-body-sm text-on-surface-variant">pts · 30 days</span>' : ''}</p>
<p class="mt-2 font-body-sm text-body-sm text-on-surface-variant">${t.blurb}</p></div>
<ul class="flex-1 flex flex-col gap-2">${t.perks.map((p) => `<li class="flex items-start gap-2 font-body-sm text-body-sm text-on-surface">${icon('check', 'text-[18px] text-primary')}${p}</li>`).join('')}</ul>
${cta}</article>`
}
const tiersPane = `<div class="flex flex-col gap-4">
<div data-tier-row class="grid grid-cols-3 gap-4">${TIER_LIST.map(tierCard).join('')}</div>
<p class="flex items-start gap-2 font-body-sm text-body-sm text-on-surface-variant">${icon('verified_user', 'text-[18px] text-primary')}<span>Never paid for, on any tier: chat, meeting up, confirming a swap, reporting and blocking. A tier lasts 30 days, then you’re back on Hunter unless you redeem again.</span></p>
</div>`

// Perks — two you buy here (7-day windows), three you spend in the moment.
const perk = ({ ic, t, price, d, how, buy, active }) => `<article class="flex items-start gap-4 rounded-xl ring-1 ring-surface-variant p-4">
<span class="grid place-items-center w-11 h-11 rounded-xl ${active ? 'bg-sun/70 text-ink' : 'bg-surface-container-low text-on-surface-variant'} shrink-0">${filled(ic, 'text-[22px]')}</span>
<div class="min-w-0 flex-1"><div class="flex items-baseline justify-between gap-2"><p class="font-label-lg text-label-lg text-on-surface">${t}</p><span class="font-ticker-number text-[13px] text-on-surface whitespace-nowrap">${price} pts</span></div>
<p class="font-body-sm text-body-sm text-on-surface-variant">${d}</p>
${active ? `<p class="mt-2 inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-sun/50 text-ink text-[12px] font-semibold">${icon('schedule', 'text-[14px]')}${active}</p>` : ''}
<div class="mt-2">${buy ? `<button type="button" data-missing="${t} on for 7 days — ${price} pts" class="h-9 px-3.5 rounded-lg ring-1 ring-inset ring-primary/50 text-primary font-label-md text-label-md hover:bg-primary-container">Turn on · 7 days</button>` : `<a href="${how[1]}" class="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:underline">${how[0]}${icon('arrow_forward', 'text-[16px]')}</a>`}</div></div></article>`
const perksPane = `<div class="flex flex-col gap-5">
<section class="flex flex-col gap-3"><p class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Turn on here · 7 days each</p><div data-perk-grid class="grid grid-cols-2 gap-3">
<!-- "See who saved your finds" cut (Alex, 2026-09-29): no saving; who's eyeing your finds is Collector only. -->
${perk({ ic: 'explore', t: 'Hunt further', price: PERK_PRICE.radius, d: 'Your deck reaches past 10 km for a week. Collector hunts to 50 km always.', buy: true })}
</div></section>
<section class="flex flex-col gap-3"><p class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Spent in the moment</p><div data-perk-grid class="grid grid-cols-2 gap-3">
${perk({ ic: 'bolt', t: 'Boost a find', price: PERK_PRICE.boost, d: 'One of your finds goes first in nearby decks for a day.', how: ['From My finds', go('finds')], active: 'On Lamy 2000 · 18h left' })}
${perk({ ic: 'rocket_launch', t: 'Super offer', price: PERK_PRICE.super, d: 'Your offer goes to the top of their list. Switch it on when you offer.', how: ['When you offer, in Discover', go('discover')] })}
${perk({ ic: 'stacks', t: 'Offer 2 to 4 at once', price: PERK_PRICE.multi, d: 'Offer several of your finds for one of theirs, in one go.', how: ['When you offer, in Discover', go('discover')] })}
</div></section></div>`

const historyPane = `<div class="flex flex-col gap-3">
<div class="flex gap-1.5">${['All', 'Earned', 'Spent'].map((x, i) => `<button type="button" data-hist="${x.toLowerCase()}" aria-pressed="${i === 0}" class="h-8 px-3 rounded-full ring-1 ring-inset ring-outline-variant font-label-md text-label-md text-on-surface-variant aria-pressed:bg-ink aria-pressed:text-white aria-pressed:ring-ink">${x}</button>`).join('')}</div>
<ul class="flex flex-col divide-y divide-surface-variant rounded-xl ring-1 ring-surface-variant">${LEDGER.map(([when, ic, what, sub, d]) => `<li data-delta="${d > 0 ? 'earned' : 'spent'}" class="flex items-center gap-3 px-4 py-3"><span class="grid place-items-center w-9 h-9 rounded-lg ${d > 0 ? 'bg-mint text-forest' : 'bg-surface-container-low text-on-surface-variant'} shrink-0">${icon(ic, 'text-[18px]')}</span><div class="min-w-0 flex-1"><p class="font-label-lg text-label-lg text-on-surface">${what}</p><p class="font-body-sm text-[12px] text-on-surface-variant truncate">${[when, sub].filter(Boolean).join(' · ')}</p></div><span class="font-ticker-number text-[14px] ${d > 0 ? 'text-primary' : 'text-on-surface-variant'} whitespace-nowrap">${d > 0 ? '+' : '−'}${Math.abs(d)} pts</span></li>`).join('')}</ul>
<p class="font-body-sm text-[12px] text-outline">Every point traces to the thing that earned or spent it. Nothing is ever removed from this list.</p></div>`

const tab = (id, label, on) => `<button type="button" role="tab" data-ptab="${id}" aria-selected="${on}" class="h-10 px-1 border-b-2 border-transparent font-label-lg text-label-lg text-on-surface-variant aria-selected:border-primary aria-selected:text-on-surface whitespace-nowrap">${label}</button>`
const body = `<!-- Points & tiers, proposal B (build-revisions.mjs): wallet + earn | tiers · perks · history -->
<style>[data-points] [hidden]{display:none!important}
[data-back],[data-phone-title],[data-ptab="earn"]{display:none}
@media (max-width:1023.98px){
  [data-points]{display:block;padding:0}
  [data-points-rail],[data-points-main]{border-radius:0;box-shadow:none}
  [data-points-rail] .overflow-y-auto,[data-points-main] .overflow-y-auto{overflow:visible}
  [data-points-main]{border-top:8px solid rgb(245 244 239)}
  [data-ptabs]{position:sticky;top:80px;z-index:2}
  [data-tier-row]{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;margin:0 -16px;padding:2px 16px}
  [data-tier-row]::-webkit-scrollbar{display:none}
  [data-tier-row]>*{width:min(78%,300px)}
}
@media (max-width:767.98px){
  [data-points]{margin-top:-24px}
  [data-phone-title]{display:flex}
  [data-ptabs]{top:56px}
  [data-perk-grid]{grid-template-columns:1fr}
  /* Alex, 2026-09-28: tiers sat under five earn rows on a phone. Earn becomes
     a tab here: balance on top, four tabs, one pane at a time. */
  [data-points]{display:flex;flex-direction:column;gap:0}
  [data-ptabs]{border-top:1px solid rgb(237 235 228)}
  [data-points-rail],[data-points-rail]>div,[data-points-main]{display:contents}
  [data-phone-title]{order:0;background:#fff}
  [data-wallet]{order:1;background:#fff;padding-top:8px}
  [data-ptabs]{order:2}
  [data-earn]{order:3;background:#fff;border-top:0;padding-bottom:16px}
  [data-panes]{order:4;background:#fff;padding:16px}
  [data-ptab="earn"]{display:inline-block}
  [data-points]:not([data-cur="earn"]) [data-earn]{display:none}
  [data-points][data-cur="earn"] [data-panes]{display:none}
  [data-ptabs] [role="tablist"]{gap:20px}
}</style>
<div data-points class="px-margin md:px-gutter-desktop pt-6 pb-6 flex flex-col lg:flex-row gap-6 lg:h-[calc(100dvh-80px)]">
${rail.replace('<div class="flex-1 min-h-0 overflow-y-auto">', `<div class="flex-1 min-h-0 overflow-y-auto"><div data-phone-title class="items-baseline gap-2 px-5 pt-4"><h1 class="font-headline-md text-headline-md text-on-surface">Points &amp; tiers</h1></div>`)}
<section data-points-main class="flex-1 min-w-0 min-h-0 flex flex-col rounded-xl bg-surface-container-lowest ring-1 ring-surface-variant/70 overflow-hidden">
<div data-ptabs class="shrink-0 bg-surface-container-lowest px-5 pt-2 border-b border-surface-variant"><div role="tablist" class="flex gap-6">${tab('earn', 'Earn', false)}${tab('tiers', 'Tiers', true)}${tab('perks', 'Perks', false)}${tab('history', 'History', false)}</div></div>
<div data-panes class="flex-1 min-h-0 overflow-y-auto p-5">
<div data-ppane="tiers">${tiersPane}</div>
<div data-ppane="perks" hidden>${perksPane}</div>
<div data-ppane="history" hidden>${historyPane}</div>
</div></section></div>
<script>
(() => {
  const root = document.querySelector('[data-points]')
  const show = (t) => {
    root.dataset.cur = t
    document.querySelectorAll('[data-ptab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.ptab === t)))
    if (t !== 'earn') document.querySelectorAll('[data-ppane]').forEach((p) => (p.hidden = p.dataset.ppane !== t))
    try { history.replaceState(null, '', '#' + t) } catch (e) {}
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-ptab]'); if (t) return show(t.dataset.ptab)
    const h = e.target.closest('[data-hist]'); if (!h) return
    document.querySelectorAll('[data-hist]').forEach((x) => x.setAttribute('aria-pressed', String(x === h)))
    document.querySelectorAll('[data-delta]').forEach((r) => (r.hidden = h.dataset.hist !== 'all' && r.dataset.delta !== h.dataset.hist))
  })
  const phone = matchMedia('(max-width:767.98px)').matches
  const start = location.hash.slice(1)
  if (['tiers', 'perks', 'history'].includes(start) || (start === 'earn' && phone)) show(start)
  else if (phone) show('earn')
  // Back on a wide screen, Earn is the rail again: keep a real pane showing.
  matchMedia('(max-width:767.98px)').addEventListener('change', (m) => { if (!m.matches && root.dataset.cur === 'earn') show('tiers') })
})()
</script>
`
let s = read('stitch/06-points-tiers-desktop-r1.html').replace('<title>', '<title>POINTS & TIERS (B) · ')
const a = s.indexOf('<!-- Subtle tactile background ambient accents -->')
const t = s.indexOf('<!-- TOAST / NOTIFICATION MODAL CONTAINER -->')
const b = s.indexOf('</script>', t) + '</script>'.length
if (a < 0 || t < 0) throw new Error('points B: content markers not found')
s = s.slice(0, a) + body + s.slice(b)
const h = s.indexOf('<header data-organism="topbar" data-variant="desktop"'), he = s.indexOf('</header>', h)
const keep = LINK_BASE; LINK_BASE = ''
s = s.slice(0, h) + topbar({ fixed: true, cls: 'max-md:hidden', context: '<h1 class="font-headline-md text-headline-md text-on-surface shrink-0">Points &amp; tiers</h1>' }) + s.slice(he + '</header>'.length)
LINK_BASE = keep
write('stitch/06-points-b.html', s)

const phoneFrame = (file, hash = '') => `<div class="rounded-[28px] overflow-hidden ring-1 ring-outline-variant bg-background shadow-md" style="width:390px;height:844px"><iframe src="../${file}${hash}" width="390" height="844" class="border-0 block" title="${file}${hash}"></iframe></div>`
const phoneSheet = (file, title, lead, frames) => write(file, `<!DOCTYPE html><html lang="en">
<!-- ${title} — generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-surface-container-low font-body-md text-on-surface antialiased p-10">
<h1 class="font-headline-lg text-headline-lg mb-2">${title}</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-8 max-w-3xl">${lead} <b>Every frame is the real page</b> — tap, swipe, go back.</p>
<div class="flex flex-wrap items-start gap-10">${frames.map(([id, t, note, f, hash]) => state(id, t, note, 390, phoneFrame(f, hash))).join('\n')}</div>
</body></html>`)
phoneSheet('stitch/organisms/finds-phone-r1.html', 'My finds — phone', 'Two photos across, one badge each. The capacity chip sits by the title; ＋Add is the tab bar’s. Tap a find and it opens full screen with a back arrow; the one loud action is pinned to the bottom.', [
  ['list', '1 · The grid', 'Title + 6 of 6, tabs, Needs you (swipe), the photos.', '08-my-finds-b.html', ''],
  ['expiring', '2 · Leaving the deck in 3 days', 'Renew is the loud one. It has an offer too.', '08-my-finds-b.html', '#cameras-1'],
  ['offers', '3 · Two offers on it', 'Each offer opens in Swaps. Review offers is the loud one.', '08-my-finds-b.html', '#audio-0'],
  ['swap', '4 · In a swap', 'Off the deck; Open chat goes to its chat in Swaps.', '08-my-finds-b.html', '#outdoors-0'],
  ['paused', '5 · Paused, table full', 'Put it back is greyed: pause another first.', '08-my-finds-b.html', '#cameras-2'],
  ['fifty', '7 · Collector, 50 finds', 'Same page; category chips appear past 12.', '08-my-finds-b-50.html', ''],
])
phoneSheet('stitch/organisms/points-phone-r1.html', 'Points &amp; tiers — phone', 'Your balance on top, then four tabs — Earn · Tiers · Perks · History — one at a time. On a wide screen Earn is the left column instead.', [
  ['earn', '1 · Earn (opens here)', 'Balance, how far to Collector, the five ways to earn, the streak, the invite link.', '06-points-b.html', ''],
  ['tiers', '2 · Tiers', 'Points only. Swipe the cards; the next tier says how many points are missing.', '06-points-b.html', '#tiers'],
  ['perks', '3 · Perks', 'Two you turn on here, three you spend in the moment.', '06-points-b.html', '#perks'],
  ['history', '4 · History', 'Every point, newest first. All · Earned · Spent.', '06-points-b.html', '#history'],
])
}


/* ───────────────────────────── Profile R2 + the person card ─────────────────────────────
 * Alex, 2026-09-28, on R1's public desk: "it is too public. We should not
 * give users the ability to see other people's desks — this violates the
 * randomness, and people will start visiting other people's desks and pick
 * items that way."  A standing rule now: NOBODY BROWSES ANOTHER PERSON'S FINDS.
 * Finds reach you only through the deck, at random.
 *
 *   - The public page is gone. What's left of it is the PERSON CARD: photo,
 *     name, area, since, verified, swaps done — and Block. No finds, no count
 *     of finds, no past swaps. A small dialog (bottom sheet on a phone), opened
 *     from a name: the Discover card, an offer, the chat's ⋮, a saved find.
 *   - "See desk" / "Desk · 4" are gone everywhere; the links say "About Julian".
 *   - Your profile (12-profile-b.html): who you are + "Only you see this"
 *     (tier, points, invite) on the left; on the right "How others see you"
 *     (your own person card, exactly) and your finished swaps — private.
 *     No "table" grid (that's My finds) and no "Share your desk". */
{
const face = (alt) => { for (const h of [S1, S2, S4, S5]) if (h.includes(`data-alt="${alt}`)) return imgByAlt(h, alt); throw new Error(alt) }
const PEOPLE = {
  'Julian R.': [face('Portrait of Julian Ross'), 'Los Feliz, Los Angeles', '2024', 18, true],
  'Marcus V.': [face('Close up portrait photo of Marcus Vance'), 'Echo Park, Los Angeles', '2023', 24, true],
  'Elena R.': [face('Portait of Elena Rostova'), 'Los Feliz, Los Angeles', '2025', 7, false],
  'Sara M.': [face('Authentic candid portrait of Sara M.'), 'Highland Park, Los Angeles', '2024', 12, true],
  'Samira P.': [SAMIRA, 'Silver Lake, Los Angeles', '2025', 9, true],
  'Marcus T.': [face('Editorial portrait of Marcus T.'), 'Atwater Village, Los Angeles', '2023', 31, true],
  'Elena K.': [face('Warm natural portrait of Elena K.'), 'Eagle Rock, Los Angeles', '2025', 9, false],
  'Liam V.': [null, 'Echo Park, Los Angeles', '2026', 5, false], 'Sora K.': [null, 'Silver Lake, Los Angeles', '2026', 2, false],
  'Noah B.': [null, 'Glendale', '2025', 6, true], 'Ines G.': [null, 'Los Feliz, Los Angeles', '2024', 14, true], 'Tomás R.': [null, 'Echo Park, Los Angeles', '2025', 4, false],
  'Aiko H.': [null, 'Silver Lake, Los Angeles', '2026', 1, false], 'Priya S.': [null, 'Highland Park, Los Angeles', '2025', 8, true], 'Julian': [null, '', '', 0, false],
  'Ben O.': [null, 'Burbank', '2024', 11, true], 'Lena W.': [null, 'Pasadena', '2025', 3, false], 'Omar F.': [null, 'Koreatown, Los Angeles', '2024', 16, true], 'Chloe D.': [null, 'Echo Park, Los Angeles', '2025', 2, false],
  'Maya L.': [AVATAR_SRC, 'Silver Lake, Los Angeles', '2025', 7, true],
}
const TINT = ['#7EB3DD', '#AE9FDC', '#D6EBDF', '#EDC857']
const personCard = (name, { preview = false } = {}) => {
  const [src, area, since, swaps, verified] = PEOPLE[name] || [null, '', '', 0, false]
  const first = name.split(' ')[0]
  const pic = src ? `<img alt="" class="w-20 h-20 rounded-full object-cover" src="${src}">` : `<span class="w-20 h-20 rounded-full grid place-items-center text-[26px] font-bold text-ink" style="background:${TINT[name.length % 4]}">${name.split(' ').map((w) => w[0]).join('').replace('.', '')}</span>`
  return `<div class="flex flex-col items-center text-center gap-3">
<span class="relative">${pic}${verified ? `<span title="Verified" class="absolute -bottom-0.5 -right-0.5 grid place-items-center w-7 h-7 rounded-full bg-surface-container-lowest">${filled('verified', 'text-[22px] text-primary')}</span>` : ''}</span>
<div><p class="font-headline-md text-headline-md text-on-surface">${name}</p><p class="font-body-sm text-body-sm text-on-surface-variant">${area}</p><p class="font-body-sm text-[12px] text-outline">On Bartefy since ${since}${verified ? ' · Verified' : ''}</p></div>
<div class="w-full rounded-xl bg-surface-container-low py-3"><p class="font-display text-[32px] leading-9 font-semibold text-on-surface">${swaps}</p><p class="font-body-sm text-body-sm text-on-surface-variant">${swaps === 1 ? 'swap' : 'swaps'} done</p></div>
<p class="font-body-sm text-[12px] text-on-surface-variant">${preview ? 'Your finds reach people only through their deck, at random.' : `${first}’s finds reach you only through your deck, at random — like everyone’s.`}</p>
${preview ? '' : `<div class="w-full flex gap-2 pt-1"><button type="button" data-block="${name}" class="flex-1 h-11 rounded-xl font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high inline-flex items-center justify-center gap-1.5">${icon('block', 'text-[18px]')}Block</button><button type="button" data-person-close class="flex-1 h-11 rounded-xl bg-surface-container-low font-label-lg text-label-lg text-on-surface hover:bg-surface-container-high">Close</button></div>`}
</div>`
}
const blockStep = (name) => {
  const first = name.split(' ')[0]
  return `<div class="flex flex-col gap-4 text-left"><div><p class="font-headline-sm text-headline-sm text-on-surface">Block ${first}?</p><p class="mt-1 font-body-md text-body-md text-on-surface-variant">They won’t see your finds and you won’t see theirs. Pick a reason if you like.</p></div>
<div class="flex flex-col gap-1">${['Spamming me', 'Rude or bad attitude', 'Suspicious — possible scam', 'Something else'].map((r) => `<label class="flex items-center gap-3 h-10 px-2 rounded-lg hover:bg-surface-container-low cursor-pointer"><input type="radio" name="block-reason" class="accent-[#1B6B55]"><span class="font-body-md text-body-md">${r}</span></label>`).join('')}</div>
<p class="font-body-sm text-[12px] text-outline">They are not told. Blocking is always free.</p>
<div class="flex justify-end gap-2"><button type="button" data-person-close class="h-11 px-4 rounded-xl font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high">Cancel</button><button type="button" data-person-close data-missing="${first} is blocked — undo it in Settings" class="h-11 px-5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg">Block</button></div></div>`
}
// One dialog per page, filled from these templates on click.
const PERSON_KIT = `<!-- person card (build-revisions.mjs): no finds, no desk — who they are and swaps done -->
<style>[data-person-dialog][hidden]{display:none!important}
@media (max-width:767.98px){[data-person-dialog]{place-items:end center!important;padding:0!important}[data-person-box]{width:100%!important;border-radius:20px 20px 0 0!important;padding-bottom:max(24px,env(safe-area-inset-bottom))!important}}</style>
<div data-person-dialog hidden class="fixed inset-0 z-[70] bg-inverse-surface/40 grid place-items-center p-4"><div data-person-box role="dialog" aria-modal="true" class="w-[360px] max-w-full rounded-2xl bg-surface-container-lowest shadow-[0_24px_60px_rgba(31,27,24,0.3)] p-6"></div></div>
${Object.keys(PEOPLE).map((n) => `<template data-person-tpl="${n}">${personCard(n)}</template><template data-block-tpl="${n}">${blockStep(n)}</template>`).join('')}
<script>
(() => {
  const dlg = document.querySelector('[data-person-dialog]'), box = dlg.querySelector('[data-person-box]')
  const fill = (sel) => { const t = document.querySelector(sel); box.innerHTML = t ? t.innerHTML : '' }
  document.addEventListener('click', (e) => {
    const p = e.target.closest('[data-person]')
    if (p) { e.preventDefault(); e.stopPropagation(); p.closest('details')?.removeAttribute('open'); fill('[data-person-tpl="' + p.dataset.person + '"]'); dlg.hidden = false; return }
    const b = e.target.closest('[data-block]'); if (b) return fill('[data-block-tpl="' + b.dataset.block + '"]')
    if (e.target.closest('[data-person-close]') || e.target === dlg) dlg.hidden = true
  }, true)
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dlg.hidden = true })
})()
</script>`

// ── Your profile
const LOUD = 'whitespace-nowrap h-11 px-5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg shadow-[0_6px_18px_rgba(27,107,85,0.28)] inline-flex items-center justify-center gap-2'
const QUIET = 'whitespace-nowrap h-10 px-3.5 rounded-xl ring-1 ring-inset ring-outline-variant font-label-lg text-label-lg text-on-surface hover:bg-surface-container-low inline-flex items-center justify-center gap-1.5'
const label = (t) => `<p class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">${t}</p>`
const DONE = [
  [PH.leica, 'Leica Mini 35mm', PH.walkman, 'Sony Walkman WM-D6C', 'Samira P.', 'Sep 2026'],
  [PH.fender, 'Fender Champ Amp', PH.lamp, 'Brass Banker’s Lamp', 'Tomás R.', 'Sep 2026'],
  [PH.levis, 'Levi’s Denim Jacket', PH.blanket, 'Pendleton Wool Throw', 'Ines G.', 'Sep 2026'],
  [PH.braun, 'Braun Desk Clock', PH.pourover, 'Stoneware Pour-Over Set', 'Priya S.', 'Jul 2026'],
]
const identity = `<section class="p-6 flex flex-col gap-5">
<div class="flex items-center gap-4"><span class="relative shrink-0"><img alt="" class="w-20 h-20 rounded-full object-cover" src="${AVATAR_SRC}"><span title="Verified" class="absolute -bottom-0.5 -right-0.5 grid place-items-center w-7 h-7 rounded-full bg-surface-container-lowest">${filled('verified', 'text-[22px] text-primary')}</span></span>
<div class="min-w-0"><h1 class="font-headline-lg text-[28px] leading-8 text-on-surface">Maya L.</h1><p class="font-body-sm text-body-sm text-on-surface-variant">Silver Lake, Los Angeles</p><p class="font-body-sm text-[12px] text-outline">On Bartefy since 2025 · Verified</p></div></div>
<div class="grid grid-cols-2 gap-3"><div class="rounded-xl bg-surface-container-low px-4 py-3"><p class="font-display text-[32px] leading-9 font-semibold text-on-surface">7</p><p class="font-body-sm text-body-sm text-on-surface-variant">swaps done</p></div><a ${go('finds')} class="rounded-xl bg-surface-container-low px-4 py-3 hover:bg-surface-container-high"><p class="font-display text-[32px] leading-9 font-semibold text-on-surface">6</p><p class="font-body-sm text-body-sm text-on-surface-variant">on your table ›</p></a></div>
<div class="flex flex-wrap gap-2"><button type="button" data-open-dialog="edit" class="${QUIET}">${icon('edit', 'text-[18px]')}Edit profile</button></div>
</section>
<section class="mx-6 mb-6 rounded-xl border border-dashed border-outline/40 p-4 flex flex-col gap-3">
<p class="flex items-center gap-2 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">${icon('lock', 'text-[16px]')}Only you see this</p>
<a ${go('points')} class="flex items-center gap-3 -mx-2 px-2 py-1.5 rounded-lg hover:bg-surface-container-low">${icon('workspace_premium', 'text-[20px] text-on-surface-variant')}<span class="flex-1"><span class="block font-label-lg text-label-lg text-on-surface">Hunter</span><span class="block font-body-sm text-[12px] text-on-surface-variant">6 of 6 finds · 10 km</span></span>${icon('chevron_right', 'text-[20px] text-outline')}</a>
<a ${go('points')} class="flex items-center gap-3 -mx-2 px-2 py-1.5 rounded-lg hover:bg-surface-container-low">${icon('toll', 'text-[20px] text-on-surface-variant')}<span class="flex-1"><span class="block font-label-lg text-label-lg text-on-surface">420 pts</span><span class="block font-body-sm text-[12px] text-on-surface-variant">180 more for Collector</span></span>${icon('chevron_right', 'text-[20px] text-outline')}</a>
<div class="flex items-center gap-3 -mx-2 px-2 py-1.5">${icon('person_add', 'text-[20px] text-on-surface-variant')}<span class="flex-1"><span class="block font-label-lg text-label-lg text-on-surface">Invite code <span class="font-ticker-number">MAYA-42</span></span><span class="block font-body-sm text-[12px] text-on-surface-variant">+400 pts when a friend finishes their first swap</span></span><button type="button" data-missing="Invite link copied — bartefy.com/i/maya-42" class="h-8 px-3 rounded-lg ring-1 ring-inset ring-outline-variant font-label-md text-label-md text-primary">Copy</button></div>
</section>`
const doneRow = ([a, at, b, bt, who, when]) => `<li class="flex items-center gap-3 py-3"><span class="flex items-center gap-1.5 shrink-0"><img alt="" class="w-14 h-14 rounded-lg object-cover" src="${a}">${icon('sync_alt', 'text-[16px] text-on-surface-variant')}<img alt="" class="w-14 h-14 rounded-lg object-cover" src="${b}"></span><span class="min-w-0 flex-1"><span class="block font-label-lg text-label-lg text-on-surface truncate">${at} for ${bt}</span><span class="block font-body-sm text-[12px] text-on-surface-variant">with <button type="button" data-person="${who}" class="text-primary hover:underline">${who}</button> · ${when}</span></span><span class="font-ticker-number text-[13px] text-primary whitespace-nowrap">+160 pts</span></li>`
const editDialog = `<div data-dialog="edit" hidden class="v6-dialog fixed inset-0 z-[60] bg-inverse-surface/40 grid place-items-center p-4"><div role="dialog" aria-modal="true" class="v6-dialog-box w-[460px] max-w-full rounded-2xl bg-surface-container-lowest shadow-[0_24px_60px_rgba(31,27,24,0.3)] p-6 flex flex-col gap-5">
<p class="font-headline-sm text-headline-sm text-on-surface">Edit profile</p>
<div class="flex items-center gap-4"><img alt="" class="w-16 h-16 rounded-full object-cover" src="${AVATAR_SRC}"><button type="button" data-missing="Pick a new photo (camera roll or camera)" class="${QUIET}">${icon('photo_camera', 'text-[18px]')}Change photo</button></div>
<label class="flex flex-col gap-1.5"><span class="font-label-md text-label-md text-on-surface-variant">Your name</span><input value="Maya L." class="h-11 px-3 rounded-xl ring-1 ring-inset ring-outline-variant bg-surface-container-lowest font-body-md text-body-md outline-none focus:ring-2 focus:ring-primary/50"><span class="font-body-sm text-[12px] text-outline">First name and an initial is plenty.</span></label>
<div class="flex flex-col gap-1.5"><span class="font-label-md text-label-md text-on-surface-variant">Your area</span><div class="flex items-center gap-3 h-11 px-3 rounded-xl bg-surface-container-low">${icon('location_on', 'text-[18px] text-primary')}<span class="flex-1 font-body-md text-body-md">Silver Lake, Los Angeles</span><button type="button" data-missing="Changing your area opens the city picker" class="font-label-md text-label-md text-primary">Change</button></div><span class="font-body-sm text-[12px] text-outline">Only the area shows — never your address.</span></div>
<div class="flex justify-end gap-2"><button type="button" data-close class="h-11 px-4 rounded-xl font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high">Cancel</button><button type="button" data-close data-missing="Saved" class="${LOUD}">Save</button></div></div></div>`

const body = `<!-- Profile R2 (build-revisions.mjs): who you are | how others see you + your swaps -->
<style>[data-profile] [hidden]{display:none!important}.v6-dialog[hidden]{display:none!important}
@media (max-width:1023.98px){[data-profile]{display:block;padding:0}[data-profile]>*{border-radius:0!important;box-shadow:none!important}[data-profile] .overflow-y-auto{overflow:visible}[data-prof-main]{border-top:8px solid rgb(245 244 239)}}
@media (max-width:767.98px){[data-profile]{margin-top:-24px}.v6-dialog{place-items:end center;padding:0}.v6-dialog-box{width:100%;border-radius:20px 20px 0 0;padding-bottom:max(16px,env(safe-area-inset-bottom))}[data-prof-cols]{grid-template-columns:1fr!important}}</style>
<div data-profile class="px-margin md:px-gutter-desktop pt-6 pb-6 flex flex-col lg:flex-row gap-6 lg:h-[calc(100dvh-80px)]">
<aside class="lg:w-[clamp(340px,26vw,420px)] lg:shrink-0 min-h-0 rounded-xl bg-surface-container-lowest ring-1 ring-surface-variant/70 overflow-hidden flex flex-col"><div class="flex-1 min-h-0 overflow-y-auto">${identity}</div></aside>
<section data-prof-main class="flex-1 min-w-0 min-h-0 rounded-xl bg-surface-container-lowest ring-1 ring-surface-variant/70 overflow-hidden flex flex-col"><div class="flex-1 min-h-0 overflow-y-auto p-6">
<div data-prof-cols class="grid gap-8" style="grid-template-columns:minmax(280px,340px) 1fr">
<div class="flex flex-col gap-3">${label('How others see you')}<div class="rounded-2xl ring-1 ring-surface-variant p-6">${personCard('Maya L.', { preview: true })}</div><p class="font-body-sm text-[12px] text-on-surface-variant">This is all anyone sees when they tap your name — never your finds, your points or your tier.</p></div>
<div class="flex flex-col gap-2 min-w-0">${label('Your finished swaps')}<ul class="divide-y divide-surface-variant">${DONE.map(doneRow).join('')}</ul><p class="font-body-sm text-[12px] text-outline">Only you see this list.</p></div>
</div></div></section></div>
${editDialog}
<script>
(() => {
  const closeAll = () => document.querySelectorAll('[data-dialog]').forEach((d) => (d.hidden = true))
  document.addEventListener('click', (e) => {
    const o = e.target.closest('[data-open-dialog]'); if (o) { document.querySelector('[data-dialog="' + o.dataset.openDialog + '"]').hidden = false; return }
    if (e.target.closest('[data-close]') || e.target.matches('[data-dialog]')) closeAll()
  })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll() })
  if (location.hash === '#edit') document.querySelector('[data-dialog="edit"]').hidden = false
})()
</script>
`
{
  let s = read('stitch/11-profile-shell.html').replace('<title>', '<title>PROFILE (R2) · ')
  const a = s.indexOf('<!-- Subtle Ambient Glow Canvas -->'), b = s.indexOf('<!-- FAST LISTING DRAWER')
  if (a < 0 || b < 0) throw new Error('profile: content markers not found')
  s = s.slice(0, a) + body + s.slice(b)
  const h = s.indexOf('<header data-organism="topbar" data-variant="desktop"'), he = s.indexOf('</header>', h)
  const keep = LINK_BASE; LINK_BASE = ''
  s = s.slice(0, h) + topbar({ fixed: true, cls: 'max-md:hidden', context: '<h1 class="font-headline-md text-headline-md text-on-surface shrink-0">Profile</h1>' }) + s.slice(he + '</header>'.length)
  LINK_BASE = keep
  write('stitch/12-profile-b.html', s)
}

V6_KIT.person = PERSON_KIT
// The person card rides along on every page with a name to tap.
for (const f of ['stitch/02-discover-desktop-r1.html', 'stitch/04-active-swaps-volume-b.html', 'stitch/08-my-finds-b.html', 'stitch/08-my-finds-b-50.html', 'stitch/12-profile-b.html']) {
  const s = read(f)
  if (s.includes('data-person-dialog')) continue
  write(f, s.replace('</body>', `${PERSON_KIT}\n</body>`))
}
// R1's public desk page is retired — remove the file so nothing links to it.
try { fs.unlinkSync(path.join(here, 'stitch/12-profile-julian-b.html')) } catch (e) {}

// Phone sheet
{
  const frame = (file, hash = '') => `<div class="rounded-[28px] overflow-hidden ring-1 ring-outline-variant bg-background shadow-md" style="width:390px;height:844px"><iframe src="../${file}${hash}" width="390" height="844" class="border-0 block" title="${file}${hash}"></iframe></div>`
  write('stitch/organisms/profile-phone-r1.html', `<!DOCTYPE html><html lang="en">
<!-- Profile — phone. Generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-surface-container-low font-body-md text-on-surface antialiased p-10">
<h1 class="font-headline-lg text-headline-lg mb-2">Profile + person card — phone</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-8 max-w-3xl">Nobody browses anyone’s finds (Alex, 2026-09-28): tapping a name opens the person card — who they are and swaps done, nothing else. <b>Every frame is the real page</b> — in frame 3, tap “Julian R.” on the card.</p>
<div class="flex flex-wrap items-start gap-10">
${state('mine', '1 · Your profile', 'Who you are, Only you see this, then how others see you and your swaps.', 390, frame('12-profile-b.html'))}
${state('edit', '1b · Edit profile', 'Photo, name, area — never an address.', 390, frame('12-profile-b.html', '#edit'))}
${state('deck', '2 · Tap a name on a card…', 'Discover: the owner’s name is the way in. No “Desk” pill any more.', 390, frame('02-discover-desktop-r1.html'))}
</div></body></html>`)
}
}

/* ───────────────────────────── Settings, proposal B ─────────────────────────────
 * Alex, 2026-09-28: "we can go for Settings." Decided 2026-09-27: ONE page with
 * sections; the account menu (and the phone You sheet) opens it. Same pattern
 * as Swaps: sections on the left, the one you picked on the right, one screen.
 * Phone: the section list IS the page; a section opens full screen.
 *
 * Only what Settings.tsx has today: sign-in email, area, language (6 packs),
 * appearance (light / dark / match device), the three notification switches
 * (notif_match, notif_push, notif_email), membership, blocked people with
 * Unblock, replay the guidance, sign out, delete account, the build stamp.
 * Added: "Who sees what" — the person-card rule, written down for users. */
{
const SW = (on, label) => `<button type="button" role="switch" aria-checked="${on}" aria-label="${label}" data-switch class="relative w-12 h-7 rounded-full shrink-0 transition-colors bg-surface-variant aria-checked:bg-primary"><span class="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform"></span></button>`
const row = (title, sub, control, attrs = '') => `<div ${attrs} class="flex items-center gap-4 py-4"><div class="min-w-0 flex-1"><p class="font-label-lg text-label-lg text-on-surface">${title}</p>${sub ? `<p class="font-body-sm text-body-sm text-on-surface-variant">${sub}</p>` : ''}</div>${control}</div>`
const QUIET = 'whitespace-nowrap h-10 px-3.5 rounded-xl ring-1 ring-inset ring-outline-variant font-label-lg text-label-lg text-on-surface hover:bg-surface-container-low inline-flex items-center justify-center gap-1.5'
const LOUD = 'whitespace-nowrap h-11 px-5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg inline-flex items-center justify-center gap-2'
const LANGS = [['en', 'English', 'The original — everything else is translated from it'], ['de', 'Deutsch', ''], ['fr', 'Français', ''], ['es', 'Español', ''], ['lv', 'Latviešu', ''], ['ka', 'ქართული', '']]
const BLOCKED = [['Rick D.', 'Blocked 3 weeks ago'], ['Anna P.', 'Blocked in August']]
const themeCard = (id, label, on) => `<button type="button" data-theme-choice="${id}" aria-pressed="${on}" class="group flex flex-col gap-2 text-left">
<span class="block w-full aspect-[4/3] rounded-xl ring-2 ring-transparent group-aria-pressed:ring-primary overflow-hidden ${id === 'dark' ? 'bg-[#17191E]' : id === 'light' ? 'bg-[#F5F4EF]' : 'bg-[linear-gradient(135deg,#F5F4EF_50%,#17191E_50%)]'} p-3"><span class="block h-2.5 w-2/3 rounded-full ${id === 'dark' ? 'bg-white/20' : 'bg-[#17191E]/15'}"></span><span class="mt-2 block h-12 rounded-lg ${id === 'dark' ? 'bg-white/10' : 'bg-white'}"></span><span class="mt-2 block h-2.5 w-1/3 rounded-full bg-[#1B6B55]"></span></span>
<span class="flex items-center gap-2 font-label-lg text-label-lg text-on-surface"><span class="grid place-items-center w-5 h-5 rounded-full ring-2 ring-outline-variant group-aria-pressed:ring-primary"><span class="w-2.5 h-2.5 rounded-full bg-primary opacity-0 group-aria-pressed:opacity-100"></span></span>${label}</span></button>`

const SECTIONS = [
  { id: 'account', ic: 'person', t: 'Account', sum: 'maya.l@example.com · Silver Lake', body: `
${row('Email', 'maya.l@example.com — you sign in with a 6-digit code sent here. No password to forget.', '')}
<div class="h-px bg-surface-variant"></div>
${row('Your area', 'Silver Lake, Los Angeles — only the area shows, never an address.', `<button type="button" data-missing="Changing your area opens the city picker" class="${QUIET}">Change</button>`)}
<div class="h-px bg-surface-variant"></div>
${row('Name and photo', 'Maya L.', `<a href="12-profile-b.html#edit" class="${QUIET}">Edit in Profile</a>`)}
<div class="h-px bg-surface-variant"></div>
${row('Sign out', 'On this device. Your finds and swaps stay as they are.', `<button type="button" data-missing="Signed out (not part of the mock)" class="${QUIET}">${icon('logout', 'text-[18px]')}Sign out</button>`)}
<div class="mt-8 rounded-xl bg-surface-container-low p-4 flex items-center gap-4"><div class="min-w-0 flex-1"><p class="font-label-lg text-label-lg text-on-surface">Delete account</p><p class="font-body-sm text-body-sm text-on-surface-variant">Your finds leave Bartefy and you’re signed out. This can’t be undone.</p></div><button type="button" data-open-dialog="delete" class="${QUIET}">Delete…</button></div>` },
  { id: 'notifications', ic: 'notifications', t: 'Notifications', sum: 'Bartefys and messages', body: `
${row('When something is a bartefy', 'Someone accepts your offer, or you both confirm a swap.', SW(true, 'When something is a bartefy'))}
<div class="h-px bg-surface-variant"></div>
${row('New messages', 'A push when someone writes to you in a swap.', SW(true, 'New messages'))}
<div class="h-px bg-surface-variant"></div>
${row('Email me a summary', 'One email now and then with what you missed.', SW(false, 'Email me a summary'))}
<p class="mt-4 font-body-sm text-[12px] text-outline">Push needs your browser’s permission. If nothing arrives, check it there.</p>` },
  { id: 'language', ic: 'translate', t: 'Language', sum: 'English', body: `
<p class="mb-3 font-body-sm text-body-sm text-on-surface-variant">Bartefy is written in English and translated from it. Anything not translated yet shows in English.</p>
<div class="flex flex-col">${LANGS.map(([id, name, note], i) => `<label class="flex items-center gap-4 py-3 ${i ? 'border-t border-surface-variant' : ''} cursor-pointer"><input type="radio" name="v6-lang" ${id === 'en' ? 'checked' : ''} class="w-5 h-5 accent-[#1B6B55]"><span class="flex-1"><span class="block font-label-lg text-label-lg text-on-surface">${name}</span>${note ? `<span class="block font-body-sm text-[12px] text-on-surface-variant">${note}</span>` : ''}</span><span class="font-ticker-number text-[12px] text-outline uppercase">${id}</span></label>`).join('')}</div>` },
  { id: 'appearance', ic: 'contrast', t: 'Appearance', sum: 'Match my device', body: `
<div data-theme-row class="grid grid-cols-3 gap-4 pt-1">${themeCard('light', 'Light', false)}${themeCard('dark', 'Dark', false)}${themeCard('system', 'Match my device', true)}</div>
<p class="mt-4 font-body-sm text-[12px] text-outline">Dark is on its way in V6 — until then it falls back to light.</p>` },
  { id: 'privacy', ic: 'shield_person', t: 'Privacy & blocked people', sum: `${BLOCKED.length} blocked`, body: `
<div class="rounded-xl bg-surface-container-low p-4 flex gap-3">${icon('visibility', 'text-[20px] text-on-surface-variant')}<div><p class="font-label-lg text-label-lg text-on-surface">Who sees what</p><p class="font-body-sm text-body-sm text-on-surface-variant">Tapping your name shows your photo, name, area and how many swaps you’ve done — nothing else. Nobody can look through your finds; they reach people only through the deck, at random. <a href="12-profile-b.html" class="text-primary hover:underline">See how others see you</a></p></div></div>
<p class="mt-6 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Blocked people</p>
<p class="mt-1 font-body-sm text-body-sm text-on-surface-variant">They can’t see your finds or message you, and you won’t see theirs.</p>
<ul data-blocked class="mt-2">${BLOCKED.map(([n, when]) => `<li class="flex items-center gap-3 py-3 border-t border-surface-variant"><span class="w-10 h-10 rounded-full grid place-items-center bg-stone text-ink text-[13px] font-bold">${n.split(' ').map((w) => w[0]).join('').replace('.', '')}</span><span class="flex-1"><span class="block font-label-lg text-label-lg text-on-surface">${n}</span><span class="block font-body-sm text-[12px] text-on-surface-variant">${when}</span></span><button type="button" data-unblock="${n}" class="${QUIET}">Unblock</button></li>`).join('')}</ul>
<p class="mt-4 font-body-sm text-[12px] text-outline">Blocking and reporting are always free, on every tier.</p>` },
  { id: 'membership', ic: 'workspace_premium', t: 'Membership', sum: 'Hunter · free', body: `
${row('Hunter', '6 finds on the table · 3 swaps on the go · 10 km', `<a ${go('points')} class="${QUIET}">Points &amp; tiers</a>`)}
<p class="font-body-sm text-body-sm text-on-surface-variant">Tiers are paid with points and last 30 days. Everything about them lives on Points &amp; tiers.</p>` },
  { id: 'help', ic: 'help', t: 'Help', sum: 'Tips, version', body: `
${row('Show the guidance again', 'Replays the welcome tour and brings back every tip you dismissed.', `<button type="button" data-missing="The welcome tour starts again" class="${QUIET}">Show again</button>`)}
<div class="h-px bg-surface-variant"></div>
${row('Version', 'Bartefy v6.0.0 · build 8e6d1c3', `<button type="button" data-missing="Version copied" class="${QUIET}">${icon('content_copy', 'text-[18px]')}Copy</button>`)}
<div class="mt-6 pt-5 border-t border-surface-variant">${orzomiByline()}</div>` },
]
const BACK = `<button type="button" data-back aria-label="Back to Settings" class="place-items-center w-10 h-10 -ml-2 rounded-full text-on-surface hover:bg-surface-container-high shrink-0">${icon('arrow_back', 'text-[22px]')}</button>`
const nav = `<nav aria-label="Settings" class="flex flex-col gap-0.5 p-2">${SECTIONS.map((x) => `<button type="button" data-pick="${x.id}" aria-selected="false" class="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-surface-container-high aria-selected:bg-primary-container"><span class="grid place-items-center w-9 h-9 rounded-lg bg-surface-container-low text-on-surface-variant shrink-0">${icon(x.ic, 'text-[20px]')}</span><span class="min-w-0 flex-1"><span class="block font-label-lg text-label-lg text-on-surface">${x.t}</span><span class="block truncate font-body-sm text-[12px] text-on-surface-variant">${x.sum}</span></span>${icon('chevron_right', 'text-[20px] text-outline')}</button>`).join('')}</nav>`
const panes = SECTIONS.map((x) => `<article data-detail="${x.id}" hidden class="h-full flex flex-col"><header class="shrink-0 flex items-center gap-2 px-6 pt-5 pb-2">${BACK}<h2 class="font-headline-md text-headline-md text-on-surface">${x.t}</h2></header><div class="flex-1 min-h-0 overflow-y-auto px-6 pb-6"><div class="max-w-[640px]">${x.body}</div></div></article>`).join('\n')
const dialogs = `<div data-dialog="delete" hidden class="v6-dialog fixed inset-0 z-[60] bg-inverse-surface/40 grid place-items-center p-4"><div role="dialog" aria-modal="true" class="v6-dialog-box w-[440px] max-w-full rounded-2xl bg-surface-container-lowest shadow-[0_24px_60px_rgba(31,27,24,0.3)] p-6 flex flex-col gap-4">
<p class="font-headline-sm text-headline-sm text-on-surface">Delete your account?</p><p class="font-body-md text-body-md text-on-surface-variant">Your finds leave Bartefy, swaps in progress are called off, and you’re signed out. This can’t be undone.</p>
<label class="flex flex-col gap-1.5"><span class="font-label-md text-label-md text-on-surface-variant">Type DELETE to confirm</span><input data-delete-input class="h-11 px-3 rounded-xl ring-1 ring-inset ring-outline-variant font-body-md text-body-md outline-none focus:ring-2 focus:ring-primary/50"></label>
<div class="flex justify-end gap-2"><button type="button" data-close class="h-11 px-4 rounded-xl font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high">Keep my account</button><button type="button" data-delete-go disabled data-close data-missing="Deletion requested — you’re signed out" class="${LOUD} disabled:opacity-40">Delete</button></div></div></div>
<div data-dialog="unblock" hidden class="v6-dialog fixed inset-0 z-[60] bg-inverse-surface/40 grid place-items-center p-4"><div role="dialog" aria-modal="true" class="v6-dialog-box w-[400px] max-w-full rounded-2xl bg-surface-container-lowest shadow-[0_24px_60px_rgba(31,27,24,0.3)] p-6 flex flex-col gap-4">
<p class="font-headline-sm text-headline-sm text-on-surface">Unblock <span data-unblock-name></span>?</p><p class="font-body-md text-body-md text-on-surface-variant">You’ll both see each other’s finds in your decks and can message again.</p>
<div class="flex justify-end gap-2"><button type="button" data-close class="h-11 px-4 rounded-xl font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-high">Cancel</button><button type="button" data-unblock-go data-close class="${LOUD}">Unblock</button></div></div></div>`

const body = `<!-- Settings, proposal B (build-revisions.mjs): sections | the section -->
<style>[data-settings] [hidden]{display:none!important}.v6-dialog[hidden]{display:none!important}
[data-back]{display:none}
@media (max-width:1023.98px){
  [data-settings]{display:block;padding:0}
  [data-settings-nav]{border-radius:0!important;box-shadow:none!important;min-height:calc(100dvh - 80px)}
  [data-settings-pane]{position:fixed;inset:0;z-index:60;border-radius:0!important;display:none}
  html.settings-open [data-settings-pane]{display:block}
  html.settings-open{overflow:hidden}
  [data-back]{display:grid}
}
@media (max-width:767.98px){
  [data-settings]{margin-top:-24px}
  [data-settings-nav]{min-height:calc(100dvh - 56px - 64px)}
  [data-theme-row]{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
  .v6-dialog{place-items:end center;padding:0}.v6-dialog-box{width:100%;border-radius:20px 20px 0 0;padding-bottom:max(16px,env(safe-area-inset-bottom))}
}
@media (min-width:768px){[data-phone-title]{display:none!important}}
[data-switch][aria-checked="true"]>span{transform:translateX(20px)}
/* Big screens (Alex reviews at ~1920): short sections left the pane half
   empty, so from 1600px every section shows at once, in three columns —
   nothing to click through. */
@media (min-width:1600px){
  [data-settings-nav]{display:none}
  [data-settings-pane]{background:transparent!important;box-shadow:none!important;overflow-y:auto!important;columns:3;column-gap:24px}
  [data-settings-pane]>[data-detail]{display:block!important;height:auto;break-inside:avoid;margin-bottom:24px;border-radius:12px;background:#fff;box-shadow:0 0 0 1px rgb(237 235 228 / .7)}
  [data-settings-pane]>[data-detail] .overflow-y-auto{overflow:visible}
  [data-settings-pane] .max-w-\[640px\]{max-width:none}
  [data-theme-row]{gap:10px}
}</style>
<div data-settings class="px-margin md:px-gutter-desktop pt-6 pb-6 flex flex-col lg:flex-row gap-6 lg:h-[calc(100dvh-80px)]">
<aside data-settings-nav class="lg:w-[clamp(320px,26vw,400px)] lg:shrink-0 min-h-0 rounded-xl bg-surface-container-lowest ring-1 ring-surface-variant/70 overflow-y-auto">
<div data-phone-title class="px-5 pt-4"><h1 class="font-headline-md text-headline-md text-on-surface">Settings</h1></div>${nav}</aside>
<section data-settings-pane class="flex-1 min-w-0 min-h-0 rounded-xl bg-surface-container-lowest ring-1 ring-surface-variant/70 overflow-hidden">${panes}</section></div>
${dialogs}
<script>
(() => {
  const compact = () => matchMedia('(max-width:1023.98px)').matches
  const pick = (id, open = true) => {
    if (open && compact()) document.documentElement.classList.add('settings-open')
    if (open || !compact()) document.querySelectorAll('[data-pick]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.pick === id)))
    document.querySelectorAll('[data-detail]').forEach((d) => (d.hidden = d.dataset.detail !== id))
    try { history.replaceState(null, '', '#' + id) } catch (e) {}
  }
  const dlg = (id) => document.querySelector('[data-dialog="' + id + '"]')
  const closeAll = () => document.querySelectorAll('[data-dialog]').forEach((d) => (d.hidden = true))
  let unblocking = null
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-back]')) return document.documentElement.classList.remove('settings-open')
    const r = e.target.closest('[data-pick]'); if (r) return pick(r.dataset.pick)
    const sw = e.target.closest('[data-switch]'); if (sw) return sw.setAttribute('aria-checked', String(sw.getAttribute('aria-checked') !== 'true'))
    const th = e.target.closest('[data-theme-choice]'); if (th) { document.querySelectorAll('[data-theme-choice]').forEach((x) => x.setAttribute('aria-pressed', String(x === th))); return }
    const o = e.target.closest('[data-open-dialog]'); if (o) { dlg(o.dataset.openDialog).hidden = false; return }
    const u = e.target.closest('[data-unblock]'); if (u) { unblocking = u; document.querySelector('[data-unblock-name]').textContent = u.dataset.unblock; dlg('unblock').hidden = false; return }
    if (e.target.closest('[data-unblock-go]') && unblocking) { unblocking.closest('li').remove(); unblocking = null }
    if (e.target.closest('[data-close]') || e.target.matches('[data-dialog]')) closeAll()
  })
  document.addEventListener('input', (e) => { if (e.target.matches('[data-delete-input]')) document.querySelector('[data-delete-go]').disabled = e.target.value.trim() !== 'DELETE' })
  document.addEventListener('keydown', (e) => { if (e.key !== 'Escape') return; if ([...document.querySelectorAll('[data-dialog]')].some((d) => !d.hidden)) closeAll(); else document.documentElement.classList.remove('settings-open') })
  const [h, flag] = location.hash.slice(1).split('+')
  const known = !!document.querySelector('[data-pick="' + h + '"]')
  pick(known ? h : 'account', known)
  if (flag) { const d = dlg(flag); if (d) d.hidden = false }
})()
</script>
`
let s = read('stitch/11-profile-shell.html').replace('<title>', '<title>SETTINGS (B) · ')
const a = s.indexOf('<!-- Subtle Ambient Glow Canvas -->'), b = s.indexOf('<!-- FAST LISTING DRAWER')
if (a < 0 || b < 0) throw new Error('settings B: content markers not found')
s = s.slice(0, a) + body + s.slice(b)
const h = s.indexOf('<header data-organism="topbar" data-variant="desktop"'), he = s.indexOf('</header>', h)
const keep = LINK_BASE; LINK_BASE = ''
s = s.slice(0, h) + topbar({ fixed: true, cls: 'max-md:hidden', context: '<h1 class="font-headline-md text-headline-md text-on-surface shrink-0">Settings</h1>' }) + s.slice(he + '</header>'.length)
LINK_BASE = keep
write('stitch/13-settings-b.html', s)

// Every "Settings" entry point now goes here.
for (const f of ['stitch/02-discover-desktop-r1.html', 'stitch/04-active-swaps-desktop-r1.html', 'stitch/04-active-swaps-volume-b.html', 'stitch/06-points-tiers-desktop-r1.html', 'stitch/06-points-b.html', 'stitch/08-my-finds-desktop-r1.html', 'stitch/08-my-finds-b.html', 'stitch/08-my-finds-b-50.html', 'stitch/12-profile-b.html', 'stitch/13-settings-b.html']) {
  write(f, read(f).replaceAll('href="#" data-missing="Settings has no V6 design yet"', 'href="13-settings-b.html"'))
}
{
  const frame = (hash = '') => `<div class="rounded-[28px] overflow-hidden ring-1 ring-outline-variant bg-background shadow-md" style="width:390px;height:844px"><iframe src="../13-settings-b.html${hash}" width="390" height="844" class="border-0 block" title="settings ${hash}"></iframe></div>`
  write('stitch/organisms/settings-phone-r1.html', `<!DOCTYPE html><html lang="en">
<!-- Settings — phone. Generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-surface-container-low font-body-md text-on-surface antialiased p-10">
<h1 class="font-headline-lg text-headline-lg mb-2">Settings — phone</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-8 max-w-3xl">The section list is the page; each section opens full screen with a back arrow. <b>Every frame is the real page.</b></p>
<div class="flex flex-wrap items-start gap-10">
${state('list', '1 · Sections', 'Each row says what it’s set to right now.', 390, frame(''))}
${state('account', '2 · Account', 'Email (code sign-in), area, name/photo → Profile, sign out; Delete sits apart at the bottom.', 390, frame('#account'))}
${state('notif', '3 · Notifications', 'The three switches the app has.', 390, frame('#notifications'))}
${state('look', '4 · Appearance', 'Light · Dark · Match my device.', 390, frame('#appearance'))}
${state('privacy', '5 · Privacy & blocked people', 'Who sees what (the person-card rule), and Unblock.', 390, frame('#privacy'))}
${state('delete', '6 · Delete account', 'A bottom sheet; type DELETE to unlock the button.', 390, frame('#account+delete'))}
</div></body></html>`)
}
}

/* ───────────────────────────── Notifications, proposal B ─────────────────────────────
 * Alex, 2026-09-28: "start one by one, simplest first." The bell's full page.
 * Only the kinds the app sends (Notifications.tsx + notif.* strings): offer,
 * match (accepted), completed, cancelled, eyeing (people on the Eyeing page —
 * replaces wishlist/gone: no saving, Alex 2026-09-29), message, voice. Each row carries the
 * FIND's photo (Alex: images get the room) with the kind as a small badge,
 * and goes straight to where it's about. Right: "Needs you now" — the same
 * jumps My finds and Swaps use — so a big screen isn't half empty. */
{
const face = (alt) => { for (const h of [S1, S2, S4, S5]) if (h.includes(`data-alt="${alt}`)) return imgByAlt(h, alt); throw new Error(alt) }
const KIND = {
  offer: ['local_offer', 'bg-coral text-ink'], match: ['handshake', 'bg-primary text-on-primary'], completed: ['task_alt', 'bg-primary text-on-primary'],
  cancelled: ['block', 'bg-stone text-ink'], eyeing: ['visibility', 'bg-sun text-ink'],
  message: ['chat', 'bg-sky text-ink'], voice: ['mic', 'bg-sky text-ink'],
}
const S = '04-active-swaps-volume-b.html', F = '08-my-finds-b.html'
const FEED = [
  ['Today', [
    ['offer', true, PH.fender, 'Marcus V. wants your Marantz 2215B', 'He offers his Fender Vibro-Champ Amp · 3h 44m left to answer', '9:14', `${S}#o1`],
    ['voice', true, WALKMAN, 'New voice note from Samira', '0:12 · about the Walkman swap', '8:52', `${S}#a1`],
    ['message', true, PH.lamy, 'New message from Aiko', '“Sounds good. Send me a time that works.”', '8:03', `${S}#a7`],
  ]],
  ['Yesterday', [
    ['match', false, OLYMPUS, 'It’s a swap — say hello to Julian', 'Your Sansui AU-217 for his Olympus OM-1 · both off the deck', '18:40', `${S}#a9`],
    ['completed', false, PH.lamp, 'Swap finished · +160 pts', 'Minolta X-700 for Brass Banker’s Lamp, with Tomás', '16:22', '12-profile-b.html'],
    ['offer', false, OLYMPUS, 'Julian sent a Super offer', 'His Olympus OM-1 for your Fuji X100 Half-Case · 14h left', '11:05', `${S}#o3`],
  ]],
  ['Earlier', [
    ['eyeing', false, PH.marantz, '4 new admirers', 'Collector shows who — and you can swap on the spot', 'Mon', '20-admirers-b.html'],
    ['cancelled', false, PH.planter, 'Omar called off a swap', 'Your Red Wing Moc Toes are back in the deck', 'Sat', `${S}`],
    ['completed', false, PH.walkman, 'Swap finished · +160 pts', 'Pentax K1000 for Wool Fisherman Sweater, with Ines', 'Sat', '12-profile-b.html'],
  ]],
]
const UNREAD = FEED.flatMap((g) => g[1]).filter((r) => r[1]).length
const row = ([k, unread, src, t, b, at, href]) => `<li data-row data-unread="${unread}"><a href="${href}" class="group flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-surface-container-low">
<span class="relative shrink-0"><img alt="" class="w-16 h-16 rounded-xl object-cover" src="${src}"><span class="absolute -bottom-1.5 -right-1.5 grid place-items-center w-7 h-7 rounded-full ring-2 ring-surface-container-lowest ${KIND[k][1]}">${icon(KIND[k][0], 'text-[15px]')}</span></span>
<span class="min-w-0 flex-1"><span class="flex items-center gap-2"><span class="font-label-lg text-[15px] ${unread ? 'text-on-surface font-bold' : 'text-on-surface-variant font-semibold'} truncate">${t}</span>${unread ? '<span data-dot class="w-2 h-2 rounded-full bg-primary shrink-0"></span>' : ''}</span><span class="block font-body-sm text-body-sm ${unread ? 'text-on-surface' : 'text-on-surface-variant'} truncate">${b}</span></span>
<span class="shrink-0 font-body-sm text-[12px] text-outline">${at}</span></a></li>`
const NEEDS = [
  ['local_offer', '2 offers end today', 'Marcus · 3h 44m, Elena · 11h 20m', `${S}#o1`, 'bg-coral/70 text-ink'],
  ['task_alt', 'Your turn to confirm', 'Samira and Noah already did', `${S}#a1`, 'bg-mint text-forest'],
  ['schedule', 'Fuji X100 case leaves the deck in 3 days', 'Renew it for free', `${F}#cameras-1`, 'bg-sun/60 text-ink'],
]
const needCard = ([ic, t, b, href, tone]) => `<a href="${href}" class="flex items-center gap-3 rounded-xl ring-1 ring-surface-variant p-3 hover:bg-surface-container-low"><span class="grid place-items-center w-10 h-10 rounded-xl ${tone} shrink-0">${icon(ic, 'text-[20px]')}</span><span class="min-w-0 flex-1"><span class="block font-label-lg text-label-lg text-on-surface">${t}</span><span class="block font-body-sm text-[12px] text-on-surface-variant">${b}</span></span>${icon('chevron_right', 'text-[20px] text-outline')}</a>`
const needChip = ([ic, t, b, href, tone]) => `<a href="${href}" class="shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-full ${tone} font-label-md text-label-md whitespace-nowrap">${icon(ic, 'text-[16px]')}${t}</a>`

const body = `<!-- Notifications, proposal B (build-revisions.mjs): feed | needs you now -->
<style>[data-notifs] [hidden]{display:none!important}.v6-strip{scrollbar-width:none}.v6-strip::-webkit-scrollbar{display:none}
[data-needs-chips]{display:none}
@media (max-width:1023.98px){[data-notifs]{display:block;padding:0}[data-notifs]>*{border-radius:0!important;box-shadow:none!important}[data-notifs] .overflow-y-auto{overflow:visible}[data-needs-rail]{display:none}[data-needs-chips]{display:flex}}
@media (max-width:767.98px){[data-notifs]{margin-top:-24px}[data-feed] a{padding-left:8px;padding-right:8px}}</style>
<div data-notifs class="px-margin md:px-gutter-desktop pt-6 pb-6 flex flex-col lg:flex-row gap-6 lg:h-[calc(100dvh-80px)]">
<section class="flex-1 min-w-0 min-h-0 rounded-xl bg-surface-container-lowest ring-1 ring-surface-variant/70 overflow-hidden flex flex-col">
<div class="shrink-0 flex flex-wrap items-center gap-2 px-5 pt-4 pb-3 border-b border-surface-variant">
<h1 data-phone-title class="md:hidden w-full font-headline-md text-headline-md text-on-surface">Notifications</h1>
${['All', 'Unread'].map((x, i) => `<button type="button" data-filter="${x.toLowerCase()}" aria-pressed="${i === 0}" class="whitespace-nowrap h-8 px-3 rounded-full ring-1 ring-inset ring-outline-variant font-label-md text-label-md text-on-surface-variant aria-pressed:bg-ink aria-pressed:text-white aria-pressed:ring-ink">${x}${i ? ` <span data-unread-count>${UNREAD}</span>` : ''}</button>`).join('')}
<button type="button" data-mark-all class="ml-auto whitespace-nowrap h-8 px-3 rounded-lg font-label-md text-label-md text-primary hover:bg-surface-container-low">Mark all read</button></div>
<div data-needs-chips class="shrink-0 gap-2 overflow-x-auto v6-strip px-5 pt-3">${NEEDS.map(needChip).join('')}</div>
<div data-feed class="flex-1 min-h-0 overflow-y-auto px-3 pb-4">${FEED.map(([day, rows]) => `<section data-day class="pt-4"><p class="px-4 pb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">${day}</p><ul>${rows.map(row).join('')}</ul></section>`).join('')}
<div data-all-read hidden class="py-16 text-center"><span class="inline-grid place-items-center w-12 h-12 rounded-full bg-surface-container-low text-outline">${icon('notifications', 'text-[24px]')}</span><p class="mt-3 font-label-lg text-label-lg text-on-surface">You’re all caught up</p><p class="mt-1 font-body-sm text-body-sm text-on-surface-variant">Offers, matches and finished swaps show up here.</p></div></div>
</section>
<aside data-needs-rail class="lg:w-[clamp(320px,26vw,400px)] lg:shrink-0 min-h-0 rounded-xl bg-surface-container-lowest ring-1 ring-surface-variant/70 overflow-y-auto p-5 flex flex-col gap-3 self-start">
<p class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Needs you now</p>${NEEDS.map(needCard).join('')}
<p class="pt-2 font-body-sm text-[12px] text-outline">Push and email for these are in <a href="13-settings-b.html#notifications" class="text-primary hover:underline">Settings</a>.</p></aside></div>
<script>
(() => {
  let filter = 'all'
  const apply = () => {
    document.querySelectorAll('[data-row]').forEach((r) => (r.hidden = filter === 'unread' && r.dataset.unread !== 'true'))
    document.querySelectorAll('[data-day]').forEach((d) => (d.hidden = ![...d.querySelectorAll('[data-row]')].some((r) => !r.hidden)))
    document.querySelector('[data-all-read]').hidden = [...document.querySelectorAll('[data-row]')].some((r) => !r.hidden)
  }
  document.addEventListener('click', (e) => {
    const f = e.target.closest('[data-filter]')
    if (f) { filter = f.dataset.filter; document.querySelectorAll('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === f))); return apply() }
    if (e.target.closest('[data-mark-all]')) {
      document.querySelectorAll('[data-row][data-unread="true"]').forEach((r) => { r.dataset.unread = 'false'; r.querySelector('[data-dot]')?.remove(); r.querySelectorAll('.text-on-surface').forEach((x) => x.classList.replace('text-on-surface', 'text-on-surface-variant')); r.querySelector('.font-bold')?.classList.replace('font-bold', 'font-semibold') })
      document.querySelector('[data-unread-count]').textContent = '0'; apply()
    }
  })
  if (location.hash === '#unread') document.querySelector('[data-filter="unread"]').click()
  if (location.hash === '#caught-up') { document.querySelector('[data-mark-all]').click(); document.querySelector('[data-filter="unread"]').click() }
})()
</script>
`
let s = read('stitch/11-plain-shell.html').replace('<title>', '<title>NOTIFICATIONS (B) · ')
const a = s.indexOf('<!-- Subtle Ambient Glow Canvas -->'), b = s.indexOf('<!-- FAST LISTING DRAWER')
if (a < 0 || b < 0) throw new Error('notifications B: content markers not found')
s = s.slice(0, a) + body + s.slice(b)
const h = s.indexOf('<header data-organism="topbar" data-variant="desktop"'), he = s.indexOf('</header>', h)
const keep = LINK_BASE; LINK_BASE = ''
s = s.slice(0, h) + topbar({ fixed: true, cls: 'max-md:hidden', context: `<h1 class="font-headline-md text-headline-md text-on-surface shrink-0">Notifications</h1><span class="font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap">${UNREAD} new</span>` }) + s.slice(he + '</header>'.length)
LINK_BASE = keep
write('stitch/14-notifications-b.html', s)
{
  const frame = (hash = '') => `<div class="rounded-[28px] overflow-hidden ring-1 ring-outline-variant bg-background shadow-md" style="width:390px;height:844px"><iframe src="../14-notifications-b.html${hash}" width="390" height="844" class="border-0 block" title="notifications ${hash}"></iframe></div>`
  write('stitch/organisms/notifications-phone-r1.html', `<!DOCTYPE html><html lang="en">
<!-- Notifications — phone. Generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-surface-container-low font-body-md text-on-surface antialiased p-10">
<h1 class="font-headline-lg text-headline-lg mb-2">Notifications — phone</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-8 max-w-3xl">“Needs you” as swipeable chips on top, then the feed by day. <b>Every frame is the real page.</b></p>
<div class="flex flex-wrap items-start gap-10">
${state('all', '1 · The feed', 'Photos of the finds; the kind as a small badge; unread in bold with a dot.', 390, frame(''))}
${state('unread', '2 · Unread only', 'The filter keeps the day headings that still have something.', 390, frame('#unread'))}
${state('caught', '3 · All caught up', 'After Mark all read, on Unread.', 390, frame('#caught-up'))}
</div></body></html>`)
}
}

/* ───────────────────────────── Sign in / sign up, proposal B ─────────────────────────────
 * Alex, 2026-09-28: next, one by one. What exists (AuthForm.tsx, auth.* strings,
 * shipped 2026-09-06): passwordless — email → a 6-digit code typed in place;
 * separate sign-in and sign-up; sign-up adds name + an optional invite code.
 * Copy is the app's own, word for word (auth.*). No shell: you aren't in yet.
 *
 * Desktop: the form on the left; on the right a wall of real finds (the
 * Brand Book: real things, daylight, honest wear) with the proposed tagline
 * and three steps. Phone: the form first, a thin strip of finds above it —
 * the keyboard needs the height. */
{
const WALL = [PH.marantz, OLYMPUS, PH.lamp, PH.fender, PH.pourover, PH.levis, PH.bike, PH.lamy, PH.braun, PH.planter, PH.blanket, PH.fujicase]
const field = (id, labelT, attrs, help) => `<label class="flex flex-col gap-1.5"><span class="font-label-md text-label-md text-on-surface">${labelT}</span><input ${attrs} class="h-12 px-4 rounded-xl ring-1 ring-inset ring-outline-variant bg-surface-container-lowest font-body-md text-[16px] outline-none focus:ring-2 focus:ring-primary/60" data-f="${id}">${help ? `<span data-help="${id}" class="font-body-sm text-[13px] text-on-surface-variant">${help}</span>` : ''}</label>`
const LOUD = 'w-full h-12 rounded-xl bg-primary text-on-primary font-label-lg text-[15px] font-bold shadow-[0_6px_18px_rgba(27,107,85,0.28)] hover:bg-forest inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:shadow-none'
const err = (id) => `<p data-err="${id}" hidden class="flex items-start gap-2 rounded-xl bg-coral/25 px-3 py-2.5 font-body-sm text-body-sm text-ink">${icon('error', 'text-[18px] mt-0.5')}<span data-msg></span></p>`

const panels = `
<section data-step="signin" class="flex flex-col gap-6">
<div><h1 class="font-headline-lg text-[32px] leading-10 text-on-surface">Welcome back</h1><p class="mt-2 font-body-md text-body-md text-on-surface-variant">Your old things are someone’s treasure.</p></div>
<form data-form="signin" class="flex flex-col gap-4" novalidate>${field('email-in', 'Email address', 'type="email" inputmode="email" autocomplete="email" placeholder="you@example.com"', 'We email you a six-digit code. No password to remember.')}${err('signin')}<button type="submit" class="${LOUD}">Email me a code${icon('arrow_forward', 'text-[18px]')}</button></form>
<p class="font-body-sm text-body-sm text-on-surface-variant">New to Bartefy? <button type="button" data-go="signup" class="font-label-lg text-label-lg text-primary hover:underline">Sign up</button></p>
</section>

<section data-step="signup" hidden class="flex flex-col gap-6">
<div><h1 class="font-headline-lg text-[32px] leading-10 text-on-surface">Make a Bartefy account</h1><p class="mt-2 font-body-md text-body-md text-on-surface-variant">List what you no longer need, find what you do, and trade straight across. No money changes hands.</p></div>
<form data-form="signup" class="flex flex-col gap-4" novalidate>
${field('name', 'Your name', 'autocomplete="given-name" placeholder="Ada"', 'What other swappers will see. A first name is plenty.')}
${field('email-up', 'Email address', 'type="email" inputmode="email" autocomplete="email" placeholder="you@example.com"', '')}
<label class="flex flex-col gap-1.5"><span class="font-label-md text-label-md text-on-surface">Invite code <span class="font-body-sm text-[12px] text-outline font-normal">optional</span></span><span class="relative"><input data-f="invite" autocomplete="off" placeholder="e.g. ALEX-7F3" class="w-full h-12 px-4 pr-11 rounded-xl ring-1 ring-inset ring-outline-variant bg-surface-container-lowest font-ticker-number text-[16px] uppercase placeholder:normal-case placeholder:font-body-md outline-none focus:ring-2 focus:ring-primary/60"><span data-invite-ok hidden class="absolute right-3 top-1/2 -translate-y-1/2">${filled('check_circle', 'text-[22px] text-primary')}</span></span><span data-invite-help class="font-body-sm text-[13px] text-on-surface-variant">If a friend invited you, their code goes here — they earn points once you finish your first swap.</span></label>
${err('signup')}<button type="submit" class="${LOUD}">Create account${icon('arrow_forward', 'text-[18px]')}</button></form>
<p class="font-body-sm text-body-sm text-on-surface-variant">Already have an account? <button type="button" data-go="signin" class="font-label-lg text-label-lg text-primary hover:underline">Log in</button></p>
</section>

<section data-step="code" hidden class="flex flex-col gap-6">
<div><span class="grid place-items-center w-12 h-12 rounded-2xl bg-mint text-forest">${icon('mark_email_unread', 'text-[26px]')}</span><h1 class="mt-4 font-headline-lg text-[32px] leading-10 text-on-surface">Check your email</h1><p class="mt-2 font-body-md text-body-md text-on-surface-variant">We sent a six-digit code to <b data-sent-to class="text-on-surface">maya.l@example.com</b>. Enter it here — it expires in an hour.</p></div>
<form data-form="code" class="flex flex-col gap-4" novalidate>
<div data-code class="grid grid-cols-6 gap-2" role="group" aria-label="Six-digit code">${Array.from({ length: 6 }, (_, i) => `<input data-digit="${i}" inputmode="numeric" autocomplete="${i ? 'off' : 'one-time-code'}" maxlength="1" aria-label="Digit ${i + 1}" class="h-14 w-full text-center rounded-xl ring-1 ring-inset ring-outline-variant bg-surface-container-lowest font-display text-[26px] font-semibold outline-none focus:ring-2 focus:ring-primary/60">`).join('')}</div>
${err('code')}<button type="submit" data-code-go disabled class="${LOUD}">Continue</button></form>
<div class="flex flex-wrap items-center gap-x-5 gap-y-2 font-body-sm text-body-sm"><button type="button" data-resend class="font-label-lg text-label-lg text-primary hover:underline">Send it again</button><button type="button" data-go="back" class="font-label-lg text-label-lg text-on-surface-variant hover:underline">Use a different email</button></div>
<p class="font-body-sm text-[12px] text-outline">Try 123456 in the mock. 000000 shows the wrong-code message.</p>
</section>

<section data-step="done" hidden class="flex flex-col gap-4 items-start">
<span class="grid place-items-center w-12 h-12 rounded-2xl bg-primary text-on-primary">${icon('check', 'text-[26px]')}</span>
<h1 class="font-headline-lg text-[32px] leading-10 text-on-surface">You’re in</h1><p class="font-body-md text-body-md text-on-surface-variant">In the app this goes to your deck — or, the first time, to a short welcome.</p>
<a href="02-discover-desktop-r1.html" class="${LOUD.replace('w-full ', '')} px-6">Go to Discover${icon('arrow_forward', 'text-[18px]')}</a>
</section>`

const wall = `<div class="absolute inset-0 grid grid-cols-3 gap-3 p-3 -rotate-3 scale-110 origin-center">${WALL.map((src, i) => `<img alt="" class="w-full h-full object-cover rounded-2xl ${i % 2 ? 'translate-y-8' : ''}" src="${src}">`).join('')}</div>`
const page = `<!DOCTYPE html><html lang="en">
<!-- Sign in / sign up, proposal B — generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-background font-body-md text-on-surface antialiased">
<style>[hidden]{display:none!important}.v6-strip{scrollbar-width:none}.v6-strip::-webkit-scrollbar{display:none}
[data-shake]{animation:v6shake .24s cubic-bezier(.2,0,0,1)}@keyframes v6shake{0%,100%{transform:none}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}</style>
<div class="min-h-dvh flex">
<main class="w-full lg:w-[min(46%,640px)] shrink-0 flex flex-col px-6 sm:px-12 lg:px-16 py-8">
<a href="#" aria-label="Bartefy" class="shrink-0 self-start">${lockup(true)}</a>
<!-- Phone (Alex, 2026-09-28: unsure about the small images): the desktop panel in
     miniature — one green card, three finds fanned out, the tagline. Only on the
     first screen; the code step needs the room. -->
<div data-phone-hero class="lg:hidden mt-6 relative h-[168px] rounded-3xl bg-forest overflow-hidden">
<div class="absolute right-3 top-6 w-[164px] h-[130px]">${[[PH.marantz, '-rotate-6', 'left-0 top-3'], [OLYMPUS, 'rotate-3', 'left-[46px] top-0'], [PH.lamp, 'rotate-12', 'left-[90px] top-5']].map(([src, rot, pos]) => `<img alt="" class="absolute ${pos} ${rot} w-[74px] h-[96px] rounded-2xl object-cover ring-4 ring-forest shadow-lg" src="${src}">`).join('')}</div>
<p class="absolute left-5 bottom-5 w-[136px] font-display text-[24px] leading-[1.08] font-semibold text-white">Swap what you don’t use.</p>
</div>
<div class="flex-1 flex lg:items-center pt-6 pb-8 lg:py-8"><div class="w-full max-w-[420px]">${panels}</div></div>
<div class="shrink-0 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">${orzomiByline()}<p class="font-body-sm text-[12px] text-outline">By continuing you agree to the <a href="#" class="underline">terms</a> and <a href="#" class="underline">privacy notice</a>.</p></div>
</main>
<aside class="hidden lg:flex relative flex-1 overflow-hidden bg-forest">
${wall}
<div class="absolute inset-0 bg-gradient-to-t from-forest via-forest/55 to-forest/10"></div>
<div class="relative mt-auto p-12 xl:p-16 text-white max-w-[640px]">
<p class="font-display text-[56px] leading-[1.02] font-semibold tracking-tight">Swap what you don’t use.</p>
<ol class="mt-8 grid grid-cols-3 gap-6">${[['table_restaurant', 'Put it on the table', 'A photo and what you’d like back.'], ['style', 'Swipe what’s near', 'Finds within 10 km, at random.'], ['handshake', 'Swap in person', 'Agree, meet, both confirm. No money.']].map(([ic, t, d], i) => `<li class="flex flex-col gap-2"><span class="grid place-items-center w-10 h-10 rounded-xl bg-white/15">${icon(ic, 'text-[22px]')}</span><p class="font-label-lg text-[15px]">${i + 1}. ${t}</p><p class="font-body-sm text-body-sm text-white/75">${d}</p></li>`).join('')}</ol>
</div></aside></div>
<script>
(() => {
  let last = 'signin'
  const show = (step) => { if (step !== 'code' && step !== 'done') last = step; document.querySelector('[data-phone-hero]').hidden = step === 'code' || step === 'done'; document.querySelectorAll('[data-step]').forEach((s) => (s.hidden = s.dataset.step !== step)); const f = document.querySelector('[data-step="' + step + '"] input'); if (f && !matchMedia('(hover:none)').matches) f.focus() }
  const say = (id, msg) => { const e = document.querySelector('[data-err="' + id + '"]'); e.hidden = !msg; if (msg) { e.querySelector('[data-msg]').textContent = msg; e.removeAttribute('data-shake'); void e.offsetWidth; e.setAttribute('data-shake', '') } }
  const okEmail = (v) => /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(v)
  const digits = () => [...document.querySelectorAll('[data-digit]')]
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]'); if (g) { say('signin'); say('signup'); return show(g.dataset.go === 'back' ? last : g.dataset.go) }
    if (e.target.closest('[data-resend]')) { const b = e.target.closest('[data-resend]'); b.textContent = 'Sent — check your inbox'; b.disabled = true; setTimeout(() => { b.textContent = 'Send it again'; b.disabled = false }, 4000) }
  })
  document.addEventListener('submit', (e) => {
    e.preventDefault()
    const f = e.target.dataset.form
    if (f === 'signin') {
      const v = document.querySelector('[data-f="email-in"]').value.trim()
      if (!okEmail(v)) return say('signin', 'That address did not look right to us. Check it and try again.')
      if (/^new@/i.test(v)) return say('signin', 'We have no account for that address. Sign up and it takes a moment.')
      say('signin'); document.querySelector('[data-sent-to]').textContent = v; return show('code')
    }
    if (f === 'signup') {
      const v = document.querySelector('[data-f="email-up"]').value.trim()
      if (!document.querySelector('[data-f="name"]').value.trim()) return say('signup', 'Add the name other swappers will see — a first name is plenty.')
      if (!okEmail(v)) return say('signup', 'That address did not look right to us. Check it and try again.')
      if (/^maya/i.test(v)) return say('signup', 'That address already has an account. Log in instead.')
      say('signup'); document.querySelector('[data-sent-to]').textContent = v; return show('code')
    }
    if (f === 'code') {
      const c = digits().map((d) => d.value).join('')
      if (c === '000000') { say('code', 'That code did not work. Check the digits and type it again — the newest email is the one that counts.'); digits().forEach((d) => (d.value = '')); digits()[0].focus(); document.querySelector('[data-code-go]').disabled = true; return }
      say('code'); show('done')
    }
  })
  // Six boxes: type to advance, backspace to go back, paste all six at once.
  document.addEventListener('input', (e) => {
    const d = e.target.closest('[data-digit]')
    if (d) { d.value = d.value.replace(/\\D/g, '').slice(-1); if (d.value && d.nextElementSibling) d.nextElementSibling.focus(); document.querySelector('[data-code-go]').disabled = digits().some((x) => !x.value); if (!digits().some((x) => !x.value)) document.querySelector('[data-form="code"]').requestSubmit(); return }
    if (e.target.matches('[data-f="invite"]')) {
      const ok = /^[A-Z]{3,6}-[A-Z0-9]{2,4}$/i.test(e.target.value.trim())
      document.querySelector('[data-invite-ok]').hidden = !ok
      document.querySelector('[data-invite-help]').textContent = ok ? 'That invite checks out.' : 'If a friend invited you, their code goes here — they earn points once you finish your first swap.'
    }
  })
  document.addEventListener('keydown', (e) => { const d = e.target.closest('[data-digit]'); if (d && e.key === 'Backspace' && !d.value && d.previousElementSibling) d.previousElementSibling.focus() })
  document.addEventListener('paste', (e) => {
    if (!e.target.closest('[data-digit]')) return
    const t = (e.clipboardData.getData('text') || '').replace(/\\D/g, '').slice(0, 6); if (t.length < 2) return
    e.preventDefault(); digits().forEach((d, i) => (d.value = t[i] || '')); document.querySelector('[data-code-go]').disabled = t.length < 6; if (t.length === 6) document.querySelector('[data-form="code"]').requestSubmit()
  })
  // Review frames: #signup, #code, #code-error, #signin-error, #invite-ok
  const h = location.hash.slice(1)
  if (h === 'signup' || h === 'invite-ok') { show('signup'); if (h === 'invite-ok') { const i = document.querySelector('[data-f="invite"]'); i.value = 'ALEX-7F3'; i.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('[data-f="name"]').value = 'Ada'; document.querySelector('[data-f="email-up"]').value = 'ada@example.com' } }
  else if (h === 'code' || h === 'code-error') { show('code'); if (h === 'code-error') say('code', 'That code did not work. Check the digits and type it again — the newest email is the one that counts.') }
  else if (h === 'signin-error') { document.querySelector('[data-f="email-in"]').value = 'new@example.com'; say('signin', 'We have no account for that address. Sign up and it takes a moment.') }
  else show('signin')
})()
</script>
</body></html>`
write('stitch/15-signin-b.html', page)
{
  const frame = (hash = '') => `<div class="rounded-[28px] overflow-hidden ring-1 ring-outline-variant bg-background shadow-md" style="width:390px;height:844px"><iframe src="../15-signin-b.html${hash}" width="390" height="844" class="border-0 block" title="sign in ${hash}"></iframe></div>`
  write('stitch/organisms/signin-phone-r1.html', `<!DOCTYPE html><html lang="en">
<!-- Sign in — phone. Generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-surface-container-low font-body-md text-on-surface antialiased p-10">
<h1 class="font-headline-lg text-headline-lg mb-2">Sign in / sign up — phone</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-8 max-w-3xl">Wordmark, a strip of real finds, then the form. All copy is the app’s own. <b>Every frame is the real page</b> — type an email, then 123456.</p>
<div class="flex flex-wrap items-start gap-10">
${state('signin', '1 · Sign in', 'Email → Email me a code.', 390, frame(''))}
${state('signin-error', '1b · No account for that address', 'The app’s message; Sign up is one tap below.', 390, frame('#signin-error'))}
${state('signup', '2 · Sign up', 'Name, email, invite code (optional).', 390, frame('#signup'))}
${state('invite', '2b · Invite checks out', 'A tick in the field; the help line says so.', 390, frame('#invite-ok'))}
${state('code', '3 · The code', 'Six boxes; paste works; it submits itself on the sixth digit.', 390, frame('#code'))}
${state('code-error', '3b · Wrong code', 'Boxes clear, focus goes back to the first.', 390, frame('#code-error'))}
</div></body></html>`)
}
}

/* ───────────────────────────── Onboarding, proposal B ─────────────────────────────
 * Alex, 2026-09-29: next page. The app's four steps (Onboarding/steps.tsx,
 * useOnboarding.ts): welcome · city · tastes · finish. Facts kept: launch is
 * TBILISI only (CITY_OPTIONS) and it's pre-picked; tastes are the 15 category
 * ids from lib/taxonomy.ts and only seed the first cards; the city is saved
 * even on Skip. Copy is the app's, minus what the product cut: the welcome no
 * longer ends "rate each other after" (stars are gone) — it's "both confirm".
 * Same frame as Sign in: B | Bartefy, the form side, Orzomi at the foot; the
 * green side shows what each step means. */
{
const TASTES = [
  ['electronics', 'Electronics', 'devices'], ['home_garden', 'Home & garden', 'yard'], ['kitchen', 'Kitchen', 'cooking'], ['furniture', 'Furniture', 'chair'],
  ['clothing', 'Clothing', 'apparel'], ['bags_jewellery', 'Bags & jewellery', 'diamond'], ['books_media', 'Books & media', 'menu_book'], ['music', 'Music', 'music_note'],
  ['sport_outdoors', 'Sport & outdoors', 'pedal_bike'], ['toys_games', 'Toys & games', 'extension'], ['baby_kids', 'Baby & kids', 'child_care'], ['tools_diy', 'Tools & DIY', 'handyman'],
  ['art_craft', 'Art & craft', 'palette'], ['collectables', 'Collectables', 'museum'], ['other', 'Something else', 'inventory_2'],
]
const LOUD = 'h-12 px-6 rounded-xl bg-primary text-on-primary font-label-lg text-[15px] font-bold shadow-[0_6px_18px_rgba(27,107,85,0.28)] hover:bg-forest inline-flex items-center justify-center gap-2'
const QUIET = 'h-12 px-4 rounded-xl font-label-lg text-[15px] font-bold text-on-surface-variant hover:bg-surface-container-high inline-flex items-center justify-center gap-2'
const H = (t, b) => `<div><h1 class="font-headline-lg text-[32px] leading-10 text-on-surface">${t}</h1><p class="mt-2 font-body-md text-[16px] leading-6 text-on-surface-variant">${b}</p></div>`
const how = [['table_restaurant', 'Put a find on the table', 'Photograph something you no longer need. Say what you’d like back.'], ['style', 'Hunt for treasure', 'Swipe finds near you, at random. Offer one of yours for what you like — nobody is told when you pass.'], ['handshake', 'It’s a bartefy!', 'When they say yes, a chat opens. Meet up, swap, and both confirm. No money changes hands.']]
const steps = [
  { id: 'welcome', body: `<div class="lg:hidden order-last pt-2">${orzomiByline()}</div>${H('Welcome to the flea market', 'Bartefy is a straight trade: your thing for their thing. Here is how it works.')}
<ol class="flex flex-col gap-4">${how.map(([ic, t, d], i) => `<li class="flex gap-4"><span class="grid place-items-center w-11 h-11 rounded-xl bg-mint text-forest shrink-0">${icon(ic, 'text-[22px]')}</span><div><p class="font-label-lg text-[15px] text-on-surface">${i + 1}. ${t}</p><p class="font-body-sm text-body-sm text-on-surface-variant">${d}</p></div></li>`).join('')}</ol>` },
  { id: 'city', body: `${H('Where are you hunting?', 'We only show finds you could realistically go and collect.')}
<div class="flex flex-col gap-2"><button type="button" aria-pressed="true" class="flex items-center gap-3 h-14 px-4 rounded-xl ring-2 ring-primary bg-primary-container/40 text-left">${icon('location_on', 'text-[22px] text-primary')}<span class="flex-1 font-label-lg text-[15px] text-on-surface">Tbilisi</span>${filled('check_circle', 'text-[22px] text-primary')}</button>
<p class="flex items-center gap-3 h-14 px-4 rounded-xl ring-1 ring-inset ring-outline-variant/70 text-outline">${icon('schedule', 'text-[20px]')}<span class="flex-1 font-body-md text-body-md">More cities soon</span></p></div>
<p class="font-body-sm text-body-sm text-on-surface-variant">Your deck shows finds within <b class="text-on-surface">10 km</b>. Change your area any time in Settings — only the area ever shows, never an address.</p>` },
  { id: 'tastes', body: `${H('What are you drawn to?', 'Pick a few. This only shapes your first few cards — you can change it any time.')}
<div data-tastes class="grid grid-cols-3 gap-2">${TASTES.map(([id, t, ic]) => `<button type="button" data-taste="${id}" aria-pressed="false" class="group flex lg:flex-row flex-col items-center lg:justify-start justify-center gap-1.5 lg:gap-2.5 h-[76px] lg:h-[52px] px-2 lg:px-3 rounded-xl ring-1 ring-inset ring-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low aria-pressed:ring-2 aria-pressed:ring-primary aria-pressed:bg-primary-container/40 aria-pressed:text-forest">${icon(ic, 'text-[24px]')}<span class="font-label-md text-label-md text-center lg:text-left leading-4">${t}</span></button>`).join('')}</div>
<p data-taste-count class="font-body-sm text-body-sm text-on-surface-variant">Nothing picked — you’ll see a bit of everything.</p>` },
  { id: 'finish', body: `${H('You are all set', 'Start by putting one thing on the table. A find on the table gets far more offers — and it’s how others find you.')}
<div class="flex flex-col gap-1.5 rounded-2xl bg-surface-container-lowest ring-1 ring-surface-variant p-4"><p class="flex items-center gap-2 font-label-lg text-[15px] text-on-surface">${icon('toll', 'text-[20px] text-ink')}+20 pts for your first find</p><p class="font-body-sm text-body-sm text-on-surface-variant">Your streak starts today: come back tomorrow for +3.</p></div>` },
]
// The green side: what each step means, drawn with real finds.
const card = (src, cls) => `<img alt="" class="absolute ${cls} w-[220px] h-[280px] rounded-3xl object-cover ring-8 ring-forest shadow-2xl" src="${src}">`
const art = {
  welcome: `<div class="relative w-[520px] h-[360px]">${card(PH.marantz, 'left-0 top-10 -rotate-6')}${card(OLYMPUS, 'left-[150px] top-0 rotate-2')}${card(PH.lamp, 'left-[300px] top-12 rotate-[10deg]')}</div>`,
  city: `<div class="relative grid place-items-center w-[420px] h-[420px]"><span class="absolute inset-0 rounded-full border-2 border-dashed border-white/30"></span><span class="absolute inset-[70px] rounded-full bg-white/10"></span><span class="relative grid place-items-center w-16 h-16 rounded-full bg-white text-forest shadow-xl">${filled('location_on', 'text-[34px]')}</span>${[[PH.fender, 'left-2 top-16'], [PH.pourover, 'right-0 top-8'], [PH.bike, 'left-10 bottom-4'], [PH.levis, 'right-6 bottom-10']].map(([src, pos]) => `<img alt="" class="absolute ${pos} w-20 h-20 rounded-2xl object-cover ring-4 ring-forest shadow-lg" src="${src}">`).join('')}<span class="absolute -bottom-10 font-label-lg text-[15px] text-white/80">10 km around you</span></div>`,
  tastes: `<div class="grid grid-cols-3 gap-3 w-[480px]">${[PH.marantz, PH.levis, PH.lamy, PH.planter, OLYMPUS, PH.bike, PH.pourover, PH.fender, PH.braun].map((src, i) => `<img alt="" class="w-full aspect-square rounded-2xl object-cover ${i % 2 ? 'opacity-40' : ''}" src="${src}">`).join('')}</div>`,
  finish: `<div class="relative w-[300px] h-[400px] rounded-3xl overflow-hidden shadow-2xl ring-8 ring-forest"><img alt="" class="absolute inset-0 w-full h-full object-cover" src="${PH.fujicase}"><div class="absolute inset-x-0 bottom-0 p-4 pt-16 bg-gradient-to-t from-black/85 to-transparent text-white"><p class="text-[12px] text-white/80">In decks nearby</p><p class="font-headline-sm text-[20px] leading-6">Your first find</p></div><span class="absolute top-4 left-4 inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white/90 text-forest text-[12px] font-bold">${icon('add', 'text-[16px]')}On the table</span></div>`,
}
const caption = { welcome: 'Your thing for their thing.', city: 'Near enough to go and collect.', tastes: 'Your first cards, a little closer to you.', finish: 'Swap what you don’t use.' }

const page = `<!DOCTYPE html><html lang="en">
<!-- Onboarding, proposal B — generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-background font-body-md text-on-surface antialiased">
<style>[hidden]{display:none!important}[data-art]>*{transition:opacity .24s cubic-bezier(.2,0,0,1)}
@media (max-width:1023.98px){main{padding-bottom:112px!important}[data-orzomi-foot]{display:none}
  html.ob-last [data-foot]{flex-direction:column-reverse;align-items:stretch}html.ob-last [data-foot]>*{width:100%}html.ob-last [data-foot]>span,html.ob-last [data-back]{display:none!important}}</style>
<div class="min-h-dvh flex">
<main class="w-full lg:w-[min(46%,640px)] shrink-0 flex flex-col px-6 sm:px-12 lg:px-16 py-8">
<div class="shrink-0 flex items-center justify-between gap-4"><span>${lockup(true)}</span><button type="button" data-skip class="font-label-lg text-label-lg text-on-surface-variant hover:underline">Skip for now</button></div>
<div class="flex-1 flex lg:items-center pt-8 pb-6"><div class="w-full max-w-[460px] flex flex-col gap-7">
<ol data-dots class="flex gap-1.5" aria-label="Progress">${steps.map((x, i) => `<li data-dot="${i}" class="h-1.5 w-8 rounded-full ${i ? 'bg-surface-variant' : 'bg-primary'} transition-colors"></li>`).join('')}</ol>
${steps.map((x, i) => `<section data-ob="${x.id}" ${i ? 'hidden' : ''} class="flex flex-col gap-6">${x.body}</section>`).join('\n')}
<div data-foot class="flex flex-wrap items-center gap-2 pt-1 max-lg:fixed max-lg:inset-x-0 max-lg:bottom-0 max-lg:z-10 max-lg:bg-background max-lg:px-6 max-lg:pt-3 max-lg:pb-[max(16px,env(safe-area-inset-bottom))] max-lg:border-t max-lg:border-surface-variant"><button type="button" data-back hidden class="${QUIET}">${icon('arrow_back', 'text-[18px]')}Back</button><span class="flex-1"></span>
<button type="button" data-next class="${LOUD}">Next${icon('arrow_forward', 'text-[18px]')}</button>
<a data-hunt hidden href="02-discover-desktop-r1.html" class="${QUIET}">Start hunting</a>
<a data-list hidden href="08-my-finds-b.html" class="${LOUD}">${icon('add_a_photo', 'text-[18px]')}List my first find</a></div>
</div></div>
<div data-orzomi-foot class="shrink-0">${orzomiByline()}</div>
</main>
<aside class="hidden lg:flex relative flex-1 overflow-hidden bg-forest flex-col items-center justify-center gap-14 p-12">
<div data-art class="grid place-items-center">${steps.map((x, i) => `<div data-art-for="${x.id}" ${i ? 'hidden' : ''}>${art[x.id]}</div>`).join('')}</div>
<p data-caption class="font-display text-[40px] leading-tight font-semibold text-white text-center max-w-[560px]">${caption.welcome}</p>
</aside></div>
<script>
(() => {
  const ids = ${JSON.stringify(steps.map((x) => x.id))}, caps = ${JSON.stringify(caption)}
  let i = 0
  const go = (n) => {
    i = Math.max(0, Math.min(ids.length - 1, n))
    document.querySelectorAll('[data-ob]').forEach((s) => (s.hidden = s.dataset.ob !== ids[i]))
    document.querySelectorAll('[data-art-for]').forEach((s) => (s.hidden = s.dataset.artFor !== ids[i]))
    document.querySelector('[data-caption]').textContent = caps[ids[i]]
    document.querySelectorAll('[data-dot]').forEach((d) => d.classList.toggle('bg-primary', +d.dataset.dot <= i) || d.classList.toggle('bg-surface-variant', +d.dataset.dot > i))
    document.querySelectorAll('[data-dot]').forEach((d) => d.classList.toggle('bg-surface-variant', +d.dataset.dot > i))
    const last = i === ids.length - 1
    document.querySelector('[data-back]').hidden = i === 0
    document.querySelector('[data-next]').hidden = last
    document.querySelector('[data-hunt]').hidden = !last; document.querySelector('[data-list]').hidden = !last
    document.querySelector('[data-skip]').hidden = last
    document.documentElement.classList.toggle('ob-last', last)
    try { history.replaceState(null, '', '#' + ids[i]) } catch (e) {}
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-next]')) return go(i + 1)
    if (e.target.closest('[data-back]')) return go(i - 1)
    if (e.target.closest('[data-skip]')) return go(ids.length - 1)   // skipping still saves Tbilisi
    const t = e.target.closest('[data-taste]')
    if (t) {
      t.setAttribute('aria-pressed', String(t.getAttribute('aria-pressed') !== 'true'))
      const n = document.querySelectorAll('[data-taste][aria-pressed="true"]').length
      document.querySelector('[data-taste-count]').textContent = n ? n + ' picked — your first cards lean that way.' : 'Nothing picked — you’ll see a bit of everything.'
    }
  })
  document.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') go(i + 1); if (e.key === 'ArrowLeft') go(i - 1) })
  const h = ids.indexOf(location.hash.slice(1)); go(h < 0 ? 0 : h)
  if (location.hash === '#tastes') ['music', 'books_media', 'clothing'].forEach((id) => document.querySelector('[data-taste="' + id + '"]').click())
})()
</script>
</body></html>`
write('stitch/16-onboarding-b.html', page)
{
  const frame = (hash = '') => `<div class="rounded-[28px] overflow-hidden ring-1 ring-outline-variant bg-background shadow-md" style="width:390px;height:844px"><iframe src="../16-onboarding-b.html${hash}" width="390" height="844" class="border-0 block" title="onboarding ${hash}"></iframe></div>`
  write('stitch/organisms/onboarding-phone-r1.html', `<!DOCTYPE html><html lang="en">
<!-- Onboarding — phone. Generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-surface-container-low font-body-md text-on-surface antialiased p-10">
<h1 class="font-headline-lg text-headline-lg mb-2">Onboarding — phone</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-8 max-w-3xl">Four steps, the app’s own. <b>Every frame is the real page</b> — Next, Back, pick tastes.</p>
<div class="flex flex-wrap items-start gap-10">
${state('welcome', '1 · Welcome', 'How it works in three lines.', 390, frame('#welcome'))}
${state('city', '2 · Where', 'Tbilisi, pre-picked — the only launch city.', 390, frame('#city'))}
${state('tastes', '3 · Tastes', 'The 15 categories, pick a few (3 picked here).', 390, frame('#tastes'))}
${state('finish', '4 · All set', 'List my first find, or start hunting.', 390, frame('#finish'))}
</div></body></html>`)
}
}

/* ───────────────────────────── Item detail — CUT ─────────────────────────────
 * Alex, 2026-09-29: "Item detail shows another person's items — why do we need
 * it at all, when Discover shows everything about it? The one thing missing is
 * the full photo view, and that can go on the card itself." So the page is
 * gone; the Discover card opens its photos full screen (VIEWER above). */

/* ───────────────────────────── Add a find, proposal B ─────────────────────────────
 * Working through the list on my own (Alex, 2026-09-29: "do the other things
 * without me; I'll confirm them when all are done"). The ＋ everywhere opens
 * this. Stitch's dialog (#32) had prices, "karma", 4 made-up conditions and no
 * category — replaced with the app's real form (AddItem/useAddItem.ts, add.*,
 * condition.*): photos (only a photo is required), name, story, categories
 * (as many as fit), the 5 conditions, wants = categories + a note, or "Open to
 * anything". After: published (with the Boost offer) or held for a person to
 * look at the photo. Hunter at 6 of 6 gets the limit screen instead (402 →
 * upgrade, the app's invariant). Desktop: one screen, photos left, form right.
 * Phone: three short steps. */
{
const CATS15 = [['electronics', 'Electronics'], ['home_garden', 'Home & garden'], ['kitchen', 'Kitchen'], ['furniture', 'Furniture'], ['clothing', 'Clothing'], ['bags_jewellery', 'Bags & jewellery'], ['books_media', 'Books & media'], ['music', 'Music'], ['sport_outdoors', 'Sport & outdoors'], ['toys_games', 'Toys & games'], ['baby_kids', 'Baby & kids'], ['tools_diy', 'Tools & DIY'], ['art_craft', 'Art & craft'], ['collectables', 'Collectables'], ['other', 'Something else']]
const CONDS = [['for_parts', 'For parts', 'Broken or incomplete. Someone will still want it.'], ['needs_work', 'Needs work', 'Works, mostly. Say what is wrong in the story.'], ['well_loved', 'Well loved', 'Used and it shows. The worn bits are the point.'], ['good', 'Good', 'Used gently. Nothing that would put anyone off.'], ['like_new', 'Like new', 'Barely touched, or never used at all.']]
const SAMPLE = [LEICA, PH.fujicase, OLYMPUS, imgByAlt(S5, 'Editorial close-up of a vintage black Olympus')]
const LOUD = 'h-12 px-6 rounded-xl bg-primary text-on-primary font-label-lg text-[15px] font-bold shadow-[0_6px_18px_rgba(27,107,85,0.28)] hover:bg-forest inline-flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-40 disabled:shadow-none'
const QUIET = 'h-12 px-4 rounded-xl font-label-lg text-[15px] font-bold text-on-surface-variant hover:bg-surface-container-high inline-flex items-center justify-center gap-2 whitespace-nowrap'
const chip = (group, id, t) => `<button type="button" data-chip="${group}" data-id="${id}" aria-pressed="false" class="h-9 px-3.5 rounded-full ring-1 ring-inset ring-outline-variant font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low aria-pressed:bg-primary-container aria-pressed:ring-primary aria-pressed:text-forest">${t}</button>`
const L = (t, help) => `<div><p class="font-label-lg text-[15px] text-on-surface">${t}</p>${help ? `<p class="font-body-sm text-body-sm text-on-surface-variant">${help}</p>` : ''}</div>`
const inputCls = 'w-full px-4 rounded-xl ring-1 ring-inset ring-outline-variant bg-surface-container-lowest font-body-md text-[16px] outline-none focus:ring-2 focus:ring-primary/60'

const photos = `<section data-part="photos" class="flex flex-col gap-3">
${L('Show it. One photo is enough to start.', 'Daylight, no styling needed. The worn bits are the point.')}
<div data-photos class="grid grid-cols-2 gap-3"></div>
<p class="font-body-sm text-[12px] text-outline">The cover is what people see in the deck — tap <b class="text-on-surface-variant">Make cover</b> on any photo to swap it in. Up to 8.</p></section>`
const details = `<section data-part="details" class="flex flex-col gap-5">
<label class="flex flex-col gap-2">${L('Name it')}<input data-find-name placeholder="Pentax film camera" class="${inputCls} h-12"></label>
<label class="flex flex-col gap-2">${L('Tell its story', '<span class="text-outline">Optional</span>')}<textarea data-story rows="3" placeholder="Where it came from, how it has been used, anything that is not obvious from the photos." class="${inputCls} py-3 resize-none"></textarea></label>
<div class="flex flex-col gap-2">${L('What kind of thing is it?', 'Pick as many as fit. It is how people find it.')}<div class="flex flex-wrap gap-1.5">${CATS15.map(([id, t]) => chip('cat', id, t)).join('')}</div></div>
<div class="flex flex-col gap-2">${L('What shape is it in?')}<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">${CONDS.map(([id, t, h]) => `<button type="button" data-cond="${id}" aria-pressed="false" class="text-left rounded-xl ring-1 ring-inset ring-outline-variant p-3 hover:bg-surface-container-low aria-pressed:ring-2 aria-pressed:ring-primary aria-pressed:bg-primary-container/40"><span class="block font-label-lg text-label-lg text-on-surface">${t}</span><span class="block font-body-sm text-[12px] leading-4 text-on-surface-variant">${h}</span></button>`).join('')}</div></div></section>`
const wants = `<section data-part="wants" class="flex flex-col gap-5">
${L('What would you like for it?', 'Rough is fine. This is what puts your find in front of the right people.')}
<div class="flex flex-wrap gap-1.5">${chip('any', 'any', `${icon('all_inclusive', 'text-[16px] mr-1 align-[-3px]')}Open to anything`)}${CATS15.map(([id, t]) => chip('want', id, t)).join('')}</div>
<p data-any-help class="-mt-2 font-body-sm text-[12px] text-on-surface-variant">Nobody has a catalogue — pick the directions you would trade toward, and say anything specific below.</p>
<label class="flex flex-col gap-2">${L('Anything specific?', '<span class="text-outline">A wish, not a promise — people will offer what they actually have.</span>')}<input data-wish placeholder="Ideally a soldering station, but surprise me." class="${inputCls} h-12"></label></section>`

const after = `<section data-after="published" hidden class="flex flex-col items-center text-center gap-4 py-6">
<img data-after-img alt="" class="w-40 h-40 rounded-2xl object-cover shadow-lg" src="${LEICA}">
<div><h2 class="font-headline-lg text-[30px] leading-9 text-on-surface">It’s on the table</h2><p class="mt-1 font-body-md text-body-md text-on-surface-variant">Your find is in the deck. You’ll hear when someone offers a swap.</p></div>
<p class="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-mint text-forest font-label-md text-label-md">${icon('toll', 'text-[16px]')}+20 pts · 5 of 10 this month</p>
<div class="w-full max-w-[420px] rounded-2xl ring-1 ring-surface-variant p-4 flex items-center gap-3 text-left"><span class="grid place-items-center w-10 h-10 rounded-xl bg-sun/70 text-ink">${filled('bolt', 'text-[20px]')}</span><div class="flex-1"><p class="font-label-lg text-label-lg text-on-surface">Get seen 10× faster</p><p class="font-body-sm text-[12px] text-on-surface-variant">Put this find at the top of every nearby deck for a day.</p></div><button type="button" data-missing="Boosted — top of the deck for 24 hours" class="h-10 px-3 rounded-lg ring-1 ring-inset ring-outline-variant font-label-md text-label-md whitespace-nowrap">Boost · 75 pts</button></div>
<div class="flex flex-wrap justify-center gap-2 pt-2"><button type="button" data-again class="${QUIET}">${icon('add', 'text-[18px]')}List another find</button><a href="08-my-finds-b.html" class="${LOUD}">See my finds</a></div></section>
<section data-after="held" hidden class="flex flex-col items-center text-center gap-4 py-6">
<span class="grid place-items-center w-16 h-16 rounded-2xl bg-sky/60 text-ink">${icon('visibility', 'text-[32px]')}</span>
<div><h2 class="font-headline-lg text-[30px] leading-9 text-on-surface">Held for a quick look</h2><p class="mt-1 max-w-[420px] font-body-md text-body-md text-on-surface-variant">A person checks the photo before this one goes live. It usually takes a few hours.</p></div>
<a href="08-my-finds-b.html" class="${LOUD}">See my finds</a></section>
<section data-after="limit" hidden class="flex flex-col items-center text-center gap-4 py-6">
<span class="grid place-items-center w-16 h-16 rounded-2xl bg-surface-container-low text-on-surface-variant">${icon('table_restaurant', 'text-[32px]')}</span>
<div><h2 class="font-headline-lg text-[30px] leading-9 text-on-surface">Your table is full</h2><p class="mt-1 max-w-[440px] font-body-md text-body-md text-on-surface-variant">Hunter keeps 6 finds on the table at once. Pause one to make room — or Collector has no limit.</p></div>
<div class="flex flex-wrap justify-center gap-2"><a href="08-my-finds-b.html" class="${QUIET} ring-1 ring-inset ring-outline-variant">${icon('pause', 'text-[18px]')}Pause a find</a><a href="06-points-b.html#tiers" class="${LOUD}">Collector · 600 pts</a></div>
<p class="font-body-sm text-[12px] text-outline">You have 420 pts — 180 more to go.</p></section>`

const body = `<!-- Add a find, proposal B (build-revisions.mjs) -->
<style>[data-add] [hidden]{display:none!important}
[data-step-bar],[data-phone-foot]{display:none}
@media (max-width:1023.98px){
  [data-add]{padding:0!important;height:auto!important}
  [data-add-card]{border-radius:0!important;box-shadow:none!important;min-height:calc(100dvh - 80px)}
  [data-add-cols]{display:block!important}[data-add-cols]>*{overflow:visible!important;border:0!important;padding:16px!important}
  [data-step-bar]{display:flex}[data-sep]{display:none}
  [data-add-card][data-cur="photos"] [data-part]:not([data-part="photos"]),[data-add-card][data-cur="details"] [data-part]:not([data-part="details"]),[data-add-card][data-cur="wants"] [data-part]:not([data-part="wants"]){display:none}
  [data-desk-foot]{display:none!important}[data-phone-foot]{display:flex;position:fixed;inset-inline:0;bottom:0;z-index:50;background:#fff;border-top:1px solid rgb(237 235 228);padding:12px 16px max(16px,env(safe-area-inset-bottom))}
  .v6-tabs{display:none!important}.v6-main{padding-bottom:96px!important}
}
@media (max-width:767.98px){[data-add]{margin-top:-24px}}</style>
<div data-add class="px-margin md:px-gutter-desktop pt-6 pb-6 lg:h-[calc(100dvh-80px)]">
<div data-add-card data-cur="photos" class="h-full flex flex-col rounded-xl bg-surface-container-lowest ring-1 ring-surface-variant/70 overflow-hidden">
<div data-step-bar class="items-center gap-3 px-4 pt-4"><a href="08-my-finds-b.html" aria-label="Close" class="grid place-items-center w-10 h-10 -ml-2 rounded-full hover:bg-surface-container-high">${icon('close', 'text-[22px]')}</a><h1 class="font-headline-sm text-headline-sm text-on-surface">List a find</h1><ol class="ml-auto flex gap-1.5">${['photos', 'details', 'wants'].map((x) => `<li data-sb="${x}" class="h-1.5 w-7 rounded-full bg-surface-variant"></li>`).join('')}</ol></div>
<div data-form-area class="flex-1 min-h-0 flex flex-col">
<div data-add-cols class="flex-1 min-h-0 grid" style="grid-template-columns:minmax(320px,38%) 1fr">
<div class="min-h-0 overflow-y-auto p-6 border-r border-surface-variant">${photos}</div>
<div class="min-h-0 overflow-y-auto p-6 flex flex-col gap-8">${details}<div data-sep class="h-px bg-surface-variant"></div>${wants}</div></div>
<footer data-desk-foot class="shrink-0 flex items-center gap-3 px-6 py-4 border-t border-surface-variant"><p data-need class="flex-1 font-body-sm text-body-sm text-on-surface-variant"></p><a href="08-my-finds-b.html" class="${QUIET}">Not now</a><button type="button" data-publish class="${LOUD}">${icon('table_restaurant', 'text-[20px]')}Put it on the table</button></footer>
</div>
<div data-after-area hidden class="flex-1 min-h-0 overflow-y-auto grid place-items-center p-6">${after}</div>
</div>
<div data-phone-foot class="items-center gap-2"><button type="button" data-prev class="${QUIET}">${icon('arrow_back', 'text-[18px]')}Back</button><span class="flex-1"></span><button type="button" data-next class="${LOUD}">Next${icon('arrow_forward', 'text-[18px]')}</button><button type="button" data-publish hidden class="${LOUD} flex-1">Put it on the table</button></div>
</div>
<script>
(() => {
  const SAMPLE = ${JSON.stringify(SAMPLE)}
  const card = document.querySelector('[data-add-card]'), grid = document.querySelector('[data-photos]')
  let pics = [SAMPLE[0]]
  const drawPhotos = () => {
    grid.innerHTML = pics.map((src, i) => '<div class="relative aspect-square rounded-xl overflow-hidden ' + (i ? '' : 'col-span-2 aspect-[4/3]') + '"><img alt="" class="w-full h-full object-cover" src="' + src + '">' + (i ? '' : '<span class="absolute top-2 left-2 h-6 px-2 inline-flex items-center rounded-full bg-white/90 text-[11px] font-bold text-on-surface">Cover</span>') + '<button type="button" data-rm="' + i + '" aria-label="Remove photo" class="absolute top-2 right-2 grid place-items-center w-8 h-8 rounded-full bg-black/55 text-white"><span class="material-symbols-outlined text-[18px]">close</span></button>' +
      // Alex, 2026-09-29: pick the cover. Any other photo can take its place.
      (i ? '<button type="button" data-cover="' + i + '" class="absolute bottom-2 left-2 h-8 pl-1.5 pr-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 text-[12px] font-bold text-on-surface shadow-sm hover:bg-white"><span class="material-symbols-outlined text-[16px]">star</span>Make cover</button>' : '') + '</div>').join('') +
      (pics.length < 8 ? '<button type="button" data-add-photo class="' + (pics.length ? 'aspect-square' : 'col-span-2 aspect-[4/3]') + ' rounded-xl border-2 border-dashed border-outline-variant text-primary flex flex-col items-center justify-center gap-1 hover:bg-primary-container/30"><span class="material-symbols-outlined text-[28px]">add_a_photo</span><span class="font-label-md text-label-md">Add a photo</span></button>' : '')
    check()
  }
  const val = (sel) => (document.querySelector(sel)?.value || '').trim()
  const check = () => {
    const need = !pics.length ? 'Add at least one photo' : ''
    document.querySelector('[data-need]').textContent = need || 'Only a photo is required — the rest helps the right people find it.'
    document.querySelectorAll('[data-publish]').forEach((b) => (b.disabled = !!need))
  }
  const steps = ['photos', 'details', 'wants']
  const step = (k) => {
    card.dataset.cur = steps[k]
    document.querySelectorAll('[data-sb]').forEach((d, i) => (d.style.background = i <= k ? '#1B6B55' : ''))
    document.querySelector('[data-prev]').style.visibility = k ? 'visible' : 'hidden'
    document.querySelector('[data-next]').hidden = k === 2
    document.querySelector('[data-phone-foot] [data-publish]').hidden = k !== 2
    window.scrollTo(0, 0)
  }
  const done = (which) => {
    document.querySelector('[data-form-area]').hidden = true; document.querySelector('[data-step-bar]').style.display = 'none'
    document.querySelector('[data-phone-foot]').style.display = 'none'
    document.querySelector('[data-after-area]').hidden = false
    document.querySelectorAll('[data-after]').forEach((s) => (s.hidden = s.dataset.after !== which))
    if (pics[0]) document.querySelector('[data-after-img]').src = pics[0]
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-add-photo]')) { pics.push(SAMPLE[pics.length % SAMPLE.length]); return drawPhotos() }
    const rm = e.target.closest('[data-rm]'); if (rm) { pics.splice(+rm.dataset.rm, 1); return drawPhotos() }
    const cv = e.target.closest('[data-cover]'); if (cv) { const [p] = pics.splice(+cv.dataset.cover, 1); pics.unshift(p); return drawPhotos() }
    const c = e.target.closest('[data-chip]')
    if (c) {
      const on = c.getAttribute('aria-pressed') !== 'true'; c.setAttribute('aria-pressed', String(on))
      if (c.dataset.chip === 'any' && on) document.querySelectorAll('[data-chip="want"]').forEach((x) => x.setAttribute('aria-pressed', 'false'))
      if (c.dataset.chip === 'want' && on) document.querySelector('[data-chip="any"]').setAttribute('aria-pressed', 'false')
      return
    }
    const cd = e.target.closest('[data-cond]'); if (cd) { document.querySelectorAll('[data-cond]').forEach((x) => x.setAttribute('aria-pressed', String(x === cd))); return }
    if (e.target.closest('[data-next]')) return step(steps.indexOf(card.dataset.cur) + 1)
    if (e.target.closest('[data-prev]')) return step(steps.indexOf(card.dataset.cur) - 1)
    if (e.target.closest('[data-publish]')) return done('published')
    if (e.target.closest('[data-again]')) return location.reload()
  })
  drawPhotos(); step(0)
  const h = location.hash.slice(1)
  const fill = () => { pics = [SAMPLE[0], SAMPLE[1], SAMPLE[3]]; drawPhotos(); document.querySelector('[data-find-name]').value = 'Leica Mini 35mm Compact'; document.querySelector('[data-story]').value = 'My dad’s holiday camera. Winds on fine, flash works, a scuff on the back door.'; ['electronics', 'collectables'].forEach((id) => document.querySelector('[data-chip="cat"][data-id="' + id + '"]').click()); document.querySelector('[data-cond="well_loved"]').click(); ['music', 'books_media'].forEach((id) => document.querySelector('[data-chip="want"][data-id="' + id + '"]').click()); document.querySelector('[data-wish]').value = 'A Walkman, or records' }
  if (h === 'filled' || h === 'details' || h === 'wants') fill()
  if (h === 'details') step(1); if (h === 'wants') step(2)
  if (h === 'empty') { pics = []; drawPhotos() }
  if (h === 'published' || h === 'held' || h === 'limit') { if (h !== 'limit') fill(); done(h) }
})()
</script>
`
let s = read('stitch/11-plain-shell.html').replace('<title>', '<title>ADD A FIND (B) · ')
const a = s.indexOf('<!-- Subtle Ambient Glow Canvas -->'), b = s.indexOf('<!-- FAST LISTING DRAWER')
if (a < 0 || b < 0) throw new Error('add B: content markers not found')
s = s.slice(0, a) + body + s.slice(b)
const h = s.indexOf('<header data-organism="topbar" data-variant="desktop"'), he = s.indexOf('</header>', h)
const keep = LINK_BASE; LINK_BASE = ''
s = s.slice(0, h) + topbar({ fixed: true, cls: 'max-md:hidden', context: `<a href="08-my-finds-b.html" aria-label="Close" class="grid place-items-center w-10 h-10 -ml-2 rounded-full hover:bg-surface-container-high">${icon('close', 'text-[22px]')}</a><h1 class="font-headline-md text-headline-md text-on-surface shrink-0">List a find</h1><span class="font-body-sm text-body-sm text-on-surface-variant whitespace-nowrap">5 of 6 on your table</span>` }) + s.slice(he + '</header>'.length)
LINK_BASE = keep
write('stitch/18-add-b.html', s)
{
  const frame = (hash = '') => `<div class="rounded-[28px] overflow-hidden ring-1 ring-outline-variant bg-background shadow-md" style="width:390px;height:844px"><iframe src="../18-add-b.html${hash}" width="390" height="844" class="border-0 block" title="add ${hash}"></iframe></div>`
  write('stitch/organisms/add-phone-r1.html', `<!DOCTYPE html><html lang="en">
<!-- Add a find — phone. Generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-surface-container-low font-body-md text-on-surface antialiased p-10">
<h1 class="font-headline-lg text-headline-lg mb-2">Add a find — phone</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-8 max-w-3xl">Three short steps; only a photo is required. <b>Every frame is the real page.</b></p>
<div class="flex flex-wrap items-start gap-10">
${state('photos', '1 · Photos', 'Add up to 8; remove with ×; Make cover on any photo swaps it into the cover.', 390, frame('#filled'))}
${state('details', '2 · Details', 'Name, story, categories, the five conditions.', 390, frame('#details'))}
${state('wants', '3 · Wants', 'Categories or Open to anything, and a wish.', 390, frame('#wants'))}
${state('published', '4 · It’s on the table', '+20 pts; Boost offer; list another.', 390, frame('#published'))}
${state('held', '4b · Held for a quick look', 'A person checks the photo first.', 390, frame('#held'))}
${state('limit', '0 · Table full (Hunter, 6 of 6)', 'Instead of the form — pause one or go Collector.', 390, frame('#limit'))}
</div></body></html>`)
}
}

/* ───────────────────────────── Staff tools, proposal B ─────────────────────────────
 * Moderation queue + Analytics (admin/ReportQueue.tsx, admin/Analytics.tsx,
 * admin.* and analytics.* strings). Hard invariant: NOTHING IS DECIDED
 * AUTOMATICALLY — a report freezes the swap and waits for a person. Staff reach
 * this from the account menu (a row only staff get). One page, two tabs.
 * Phone (Alex, 2026-09-29: "i do not see mobile variant"): the list is the
 * page; a row opens full screen with a back arrow, actions pinned to the
 * bottom — the My finds / Settings pattern. */
{
const face = (alt) => { for (const h of [S1, S2, S4, S5]) if (h.includes(`data-alt="${alt}`)) return imgByAlt(h, alt); throw new Error(alt) }
const LOUD = 'h-10 px-4 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg inline-flex items-center justify-center gap-1.5 whitespace-nowrap'
const QUIET = 'h-10 px-3.5 rounded-xl ring-1 ring-inset ring-outline-variant font-label-lg text-label-lg text-on-surface hover:bg-surface-container-low inline-flex items-center justify-center gap-1.5 whitespace-nowrap'
const pill = (t, cls) => `<span class="inline-flex items-center h-6 px-2 rounded-full text-[11px] font-bold ${cls}">${t}</span>`
const ST = { held: ['Held', 'bg-sky/60 text-ink'], active: ['Live', 'bg-mint text-forest'], removed: ['Hidden', 'bg-stone text-ink'], open: ['Open', 'bg-coral/70 text-ink'], reviewing: ['Reviewing', 'bg-sun/70 text-ink'], resolved: ['Resolved', 'bg-mint text-forest'] }
const UPLOADS = [
  { id: 'u1', st: 'held', src: PH.fender, t: 'Fender Vibro-Champ Amp', who: 'Marcus V.', face: face('Close up portrait photo of Marcus Vance'), when: '4 min ago', cat: 'Music · Good', note: 'First listing from this account — held for a photo check.' },
  { id: 'u2', st: 'held', src: PH.levis, t: 'Levi’s Type III Jacket', who: 'Liam V.', face: null, when: '22 min ago', cat: 'Clothing · Good', note: 'Held: the account is 2 days old.' },
  { id: 'u3', st: 'active', src: PH.lamp, t: 'Brass Banker’s Lamp', who: 'Elena R.', face: face('Portait of Elena Rostova'), when: '1 h ago', cat: 'Home & garden · Very good' },
  { id: 'u4', st: 'active', src: PH.bike, t: 'Specialized Sirrus Bike', who: 'Sara M.', face: face('Authentic candid portrait of Sara M.'), when: '3 h ago', cat: 'Sport & outdoors · Good' },
  { id: 'u5', st: 'removed', src: PH.planter, t: 'Mid-Century Teak Planter', who: 'Sora K.', face: null, when: 'Yesterday', cat: 'Home & garden', note: 'Hidden by Ana: stock photo, not the real item.' },
]
const REPORTS = [
  { id: 'r1', st: 'open', reason: 'Asked for money', swap: [PH.walkman, PH.leica], a: 'Tomás R.', b: 'Chloe D.', when: '12 min ago', frozen: true, evidence: ['“Can you add $20 on top? Then deal.”', '“I only do it with cash too.”'] },
  { id: 'r2', st: 'reviewing', reason: 'Did not show up', swap: [PH.braun, PH.pourover], a: 'Priya S.', b: 'Omar F.', when: '2 h ago', frozen: true, evidence: ['“I’m here by the fountain.” (Sat 18:02)', '“Still here…” (Sat 18:31)'] },
  { id: 'r3', st: 'resolved', reason: 'Not as described', swap: [PH.fender, PH.lamp], a: 'Ben O.', b: 'Lena W.', when: 'Yesterday', frozen: false, evidence: ['Photo shows no dent; the lamp arrived with a cracked shade.'] },
]
const av = (name, src, size = 'w-9 h-9') => src ? `<img alt="" class="${size} rounded-full object-cover" src="${src}">` : `<span class="${size} rounded-full grid place-items-center bg-stone text-ink text-[12px] font-bold">${name.split(' ').map((w) => w[0]).join('').replace('.', '')}</span>`
const row = (id, left, t, sub, st) => `<button type="button" data-pick="${id}" aria-selected="false" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-surface-container-high aria-selected:bg-primary-container">${left}<span class="min-w-0 flex-1"><span class="block truncate font-label-lg text-label-lg text-on-surface">${t}</span><span class="block truncate font-body-sm text-[12px] text-on-surface-variant">${sub}</span></span>${pill(...ST[st])}</button>`
const upRow = (u) => row(u.id, `<img alt="" class="w-12 h-12 rounded-lg object-cover" src="${u.src}">`, u.t, `${u.who} · ${u.when}`, u.st)
const rpRow = (r) => row(r.id, `<span class="relative w-12 h-12 shrink-0"><img alt="" class="absolute left-0 top-0 w-9 h-9 rounded-lg object-cover ring-2 ring-white" src="${r.swap[0]}"><img alt="" class="absolute right-0 bottom-0 w-9 h-9 rounded-lg object-cover ring-2 ring-white" src="${r.swap[1]}"></span>`, r.reason, `${r.a} ⇄ ${r.b} · ${r.when}`, r.st)
const upDetail = (u) => `<article data-detail="${u.id}" hidden class="h-full overflow-y-auto p-6 grid gap-6" style="grid-template-columns:minmax(0,1fr) 300px">
<div data-up-main class="flex flex-col gap-3"><img alt="" class="w-full aspect-[4/3] rounded-xl object-cover" src="${u.src}"><div class="flex items-start gap-3"><div class="flex-1"><p class="font-headline-sm text-headline-sm text-on-surface">${u.t}</p><p class="font-body-sm text-body-sm text-on-surface-variant">${u.cat} · listed ${u.when}</p></div>${pill(...ST[u.st])}</div>${u.note ? `<p class="rounded-lg bg-surface-container-low px-3 py-2 font-body-sm text-body-sm text-on-surface">${u.note}</p>` : ''}
<div data-staff-foot class="flex flex-wrap gap-2 pt-1">${u.st === 'held' ? `<button type="button" data-missing="Published — it joins the deck" class="${LOUD}">${icon('check', 'text-[18px]')}Publish</button><button type="button" data-missing="Hidden — reversible; the lister is told why" class="${QUIET}">${icon('visibility_off', 'text-[18px]')}Hide</button>` : u.st === 'removed' ? `<button type="button" data-missing="Restored — back in the deck" class="${QUIET}">${icon('undo', 'text-[18px]')}Restore</button>` : `<button type="button" data-missing="Hidden — reversible; the lister is told why" class="${QUIET}">${icon('visibility_off', 'text-[18px]')}Hide</button>`}</div></div>
<aside class="flex flex-col gap-3 rounded-xl ring-1 ring-surface-variant p-4 self-start"><p class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Uploader</p><div class="flex items-center gap-3">${av(u.who, u.face, 'w-11 h-11')}<div><p class="font-label-lg text-label-lg text-on-surface">${u.who}</p><p class="font-body-sm text-[12px] text-on-surface-variant">joined Sep 2026</p></div></div>
<ul class="grid grid-cols-2 gap-2 font-body-sm text-[12px] text-on-surface-variant">${['3 listings', '1 hidden', 'blocked by 0 people', '0 reports'].map((x) => `<li class="rounded-lg bg-surface-container-low px-2.5 py-2">${x}</li>`).join('')}</ul>
<button type="button" data-missing="Suspend asks why (for the record) and confirms — reversible" class="${QUIET}">${icon('block', 'text-[18px]')}Suspend account</button></aside></article>`
const rpDetail = (r) => `<article data-detail="${r.id}" hidden class="h-full overflow-y-auto p-6 flex flex-col gap-5 max-w-[860px]">
<div class="flex items-start gap-3"><div class="flex-1"><p class="font-headline-md text-headline-md text-on-surface">${r.reason}</p><p class="font-body-sm text-body-sm text-on-surface-variant">${r.a} reported ${r.b} · ${r.when}</p></div>${pill(...ST[r.st])}</div>
${r.frozen ? `<p class="flex items-start gap-2 rounded-xl bg-sky/40 px-4 py-3 font-body-sm text-body-sm text-ink">${icon('ac_unit', 'text-[18px] mt-0.5')}The swap is frozen. Nothing happens until someone here decides — neither side can confirm or call it off.</p>` : ''}
<div class="flex items-center gap-3">${r.swap.map((src, i) => `<figure class="flex-1"><img alt="" class="w-full aspect-[4/3] rounded-xl object-cover" src="${src}"><figcaption class="mt-1 font-body-sm text-[12px] text-on-surface-variant">${i ? r.b + '’s find' : r.a + '’s find'}</figcaption></figure>${i ? '' : icon('sync_alt', 'text-[22px] text-on-surface-variant')}`).join('')}</div>
<section class="flex flex-col gap-2"><p class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Evidence from the chat</p>${r.evidence.map((e) => `<p class="rounded-lg bg-surface-container-low px-3 py-2 font-body-md text-body-md text-on-surface">${e}</p>`).join('')}</section>
<label class="flex flex-col gap-1.5"><span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Internal note</span><textarea rows="2" placeholder="What we saw in the thread, and what we told each side." class="px-3 py-2 rounded-xl ring-1 ring-inset ring-outline-variant font-body-md text-body-md outline-none focus:ring-2 focus:ring-primary/50 resize-none"></textarea></label>
<div data-staff-foot class="flex flex-wrap gap-2">${r.st === 'resolved' ? `<p class="font-body-sm text-body-sm text-on-surface-variant">Resolved by Ana · swap cancelled, both finds relisted.</p>` : `${r.st === 'open' ? `<button type="button" data-missing="Marked as reviewing — others see you have it" class="${QUIET}">Start reviewing</button>` : ''}<button type="button" data-missing="Unfrozen — they can finish the swap" class="${QUIET}">${icon('play_arrow', 'text-[18px]')}Unfreeze and let it finish</button><button type="button" data-missing="Cancelled — both finds back in the deck" class="${QUIET}">${icon('undo', 'text-[18px]')}Cancel the swap, relist both</button><button type="button" data-missing="Resolved" class="${LOUD}">${icon('check', 'text-[18px]')}Mark resolved</button>`}</div></article>`

const tile = (n, t, d) => `<div class="rounded-xl ring-1 ring-surface-variant p-4"><p class="font-body-sm text-body-sm text-on-surface-variant">${t}</p><p class="font-display text-[32px] leading-9 font-semibold text-on-surface">${n}</p><p class="font-body-sm text-[12px] ${d.startsWith('+') ? 'text-primary' : 'text-on-surface-variant'}">${d}</p></div>`
const FUNNEL = [['Signed up', 1240], ['Listed a find', 812], ['Swiped the deck', 1104], ['Made an offer', 540], ['Matched', 318], ['Completed a swap', 201]]
const EVENTS = [['swipe_pass', 18402, 903], ['swipe_offer', 2210, 540], ['find_listed', 1033, 812], ['offer_accepted', 402, 318], ['swap_confirmed', 402, 201], ['voice_note_sent', 188, 74], ['boost_bought', 61, 48]]
const EXPS = [
  { k: 'deck_empty_cta', what: 'Widen radius first, instead of the wishlist prompt', goal: 'Made an offer', st: 'running', a: [42, 510], b: [61, 498], ready: true },
  { k: 'onboarding_tastes', what: 'Ask for tastes during onboarding', goal: 'Swiped the deck', st: 'running', a: [80, 96], b: [88, 101], ready: false },
  { k: 'offer_note_prompt', what: 'Suggest a note when offering', goal: 'Matched', st: 'draft' },
]
const expCard = (x) => `<article class="rounded-xl ring-1 ring-surface-variant p-4 flex flex-col gap-3"><div class="flex items-start gap-3"><div class="flex-1"><p class="font-label-lg text-label-lg text-on-surface">${x.what}</p><p class="font-body-sm text-[12px] text-on-surface-variant"><code class="font-mono">${x.k}</code> · Goal: ${x.goal} · 50% see B</p></div>${pill(x.st === 'running' ? 'Running' : 'Draft', x.st === 'running' ? 'bg-mint text-forest' : 'bg-stone text-ink')}</div>
${x.a ? `<div class="grid grid-cols-2 gap-3">${[['A — as it is now', x.a], ['B — the new version', x.b]].map(([t, [c, e]]) => `<div class="rounded-lg bg-surface-container-low p-3"><p class="font-body-sm text-[12px] text-on-surface-variant">${t}</p><p class="font-display text-[24px] leading-7 font-semibold text-on-surface">${Math.round((c / e) * 100)}%</p><p class="font-body-sm text-[12px] text-on-surface-variant">${c} of ${e} people</p><div class="mt-2 h-1.5 rounded-full bg-surface-variant"><div class="h-full rounded-full bg-primary" style="width:${Math.round((c / e) * 100)}%"></div></div></div>`).join('')}</div>
<p class="font-body-sm text-[12px] ${x.ready ? 'text-on-surface' : 'text-on-surface-variant'}">${x.ready ? 'Both sides have enough people for this to mean something. Read it alongside what you know.' : 'Too early to call. Each side needs at least 100 people before a difference means anything.'}</p>
<div class="flex gap-2"><button type="button" data-missing="Stopped — everyone sees A again" class="${QUIET}">Stop</button></div>` : `<div class="flex gap-2"><button type="button" data-missing="Started — half of new visitors see B" class="${LOUD}">Start</button><button type="button" data-missing="Deleted" class="${QUIET}">Delete</button></div>`}</article>`

const analytics = `<div data-pane="analytics" hidden class="h-full overflow-y-auto p-4 md:p-6 flex flex-col gap-6">
<div class="grid grid-cols-2 xl:grid-cols-4 gap-3">${tile('214', 'Today', '+12% on last Tuesday')}${tile('1,031', 'This week', '+8%')}${tile('2,960', 'This month', '+21%')}${tile('388', 'On a streak', '38% of this week')}</div>
<div class="grid gap-6" style="grid-template-columns:repeat(auto-fit,minmax(min(380px,100%),1fr))">
<section class="rounded-xl ring-1 ring-surface-variant p-5 flex flex-col gap-3"><div><p class="font-headline-sm text-headline-sm text-on-surface">From signing up to swapping</p><p class="font-body-sm text-[12px] text-on-surface-variant">People who ever reached each step, not totals.</p></div>
<ul class="flex flex-col gap-2.5">${FUNNEL.map(([t, n], i) => `<li><div class="flex justify-between font-body-sm text-body-sm"><span class="text-on-surface">${t}</span><span class="font-ticker-number text-on-surface">${n.toLocaleString('en')}${i ? ` <span class="text-on-surface-variant font-normal">· ${Math.round((n / FUNNEL[0][1]) * 100)}%</span>` : ''}</span></div><div class="mt-1 h-2 rounded-full bg-surface-variant"><div class="h-full rounded-full bg-primary" style="width:${(n / FUNNEL[0][1]) * 100}%"></div></div></li>`).join('')}</ul></section>
<section class="rounded-xl ring-1 ring-surface-variant p-5 flex flex-col gap-3"><p class="font-headline-sm text-headline-sm text-on-surface">Events, last 7 days</p>
<table class="w-full font-body-sm text-body-sm"><thead><tr class="text-left text-on-surface-variant"><th class="font-semibold pb-2">Event</th><th class="font-semibold pb-2 text-right">Times</th><th class="font-semibold pb-2 text-right">People</th></tr></thead><tbody>${EVENTS.map(([e, t, p]) => `<tr class="border-t border-surface-variant"><td class="py-2 font-mono text-[12px]">${e}</td><td class="py-2 text-right font-ticker-number">${t.toLocaleString('en')}</td><td class="py-2 text-right font-ticker-number">${p.toLocaleString('en')}</td></tr>`).join('')}</tbody></table></section></div>
<section class="flex flex-col gap-3"><div class="flex items-center justify-between"><p class="font-headline-sm text-headline-sm text-on-surface">Experiments</p><button type="button" data-missing="New experiment: key, what you're testing, what counts as winning, split" class="${QUIET}">${icon('add', 'text-[18px]')}New experiment</button></div><div class="grid gap-3" style="grid-template-columns:repeat(auto-fit,minmax(min(380px,100%),1fr))">${EXPS.map(expCard).join('')}</div></section></div>`

const moderation = `<div data-pane="moderation" class="h-full grid" style="grid-template-columns:clamp(320px,26vw,400px) 1fr">
<aside class="min-h-0 overflow-y-auto border-r border-surface-variant p-2">
<div class="flex gap-1.5 p-2">${[['uploads', 'Uploads', UPLOADS.filter((u) => u.st === 'held').length + ' held'], ['reports', 'Reports', REPORTS.filter((r) => r.st !== 'resolved').length + ' open']].map(([id, t, n], i) => `<button type="button" data-sub="${id}" aria-pressed="${!i}" class="h-9 px-3 rounded-full ring-1 ring-inset ring-outline-variant font-label-md text-label-md text-on-surface-variant aria-pressed:bg-ink aria-pressed:text-white aria-pressed:ring-ink">${t} · ${n}</button>`).join('')}</div>
<div data-list="uploads" class="flex flex-col gap-0.5">${UPLOADS.map(upRow).join('')}</div><div data-list="reports" hidden class="flex flex-col gap-0.5">${REPORTS.map(rpRow).join('')}</div></aside>
<section data-staff-detail class="min-h-0 bg-surface-container-lowest"><div data-back-bar class="shrink-0 items-center gap-2 px-2 h-14 border-b border-surface-variant"><button type="button" data-back aria-label="Back to the queue" class="grid place-items-center w-10 h-10 rounded-full text-on-surface hover:bg-surface-container-high">${icon('arrow_back', 'text-[22px]')}</button><p data-back-title class="font-label-lg text-label-lg text-on-surface">Upload</p></div>${UPLOADS.map(upDetail).join('')}${REPORTS.map(rpDetail).join('')}</section></div>`

const body = `<!-- Staff tools, proposal B (build-revisions.mjs) -->
<style>[data-staff] [hidden]{display:none!important}
[data-back-bar]{display:none}
@media (max-width:1023.98px){
  [data-staff]{height:auto!important;padding:0!important}
  [data-staff-card]{border-radius:0!important;box-shadow:none!important;min-height:calc(100dvh - 80px)}
  [data-pane]{height:auto!important}[data-pane="moderation"]{display:block!important}[data-pane][hidden]{display:none!important}
  [data-pane] aside{border:0!important}
  [data-staff-note]{flex-basis:100%;margin-left:0!important;padding-bottom:10px}
  /* The picked upload or report opens full screen, over the tab bar. */
  [data-staff-detail]{position:fixed;inset:0;z-index:60;display:none;flex-direction:column}
  html.staff-open [data-staff-detail]{display:flex}html.staff-open{overflow:hidden}
  [data-back-bar]{display:flex}
  [data-staff-detail] article{grid-template-columns:1fr!important;flex:1;min-height:0;height:auto!important;padding:16px!important}
  [data-staff-foot]{position:sticky;bottom:0;z-index:1;background:var(--v6-foot-bg,#fff);margin:0 -16px;padding:12px 16px max(12px,env(safe-area-inset-bottom));border-top:1px solid rgb(237 235 228)}
  [data-staff-foot]>button{flex:1}
  /* Upload: the decisions sit under the uploader card, pinned to the bottom. */
  [data-staff-detail] [data-up-main]{display:contents!important}[data-staff-detail] article{row-gap:12px!important;align-content:start}[data-staff-detail] [data-staff-foot]{order:99;margin-bottom:-16px}
}
@media (min-width:768px){[data-phone-title]{display:none!important}}
@media (max-width:767.98px){[data-staff]{margin-top:-24px}[data-staff-card]{min-height:calc(100dvh - 56px - 64px)}}</style>
<div data-staff class="px-margin md:px-gutter-desktop pt-6 pb-6 lg:h-[calc(100dvh-80px)]">
<div data-staff-card class="h-full flex flex-col rounded-xl bg-surface-container-lowest ring-1 ring-surface-variant/70 overflow-hidden">
<div data-phone-title class="flex items-center gap-2 px-4 pt-4"><h1 class="font-headline-md text-headline-md text-on-surface">Staff tools</h1><span class="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-sky/50 text-ink text-[12px] font-bold">${icon('shield_person', 'text-[14px]')}Staff only</span></div>
<div class="shrink-0 flex flex-wrap items-center gap-x-6 px-4 md:px-5 pt-2 border-b border-surface-variant">${[['moderation', 'Moderation'], ['analytics', 'Analytics']].map(([id, t], i) => `<button type="button" data-tab="${id}" aria-selected="${!i}" class="h-11 px-1 border-b-2 border-transparent font-label-lg text-label-lg text-on-surface-variant aria-selected:border-primary aria-selected:text-on-surface">${t}</button>`).join('')}<p data-staff-note class="ml-auto font-body-sm text-[12px] text-outline">Nothing is decided automatically — every report waits for a person.</p></div>
<div class="flex-1 min-h-0">${moderation}${analytics}</div></div></div>
<script>
(() => {
  const compact = () => matchMedia('(max-width:1023.98px)').matches
  const close = () => document.documentElement.classList.remove('staff-open')
  // On a phone nothing is picked until you tap it; then it opens full screen.
  const pick = (id, open = true) => {
    if (open && compact()) document.documentElement.classList.add('staff-open')
    if (open || !compact()) document.querySelectorAll('[data-pick]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.pick === id)))
    document.querySelectorAll('[data-detail]').forEach((d) => (d.hidden = d.dataset.detail !== id))
    document.querySelector('[data-back-title]').textContent = id[0] === 'u' ? 'Upload' : 'Report'
  }
  const sub = (s) => { document.querySelectorAll('[data-sub]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sub === s))); document.querySelectorAll('[data-list]').forEach((l) => (l.hidden = l.dataset.list !== s)); pick(s === 'uploads' ? 'u1' : 'r1', false) }
  const tab = (t) => { document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === t))); document.querySelectorAll('[data-pane]').forEach((p) => (p.hidden = p.dataset.pane !== t)) }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-back]')) return close()
    const t = e.target.closest('[data-tab]'); if (t) return tab(t.dataset.tab)
    const s = e.target.closest('[data-sub]'); if (s) return sub(s.dataset.sub)
    const r = e.target.closest('[data-pick]'); if (r) return pick(r.dataset.pick)
  })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })
  const h = location.hash.slice(1)
  if (h === 'analytics') tab('analytics'); else if (h === 'reports') sub('reports')
  else if (/^r[0-9]$/.test(h)) { sub('reports'); pick(h) } else if (/^u[0-9]$/.test(h)) pick(h); else pick('u1', false)
})()
</script>
`
let s = read('stitch/11-plain-shell.html').replace('<title>', '<title>STAFF (B) · ')
const a = s.indexOf('<!-- Subtle Ambient Glow Canvas -->'), b = s.indexOf('<!-- FAST LISTING DRAWER')
if (a < 0 || b < 0) throw new Error('staff B: content markers not found')
s = s.slice(0, a) + body + s.slice(b)
const h = s.indexOf('<header data-organism="topbar" data-variant="desktop"'), he = s.indexOf('</header>', h)
const keep = LINK_BASE; LINK_BASE = ''
s = s.slice(0, h) + topbar({ fixed: true, cls: 'max-md:hidden', context: `<h1 class="font-headline-md text-headline-md text-on-surface shrink-0">Staff tools</h1><span class="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-sky/50 text-ink text-[12px] font-bold">${icon('shield_person', 'text-[14px]')}Staff only</span>` }) + s.slice(he + '</header>'.length)
LINK_BASE = keep
write('stitch/19-staff-b.html', s)
{
  const frame = (hash = '') => `<div class="rounded-[28px] overflow-hidden ring-1 ring-outline-variant bg-background shadow-md" style="width:390px;height:844px"><iframe src="../19-staff-b.html${hash}" width="390" height="844" class="border-0 block" title="staff ${hash}"></iframe></div>`
  write('stitch/organisms/staff-phone-r1.html', `<!DOCTYPE html><html lang="en">
<!-- Staff tools — phone. Generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-surface-container-low font-body-md text-on-surface antialiased p-10">
<h1 class="font-headline-lg text-headline-lg mb-2">Staff tools — phone</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-8 max-w-3xl">The queue is the page. Tap an upload or a report and it opens full screen with a back arrow; the decisions are pinned to the bottom. Nothing is decided automatically. <b>Every frame is the real page</b> — tap, go back.</p>
<div class="flex flex-wrap items-start gap-10">
${state('uploads', '1 · Uploads queue', 'Two held for a photo check; live and hidden below.', 390, frame(''))}
${state('held', '2 · A held upload', 'Publish or Hide, pinned. The uploader card under the photo.', 390, frame('#u1'))}
${state('reports', '3 · Reports queue', 'Open and reviewing first; the resolved one stays for the record.', 390, frame('#reports'))}
${state('report', '4 · An open report', 'The swap is frozen. Evidence, a note, then a person decides.', 390, frame('#r1'))}
${state('analytics', '5 · Analytics', 'Four numbers, the funnel, events, experiments — one column.', 390, frame('#analytics'))}
</div></body></html>`)
}
}

/* ───────────────────────────── It's a bartefy! — the match moment ─────────────────────────────
 * Alex, 2026-09-29: "when a swap is a match we need a 'matched' screen, with
 * fireworks or something fun." It opens wherever a match is made:
 *   - Swaps & offers → Accept swap (the owner says yes),
 *   - Eyeing → Swap (you take a quiet offer — Collector),
 *   - Discover → you offer on a find whose owner already put theirs on the
 *     table for yours (the mirror match; Marcus's amp in the mock).
 * The two finds fly in and meet, a burst of confetti, "It's a bartefy!".
 * Motion is transform + opacity only; reduced-motion gets a still version.
 * window.v6Match({ name, a: your photo, b: their photo, href }) opens it. */
const MATCH_KIT = `<!-- It's a bartefy! (build-revisions.mjs) -->
<style>
[data-match-ov][hidden]{display:none!important}
@keyframes v6-in-l{from{transform:translateX(-140%) rotate(-24deg);opacity:0}to{transform:translateX(0) rotate(-8deg);opacity:1}}
@keyframes v6-in-r{from{transform:translateX(140%) rotate(24deg);opacity:0}to{transform:translateX(0) rotate(8deg);opacity:1}}
@keyframes v6-pop{0%{transform:scale(0)}60%{transform:scale(1.25)}100%{transform:scale(1)}}
@keyframes v6-rise{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}
@keyframes v6-burst{0%{transform:translate(0,0) rotate(0) scale(1);opacity:1}100%{transform:translate(var(--x),var(--y)) rotate(var(--r)) scale(.6);opacity:0}}
[data-match-ov] .v6-l{animation:v6-in-l .6s cubic-bezier(.2,0,0,1) both}
[data-match-ov] .v6-r{animation:v6-in-r .6s cubic-bezier(.2,0,0,1) both}
[data-match-ov] .v6-pop{animation:v6-pop .45s cubic-bezier(.2,0,0,1) .5s both}
[data-match-ov] .v6-rise{animation:v6-rise .4s cubic-bezier(.2,0,0,1) both}
[data-match-ov] .v6-bit{position:absolute;left:50%;top:38%;width:10px;height:14px;border-radius:3px;animation:v6-burst 1.3s cubic-bezier(.2,0,0,1) both}
@media (prefers-reduced-motion:reduce){[data-match-ov] *{animation:none!important}[data-match-ov] .v6-bit{display:none}}
</style>
<div data-match-ov hidden role="dialog" aria-modal="true" aria-label="It's a bartefy!" class="fixed inset-0 z-[90] grid place-items-center overflow-hidden p-6" style="background:rgba(14,59,48,.97)">
<div data-bits aria-hidden="true" class="pointer-events-none absolute inset-0"></div>
<div class="relative w-full max-w-[440px] flex flex-col items-center text-center gap-6 text-white">
<p class="v6-rise font-label-sm text-label-sm uppercase tracking-[0.2em] text-mint" style="animation-delay:.2s">It’s a match</p>
<div class="relative h-[190px] w-[320px]">
<img data-m-a alt="Your find" class="v6-l absolute left-0 top-2 w-[160px] h-[160px] rounded-2xl object-cover ring-4 ring-white shadow-[0_20px_40px_rgba(0,0,0,0.35)]" src="">
<img data-m-b alt="Their find" class="v6-r absolute right-0 top-2 w-[160px] h-[160px] rounded-2xl object-cover ring-4 ring-white shadow-[0_20px_40px_rgba(0,0,0,0.35)]" src="">
<span class="v6-pop absolute left-1/2 top-[70px] -ml-7 grid place-items-center w-14 h-14 rounded-full bg-coral text-ink ring-4 ring-[#0E3B30] shadow-lg"><span class="material-symbols-outlined text-[28px]">handshake</span></span></div>
<h2 class="v6-rise font-headline-lg text-[40px] leading-[44px] font-bold" style="animation-delay:.45s">It’s a bartefy!</h2>
<p class="v6-rise -mt-3 font-body-md text-[17px] leading-6 text-white/85" style="animation-delay:.55s">You and <b data-m-name class="text-white">them</b> both want this swap. Both finds are off the deck — say hello and set up the handover.</p>
<div class="v6-rise w-full flex flex-col gap-2 pt-2" style="animation-delay:.65s">
<a data-m-go href="04-active-swaps-volume-b.html#a1" class="h-12 rounded-xl bg-white text-forest font-label-lg text-[16px] font-bold inline-flex items-center justify-center gap-2 hover:bg-mint"><span class="material-symbols-outlined text-[20px]">chat</span>Say hello to <span data-m-first>them</span></a>
<button type="button" data-m-close class="h-12 rounded-xl text-white/85 font-label-lg text-[15px] hover:bg-white/10">Keep hunting</button></div>
<p class="v6-rise inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/10 text-[13px] text-white/85" style="animation-delay:.75s"><span class="material-symbols-outlined text-[16px] text-sun">toll</span>+10 pts when it’s agreed · +40 when you both confirm</p>
</div></div>
<script>
(() => {
  const ov = document.querySelector('[data-match-ov]'); if (!ov) return
  const COLS = ['#EDC857', '#EE8B6A', '#7EB3DD', '#AE9FDC', '#D6EBDF', '#FFFFFF']
  const burst = () => {
    const box = ov.querySelector('[data-bits]'); box.innerHTML = ''
    for (let w = 0; w < 3; w++) for (let k = 0; k < 28; k++) {
      const b = document.createElement('span'); b.className = 'v6-bit'
      const ang = Math.random() * Math.PI * 2, d = 140 + Math.random() * 260
      b.style.setProperty('--x', Math.cos(ang) * d + 'px'); b.style.setProperty('--y', Math.sin(ang) * d + 120 + 'px'); b.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg')
      b.style.background = COLS[(k + w) % COLS.length]; b.style.animationDelay = (0.45 + w * 0.35) + 's'
      b.style.left = (50 + (w - 1) * 22) + '%'; b.style.top = (30 + (w % 2) * 14) + '%'
      box.appendChild(b)
    }
  }
  window.v6Match = ({ name = 'Marcus V.', a, b, href } = {}) => {
    const first = name.split(' ')[0]
    ov.querySelector('[data-m-name]').textContent = name; ov.querySelector('[data-m-first]').textContent = first
    ov.querySelector('[data-m-a]').src = a || ${JSON.stringify(PH.fujicase)}; ov.querySelector('[data-m-b]').src = b || ${JSON.stringify(PH.fender)}
    if (href) ov.querySelector('[data-m-go]').href = href
    // Restart the animations every time it opens.
    ov.hidden = true; void ov.offsetWidth; ov.hidden = false; burst()
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-m-close]')) { ov.hidden = true; return }
    const t = e.target.closest('[data-match-open]'); if (!t) return
    e.preventDefault(); e.stopPropagation()
    const art = t.closest('[data-detail], [data-eye-card]')
    const pics = art ? [...art.querySelectorAll('img.v6-pane-photo, img[data-eye-mine], img[data-eye-theirs]')] : []
    const mine = art && (art.querySelector('img[data-eye-mine]') || pics[0]), theirs = art && (art.querySelector('img[data-eye-theirs]') || pics[1])
    window.v6Match({ name: t.dataset.name, a: t.dataset.a || (mine && mine.src), b: t.dataset.b || (theirs && theirs.src), href: t.dataset.href })
  }, true)
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') ov.hidden = true })
  if (location.hash.slice(1).split('+').includes('match')) window.v6Match({})
})()
</script>`
const withMatch = (f, patch = (x) => x) => {
  let s = patch(read(f))
  if (!s.includes('</body>')) throw new Error(`${f}: no </body>`)
  write(f, s.replace('</body>', `${MATCH_KIT}\n</body>`))
}
// Swaps: Accept swap is the owner's yes — the moment it becomes a match.
withMatch('stitch/04-active-swaps-volume-b.html', (s) => {
  const n = s.replace(/data-missing="Accepted — it moves to Agreed and the chat with ([^"]+) opens"/g, (_, first) => `data-match-open data-name="${first}" data-href="04-active-swaps-volume-b.html#a1"`)
  if (n === s) throw new Error('swaps: Accept buttons not found')
  return n
})
// Discover: Marcus already put his amp on the table for your Fuji case (a
// quiet offer). Offering on his card closes the loop — a mirror match.
withMatch('stitch/02-discover-desktop-r1.html', (s) => {
  const n = s.replace('aria-label="Fender Vibro-Champ Amp (1968)"', 'aria-label="Fender Vibro-Champ Amp (1968)" data-mirror="Marcus V."')
  if (n === s) throw new Error('discover: Fender card not found')
  return n
})

/* ───────────────────────────── Eyeing — who put a find on the table for yours ─────────────────────────────
 * Alex, 2026-09-29: "a new page where I can see who liked my items … I need
 * to pay for that … cards that are blurred and the user can unlock … and it
 * should have notification indicators like other pages. Do not exceed 99+."
 * In the engine a plain Put-on-Table is free and hidden from the owner
 * (project rules: "a plain like IS an offer row … not shown to the
 * recipient"). This page shows them. Collector only (Alex): Hunter sees the
 * cards blurred with one way in — Collector. Unlocked, each card is a real
 * offer: Swap makes the match right there (the match moment), Pass hides it. */
{
const face = (alt) => { for (const h of [S1, S2, S4, S5]) if (h.includes(`data-alt="${alt}`)) return imgByAlt(h, alt); return null }
const F = { marcus: face('Close up portrait photo of Marcus Vance'), elena: face('Portait of Elena Rostova'), julian: face('Portrait of Julian Ross'), sara: face('Authentic candid portrait of Sara M.'), samira: SAMIRA }
const mine = (t) => byTitle(t)
const TOTAL = 128, NEW = 14
const cap = (n) => (n > 99 ? '99+' : String(n))
const EYES = [
  ['Marcus V.', F.marcus, 'Fender Vibro-Champ Amp', PH.fender, 'Marantz 2215B Receiver', '12 min ago', true],
  ['Elena R.', F.elena, 'Brass Banker’s Lamp', PH.lamp, 'Lamy 2000 Fountain Pen', '1 h ago', true],
  ['Samira P.', F.samira, 'Leica Mini 35mm', LEICA, 'Fuji X100 Leather Half-Case', '2 h ago', true],
  ['Julian R.', F.julian, 'Olympus OM-1 35mm SLR', OLYMPUS, 'Marantz 2215B Receiver', '3 h ago', true],
  ['Sara M.', F.sara, 'Specialized Sirrus Bike', PH.bike, 'Wool Camp Blanket', 'Yesterday', false],
  ['Liam V.', null, 'Levi’s Type III Denim', PH.levis, 'Braun AB1 Travel Clock', 'Yesterday', false],
  ['Sora K.', null, 'Mid-Century Teak Planter', PH.planter, 'Ceramic Pour-Over Set', 'Mon', false],
  ['Aiko H.', null, 'Sony Walkman WM-D6C', WALKMAN, 'Marantz 2215B Receiver', 'Mon', false],
  ['Noah B.', null, 'Terracotta Planters ×3', PH.terracotta, 'Ceramic Pour-Over Set', 'Sun', false],
  ['Ines G.', null, 'Braun Alarm Clock', PH.braun, 'Lamy 2000 Fountain Pen', 'Sun', false],
  ['Priya S.', null, 'Pour-Over Kettle', PH.pourover, 'Fuji X100 Leather Half-Case', 'Sat', false],
  ['Ben O.', null, 'Wool Camp Blanket', PH.blanket, 'Braun AB1 Travel Clock', 'Sat', false],
].map(([name, avatar, t, src, want, when, fresh], i) => ({ id: `e${i + 1}`, name, first: name.split(' ')[0], avatar, t, src, want: mine(want), when, fresh }))
const PER = {}; for (const e of EYES) PER[e.want.title] = (PER[e.want.title] || 0) + 1
const initials = (n) => n.split(' ').map((w) => w[0]).join('').replace('.', '')
const av = (e, cls) => e.avatar ? `<img alt="" class="${cls} rounded-full object-cover" src="${e.avatar}">` : `<span class="${cls} rounded-full grid place-items-center bg-lilac text-ink text-[12px] font-bold">${initials(e.name)}</span>`

const card = (e) => `<article data-eye-card data-want="${e.want.id}" class="group relative rounded-2xl overflow-hidden bg-surface-container-lowest ring-1 ring-surface-variant/70 flex flex-col">
<div class="relative aspect-[4/3] overflow-hidden"><img data-eye-theirs alt="" class="v6-blur w-full h-full object-cover transition-[filter,transform] duration-200" src="${e.src}">
${e.fresh ? '<span class="absolute top-2.5 left-2.5 h-6 px-2 inline-flex items-center rounded-full bg-coral text-ink text-[11px] font-bold">New</span>' : ''}
<span data-eye-for class="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 h-9 pl-1 pr-2.5 rounded-full bg-white/95 text-[12px] font-semibold text-on-surface shadow whitespace-nowrap"><img data-eye-mine alt="" class="w-7 h-7 rounded-full object-cover shrink-0" src="${e.want.src}"><span class="truncate">for your <b class="font-semibold">${e.want.title.split(' ').slice(0, 2).join(' ')}</b><i class="not-italic md:hidden">${e.want.title.split(' ')[0]}</i></span></span>
<span data-lock class="absolute inset-0 grid place-items-center"><span class="grid place-items-center w-12 h-12 rounded-full bg-white/90 text-on-surface shadow">${icon('lock', 'text-[24px]')}</span></span></div>
<div class="p-3 flex flex-col gap-2.5">
<div class="flex items-center gap-2.5 min-w-0"><span class="v6-blur shrink-0">${av(e, 'w-9 h-9')}</span><div class="min-w-0 flex-1"><p class="v6-blur truncate font-label-lg text-label-lg text-on-surface">${e.name}</p><p class="v6-blur truncate font-body-sm text-[12px] text-on-surface-variant">${e.t}</p></div><span data-eye-when class="shrink-0 font-body-sm text-[12px] text-outline">${e.when}</span></div>
<div data-eye-acts class="grid grid-cols-[auto_1fr] gap-2"><button type="button" data-eye-pass class="h-10 px-3 rounded-xl ring-1 ring-inset ring-outline-variant font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low">Pass</button><button type="button" data-match-open data-name="${e.name}" data-href="04-active-swaps-volume-b.html#a1" class="h-10 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg inline-flex items-center justify-center gap-1.5 hover:bg-forest">${icon('handshake', 'text-[18px]')}Swap</button></div>
</div></article>`

const chips = `<div class="v6-strip flex gap-2 overflow-x-auto">${[['all', 'All your finds', EYES.length], ...Object.entries(PER).map(([t, n]) => [mine(t).id, t, n])].map(([id, t, n], i) => `<button type="button" data-eye-chip="${id}" aria-pressed="${!i}" class="shrink-0 inline-flex items-center gap-2 h-9 ${id === 'all' ? 'px-3.5' : 'pl-1 pr-3'} rounded-full ring-1 ring-inset ring-outline-variant bg-surface-container-lowest font-label-md text-label-md text-on-surface-variant aria-pressed:bg-inverse-surface aria-pressed:text-inverse-on-surface aria-pressed:ring-inverse-surface">${id === 'all' ? '' : `<img alt="" class="w-7 h-7 rounded-full object-cover" src="${mine(t).src}">`}${id === 'all' ? t : t.split(' ').slice(0, 2).join(' ')}<span class="opacity-70">${n}</span></button>`).join('')}</div>`

const LOUD = 'h-12 px-5 rounded-xl bg-primary text-on-primary font-label-lg text-[15px] font-bold shadow-[0_6px_18px_rgba(27,107,85,0.28)] hover:bg-forest inline-flex items-center justify-center gap-2 whitespace-nowrap'
const lockBar = `<div data-lockbar class="shrink-0 flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 border-t border-surface-variant bg-surface-container-lowest">
<span class="grid place-items-center w-11 h-11 rounded-xl bg-sun/70 text-ink shrink-0">${filled('visibility', 'text-[22px]')}</span>
<div class="min-w-0 flex-1"><p class="font-label-lg text-[16px] text-on-surface">${TOTAL} people want to swap with you</p><p data-lock-sub class="font-body-sm text-body-sm text-on-surface-variant">Collector shows who they are and what they offer — then one tap and it’s a swap.</p></div>
<button type="button" data-open-buy class="${LOUD}">${filled('workspace_premium', 'text-[20px]')}Go Collector · 600 pts</button>
<p data-lock-note class="basis-full sm:basis-auto font-body-sm text-[12px] text-outline">You have <b class="text-on-surface">1,000 test pts</b> — enough for Collector.</p></div>`
// Alex, 2026-09-29: "give me 1000 points so I can test" — the mock's wallet
// here starts at 1,000 TEST points (the real app has no Admirers page yet, and
// its database is not touched). Go Collector really spends 600 and unlocks.
const buy = `<div data-buy hidden class="fixed inset-0 z-[80] grid place-items-center bg-inverse-surface/50 p-4 max-md:place-items-end max-md:p-0">
<div role="dialog" aria-label="Go Collector" class="w-full max-w-[420px] rounded-2xl max-md:rounded-b-none bg-surface-container-lowest p-6 pb-[max(24px,env(safe-area-inset-bottom))] flex flex-col gap-4 shadow-[0_24px_60px_rgba(31,27,24,0.25)]">
<span class="grid place-items-center w-12 h-12 rounded-xl bg-sun/70 text-ink">${filled('workspace_premium', 'text-[26px]')}</span>
<div><p class="font-headline-sm text-headline-sm text-on-surface">Collector for 30 days</p><p class="mt-1 font-body-md text-body-md text-on-surface-variant">See all your admirers and swap on the spot. Also: no limit on finds, hunt out to 50 km, undo a pass.</p></div>
<div class="rounded-xl bg-surface-container-low px-4 py-3 flex flex-col gap-1 font-body-md text-body-md"><p class="flex justify-between"><span class="text-on-surface-variant">Your points</span><b data-bal>1,000</b></p><p class="flex justify-between"><span class="text-on-surface-variant">Collector · 30 days</span><b>− 600</b></p><p class="flex justify-between border-t border-surface-variant pt-1 mt-1"><span class="text-on-surface-variant">Left after</span><b>400</b></p></div>
<div class="flex gap-2 justify-end"><button type="button" data-buy-close class="h-12 px-4 rounded-xl font-label-lg text-[15px] font-bold text-on-surface-variant hover:bg-surface-container-high">Not now</button><button type="button" data-buy-go class="${LOUD}">Spend 600 pts</button></div>
</div></div>`

const body = `<!-- Eyeing (build-revisions.mjs) -->
<style>[data-eye] [hidden]{display:none!important}
.v6-strip{scrollbar-width:none}.v6-strip::-webkit-scrollbar{display:none}
[data-eye-grid]{grid-template-columns:repeat(auto-fill,minmax(230px,1fr))}
/* Hunter: blurred, locked, no actions. Collector: html.eye-open. */
html:not(.eye-open) [data-eye] .v6-blur{filter:blur(9px);transform:scale(1.04)}
html:not(.eye-open) [data-eye] p.v6-blur{filter:blur(5px);transform:none;user-select:none}
html:not(.eye-open) [data-eye-acts]{display:none}
html.eye-open [data-lock],html.eye-open [data-lockbar]{display:none!important}
html:not(.eye-open) [data-collector-only]{display:none}
@media (max-width:1023.98px){[data-eye]{height:auto!important;padding:0!important}[data-eye-card-wrap]{border-radius:0!important;box-shadow:none!important;min-height:calc(100dvh - 80px)}[data-eye-scroll]{overflow:visible!important}
  [data-lockbar]{position:fixed;inset-inline:0;bottom:0;z-index:30;box-shadow:0 -6px 20px rgba(31,27,24,.08)}[data-lockbar]>a{flex-basis:100%}
  [data-lock-sub],[data-lock-note]{display:none}[data-eye-scroll]{padding-bottom:120px!important}html.eye-open [data-eye-scroll]{padding-bottom:20px!important}}
@media (min-width:768px){[data-phone-title]{display:none!important}}
@media (max-width:767.98px){[data-eye]{margin-top:-24px}[data-eye-for]{max-width:calc(100% - 16px)}[data-eye-when]{display:none}[data-eye-for] b{display:none}[data-eye-card-wrap]{min-height:calc(100dvh - 56px - 64px)}[data-eye-grid]{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}[data-eye-card] [data-eye-acts] button{height:36px;font-size:13px}[data-lockbar]{bottom:64px}}
</style>
<div data-eye class="px-margin md:px-gutter-desktop pt-6 pb-6 lg:h-[calc(100dvh-80px)]">
<div data-eye-card-wrap class="h-full flex flex-col rounded-xl bg-surface-container-lowest ring-1 ring-surface-variant/70 overflow-hidden">
<div class="shrink-0 px-5 pt-5 pb-4 flex flex-col gap-3 border-b border-surface-variant">
<div data-phone-title class="flex items-center gap-2"><h1 class="font-headline-md text-headline-md text-on-surface">Admirers</h1><span class="min-w-[26px] h-6 px-2 grid place-items-center rounded-full bg-error text-on-error text-[12px] font-bold">${cap(TOTAL)}</span></div>
<div class="flex flex-wrap items-end gap-x-6 gap-y-1"><p class="font-body-md text-body-md text-on-surface-variant">They put one of their finds on the table for yours — quietly, so you never saw it. <b class="text-on-surface">${NEW} new this week.</b></p><p data-collector-only class="ml-auto inline-flex items-center gap-2"><span class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-sun/60 text-ink text-[12px] font-bold">${filled('workspace_premium', 'text-[14px]')}Collector</span><button type="button" data-buy-reset class="font-body-sm text-[12px] text-outline underline">Reset test</button></p></div>
${chips}</div>
<div data-eye-scroll class="flex-1 min-h-0 overflow-y-auto p-5"><div data-eye-grid class="grid gap-4">${EYES.map(card).join('')}</div>
<p class="mt-5 text-center font-body-sm text-body-sm text-outline">${TOTAL - EYES.length} more · newest first</p></div>
${lockBar}</div></div>
${buy}
<script>
(() => {
  const KEY = 'v6.testCollector'
  const store = (v) => { try { v === null ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, v) } catch (e) {} }
  const stored = () => { try { return localStorage.getItem(KEY) } catch (e) { return null } }
  // The wallet chips in the top bar show the test balance on this page.
  const wallet = (n) => document.querySelectorAll('.font-ticker-number').forEach((el) => { if (/^(420|1,000|400)$/.test(el.textContent.trim())) el.textContent = n })
  const set = (on) => { document.documentElement.classList.toggle('eye-open', on); wallet(on ? '400' : '1,000') }
  const h = location.hash.slice(1).split('+')
  set(h.includes('collector') || stored() === '1')
  const dlg = document.querySelector('[data-buy]')
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-buy]')) { dlg.hidden = false; return }
    if (e.target.closest('[data-buy-close]') || e.target === dlg) { dlg.hidden = true; return }
    if (e.target.closest('[data-buy-go]')) { dlg.hidden = true; store('1'); set(true); window.dispatchEvent(new CustomEvent('v6-toast', { detail: 'Collector on for 30 days — 400 pts left' })); return }
    if (e.target.closest('[data-buy-reset]')) { store(null); set(false); return }
    const c = e.target.closest('[data-eye-chip]')
    if (c) { document.querySelectorAll('[data-eye-chip]').forEach((x) => x.setAttribute('aria-pressed', String(x === c))); document.querySelectorAll('[data-eye-card]').forEach((k) => (k.hidden = c.dataset.eyeChip !== 'all' && k.dataset.want !== c.dataset.eyeChip)); return }
    const p = e.target.closest('[data-eye-pass]'); if (p) { p.closest('[data-eye-card]').hidden = true; return }
    // Locked: a card is a way in to Collector, not a dead end.
    if (!document.documentElement.classList.contains('eye-open') && e.target.closest('[data-eye-card]')) dlg.hidden = false
  })
})()
</script>
`
let s = read('stitch/11-admirers-shell.html').replace('<title>', '<title>ADMIRERS (B) ·')
const a = s.indexOf('<!-- Subtle Ambient Glow Canvas -->'), b = s.indexOf('<!-- FAST LISTING DRAWER')
if (a < 0 || b < 0) throw new Error('eyeing: content markers not found')
s = s.slice(0, a) + body + s.slice(b)
const hh = s.indexOf('<header data-organism="topbar" data-variant="desktop"'), he = s.indexOf('</header>', hh)
const keep = LINK_BASE; LINK_BASE = ''
s = s.slice(0, hh) + topbar({ fixed: true, cls: 'max-md:hidden', context: `<h1 class="font-headline-md text-headline-md text-on-surface shrink-0">Your admirers</h1><span class="min-w-[28px] h-7 px-2 grid place-items-center rounded-full bg-error text-on-error text-[12px] font-bold">${cap(TOTAL)}</span>` }) + s.slice(he + '</header>'.length)
LINK_BASE = keep
write('stitch/20-admirers-b.html', s)
withMatch('stitch/20-admirers-b.html')
{
  const frame = (hash = '') => `<div class="rounded-[28px] overflow-hidden ring-1 ring-outline-variant bg-background shadow-md" style="width:390px;height:844px"><iframe src="../20-admirers-b.html${hash}" width="390" height="844" class="border-0 block" title="eyeing ${hash}"></iframe></div>`
  write('stitch/organisms/admirers-phone-r1.html', `<!DOCTYPE html><html lang="en">
<!-- Admirers — phone. Generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-surface-container-low font-body-md text-on-surface antialiased p-10">
<h1 class="font-headline-lg text-headline-lg mb-2">Admirers — phone</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-8 max-w-3xl">Two cards across. Hunter sees them blurred with Go Collector pinned above the tab bar; Collector sees who, what they offer, and Swap. The You tab and the side nav carry the count — never more than 99+. <b>Every frame is the real page.</b></p>
<div class="flex flex-wrap items-start gap-10">
${state('locked', '1 · Hunter — locked', 'Blurred faces, names and finds; your find stays clear so you know which one they want.', 390, frame(''))}
${state('open', '2 · Collector — unlocked', 'Who, their find, which of yours. Swap = match. Pass hides it.', 390, frame('#collector'))}
${state('match', '3 · Swap → It’s a bartefy!', 'The match moment: the two finds meet, confetti, Say hello.', 390, frame('#collector+match'))}
</div></body></html>`)
}
}

/* ───────────────────────────── Discover on a phone — 3 variants ─────────────────────────────
 * Alex, 2026-09-29: on a phone the deck action bar and the tab bar are two
 * rows of five, stacked. On Discover people mostly use the five ACTIONS —
 * give them the room. Three answers, each the real page (swipe, tap, sheets):
 *   A  02-discover-phone-a.html — on the card: no tray; the buttons float on
 *      the card's bottom edge, sized by importance; the tab bar gets slimmer.
 *   B  02-discover-phone-b.html — one dock: actions big in the thumb zone,
 *      the tabs shrink to an icon strip under them.
 *   C  02-discover-phone-c.html — nav goes up: on Discover the tabs move into
 *      the top bar as icons and the actions own the bottom of the screen.
 * Desktop and tablet are untouched: every rule is under 768px. */
{
const SRC = read('stitch/02-discover-desktop-r1.html')
const compact = `<div class="md:hidden">${deckActions({ size: 'compact', undo: 'locked' })}</div>`
if (!SRC.includes(compact)) throw new Error('discover phone variants: compact deck bar not found')
const tabsNav = (SRC.match(/<nav aria-label="Main" data-tabs="you"[\s\S]*?<\/nav>/) || [])[0]
if (!tabsNav) throw new Error('discover phone variants: tab bar not found')
const hrefOf = (label) => { const m = tabsNav.match(new RegExp(`href="([^"]+)"[^>]*>(?:(?!</a>).)*?>${label}</span>`, 's')); return m ? m[1] : '#' }
const H = { discover: '02-discover-desktop-r1.html', swaps: hrefOf('Swaps'), add: '18-add-b.html', finds: hrefOf('Finds') }
const AV = (tabsNav.match(/<img alt="" class="w-7 h-7 rounded-full object-cover" src="([^"]+)"/) || [])[1]
if (!AV) throw new Error('discover phone variants: avatar not found')

// One action button, any size. Colour marks the primary; the cost / lock badges stay.
const act = ({ id, name, g, tone = 'text-on-surface', px, glyph, loud = false, label = true, extra = '', title, lblCls = 'text-[11px] leading-[14px]' }) => `<button type="button" data-action="${id}" aria-label="${title || name}" title="${title || name}" class="group flex flex-col items-center gap-1 outline-none pointer-events-auto">
<span class="relative grid place-items-center rounded-full transition-transform duration-200 ease-[cubic-bezier(0.2,0,0,1)] group-active:scale-90 ${loud ? 'bg-primary text-on-primary shadow-[0_6px_18px_rgba(27,107,85,0.35)]' : 'bg-surface-container-lowest ring-1 ring-outline-variant/50 shadow-[0_4px_14px_rgba(31,27,24,0.16)]'}" style="width:${px}px;height:${px}px">${icon(g, `${loud ? '' : tone}`).replace('class="', `style="font-size:${glyph}px" class="`)}${extra}</span>
${label ? `<span class="${lblCls} whitespace-nowrap ${loud ? 'font-bold text-primary' : 'font-semibold text-on-surface-variant'}">${name}</span>` : ''}</button>`
const badge = (content) => `<span class="absolute -top-1 -right-1.5 flex items-center gap-0.5 h-5 px-1.5 rounded-full ring-2 ring-surface-container-lowest bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[10px] leading-none">${content}</span>`
const LOCK = badge(icon('lock', 'text-[12px]'))
const cost = (n) => badge(`${icon('toll', 'text-[12px]')}${n}`)
const five = (sz, opts = {}) => [
  act({ id: 'undo', name: 'Undo', g: 'undo', tone: 'text-outline', px: sz.side, glyph: sz.sideG, extra: LOCK, title: 'Undo your last pass — a Collector perk', ...opts }),
  act({ id: 'pass', name: 'Pass', g: 'close', px: sz.mid, glyph: sz.midG, ...opts }),
  act({ id: 'want', name: 'Put on Table', g: 'handshake', loud: true, px: sz.main, glyph: sz.mainG, title: 'Put one of your finds on the table for this one', ...opts }),
  act({ id: 'super', name: 'Super', g: 'bolt', tone: 'text-tertiary', px: sz.mid, glyph: sz.midG, extra: cost(50), title: 'Super offer — lands at the top of their offers (50 pts)', ...opts }),
  act({ id: 'boost', name: 'Boost', g: 'trending_up', tone: 'text-secondary', px: sz.side, glyph: sz.sideG, extra: cost(75), title: 'Boost one of your finds for a day (75 pts)', ...opts }),
].join('\n')

// Icon-only nav pieces (B and C).
const navIcon = (g, href, label, { on = false, badgeN = '', cls = '' } = {}) => `<a href="${href}" aria-label="${label}" ${on ? 'aria-current="page"' : ''} class="relative grid place-items-center ${cls}"><span class="material-symbols-outlined text-[24px] ${on ? 'text-primary' : 'text-on-surface-variant'}" ${on ? `style="font-variation-settings:'FILL' 1"` : ''}>${g}</span>${badgeN ? `<span class="absolute top-1 right-[calc(50%-20px)] min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-error text-on-error text-[10px] font-bold leading-none ring-2 ring-surface-container-lowest">${badgeN}</span>` : ''}${on ? '<span class="absolute bottom-1 w-1 h-1 rounded-full bg-primary"></span>' : ''}</a>`
const addBtn = (px) => `<a data-add-find href="${H.add}" aria-label="Add a find" class="grid place-items-center"><span class="grid place-items-center rounded-full bg-coral text-ink" style="width:${px}px;height:${px}px"><span class="material-symbols-outlined text-[22px]">add</span></span></a>`
const youBtn = (px) => `<a href="#" data-sheet-open="you" aria-label="You" class="grid place-items-center"><img alt="" class="rounded-full object-cover" style="width:${px}px;height:${px}px" src="${AV}"></a>`

const VARIANTS = {
  a: {
    title: 'A · On the card',
    // Buttons sit on the card's bottom edge: the row's centre is the edge.
    deck: `<div data-float class="relative z-20 flex items-center justify-center gap-4 pointer-events-none" style="margin-top:-48px">${five({ side: 46, sideG: 22, mid: 60, midG: 28, main: 72, mainG: 34 }, { label: false })}</div>`,
    css: `[data-deck]{--deck-h:calc(100dvh - 186px)!important}
[data-deck]>div:last-child{z-index:30}
[data-deck-card] .pt-28{padding-bottom:52px!important}
.v6-tabs .h-16{height:56px}
.v6-tabs [data-add-find]>span:first-child{margin-top:0!important;width:48px!important;height:32px!important;box-shadow:none!important}`,
    extra: '',
  },
  b: {
    title: 'B · One dock',
    deck: '',
    css: `[data-deck]{--deck-h:calc(100dvh - 240px)!important}
.v6-tabs{display:none!important}`,
    extra: `<div data-deck-dock class="md:hidden fixed inset-x-0 bottom-0 z-40 bg-surface-container-lowest rounded-t-[22px] shadow-[0_-4px_24px_rgba(31,27,24,0.10)] pb-[env(safe-area-inset-bottom)]">
<div role="group" aria-label="Decide on this find" class="grid grid-cols-5 items-end px-1 pt-3 pb-2">${five({ side: 52, sideG: 24, mid: 56, midG: 26, main: 64, mainG: 30 })}</div>
<nav aria-label="Main" class="grid grid-cols-5 h-12 border-t border-surface-variant">${navIcon('style', H.discover, 'Discover', { on: true })}${navIcon('handshake', H.swaps, 'Swaps', { badgeN: '3' })}${addBtn(34)}${navIcon('inventory_2', H.finds, 'Finds')}${youBtn(26)}</nav>
</div>`,
  },
  c: {
    title: 'C · Nav goes up',
    deck: '',
    css: `[data-deck]{--deck-h:calc(100dvh - 204px)!important}
.v6-tabs{display:none!important}
header[data-organism="topbar"][data-variant="phone"]{display:none!important}`,
    extra: `<header data-c-top class="md:hidden fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 pl-3 pr-2 flex items-center gap-1">
<a href="${H.discover}" aria-label="Discover" aria-current="page" class="grid place-items-center w-10 h-10 rounded-[22%] bg-[#1B6B55]"><img alt="Bartefy" style="height:25px" src="../brand/symbol-white.png"></a>
<button type="button" data-sheet-open="streak" aria-label="Streak: Day 4" class="ml-1 inline-flex items-center gap-1 h-9 px-2.5 rounded-full ring-1 ring-inset ring-outline-variant/60"><span class="material-symbols-outlined text-[18px] text-primary" style="font-variation-settings:'FILL' 1">local_fire_department</span><span class="font-ticker-number text-ticker-number">4</span></button>
<span class="flex-1"></span>
${navIcon('handshake', H.swaps, 'Swaps', { badgeN: '3', cls: 'w-11 h-11' })}${navIcon('inventory_2', H.finds, 'Finds', { cls: 'w-11 h-11' })}
<span class="w-11 h-11 grid place-items-center">${addBtn(34)}</span>
<button type="button" data-sheet-open="bell" aria-label="Notifications, 3 new" class="relative grid place-items-center w-11 h-11"><span class="material-symbols-outlined text-[24px] text-on-surface-variant">notifications</span><span class="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-white"></span></button>
<span class="w-10 h-11 grid place-items-center">${youBtn(30)}</span>
</div></header>
<div data-deck-dock class="md:hidden fixed inset-x-0 bottom-0 z-40 bg-surface-container-lowest border-t border-surface-variant pb-[env(safe-area-inset-bottom)]">
<div role="group" aria-label="Decide on this find" class="grid grid-cols-5 items-end px-1 pt-3 pb-3">${five({ side: 56, sideG: 26, mid: 60, midG: 28, main: 68, mainG: 32 }, { lblCls: 'text-[12px] leading-4' })}</div>
</div>`,
  },
}

/* C, three ways (Alex, 2026-09-29: "I like C"). Same rules for all three:
 * the actions stay at the bottom, the card fills the rest, the page does NOT
 * scroll — the rail (Offers expiring · My table · Hunter/Collector) leaves the
 * page. What differs is where those three go and what the top bar carries.
 *   C1 (Alex's)  icon nav + an "offers expiring" chip in the top bar → sheet;
 *                My table + tier move into the You sheet.
 *   C2           ☰ opens a drawer: profile, the nav, Needs you (expiring,
 *                table, tier); the top bar keeps ☰ · streak · ＋ · bell.
 *   C3           icon nav + ONE line under the top bar with the most urgent
 *                thing; swipe it for the other two. */
const NOSCROLL = `html,body{height:100%;overflow:hidden!important}
[data-deck-col] ~ aside{display:none!important}
.v6-tabs{display:none!important}
header[data-organism="topbar"][data-variant="phone"]{display:none!important}`
const C_DOCK = `<div data-deck-dock class="md:hidden fixed inset-x-0 bottom-0 z-40 bg-surface-container-lowest border-t border-surface-variant pb-[env(safe-area-inset-bottom)]">
<div role="group" aria-label="Decide on this find" class="grid grid-cols-5 items-end px-1 pt-3 pb-3">${five({ side: 56, sideG: 26, mid: 60, midG: 28, main: 68, mainG: 32 }, { lblCls: 'text-[12px] leading-4' })}</div>
</div>`
const cTop = (inner) => `<header data-c-top class="md:hidden fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]"><div class="h-14 pl-3 pr-2 flex items-center gap-1">${inner}</div></header>`
const BTILE = `<a href="${H.discover}" aria-label="Discover" aria-current="page" class="shrink-0 grid place-items-center w-10 h-10 rounded-[22%] bg-[#1B6B55]"><img alt="Bartefy" style="height:25px" src="../brand/symbol-white.png"></a>`
const STREAK = `<button type="button" data-sheet-open="streak" aria-label="Streak: Day 4" class="shrink-0 inline-flex items-center gap-1 h-9 px-2.5 rounded-full ring-1 ring-inset ring-outline-variant/60"><span class="material-symbols-outlined text-[18px] text-primary" style="font-variation-settings:'FILL' 1">local_fire_department</span><span class="font-ticker-number text-ticker-number">4</span></button>`
const BELL = `<button type="button" data-sheet-open="bell" aria-label="Notifications, 3 new" class="relative shrink-0 grid place-items-center w-11 h-11"><span class="material-symbols-outlined text-[24px] text-on-surface-variant">notifications</span><span class="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-white"></span></button>`
const NAV_ICONS = `${navIcon('handshake', H.swaps, 'Swaps', { badgeN: '3', cls: 'w-11 h-11 shrink-0' })}${navIcon('inventory_2', H.finds, 'Finds', { cls: 'w-11 h-11 shrink-0' })}<span class="w-11 h-11 shrink-0 grid place-items-center">${addBtn(34)}</span>`
const YOU = `<span class="w-10 h-11 shrink-0 grid place-items-center">${youBtn(30)}</span>`

// The rail's content, as rows for sheets and the drawer.
const EXPIRING = [
  { src: PH.levis, t: 'Levi’s Type III Denim', who: 'Liam V.', mine: 'Marantz 2215B', left: '04h 18m' },
  { src: PH.planter, t: 'Mid-Century Teak Planter', who: 'Sora K.', mine: 'Ceramic Pour-Over Set', left: '09h 42m' },
]
const offerRow = (o) => `<a href="${H.swaps}" class="flex items-center gap-3 px-5 py-2.5 active:bg-surface-container-low"><img alt="" class="w-12 h-12 rounded-lg object-cover" src="${o.src}"><span class="min-w-0 flex-1"><span class="block truncate text-[15px] leading-5 font-semibold text-on-surface">${o.t}</span><span class="block truncate text-[13px] leading-5 text-on-surface-variant">${o.who} · for your ${o.mine}</span></span><span class="shrink-0 inline-flex items-center gap-1 h-7 px-2 rounded-full bg-coral/25 text-ink text-[12px] font-bold">${icon('alarm', 'text-[14px]')}${o.left}</span></a>`
const infoRow = (g, t, sub, href, tail = icon('chevron_right', 'text-[20px] text-outline')) => `<a href="${href}" class="flex items-center gap-3 px-5 py-2.5 active:bg-surface-container-low"><span class="grid place-items-center w-10 h-10 rounded-full bg-surface-container-low">${icon(g, 'text-[22px] text-on-surface-variant')}</span><span class="min-w-0 flex-1"><span class="block text-[15px] leading-5 font-semibold text-on-surface">${t}</span><span class="block text-[13px] leading-5 text-on-surface-variant">${sub}</span></span>${tail}</a>`
const TABLE_ROW = infoRow('table_restaurant', 'My table', '6 live · 2 with offers', H.finds)
const TIER_ROW = infoRow('shield', 'Hunter', '6 of 6 finds · 3 of 3 swaps', '06-points-b.html', `<span class="shrink-0 h-7 px-2 inline-flex items-center rounded-full bg-sun/60 text-ink text-[11px] font-bold">Collector · 600 pts</span>`)
const LABEL = (t) => `<p class="px-5 pt-3 pb-1 font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">${t}</p>`
const bottomSheet = (id, label, body) => `<div id="sheet-${id}" data-sheet hidden class="fixed inset-0 z-[70] md:hidden">
<div data-sheet-close class="absolute inset-0 bg-inverse-surface/40"></div>
<div role="dialog" aria-label="${label}" class="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-surface-container-lowest shadow-[0_-12px_40px_rgba(31,27,24,0.2)] pb-[max(12px,env(safe-area-inset-bottom))]">
<div class="flex justify-center pt-2.5 pb-1"><span class="w-10 h-1 rounded-full bg-outline-variant"></span></div>${body}</div></div>`
const EXPIRING_SHEET = bottomSheet('expiring', 'Offers expiring', `<div class="px-5 pt-1 pb-2"><p class="font-headline-sm text-headline-sm text-on-surface">2 offers expiring</p><p class="text-[13px] text-on-surface-variant">Answer before they run out — nobody is charged either way.</p></div>
${EXPIRING.map(offerRow).join('')}
<a href="${H.swaps}" class="mt-2 flex items-center justify-between px-5 py-3 border-t border-surface-variant font-label-lg text-label-lg text-primary">Review on Swaps${icon('arrow_forward', 'text-[20px]')}</a>`)
// My table + tier join the You sheet, above Profile.
const intoYou = (s, rows) => {
  const a = s.indexOf('id="sheet-you"'); const j = s.indexOf('<div class="h-px bg-surface-variant mx-5 my-1"></div>', a)
  if (a < 0 || j < 0) throw new Error('discover phone variants: You sheet not found')
  return s.slice(0, j) + rows + s.slice(j)
}

Object.assign(VARIANTS, {
  c1: {
    title: 'C1 · Offers in the top bar',
    deck: '',
    css: `${NOSCROLL}\n[data-deck]{--deck-h:calc(100dvh - 204px)!important}`,
    extra: `${cTop(`${BTILE}<button type="button" data-sheet-open="expiring" aria-label="2 offers expiring, next ends in 4 hours" class="ml-1 shrink-0 inline-flex items-center gap-1 h-9 pl-2 pr-2.5 rounded-full bg-coral/25 text-ink"><span class="material-symbols-outlined text-[18px]">alarm</span><span class="text-[13px] font-bold">2</span><span class="text-[12px] font-semibold">· 4h</span></button><span class="flex-1"></span>${NAV_ICONS}${BELL}${YOU}`)}
${C_DOCK}
${EXPIRING_SHEET}`,
    you: `${LABEL('Your stall')}${infoRow('local_fire_department', 'Day 4 streak', '+5 pts claimed today', '#', '').replace('href="#"', 'href="#" data-sheet-open="streak"')}${TABLE_ROW}${TIER_ROW}`,
  },
  c2: {
    title: 'C2 · Menu drawer',
    deck: '',
    css: `${NOSCROLL}\n[data-deck]{--deck-h:calc(100dvh - 204px)!important}`,
    extra: `${cTop(`<button type="button" data-sheet-open="menu" aria-label="Menu — 3 swaps, 2 offers expiring" class="relative shrink-0 grid place-items-center w-11 h-11 -ml-1"><span class="material-symbols-outlined text-[26px] text-on-surface">menu</span><span class="absolute top-1.5 right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-error text-on-error text-[10px] font-bold leading-none ring-2 ring-white">5</span></button><span class="ml-1.5"></span>${BTILE}<span class="flex-1"></span>${STREAK}<span class="w-11 h-11 shrink-0 grid place-items-center">${addBtn(34)}</span>${BELL}`)}
${C_DOCK}
<div id="sheet-menu" data-sheet hidden class="fixed inset-0 z-[70] md:hidden">
<div data-sheet-close class="absolute inset-0 bg-inverse-surface/40"></div>
<nav aria-label="Menu" class="absolute left-0 top-0 bottom-0 w-[86%] max-w-[340px] overflow-y-auto bg-surface-container-lowest shadow-[12px_0_40px_rgba(31,27,24,0.2)] pb-[max(12px,env(safe-area-inset-bottom))]">
<a href="12-profile-b.html" class="flex items-center gap-3 px-5 pt-5 pb-3"><img alt="" class="w-12 h-12 rounded-full object-cover" src="${AV}"><span class="flex-1"><span class="block text-[16px] leading-6 font-bold text-on-surface">Maya L.</span><span class="block text-[13px] text-on-surface-variant">Hunter · 420 pts</span></span>${icon('chevron_right', 'text-[20px] text-outline')}</a>
<div class="px-3 flex flex-col">${[['style', 'Discover', H.discover, '', true], ['handshake', 'Swaps', H.swaps, '3'], ['inventory_2', 'My finds', H.finds], ['toll', 'Points & Tiers', '06-points-b.html']].map(([g, t, href, n, on]) => `<a href="${href}" ${on ? 'aria-current="page"' : ''} class="flex items-center gap-3 h-12 px-3 rounded-xl ${on ? 'bg-primary-fixed text-primary font-bold' : 'text-on-surface'} text-[15px]">${icon(g, 'text-[22px]')}<span class="flex-1">${t.replace('&', '&amp;')}</span>${n ? `<span class="min-w-[20px] h-5 px-1.5 grid place-items-center rounded-full bg-error text-on-error text-[11px] font-bold">${n}</span>` : ''}</a>`).join('')}</div>
<div class="h-px bg-surface-variant mx-5 my-2"></div>
${LABEL('Needs you')}
${EXPIRING.map(offerRow).join('')}
${TABLE_ROW}${TIER_ROW}
<div class="h-px bg-surface-variant mx-5 my-2"></div>
${infoRow('settings', 'Settings', 'Language, theme, blocked people', '13-settings-b.html')}
</nav></div>`,
  },
  c3: {
    title: 'C3 · One line that needs you',
    deck: '',
    css: `${NOSCROLL}\n.v6-main{padding-top:112px!important}\n[data-deck]{--deck-h:calc(100dvh - 248px)!important}\n.v6-needs{scrollbar-width:none}.v6-needs::-webkit-scrollbar{display:none}`,
    extra: `${cTop(`${BTILE}<span class="ml-1">${STREAK}</span><span class="flex-1"></span>${NAV_ICONS}${BELL}${YOU}`)}
<div data-needs class="md:hidden fixed top-14 inset-x-0 z-40 px-3 pt-2">
<div class="v6-needs flex overflow-x-auto snap-x snap-mandatory rounded-xl">${[
  ['alarm', '<b>Levi’s offer</b> ends in 04h 18m', 'Review', H.swaps, 'bg-coral/25', '1 of 3'],
  ['table_restaurant', '<b>Your table is full</b> · 6 of 6', 'Manage', H.finds, 'bg-surface-container-high', '2 of 3'],
  ['shield', '<b>180 pts</b> to Collector · 50 km', 'See', '06-points-b.html', 'bg-sun/50', '3 of 3'],
].map(([g, t, cta, href, bg, n]) => `<a href="${href}" class="snap-start shrink-0 w-full h-10 px-3 flex items-center gap-2 ${bg} text-ink"><span class="material-symbols-outlined text-[18px]">${g}</span><span class="flex-1 min-w-0 truncate text-[13px]">${t}</span><span class="text-[11px] text-ink/60">${n}</span><span class="font-bold text-[13px] text-primary">${cta}</span></a>`).join('')}</div></div>
${C_DOCK}`,
  },
})

for (const [k, v] of Object.entries(VARIANTS)) {
  let s = SRC.replace('<title>', `<title>DISCOVER PHONE ${k.toUpperCase()} · `)
  if (v.you) s = intoYou(s, v.you)
  s = s.split(compact).join(`<div class="md:hidden">${v.deck}</div>`)
  // The deck script only listens to buttons inside the stage; the docks live outside it.
  const hook = 'if (a && stage.contains(a))'
  if (!s.includes(hook)) throw new Error('discover phone variants: deck click hook not found')
  s = s.replace(hook, "if (a && (stage.contains(a) || a.closest('[data-deck-dock]')))")
  // Before the shell script, so its #sheet-<id> deep links find the new sheets.
  const NAV = '<!-- V6 phone navigation (apply-shell.mjs)'
  if (!s.includes(NAV)) throw new Error('discover phone variants: phone navigation marker not found')
  s = s.replace(NAV, `<!-- Discover phone variant ${k.toUpperCase()} (build-revisions.mjs) -->
<style>@media (max-width:767.98px){
.v6-main{padding-top:68px!important;padding-bottom:0!important}
${v.css}
}</style>
${v.extra}
${NAV}`)
  write(`stitch/02-discover-phone-${k}.html`, s)
}

const frame = (file) => `<div class="rounded-[28px] overflow-hidden ring-1 ring-outline-variant bg-background shadow-md" style="width:390px;height:844px"><iframe src="../${file}" width="390" height="844" class="border-0 block" title="${file}"></iframe></div>`
write('stitch/organisms/deck-phone-variants.html', `<!DOCTYPE html><html lang="en">
<!-- Discover on a phone — 3 variants. Generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-surface-container-low font-body-md text-on-surface antialiased p-10">
<h1 class="font-headline-lg text-headline-lg mb-2">Discover on a phone — give the five actions the room</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-8 max-w-3xl">Today the deck actions and the tab bar are two rows of five, stacked. On Discover the actions are what people use. Three answers — each frame is the real page: swipe, tap the buttons, open the sheets. Desktop and tablet do not change.</p>
<div class="flex flex-wrap items-start gap-10">
${state('now', 'Now', 'Actions in a white tray, the tab bar under it with the raised ＋. Card 552px tall.', 390, frame('02-discover-desktop-r1.html'))}
${state('a', VARIANTS.a.title, 'No tray: the buttons float on the card’s bottom edge, sized by how often they are used (Put on Table 72 · Pass, Super 60 · Undo, Boost 46). No labels — the icons and the green one carry it. The tab bar keeps its labels but gets slimmer; ＋ sits in line. Card 658px (+106).', 390, frame('02-discover-phone-a.html'))}
${state('b', VARIANTS.b.title, 'One dock at the bottom: the five actions, labelled, where the thumb rests; the tabs shrink to an icon strip under them (Discover dot · Swaps 3 · ＋ · Finds · You). Card 604px (+52).', 390, frame('02-discover-phone-b.html'))}
${state('c', VARIANTS.c.title, 'On Discover the tabs move into the top bar as icons (Swaps 3 · Finds · ＋ · bell · You); the B is home. The bottom belongs to the five actions — the biggest buttons of the three. Points leave the top bar here (still in You). Card 640px (+88).', 390, frame('02-discover-phone-c.html'))}
</div>
<p class="mt-2 font-body-md text-body-md"><a class="text-primary font-bold underline" href="deck-phone-c-variants.html">C, three ways →</a></p></body></html>`)
write('stitch/organisms/deck-phone-c-variants.html', `<!DOCTYPE html><html lang="en">
<!-- Discover on a phone — C, three ways. Generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-surface-container-low font-body-md text-on-surface antialiased p-10">
<h1 class="font-headline-lg text-headline-lg mb-2">Discover on a phone — C, three ways</h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-8 max-w-3xl">Same rules in all three: the five actions stay at the bottom, the card fills the rest, and <b>the page does not scroll</b>. Offers expiring, My table and Hunter/Collector leave the page. What changes is where they go and what the top bar carries. Every frame is the real page — swipe, tap, open the sheets.</p>
<div class="flex flex-wrap items-start gap-10">
${state('c', 'C as picked', 'For comparison: the rail still sits under the deck, so the page scrolls.', 390, frame('02-discover-phone-c.html'))}
${state('c1', VARIANTS.c1.title, 'Alex’s: B · a coral “2 · 4h” chip · Swaps · Finds · ＋ · bell · You. The chip opens the expiring offers; My table, the tier and the streak move into You. Card 640px.', 390, frame('02-discover-phone-c1.html'))}
${state('c1-sheet', 'C1 — the chip opened', 'The two offers with their clocks; each opens it in Swaps.', 390, frame('02-discover-phone-c1.html#sheet-expiring'))}
${state('c1-you', 'C1 — You', 'Your stall: streak, My table, Hunter → Collector, then Profile and Settings as before.', 390, frame('02-discover-phone-c1.html#sheet-you'))}
${state('c2', VARIANTS.c2.title, '☰ (5 = 3 swaps + 2 expiring) · B · streak · ＋ · bell. The fewest icons up top; everything else is one tap into the drawer. Card 640px.', 390, frame('02-discover-phone-c2.html'))}
${state('c2-menu', 'C2 — the drawer', 'You, the four places, Needs you (the two offers, My table, the tier), Settings.', 390, frame('02-discover-phone-c2.html#sheet-menu'))}
${state('c3', VARIANTS.c3.title, 'C’s top bar, plus one line under it with the most urgent thing — swipe it for the other two. Nothing hidden, and nothing extra to open. Card 596px.', 390, frame('02-discover-phone-c3.html'))}
</div></body></html>`)

/* ── The Discover phone layout, decided (Alex, 2026-09-29) ──
 * "C for sure." Actions own the bottom, the card fills the rest, the page
 * never scrolls, the rail leaves the page. Top bar, from the RIGHT:
 * ⋮ menu · Swaps (messages) · Notifications · Profile — the B on the left.
 * The ⋮ menu holds the navigation first, with Points, then everything the
 * rail used to show (offers expiring, My table, the tier, the streak).
 * This is written into the Discover page itself; A/B/C and C1–C3 stay as
 * the record of how we got here. */
{
  const F = 'stitch/02-discover-desktop-r1.html'
  let s = read(F)
  const hook = 'if (a && stage.contains(a))'
  if (!s.includes(hook)) throw new Error('discover final: deck click hook not found')
  s = s.replace(hook, "if (a && (stage.contains(a) || a.closest('[data-deck-dock]')))")
  // The in-card action tray goes; the dock at the bottom replaces it on phones.
  if (!s.includes(compact)) throw new Error('discover final: compact deck bar not found')
  s = s.split(compact).join('<div class="md:hidden"></div>')
  const MENU_BTN = `<button type="button" data-sheet-open="menu" aria-label="Menu — 2 offers expiring" class="relative shrink-0 grid place-items-center w-11 h-11 -mr-1"><span class="material-symbols-outlined text-[26px] text-on-surface">more_vert</span><span class="absolute top-2 right-2.5 w-2.5 h-2.5 rounded-full bg-error ring-2 ring-white"></span></button>`
  const TOP = cTop(`${BTILE}<span class="flex-1"></span>${YOU}${BELL}${navIcon('chat', H.swaps, 'Swaps and messages, 3 unread', { badgeN: '3', cls: 'w-11 h-11 shrink-0' })}${MENU_BTN}`)
  const navRow = (g, t, href, right = '', on = false) => `<a href="${href}" ${on ? 'aria-current="page"' : ''} class="flex items-center gap-3 h-12 px-3 rounded-xl text-[15px] ${on ? 'bg-primary-fixed text-primary font-bold' : 'text-on-surface active:bg-surface-container-low'}">${icon(g, 'text-[22px]')}<span class="flex-1">${t}</span>${right}</a>`
  const count = (n, tone = 'bg-error text-on-error') => `<span class="min-w-[22px] h-5 px-1.5 grid place-items-center rounded-full ${tone} text-[11px] font-bold leading-none">${n}</span>`
  const MENU = `<div id="sheet-menu" data-sheet hidden class="fixed inset-0 z-[70] md:hidden">
<div data-sheet-close class="absolute inset-0 bg-inverse-surface/40"></div>
<nav aria-label="Menu" class="absolute right-0 top-0 bottom-0 w-[86%] max-w-[340px] overflow-y-auto bg-surface-container-lowest shadow-[-12px_0_40px_rgba(31,27,24,0.2)] pb-[max(12px,env(safe-area-inset-bottom))]">
<div class="flex items-center justify-between pl-5 pr-2 h-14"><p class="font-headline-sm text-headline-sm text-on-surface">Menu</p><button type="button" data-sheet-close aria-label="Close" class="grid place-items-center w-11 h-11 rounded-full hover:bg-surface-container-high">${icon('close', 'text-[24px]')}</button></div>
<div class="px-3 flex flex-col gap-0.5">
<a data-add-find href="${H.add}" class="mb-2 flex items-center justify-center gap-2 h-12 rounded-xl bg-coral text-ink font-label-lg text-[15px] font-bold">${icon('add_circle', 'text-[22px]')}Add a find</a>
${navRow('style', 'Discover', H.discover, '', true)}
${navRow('chat', 'Swaps &amp; messages', H.swaps, count('3'))}
${navRow('inventory_2', 'My finds', H.finds, count('6/6', 'bg-secondary-container text-on-secondary-container'))}
${navRow('favorite', 'Admirers', '20-admirers-b.html', count('99+'))}
${navRow('toll', 'Points &amp; Tiers', '06-points-b.html', `<span class="font-ticker-number text-[14px] text-on-surface">420 <span class="text-[11px] text-on-surface-variant">pts</span></span>`)}
</div>
<div class="mx-4 mt-2 rounded-xl bg-surface-container-low px-4 py-3"><div class="flex items-center justify-between"><p class="font-label-lg text-label-lg text-on-surface">180 more for Collector</p><span class="inline-flex items-center gap-1 text-[13px] font-semibold text-primary">${filled('local_fire_department', 'text-[16px]')}Day 4</span></div><div class="mt-2 h-2 rounded-full bg-surface-container-high overflow-hidden"><div class="h-full rounded-full bg-tertiary-fixed-dim" style="width:70%"></div></div></div>
<div class="h-px bg-surface-variant mx-5 my-3"></div>
${LABEL('Needs you')}
${EXPIRING.map(offerRow).join('')}
${TABLE_ROW}${TIER_ROW}
<div class="h-px bg-surface-variant mx-5 my-2"></div>
${infoRow('settings', 'Settings', 'Language, theme, blocked people', '13-settings-b.html')}
</nav></div>`
  const NAV = '<!-- V6 phone navigation (apply-shell.mjs)'
  if (!s.includes(NAV)) throw new Error('discover final: phone navigation marker not found')
  s = s.replace(NAV, `<!-- Discover phone layout (build-revisions.mjs) -->
<style>@media (max-width:767.98px){
.v6-main{padding-top:68px!important;padding-bottom:0!important}
${NOSCROLL}
[data-deck]{--deck-h:calc(100dvh - 204px)!important}
}</style>
${TOP}
${C_DOCK}
${MENU}
${NAV}`)
  write(F, s)
}
}

/* ───────────────────────────── The review page ─────────────────────────────
 * Alex, 2026-09-29: "I will confirm them when all the missing things are done."
 * One page that lists every V6 page with its desktop link, phone sheet and
 * states — the ones waiting for him first. */
{
const PAGES = [
  ['done', 'Add a find', 'The ＋ everywhere opens it. The app’s real form: photos, name, story, categories, 5 conditions, wants.', '18-add-b.html#filled', 'organisms/add-phone-r1.html', [['Empty', '18-add-b.html#empty'], ['It’s on the table', '18-add-b.html#published'], ['Held for a look', '18-add-b.html#held'], ['Table full (Hunter)', '18-add-b.html#limit']], LEICA],
  ['done', 'Staff tools', 'Moderation (uploads, reports — nothing decided automatically) and Analytics. Account menu → Staff tools.', '19-staff-b.html', 'organisms/staff-phone-r1.html', [['Reports', '19-staff-b.html#reports'], ['Analytics', '19-staff-b.html#analytics']], PH.fender],
  ['done', 'Admirers', 'Who put a find on the table for yours — quietly, for free. Collector only: you start with 1,000 TEST pts — Go Collector spends 600 and unlocks (Reset test to try again). Swap makes the match on the spot. Badge caps at 99+.', '20-admirers-b.html', 'organisms/admirers-phone-r1.html', [['Collector — unlocked', '20-admirers-b.html#collector'], ['Swap → match', '20-admirers-b.html#collector+match']], PH.marantz],
  ['done', 'It’s a bartefy!', 'The match moment: both finds fly in and meet, confetti, Say hello. Opens from Accept swap, from Swap on Eyeing, and in Discover when they had already offered for yours (try the Fender card).', '02-discover-desktop-r1.html#match', '', [['From Accept swap', '04-active-swaps-volume-b.html#o1'], ['Phone', '20-admirers-b.html#collector+match']], PH.fujicase],
  ['done', 'Discover — phone', 'C: actions own the bottom, card fills the rest, no scroll. Top bar from the right: ⋮ menu · Swaps · Notifications · Profile. ⋮ = Add a find, the places, Points, then Needs you. Photos open full screen from the card (⛶ or tap the middle).', '02-discover-desktop-r1.html', '', [['⋮ menu', '02-discover-desktop-r1.html#sheet-menu']], OLYMPUS],
  ['done', 'Discover', 'The deck: card + action bar always fit; wide card with details on big screens.', '02-discover-desktop-r1.html', 'organisms/deck-stage-r1.html', [['Phone: A · B · C', 'organisms/deck-phone-variants.html'], ['Phone: C1 · C2 · C3 (new)', 'organisms/deck-phone-c-variants.html']], PH.marantz],
  ['done', 'Swaps & offers', 'Offers and agreed swaps on one screen; the chat lives here.', '04-active-swaps-volume-b.html', 'organisms/swaps-phone-r1.html', [['Archive (new)', '04-active-swaps-volume-b.html#d1'], ['As drawn (for comparison)', '04-active-swaps-volume-a.html']], WALKMAN],
  ['done', 'My finds', 'Your photo grid + the picked find; Hunter 6/6 and a 50-find Collector.', '08-my-finds-b.html', 'organisms/finds-phone-r1.html', [['50 finds', '08-my-finds-b-50.html']], PH.fujicase],
  ['done', 'Points & tiers', 'Wallet and ways to earn | Tiers · Perks · History. Points only.', '06-points-b.html', 'organisms/points-phone-r1.html', [['Perks', '06-points-b.html#perks'], ['History', '06-points-b.html#history']], PH.lamy],
  ['done', 'Profile + person card', 'Who you are, how others see you. Nobody browses anyone’s finds.', '12-profile-b.html', 'organisms/profile-phone-r1.html', [], AVATAR_SRC],
  ['done', 'Settings', 'Seven sections; all at once on a big screen.', '13-settings-b.html', 'organisms/settings-phone-r1.html', [['Privacy', '13-settings-b.html#privacy']], PH.braun],
  ['done', 'Notifications', 'The bell’s full page; needs-you rail.', '14-notifications-b.html', 'organisms/notifications-phone-r1.html', [], PH.lamp],
  ['done', 'Sign in / sign up', 'Email → six-digit code. Try 123456.', '15-signin-b.html', 'organisms/signin-phone-r1.html', [['Sign up', '15-signin-b.html#signup'], ['Code', '15-signin-b.html#code']], PH.pourover],
  ['done', 'Onboarding', 'Welcome · Tbilisi · tastes · all set.', '16-onboarding-b.html', 'organisms/onboarding-phone-r1.html', [], PH.bike],
]
const FOLDED = [['Item detail', 'cut — the Discover card is the find; its photos open full screen from the card'], ['Chat', 'lives in Swaps & offers'], ['Membership', 'the Tiers tab on Points'], ['Invite friends', 'Points + Profile'], ['Blocked people', 'Settings → Privacy'], ['Arrange meetup', 'cut — people arrange it in the chat'], ['Public profile', 'cut — the person card instead']]
// The page as built, on bartefy.com (V6 went live 2026-09-30), so every
// approved mock can be opened beside the real thing and compared.
const LIVE = {
  'Add a find': '/add', 'Staff tools': '/admin/reports', 'Admirers': '/admirers',
  'It’s a bartefy!': '/matches', 'Discover — phone': '/discover', 'Discover': '/discover',
  'Swaps & offers': '/matches', 'My finds': '/items', 'Points & tiers': '/points',
  'Profile + person card': '/profile', 'Settings': '/settings', 'Notifications': '/notifications',
  'Sign in / sign up': '/login', 'Onboarding': '/welcome',
}
const liveBtn = (t) => LIVE[t] ? `<a href="https://bartefy.com${LIVE[t]}" target="_blank" rel="noopener" title="The built page on bartefy.com" class="h-9 px-3 rounded-lg bg-mint text-forest font-label-md text-label-md inline-flex items-center gap-1.5">${icon('open_in_new', 'text-[16px]')}Live</a>` : ''
const card = ([st, t, d, desk, phone, extra, img]) => `<article class="rounded-2xl bg-surface-container-lowest ring-1 ring-surface-variant overflow-hidden flex flex-col">
<a href="${desk}" class="block aspect-[16/9] overflow-hidden"><img alt="" class="w-full h-full object-cover hover:scale-[1.02] transition-transform" src="${img}"></a>
<div class="p-5 flex flex-col gap-3 flex-1"><div class="flex items-start gap-2"><h2 class="flex-1 font-headline-sm text-headline-sm text-on-surface">${t}</h2>${st === 'wait' ? '<span class="inline-flex items-center h-6 px-2 rounded-full bg-sun text-ink text-[11px] font-bold">Waiting for you</span>' : '<span class="inline-flex items-center h-6 px-2 rounded-full bg-mint text-forest text-[11px] font-bold">Confirmed</span>'}</div>
<p class="font-body-sm text-body-sm text-on-surface-variant">${d}</p>
<div class="mt-auto flex flex-wrap gap-2 pt-1"><a href="${desk}" class="h-9 px-3 rounded-lg bg-primary text-on-primary font-label-md text-label-md inline-flex items-center gap-1.5">${icon('desktop_windows', 'text-[16px]')}Open</a>${liveBtn(t)}${phone ? `<a href="${phone}" class="h-9 px-3 rounded-lg ring-1 ring-inset ring-outline-variant font-label-md text-label-md inline-flex items-center gap-1.5">${icon('smartphone', 'text-[16px]')}Phone</a>` : ''}${extra.map(([l, h]) => `<a href="${h}" class="h-9 px-3 rounded-lg ring-1 ring-inset ring-outline-variant font-label-md text-label-md text-on-surface-variant inline-flex items-center">${l}</a>`).join('')}</div></div></article>`
write('stitch/00-review.html', `<!DOCTYPE html><html lang="en">
<!-- V6 review — generated by build-revisions.mjs. Do not edit by hand. -->
${head}
<body class="bg-background font-body-md text-on-surface antialiased">
<main class="max-w-[1500px] mx-auto px-6 md:px-10 py-10 flex flex-col gap-10">
<header class="flex flex-wrap items-end gap-6"><span>${lockup(true)}</span><div class="flex-1 min-w-[260px]"><h1 class="font-headline-lg text-[34px] leading-10 text-on-surface">V6 — every page</h1><p class="font-body-md text-body-md text-on-surface-variant">${PAGES.filter((p) => p[0] === 'wait').length} waiting for you · ${PAGES.filter((p) => p[0] === 'done').length} confirmed. Each opens the real page; resize the window to see tablet and phone.</p></div>${orzomiByline()}</header>
${PAGES.some((p) => p[0] === 'wait') ? `<section class="flex flex-col gap-4"><h2 class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Waiting for you</h2><div class="grid gap-5" style="grid-template-columns:repeat(auto-fill,minmax(340px,1fr))">${PAGES.filter((p) => p[0] === 'wait').map(card).join('')}</div></section>` : ''}
<section class="flex flex-col gap-4"><h2 class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Confirmed</h2><div class="grid gap-5" style="grid-template-columns:repeat(auto-fill,minmax(340px,1fr))">${PAGES.filter((p) => p[0] === 'done').map(card).join('')}</div></section>
<section class="flex flex-col gap-3"><h2 class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Folded into other pages, or cut</h2><ul class="grid gap-2" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${FOLDED.map(([t, w]) => `<li class="rounded-xl ring-1 ring-surface-variant bg-surface-container-lowest px-4 py-3"><span class="font-label-lg text-label-lg text-on-surface">${t}</span> <span class="font-body-sm text-body-sm text-on-surface-variant">— ${w}</span></li>`).join('')}</ul></section>
</main></body></html>`)
}
