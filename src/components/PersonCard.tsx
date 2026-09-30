import type * as React from 'react'

import { UserAvatar } from '@/components/ui/user-avatar'
import { T, useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** The person card -- all anyone sees when they tap a name (Alex,
 *  2026-09-28): photo, name, area, how many swaps they have finished. Never
 *  their finds, their points or their tier: finds reach people only through
 *  the random deck, and a list of someone's table would let people shop a
 *  person instead of a deck.
 *
 *  Built from profiles_public (name, home_city, completed_trades) -- the only
 *  view anyone can read about someone else. It has no photo or join date, so
 *  the card does not claim either.
 */
export function PersonCard({
  name,
  city,
  swaps,
  since,
  className,
  children,
}: {
  name: string
  city?: string | null
  swaps: number
  /** Year joined, when known (your own profile row has it). */
  since?: string
  className?: string
  children?: React.ReactNode
}) {
  const { t } = useT()
  return (
    <div className={cn('flex flex-col items-center rounded-2xl bg-card px-6 py-6 text-center ring-1 ring-input', className)}>
      <UserAvatar name={name || '?'} size="xl" />
      {/* A name and a city are user data. */}
      <p className="mt-3 font-display text-headline-md text-foreground">{name || t('desk.someone')}</p>
      {(city || since) && (
        <p className="font-body text-body-sm text-muted-foreground">
          {[city, since ? t('person.since', { year: since }) : null].filter(Boolean).join(' · ')}
        </p>
      )}
      <div className="mt-4 w-full rounded-card bg-background py-3">
        <p className="font-display text-[28px] font-bold leading-8 tabular-nums text-foreground">{swaps}</p>
        <T as="p" k="person.swapsDone" className="font-body text-body-sm text-muted-foreground" />
      </div>
      <T as="p" k="person.random" className="mt-4 max-w-[30ch] font-body text-[12px] leading-4 text-muted-foreground" />
      {children}
    </div>
  )
}
