import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router'

import { Icon, type IconName } from '@/components/ui/icon'
import { formatLeft, useTimeLeft } from '@/components/offer/ExpiryCountdown'
import { T, useT } from '@/i18n/T'
import { getIncomingOffers, getMyMatches } from '@/lib/barter'
import { tierOf } from '@/lib/membership'
import { TIER_PRICES } from '@/lib/points'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { useShellData } from '@/components/shell/useShellData'

type Row = Record<string, unknown>
const one = (v: unknown) => (Array.isArray(v) ? v[0] : v) as Row | null
const firstPhoto = (it: Row | null) => (Array.isArray(it?.images) && it!.images.length ? String((it!.images as unknown[])[0]) : undefined)

/** Anything under this is urgent: the timer turns Coral. */
const URGENT_MS = 6 * 60 * 60 * 1000

export interface ExpiringOffer {
  id: string
  /** Which of my finds it is for. */
  wantedId: string
  theirTitle: string
  theirPhoto?: string
  mineTitle: string
  who: string
  expiresAt: string
}

/** What the Discover rail (desktop) and the ⋮ menu (phone) show: offers
 *  running out, what is on your table, and your tier.
 *
 *  Keys sit under the 'barter' prefix so the realtime invalidation that
 *  refreshes the offers inbox refreshes these too -- but they are their own
 *  entries, because they hold a different SHAPE from the inbox's list (see the
 *  note on keys.barterOffers: one key, one shape).
 */
export function useNeedsYou() {
  const userId = useAuthStore((s) => s.session?.user?.id)
  const shell = useShellData()

  const { data: incoming = [] } = useQuery({
    queryKey: ['barter', 'needs-you', 'incoming', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await getIncomingOffers(userId!)
      if (error) throw error
      return (data ?? []) as Row[]
    },
    enabled: !!userId,
    staleTime: 60_000,
  })

  const { data: activeSwaps = 0 } = useQuery({
    queryKey: ['barter', 'needs-you', 'active-swaps', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await getMyMatches(userId!)
      if (error) throw error
      return ((data ?? []) as Row[]).filter((m) => m.status === 'active').length
    },
    enabled: !!userId,
    staleTime: 60_000,
  })

  const now = Date.now()
  const expiring: ExpiringOffer[] = incoming
    .filter((o) => o.expires_at && Date.parse(String(o.expires_at)) > now)
    .sort((a, b) => Date.parse(String(a.expires_at)) - Date.parse(String(b.expires_at)))
    .map((o) => ({
      id: String(o.id),
      wantedId: String(o.wanted_item_id),
      theirTitle: String(one(o.offered)?.title ?? ''),
      theirPhoto: firstPhoto(one(o.offered)),
      mineTitle: String(one(o.wanted)?.title ?? ''),
      who: String(one(o.sender)?.name ?? ''),
      expiresAt: String(o.expires_at),
    }))

  // Offers waiting on each of my finds, for the counts on My table.
  const offersOn = incoming.reduce<Record<string, number>>((acc, o) => {
    const k = String(o.wanted_item_id)
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})

  return { shell, expiring, offersOn, activeSwaps }
}

/** A foldable card: the header is ONE line that always carries the key
 *  signal, and folds down to just that line. Open or closed is remembered per
 *  card (Discover right rail R1). */
function RailCard({
  id,
  icon,
  iconTone,
  title,
  summary,
  children,
  foot,
}: {
  id: string
  icon: IconName
  iconTone: string
  title: string
  summary: React.ReactNode
  children: React.ReactNode
  foot?: { k: string; to: string; values?: Record<string, string | number> }
}) {
  const navigate = useNavigate()
  const { t } = useT()
  const key = `bartefy.rail.${id}`
  const [open, setOpen] = React.useState(() => {
    try {
      return localStorage.getItem(key) !== '0'
    } catch {
      return true
    }
  })
  const toggle = () => {
    setOpen((v) => {
      try {
        localStorage.setItem(key, v ? '0' : '1')
      } catch {
        // Forgetting a fold is harmless.
      }
      return !v
    })
  }
  return (
    <section className="overflow-hidden rounded-card bg-card shadow-sm ring-1 ring-input">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex h-14 w-full items-center gap-2.5 px-4 text-left transition-colors hover:bg-background"
      >
        <Icon name={icon} size={20} className={cn('shrink-0', iconTone)} />
        <span className="min-w-0 flex-1">
          <span className="block font-body text-label-lg text-foreground">{title}</span>
          <span className="block truncate font-body text-[12px] leading-4 text-muted-foreground">{summary}</span>
        </span>
        <Icon name="ChevronUp" size={20} className={cn('shrink-0 text-muted-foreground transition-transform duration-200 ease-brand', !open && 'rotate-180')} />
      </button>
      {open && (
        <div>
          {children}
          {foot && (
            <button
              type="button"
              onClick={() => navigate(foot.to)}
              className="flex h-10 w-full items-center justify-between border-t border-input px-4 font-body text-label-md text-primary hover:bg-background"
            >
              {t(foot.k, foot.values)}
              <Icon name="ArrowRight" size={16} />
            </button>
          )}
        </div>
      )}
    </section>
  )
}

function Timer({ at }: { at: string }) {
  const { t } = useT()
  const left = useTimeLeft(at) ?? 0
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center rounded-pill px-2 font-display text-[12px] font-bold tabular-nums',
        left < URGENT_MS ? 'bg-coral text-ink' : 'bg-secondary text-muted-foreground',
      )}
    >
      {formatLeft(left, t)}
    </span>
  )
}

export function ExpiringCard({ offers }: { offers: ExpiringOffer[] }) {
  const { t } = useT()
  const navigate = useNavigate()
  if (offers.length === 0) {
    return (
      <section className="flex h-14 items-center gap-2.5 rounded-card bg-card px-4 ring-1 ring-input">
        <Icon name="AlarmClock" size={20} className="text-muted-foreground" />
        <T as="span" k="rail.noOffers" className="font-body text-label-lg text-muted-foreground" />
      </section>
    )
  }
  const next = offers[0]
  return (
    <RailCard
      id="expiring"
      icon="AlarmClock"
      iconTone={Date.parse(next.expiresAt) - Date.now() < URGENT_MS ? 'text-coral' : 'text-muted-foreground'}
      title={t('rail.expiring', { count: offers.length })}
      summary={<NextEnds at={next.expiresAt} />}
      foot={{ k: 'rail.review', to: '/matches' }}
    >
      <ul className="flex flex-col pb-1">
        {offers.slice(0, 4).map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => navigate('/matches?offer=' + o.id)}
              className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-background"
            >
              {o.theirPhoto ? (
                <img alt="" className="size-10 shrink-0 rounded-lg object-cover" src={o.theirPhoto} />
              ) : (
                <span className="size-10 shrink-0 rounded-lg bg-secondary" />
              )}
              <span className="min-w-0 flex-1">
                {/* Titles and names are user data. */}
                <span className="block truncate font-body text-label-md text-foreground">{o.theirTitle}</span>
                <span className="block truncate text-[12px] leading-4 text-muted-foreground">
                  {t('rail.forYour', { who: o.who, title: o.mineTitle })}
                </span>
              </span>
              <Timer at={o.expiresAt} />
            </button>
          </li>
        ))}
      </ul>
    </RailCard>
  )
}

function NextEnds({ at }: { at: string }) {
  const { t } = useT()
  const left = useTimeLeft(at) ?? 0
  return <>{t('rail.nextEnds', { left: formatLeft(left, t) })}</>
}

export function TableCard({ offersOn }: { offersOn: Record<string, number> }) {
  const { t } = useT()
  const items = useShellData().table
  const withOffers = items.filter((i) => offersOn[i.id]).length
  return (
    <RailCard
      id="table"
      icon="Store"
      iconTone="text-muted-foreground"
      title={t('rail.table')}
      summary={t('rail.tableSummary', { live: items.length, offers: withOffers })}
      foot={{ k: 'rail.manage', to: '/items' }}
    >
      {items.length === 0 ? (
        <T as="p" k="rail.tableEmpty" className="px-4 pb-3 font-body text-body-sm text-muted-foreground" />
      ) : (
        <div className="grid grid-cols-6 gap-1.5 px-4 pb-3">
          {items.slice(0, 12).map((i) => (
            <span key={i.id} className="relative block aspect-square overflow-hidden rounded-lg bg-secondary" title={i.title}>
              {i.photo && <img alt="" className="size-full object-cover" src={i.photo} />}
              {!!offersOn[i.id] && (
                <span className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded-pill bg-green text-[10px] font-bold text-white ring-1 ring-white">
                  {offersOn[i.id]}
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </RailCard>
  )
}

/** The tier, stated as it is. Hunter's listing and swap limits are copy on the
 *  Membership page that the database does not enforce (entitlements() returns
 *  no cap since 023), so this card shows what you have, not a limit that is
 *  not real. The radius IS real: it is what the deck reaches. */
export function TierCard({ activeSwaps }: { activeSwaps: number }) {
  const { t } = useT()
  const shell = useShellData()
  const spec = tierOf(shell.tier)
  const radius = spec.radiusKm
  return (
    <RailCard
      id="tier"
      icon="Shield"
      iconTone="text-muted-foreground"
      title={t(`shell.tier_${shell.tier}`)}
      summary={t('rail.tierSummary', {
        finds: shell.liveFinds,
        swaps: activeSwaps,
        reach: radius ? t('rail.km', { n: radius }) : t('rail.noCap'),
      })}
      foot={shell.tier === 'hunter' ? { k: 'rail.collector', to: '/points', values: { n: TIER_PRICES.collector } } : undefined}
    >
      <dl className="grid grid-cols-3 gap-2 px-4 pb-3 text-center">
        {[
          [shell.liveFinds, 'rail.statFinds'],
          [activeSwaps, 'rail.statSwaps'],
          [radius ?? '∞', 'rail.statKm'],
        ].map(([n, k]) => (
          <div key={String(k)} className="rounded-lg bg-background py-2">
            <dt className="font-display text-headline-sm tabular-nums text-foreground">{n}</dt>
            <T as="dd" k={String(k)} className="font-body text-[11px] text-muted-foreground" />
          </div>
        ))}
      </dl>
    </RailCard>
  )
}
