import * as React from 'react'
import { useQuery } from '@tanstack/react-query'

import { MobileMenu } from './MobileMenu'
import { Sidebar } from './Sidebar'
import { TabBar } from './TabBar'
import { Topbar } from './Topbar'
import { supabase } from '@/lib/supabase'
import { getIncomingOffers } from '@/lib/barter'
import { keys } from '@/lib/cache/queryClient'
import { useAuthStore } from '@/store/auth'
import { useIsDesktop, useIsTablet } from '@/lib/platform'
import { useUnread } from '@/lib/useUnread'

const COLLAPSE_KEY = 'bartefy.sidebar.collapsed'

/** The rail's width, kept outside React.
 *
 *  AppShell is rendered inside each screen rather than above the router, so a
 *  navigation unmounts the whole shell and mounts a fresh one. Component state
 *  would be re-initialised on every click; reading localStorage in a useState
 *  initialiser gets the right value but still counts as a first render, which
 *  is enough to make anything animating off it replay.
 *
 *  A module-level value plus subscribers means the rail's width is simply a
 *  fact that outlives any one mount.
 */
let collapsedValue = (() => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
})()
const collapsedSubscribers = new Set<() => void>()

function subscribeCollapsed(fn: () => void) {
  collapsedSubscribers.add(fn)
  return () => void collapsedSubscribers.delete(fn)
}

function setCollapsedValue(next: boolean) {
  collapsedValue = next
  try {
    localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
  } catch {
    // A rail that forgets its width is a small annoyance, not a failure.
  }
  collapsedSubscribers.forEach((fn) => fn())
}

/** One shell for every signed-in screen.
 *
 *  Desktop is a rail plus a topbar, ported from V5; mobile keeps the tab bar,
 *  because a collapsible rail on a phone is a drawer nobody opens. Exactly one
 *  navigation is ever mounted -- never both with one hidden by CSS.
 */
export function AppShell({
  children,
  hideNav = false,
}: {
  children: React.ReactNode
  /** Immersive screens (the onboarding flow) hide the nav entirely. */
  hideNav?: boolean
}) {
  const isDesktop = useIsDesktop()
  const userId = useAuthStore((s) => s.session?.user?.id)
  const email = useAuthStore((s) => s.session?.user?.email) ?? ''
  const unread = useUnread()

  /** The phone's drawer. Separate from `collapsed`, which is the desktop
   *  rail's width -- the burger used to call toggleCollapse, which on a phone
   *  changes nothing at all, so the button was simply dead. */
  const [menuOpen, setMenuOpen] = React.useState(false)

  const storedCollapsed = React.useSyncExternalStore(
    subscribeCollapsed,
    () => collapsedValue,
    () => false,
  )

  /** A tablet's rail is always the slim icon-only one. The wireframe is
   *  explicit -- "rail collapses to icons to save width" -- and at 768px an
   *  expanded 224px rail is nearly a third of the screen. The stored
   *  preference is not overwritten, only overridden, so a tablet user who
   *  later opens the app on a desktop still gets the width they chose. */
  const isTablet = useIsTablet()
  const collapsed = isTablet || storedCollapsed

  /** Nothing to toggle on a tablet: there is only one rail width there, and a
   *  chevron that does nothing is worse than no chevron. */
  const toggleCollapse = isTablet ? undefined : () => setCollapsedValue(!collapsedValue)

  /** Offers waiting on me. The shell owns this because the shell owns the
   *  badge; one query however many screens are mounted. */
  const { data: offers = 0 } = useQuery({
    queryKey: keys.barterOffersCount(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await getIncomingOffers(userId!)
      if (error) throw error
      return (data ?? []).length
    },
    enabled: !!userId,
    /* Without a staleTime this is stale the instant it resolves, and because
     * AppShell remounts on every navigation it refetched on every click --
     * dropping the badge to its `= 0` default and popping it back a moment
     * later, which made the whole rail row twitch each time you moved between
     * destinations. Realtime pushes new offers into the cache (lib/realtime),
     * so a minute of staleness costs nothing. */
    staleTime: 60_000,
  })

  /** Staff rows are hidden, not disabled: a moderation link that refuses you
   *  is an invitation to wonder what is behind it. */
  const { data: isStaff = false } = useQuery({
    queryKey: ['staff', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_staff')
        .eq('id', userId!)
        .maybeSingle()
      if (error) return false
      return Boolean(data?.is_staff)
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  })

  const badges = { offers, unread }

  if (hideNav) {
    return <div className="flex min-h-dvh flex-col bg-background">{children}</div>
  }

  if (isDesktop) {
    return (
      // h-dvh and overflow-hidden, exactly as the mobile branch below.
      //
      // This was min-h-dvh with no overflow control, so the DOCUMENT scrolled:
      // on any page taller than the viewport the rail and the topbar slid up
      // and off with the content, which on Settings meant scrolling to the
      // bottom left a third of the window empty where the navigation used to
      // be. A rail is furniture -- it does not move.
      //
      // The fix is the same one the phone already had: the shell IS the
      // viewport, and only <main> scrolls inside it.
      <div className="flex h-dvh overflow-hidden bg-background">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          isStaff={isStaff}
          badges={badges}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={toggleCollapse} name={email} waiting={offers + unread} />
          {/* min-h-0 is load-bearing: a flex child defaults to
              min-height:auto, so without it <main> grows to its content
              instead of scrolling, and the overflow-hidden above simply clips
              the page. */}
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    )
  }

  return (
    // h-dvh, not min-h-dvh: the shell is exactly the viewport, so a screen
    // that wants to fill it (the deck) can, and one that is longer scrolls
    // inside <main> rather than moving the bar and the topbar with it.
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <Topbar onMenu={() => setMenuOpen(true)} name={email} waiting={offers + unread} />
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      <div className="z-40 shrink-0">
        <TabBar unreadSwaps={unread} offers={offers} />
      </div>
      <MobileMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
        isStaff={isStaff}
        badges={badges}
        name={email}
      />
    </div>
  )
}
