import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { ToneBadge } from '@/components/ui/tone-badge'
import { formatLeft, useTimeLeft } from '@/components/offer/ExpiryCountdown'
import { T, useT } from '@/i18n/T'
import type { OrganismSpec } from '@/layout/organism'
import { useOrganism } from '@/layout/useOrganism'
import type { Platform } from '@/lib/platform'
import { cn } from '@/lib/utils'

/** Offers about to expire — the second V6 organism.
 *
 *  Unlike the streak this one has a REAL backend: `barter_offers` with a
 *  server-enforced 24h deadline (migration 045) and a pg_cron job that
 *  actually flips rows to 'expired'. So it is the organism that proves the
 *  data pipeline rather than just the visual contract.
 *
 *  Restraint, as with the streak: one loud element. The urgent countdown is
 *  the only thing wearing the attention colour, and only in its last hour --
 *  urgent styling 23 hours out is noise, and leaves nothing to escalate to.
 *  Everything else is quiet cards and one green primary action.
 */

export type OfferTone = 'coral' | 'attention'

export interface ExpiringOffer {
  id: string
  /** What they are offering you. */
  itemTitle: string
  itemImage?: string | null
  /** Who sent it. */
  senderName: string
  /** Which of YOUR items they want. */
  wantedTitle: string
  expiresAt: string
}

export const OFFERS_VARIANTS = {
  /* Measured in the gallery, not guessed. `tile` is the sidebar shape from
   * the design; `compact` is the one-line summary for a narrow cell. */
  tile: { minSpan: { mobile: 4, tablet: 4, desktop: 4 } },
  compact: { minSpan: { mobile: 3, tablet: 3, desktop: 3 } },
} as const satisfies Record<
  string,
  { minSpan: Record<'mobile' | 'tablet' | 'desktop', number | null> }
>

export type OffersVariant = keyof typeof OFFERS_VARIANTS

export interface ExpiringOffersData {
  offers: ExpiringOffer[]
}

export interface ExpiringOffersOrganismProps extends ExpiringOffersData {
  variant?: OffersVariant
  tone?: OfferTone
  className?: string
  col?: number
  span?: number
  row?: number
  arm?: string
  track?: boolean
  platformOverride?: Platform
  onReview?: (id: string) => void
  onPass?: (id: string) => void
}

/** An offer is urgent in its last hour. Anything earlier is information. */
const URGENT_MS = 60 * 60 * 1000

/* ------------------------------------------------------------------ row -- */

function OfferRow({
  offer,
  tone,
  onReview,
  onPass,
  onEmit,
}: {
  offer: ExpiringOffer
  tone: OfferTone
  onReview?: (id: string) => void
  onPass?: (id: string) => void
  onEmit: (kind: 'click' | 'convert', target: string, extra?: Record<string, unknown>) => void
}) {
  const { t } = useT()
  const left = useTimeLeft(offer.expiresAt) ?? 0
  const urgent = left > 0 && left <= URGENT_MS

  /* The 24h window as a bar. Computed from what is LEFT rather than from
   * elapsed time, so a row that arrives already half-spent draws correctly. */
  const pct = Math.max(0, Math.min(100, (left / (24 * 60 * 60 * 1000)) * 100))

  const accent = tone === 'attention' ? 'bg-state-attention' : 'bg-brand-coral'

  return (
    <li className="flex flex-col gap-1.5 rounded-card bg-card p-3 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-2.5">
        {/* The item is the subject of the row, so it leads. */}
        <div className="size-12 shrink-0 overflow-hidden rounded-card-sm bg-muted">
          {offer.itemImage ? (
            <img
              src={offer.itemImage}
              alt=""
              className="size-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="grid size-full place-items-center text-muted-foreground">
              <Icon name="Package" size={18} aria-hidden />
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="line-clamp-2 font-display text-[13px] font-bold leading-tight">
            {offer.itemTitle}
          </span>
          <span className="text-[12px] leading-tight text-muted-foreground">
            <T k="offers.from" />{' '}
            <b className="font-semibold text-foreground">{offer.senderName}</b>
          </span>
        </div>

        {/* The ONLY loud element, and only in the last hour. */}
        <span
          className={cn(
            'shrink-0 rounded-pill px-2 py-0.5 font-display text-[12px] font-bold tabular-nums',
            urgent
              ? tone === 'attention'
                ? 'bg-state-attention text-white'
                : 'bg-brand-coral text-on-accent'
              : 'bg-brand-stone/70 text-muted-foreground',
          )}
        >
          {formatLeft(left, t)}
        </span>
      </div>

      <p className="text-[12px] leading-snug text-muted-foreground">
        <T k="offers.askingFor" />{' '}
        <b className="font-semibold text-foreground">{offer.wantedTitle}</b>
      </p>

      {/* The deadline, drawn. Quiet until the last hour. */}
      <div className="h-1.5 w-full overflow-hidden rounded-pill bg-brand-stone/60">
        <div
          className={cn('h-full rounded-pill', urgent ? accent : 'bg-state-settled/50')}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-auto min-w-0 whitespace-normal px-3 py-1 text-[11px] leading-tight"
          onClick={() => {
            onEmit('click', 'pass', { offer: offer.id })
            onPass?.(offer.id)
          }}
        >
          <T k="offers.pass" />
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="h-auto min-w-0 whitespace-normal px-3 py-1 text-[11px] leading-tight"
          onClick={() => {
            onEmit('convert', 'review', { offer: offer.id, urgent })
            onReview?.(offer.id)
          }}
        >
          <T k="offers.review" />
        </Button>
      </div>
    </li>
  )
}

/* ------------------------------------------------------------- organism -- */

export function ExpiringOffersOrganism({
  offers,
  variant = 'tile',
  tone = 'coral',
  className,
  col,
  span,
  row,
  arm,
  track = true,
  platformOverride,
  onReview,
  onPass,
}: ExpiringOffersOrganismProps) {
  const org = useOrganism({
    organism: OFFERS_SPEC.id,
    variant,
    col,
    span,
    row,
    arm,
    enabled: track,
    platformOverride,
  })

  const urgentCount = offers.filter((o) => {
    const left = new Date(o.expiresAt).getTime() - Date.now()
    return left > 0 && left <= URGENT_MS
  }).length

  /* ---- compact: the count, and nothing else. ---- */
  if (variant === 'compact') {
    return (
      <Card
        ref={org.ref}
        {...org.attrs}
        className={cn('flex items-center gap-2.5 px-3 py-2.5', className)}
        onClick={() => org.emit('click', 'root')}
      >
        <span
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-card-sm shadow-[var(--shadow-card)]',
            tone === 'attention'
              ? 'bg-state-attention text-white'
              : 'bg-brand-coral text-on-accent',
          )}
        >
          <Icon name="Clock" size={16} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 font-display text-[13px] font-semibold leading-tight">
          <T k="offers.countWaiting" values={{ count: offers.length }} />
        </span>
        {urgentCount > 0 && (
          <span className="shrink-0 font-display text-[13px] font-bold tabular-nums text-state-settled">
            {urgentCount}
          </span>
        )}
      </Card>
    )
  }

  /* ---- tile: the full queue. ---- */
  return (
    <Card
      ref={org.ref}
      {...org.attrs}
      className={cn('flex flex-col gap-3 p-4', className)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Icon
            name="Clock"
            size={20}
            /* shrink-0: a two-line Georgian heading squeezed the icon to
               nothing, so the organism lost its identity in one language. */
            aria-hidden
            className={cn(
              tone === 'attention' ? 'text-state-attention' : 'text-brand-coral',
              /* Bounces only while something is actually urgent. A permanent
                 animation is wallpaper -- it stops meaning "look here" and
                 leaves nothing to escalate to. motion-safe respects a reduced
                 motion preference; the utility animates transform only. */
              'shrink-0',
              urgentCount > 0 && 'motion-safe:animate-bounce',
            )}
          />
          <h3 className="font-display text-[18px] font-bold leading-tight">
            <T k="offers.title" />
          </h3>
        </div>
        {urgentCount > 0 && (
          <ToneBadge
            tone="brass"
            className={cn(
              'max-w-full shrink-0 whitespace-normal',
              tone === 'attention'
                ? 'bg-state-attention/12 text-state-attention'
                : 'bg-brand-coral/20 text-on-accent',
            )}
          >
            <T k="offers.urgent" values={{ count: urgentCount }} />
          </ToneBadge>
        )}
      </div>

      <p className="text-[13px] leading-snug text-muted-foreground">
        <T k="offers.explain" />
      </p>

      {offers.length === 0 ? (
        /* An honest empty state. `/offers` shipped a silent empty once, where
         * "nothing waiting" was really a filter excluding plain likes -- so
         * this says what it actually means. */
        <p className="rounded-card bg-brand-stone/40 p-3 text-[13px] text-muted-foreground">
          <T k="offers.empty" />
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {offers.map((o) => (
            <OfferRow
              key={o.id}
              offer={o}
              tone={tone}
              onReview={onReview}
              onPass={onPass}
              onEmit={org.emit}
            />
          ))}
        </ul>
      )}
    </Card>
  )
}

/* ------------------------------------------------------------------ spec -- */

export const OFFERS_SPEC: OrganismSpec<ExpiringOffersData, ExpiringOffersData> = {
  id: 'expiring_offers',
  describe: 'Offers waiting on you, with the 24h deadline the server enforces',

  variants: OFFERS_VARIANTS,

  /* PIPELINE — a REAL one. This is the organism that proves the contract.
   *
   * The embedded joins use exact FK constraint names: a wrong one returns []
   * rather than an error, which is how a silent empty happens. These names
   * are copied from lib/barter.ts getIncomingOffers, which is known working.
   *
   * NOTE the `is_priority` filter there: a plain like is PRIVATE and sits
   * pending until mirrored, so the inbox shows super offers only. That filter
   * -- not RLS -- is why /offers can look empty while a pending row exists.
   */
  data: {
    source: {
      kind: 'table',
      from: 'barter_offers',
      select:
        'id, expires_at, ' +
        'offered:items!barter_offers_offered_item_id_fkey (title, images), ' +
        'wanted:items!barter_offers_wanted_item_id_fkey (title), ' +
        'sender:profiles!barter_offers_from_user_fkey (name)',
      filter: { status: 'pending', is_priority: true },
    },
    queryKey: ['organism', 'expiring_offers'],
    toProps: (raw) => raw,
    // A countdown wants fresher data than a ramp: 30s, not a minute.
    staleTime: 30_000,
  },

  targets: [
    { id: 'root', describe: 'The queue scrolled into view', kind: 'view' },
    { id: 'pass', describe: 'Declined an offer from the queue', kind: 'click' },
    { id: 'review', describe: 'Opened an offer to review and accept', kind: 'convert' },
  ],
}

/** Demo data for the gallery. One urgent, one not — the two states that
 *  matter, so the escalation is visible side by side. */
export const OFFERS_DEMO: ExpiringOffer[] = [
  {
    id: 'a1',
    itemTitle: "Levi's Type III Denim",
    senderName: 'Liam V.',
    wantedTitle: 'Marantz Stereo Receiver',
    expiresAt: new Date(Date.now() + 18 * 60 * 1000).toISOString(),
  },
  {
    id: 'a2',
    itemTitle: 'Mid-Century Teak Planter',
    senderName: 'Sora K.',
    wantedTitle: 'Ceramic Pour-Over Set',
    expiresAt: new Date(Date.now() + 9.7 * 60 * 60 * 1000).toISOString(),
  },
]
