import { InfoHint } from '@/components/guidance/InfoHint'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** Read-only wishes, tinted green so they never read as filters.
 *  matchCount drives the line that turns browsing into an offer.
 */
export function WantsRow({
  wants,
  matchCount = 0,
  label = 'item.wants',
  className,
}: {
  wants: string[]
  matchCount?: number
  /** Translation key. */
  label?: string
  className?: string
}) {
  const { t } = useT()

  if (wants.length === 0) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <span
          data-i18n="item.wantsOpen"
          className="font-body text-sm italic text-muted-foreground"
        >
          {t('item.wantsOpen')}
        </span>
        <InfoHint k="help.whyWants" />
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center gap-1.5">
        <span
          data-i18n={label}
          className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground"
        >
          {t(label)}
        </span>
        <InfoHint k="help.whyWants" />
      </div>
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
          {t('browse.resultCount', { count: matchCount })}
        </span>
      )}
    </div>
  )
}
