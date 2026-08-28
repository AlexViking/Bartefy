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

/** One breakpoint. Below it we are a thumb-first card feed; above it we have
 *  room for rails and split panes. */
export const DESKTOP_BREAKPOINT = 900

export type Platform = 'mobile' | 'desktop'

const PlatformContext = React.createContext<Platform | null>(null)

function read(): Platform {
  if (typeof window === 'undefined') return 'mobile'
  return window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`).matches ? 'desktop' : 'mobile'
}

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [platform, setPlatform] = React.useState<Platform>(read)

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)
    const onChange = () => setPlatform(read())
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
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

export const useIsDesktop = () => usePlatform() === 'desktop'
export const useIsMobile = () => usePlatform() === 'mobile'

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
    const Screen = platform === 'desktop' ? Desktop : Mobile
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
