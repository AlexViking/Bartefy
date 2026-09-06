import * as React from 'react'
import { useQuery } from '@tanstack/react-query'

import { Sidebar } from './Sidebar'
import { TabBar } from './TabBar'
import { Topbar } from './Topbar'
import { supabase } from '@/lib/supabase'
import { getIncomingOffers } from '@/lib/barter'
import { useAuthStore } from '@/store/auth'
import { useIsDesktop } from '@/lib/platform'
import { useUnread } from '@/lib/useUnread'

const COLLAPSE_KEY = 'bartefy.sidebar.collapsed'

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

  const [collapsed, setCollapsed] = React.useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1'
    } catch {
      return false
    }
  })

  const toggleCollapse = () =>
    setCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0')
      } catch {
        // A rail that forgets its width is a small annoyance, not a failure.
      }
      return next
    })

  /** Offers waiting on me. The shell owns this because the shell owns the
   *  badge; one query however many screens are mounted. */
  const { data: offers = 0 } = useQuery({
    queryKey: ['barter', 'offers', 'incoming', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await getIncomingOffers(userId!)
      if (error) throw error
      return (data ?? []).length
    },
    enabled: !!userId,
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
      <div className="flex min-h-dvh bg-background">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          isStaff={isStaff}
          badges={badges}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenu={toggleCollapse} name={email} waiting={offers + unread} />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Topbar onMenu={toggleCollapse} name={email} waiting={offers + unread} />
      <main className="flex-1">{children}</main>
      <div className="sticky bottom-0 z-40">
        <TabBar unreadSwaps={unread} offers={offers} />
      </div>
    </div>
  )
}
