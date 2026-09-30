import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

/** shadcn Button, branded for Bartefy.
 *
 *  The stock shadcn variant set is replaced by the three the brand allows:
 *  primary (Green), accent (Coral, Ink text), ghost (white, Stone edge). There is deliberately no
 *  `destructive` — Bartefy has no red buttons; a destructive action is a ghost
 *  button with plain copy ("Something's wrong").
 *
 *  Stock shadcn names are kept as aliases so components copied from the shadcn
 *  registry keep working: default → primary, outline/secondary → ghost.
 */
const buttonVariants = cva(
  // V6 mock: Figtree label-lg (14px bold), 44px tall, 12px corners.
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-body font-bold tracking-[0.02em] ' +
    'transition-colors duration-fast ease-brand focus-visible:outline-none focus-visible:ring-[3px] ' +
    'focus-visible:ring-ring/45 disabled:cursor-not-allowed disabled:opacity-60 ' +
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground hover:brightness-90 active:brightness-[0.8]',
        accent:
          'bg-accent text-accent-foreground hover:brightness-95 active:brightness-90',
        ghost:
          'border border-input bg-card text-foreground hover:bg-background active:bg-secondary',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'min-h-9 px-3 text-[12px] leading-4',
        md: 'min-h-hit px-5 text-[14px] leading-5',
        lg: 'min-h-12 px-6 text-[15px] leading-5',
        icon: 'size-hit shrink-0',
      },
      pill: { true: 'rounded-pill', false: 'rounded-card' },
      fullWidth: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md', pill: false },
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
