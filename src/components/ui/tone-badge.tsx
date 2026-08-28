import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/** Status pill. Composes shadcn's Badge idiom but with Bartefy's tones.
 *
 *  Only these four exist, and they mean specific things:
 *    green      — settled, agreed, complete
 *    brass      — needs you; the thing to act on
 *    quiet      — informational, no action
 *    evidence   — a report is open; a human is looking at it
 *
 *  Terracotta, denim and sage are illustration accents and never appear here.
 */
const toneBadgeVariants = cva(
  'inline-flex items-center gap-1 rounded-pill px-2.5 py-1 font-display text-[13px] font-semibold whitespace-nowrap',
  {
    variants: {
      tone: {
        green: 'bg-primary/[0.12] text-primary',
        brass: 'bg-accent/[0.30] text-accent-foreground',
        quiet: 'bg-foreground/[0.06] text-muted-foreground',
        evidence: 'bg-destructive/[0.12] text-destructive',
      },
    },
    defaultVariants: { tone: 'quiet' },
  },
)

export interface ToneBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof toneBadgeVariants> {}

export function ToneBadge({ className, tone, ...props }: ToneBadgeProps) {
  return <span className={cn(toneBadgeVariants({ tone }), className)} {...props} />
}

/** Selectable filter chip — Browse categories, taste picker, wants list. */
export function Chip({
  active = false,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-9 items-center rounded-pill border-[1.5px] px-3.5',
        'font-display text-[15px] font-semibold transition-colors duration-fast ease-brand',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border/[0.14] bg-card text-foreground hover:bg-foreground/[0.06]',
        className,
      )}
      {...props}
    />
  )
}

export { toneBadgeVariants }
