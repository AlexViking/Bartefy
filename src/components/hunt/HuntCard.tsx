import { useEffect, useRef, useState } from 'react'
import { Eye } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { ToneBadge } from '@/components/ui/tone-badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { useT } from '@/i18n/T'
import { DEFAULT_CONDITION, categoryLabel, conditionAt } from '@/lib/taxonomy'
import type { CardItem } from '@/store/hunt'
import { cn } from '@/lib/utils'

/** The find itself. Identical on both platforms — only the frame around it
 *  changes, so a card someone learns to read on a phone reads the same on a
 *  desktop.
 */
export function HuntCard({
  item,
  eyeing = 0,
  onExpand,
  className,
  fill = false,
  wide = false,
}: {
  item: CardItem
  eyeing?: number
  /** Open the photos full screen. Omitted where there is nowhere to open. */
  onExpand?: (index: number) => void
  className?: string
  /** Fill the box rather than hold a 3:4 ratio, and put the details over the
   *  photo instead of in a panel under it. The phone deck -- see `fill` on
   *  HuntStack for why. */
  fill?: boolean
  /** A card much wider than the photos it shows -- the desktop deck.
   *
   *  Separate from `fill` because the two answer different questions. `fill`
   *  is "does the card take the whole box"; this is "is the box a different
   *  SHAPE from the photo". A phone card is full-bleed and almost exactly the
   *  photo's own portrait shape, so object-cover crops nothing worth keeping.
   *  A 1004x744 desktop card is landscape over a portrait photo, where cover
   *  showed about a fifth of the item. */
  wide?: boolean
}) {
  const { t } = useT()

  /** A listing carries up to five photos and the deck showed one, so four
   *  fifths of what someone photographed was invisible. */
  const photos = item.photos?.length ? item.photos : item.photoUrl ? [item.photoUrl] : []
  const [index, setIndex] = useState(0)
  const many = photos.length > 1

  // Each card starts at its first photo. Without this the next card in the
  // stack opens on whatever index the previous one was left at.
  useEffect(() => setIndex(0), [item.id])

  // Does the description actually overflow two lines? scrollHeight exceeds
  // clientHeight only while the clamp is on, so this is measured in the
  // clamped state and re-measured per card.
  useEffect(() => {
    setDescOpen(false)
    const el = descRef.current
    if (!el) return setDescClamped(false)
    setDescClamped(el.scrollHeight > el.clientHeight + 1)
  }, [item.id, item.description])

  /** Whether the photo currently on screen has painted. Reset per photo, so
   *  stepping to a second image shows its own skeleton rather than holding
   *  the previous one's pixels. warmAhead means the NEXT card's photo is
   *  already decoded, so in the deck this is usually true immediately. */
  /** Whether the description is expanded, and whether it has anything to
   *  expand. Measured rather than guessed from length: two lines is a pixel
   *  question -- it depends on the card width and the script, and Georgian
   *  wraps differently from Latin at the same character count. */
  const [descOpen, setDescOpen] = useState(false)
  const [descClamped, setDescClamped] = useState(false)
  const descRef = useRef<HTMLSpanElement>(null)

  const [photoLoaded, setPhotoLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  useEffect(() => {
    // A warmed photo is already decoded, so onLoad may never fire for it --
    // leaving the image at opacity 0 behind a pulsing skeleton. Check
    // complete on every photo change rather than assuming a load event.
    const el = imgRef.current
    setPhotoLoaded(!!el?.complete && el.naturalWidth > 0)
  }, [item.id, index])

  const step = (dir: number) =>
    setIndex((i) => (photos.length ? (i + dir + photos.length) % photos.length : 0))

  return (
    // 3:4 overall with the photo taking 62%, per V5. The old card was 4:3 --
    // landscape -- which on a phone left the deck short and wide and made the
    // stack look like a list of banners rather than cards you pick up.
    <Card
      className={cn(
        'flex w-full flex-col overflow-hidden rounded-hero border-0 bg-card shadow-float',
        // Sized by its ratio when it is a card in a column; sized by its box
        // when it is the screen. h-full, not aspect-*, or a tall phone would
        // letterbox the deck it is supposed to fill.
        fill ? 'h-full' : 'aspect-[3/4]',
        className,
      )}
    >
      {/* A skeleton, not a colour, until the photo paints.
      
          photoColor is terracotta -- an illustration accent -- so a card
          whose photo had not arrived was a solid orange block. The box is a
          fixed 62% here so nothing reflows; what was wrong was that the
          waiting state looked like content. */}
      <div
        className={cn(
          'relative w-full',
          // Full-bleed: the photo IS the card and the details sit on top of
          // it. Otherwise it is the top 62% with a panel beneath.
          fill ? 'min-h-0 flex-1' : 'h-[62%] shrink-0',
          !photoLoaded && 'animate-pulse bg-secondary',
        )}
      >
        {/* A blurred, zoomed copy of the same photo behind the real one.
            
            object-cover on a wide box crops a portrait photo to a corner --
            on a 1004x744 desktop card that showed about a fifth of the item,
            which is useless for deciding whether you want it. object-contain
            shows all of it but leaves bars down both sides.
            
            So: the blur fills the box, the real photo sits inside it
            complete. Only when filling; the 340px card is close enough to the
            photo's own shape that cover crops almost nothing. aria-hidden and
            no alt -- it is the same image twice, and a screen reader should
            hear about it once. */}
        {wide && photos[index] && (
          <img
            src={photos[index]}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute inset-0 size-full scale-110 object-cover blur-2xl brightness-[0.55]"
          />
        )}
        {photos[index] && (
          <img
            ref={imgRef}
            src={photos[index]}
            alt={t('a11y.photoOf', { title: item.title })}
            loading="lazy"
            onLoad={() => setPhotoLoaded(true)}
            /* An <img> is draggable:true by default, so on a desktop starting
               a swipe ON the photo handed the pointer to the browser's native
               image drag -- you got a ghost of the picture following the
               cursor and the card never moved. Only a problem with a mouse:
               touch has no native image drag, which is why the phone deck
               always felt fine. */
            draggable={false}
            style={{ opacity: photoLoaded ? 1 : 0, transition: 'opacity 240ms var(--ease-out)' }}
            className={cn(
              'relative size-full',
              wide ? 'object-contain' : 'object-cover',
            )}
          />
        )}

        {/* Tap the left or right third to step photos, per the pilot.
            Deliberately NOT a scroller: inside a swipe deck a horizontal
            scroller fights the drag and both lose. */}
        {many && (
          <>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); step(-1) }}
              aria-label={t('common.previous')}
              className="absolute inset-y-0 left-0 w-1/3"
            />
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); step(1) }}
              aria-label={t('common.next')}
              className="absolute inset-y-0 right-0 w-1/3"
            />

            {/* Progress bars, not dots: they say how many there are AND how
                far through you are. Dots only say how many. */}
            <div className="pointer-events-none absolute inset-x-2 top-2 flex gap-1">
              {photos.map((p, i) => (
                <span
                  key={p + i}
                  className={cn(
                    'h-[3px] flex-1 rounded-pill transition-colors duration-fast',
                    i === index ? 'bg-white' : 'bg-white/35',
                  )}
                />
              ))}
            </div>
          </>
        )}

        <div className={cn('absolute inset-x-3 flex justify-between gap-2', many ? 'top-6' : 'top-3')}>
          {/* conditionAt, not the raw value: items.condition is a SMALLINT 1-5,
              so rendering it directly put a bare "5" in the corner of every
              card. The type said `condition?: string`, which is why neither
              tsc nor the i18n audit ever complained -- the audit only looks
              for keys that ARE referenced, and this referenced none. */}
          <ToneBadge tone="quiet" className="bg-card/90 backdrop-blur-sm">
            {t(conditionAt(Number(item.condition ?? DEFAULT_CONDITION)).label)}
          </ToneBadge>
          {eyeing > 0 && (
            <span
              className="flex items-center gap-1 rounded-pill bg-foreground/70 px-2.5 py-1 font-display text-xs font-semibold text-background"
              title={t('help.whyEyeing')}
            >
              <Eye className="size-3.5" aria-hidden="true" />
              {eyeing}
            </span>
          )}
        </div>

        {/* Expand, per the pilot. A card-sized photo cannot answer "is that a
            chip in the rim or a reflection?", and that question is the
            difference between a swap and a wasted trip. */}
        {onExpand && photos.length > 0 && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onExpand(index) }}
            aria-label={t('item.viewPhotos')}
            className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-pill bg-card/85 text-foreground backdrop-blur-sm"
          >
            <Icon name="ArrowRight" size={16} className="-rotate-45" />
          </button>
        )}
      </div>

      {/* Details: a panel under the photo normally, a gradient overlay ON the
          photo when the card fills the screen.

          The colours are overridden here rather than by forking the markup
          below into two copies. Over a photo, `text-foreground` is ink on a
          dark image and `text-muted-foreground` vanishes on a light one, so
          both are remapped to white via the CSS variables the children
          already use -- one place to change, and no second tree to keep in
          sync. The gradient is what makes white legible over an arbitrary
          photo; text-shadow covers the rest. pb-20 leaves room for the action
          buttons floating above the bottom edge. */}
      <div
        className={cn(
          'flex flex-col gap-1.5 p-4',
          fill
            ? [
                // pb-24: the action buttons float at bottom-7 and are 60px
                // tall, so anything less puts the location row under them --
                // measured, not guessed.
                'absolute inset-x-0 bottom-0 z-10 pb-24',
                // Cap the text column on a wide card and CENTRE it. Without
                // the cap the title sits bottom-left and the category
                // bottom-right with a thousand pixels of photo between them,
                // and they stop reading as one block about one find. mx-auto
                // is what puts that block under the middle of the photo
                // rather than against the left edge of the card.
                wide && 'mx-auto w-full max-w-[560px]',
                // Opaque at the foot and tall enough to fade out behind the
                // title. A lighter wash is legible over a dark photo and
                // disappears over a bright one -- the yellow packaging in
                // testing is the case that decides this.
                'bg-gradient-to-t from-black/95 via-black/70 via-60% to-transparent',
                '[--foreground:0_0%_100%] [--muted-foreground:0_0%_100%]',
                '[text-shadow:0_1px_3px_rgb(0_0_0/0.55)]',
              ]
            : 'min-h-0 flex-1',
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 font-display text-h3 leading-tight text-foreground">
            {item.title}
          </h3>
          <ToneBadge tone="quiet" className="shrink-0">
            {t(categoryLabel(item.category))}
          </ToneBadge>
        </div>

        {/* The description, which the card never showed -- the only place
            someone says what is actually right or wrong with the thing. */}
        {item.description && (
          <button
            type="button"
            // stopPropagation so reading the description never starts a drag.
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              setDescOpen((v) => !v)
            }}
            aria-expanded={descOpen}
            className="w-full text-left"
          >
            <span
              ref={descRef}
              className={cn(
                'block font-body text-sm text-muted-foreground',
                // Two lines by default, all of it once asked. line-clamp cut
                // mid-word with no way to read the rest -- and the description
                // is the only place a seller can say "the zip is broken".
                !descOpen && 'line-clamp-2',
              )}
            >
              {item.description}
            </span>
            {/* Only offered when there is more to see: a "read more" that
                expands nothing is worse than none. */}
            {descClamped && (
              <span
                data-i18n={descOpen ? 'common.less' : 'common.more'}
                className="mt-0.5 inline-block font-display text-xs font-semibold text-primary"
              >
                {t(descOpen ? 'common.less' : 'common.more')}
              </span>
            )}
          </button>
        )}

        <div className="flex items-center gap-2 pt-0.5">
          <UserAvatar name={item.owner || t('swaps.someone')} size="sm" />
          <span className="min-w-0 flex-1 truncate font-display text-sm font-semibold text-foreground">
            {item.owner || t('swaps.someone')}
          </span>
          {/* Trust is a count of finished swaps, not a star rating: ratings
              invite retaliation, a completed-trade count cannot be faked. */}
          {item.swapCount != null && item.swapCount > 0 && (
            <span
              data-i18n="barter.trustScore"
              className="shrink-0 font-body text-caption text-muted-foreground"
            >
              {t('barter.trustScore', { count: item.swapCount })}
            </span>
          )}
        </div>

        {/* Where and how long, along the bottom -- the two facts that decide
            whether this swap can actually happen.

            pe-11 reserves the bottom-right corner for the report flag, which
            HuntStack absolutely positions over this row at z-20. Without it
            "30 days left" ran under the shield and was read as "30 day" --
            the text was never truncated, so nothing in the DOM showed it was
            covered and only a screenshot caught it. */}
        <div className="mt-auto flex items-center gap-3 pe-11 font-body text-xs text-muted-foreground">
          {(item.city || item.distance) && (
            <span className="flex min-w-0 items-center gap-1">
              <Icon name="MapPin" size={12} aria-hidden="true" className="shrink-0" />
              <span className="truncate">
                {[item.city, item.distance].filter(Boolean).join(' · ')}
              </span>
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
