import { useEffect, useState } from 'react'

import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** How long is left on an offer, counted down live.
 *
 *  Only ever rendered for a deadline the server actually enforces
 *  (migration 045: barter_offers.expires_at, and a pg_cron job that really
 *  does flip the row to 'expired'). A countdown on something that is not
 *  going anywhere is a lie the app only gets to tell once.
 *
 *  The clock is computed from expires_at rather than from a stored remainder,
 *  so a backgrounded tab, a sleeping phone and a clock change all resolve
 *  correctly on the next tick instead of drifting.
 */

/** Tick once a minute above an hour, once a second in the last. Ticking every
 *  second all day would re-render every row in the inbox 86,400 times to move
 *  a number almost nobody is watching. */
function intervalFor(msLeft: number) {
  return msLeft > 60 * 60 * 1000 ? 60_000 : 1_000
}

export function useTimeLeft(expiresAt: string | null | undefined) {
  const target = expiresAt ? new Date(expiresAt).getTime() : null
  const [now, setNow] = useState(() => Date.now())

  // setTimeout that reschedules itself, not setInterval: the cadence has to
  // change when the remaining time crosses the hour mark, and an interval
  // would need tearing down and rebuilding to do that. Each tick picks its own
  // next delay from what is actually left.
  useEffect(() => {
    if (!target) return
    let id: ReturnType<typeof setTimeout>

    const tick = () => {
      const left = target - Date.now()
      setNow(Date.now())
      // Stop at the deadline. A timer that keeps firing on an expired offer
      // re-renders the row forever for a number that will not change again.
      if (left <= 0) return
      id = setTimeout(tick, intervalFor(left))
    }

    const left = target - Date.now()
    if (left <= 0) return
    id = setTimeout(tick, intervalFor(left))
    return () => clearTimeout(id)
  }, [target])

  if (!target) return null
  return Math.max(0, target - now)
}

/** "4h 12m" / "6m 30s" / "Expired". Never a bare "0". */
export function formatLeft(
  ms: number,
  t: (k: string, v?: Record<string, string | number>) => string,
) {
  if (ms <= 0) return t('offers.expired')
  const totalMin = Math.floor(ms / 60_000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) return t('offers.leftHM', { h, m })
  const s = Math.floor((ms % 60_000) / 1000)
  return t('offers.leftMS', { m, s })
}

export function ExpiryCountdown({
  expiresAt,
  className,
}: {
  expiresAt: string | null | undefined
  className?: string
}) {
  const { t } = useT()
  const left = useTimeLeft(expiresAt)
  if (left == null) return null

  // The last hour is the only part worth colouring. Urgent styling from the
  // moment an offer arrives is just noise 23 hours out, and it leaves nothing
  // to escalate to when the deadline is actually close.
  const urgent = left > 0 && left <= 60 * 60 * 1000
  const gone = left <= 0

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-body text-xs tabular-nums',
        gone ? 'text-muted-foreground' : urgent ? 'text-destructive' : 'text-muted-foreground',
        className,
      )}
    >
      {/* Decorative: the text beside it already says the time. */}
      <span aria-hidden>⏱</span>
      {formatLeft(left, t)}
    </span>
  )
}
