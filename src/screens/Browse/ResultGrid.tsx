import { Masonry, MasonryPhoto } from '@/components/ui/masonry'
import { ToneBadge } from '@/components/ui/tone-badge'
import { useT } from '@/i18n/T'
import type { BrowseItem } from './useBrowse'

/** The result grid, shared by both layouts. Only the column count differs,
 *  which is passed in rather than guessed from a breakpoint.
 *
 *  Masonry, so each find keeps the shape it was photographed in. A fixed
 *  aspect-[4/3] cell had to either crop the photo or pad it with bars, and
 *  listings are a mix of portrait, landscape and phone screenshots.
 */
export function ResultGrid({
  results,
  onOpen,
  columns,
}: {
  results: BrowseItem[]
  onOpen: (id: string) => void
  columns: 2 | 3 | 4
}) {
  const { t } = useT()
  return (
    <Masonry columns={columns} gap={12}>
      {results.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onOpen(r.id)}
          className="flex flex-col gap-2 rounded-lg border border-border/[0.14] bg-card p-3 text-left shadow-card transition-shadow duration-med ease-brand hover:shadow-float focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
        >
          <MasonryPhoto
            src={r.photoUrl}
            alt={t('a11y.photoOf', { title: r.title })}
            fallbackColor={r.photoColor}
          >
            {r.isNew && (
              <ToneBadge tone="brass" className="absolute left-2 top-2">
                {t('browse.sortNewest')}
              </ToneBadge>
            )}
          </MasonryPhoto>
          <span className="font-display text-base font-semibold text-foreground">{r.title}</span>
          <span className="font-body text-sm text-muted-foreground">
            {r.owner} {'·'} {r.distance}
          </span>
        </button>
      ))}
    </Masonry>
  )
}
