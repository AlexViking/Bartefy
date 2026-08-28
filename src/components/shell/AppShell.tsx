import * as React from 'react'

import { TabBar } from './TabBar'
import { TopNav } from './TopNav'
import { useIsDesktop } from '@/lib/platform'
import { useUnread } from '@/lib/useUnread'

/** One shell for every signed-in screen. It renders exactly one navigation —
 *  the top nav on desktop, the tab bar on mobile — rather than rendering both
 *  and hiding one with CSS. Screens never render navigation themselves.
 */
export function AppShell({
  children,
  hideNav = false,
}: {
  children: React.ReactNode
  /** Immersive screens (Chat on mobile, the onboarding flow) hide the nav. */
  hideNav?: boolean
}) {
  const isDesktop = useIsDesktop()
  // The shell owns the count because it owns the nav: one query, whichever
  // navigation is mounted. TabBar has taken this prop since the rebuild and
  // nothing ever passed it, so the dot could never appear.
  const unread = useUnread()

  if (isDesktop) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        {!hideNav && <TopNav unreadSwaps={unread} />}
        <main className="flex-1">{children}</main>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex-1">{children}</main>
      {!hideNav && (
        <div className="sticky bottom-0 z-40">
          <TabBar unreadSwaps={unread} />
        </div>
      )}
    </div>
  )
}
