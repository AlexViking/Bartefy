import * as React from 'react'
import { useNavigate } from 'react-router'

import { EmptyState } from '@/components/EmptyState'
import { MatchMoment } from '@/components/deck/MatchMoment'
import { AppShell } from '@/components/shell/AppShell'
import { TopBarContext } from '@/components/shell/TopBarContext'
import { cap } from '@/components/shell/useShellData'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { UserAvatar } from '@/components/ui/user-avatar'
import { T, useT } from '@/i18n/T'
import { useIsDesktop } from '@/lib/platform'
import { cn } from '@/lib/utils'
import type { MatchInfo } from '@/screens/Hunt/useHunt'
import { useAgo } from '@/screens/Swaps/SwapsList'
import { useAdmirers, type Admirer } from './useAdmirers'

/** Admirers -- who put a find on the table for yours, quietly, for free.
 *
 *  Alex, 2026-09-29: a page to see who liked my finds; paid; cards blurred
 *  until unlocked; badges like the other pages, never past 99+. Collector
 *  only (no points unlock of its own -- Collector is what points buy).
 */
export default function Admirers() {
  const a = useAdmirers()
  const { t } = useT()
  const navigate = useNavigate()
  const desktop = useIsDesktop()
  const [filter, setFilter] = React.useState('all')
  const [buyOpen, setBuyOpen] = React.useState(false)
  const [match, setMatch] = React.useState<MatchInfo | null>(null)

  // Chips: one per find of mine that has admirers.
  const perFind = a.items.reduce<Record<string, { title: string; photo?: string; n: number }>>((acc, x) => {
    const k = x.mine.id
    acc[k] = acc[k] ?? { title: x.mine.title, photo: x.mine.photo, n: 0 }
    acc[k].n += 1
    return acc
  }, {})
  const shown = filter === 'all' ? a.items : a.items.filter((x) => x.mine.id === filter)
  const total = a.items.length

  const onSwap = async (x: Admirer) => {
    const m = await a.swap(x).catch(() => null)
    if (m?.id) {
      setMatch({
        matchId: String(m.id),
        owner: x.who?.name ?? '',
        mine: { title: x.mine.title, photo: x.mine.photo },
        theirs: { title: x.theirs?.title ?? '', photo: x.theirs?.photo },
      })
    }
  }

  return (
    <AppShell>
      <TopBarContext>
        <T as="h1" k="admirers.title" className="shrink-0 font-display text-headline-md text-foreground" />
        {total > 0 && <Count n={total} />}
      </TopBarContext>

      <div className={cn('flex min-h-full flex-col', desktop ? 'px-6 py-4 lg:px-8' : 'px-4 pb-4 pt-3')}>
        <div className={cn('flex min-h-0 flex-1 flex-col', desktop && 'overflow-hidden rounded-card bg-card ring-1 ring-input')}>
          <div className={cn('flex flex-col gap-3', desktop ? 'border-b border-input px-5 pb-4 pt-5' : 'pb-3')}>
            {!desktop && (
              <div className="flex items-center gap-2">
                <T as="h1" k="admirers.titleShort" className="font-display text-[24px] font-bold leading-8 text-foreground" />
                {total > 0 && <Count n={total} />}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="min-w-0 flex-1 font-body text-body-md text-muted-foreground">
                {t('admirers.intro')}{' '}
                {a.week > 0 && <b className="text-foreground">{t('admirers.newWeek', { n: a.week })}</b>}
              </p>
              {a.unlocked && (
                <span className="inline-flex h-7 items-center gap-1 rounded-pill bg-sun px-2.5 font-body text-label-md text-ink">
                  <Icon name="Star" size={14} filled />
                  {t(`shell.tier_${a.shell.tier}`)}
                </span>
              )}
            </div>
            {Object.keys(perFind).length > 1 && (
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
                <Chip on={filter === 'all'} onClick={() => setFilter('all')} label={t('admirers.allFinds')} n={total} />
                {Object.entries(perFind).map(([id, f]) => (
                  <Chip key={id} on={filter === id} onClick={() => setFilter(id)} label={f.title} n={f.n} photo={f.photo} />
                ))}
              </div>
            )}
          </div>

          <div className={cn('min-h-0 flex-1', desktop && 'overflow-y-auto p-5')}>
            {a.isLoading ? (
              <T as="p" k="common.loading" className="font-body text-body-sm text-muted-foreground" />
            ) : a.error ? (
              <T as="p" k="admirers.error" className="rounded-card bg-coral px-3 py-2 font-body text-body-sm text-ink" />
            ) : total === 0 ? (
              <div className="py-10">
                <EmptyState title="admirers.emptyTitle" body="admirers.emptyBody" actionLabel="shell.addFind" onAction={() => navigate('/add')} />
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 md:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] md:gap-4">
                {shown.map((x) => (
                  <Card key={x.id} x={x} unlocked={a.unlocked} busy={a.busyId === x.id} onPass={() => a.pass(x)} onSwap={() => void onSwap(x)} />
                ))}
              </div>
            )}
            {a.answerError && (
              <p role="alert" className="mt-3 rounded-card bg-coral px-3 py-2 font-body text-body-sm text-ink">{t(a.answerError)}</p>
            )}
          </div>

          {!a.unlocked && total > 0 && (
            <div
              className={cn(
                'flex shrink-0 flex-wrap items-center gap-x-4 gap-y-3 border-t border-input bg-card px-5 py-4',
                !desktop && 'sticky bottom-0 -mx-4 mt-4',
              )}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-card bg-sun/70 text-ink">
                <Icon name="Heart" size={22} filled />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-body text-[16px] font-bold text-foreground">{t('admirers.lockTitle', { n: cap(total) })}</p>
                <T as="p" k="admirers.lockBody" className="font-body text-body-sm text-muted-foreground" />
              </div>
              <Button size="lg" onClick={() => setBuyOpen(true)} className={desktop ? '' : 'w-full'}>
                <Icon name="Star" size={18} filled />
                {t('admirers.goCollector', { n: a.price })}
              </Button>
            </div>
          )}
        </div>
      </div>

      <BuySheet
        open={buyOpen}
        onOpenChange={setBuyOpen}
        points={a.shell.points}
        price={a.price}
        busy={a.buying}
        errorKey={a.buyError}
        onBuy={async () => {
          await a.goCollector().then(() => setBuyOpen(false)).catch(() => {})
        }}
        onEarn={() => navigate('/points')}
      />

      <MatchMoment
        match={match}
        onHello={(id) => {
          setMatch(null)
          navigate('/matches/' + id)
        }}
        onClose={() => setMatch(null)}
      />
    </AppShell>
  )
}

function Count({ n }: { n: number }) {
  return (
    <span className="inline-flex h-6 items-center rounded-pill bg-coral px-2 font-display text-[12px] font-bold tabular-nums text-ink">{cap(n)}</span>
  )
}

function Chip({ on, onClick, label, n, photo }: { on: boolean; onClick: () => void; label: string; n: number; photo?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-pill bg-card pr-3 font-body text-label-md text-muted-foreground ring-1 ring-inset ring-input aria-pressed:bg-ink aria-pressed:text-paper aria-pressed:ring-ink"
      style={{ paddingLeft: photo ? 4 : 12 }}
    >
      {photo && <img alt="" className="size-7 rounded-pill object-cover" src={photo} />}
      {/* A find's title is user data. */}
      <span className="max-w-[140px] truncate">{label}</span>
      <span className="opacity-70">{n}</span>
    </button>
  )
}

function Card({ x, unlocked, busy, onPass, onSwap }: { x: Admirer; unlocked: boolean; busy: boolean; onPass: () => void; onSwap: () => void }) {
  const { t } = useT()
  const ago = useAgo()
  return (
    <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-input">
      <div className="relative aspect-[4/3] overflow-hidden">
        {unlocked && x.theirs?.photo ? (
          <img alt="" className="size-full object-cover" src={x.theirs.photo} />
        ) : (
          // Locked: nothing of theirs was fetched, so there is nothing to blur
          // -- a soft wash in the brand's neutrals stands in.
          <span className="block size-full bg-gradient-to-br from-stone via-paper to-mint/60" />
        )}
        {x.fresh && (
          <span className="absolute left-2.5 top-2.5 inline-flex h-6 items-center rounded-pill bg-coral px-2 text-[11px] font-bold text-ink">
            <T as="span" k="admirers.new" />
          </span>
        )}
        {!unlocked && (
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-12 place-items-center rounded-pill bg-white/90 text-ink shadow">
              <Icon name="Lock" size={22} />
            </span>
          </span>
        )}
        <span className="absolute bottom-2.5 right-2.5 flex h-9 max-w-[calc(100%-20px)] items-center gap-1.5 whitespace-nowrap rounded-pill bg-white/95 pl-1 pr-2.5 text-[12px] font-semibold text-ink shadow">
          {x.mine.photo ? <img alt="" className="size-7 shrink-0 rounded-pill object-cover" src={x.mine.photo} /> : <span className="size-7 shrink-0 rounded-pill bg-stone" />}
          <span className="truncate">{t('admirers.forYour', { title: x.mine.title })}</span>
        </span>
      </div>
      <div className="flex flex-col gap-2.5 p-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {unlocked ? (
            <UserAvatar name={x.who?.name || '?'} size="sm" className="size-9" />
          ) : (
            <span className="size-9 shrink-0 rounded-pill bg-secondary" />
          )}
          <div className="min-w-0 flex-1">
            {unlocked ? (
              <>
                {/* A name and a title are user data. */}
                <p className="truncate font-body text-label-lg text-foreground">{x.who?.name || t('desk.someone')}</p>
                <p className="truncate font-body text-[12px] text-muted-foreground">{x.theirs?.title}</p>
              </>
            ) : (
              <>
                <span className="block h-3 w-24 rounded-pill bg-secondary" />
                <span className="mt-1.5 block h-2.5 w-32 rounded-pill bg-secondary/70" />
              </>
            )}
          </div>
          <span className="shrink-0 font-body text-[12px] text-muted-foreground">{ago(x.createdAt)}</span>
        </div>
        {unlocked && (
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
            <Button variant="ghost" onClick={onPass} disabled={busy} className="h-10 min-h-10 px-3">
              <T as="span" k="deck.pass" />
            </Button>
            <Button onClick={onSwap} disabled={busy} className="h-10 min-h-10 min-w-0 px-3">
              <Icon name="Handshake" size={18} />
              <T as="span" k="admirers.swap" />
            </Button>
          </div>
        )}
      </div>
    </article>
  )
}

/** Collector for 30 days, paid in points -- the same purchase as Points &
 *  Tiers (spend_points_on_tier). Not enough points says how many more, and
 *  where they come from, instead of a button that cannot work. */
function BuySheet({
  open,
  onOpenChange,
  points,
  price,
  busy,
  errorKey,
  onBuy,
  onEarn,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  points: number
  price: number
  busy: boolean
  errorKey: string | null
  onBuy: () => void
  onEarn: () => void
}) {
  const { t } = useT()
  const enough = points >= price
  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="admirers.buyTitle"
      description="admirers.buyBody"
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <T as="span" k="common.notYet" />
          </Button>
          {enough ? (
            <Button onClick={onBuy} disabled={busy}>
              {t('admirers.spend', { n: price })}
            </Button>
          ) : (
            <Button onClick={onEarn}>
              <T as="span" k="admirers.earn" />
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <dl className="rounded-card bg-background px-4 py-3 font-body text-body-md">
          <div className="flex justify-between py-1">
            <T as="dt" k="admirers.yourPoints" className="text-muted-foreground" />
            <dd className="font-bold tabular-nums text-foreground">{points}</dd>
          </div>
          <div className="flex justify-between py-1">
            <T as="dt" k="admirers.collector30" className="text-muted-foreground" />
            <dd className="font-bold tabular-nums text-foreground">− {price}</dd>
          </div>
          <div className="mt-1 flex justify-between border-t border-input pt-2">
            <T as="dt" k={enough ? 'admirers.leftAfter' : 'admirers.stillNeed'} className="text-muted-foreground" />
            <dd className="font-bold tabular-nums text-foreground">{enough ? points - price : price - points}</dd>
          </div>
        </dl>
        {errorKey && <p role="alert" className="rounded-card bg-coral px-3 py-2 font-body text-body-sm text-ink">{t(errorKey)}</p>}
      </div>
    </ResponsiveSheet>
  )
}
