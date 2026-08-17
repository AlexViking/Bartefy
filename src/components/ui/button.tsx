import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/** Drop-in replacement for src/components/Button.tsx — same prop names, so no
 *  screen needs editing. Two real changes:
 *
 *  1. `danger` is gone. Bartefy has no red buttons; destructive actions are
 *     ghost buttons with plain copy ("Something's wrong"). Passing it falls
 *     back to ghost and warns in dev.
 *  2. Hover and press actually darken (the old inline styles could only fade
 *     opacity), matching the brand's hover/press rules.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-semibold ' +
    'transition-colors duration-fast ease-brand focus-visible:outline-none focus-visible:ring-[3px] ' +
    'focus-visible:ring-ring/45 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:bg-[var(--green-hover)] active:bg-[var(--green-press)]',
        accent:
          'bg-accent text-accent-foreground hover:bg-[var(--brass-hover)] active:bg-[#DCA968]',
        ghost:
          'border-[1.5px] border-border/[0.14] text-foreground hover:bg-foreground/[0.06] active:bg-foreground/[0.10]',
      },
      size: {
        sm: 'min-h-9 px-4 text-sm',
        md: 'min-h-hit px-6 text-base',
        lg: 'min-h-[52px] px-8 text-[17px]',
      },
      pill: { true: 'rounded-pill', false: 'rounded' },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md', pill: true },
  },
);

type Variant = 'primary' | 'ghost' | 'accent' | 'danger';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, 'variant'> {
  variant?: Variant;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size, pill, fullWidth, asChild = false, ...props }, ref) => {
    if (import.meta.env.DEV && variant === 'danger') {
      console.warn('[Button] `danger` is deprecated — use variant="ghost" with plain copy.');
    }
    const safeVariant = variant === 'danger' ? 'ghost' : variant;
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant: safeVariant, size, pill, fullWidth }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
