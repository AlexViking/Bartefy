import { createScreen } from '@/lib/platform'

/** T2 — list + detail. Matches and Activity merged into one inbox. */
export const SwapsInbox = createScreen({
  mobile: () => import('./SwapsInbox.mobile'),
  desktop: () => import('./SwapsInbox.desktop'),
})
