import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { EmptyState } from '@/components/EmptyState'
import { MatchMoment } from '@/components/deck/MatchMoment'
import { AppShell } from '@/components/shell/AppShell'
import { TopBarContext } from '@/components/shell/TopBarContext'
import { T, useT } from '@/i18n/T'
import { track } from '@/lib/analytics'
import { barterErrorKey, respondToBarterOffer } from '@/lib/barter'
import { useIsDesktop, useTwoPane } from '@/lib/platform'
import type { MatchInfo } from '@/screens/Hunt/useHunt'
import { ChatPane } from './ChatPane'
import { OfferPane } from './OfferPane'
import { SwapsList } from './SwapsList'
import { useSwapsDesk, type OfferItem } from './useSwapsDesk'

/** Swaps & offers -- V6 step 4.
 *
 *  One screen replaces three (the inbox, the chat page and /offers). Desktop
 *  and a landscape tablet: the grouped list on the left, the picked row in
 *  full on the right, and the page itself never scrolls. A phone: the list,
 *  and a row opens full screen with a back arrow.
 *
 *  /matches/:swapId and /matches?offer=<id> are the selection, so a push
 *  notification or a shared link lands on the right row.
 */
export default function Swaps() {
  const d = useSwapsDesk()
  const { t } = useT()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const two = useTwoPane()
  const desktop = useIsDesktop()
  const [errorKey, setErrorKey] = React.useState<string | null>(null)
  const [match, setMatch] = React.useState<MatchInfo | null>(null)

  // Two panes always show something: the first row, until one is picked.
  const first = d.all[0]
  React.useEffect(() => {
    if (two && !d.selected && !d.isLoading && first && !d.missing) d.select(first, true)
  }, [two, d.selected, d.isLoading, first, d.missing, d])

  React.useEffect(() => setErrorKey(null), [d.selected?.id])

  const respond = useMutation({
    mutationFn: async ({ o, accept }: { o: OfferItem; accept: boolean }) => {
      const { data, error } = await respondToBarterOffer(o.id, accept)
      if (error) throw error
      return data as { id: string } | null
    },
    onMutate: () => setErrorKey(null),
    onSuccess: (m, { o, accept }) => {
      track(accept ? 'offer_accepted' : 'offer_declined')
      void qc.invalidateQueries({ queryKey: ['barter'] })
      if (accept && m?.id) {
        // "It's a bartefy!" opens wherever a match is made (2026-09-29).
        track('match_made', { via: 'accept' })
        setMatch({
          matchId: String(m.id),
          owner: o.who.name,
          mine: { title: o.mine.title, photo: o.mine.photo },
          theirs: { title: o.theirs.title, photo: o.theirs.photo },
        })
      } else {
        d.select(null, true)
      }
    },
    onError: (e: { code?: string }) => setErrorKey(barterErrorKey(e)),
  })

  const detail = (onBack?: () => void) => {
    const s = d.selected
    if (!s) return null
    return s.kind === 'offer' ? (
      <OfferPane
        o={s}
        wide={desktop}
        busy={respond.isPending}
        errorKey={errorKey}
        onBack={onBack}
        onAccept={() => respond.mutate({ o: s, accept: true })}
        onDecline={() => respond.mutate({ o: s, accept: false })}
      />
    ) : (
      <ChatPane key={s.id} s={s} onBack={onBack} />
    )
  }

  const empty = !d.isLoading && d.all.length === 0

  return (
    <AppShell>
      <TopBarContext>
        <T as="h1" k="shell.nav_swaps" className="shrink-0 font-display text-headline-md text-foreground" />
        <span className="whitespace-nowrap font-body text-body-sm text-muted-foreground">
          {t('desk.counts', { offers: d.counts.offers, agreed: d.counts.agreed })}
        </span>
      </TopBarContext>

      {empty ? (
        <div className="flex h-full items-center justify-center px-6">
          <EmptyState title="swaps.emptyTitle" body="swaps.emptyBody" actionLabel="swaps.goHunt" onAction={() => navigate('/discover')} />
        </div>
      ) : two ? (
        <div className="flex h-full min-h-0 gap-6 px-6 py-4 lg:px-8">
          <div className="w-[360px] shrink-0 overflow-y-auto rounded-card bg-card p-2 ring-1 ring-input xl:w-[400px]">
            <SwapsList groups={d.groups} selected={d.selected} onPick={(i) => d.select(i)} />
          </div>
          <div className="min-w-0 flex-1 overflow-hidden rounded-card bg-card ring-1 ring-input">
            {d.missing ? <Missing /> : detail()}
          </div>
        </div>
      ) : (
        <>
          <div className="px-4 pb-6 pt-3">
            <div className="mb-2 flex items-baseline gap-2">
              <T as="h1" k="shell.nav_swaps" className="font-display text-[24px] font-bold leading-8 text-foreground" />
              <span className="font-body text-body-sm text-muted-foreground">{t('desk.agreedN', { n: d.counts.agreed })}</span>
            </div>
            <SwapsList groups={d.groups} selected={null} onPick={(i) => d.select(i)} carousel />
          </div>
          {(d.selected || d.missing) && (
            // Full screen over the tab bar: a thread is somewhere you are,
            // not a sheet over a list.
            <div className="fixed inset-0 z-50 flex flex-col bg-card">
              {d.missing ? <Missing onBack={() => d.select(null, true)} /> : detail(() => d.select(null))}
            </div>
          )}
        </>
      )}

      <MatchMoment
        match={match}
        onHello={(id) => {
          setMatch(null)
          navigate('/matches/' + id, { replace: true })
        }}
        onClose={() => {
          setMatch(null)
          d.select(null, true)
        }}
      />
    </AppShell>
  )
}

/** A link to something that is not here any more. Said plainly. */
function Missing({ onBack }: { onBack?: () => void }) {
  const navigate = useNavigate()
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <T as="p" k="desk.missingTitle" className="font-display text-headline-sm text-foreground" />
      <T as="p" k="desk.missingBody" className="max-w-sm font-body text-body-sm text-muted-foreground" />
      <button type="button" onClick={onBack ?? (() => navigate('/matches', { replace: true }))} className="mt-2 font-body text-label-lg text-primary hover:underline">
        <T as="span" k="desk.backToList" />
      </button>
    </div>
  )
}
