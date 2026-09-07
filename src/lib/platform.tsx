import * as React from 'react'

/** Bartefy ships two layouts, not one responsive layout.
 *
 *  Mobile and desktop screens live in separate files (Hunt.mobile.tsx,
 *  Hunt.desktop.tsx) and only one is ever mounted. This is a deliberate
 *  trade: no `hidden lg:flex` scattered through markup, no layout that is a
 *  compromise between two shapes. Each file is free to be the best version of
 *  itself.
 *
 *  Shared atoms (Button, Input, Card) stay single-file — a button is a button.
 *  The split starts at the screen and layout level.
 */

/** Two breakpoints, three platforms.
 *
 *  Tablet is the middle ground the desktop/tablet wireframes draw at
 *  768-1023px: a slim icon-only rail and a single centred column, with touch
 *  targets that stay finger-sized. It is NOT a third set of screen files --
 *  that would triple the surface for a shape that is mostly "desktop, but
 *  narrower". A tablet renders the DESKTOP tree with the rail pinned
 *  collapsed, which is exactly what the wireframe draws.
 *
 *  The one place the drawings ask for real behaviour is Matches/Chat, where
 *  the note is explicit: "build the two-pane once and show/hide the list based
 *  on width". Portrait behaves like mobile (list, then chat as a full view);
 *  landscape borrows the desktop two-pane. `useTwoPane()` below is that test,
 *  so no screen has to re-derive it.
 */
export const TABLET_BREAKPOINT = 768
export const DESKTOP_BREAKPOINT = 1024

export type Platform = 'mobile' | 'tablet' | 'desktop'

const PlatformContext = React.createContext<Platform | null>(null)

/** A touchscreen with no precise pointer. `pointer: coarse` alone is not
 *  enough -- a laptop with a touchscreen reports coarse for the finger while
 *  still having a trackpad -- so `any-pointer: fine` vetoes it. That pair is
 *  true on every iPad and false on a touch laptop with a mouse attached.
 */
function isTouchOnly(): boolean {
  return (
    window.matchMedia('(pointer: coarse)').matches &&
    !window.matchMedia('(any-pointer: fine)').matches
  )
}

function read(): Platform {
  if (typeof window === 'undefined') return 'mobile'
  if (window.matchMedia(`(min-width: ${TABLET_BREAKPOINT}px)`).matches === false) return 'mobile'

  /** Width alone put the 12.9" iPad Pro in portrait (exactly 1024px) on the
   *  desktop side, where it got the wide rail while every smaller iPad got the
   *  slim one. A tablet is a tablet at any width: what actually distinguishes
   *  it is the finger, not the pixel count. So a touch-only device is a tablet
   *  however wide it is, and width decides only for pointer devices. */
  if (isTouchOnly()) return 'tablet'

  return window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`).matches ? 'desktop' : 'tablet'
}

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [platform, setPlatform] = React.useState<Platform>(read)

  React.useEffect(() => {
    // Both edges have to be watched: crossing either one changes the answer.
    const queries = [
      window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`),
      window.matchMedia(`(min-width: ${TABLET_BREAKPOINT}px)`),
      // A mouse being plugged into a tablet changes the answer.
      window.matchMedia('(pointer: coarse)'),
      window.matchMedia('(any-pointer: fine)'),
    ]
    const onChange = () => setPlatform(read())
    onChange()
    queries.forEach((q) => q.addEventListener('change', onChange))
    return () => queries.forEach((q) => q.removeEventListener('change', onChange))
  }, [])

  React.useEffect(() => {
    // Lets CSS and E2E tests target the active platform without re-deriving it.
    document.documentElement.dataset.platform = platform
  }, [platform])

  return <PlatformContext.Provider value={platform}>{children}</PlatformContext.Provider>
}

export function usePlatform(): Platform {
  const ctx = React.useContext(PlatformContext)
  if (ctx === null) {
    throw new Error('usePlatform must be used inside <PlatformProvider>')
  }
  return ctx
}

/** True on desktop AND tablet.
 *
 *  Deliberately not `=== 'desktop'`. Every existing call site asks this to
 *  mean "do I have room for a rail and a wider layout", which a tablet does.
 *  Narrowing it to desktop-only would have dropped every tablet back to the
 *  phone layout -- the opposite of the fix.
 */
export const useIsDesktop = () => usePlatform() !== 'mobile'

/** Strictly the widest layout, for the few places that need to tell a tablet
 *  from a desktop -- a third pane, a hover affordance. */
export const useIsWide = () => usePlatform() === 'desktop'

export const useIsTablet = () => usePlatform() === 'tablet'
export const useIsMobile = () => usePlatform() === 'mobile'

/** Whether a list-plus-detail screen should show both panes at once.
 *
 *  Desktop always does. A tablet does only in landscape, per the wireframe's
 *  note on Matches: portrait behaves like mobile and opens the chat as a full
 *  view. Orientation is read as a media query rather than from
 *  screen.orientation, which is unreliable on desktop browsers and in tests.
 */
export function useTwoPane(): boolean {
  const platform = usePlatform()
  const [landscape, setLandscape] = React.useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(orientation: landscape)').matches,
  )

  React.useEffect(() => {
    const mql = window.matchMedia('(orientation: landscape)')
    const onChange = () => setLandscape(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  if (platform === 'mobile') return false
  if (platform === 'tablet') return landscape
  return true
}

/** Picks the mobile or desktop implementation of a screen.
 *
 *      // screens/Hunt/index.tsx
 *      export const Hunt = createScreen({
 *        mobile: () => import('./Hunt.mobile'),
 *        desktop: () => import('./Hunt.desktop'),
 *      })
 *
 *  The unused platform's code is never downloaded — a phone never pays for the
 *  three-pane desktop layout.
 */
type ScreenModule = { default: React.ComponentType }

export function createScreen(loaders: {
  mobile: () => Promise<ScreenModule>
  desktop: () => Promise<ScreenModule>
}) {
  const Mobile = React.lazy(loaders.mobile)
  const Desktop = React.lazy(loaders.desktop)

  return function PlatformScreen() {
    const platform = usePlatform()
    // Tablet takes the desktop module. The rail renders slim and the layout
    // reflows; a separate tablet file would be a third copy of every screen.
    const Screen = platform === 'mobile' ? Mobile : Desktop
    return (
      <React.Suspense fallback={<ScreenFallback />}>
        <Screen />
      </React.Suspense>
    )
  }
}

/** Parchment-coloured hold while a screen chunk arrives. Deliberately not a
 *  spinner: on a fast connection a spinner flashes and reads as jank. */
function ScreenFallback() {
  return <div className="min-h-dvh bg-background" aria-busy="true" />
}
