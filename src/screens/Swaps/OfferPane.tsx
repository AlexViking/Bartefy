import * as React from 'react'

import { FindDetailsSheet } from '@/components/FindDetails'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { UserAvatar } from '@/components/ui/user-avatar'
import { useTimeLeft, formatLeft } from '@/components/offer/ExpiryCountdown'
import { T, useT } from '@/i18n/T'
import { categoryLabel, conditionAt } from '@/lib/taxonomy'
import { cn } from '@/lib/utils'
import { TimerPill } from './SwapsList'
import type { Find, OfferItem } from './useSwapsDesk'

/** One offer, in full (proposal B's right side).
 *
 *  Who, the deadline, what you give and what you get side by side, their
 *  note -- and the decision, pinned to the foot so the photos can never push
 *  it off screen. Your own offers show the same pair and wait. */
export function OfferPane({
  o,
  wide,
  busy,
  errorKey,
  onBack,
  onAccept,
  onDecline,
}: {
  o: OfferItem
  /** Photos side by side, or stacked (phone). */
  wide: boolean
  busy: boolean
  errorKey: string | null
  onBack?: () => void
  onAccept: () => void
  onDecline: () => void
}) {
  const { t } = useT()
  const first = o.who.name.split(' ')[0] || o.who.name
  const left = useTimeLeft(o.expiresAt)
  /** Which find is open in full -- look properly before saying yes. */
  const [details, setDetails] = React.useState<{ find: Find; label: string; mine: boolean } | null>(null)
  const meta = (f: Find) =>
    [f.category ? t(categoryLabel(f.category)) : null, f.condition ? t(conditionAt(f.condition).label) : null].filter(Boolean).join(' · ')

  const block = (label: string, tone: string, f: Find, sub: string) => (
    <figure className="flex min-w-0 flex-col gap-2">
      <p className={cn('font-body text-label-sm uppercase', tone)}>{label}</p>
      <button
        type="button"
        onClick={() => setDetails({ find: f, label, mine: f === o.mine })}
        className="group flex flex-col gap-2 rounded-card text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {f.photo ? (
          <img alt="" className="aspect-[4/3] max-h-[max(180px,calc(100dvh-520px))] w-full rounded-card object-cover transition group-hover:brightness-95" src={f.photo} />
        ) : (
          <span className="block aspect-[4/3] w-full rounded-card bg-secondary" />
        )}
        <figcaption>
          {/* A find's title is user data. */}
          <p className="font-display text-headline-sm leading-tight text-foreground">{f.title}</p>
          {sub && <p className="font-body text-body-sm text-muted-foreground">{sub}</p>}
          <span className="mt-1 inline-flex items-center gap-1 font-body text-label-md text-primary group-hover:underline">
            <T as="span" k="findDetails.open" />
            <Icon name="ArrowRight" size={14} />
          </span>
        </figcaption>
      </button>
    </figure>
  )

  return (
    <article className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-input px-6 py-5">
        {onBack && (
          <button type="button" onClick={onBack} aria-label={t('desk.back')} className="-ml-2 grid size-10 shrink-0 place-items-center rounded-pill hover:bg-secondary">
            <Icon name="ArrowLeft" size={22} />
          </button>
        )}
        <UserAvatar name={o.who.name} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-headline-sm text-foreground">
            {o.box === 'in' ? t('desk.offersYou', { name: o.who.name }) : t('desk.yourOfferTo', { name: o.who.name })}
          </p>
          <p className="font-body text-body-sm text-muted-foreground">{t('deck.swapsN', { n: o.who.swaps })}</p>
        </div>
        {o.box === 'in' ? (
          <span className="flex flex-col items-end gap-1">
            <TimerPill at={o.expiresAt} />
            <T as="span" k="desk.thenExpires" className="font-body text-[12px] text-muted-foreground" />
          </span>
        ) : (
          left != null && (
            <span className="font-body text-label-md text-muted-foreground">{t('desk.endsIn', { left: formatLeft(left, t) })}</span>
          )
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6">
        {wide ? (
          <div className="grid grid-cols-2 gap-6">
            {block(t('desk.youGive'), 'text-primary', o.mine, t('desk.yourFind'))}
            {block(t('desk.youGet'), 'text-foreground', o.theirs, meta(o.theirs))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {block(t('desk.youGet'), 'text-foreground', o.theirs, meta(o.theirs))}
            <button
              type="button"
              onClick={() => setDetails({ find: o.mine, label: t('desk.youGive'), mine: true })}
              className="flex items-center gap-3 rounded-card bg-background p-2 pr-3 text-left hover:bg-secondary"
            >
              {o.mine.photo ? <img alt="" className="size-14 rounded-lg object-cover" src={o.mine.photo} /> : <span className="size-14 rounded-lg bg-secondary" />}
              <div className="min-w-0 flex-1">
                <T as="p" k="desk.youGive" className="font-body text-label-sm uppercase text-primary" />
                <p className="truncate font-body text-label-lg text-foreground">{o.mine.title}</p>
              </div>
              <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
            </button>
          </div>
        )}
        {o.note && (
          <blockquote className="flex gap-3 rounded-card bg-background px-4 py-3">
            <Icon name="MessageSquareText" size={20} className="shrink-0 text-muted-foreground" />
            <div>
              <p className="font-body text-label-sm uppercase text-muted-foreground">{t('desk.says', { name: first })}</p>
              <p className="font-body text-body-md text-foreground">“{o.note}”</p>
            </div>
          </blockquote>
        )}
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-input px-6 py-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        {errorKey && (
          <p role="alert" className="w-full rounded-card bg-coral px-3 py-2 font-body text-body-sm text-ink">{t(errorKey)}</p>
        )}
        {o.box === 'in' ? (
          <>
            <p className="min-w-[200px] flex-1 font-body text-body-sm text-muted-foreground">{t('desk.acceptNote', { name: first })}</p>
            <div className={cn('flex gap-2', !wide && 'w-full')}>
              <Button variant="ghost" onClick={onDecline} disabled={busy} className={wide ? '' : 'flex-1'}>
                <T as="span" k="desk.decline" />
              </Button>
              <Button onClick={onAccept} disabled={busy} className={wide ? '' : 'flex-[2]'}>
                <Icon name="Handshake" size={18} />
                <T as="span" k="desk.accept" />
              </Button>
            </div>
          </>
        ) : (
          <p className="flex-1 font-body text-body-sm text-muted-foreground">
            {left != null ? t('desk.waitingFor', { name: first, left: formatLeft(left, t) }) : t('desk.waitingForNoClock', { name: first })}
          </p>
        )}
      </footer>
      <FindDetailsSheet
        open={!!details}
        onOpenChange={(v) => !v && setDetails(null)}
        itemId={details?.find.id}
        owner={first}
        mine={details?.mine}
        label={details?.label ?? ''}
      />
    </article>
  )
}
