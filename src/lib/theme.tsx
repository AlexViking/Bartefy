import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

/** Three states, not two. "system" is the default and follows the device, which
 *  is why it cannot be collapsed into light: a person who has never opened the
 *  setting should get the theme their phone is already in after dark.
 */
export type ThemePref = 'light' | 'dark' | 'system'
/** What is actually painted once "system" has been resolved. */
export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'bartefy.theme'

type ThemeContext = {
  /** What the person chose. */
  pref: ThemePref
  /** What is on screen right now. */
  theme: Theme
  setPref: (pref: ThemePref) => void
  /** Light -> dark -> light. Resolves "system" to its opposite so the first
   *  tap always visibly changes something. */
  toggle: () => void
}

const Ctx = createContext<ThemeContext | null>(null)

function systemTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Dark is the default, per V5. Someone who has never opened the setting
 *  meets the dark theme; light is a choice they make, not one they fall into
 *  because their laptop is set that way. */
const DEFAULT_PREF: ThemePref = 'dark'

function storedPref(): ThemePref {
  if (typeof window === 'undefined') return DEFAULT_PREF
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {
    // Private windows and blocked site data throw on access rather than
    // returning null. A theme is not worth failing a render over.
  }
  return DEFAULT_PREF
}

/** Writes the attribute the CSS selects on. Light is the absence of the
 *  attribute rather than data-theme="light", which keeps :root as the light
 *  definition and means one selector, not two, in the stylesheet.
 */
function apply(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') root.setAttribute('data-theme', 'dark')
  else root.removeAttribute('data-theme')

  // The address bar and the Capacitor status bar read this, so a dark page
  // with a green bar above it looks like two applications stacked.
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#121210' : '#2F6A52')
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(storedPref)
  const [system, setSystem] = useState<Theme>(systemTheme)

  const theme: Theme = pref === 'system' ? system : pref

  // Follow the device while the preference is "system". The listener stays
  // attached whatever the preference is, so switching back to "system" is
  // correct immediately rather than at the next OS change.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystem(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    apply(theme)
  }, [theme])

  const setPref = useCallback((next: ThemePref) => {
    setPrefState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Same reason as the read: the theme still applies for this session.
    }
  }, [])

  const toggle = useCallback(() => {
    setPrefState((current) => {
      const next: ThemePref =
        (current === 'system' ? systemTheme() : current) === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* see above */
      }
      return next
    })
  }, [])

  return <Ctx.Provider value={{ pref, theme, setPref, toggle }}>{children}</Ctx.Provider>
}

export function useTheme(): ThemeContext {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
