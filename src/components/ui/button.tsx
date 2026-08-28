import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/** shadcn Button, branded for Bartefy.
 *
 *  The stock shadcn variant set is replaced by the three the brand allows:
 *  primary (green), accent (brass), ghost (outline). There is deliberately no
 *  `destructive` — Bartefy has no red buttons; a destructive action is a ghost
 *  button with plain copy ("Something's wrong").
 *
 *  Stock shadcn names are kept as aliases so components copied from the shadcn
 *  registry keep working: default → primary, outline/secondary → ghost.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-display font-semibold ' +
    'transition-colors duration-fast ease-brand focus-visible:outline-none focus-visible:ring-[3px] ' +
    'focus-visible:ring-ring/45 disabled:cursor-not-allowed disabled:opacity-60 ' +
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:bg-[var(--green-hover)] active:bg-[var(--green-press)]',
        accent:
          'bg-accent text-accent-foreground hover:bg-[var(--brass-hover)] active:bg-[#DCA968]',
        ghost:
          'border-[1.5px] border-border/[0.14] text-foreground hover:bg-foreground/[0.06] active:bg-foreground/[0.10]',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'min-h-9 px-4 text-sm',
        md: 'min-h-hit px-6 text-base',
        lg: 'min-h-[52px] px-8 text-[17px]',
        icon: 'size-hit shrink-0',
      },
      pill: { true: 'rounded-pill', false: 'rounded' },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md', pill: true },
  },
)

/** What callers may pass. The right-hand names are legacy aliases. */
type ButtonVariant = 'primary' | 'accent' | 'ghost' | 'link' | 'default' | 'outline' | 'secondary' | 'destructive'

const VARIANT_ALIASES: Record<string, 'primary' | 'accent' | 'ghost' | 'link'> = {
  default: 'primary',
  outline: 'ghost',
  secondary: 'ghost',
  destructive: 'ghost',
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<VariantProps<typeof buttonVariants>, 'variant'> {
  variant?: ButtonVariant
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size, pill, fullWidth, asChild = false, ...props }, ref) => {
    if (import.meta.env.DEV && variant === 'destructive') {
      console.warn('[Button] Bartefy has no red buttons — use variant="ghost" with plain copy.')
    }
    const resolved = VARIANT_ALIASES[variant] ?? (variant as 'primary' | 'accent' | 'ghost' | 'link')
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant: resolved, size, pill, fullWidth }), className)}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
