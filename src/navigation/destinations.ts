import type { IconName } from '@/components/ui/icon'

/** The V6 navigation, one list for every platform.
 *
 *  Side nav (desktop), rail (tablet, or desktop collapsed) and the phone tab
 *  bar all read from here, so muscle memory survives the move between them.
 *  Standing decisions (Alex, 2026-09-26/27/29):
 *    - everything that takes you somewhere is in the side nav; the top bar
 *      keeps brand + live status + account;
 *    - Profile, Settings, language and theme live in the account menu on
 *      desktop and the "You" sheet on a phone -- never in two places;
 *    - no search, anywhere.
 */
export interface Destination {
  id: 'discover' | 'swaps' | 'finds' | 'admirers' | 'points'
  /** i18n key for the side nav row. */
  label: string
  /** i18n key for the phone tab, where there is room for one word. */
  tab?: string
  path: string
  icon: IconName
  /** Which count feeds the badge under the label. */
  badge?: 'swaps' | 'finds' | 'admirers'
  /** Other paths that light this row up (a thread is inside Swaps). */
  also?: string[]
}

export const DESTINATIONS: Destination[] = [
  { id: 'discover', label: 'shell.nav_discover', tab: 'shell.tab_discover', path: '/discover', icon: 'GalleryVerticalEnd' },
  { id: 'swaps', label: 'shell.nav_swaps', tab: 'shell.tab_swaps', path: '/matches', icon: 'Handshake', badge: 'swaps', also: ['/offers'] },
  { id: 'finds', label: 'shell.nav_finds', tab: 'shell.tab_finds', path: '/items', icon: 'Package', badge: 'finds' },
  // Who put a find on the table for yours, for free. Collector only.
  { id: 'admirers', label: 'shell.nav_admirers', path: '/admirers', icon: 'Heart', badge: 'admirers' },
  { id: 'points', label: 'shell.nav_points', path: '/points', icon: 'Coins', also: ['/membership', '/invite'] },
]

/** Phone tab bar: Discover · Swaps · ＋Add · Finds · You. Admirers and Points
 *  are rows in the You sheet -- a thumb reaches five targets, not seven. */
export const TAB_DESTINATIONS = DESTINATIONS.filter((d) => d.tab)

export const ADD_PATH = '/add'

/** Staff tools, in the account menu and the You sheet. Hidden, not disabled,
 *  for everyone else. */
export const STAFF_DESTINATIONS = [
  { id: 'moderation', label: 'nav.moderation', path: '/admin/reports', icon: 'ShieldAlert' as IconName },
  { id: 'analytics', label: 'nav.analytics', path: '/admin/analytics', icon: 'ChartColumn' as IconName },
]

export function isActive(d: Pick<Destination, 'path' | 'also'>, pathname: string) {
  return [d.path, ...(d.also ?? [])].some((p) => pathname === p || pathname.startsWith(p + '/'))
}
