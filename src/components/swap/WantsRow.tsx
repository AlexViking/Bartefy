import { cn } from '@/lib/utils'

/** Read-only wishes, tinted green so they never read as filters.
 *  matchCount drives the line that turns browsing into an offer.
 */
export function WantsRow({
  wants,
  matchCount = 0,
  label = 'Looking for',
  className,
}: {
  wants: string[]
  matchCount?: number
  label?: string
  className?: string
}) {
  if (wants.length === 0) return null

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {wants.map((w) => (
          <span
            key={w}
            className="rounded-pill bg-primary/[0.08] px-2.5 py-1 font-body text-xs font-semibold text-primary"
          >
            {w}
          </span>
        ))}
      </div>
      {matchCount > 0 && (
        <span className="font-body text-sm font-semibold text-primary">
          You have {matchCount} {matchCount === 1 ? 'find' : 'finds'} they are asking for.
        </span>
      )}
    </div>
  )
}
