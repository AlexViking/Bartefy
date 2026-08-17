import { cn } from '@/lib/utils'

/** Read-only rating display. */
export function Stars({ value, size = 18, className }: { value: number; size?: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-1 leading-none text-accent', className)} style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(value) ? undefined : 'text-foreground/[0.14]'}>
          {'\u2605'}
        </span>
      ))}
    </div>
  )
}

/** Rating input. Optional by design - confirmation is required, stars are not. */
export function StarsInput({
  value,
  onChange,
  size = 30,
}: {
  value: number
  onChange: (n: number) => void
  size?: number
}) {
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={n + ' of 5'}
          onClick={() => onChange(n)}
          className={cn(
            'min-h-hit min-w-hit leading-none transition-colors duration-fast ease-brand',
            n <= value ? 'text-accent' : 'text-foreground/[0.14] hover:text-accent/60',
          )}
          style={{ fontSize: size }}
        >
          {'\u2605'}
        </button>
      ))}
    </div>
  )
}
