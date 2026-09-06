import type { IconName } from '@/components/ui/icon'

/** One destination list for both shells, so muscle memory survives the move to
 *  the native app.
 *
 *  Three destinations plus the brass Add, and the Add sits in the middle
 *  because three-plus-one is an even four. That is the whole reason the bar
 *  reads straight now: the earlier list had Discover, Matches and Profile on
 *  the bar with Add appended fourth, and an odd number of destinations cannot
 *  put a centre action in the centre.
 *
 *  Profile came off the bar to make room. It is not gone -- it is behind the
 *  avatar, which is where every app of this shape puts it, and the avatar is
 *  in the topbar on desktop and at the head of the menu on the phone.
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
  /** Shown in the phone tab bar, and above the divider in the desktop rail. */
  onTabBar?: boolean
}

export const DESTINATIONS: Destination[] = [
  { id: 'discover', label: 'nav.discover', path: '/discover', icon: 'Layers', onTabBar: true },
  { id: 'matches', label: 'nav.matches', path: '/matches', icon: 'Heart', badge: 'unread', onTabBar: true },
  // Your own listings. /items used to be Browse -- other people's finds --
  // which made the path mean the opposite of its name. Browse is gone with
  // search and filters, so the path is back to meaning what it says.
  { id: 'items', label: 'nav.items', path: '/items', icon: 'Package', onTabBar: true },
  // Below the divider in the rail; in the menu on the phone. Not tab bar rows:
  // a thumb reaches about four targets across the bottom of a phone.
  { id: 'profile', label: 'nav.profile', path: '/profile', icon: 'User' },
  { id: 'settings', label: 'nav.settings', path: '/settings', icon: 'Settings' },
  { id: 'moderation', label: 'nav.moderation', path: '/admin/reports', icon: 'ShieldAlert', staffOnly: true },
]

/** Discover, Matches, My Items -- and then Add, drawn as the third of four
 *  slots by TabBar so it lands in the centre. */
export const TAB_DESTINATIONS = DESTINATIONS.filter((d) => d.onTabBar)

/** Everything that is not a tab bar row: Profile, Settings, and Moderation for
 *  staff. The rail shows these under a divider; the phone menu lists them. */
export const MENU_DESTINATIONS = DESTINATIONS.filter((d) => !d.onTabBar)

/** Add is the brass centre action on mobile and a pinned button in the rail on
 *  desktop -- where, until now, there was no way to list a find at all. */
export const ADD_DESTINATION = { label: 'nav.add', path: '/add', icon: 'Plus' as IconName }
