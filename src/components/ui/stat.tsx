import * as React from 'react'
import { cn } from '@/lib/utils'

/** Number + kicker. Profiles, closed swaps, membership. */
export function Stat({
  value,
  label,
  className,
}: {
  value: React.ReactNode
  label: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-0.5', className)}>
      <span className="font-display text-2xl font-bold leading-none text-foreground">{value}</span>
      <span className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
    </div>
  )
}
