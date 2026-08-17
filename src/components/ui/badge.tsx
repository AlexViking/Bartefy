import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/** Badge — read-only state. Drop-in for src/components/Badge.tsx: `color` and
 *  `bg` still work as an escape hatch, but prefer `tone`, so state colors stay
 *  countable across the app.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-pill px-3 py-[5px] font-display text-xs font-bold uppercase tracking-[0.14em]',
  {
    variants: {
      tone: {
        green: 'bg-primary text-primary-foreground',
        brass: 'bg-accent text-accent-foreground',
        quiet: 'bg-secondary text-secondary-foreground',
        terracotta: 'bg-illo-terracotta text-white',
        denim: 'bg-illo-denim text-white',
      },
    },
    defaultVariants: { tone: 'quiet' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** @deprecated use `tone` */
  color?: string;
  /** @deprecated use `tone` */
  bg?: string;
}

export function Badge({ className, tone, color, bg, style, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ tone }), className)}
      style={color || bg ? { color, background: bg, ...style } : style}
      {...props}
    />
  );
}

/** Tag — interactive pill: filters, taste picks, rating tags.
 *  Drop-in for src/components/Tag.tsx; `selected` still accepted.
 */
export interface TagProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect'> {
  active?: boolean;
  /** @deprecated use `active` */
  selected?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
}

export const Tag = React.forwardRef<HTMLButtonElement, TagProps>(
  ({ className, active, selected, onSelect, onRemove, children, ...props }, ref) => {
    const on = active ?? selected ?? false;
    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={on}
        onClick={onSelect}
        className={cn(
          'inline-flex min-h-hit items-center gap-1.5 rounded-pill border-[1.5px] px-4 font-body text-sm font-medium leading-tight transition-colors duration-fast ease-brand',
          on
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border/[0.14] bg-card text-foreground hover:bg-secondary',
          className,
        )}
        {...props}
      >
        {children}
        {onRemove && (
          <span
            role="button"
            aria-label="Remove"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="ml-0.5 text-base leading-none opacity-70 hover:opacity-100"
          >
            ×
          </span>
        )}
      </button>
    );
  },
);
Tag.displayName = 'Tag';

export { badgeVariants };
