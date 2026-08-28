import { Check } from 'lucide-react'

import { useT } from '@/i18n/T'
import { useIsDesktop } from '@/lib/platform'
import { cn } from '@/lib/utils'

export interface FlowStep {
  id: string
  /** Translation key for the step's short label. */
  label: string
}

/** Shows where someone is in a multi-step flow and what is still ahead.
 *
 *  Used by onboarding, listing a find, and arranging a swap. Desktop shows the
 *  labelled track; mobile shows dots plus "Step 2 of 4", because four labels
 *  will not fit a phone without shrinking type below the 15px floor.
 */
export function FlowSteps({
  steps,
  current,
  className,
}: {
  steps: FlowStep[]
  /** Zero-based index of the active step. */
  current: number
  className?: string
}) {
  const { t } = useT()
  const isDesktop = useIsDesktop()
  const total = steps.length

  if (!isDesktop) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <div className="flex gap-1.5" aria-hidden="true">
          {steps.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                'h-1.5 rounded-pill transition-all duration-med ease-brand',
                i === current ? 'w-6 bg-primary' : 'w-1.5',
                i < current ? 'bg-primary/45' : i > current ? 'bg-foreground/[0.14]' : '',
              )}
            />
          ))}
        </div>
        <span
          data-i18n="common.stepOf"
          className="font-display text-[13px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
        >
          {t('common.stepOf', { current: current + 1, total })}
        </span>
      </div>
    )
  }

  return (
    <ol className={cn('flex items-center gap-2', className)}>
      {steps.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-pill',
                'font-display text-[13px] font-bold transition-colors duration-med ease-brand',
                done && 'bg-primary text-primary-foreground',
                active && 'bg-primary text-primary-foreground',
                !done && !active && 'bg-foreground/[0.08] text-muted-foreground',
              )}
              aria-hidden="true"
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              data-i18n={s.label}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'font-display text-[15px] whitespace-nowrap',
                active ? 'font-semibold text-foreground' : 'text-muted-foreground',
              )}
            >
              {t(s.label)}
            </span>
            {i < total - 1 && (
              <span aria-hidden="true" className="mx-1 h-px w-8 bg-foreground/[0.14]" />
            )}
          </li>
        )
      })}
    </ol>
  )
}
