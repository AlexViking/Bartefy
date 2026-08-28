import { AppShell } from '@/components/shell/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { NextStep } from '@/components/guidance/NextStep'
import { T } from '@/i18n/T'
import { InboxTabs } from './Tabs'
import { SwapList } from './SwapList'
import { useSwapsInbox } from './useSwapsInbox'

/** Swaps, desktop shape: the list stays put on the left while the thread opens
 *  on the right. Moving between conversations should not feel like navigating
 *  away and coming back.
 *
 *  The right pane is a prompt until a row is picked; picking one routes to
 *  /swaps/:id, where Chat.desktop renders its own split.
 */
export default function SwapsInboxDesktop() {
  const s = useSwapsInbox()

  return (
    <AppShell>
      <div className="grid h-[calc(100dvh-68px)] grid-cols-[minmax(300px,360px)_1fr]">
        <section className="flex flex-col overflow-y-auto border-r border-border/[0.14] p-5">
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
        </section>

        <section className="flex items-center justify-center p-8">
          <EmptyState
            title="swaps.emptyTitle"
            body="swaps.emptyBody"
            actionLabel="swaps.goHunt"
            onAction={s.goHunt}
          />
        </section>
      </div>
    </AppShell>
  )
}
