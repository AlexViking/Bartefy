import * as React from 'react'

import { Button } from '@/components/ui/button'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** Every list gets one: art slot, a plain sentence, one action out.
 *  Never a dead end — an empty-feeling screen is a layout problem, not a gap.
 *
 *  All four text props are translation keys, not literal strings.
 */
export function EmptyState({
  title,
  body,
  bodyValues,
  actionLabel,
  actionValues,
  onAction,
  secondaryLabel,
  onSecondary,
  art,
  className,
}: {
  /** Translation key. */
  title: string
  /** Translation key. */
  body?: string
  bodyValues?: Record<string, string | number>
  /** Translation key. */
  actionLabel?: string
  actionValues?: Record<string, string | number>
  onAction?: () => void
  /** Translation key. */
  secondaryLabel?: string
  onSecondary?: () => void
  /** Illustration slot. Real hand-drawn art goes here when it exists. */
  art?: React.ReactNode
  className?: string
}) {
  const { t } = useT()
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-10 text-center', className)}>
      <div className="flex size-[72px] items-center justify-center rounded-pill bg-secondary">
        {art}
      </div>
      <h3 data-i18n={title} className="font-display text-h3 text-foreground">
        {t(title)}
      </h3>
      {body && (
        <p
          data-i18n={body}
          className="max-w-[34ch] font-body text-[15px] leading-relaxed text-muted-foreground"
        >
          {t(body, bodyValues)}
        </p>
      )}
      <div className="mt-1 flex flex-wrap justify-center gap-2">
        {actionLabel && (
          <Button size="sm" onClick={onAction} data-i18n={actionLabel}>
            {t(actionLabel, actionValues)}
          </Button>
        )}
        {secondaryLabel && (
          <Button size="sm" variant="ghost" onClick={onSecondary} data-i18n={secondaryLabel}>
            {t(secondaryLabel)}
          </Button>
        )}
      </div>
    </div>
  )
}
