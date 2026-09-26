/**
 * shoot.mjs — capture every mobile screen of the live app as a PNG.
 *
 * Signs in without an email code: the service-role key mints a magic-link
 * token, which is verified into a real session and written into the same
 * localStorage key supabase-js reads on boot. The app then loads already
 * signed in, with real data.
 *
 *   node scripts/shoot.mjs                 # live bartefy.com, mobile
 *   node scripts/shoot.mjs --base http://localhost:5173
 *   node scripts/shoot.mjs --desktop
 *   node scripts/shoot.mjs --only discover,offers
 *
 * Output: screens/<date>-<viewport>/NN-name.png  (+ index.html contact sheet)
 *
 * Read-only. It navigates and screenshots; it never submits a form.
 */
import fs from 'node:fs'
import path from 'node:path'
import puppeteer from 'puppeteer'

const args = process.argv.slice(2)
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i === -1 ? d : args[i + 1] }
const has = (n) => args.includes(`--${n}`)

const BASE = (flag('base', 'https://bartefy.com')).replace(/\/$/, '')
const EMAIL = flag('email', '3ds.alex@gmail.com')
const ONLY = flag('only', '')?.split(',').filter(Boolean)
const DESKTOP = has('desktop')

// --width overrides the desktop width: the app is reviewed on a ~1920 screen,
// where a centred max-width page reads very differently than it does at 1440.
const DW = Number(flag('width', 1440))
const DH = Number(flag('height', DW >= 1920 ? 1080 : 900))
const VIEWPORT = DESKTOP
  ? { name: `desktop-${DW}x${DH}`, width: DW, height: DH, deviceScaleFactor: 2, isMobile: false, hasTouch: false }
  : { name: 'mobile-390x844', width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true }

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
)
const SUPA = env.VITE_SUPABASE_URL
const ANON = env.VITE_SUPABASE_ANON_KEY
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY
const REF = new URL(SUPA).hostname.split('.')[0]

/** A real session for EMAIL, without going through the inbox. */
async function mintSession() {
  const link = await fetch(`${SUPA}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', email: EMAIL }),
  }).then((r) => r.json())
  if (!link.hashed_token) throw new Error(`no token for ${EMAIL}: ${JSON.stringify(link).slice(0, 200)}`)

  const res = await fetch(`${SUPA}/auth/v1/verify`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', token_hash: link.hashed_token }),
  })
  const session = await res.json()
  if (!session.access_token) throw new Error(`verify failed: ${JSON.stringify(session).slice(0, 200)}`)
  return session
}

/** Every mobile screen, in the order someone meets them.
 *  `pre` runs after load to open a sheet or reach a sub-state. */
const SCREENS = [
  { id: 'auth',          path: '/login',    anon: true,  label: 'Sign in' },
  { id: 'signup',        path: '/signup',   anon: true,  label: 'Sign up' },
  { id: 'onboarding',    path: '/welcome',  label: 'Onboarding' },
  { id: 'discover',      path: '/discover', label: 'Discover — the deck', settle: 2500 },
  { id: 'items',         path: '/items',    label: 'My items' },
  { id: 'additem',       path: '/add',      label: 'Add an item' },
  { id: 'matches',       path: '/matches',  label: 'Swaps inbox' },
  { id: 'offers',        path: '/offers',   label: 'Offers' },
  { id: 'notifications', path: '/notifications', label: 'Notifications' },
  { id: 'profile',       path: '/profile',  label: 'Profile' },
  { id: 'points',        path: '/points',   label: 'Points & rewards' },
  { id: 'invite',        path: '/invite',   label: 'Invite a friend' },
  { id: 'membership',    path: '/membership', label: 'Membership' },
  { id: 'settings',      path: '/settings', label: 'Settings' },
  { id: 'blocked',       path: '/settings/blocked', label: 'Blocked people' },
  { id: 'itemdetail',    path: null, label: 'Item detail', dynamic: 'item' },
  { id: 'publicprofile', path: null, label: 'Someone else’s profile', dynamic: 'user' },
  { id: 'chat',          path: null, label: 'Chat thread', dynamic: 'swap' },
  { id: 'arrange',       path: null, label: 'Arrange a meet', dynamic: 'swap', suffix: '/arrange' },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  console.log(`→ ${BASE}  as ${EMAIL}  @ ${VIEWPORT.name}`)
  const session = await mintSession()
  console.log(`✓ session minted (expires in ${session.expires_in}s)`)

  // Fill the dynamic routes from real rows, so these screens show content.
  const rest = async (p) =>
    fetch(`${SUPA}/rest/v1/${p}`, { headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } }).then((r) => r.json())
  const me = session.user.id
  const [myItem] = await rest(`items?select=public_id&user_id=eq.${me}&status=eq.active&limit=1`)
  const [other] = await rest(`profiles?select=id&id=neq.${me}&limit=1`)
  const [swap] = await rest(`barter_matches?select=id&or=(user_a.eq.${me},user_b.eq.${me})&limit=1`)
  const [anySwap] = await rest(`barter_matches?select=id&limit=1`)
  const dyn = {
    item: myItem && `/item/${myItem.public_id}`,
    user: other && `/u/${other.id}`,
    swap: (swap || anySwap) && `/matches/${(swap || anySwap).id}`,
  }
  if (!swap && anySwap) console.log('! no swap of your own — chat/arrange use another thread and may render empty')

  const stamp = new Date().toISOString().slice(0, 10)
  const outDir = path.resolve('screens', `${stamp}-${VIEWPORT.name}`)
  fs.mkdirSync(outDir, { recursive: true })

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport(VIEWPORT)
  if (VIEWPORT.isMobile) {
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    )
  }

  const errors = []
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 160)))

  // Seed storage on the app's own origin before the first real navigation.
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(
    ([key, sess]) => {
      localStorage.setItem(key, JSON.stringify(sess))
      localStorage.setItem(
        'bartefy.onboarding',
        // Shape must match zustand/persist + partialize exactly: a `state`
        // wrapper, a `version`, and every partialized key. A partial object
        // rehydrates with completed=false and Protected bounces to /welcome.
        JSON.stringify({ state: { step: 0, city: 'Tbilisi', tastes: [], completed: true }, version: 0 })
      )
    },
    [`sb-${REF}-auth-token`, session]
  )

  const shot = async (s, i) => {
    const target = s.dynamic ? dyn[s.dynamic] && dyn[s.dynamic] + (s.suffix || '') : s.path
    if (!target) return { ...s, skipped: 'no row to point at' }

    // Re-seed every time: a screen that signs out, or a redirect through an
    // anon route, clears it otherwise.
    if (s.anon) {
      await page.evaluate((k) => localStorage.removeItem(k), `sb-${REF}-auth-token`)
    } else {
      await page.evaluate(
        ([k, v, ob]) => {
          localStorage.setItem(k, v)
          localStorage.setItem('bartefy.onboarding', ob)
        },
        [
          `sb-${REF}-auth-token`,
          JSON.stringify(session),
          JSON.stringify({ state: { step: 0, city: 'Tbilisi', tastes: [], completed: true }, version: 0 }),
        ]
      )
    }

    const before = errors.length
    await page.goto(`${BASE}${target}`, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {})
    await sleep(s.settle ?? 1400)

    const name = `${String(i + 1).padStart(2, '0')}-${s.id}.png`
    await page.screenshot({ path: path.join(outDir, name), fullPage: false })
    const landed = new URL(page.url()).pathname
    const redirected = landed !== target.split('?')[0]
    console.log(`  ${redirected ? '↪' : '✓'} ${name.padEnd(24)} ${landed}`)
    return { ...s, file: name, landed, redirected, errors: errors.slice(before) }
  }

  const list = ONLY?.length ? SCREENS.filter((s) => ONLY.includes(s.id)) : SCREENS
  const results = []
  for (const [i, s] of list.entries()) results.push(await shot(s, i))
  await browser.close()

  // Contact sheet: every shot on one page, so you can scan them together.
  const cards = results.map((r) => r.skipped
    ? `<figure class="skip"><div class="ph">skipped — ${r.skipped}</div><figcaption>${r.label}</figcaption></figure>`
    : `<figure><img src="${r.file}" loading="lazy"><figcaption>${r.label}<small>${r.landed}${r.redirected ? ' · redirected' : ''}${r.errors?.length ? ` · ${r.errors.length} js error(s)` : ''}</small></figcaption></figure>`
  ).join('\n')
  fs.writeFileSync(path.join(outDir, 'index.html'), `<!doctype html><meta charset=utf-8>
<title>Bartefy — ${VIEWPORT.name} — ${stamp}</title>
<style>
 body{background:#33322B;color:#F7F2E1;font:14px/1.5 system-ui;margin:0;padding:32px}
 h1{font-weight:600;font-size:20px;margin:0 0 4px} p.sub{opacity:.6;margin:0 0 28px}
 .grid{display:grid;gap:28px;grid-template-columns:repeat(auto-fill,minmax(${DESKTOP ? 520 : 230}px,1fr))}
 figure{margin:0} img{width:100%;border-radius:10px;display:block;background:#000}
 .ph{aspect-ratio:${VIEWPORT.width}/${VIEWPORT.height};border:1px dashed #6b6a5e;border-radius:10px;display:grid;place-items:center;opacity:.5;font-size:12px;text-align:center;padding:12px}
 figcaption{margin-top:8px;font-weight:600} small{display:block;font-weight:400;opacity:.55;font-size:11px;word-break:break-all}
</style>
<h1>Bartefy — ${VIEWPORT.name}</h1><p class=sub>${BASE} · ${stamp} · ${results.filter((r) => r.file).length} screens</p>
<div class=grid>${cards}</div>`)

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(results, null, 2))
  console.log(`\n→ ${outDir}\n  open ${path.join(outDir, 'index.html')}`)
  if (errors.length) console.log(`\n! ${errors.length} page error(s):\n  ${[...new Set(errors)].join('\n  ')}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
