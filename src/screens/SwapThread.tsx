import { Chat } from '@/screens/Chat'
import { SwapsInbox } from '@/screens/SwapsInbox'
import { useIsDesktop } from '@/lib/platform'

/** /swaps/:swapId — one route, two genuinely different shapes.
 *
 *  On a phone the thread is the whole screen: there is no room for the list
 *  beside it, and going back is a real navigation.
 *
 *  On a desktop the same URL renders the inbox, which mounts the thread in its
 *  right-hand pane. The list stays put while you move between conversations,
 *  which is what the "Pick a swap" prompt promises. Opening a swap used to
 *  swap the whole page for a different two-column layout, so the list you
 *  clicked from vanished underneath you.
 *
 *  Both branches read :swapId from the route, so a deep link and a refresh
 *  land in the right place on either platform.
 */
export default function SwapThread() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <SwapsInbox /> : <Chat />
}
