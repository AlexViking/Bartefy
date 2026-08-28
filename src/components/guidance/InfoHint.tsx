import { Info } from 'lucide-react'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useIsDesktop } from '@/lib/platform'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** The small ⓘ that sits beside anything a first-time swapper might not get.
 *
 *  Desktop hovers a tooltip; touch has no hover, so mobile taps open a popover
 *  instead. Same key, same copy, right interaction for the platform.
 *
 *      <InfoHint k="help.whyWants" />
 */
export function InfoHint({
  k,
  className,
  side = 'top',
}: {
  /** Translation key for the explanation, e.g. "help.whyWants". */
  k: string
  className?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
}) {
  const isDesktop = useIsDesktop()
  const { t } = useT()
  const label = t(k)

  const trigger = (
    <button
      type="button"
      aria-label={t('common.moreInfo')}
      className={cn(
        'inline-flex size-5 shrink-0 items-center justify-center rounded-pill align-middle',
        'text-muted-foreground transition-colors duration-fast ease-brand',
        'hover:bg-foreground/[0.06] hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45',
        className,
      )}
    >
      <Info className="size-[15px]" aria-hidden="true" />
    </button>
  )

  const body = (
    <p data-i18n={k} className="font-body text-sm leading-relaxed">
      {label}
    </p>
  )

  if (!isDesktop) {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent side={side} className="max-w-[280px] rounded bg-popover p-3 shadow-float">
          {body}
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent side={side} className="max-w-[280px] rounded bg-popover p-3 text-popover-foreground shadow-float">
          {body}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/** A label with its explanation attached — the pairing used on every form
 *  field and section heading that benefits from a word of context. */
export function LabelWithHint({
  label,
  hint,
  htmlFor,
  required,
  className,
}: {
  /** Translation key for the visible label. */
  label: string
  /** Translation key for the ⓘ explanation. Omit for no hint. */
  hint?: string
  htmlFor?: string
  required?: boolean
  className?: string
}) {
  const { t } = useT()
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <label
        htmlFor={htmlFor}
        data-i18n={label}
        className="font-display text-[15px] font-semibold text-foreground"
      >
        {t(label)}
      </label>
      {required && (
        <span aria-label={t('a11y.required')} className="text-muted-foreground">
          *
        </span>
      )}
      {hint && <InfoHint k={hint} />}
    </div>
  )
}
