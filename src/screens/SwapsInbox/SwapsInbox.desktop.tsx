import { useParams } from 'react-router'

import { useTwoPane } from '@/lib/platform'
import { cn } from '@/lib/utils'

import { AppShell } from '@/components/shell/AppShell'
import { PAGE_PX } from '@/components/shell/PageBody'
import { PageHeader } from '@/components/shell/PageHeader'
import { MatchThreadPane } from '@/screens/Chat/MatchThreadPane'
import { EmptyState } from '@/components/EmptyState'
import { NextStep } from '@/components/guidance/NextStep'
import { InboxTabs } from './Tabs'
import { OffersLink } from './OffersLink'
import { SwapList } from './SwapList'
import { useSwapsInbox } from './useSwapsInbox'

/** Swaps, desktop shape: the list stays put on the left while the thread opens
 *  on the right. Moving between conversations should not feel like navigating
 *  away and coming back.
 *
 *  The right pane is a prompt until a row is picked. Picking one routes to
 *  /swaps/:id, which renders this same screen with the thread mounted in that
 *  pane — so the list stays exactly where it was. It used to hand off to a
 *  separate full-page Chat, which threw the list away and rebuilt a different
 *  two-column layout underneath the user.
 */
export default function SwapsInboxDesktop() {
  const s = useSwapsInbox()
  const { swapId } = useParams<{ swapId: string }>()

  /** The wireframe's tablet note, honoured here rather than in a third file:
   *  "build the two-pane once and show/hide the list based on width." Both
   *  panes at once on desktop and on a landscape tablet; in portrait the
   *  screen behaves like mobile -- the list, and then the chat as a full view
   *  once a row is picked. */
  const twoPane = useTwoPane()
  const showList = twoPane || !swapId
  const showPane = twoPane || !!swapId

  return (
    <AppShell>
      <div className="flex h-[calc(100dvh-68px)] flex-col">
        {/* The header sits ABOVE the two panes, not inside the list column.
        
            It used to be drawn inside that 360px column, so "Matches" started
            ~270px left of where "My items" starts -- the two were never on the
            same line however consistent the PageHeader screens were among
            themselves. Same component, same padding as PageBody, so the title
            now lands at the same x as every other destination. */}
        <div
          className={cn(
            'grid min-h-0 flex-1',
            twoPane ? 'grid-cols-[minmax(320px,380px)_1fr]' : 'grid-cols-1',
          )}
        >
        {showList && (
        <section
          className={cn(
            // Same padding scale as PageBody. This column is the page's left
            // edge, so it has to breathe like one.
            'flex min-h-0 flex-col overflow-y-auto pb-5 pt-4',
            PAGE_PX,
            twoPane && 'border-r border-border/[0.14]',
          )}
        >
          {/* The header belongs to the LIST, not to the whole pane.
          
              Hoisting it above both columns lined its x up with the other
              destinations and made everything else worse: the tab underline
              ran 800px past the list it controls, and the title floated over
              the column divider with the thread beside it. Tabs that switch a
              360px list must not be as wide as the screen.
              
              So it lives here again, and the alignment problem is solved the
              other way -- by matching this column's padding, which is what
              PageBody uses too. */}
          <PageHeader
            title="swaps.title"
            tabs={<InboxTabs tab={s.tab} onChange={s.setTab} />}
          />
          <OffersLink className="mb-4" />

          <SwapList
            rows={s.rows}
            isLoading={s.isLoading}
            tab={s.tab}
            onOpen={s.openSwap}
            onGoHunt={s.goHunt}
          onArchive={s.archive}
            selectedId={swapId}
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
        )}

        {/* With a swap picked the pane is the conversation itself. Keyed by id
            so switching rows remounts the thread rather than leaking the
            previous one's state into it. */}
        {showPane && (swapId ? (
          <section className="min-w-0 overflow-hidden">
            <MatchThreadPane key={swapId} />
          </section>
        ) : (
          /* The pane is a prompt, not a verdict: telling someone "no swaps yet"
             while three of them sit in the list beside it is simply wrong. */
          <section className="flex items-center justify-center p-8">
            {s.rows.length > 0 ? (
              <EmptyState title="swaps.pickTitle" body="swaps.pickBody" />
            ) : (
              <EmptyState
                title="swaps.emptyTitle"
                body="swaps.emptyBody"
                actionLabel="swaps.goHunt"
                onAction={s.goHunt}
              />
            )}
          </section>
        ))}
        </div>
      </div>
    </AppShell>
  )
}
