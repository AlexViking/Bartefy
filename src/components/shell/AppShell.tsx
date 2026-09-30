import * as React from 'react'
import { Outlet, useLocation } from 'react-router'

import { useExperiment } from '@/lib/experiments'
import { useIsDesktop, useIsTablet } from '@/lib/platform'
import { YouSheet } from './AccountMenu'
import { DiscoverPhoneBar } from './DiscoverPhoneBar'
import { SideNav } from './SideNav'
import { TabBar } from './TabBar'
import { TopBar, type ShellPlatform } from './TopBar'
import { useShellData } from './useShellData'

const COLLAPSE_KEY = 'bartefy.sidebar.collapsed'

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

/** True inside ShellLayout. A screen's own <AppShell> reads it and steps
 *  aside, so the frame is drawn exactly once. */
const InShell = React.createContext(false)

/** The V6 frame, mounted ONCE above the signed-in routes.
 *
 *  Until V6 every screen rendered its own AppShell, so each navigation
 *  unmounted the whole frame and mounted a new one: animations replayed, the
 *  rail's width had to live outside React, and every badge query refetched on
 *  every click. As a layout route the frame survives navigation and only the
 *  <Outlet /> changes.
 *
 *    desktop  top bar (80px) over [side nav 256px | page]; Collapse -> rail
 *    tablet   top bar (64px) over [rail 72px | page]
 *    phone    top bar (56px) / page / tab bar
 */
export function ShellLayout() {
  return (
    <ShellFrame>
      <Outlet />
    </ShellFrame>
  )
}

function ShellFrame({ children }: { children: React.ReactNode }) {
  const isDesktop = useIsDesktop()
  const isTablet = useIsTablet()
  const platform: ShellPlatform = !isDesktop ? 'phone' : isTablet ? 'tablet' : 'desktop'
  const data = useShellData()
  const [storedCollapsed, setStoredCollapsed] = React.useState(readCollapsed)
  const [youOpen, setYouOpen] = React.useState(false)
  const { pathname } = useLocation()

  /** Experiment exposure for everyone who opens the app -- being IN an arm is
   *  what exposure means, and the arm is decided the moment the app opens.
   *  Deduped per app load in lib/experiments. */
  useExperiment('deck_empty_cta')
  useExperiment('offer_deadline')

  const toggleCollapsed = () => {
    setStoredCollapsed((v) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, v ? '0' : '1')
      } catch {
        // A nav that forgets its width is a small annoyance, not a failure.
      }
      return !v
    })
  }

  // The tablet's rail is its only width; the stored preference is overridden,
  // not overwritten, so the same person on a desktop keeps their choice.
  const collapsed = isTablet || storedCollapsed
  const navWidth = collapsed ? 72 : 256

  if (platform === 'phone') {
    return (
      <InShell.Provider value>
        {/* The shell IS the viewport; only <main> scrolls. */}
        <div className="flex h-dvh flex-col overflow-hidden bg-background">
          {/* Discover is layout C: its own top bar, no tab bar -- the deck's
              five actions own the bottom. Every other page keeps the bar. */}
          {pathname === '/discover' ? (
            <DiscoverPhoneBar data={data} onYou={() => setYouOpen(true)} />
          ) : (
            <TopBar data={data} platform="phone" navWidth={0} withWord={false} />
          )}
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
          {/* Discover's actions and Add a find's Next own the bottom there. */}
          {pathname !== '/discover' && pathname !== '/add' && <TabBar data={data} onYou={() => setYouOpen(true)} youOpen={youOpen} />}
          <YouSheet data={data} open={youOpen} onOpenChange={setYouOpen} />
        </div>
      </InShell.Provider>
    )
  }

  return (
    <InShell.Provider value>
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <TopBar data={data} platform={platform} navWidth={navWidth} withWord={!collapsed} />
        <div className="flex min-h-0 flex-1">
          <SideNav data={data} collapsed={collapsed} onToggle={isTablet ? undefined : toggleCollapsed} />
          {/* min-h-0 / min-w-0: flex children default to their content size,
              so without them <main> grows instead of scrolling. */}
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </InShell.Provider>
  )
}

/** What a screen wraps itself in.
 *
 *  Inside ShellLayout (every signed-in route) the frame is already drawn, so
 *  this is a pass-through -- except `hideNav`, which covers the frame with a
 *  full-screen layer for the immersive screens (Add a find on a phone).
 *  Outside it (onboarding) it draws what it always drew.
 */
export function AppShell({
  children,
  hideNav = false,
}: {
  children: React.ReactNode
  /** Immersive screens hide the navigation entirely. */
  hideNav?: boolean
}) {
  const inShell = React.useContext(InShell)

  if (hideNav) {
    return inShell ? (
      <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background">{children}</div>
    ) : (
      <div className="flex min-h-dvh flex-col bg-background">{children}</div>
    )
  }
  if (inShell) return <>{children}</>
  return <ShellFrame>{children}</ShellFrame>
}
