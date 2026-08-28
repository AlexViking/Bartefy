import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { Icon, type IconName } from '@/components/ui/icon'
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

/** Selectable filter chip — Browse categories, taste picker, wants list.
 *
 *  `icon` is optional and decorative: the label is always present, so the
 *  shape is a second way to recognise a category rather than the only one.
 *  Fifteen identical pills are read word by word; with a shape in front, the
 *  right one is found before the word is.
 */
export function Chip({
  active = false,
  icon,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean
  icon?: IconName
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex min-h-9 items-center gap-1.5 rounded-pill border-[1.5px] px-3.5',
        'font-display text-[15px] font-semibold transition-colors duration-fast ease-brand',
        'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border/[0.14] bg-card text-foreground hover:bg-foreground/[0.06]',
        className,
      )}
      {...props}
    >
      {icon && <Icon name={icon} size={15} aria-hidden="true" className="shrink-0 opacity-80" />}
      {children}
    </button>
  )
}

export { toneBadgeVariants }
