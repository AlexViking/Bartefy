import { AppShell } from '@/components/shell/AppShell'
import { MatchThreadPane } from './MatchThreadPane'

/** A barter thread as a whole page.
 *
 *  This is the phone's shape, and the portrait tablet's: the conversation
 *  fills the screen and carries its own way back. On desktop the same pane is
 *  mounted by SwapsInbox.desktop beside the swap list instead, so opening a
 *  conversation there does not throw the list away.
 */
export default function MatchThread() {
  return (
    <AppShell>
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[720px] flex-col">
        <MatchThreadPane />
      </div>
    </AppShell>
  )
}
