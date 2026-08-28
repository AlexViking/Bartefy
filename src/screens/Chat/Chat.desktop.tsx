import { AppShell } from '@/components/shell/AppShell'
import { ChatPane } from './ChatPane'

/** Chat, desktop shape: the thread on the left, the swap it is about on the
 *  right. The context that a phone hides behind a menu is simply visible —
 *  which matters, because the whole conversation is about those two objects.
 *
 *  Reached by a deep link or a refresh on /swaps/:swapId. Opening a swap from
 *  the inbox does not come here — SwapsInbox.desktop mounts the same ChatPane
 *  beside its list, so the list never disappears.
 */
export default function ChatDesktop() {
  return (
    <AppShell>
      <div className="h-[calc(100dvh-68px)]">
        <ChatPane />
      </div>
    </AppShell>
  )
}
