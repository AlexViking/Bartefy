/** The app's three sound effects (files in public/sounds, made by Alex
 *  2026-10-03, AAC from his WAV masters -- 7-15 KB each instead of 276 KB).
 *
 *    notification   a message, an offer or a match arrives (lib/realtime.ts)
 *    dailyPoints    today's visit earned points (App.tsx)
 *    weeklyPoints   ...and that visit completed a week-long streak
 *
 *  Same rules as analytics: never awaited, never throws, never blocks.
 *  On by default; Settings -> Notifications -> Sounds turns them off for this
 *  device (a per-device choice, so localStorage, not the profile).
 */

export type Sound = 'notification' | 'dailyPoints' | 'weeklyPoints'

const FILES: Record<Sound, string> = {
  notification: '/sounds/notification.m4a',
  dailyPoints: '/sounds/daily-points.m4a',
  weeklyPoints: '/sounds/weekly-points.m4a',
}

const KEY = 'bartefy.sounds'

export function soundsOn(): boolean {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

export function setSoundsOn(on: boolean) {
  try {
    if (on) localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, 'off')
  } catch {
    // Without storage the choice lasts until the page is closed.
  }
}

/** A burst -- three messages landing together -- is one chime, not three. */
const QUIET_MS = 2000
let lastAt = 0

/** Browsers refuse sound until the person has touched the page, and the
 *  daily-points chime fires the moment the app opens, before any touch. So a
 *  refused sound waits for the first tap -- but only briefly: a chime
 *  arriving half a minute later belongs to nothing on screen. */
const PENDING_MS = 15_000
let pending: { sound: Sound; at: number } | null = null
let armed = false

function armUnlock() {
  if (armed) return
  armed = true
  const unlock = () => {
    window.removeEventListener('pointerdown', unlock, true)
    window.removeEventListener('keydown', unlock, true)
    armed = false
    const p = pending
    pending = null
    if (p && Date.now() - p.at < PENDING_MS) start(p.sound, false)
  }
  window.addEventListener('pointerdown', unlock, true)
  window.addEventListener('keydown', unlock, true)
}

function start(sound: Sound, retry: boolean) {
  const audio = new Audio(FILES[sound])
  audio.volume = 0.7
  audio.play().catch(() => {
    if (!retry) return
    pending = { sound, at: Date.now() }
    armUnlock()
  })
}

export function playSound(sound: Sound): void {
  try {
    if (!soundsOn() || typeof Audio === 'undefined') return
    const now = Date.now()
    if (sound === 'notification' && now - lastAt < QUIET_MS) return
    if (sound === 'notification') lastAt = now
    start(sound, true)
  } catch {
    // A sound must never break what it decorates.
  }
}
