import { AppShell } from '@/components/shell/AppShell'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { T, useT } from '@/i18n/T'
import { cn } from '@/lib/utils'
import { useOffers, type OfferRow } from './useOffers'

/** A photo, or a placeholder of the same size so rows never jump. */
function Thumb({ src, alt }: { src?: string; alt: string }) {
  if (src) {
    return <img src={src} alt={alt} className="size-16 rounded-card-sm object-cover" />
  }
  return (
    <span className="flex size-16 items-center justify-center rounded-card-sm bg-secondary">
      <Icon name="Package" size={20} className="text-muted-foreground" />
    </span>
  )
}

/** One offer, read as a sentence: they want THIS, and offer THAT.
 *
 *  Both items are shown at the same size because the decision is a comparison.
 *  Showing the incoming item smaller, as a "request", makes it look like the
 *  lesser half of a trade it is actually one half of.
 */
function OfferCard({
  offer,
  busy,
  onAccept,
  onDecline,
  onOpenItem,
}: {
  offer: OfferRow
  busy: boolean
  onAccept?: () => void
  onDecline?: () => void
  /** Takes the PUBLIC id -- the token in URLs, never items.id. */
  onOpenItem: (publicId: string) => void
}) {
  const { t } = useT()
  const trades = offer.sender?.completedTrades ?? 0

  return (
    // rise-in rather than a per-item framer transition: same motion, no
    // JS, and it matches the pilot's timing exactly.
    <li className="animate-rise-in rounded-card border-[1.5px] border-border/[0.14] bg-card p-4">
      {offer.sender && (
        <div className="mb-3 flex items-center gap-2">
          {/* The name is user data, so no data-i18n on this row. */}
          <span className="font-body text-body font-medium text-foreground">
            {offer.sender.name || t('swaps.someone')}
          </span>
          <span
            data-i18n={trades > 0 ? 'barter.trustScore' : 'barter.trustScoreNone'}
            className="font-body text-xs text-muted-foreground"
          >
            {trades > 0 ? t('barter.trustScore', { count: trades }) : t('barter.trustScoreNone')}
          </span>
          {/* What the 50 points actually bought. The flag was written by
              make_super_offer and charged for, then never selected, never
              sorted by and never shown -- so a super offer was identical to a
              free one on screen. Brass, because this is the accent that means
              "paid attention" everywhere else. */}
          {offer.isPriority && (
            <span
              data-i18n="barter.superBadge"
              className="ml-auto flex shrink-0 items-center gap-1 rounded-pill bg-accent/20 px-2 py-0.5 font-display text-[11px] font-semibold text-accent-foreground"
            >
              <Icon name="Sparkles" size={12} aria-hidden="true" />
              {t('barter.superBadge')}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => offer.wanted && onOpenItem(offer.wanted.publicId)}
          className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center"
        >
          <Thumb src={offer.wanted?.image} alt={offer.wanted?.title ?? ''} />
          <T as="span" k="barter.inboxWants" className="font-body text-xs text-muted-foreground" />
          <span className="w-full truncate font-body text-sm text-foreground">
            {offer.wanted?.title}
          </span>
        </button>

        <Icon name="ArrowRight" size={18} className="shrink-0 text-accent-foreground" />

        <button
          type="button"
          onClick={() => offer.offered && onOpenItem(offer.offered.publicId)}
          className="flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center"
        >
          <Thumb src={offer.offered?.image} alt={offer.offered?.title ?? ''} />
          <T as="span" k="barter.inboxOffers" className="font-body text-xs text-muted-foreground" />
          <span className="w-full truncate font-body text-sm text-foreground">
            {offer.offered?.title}
          </span>
        </button>
      </div>

      {offer.note && (
        // Someone else's words: never stamped with a translation key.
        <p className="mt-3 rounded-card-sm bg-secondary/60 px-3 py-2 font-body text-sm text-foreground">
          {offer.note}
        </p>
      )}

      {onAccept && onDecline && (
        <div className="mt-4 flex gap-2">
          <Button fullWidth disabled={busy} onClick={onAccept} data-i18n="barter.accept">
            {t('barter.accept')}
          </Button>
          <Button
            variant="ghost"
            fullWidth
            disabled={busy}
            onClick={onDecline}
            data-i18n="barter.decline"
          >
            {t('barter.decline')}
          </Button>
        </div>
      )}

      {!onAccept && (
        <p
          data-i18n="barter.sentPending"
          className="mt-3 font-body text-sm text-muted-foreground"
        >
          {t('barter.sentPending')}
        </p>
      )}
    </li>
  )
}

/** Offers waiting on me, and offers I have sent.
 *
 *  Same shape on both platforms -- a column of cards -- so this is one file
 *  rather than a platform split. The decision it asks for is identical on a
 *  phone and a desktop.
 */
/** Offers from the same person for the same find, drawn together.
 *
 *  That is exactly the shape a multi offer makes: one sender, one wanted item,
 *  up to four offered finds. Grouping is by (sender, wanted item) rather than
 *  by a batch id, so it needs no schema support and also tidies the case where
 *  someone made several offers by hand over time.
 *
 *  Order within the list is preserved: a group takes the position of its first
 *  member, so the priority-first sort from getIncomingOffers still holds.
 */
function groupOffers(rows: OfferRow[]): OfferRow[][] {
  const groups: OfferRow[][] = []
  const index = new Map<string, OfferRow[]>()

  for (const row of rows) {
    const key = (row.sender?.id ?? '') + ':' + (row.wanted?.id ?? '')
    const existing = index.get(key)
    if (existing) {
      existing.push(row)
      continue
    }
    const group = [row]
    index.set(key, group)
    groups.push(group)
  }
  return groups
}

export default function Offers() {
  const o = useOffers()
  const { t } = useT()
  const rows = o.tab === 'incoming' ? o.incoming : o.sent

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[720px] px-4 py-5">
        <T as="h1" k="barter.inboxTitle" className="mb-4 font-display text-h2 text-foreground" />

        <div className="mb-4 flex gap-2">
          {(['incoming', 'sent'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => o.setTab(key)}
              aria-pressed={o.tab === key}
              data-i18n={key === 'incoming' ? 'barter.inboxTitle' : 'barter.sentTitle'}
              className={cn(
                'min-h-hit rounded-pill px-4 font-body text-sm transition-colors duration-fast ease-brand',
                o.tab === key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground',
              )}
            >
              {t(key === 'incoming' ? 'barter.inboxTitle' : 'barter.sentTitle')}
            </button>
          ))}
        </div>

        {o.errorKey && (
          <p
            data-i18n={o.errorKey}
            role="alert"
            className="mb-3 font-body text-sm text-destructive"
          >
            {t(o.errorKey)}
          </p>
        )}

        {o.isLoading ? (
          <T as="p" k="hunt.loading" className="font-body text-sm text-muted-foreground" />
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-14 text-center">
            <span className="flex size-14 items-center justify-center rounded-pill bg-accent/20">
              <Icon name="Package" size={26} className="text-accent-foreground" />
            </span>
            <T
              as="p"
              k="barter.inboxEmpty"
              className="max-w-[38ch] font-body text-body text-muted-foreground"
            />
            <Button variant="ghost" onClick={o.goHunt} data-i18n="nav.discover">
              {t('nav.discover')}
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {groupOffers(rows).map((group) => {
              /* A multi offer is four separate rows by design -- the engine is
                 1-to-1 and accepting answers one concrete pair. But four cards
                 in a row from the same person for the same find reads as four
                 demands rather than one choice, so they are drawn as one block
                 with a heading that says pick one.

                 Accepting any of them closes the others: respond_to_offer
                 reserves the items, which makes the siblings unacceptable, and
                 the list refetches on success. */
              if (group.length === 1) {
                const offer = group[0]
                return (
                  <OfferCard
                    key={offer.id}
                    offer={offer}
                    busy={o.busyId === offer.id}
                    onOpenItem={o.openItem}
                    onAccept={o.tab === 'incoming' ? () => o.accept(offer.id) : undefined}
                    onDecline={o.tab === 'incoming' ? () => o.decline(offer.id) : undefined}
                  />
                )
              }
              return (
                <li
                  key={group[0].id}
                  className="flex flex-col gap-2 rounded-card border-[1.5px] border-accent/40 bg-accent/[0.06] p-3"
                >
                  <span
                    data-i18n="barter.multiGroupTitle"
                    className="font-display text-sm font-semibold text-foreground"
                  >
                    {t('barter.multiGroupTitle', {
                      name: group[0].sender?.name || t('swaps.someone'),
                      count: group.length,
                    })}
                  </span>
                  <ul className="flex flex-col gap-2">
                    {group.map((offer) => (
                      <OfferCard
                        key={offer.id}
                        offer={offer}
                        busy={o.busyId === offer.id}
                        onOpenItem={o.openItem}
                        onAccept={o.tab === 'incoming' ? () => o.accept(offer.id) : undefined}
                        onDecline={o.tab === 'incoming' ? () => o.decline(offer.id) : undefined}
                      />
                    ))}
                  </ul>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </AppShell>
  )
}
