import * as React from 'react'

import { Icon } from '@/components/ui/icon'
import { UserAvatar } from '@/components/ui/user-avatar'
import { T, useT } from '@/i18n/T'
import { categoryLabel, conditionAt, splitWants } from '@/lib/taxonomy'
import { cn } from '@/lib/utils'
import type { OfferOption } from '@/screens/Hunt/useHunt'
import type { CardItem } from '@/store/hunt'

/** Deck stage R1, the find card (approved 2026-09-27/28).
 *
 *  The photo is the card. Owner and wants sit ON the photo in the bottom
 *  scrim -- place, title, one owner line, one "Wants" line -- and the match
 *  pill ("Your X fits -- offer it") that opens the composer with that find
 *  already picked. That pill is the conversion.
 *
 *  Everything long (the story, the full wish, the owner, Report) is behind
 *  "i" or the title: a panel that slides up INSIDE the card.
 *
 *  `wide`: when the deck column has room, the card turns landscape -- the
 *  photo on the left at the same size, and what sat behind "i" becomes a panel
 *  on the right, always open.
 *
 *  No stars (cut in V4; trust is swaps done), no price, no desk: a name never
 *  leads to someone's other finds (Alex, 2026-09-28).
 */
export function DeckCard({
  card,
  fit,
  wide,
  panelWidth,
  stamp,
  onFull,
  onOfferFit,
  onReport,
  detailsOpen,
  onDetails,
}: {
  card: CardItem
  /** One of my finds that fits what the owner wants, if any. */
  fit?: OfferOption
  wide: boolean
  panelWidth: number
  /** Drag feedback: -1..1, negative = PASS, positive = OFFER. */
  stamp: number
  onFull: (photo: number) => void
  onOfferFit: (fit: OfferOption) => void
  onReport: () => void
  detailsOpen: boolean
  onDetails: (open: boolean) => void
}) {
  const { t } = useT()
  const photos = card.photos?.length ? card.photos : card.photoUrl ? [card.photoUrl] : []
  const [photo, setPhoto] = React.useState(0)
  const first = card.owner.split(' ')[0] || card.owner
  const wants = splitWants(card.wants)
  const wantCats = wants.categories.map((c) => t(categoryLabel(c)))
  const wantsShort = [...wantCats, wants.note].filter(Boolean).join(', ')
  const cond = t(conditionAt(Number(card.condition)).label)
  const cat = t(categoryLabel(card.category))
  const place = card.city || card.distance

  // A new card starts on its first photo.
  React.useEffect(() => setPhoto(0), [card.id])

  const step = (d: number) => setPhoto((p) => (p + d + photos.length) % photos.length)

  const chip = (text: string) => (
    <span className="inline-flex h-7 items-center rounded-pill bg-black/45 px-2.5 text-[12px] font-semibold text-white backdrop-blur">
      {text}
    </span>
  )
  const roundBtn = 'grid size-9 place-items-center rounded-pill bg-black/45 text-white backdrop-blur hover:bg-black/60'

  const fitRow = fit ? (
    <button
      type="button"
      onClick={() => onOfferFit(fit)}
      className="flex w-full items-center gap-3 rounded-card bg-selected p-2 pr-4 text-left text-selected-foreground hover:brightness-[0.97]"
    >
      {fit.photoUrl ? (
        <img alt="" draggable={false} className="size-11 rounded-lg object-cover" src={fit.photoUrl} />
      ) : (
        <span className="size-11 rounded-lg bg-card" />
      )}
      <span className="min-w-0 flex-1">
        {/* The find's title is user data. */}
        <span className="block truncate font-body text-label-lg">{t('deck.fitsTitle', { title: fit.title })}</span>
        <span className="block text-[13px] leading-5">{t('deck.fitsBody', { name: first })}</span>
      </span>
      <Icon name="ArrowRight" size={20} className="text-primary" />
    </button>
  ) : (
    <p className="flex items-start gap-2 text-[13px] leading-5 text-muted-foreground">
      <Icon name="Info" size={18} className="shrink-0" />
      {t('deck.noFit', { name: first })}
    </p>
  )

  const details = (
    <div className="flex flex-col gap-5">
      <section>
        <T as="p" k="deck.about" className="mb-1 font-body text-label-sm uppercase text-muted-foreground" />
        {/* The owner's own words: user data. */}
        <p className="whitespace-pre-line font-body text-body-md text-foreground">
          {card.description || t('deck.noStory')}
        </p>
      </section>
      <section>
        <p className="mb-1 font-body text-label-sm uppercase text-muted-foreground">{t('deck.wantsOf', { name: first })}</p>
        {wants.note && <p className="font-body text-body-md text-foreground">{wants.note}</p>}
        {wantCats.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {wantCats.map((c) => (
              <span key={c} className="inline-flex h-6 items-center rounded-pill bg-secondary px-2 text-[12px] font-semibold text-muted-foreground">
                {c}
              </span>
            ))}
          </div>
        )}
        {!wants.note && wantCats.length === 0 && (
          <p className="font-body text-body-md text-muted-foreground">{t('deck.wantsAnything', { name: first })}</p>
        )}
      </section>
      <button
        type="button"
        onClick={onReport}
        className="inline-flex items-center gap-1.5 self-start text-[13px] text-muted-foreground hover:text-foreground"
      >
        <Icon name="Flag" size={16} />
        <T as="span" k="deck.report" />
      </button>
    </div>
  )

  const owner = (
    <div className="flex items-center gap-3 rounded-card bg-background p-3">
      <UserAvatar name={card.owner} size="md" />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-body text-label-lg text-foreground">{card.owner}</span>
        <span className="block text-[13px] text-muted-foreground">{t('deck.swapsDone', { n: card.swapCount ?? 0 })}</span>
      </span>
    </div>
  )

  return (
    <article
      aria-roledescription={t('deck.cardRole')}
      aria-label={card.title}
      className="absolute inset-0 select-none overflow-hidden rounded-2xl bg-ink shadow-[0_1px_2px_rgba(23,25,30,0.06),0_6px_16px_rgba(23,25,30,0.08)]"
    >
      {/* ── photo pane ── */}
      <div className="absolute inset-y-0 left-0" style={{ right: wide ? panelWidth : 0 }}>
        {photos.map((src, i) => (
          <img
            key={src + i}
            alt=""
            draggable={false}
            src={src}
            className={cn(
              'absolute inset-0 size-full object-cover transition-opacity duration-200 ease-brand',
              i === photo ? 'opacity-100' : 'opacity-0',
            )}
          />
        ))}
        {photos.length === 0 && (
          <div className="absolute inset-0 grid place-items-center bg-secondary text-muted-foreground">
            <Icon name="ImagePlus" size={40} />
          </div>
        )}

        {/* Tap zones: left/right third of the upper photo steps through the
            photos, the middle opens them full screen. */}
        {photos.length > 1 && (
          <>
            <button type="button" aria-label={t('deck.prevPhoto')} onClick={() => step(-1)} className="absolute left-0 top-0 h-3/5 w-1/3" />
            <button type="button" aria-label={t('deck.nextPhoto')} onClick={() => step(1)} className="absolute right-0 top-0 h-3/5 w-1/3" />
          </>
        )}
        <button type="button" aria-label={t('deck.fullScreen')} onClick={() => onFull(photo)} className="absolute left-1/3 top-0 h-3/5 w-1/3" />

        {photos.length > 1 && (
          <div className="absolute inset-x-3 top-2.5 flex gap-1">
            {photos.map((_, i) => (
              <span key={i} className={cn('h-1 flex-1 rounded-pill', i === photo ? 'bg-white' : 'bg-white/40')} />
            ))}
          </div>
        )}

        {!wide && (
          <div className="absolute left-3 top-6 flex gap-1.5">
            {chip(cond)}
            {chip(cat)}
          </div>
        )}
        <div className="absolute right-3 top-5 flex gap-2">
          <button type="button" aria-label={t('deck.fullScreen')} onClick={() => onFull(photo)} className={roundBtn}>
            <Icon name="Maximize2" size={18} />
          </button>
          {!wide && (
            <button type="button" aria-label={t('deck.details')} onClick={() => onDetails(true)} className={roundBtn}>
              <Icon name="Info" size={20} />
            </button>
          )}
        </div>

        {/* Drag stamps. Opacity only -- the card itself carries the motion. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-6 top-20 rotate-12 rounded-card border-[3px] border-white bg-ink/70 px-4 py-1.5 text-[26px] font-extrabold tracking-[0.2em] text-white"
          style={{ opacity: Math.max(0, -stamp) }}
        >
          {t('deck.stampPass')}
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-6 top-20 -rotate-12 rounded-card border-[3px] border-white bg-green px-4 py-1.5 text-[26px] font-extrabold tracking-[0.2em] text-white"
          style={{ opacity: Math.max(0, stamp) }}
        >
          {t('deck.stampOffer')}
        </span>

        {!wide && (
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-4 pb-4 pt-28 text-white">
            {place && (
              <p className="flex items-center gap-1 text-[12px] font-semibold leading-4 text-white/85">
                <Icon name="Navigation" size={14} />
                {place}
              </p>
            )}
            <button
              type="button"
              onClick={() => onDetails(true)}
              className="line-clamp-2 text-left font-display text-[26px] font-bold leading-[30px] decoration-white/40 hover:underline"
            >
              {card.title}
            </button>
            <div className="flex min-w-0 items-center gap-2">
              <UserAvatar name={card.owner} size="sm" className="size-7 text-[11px] ring-2 ring-white/70" />
              <span className="font-body text-label-lg">{card.owner}</span>
              <span className="text-[13px] text-white/75">· {t('deck.swapsN', { n: card.swapCount ?? 0 })}</span>
            </div>
            {wantsShort && (
              <p className="flex min-w-0 items-baseline gap-2 text-[13px] leading-5">
                <T as="span" k="deck.wants" className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-white/70" />
                <span className="truncate">{wantsShort}</span>
              </p>
            )}
            {fit && (
              <button
                type="button"
                onClick={() => onOfferFit(fit)}
                className="inline-flex h-9 max-w-full items-center gap-2 self-start rounded-pill bg-white pl-1 pr-3.5 text-[13px] font-semibold text-ink shadow-md hover:bg-paper"
              >
                {fit.photoUrl ? (
                  <img alt="" draggable={false} className="size-7 rounded-pill object-cover" src={fit.photoUrl} />
                ) : (
                  <span className="size-7 rounded-pill bg-secondary" />
                )}
                <span className="truncate">{t('deck.fitsPill', { title: fit.title })}</span>
                <Icon name="ArrowRight" size={16} className="shrink-0 text-green" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── wide: the panel, always open ── */}
      {wide && (
        <aside
          aria-label={card.title}
          className="absolute inset-y-0 right-0 flex flex-col bg-card text-foreground"
          style={{ width: panelWidth }}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-6 pb-4 pt-6">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-1.5">
                {[cond, cat].map((c) => (
                  <span key={c} className="inline-flex h-7 items-center rounded-pill bg-secondary px-2.5 text-[12px] font-semibold text-muted-foreground">
                    {c}
                  </span>
                ))}
              </div>
              <h2 className="font-display text-[28px] font-bold leading-[34px]">{card.title}</h2>
              {place && (
                <p className="flex items-center gap-1 text-[13px] leading-5 text-muted-foreground">
                  <Icon name="Navigation" size={16} />
                  {place}
                </p>
              )}
            </div>
            {owner}
            {details}
          </div>
          <div className="shrink-0 border-t border-input px-6 py-4">{fitRow}</div>
        </aside>
      )}

      {/* ── portrait: details slide up inside the card ── */}
      {!wide && (
        <div
          aria-hidden={!detailsOpen}
          className={cn(
            'absolute inset-x-0 bottom-0 top-[28%] overflow-y-auto rounded-t-2xl bg-card text-foreground transition-transform duration-200 ease-brand',
            detailsOpen ? 'translate-y-0' : 'pointer-events-none translate-y-full',
          )}
        >
          <div className="sticky top-0 flex items-start gap-3 border-b border-input bg-card px-5 pb-3 pt-4">
            <div className="min-w-0 flex-1">
              <p className="font-display text-headline-sm">{card.title}</p>
              <p className="text-[13px] text-muted-foreground">{[cond, cat, place].filter(Boolean).join(' · ')}</p>
            </div>
            <button
              type="button"
              onClick={() => onDetails(false)}
              aria-label={t('deck.closeDetails')}
              className="grid size-9 shrink-0 place-items-center rounded-pill text-muted-foreground hover:bg-secondary"
            >
              <Icon name="ChevronDown" size={22} />
            </button>
          </div>
          <div className="flex flex-col gap-5 px-5 py-4">
            {details}
            {owner}
            {fitRow}
          </div>
        </div>
      )}
    </article>
  )
}
