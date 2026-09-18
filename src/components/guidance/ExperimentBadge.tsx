import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { bucketFor } from '@/lib/analytics'
import { useExperiments } from '@/lib/experiments'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

/** Which experiments are live, and which arm THIS account is in.
 *
 *  Gated on profiles.show_ab_badge (046), NOT on is_staff. The two are
 *  deliberately separate: is_staff also grants the moderation queue, the
 *  analytics of every user, and RLS read access to held listings, which is a
 *  great deal of authority to hand someone who only needs to know whether
 *  they are looking at variant A or B.
 *
 *  Anyone with the flag knows they are in an experiment and is therefore no
 *  longer a clean sample. That is fine while people are checking the wiring
 *  by hand, and not fine once a result is meant to mean something -- turn it
 *  off before reading numbers you intend to act on.
 *
 *  Deliberately not translated: it is a debugging instrument, not product
 *  copy. Without it a variant is indistinguishable from a bug -- you cannot
 *  tell "B is showing correctly" from "A is broken", which makes every test
 *  impossible to check by hand.
 *
 *  It recomputes the bucket with the same function the app uses rather than
 *  reporting what some screen decided, so what it shows is what
 *  useExperiment() will return anywhere else for this user.
 */
export function ExperimentBadge() {
  const userId = useAuthStore((s) => s.session?.user?.id)
  const { data: experiments = [] } = useExperiments()
  const [open, setOpen] = useState(false)

  /** Own row only -- profiles_own_read (008) means a client can read its own
   *  profile and nobody else's, so this can never report someone else's flag.
   *  Separate query key from ['staff'], or the two would share a cache entry
   *  and whichever loaded first would answer for both. */
  const { data: showBadge = false } = useQuery({
    queryKey: ['ab-badge', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles').select('show_ab_badge').eq('id', userId!).maybeSingle()
      if (error) throw error
      return Boolean(data?.show_ab_badge)
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  })

  const running = experiments.filter((e) => e.status === 'running')

  // Flag off, or nothing running: render nothing at all. A debug affordance
  // sitting empty on every screen is just clutter.
  if (!showBadge || !userId || running.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 print:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto flex max-w-full flex-col gap-1 rounded-card-sm border border-accent/50 bg-card/95 px-3 py-2 text-left shadow-float backdrop-blur-sm"
      >
        <span className="flex items-center gap-2">
          {/* On the accent fill, not accent-coloured text on the card: at
              10px on a dark surface the tinted text was barely legible. */}
          <span className="shrink-0 rounded-pill bg-accent px-1.5 py-0.5 font-display text-[10px] font-bold uppercase tracking-[0.12em] text-accent-foreground">
            A/B
          </span>
          {running.map((e) => {
            const variant = bucketFor(userId, e.key, e.split)
            return (
              <span
                key={e.key}
                className={cn(
                  'rounded-pill px-2 py-0.5 font-display text-[11px] font-semibold',
                  // B is the new thing, and the one worth spotting at a
                  // glance. A is the control and stays quiet.
                  variant === 'b'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-foreground/[0.08] text-muted-foreground',
                )}
              >
                {e.key} · {variant.toUpperCase()}
              </span>
            )
          })}
        </span>

        {open && (
          <span className="flex flex-col gap-1.5 pt-1">
            {running.map((e) => {
              const variant = bucketFor(userId, e.key, e.split)
              return (
                <span key={e.key} className="flex flex-col">
                  <span className="font-body text-[11px] text-foreground">
                    {e.key}: you are in <strong>{variant.toUpperCase()}</strong>
                    {variant === 'b' ? ' (the new version)' : ' (as it is now)'}
                  </span>
                  <span className="font-body text-[11px] text-muted-foreground">
                    {e.split}% of people see B · goal: {e.goal_event}
                  </span>
                  {e.description && (
                    <span className="font-body text-[11px] text-muted-foreground">
                      {e.description}
                    </span>
                  )}
                </span>
              )
            })}
            <span className="font-body text-[10px] text-muted-foreground">
              Only accounts with the tester flag see this.
            </span>
          </span>
        )}
      </button>
    </div>
  )
}
