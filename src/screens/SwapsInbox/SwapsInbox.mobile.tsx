import { AppShell } from '@/components/shell/AppShell'
import { NextStep } from '@/components/guidance/NextStep'
import { T } from '@/i18n/T'
import { InboxTabs } from './Tabs'
import { SwapList } from './SwapList'
import { useSwapsInbox } from './useSwapsInbox'

/** Swaps, phone shape: a list. Tapping a row goes to the thread as its own
 *  screen, because a phone cannot show a list and a conversation at once.
 */
export default function SwapsInboxMobile() {
  const s = useSwapsInbox()

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[720px] px-4 py-5">
        <T as="h1" k="swaps.title" className="mb-4 font-display text-h2 text-foreground" />
        <InboxTabs tab={s.tab} onChange={s.setTab} className="mb-4" />

        <SwapList
          rows={s.rows}
          isLoading={s.isLoading}
          tab={s.tab}
          onOpen={s.openSwap}
          onGoHunt={s.goHunt}
        />

        {!s.isLoading && s.active.length === 0 && s.tab === 'active' && (
          <NextStep
            id="swaps-none-yet"
            body="stuck.noSwipes"
            action="swaps.goHunt"
            onAction={s.goHunt}
            className="mt-4"
          />
        )}
      </div>
    </AppShell>
  )
}
