import { ToneBadge } from '@/components/ui/tone-badge'
import { useT } from '@/i18n/T'
import type { BrowseItem } from './useBrowse'
import { cn } from '@/lib/utils'

/** The result grid, shared by both layouts. Only the column count differs,
 *  which is passed in rather than guessed from a breakpoint.
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
    <div
      className={cn(
        'grid gap-3',
        columns === 2 && 'grid-cols-2',
        columns === 3 && 'grid-cols-3',
        columns === 4 && 'grid-cols-4',
      )}
    >
      {results.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onOpen(r.id)}
          className="flex flex-col gap-2 rounded-lg border border-border/[0.14] bg-card p-3 text-left shadow-card transition-shadow duration-med ease-brand hover:shadow-float focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45"
        >
          <span
            className="relative block aspect-[4/3] w-full overflow-hidden rounded-sm"
            style={{ background: r.photoColor }}
          >
            {r.photoUrl && (
              <img
                src={r.photoUrl}
                alt={t('a11y.photoOf', { title: r.title })}
                loading="lazy"
                className="size-full object-contain"
              />
            )}
            {r.isNew && (
              <ToneBadge tone="brass" className="absolute left-2 top-2">
                {t('browse.sortNewest')}
              </ToneBadge>
            )}
          </span>
          <span className="font-display text-base font-semibold text-foreground">{r.title}</span>
          <span className="font-body text-sm text-muted-foreground">
            {r.owner} {'·'} {r.distance}
          </span>
        </button>
      ))}
    </div>
  )
}
