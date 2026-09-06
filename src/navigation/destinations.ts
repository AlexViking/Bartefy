import type { IconName } from '@/components/ui/icon'

/** One destination list for both shells, so muscle memory survives the move to
 *  the native app.
 *
 *  The names come from V5 and are deliberately plainer than the old ones.
 *  "Hunt" and "Browse" were two words for looking at other people's things,
 *  and nobody could say which was which; "Discover" is the deck, and searching
 *  moved into the topbar where a search belongs. "Swaps" became "Matches",
 *  which is what the row actually is before anything has been swapped.
 */
export interface Destination {
  id: 'discover' | 'matches' | 'items' | 'profile' | 'settings' | 'moderation'
  /** i18n key. */
  label: string
  path: string
  icon: IconName
  /** Which badge count feeds this row, if any. */
  badge?: 'offers' | 'unread'
  /** Staff-only rows are hidden entirely rather than shown disabled. */
  staffOnly?: boolean
  /** Shown in the phone tab bar. Five is the most a thumb reach can hold, so
   *  Settings and Moderation live in the sidebar and the Profile screen. */
  onTabBar?: boolean
}

export const DESTINATIONS: Destination[] = [
  { id: 'discover', label: 'nav.discover', path: '/hunt', icon: 'Layers', onTabBar: true },
  { id: 'matches', label: 'nav.matches', path: '/swaps', icon: 'Heart', badge: 'unread', onTabBar: true },
  { id: 'items', label: 'nav.items', path: '/browse', icon: 'Package', onTabBar: true },
  { id: 'profile', label: 'nav.profile', path: '/profile', icon: 'User', onTabBar: true },
  { id: 'settings', label: 'nav.settings', path: '/settings', icon: 'Settings' },
  { id: 'moderation', label: 'nav.moderation', path: '/admin/reports', icon: 'ShieldAlert', staffOnly: true },
]

/** The tab bar's four, plus the brass Add in the middle. */
export const TAB_DESTINATIONS = DESTINATIONS.filter((d) => d.onTabBar)

/** Add is the brass centre action on mobile and a button in the nav on desktop. */
export const ADD_DESTINATION = { label: 'nav.add', path: '/add', icon: 'Plus' as IconName }
