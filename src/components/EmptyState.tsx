import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Every list gets one: art slot, a plain sentence, one action out.
 *  Never a dead end - an empty-feeling screen is a layout problem, not a gap.
 */
export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  art,
  className,
}: {
  title: string
  body?: string
  actionLabel?: string
  onAction?: () => void
  secondaryLabel?: string
  onSecondary?: () => void
  /** Illustration slot. Real hand-drawn art goes here when it exists. */
  art?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-10 text-center', className)}>
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-secondary">
        {art ?? <span className="font-body text-xs text-muted-foreground">art</span>}
      </div>
      <h3 className="font-display text-h3 text-foreground">{title}</h3>
      {body && <p className="max-w-[34ch] font-body text-[15px] text-muted-foreground">{body}</p>}
      <div className="mt-1 flex flex-wrap justify-center gap-2">
        {actionLabel && <Button size="sm" onClick={onAction}>{actionLabel}</Button>}
        {secondaryLabel && (
          <Button size="sm" variant="ghost" onClick={onSecondary}>
            {secondaryLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
