import * as React from 'react'
import { DesktopNav } from './DesktopNav'
import { TabBar } from './TabBar'

/** One shell for every signed-in screen: top nav above 900px, tab bar below.
 *  Screens never render navigation themselves.
 */
export function AppShell({
  children,
  hideTabBar = false,
}: {
  children: React.ReactNode
  hideTabBar?: boolean
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <DesktopNav />
      <main className="flex-1">{children}</main>
      {!hideTabBar && (
        <div className="sticky bottom-0 lg:hidden">
          <TabBar />
        </div>
      )}
    </div>
  )
}
