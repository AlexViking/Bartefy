/* Cuts every organism out of the saved Stitch pages so the tracker can show
 * each one on its own.
 *
 *   node v6-pages/build-parts.mjs        (from client/)
 *
 * For each entry in PARTS: load the Stitch source at 1440x900, find the
 * element, copy its outerHTML into stitch/parts/<file>.html with the source's
 * own <head> (fonts, Tailwind CDN, the Stitch config), at the width it had in
 * the full page. Then load that file, measure its height, and write
 * stitch/parts/manifest.js for index.html.
 *
 * Add a line to PARTS when a new Stitch page arrives. Pipeline order:
 *   apply-shell.mjs → build-revisions.mjs → build-parts.mjs The tracker needs the
 * network: Tailwind, fonts and photos all come from CDNs, exactly as in Stitch.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'

const here = path.dirname(fileURLToPath(import.meta.url))
const out = path.join(here, 'stitch/parts')
fs.mkdirSync(out, { recursive: true })

/* org — organism id in organisms.js
 * pick — runs in the page, returns the element
 * fix  — optional: runs on the copied element before it is saved */
const PARTS = [
  // topbar R2 — cut from its states sheet; "open on its own" goes to the whole sheet.
  { source: 'X2', org: 'topbar', label: 'R2 — closed, desktop 1440', pick: () => document.querySelector('[data-part=live] [data-frame]'), fix: (el) => { el.style.minHeight = '0' }, open: 'stitch/organisms/topbar-r2.html#live' },
  { source: 'X2', org: 'topbar', label: 'R2 — tooltips (hover)', pick: () => document.querySelector('[data-part=hover] [data-frame]'), open: 'stitch/organisms/topbar-r2.html#hover' },
  { source: 'X2', org: 'topbar', label: 'R2 — streak chip clicked → #03 streak', pick: () => document.querySelector('[data-part=streak-open] [data-frame]'), open: 'stitch/organisms/topbar-r2.html#streak-open' },
  { source: 'X2', org: 'topbar', label: 'R2 — streak popover, other states', pick: () => document.querySelector('[data-part=streak-states] [data-frame]'), open: 'stitch/organisms/topbar-r2.html#streak-states' },
  { source: 'X2', org: 'topbar', label: 'R2 — points chip clicked → wallet', pick: () => document.querySelector('[data-part=points-open] [data-frame]'), open: 'stitch/organisms/topbar-r2.html#points-open' },
  { source: 'X2', org: 'topbar', label: 'R2 — bell clicked → notifications', pick: () => document.querySelector('[data-part=bell-open] [data-frame]'), open: 'stitch/organisms/topbar-r2.html#bell-open' },
  { source: 'X2', org: 'topbar', label: 'R2 — bell, nothing waiting', pick: () => document.querySelector('[data-part=bell-empty] [data-frame]'), open: 'stitch/organisms/topbar-r2.html#bell-empty' },
  { source: 'X2', org: 'topbar', label: 'R2 — account clicked → menu', pick: () => document.querySelector('[data-part=account-open] [data-frame]'), open: 'stitch/organisms/topbar-r2.html#account-open' },
  { source: 'X2', org: 'topbar', label: 'R2 — every chip state', pick: () => document.querySelector('[data-part=chips] [data-frame]'), open: 'stitch/organisms/topbar-r2.html#chips' },
  { source: 'X2', org: 'topbar', label: 'R2 — tablet 1024', pick: () => document.querySelector('[data-part=tablet] [data-frame]'), open: 'stitch/organisms/topbar-r2.html#tablet' },
  { source: 'X2', org: 'topbar', label: 'R2 — phone 390', pick: () => document.querySelector('[data-part=phone] [data-frame]'), open: 'stitch/organisms/topbar-r2.html#phone' },
  { source: 'X2', org: 'topbar', label: 'R2 — phone, streak as a bottom sheet', pick: () => document.querySelector('[data-part=phone-sheet] [data-frame]'), open: 'stitch/organisms/topbar-r2.html#phone-sheet' },
  {
    source: 'R1', org: 'side_nav', label: 'Full — 256px, desktop',
    // Fixed to the viewport in the page; on its own it needs a height.
    pick: () => document.getElementById('side-nav'),
    fix: (el) => { el.classList.remove('hidden', 'fixed', 'top-20', 'bottom-0', 'left-0'); el.classList.add('flex'); el.style.height = '760px' },
  },
  {
    source: 'R1', org: 'side_nav', label: 'Compact — 72px rail (tablet, or collapsed)',
    pick: () => document.getElementById('side-nav-collapsed'),
    // Fixed + display:none (via the page's #v6-shell style) in the page.
    fix: (el) => { el.classList.remove('fixed', 'top-20', 'top-16', 'bottom-0', 'left-0'); el.classList.add('flex'); el.style.height = '640px' },
    // Hidden on the page, so it measures 0 wide there.
    width: 72,
  },
  { source: 'S1', org: 'streak', label: 'Wide — banner above the deck', pick: () => document.querySelector('main section') },
  { source: 'S1', org: 'streak', label: 'Inline — chip in the top bar', pick: () => [...document.querySelectorAll('header .material-symbols-outlined')].find((i) => i.textContent.trim() === 'local_fire_department').parentElement },
  { source: 'S1', org: 'points_wallet', label: 'Inline — chip in the top bar', pick: () => [...document.querySelectorAll('header .material-symbols-outlined')].find((i) => i.textContent.trim() === 'toll').parentElement },
  // Deck stage R1 (#06–#09) — cut from its sheet; the fit-* parts are the live page at that window size.
  { source: 'X7', org: 'find_card', label: 'R1 — Discover at 1440 × 900 (live)', pick: () => document.querySelector('[data-part=fit-1440] > div'), open: 'stitch/organisms/deck-stage-r1.html#fit-1440' },
  { source: 'X7', org: 'find_card', label: 'R1 — 1920 × 1080 (live)', pick: () => document.querySelector('[data-part=fit-1920] > div'), open: 'stitch/organisms/deck-stage-r1.html#fit-1920' },
  { source: 'X7', org: 'find_card', label: 'R1 — 1280 × 720 (live)', pick: () => document.querySelector('[data-part=fit-1280] > div'), open: 'stitch/organisms/deck-stage-r1.html#fit-1280' },
  { source: 'X7', org: 'find_card', label: 'R1 — phone 390 × 844 (live)', pick: () => document.querySelector('[data-part=fit-phone] > div'), open: 'stitch/organisms/deck-stage-r1.html#fit-phone' },
  { source: 'X7', org: 'find_card', label: 'R1 — card at rest', pick: () => document.querySelector('[data-part=rest] > div'), open: 'stitch/organisms/deck-stage-r1.html#rest' },
  { source: 'X7', org: 'find_card', label: 'R1 — details slid up', pick: () => document.querySelector('[data-part=details] > div'), open: 'stitch/organisms/deck-stage-r1.html#details' },
  { source: 'X7', org: 'find_card', label: 'R1 — dragging left, PASS', pick: () => document.querySelector('[data-part=drag-pass] > div'), open: 'stitch/organisms/deck-stage-r1.html#drag-pass' },
  { source: 'X7', org: 'find_card', label: 'R1 — dragging right, OFFER', pick: () => document.querySelector('[data-part=drag-offer] > div'), open: 'stitch/organisms/deck-stage-r1.html#drag-offer' },
  { source: 'X7', org: 'find_card', label: 'R1 — no match', pick: () => document.querySelector('[data-part=nomatch] > div'), open: 'stitch/organisms/deck-stage-r1.html#nomatch' },
  { source: 'X7', org: 'find_card', label: 'R1 — end of the deck', pick: () => document.querySelector('[data-part=end] > div'), open: 'stitch/organisms/deck-stage-r1.html#end' },
  { source: 'X7', org: 'owner_bar', label: 'R1 — one line on the photo', pick: () => document.querySelector('[data-part=rest] > div'), open: 'stitch/organisms/deck-stage-r1.html#rest' },
  { source: 'X7', org: 'owner_bar', label: 'R1 — in the details panel', pick: () => document.querySelector('[data-part=details] > div'), open: 'stitch/organisms/deck-stage-r1.html#details' },
  { source: 'X7', org: 'wants_box', label: 'R1 — Wants line + match pill', pick: () => document.querySelector('[data-part=rest] > div'), open: 'stitch/organisms/deck-stage-r1.html#rest' },
  { source: 'X7', org: 'wants_box', label: 'R1 — no match: Wants line only', pick: () => document.querySelector('[data-part=nomatch] > div'), open: 'stitch/organisms/deck-stage-r1.html#nomatch' },
  { source: 'X7', org: 'wants_box', label: 'R1 — full wish in the details panel', pick: () => document.querySelector('[data-part=details] > div'), open: 'stitch/organisms/deck-stage-r1.html#details' },
  { source: 'X7', org: 'deck_actions', label: 'R1 — right under the card, 1440 × 900 (live)', pick: () => document.querySelector('[data-part=fit-1440] > div'), open: 'stitch/organisms/deck-stage-r1.html#fit-1440' },
  { source: 'S1', org: 'find_card', label: 'Wide — main stage (with ghost stack)', pick: () => document.getElementById('swap-card-top').parentElement },
  { source: 'S1', org: 'owner_bar', label: 'Wide — inside the card', pick: () => document.querySelector('img[alt="Julian Ross"]').closest('.justify-between') },
  { source: 'S1', org: 'wants_box', label: 'Wide — inside the card', pick: () => [...document.querySelectorAll('span')].find((s) => s.textContent.includes('looking for in trade')).closest('.rounded-xl') },
  { source: 'X1', org: 'deck_actions', label: 'R1 — wide, Hunter (undo locked)', pick: () => document.querySelector('[data-part=wide] [data-organism]') },
  { source: 'X1', org: 'deck_actions', label: 'R1 — wide, Collector after a pass', pick: () => document.querySelector('[data-part=collector] [data-organism]') },
  { source: 'X1', org: 'deck_actions', label: 'R1 — wide, not enough points', pick: () => document.querySelector('[data-part=low] [data-organism]') },
  { source: 'X1', org: 'deck_actions', label: 'R1 — compact, phone 358px', pick: () => document.querySelector('[data-part=compact] [data-organism]') },
  // offer_composer R1 — cut from its states sheet; "open on its own" goes to the whole sheet.
  { source: 'X4', org: 'offer_composer', label: 'R1 — 50 finds, nothing picked', pick: () => document.querySelector('[data-part=many] > div'), open: 'stitch/organisms/offer-composer-r1.html#many' },
  { source: 'X4', org: 'offer_composer', label: 'R1 — one picked', pick: () => document.querySelector('[data-part=picked] > div'), open: 'stitch/organisms/offer-composer-r1.html#picked' },
  { source: 'X4', org: 'offer_composer', label: 'R1 — filtered to one category', pick: () => document.querySelector('[data-part=filtered] > div'), open: 'stitch/organisms/offer-composer-r1.html#filtered' },
  { source: 'X4', org: 'offer_composer', label: 'R1 — several at once (multi)', pick: () => document.querySelector('[data-part=multi] > div'), open: 'stitch/organisms/offer-composer-r1.html#multi' },
  { source: 'X4', org: 'offer_composer', label: 'R1 — Super offer on', pick: () => document.querySelector('[data-part=super] > div'), open: 'stitch/organisms/offer-composer-r1.html#super' },
  { source: 'X4', org: 'offer_composer', label: 'R1 — Hunter, 6 finds', pick: () => document.querySelector('[data-part=few] > div'), open: 'stitch/organisms/offer-composer-r1.html#few' },
  { source: 'X4', org: 'offer_composer', label: 'R1 — no finds yet', pick: () => document.querySelector('[data-part=empty] > div'), open: 'stitch/organisms/offer-composer-r1.html#empty' },
  { source: 'X4', org: 'offer_composer', label: 'R1 — phone bottom sheet', pick: () => document.querySelector('[data-part=phone] > div'), open: 'stitch/organisms/offer-composer-r1.html#phone' },

  // Discover rail R1 — each card cut from the rail sheet; "open on its own" opens the sheet.
  { source: 'X6', org: 'expiring_offers', label: 'R1 — open', pick: () => document.querySelectorAll('[data-part=open] [data-rail] > section')[0], open: 'stitch/organisms/discover-rail-r1.html#open' },
  { source: 'X6', org: 'expiring_offers', label: 'R1 — folded to one line', pick: () => document.querySelectorAll('[data-part=folded] [data-rail] > section')[0], open: 'stitch/organisms/discover-rail-r1.html#folded' },
  { source: 'X6', org: 'my_table', label: 'R1 — open', pick: () => document.querySelectorAll('[data-part=open] [data-rail] > section')[1], open: 'stitch/organisms/discover-rail-r1.html#open' },
  { source: 'X6', org: 'my_table', label: 'R1 — folded to one line', pick: () => document.querySelectorAll('[data-part=folded] [data-rail] > section')[1], open: 'stitch/organisms/discover-rail-r1.html#folded' },
  { source: 'X6', org: 'tier_meter', label: 'R1 — open', pick: () => document.querySelectorAll('[data-part=open] [data-rail] > section')[2], open: 'stitch/organisms/discover-rail-r1.html#open' },
  { source: 'X6', org: 'tier_meter', label: 'R1 — folded to one line', pick: () => document.querySelectorAll('[data-part=folded] [data-rail] > section')[2], open: 'stitch/organisms/discover-rail-r1.html#folded' },
  { source: 'X6', org: 'expiring_offers', label: 'R1 — nothing waiting', pick: () => document.querySelectorAll('[data-part=quiet] [data-rail] > section')[0], open: 'stitch/organisms/discover-rail-r1.html#quiet' },
  { source: 'X6', org: 'my_table', label: 'R1 — empty table', pick: () => document.querySelectorAll('[data-part=new] [data-rail] > section')[1], open: 'stitch/organisms/discover-rail-r1.html#new' },
  { source: 'X6', org: 'tier_meter', label: 'R1 — under the limit', pick: () => document.querySelectorAll('[data-part=quiet] [data-rail] > section')[2], open: 'stitch/organisms/discover-rail-r1.html#quiet' },
  { source: 'X6', org: 'tier_meter', label: 'R1 — Collector', pick: () => document.querySelectorAll('[data-part=collector] [data-rail] > section')[2], open: 'stitch/organisms/discover-rail-r1.html#collector' },
  { source: 'S1', org: 'tier_meter', label: 'Stitch S1 — tile, right rail', pick: () => document.querySelectorAll('aside > section')[2] },
  { source: 'S1', org: 'expiring_offers', label: 'Stitch S1 — tile, right rail', pick: () => document.querySelectorAll('aside > section')[0] },
  { source: 'S1', org: 'my_table', label: 'Stitch S1 — tile, right rail', pick: () => document.querySelectorAll('aside > section')[1] },
  { source: 'S1', org: 'footer', label: 'Full — page footer', pick: () => document.querySelector('body > footer') },

  // S2 — Active Swaps & Offers. Cut from the R2 revision so widths are the
  // real ones: the side nav takes 256px out of the content.
  { source: 'R2', org: 'swaps_header', label: 'Full — page header with tabs', pick: () => document.querySelector('h1').closest('.rounded-xl') },
  { source: 'R2', org: 'offer_card', label: 'Wide — the most urgent offer (7 of 12)', pick: () => document.querySelectorAll('article')[0] },
  { source: 'R2', org: 'offer_card', label: 'Tile — every other offer (5 of 12)', pick: () => document.querySelectorAll('article')[1] },
  // handover_desk R1 — cut from its states sheet; "open on its own" goes to the whole sheet.
  { source: 'X3', org: 'handover_desk', label: 'R1 — agreed, nobody confirmed', pick: () => document.querySelector('[data-part=agreed] > div'), open: 'stitch/organisms/handover-desk-r1.html#agreed' },
  { source: 'X3', org: 'handover_desk', label: 'R1 — you confirmed, waiting', pick: () => document.querySelector('[data-part=me] > div'), open: 'stitch/organisms/handover-desk-r1.html#me' },
  { source: 'X3', org: 'handover_desk', label: 'R1 — they confirmed, your turn', pick: () => document.querySelector('[data-part=them] > div'), open: 'stitch/organisms/handover-desk-r1.html#them' },
  { source: 'X3', org: 'handover_desk', label: 'R1 — the confirm dialog', pick: () => document.querySelector('[data-part=confirm] > div'), open: 'stitch/organisms/handover-desk-r1.html#confirm' },
  { source: 'X3', org: 'handover_desk', label: 'R1 — both confirmed, it’s a bartefy', pick: () => document.querySelector('[data-part=done] > div'), open: 'stitch/organisms/handover-desk-r1.html#done' },
  { source: 'X3', org: 'handover_desk', label: 'R1 — called off', pick: () => document.querySelector('[data-part=off] > div'), open: 'stitch/organisms/handover-desk-r1.html#off' },
  { source: 'X3', org: 'handover_desk', label: 'R1 — compact, chat header', pick: () => document.querySelector('[data-part=compact] > div'), open: 'stitch/organisms/handover-desk-r1.html#compact' },
  { source: 'X3', org: 'handover_desk', label: 'R1 — phone 358px', pick: () => document.querySelector('[data-part=phone] > div'), open: 'stitch/organisms/handover-desk-r1.html#phone' },
  { source: 'S2', org: 'meetup_spot', label: 'Wide — inside the agreed card', pick: () => [...document.querySelectorAll('h4')].find((e) => e.textContent.includes('Central Library')).closest('.shadow-sm.p-5') },
  { source: 'S2', org: 'chat_peek', label: 'Wide — inside the agreed card', pick: () => [...document.querySelectorAll('span')].find((e) => e.textContent.trim() === 'Samira Patel').closest('.rounded-xl') },
  { source: 'S2', org: 'handover_steps', label: 'Tile — right column of the agreed card', pick: () => [...document.querySelectorAll('h4')].find((e) => e.textContent.includes('Handover Protocol')).closest('.justify-between') },
  { source: 'R2', org: 'free_pledge', label: 'Wide — bottom of the page', pick: () => [...document.querySelectorAll('span')].find((e) => e.textContent.includes('Fair Swap Pledge')).closest('.rounded-xl') },
  { source: 'R2', org: 'meta_strip', label: 'Full — strip above the header', pick: () => [...document.querySelectorAll('span')].find((e) => e.textContent.includes('Ledger Clock')).closest('.justify-between') },
  { source: 'R2', org: 'fair_trade_meter', label: 'Tile — under the second offer', pick: () => [...document.querySelectorAll('span')].find((e) => e.textContent.includes('Fair Trade Calibration')).closest('.rounded-xl') },

  // S3 — Points & Tiers, cut from the R3 revision.
  { source: 'R3', org: 'points_wallet', label: 'Wide — Points hero (7 of 12), invite inside', pick: () => document.getElementById('user-balance-display').closest('.lg\\:col-span-7') },
  { source: 'R3', org: 'streak', label: 'Tile — Points hero (5 of 12), S3 version', pick: () => [...document.querySelectorAll('span')].find((e) => e.textContent.trim() === '4-Day Visit Streak').closest('.lg\\:col-span-5') },
  { source: 'R3', org: 'invite_banner', label: 'Wide — inside the balance card', pick: () => document.getElementById('invite-btn').closest('.rounded-lg.p-space-md') },
  { source: 'R3', org: 'earn_rules', label: 'Wide — 5 rules in a row', pick: () => [...document.querySelectorAll('h2')].find((e) => e.textContent.includes('Economy Rules')).closest('section') },
  { source: 'R3', org: 'tier_plans', label: 'Wide — Hunter, Collector, Curator', pick: () => [...document.querySelectorAll('h2')].find((e) => e.textContent.includes('Elevate')).closest('section') },
  { source: 'R3', org: 'perk_store', label: 'Wide — 5 perks', pick: () => [...document.querySelectorAll('h2')].find((e) => e.textContent.includes('A La Carte')).closest('section') },
  { source: 'R3', org: 'points_ledger', label: 'Wide — history table', pick: () => document.getElementById('ledger-body').closest('section') },
  { source: 'R3', org: 'meta_strip', label: 'Full — S3 version (Protocol 027 / ledger synced)', pick: () => [...document.querySelectorAll('span')].find((e) => e.textContent.includes('Protocol 027')).closest('.justify-between') },

  // S4 — My Finds & Inventory, cut from the R4 revision.
  { source: 'R4', org: 'items_header', label: 'Full — page header', pick: () => document.querySelector('h1').closest('section') },
  { source: 'R4', org: 'tier_meter', label: 'Compact — capacity bar in the My Finds header (S4)', pick: () => [...document.querySelectorAll('span')].find((e) => e.textContent.includes('Find Slots Live')).closest('.max-w-lg') },
  { source: 'R4', org: 'renewal_alert', label: 'Wide — under the header', pick: () => [...document.querySelectorAll('span')].find((e) => e.textContent.trim() === 'Maintenance Alert').closest('section') },
  { source: 'R4', org: 'inventory_filters', label: 'Full — chips + sort', pick: () => [...document.querySelectorAll('button')].find((e) => e.textContent.includes('All Active')).closest('.justify-between') },
  { source: 'R4', org: 'stall_card', label: 'Tile — offers pending', pick: () => document.querySelectorAll('article')[0] },
  { source: 'R4', org: 'stall_card', label: 'Tile — expiring in 3 days', pick: () => document.querySelectorAll('article')[1] },
  { source: 'R4', org: 'stall_card', label: 'Tile — live', pick: () => document.querySelectorAll('article')[4] },
  { source: 'R4', org: 'stall_card', label: 'Tile — in negotiation', pick: () => document.querySelectorAll('article')[3] },
  { source: 'R4', org: 'stall_stats', label: 'Wide — bottom of the page', pick: () => [...document.querySelectorAll('h2')].find((e) => e.textContent.includes('Swap Velocity')).closest('section') },
  {
    source: 'R4', org: 'listing_composer', label: 'Dialog — opened from "+ Put New Find on Table"',
    pick: () => document.getElementById('listingModal'),
    fix: (el) => { el.classList.remove('hidden', 'fixed', 'inset-0'); el.classList.add('flex', 'relative', 'p-8') },
    width: 900,
  },

  // tab_bar (phone navigation) R1 — live phone frames of the real pages.
  { source: 'X5', org: 'tab_bar', label: 'R1 — Discover', pick: () => document.querySelector('[data-part=discover] > div'), open: 'stitch/organisms/phone-nav-r1.html#discover' },
  { source: 'X5', org: 'tab_bar', label: 'R1 — Swaps (badge)', pick: () => document.querySelector('[data-part=swaps] > div'), open: 'stitch/organisms/phone-nav-r1.html#swaps' },
  { source: 'X5', org: 'tab_bar', label: 'R1 — You sheet', pick: () => document.querySelector('[data-part=you] > div'), open: 'stitch/organisms/phone-nav-r1.html#you' },
  { source: 'X5', org: 'tab_bar', label: 'R1 — streak chip → sheet', pick: () => document.querySelector('[data-part=streak] > div'), open: 'stitch/organisms/phone-nav-r1.html#streak' },
  { source: 'X5', org: 'tab_bar', label: 'R1 — Put on Table → sheet', pick: () => document.querySelector('[data-part=offer] > div'), open: 'stitch/organisms/phone-nav-r1.html#offer' },
  { source: 'X5', org: 'tab_bar', label: 'R1 — ＋Add → listing form', pick: () => document.querySelector('[data-part=add] > div'), open: 'stitch/organisms/phone-nav-r1.html#add' },
  { source: 'X5', org: 'tab_bar', label: 'Alternative — Points as the fifth tab', pick: () => document.querySelector('[data-part=alt] > div'), open: 'stitch/organisms/phone-nav-r1.html#alt' },

  // S5 — Chat, cut from the R5 revision. A different design system.
  { source: 'R5', org: 'match_dock', label: 'Full — banner + both finds', pick: () => [...document.querySelectorAll('span')].find((e) => e.textContent.includes("It's a Bartefy")).closest('section') },
  { source: 'R5', org: 'swap_thread_list', label: 'Tile — left column', pick: () => document.querySelectorAll('aside.lg\\:col-span-3')[0] },
  { source: 'R5', org: 'chat_thread', label: 'Wide — centre column (header → composer)', pick: () => document.querySelector('main.lg\\:col-span-6') },
  { source: 'R5', org: 'meetup_proposal', label: 'Inline — inside a message', pick: () => [...document.querySelectorAll('span')].find((e) => e.textContent.includes('Safe Zone Proposal')).closest('.rounded-xl') },
  { source: 'R5', org: 'chat_composer', label: 'Wide — bottom of the thread', pick: () => [...document.querySelectorAll('button')].find((e) => e.textContent.includes('Friday works')).closest('.bg-stone') },
  { source: 'R5', org: 'owner_bar', label: 'Compact — chat header (S5)', pick: () => [...document.querySelectorAll('h2')].find((e) => e.textContent.trim() === 'Sara M.').closest('.bg-stone') },
  { source: 'R5', org: 'handover_steps', label: 'Tile — "Swap Safeguards", 4 steps (S5)', pick: () => [...document.querySelectorAll('span')].find((e) => e.textContent.trim() === 'Swap Safeguards').closest('.rounded-xl') },
  { source: 'R5', org: 'meetup_spot', label: 'Tile — "Midpoint Zone" (S5)', pick: () => [...document.querySelectorAll('span')].find((e) => e.textContent.trim() === 'Midpoint Zone').closest('.rounded-xl') },
  { source: 'R5', org: 'free_pledge', label: 'Tile — "Bartefy Trust Pledge" (S5)', pick: () => [...document.querySelectorAll('span')].find((e) => e.textContent.includes('Trust Pledge')).closest('.rounded-xl') },
  { source: 'R5', org: 'meta_strip', label: 'S5 version — "Borough Node #04"', pick: () => [...document.querySelectorAll('span')].find((e) => e.textContent.includes('Borough Node')).closest('.rounded-lg') },
  { source: 'S5', org: 'footer', label: 'S5 version — green, 4 columns', pick: () => document.querySelector('body > footer') },
  { source: 'R5', org: 'points_wallet', label: 'Inline — "420 BP" chip (S5)', pick: () => [...document.querySelectorAll('header span')].find((e) => e.textContent.includes('420 BP')).parentElement },
]

const V6 = {}
globalThis.window = V6
await import(path.join(here, 'pages.js'))
await import(path.join(here, 'organisms.js'))
const sources = Object.fromEntries(V6.V6.sources.map((s) => [s.id, s]))

const browser = await puppeteer.launch()
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })

const manifest = {}
const counters = {}
let loaded = null

for (const part of PARTS) {
  const src = sources[part.source]
  const file = path.join(here, src.file)
  if (loaded !== file) {
    await page.goto('file://' + file, { waitUntil: 'networkidle0', timeout: 60000 })
    loaded = file
  }
  const { head, html, width } = await page.evaluate(
    (pickSrc, fixSrc) => {
      const el = (0, eval)('(' + pickSrc + ')')()
      if (!el) throw new Error('not found')
      const width = Math.ceil(el.getBoundingClientRect().width)
      const copy = el.cloneNode(true)
      // The top bar is position:fixed in the page; on its own it must flow.
      copy.classList.remove('fixed')
      if (fixSrc) (0, eval)('(' + fixSrc + ')')(copy)
      // Tailwind's CDN re-writes <head>; take the original tags only.
      const head = [...document.head.children]
        .filter((n) => n.tagName !== 'STYLE' || !n.textContent.includes('tailwindcss'))
        .map((n) => n.outerHTML)
        .join('\n')
      return { head, html: copy.outerHTML, width }
    },
    part.pick.toString(),
    part.fix ? part.fix.toString() : null,
  )

  const w = part.width ?? width
  const n = (counters[part.org] = (counters[part.org] ?? 0) + 1)
  const name = `${part.source.toLowerCase()}-${part.org}${n > 1 ? '-' + n : ''}.html`
  fs.writeFileSync(
    path.join(out, name),
    `<!DOCTYPE html><html lang="en"><head>${head}</head>
<body class="bg-background font-body-md text-on-surface antialiased">
<div id="frame" style="width:${w}px;padding:16px;box-sizing:content-box">${html}</div>
</body></html>`,
  )
  // vw: the viewport the part must be rendered at. Stitch uses md:/lg:/xl:
  // classes, which read the WINDOW -- an iframe only as wide as the organism
  // makes a 213px chip think it is on a phone and hide itself.
  ;(manifest[part.org] ??= []).push({ label: part.label, file: 'stitch/parts/' + name, open: part.open, width: w + 32, vw: 1440 })
}

// Heights: only known once Tailwind has run inside each part file.
for (const list of Object.values(manifest)) {
  for (const p of list) {
    await page.goto('file://' + path.join(here, p.file), { waitUntil: 'networkidle0', timeout: 60000 })
    await new Promise((r) => setTimeout(r, 300))
    p.height = await page.evaluate(() => Math.ceil(document.getElementById('frame').getBoundingClientRect().height))
  }
}

fs.writeFileSync(
  path.join(out, 'manifest.js'),
  `/* Generated by build-parts.mjs — do not edit. */\nwindow.V6_PARTS = ${JSON.stringify(manifest, null, 2)}\n`,
)
await browser.close()
console.log(Object.entries(manifest).map(([k, v]) => `${k}: ${v.map((p) => `${p.width}x${p.height}`).join(', ')}`).join('\n'))
