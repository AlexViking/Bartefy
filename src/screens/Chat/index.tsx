import { createScreen } from '@/lib/platform'

/** One open conversation, by platform.
 *
 *  On a phone the thread is the whole screen. On desktop it is the right-hand
 *  pane of the swaps inbox, so the route mounts the inbox itself and lets it
 *  read :swapId -- that is what keeps the list in place while you read a
 *  thread, instead of navigating away from it and back.
 */
export const SwapThread = createScreen({
  mobile: () => import('./MatchThread'),
  desktop: () => import('@/screens/SwapsInbox/SwapsInbox.desktop'),
})
