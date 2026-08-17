import type { IconName } from '@/components/ui/icon'

/** One destination list for both shells. Same four, same order, on desktop and
 *  mobile - so muscle memory survives the move to the native app.
 *
 *  Activity is NOT a destination any more: it is a tab inside Swaps.
 */
export interface Destination {
  id: 'hunt' | 'browse' | 'swaps' | 'profile'
  label: string
  path: string
  icon: IconName
}

export const DESTINATIONS: Destination[] = [
  { id: 'hunt', label: 'Hunt', path: '/hunt', icon: 'Compass' },
  { id: 'browse', label: 'Browse', path: '/browse', icon: 'Search' },
  { id: 'swaps', label: 'Swaps', path: '/swaps', icon: 'MessageCircle' },
  { id: 'profile', label: 'Profile', path: '/profile', icon: 'User' },
]

/** Add is the brass centre action on mobile and a button in the nav on desktop. */
export const ADD_DESTINATION = { label: 'List a find', path: '/add', icon: 'Plus' as IconName }
