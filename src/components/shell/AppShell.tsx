import * as React from 'react'

import { TabBar } from './TabBar'
import { TopNav } from './TopNav'
import { useIsDesktop } from '@/lib/platform'

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

  if (isDesktop) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        {!hideNav && <TopNav />}
        <main className="flex-1">{children}</main>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <main className="flex-1">{children}</main>
      {!hideNav && (
        <div className="sticky bottom-0 z-40">
          <TabBar />
        </div>
      )}
    </div>
  )
}
