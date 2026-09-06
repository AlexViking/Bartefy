import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { ToneBadge } from '@/components/ui/tone-badge'
import { UserAvatar } from '@/components/ui/user-avatar'
import { useT } from '@/i18n/T'
import { categoryLabel } from '@/lib/taxonomy'
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
}: {
  item: CardItem
  eyeing?: number
  /** Open the photos full screen. Omitted where there is nowhere to open. */
  onExpand?: (index: number) => void
  className?: string
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

  const step = (dir: number) =>
    setIndex((i) => (photos.length ? (i + dir + photos.length) % photos.length : 0))

  return (
    // 3:4 overall with the photo taking 62%, per V5. The old card was 4:3 --
    // landscape -- which on a phone left the deck short and wide and made the
    // stack look like a list of banners rather than cards you pick up.
    <Card
      className={cn(
        'flex aspect-[3/4] w-full flex-col overflow-hidden rounded-hero border-0 bg-card shadow-float',
        className,
      )}
    >
      <div className="relative h-[62%] w-full shrink-0" style={{ background: item.photoColor }}>
        {photos[index] && (
          <img
            src={photos[index]}
            alt={t('a11y.photoOf', { title: item.title })}
            loading="lazy"
            className="size-full object-cover"
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
          <ToneBadge tone="quiet" className="bg-card/90 backdrop-blur-sm">
            {item.condition}
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

      <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-4">
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
          <p className="line-clamp-2 font-body text-sm text-muted-foreground">
            {item.description}
          </p>
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
            whether this swap can actually happen. */}
        <div className="mt-auto flex items-center gap-3 font-body text-xs text-muted-foreground">
          {(item.city || item.distance) && (
            <span className="flex min-w-0 items-center gap-1">
              <Icon name="MapPin" size={12} aria-hidden="true" className="shrink-0" />
              <span className="truncate">
                {[item.city, item.distance].filter(Boolean).join(' · ')}
              </span>
            </span>
          )}
          {item.daysLeft != null && (
            <span data-i18n="profile.daysLeft" className="ml-auto shrink-0">
              {t('profile.daysLeft', { count: item.daysLeft })}
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}
