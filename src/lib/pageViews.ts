import { supabase } from '@/lib/supabase'

/** Who visits the three sites: bartefy.com (this app), bartefy.ge and
 *  bartefy.com.ge (the landing page, which carries its own copy of this
 *  logic in its index.html).
 *
 *  Separate from lib/analytics.ts on purpose. That log is about what signed-in
 *  people DO and refuses a row without a user. This one is about who ARRIVES,
 *  signed in or not, and knows nothing about who they are:
 *
 *    * no cookies, no IP address, no user id -- a random visitor id in
 *      localStorage is the only thing that ties two visits together;
 *    * country is read from the browser's time zone, not looked up from an IP;
 *    * the query string is never sent -- it can carry a sign-in code -- only
 *      the utm_source / utm_campaign values pulled out of it.
 *
 *  Same rule as track(): fire and forget, never awaited, every error swallowed.
 */

export const SITES = ['bartefy.com', 'bartefy.ge', 'bartefy.com.ge'] as const

/** Set on a browser that should not be counted. The Visitors tab sets it, so
 *  staff checking the numbers do not become the numbers. */
export const NO_TRACK_KEY = 'bartefy.notrack'
const VISITOR_KEY = 'bartefy.visitor'
const SESSION_KEY = 'bartefy.visit'

function uuid() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16))
}

/** Read or mint an id. Storage can throw (private mode, blocked site data);
 *  then the id lives for this page load only, which still counts the view. */
function stored(store: () => Storage, key: string): { id: string; fresh: boolean } {
  try {
    const s = store()
    const have = s.getItem(key)
    if (have) return { id: have, fresh: false }
    const id = uuid()
    s.setItem(key, id)
    return { id, fresh: true }
  } catch {
    return { id: uuid(), fresh: true }
  }
}

export function isTrackingOff(): boolean {
  try {
    return localStorage.getItem(NO_TRACK_KEY) === '1'
  } catch {
    return false
  }
}

export function setTrackingOff(off: boolean) {
  try {
    if (off) localStorage.setItem(NO_TRACK_KEY, '1')
    else localStorage.removeItem(NO_TRACK_KEY)
  } catch {
    // Nothing to do: without storage the flag cannot be remembered.
  }
}

/** Ids collapse to ":id" so Top pages lists screens, not one row per swap. */
function cleanPath(pathname: string): string {
  const parts = pathname.split('/').map((seg, i) =>
    i > 1 && seg.length >= 8 && /\d/.test(seg) ? ':id' : seg)
  return (parts.join('/') || '/').slice(0, 200)
}

/** Where a visit came from, as one readable name. Facebook alone sends
 *  l.facebook.com, lm.facebook.com and m.facebook.com; those are one source. */
function sourceName(referrer: string): string | null {
  if (!referrer) return null
  let host: string
  try {
    const u = new URL(referrer)
    // Android apps arrive as android-app://com.google.android.gm etc.
    host = u.protocol === 'android-app:' ? u.host : u.hostname
  } catch {
    return null
  }
  host = host.toLowerCase().replace(/^www\./, '')
  if (/(^|\.)google\.|googlequicksearchbox/.test(host)) return 'google'
  if (/(^|\.)facebook\.com$|^fb\.me$/.test(host)) return 'facebook'
  if (/(^|\.)instagram\.com$/.test(host)) return 'instagram'
  if (/(^|\.)t\.co$|(^|\.)x\.com$|(^|\.)twitter\.com$/.test(host)) return 'x'
  if (/(^|\.)bing\.com$/.test(host)) return 'bing'
  if (/(^|\.)yandex\./.test(host)) return 'yandex'
  if (/(^|\.)linkedin\.com$|^lnkd\.in$/.test(host)) return 'linkedin'
  if (/(^|\.)tiktok\.com$/.test(host)) return 'tiktok'
  if (/telegram|^t\.me$/.test(host)) return 'telegram'
  return host.slice(0, 120)
}

/** Time zone -> country. A browser does not know its country, but it knows
 *  its time zone, and for the places Bartefy's visitors come from that is
 *  one country each. Unlisted zones fall back to the language's region. */
const TZ_COUNTRY: Record<string, string> = {
  'Asia/Tbilisi': 'GE', 'Europe/Moscow': 'RU', 'Europe/Kiev': 'UA', 'Europe/Kyiv': 'UA',
  'Asia/Yerevan': 'AM', 'Asia/Baku': 'AZ', 'Europe/Istanbul': 'TR', 'Asia/Istanbul': 'TR',
  'Europe/Berlin': 'DE', 'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Madrid': 'ES',
  'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE', 'Europe/Vienna': 'AT',
  'Europe/Zurich': 'CH', 'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Riga': 'LV',
  'Europe/Vilnius': 'LT', 'Europe/Tallinn': 'EE', 'Europe/Stockholm': 'SE', 'Europe/Oslo': 'NO',
  'Europe/Copenhagen': 'DK', 'Europe/Helsinki': 'FI', 'Europe/Dublin': 'IE', 'Europe/Lisbon': 'PT',
  'Europe/Athens': 'GR', 'Europe/Bucharest': 'RO', 'Europe/Sofia': 'BG', 'Europe/Budapest': 'HU',
  'Europe/Minsk': 'BY', 'Europe/Chisinau': 'MD', 'Asia/Jerusalem': 'IL', 'Asia/Dubai': 'AE',
  'Asia/Tehran': 'IR', 'Asia/Almaty': 'KZ', 'Asia/Tashkent': 'UZ', 'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN', 'Asia/Shanghai': 'CN', 'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR',
  'Asia/Singapore': 'SG', 'Asia/Riyadh': 'SA', 'Asia/Qatar': 'QA', 'Africa/Cairo': 'EG',
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'America/New_York': 'US',
  'America/Chicago': 'US', 'America/Denver': 'US', 'America/Los_Angeles': 'US',
  'America/Phoenix': 'US', 'America/Toronto': 'CA', 'America/Vancouver': 'CA',
  'America/Sao_Paulo': 'BR', 'America/Mexico_City': 'MX',
}

function country(): string | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (TZ_COUNTRY[tz]) return TZ_COUNTRY[tz]
  } catch {
    // fall through to the language
  }
  const region = (navigator.language ?? '').split('-')[1]
  return region && /^[A-Za-z]{2}$/.test(region) ? region.toUpperCase() : null
}

function device(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent
  // iPadOS reports itself as a Mac; touch points give it away.
  if (/iPad|Tablet/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'tablet'
  if (/Android/.test(ua) && !/Mobile/.test(ua)) return 'tablet'
  if (/Mobi|iPhone|Android/.test(ua)) return 'mobile'
  return 'desktop'
}

/** Run once the page is actually on screen.
 *
 *  A browser can load a page nobody is looking at: Safari preloads the top
 *  address-bar suggestion while it is still being typed, Chrome prerenders.
 *  That second, hidden copy shares the tab's storage and ran the tracker in
 *  the same second as the real one -- one person counted as two visitors
 *  (seen on the first day, 2026-10-03). A hidden page waits; one that is
 *  thrown away never sends. */
function whenVisible(send: () => void) {
  if (document.visibilityState === 'visible') return send()
  const go = () => {
    if (document.visibilityState !== 'visible') return
    document.removeEventListener('visibilitychange', go)
    send()
  }
  document.addEventListener('visibilitychange', go)
}

let lastPath: string | null = null

/** Record one page view on bartefy.com. Called on every route change. */
export function trackPageView(pathname: string): void {
  try {
    // Headless browsers (screenshot scripts, crawlers that run JS) are not
    // visitors. Neither is localhost.
    if (navigator.webdriver || isTrackingOff()) return
    if (location.hostname !== 'bartefy.com') return

    const path = cleanPath(pathname)
    // A redirect route (/hunt -> /discover) or a re-render must not count twice.
    if (path === lastPath) return
    lastPath = path

    const visitor = stored(() => localStorage, VISITOR_KEY)
    const session = stored(() => sessionStorage, SESSION_KEY)
    // document.referrer never changes inside a single-page app, so it belongs
    // to the first view of a visit only; repeating it would count one Google
    // click on every screen.
    const params = new URLSearchParams(location.search)
    const first = session.fresh
    const from = sourceName(document.referrer)
    const referrer = from === 'bartefy.com' ? null : from

    whenVisible(() => void supabase
      .from('page_views')
      .insert({
        site: 'bartefy.com',
        path,
        visitor_id: visitor.id,
        session_id: session.id,
        referrer_host: first ? referrer : null,
        utm_source: first ? params.get('utm_source')?.slice(0, 64) || null : null,
        utm_campaign: first ? params.get('utm_campaign')?.slice(0, 64) || null : null,
        country: country(),
        device: device(),
        lang: (navigator.language ?? '').slice(0, 16) || null,
      })
      .then(
        () => {},
        () => {},
      ))
  } catch {
    // Never surface: counting visitors must not break the page.
  }
}
