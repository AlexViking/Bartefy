import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

import { bucketFor, setActiveExperiment, track, type EventName } from '@/lib/analytics'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

/** Which version of a feature this person sees, and the plumbing to find out
 *  whether it worked.
 *
 *  Assignment is computed, never stored -- see bucketFor in lib/analytics.ts
 *  for why hashing beats a stored coin flip.
 */

export interface Experiment {
  key: string
  status: 'draft' | 'running' | 'stopped'
  split: number
  goal_event: string
  description: string | null
}

/** All experiments, cached. One request per app load, not one per hook call:
 *  several screens may each ask about a different test, and the answer for
 *  all of them is in the same small table. */
export function useExperiments() {
  return useQuery({
    queryKey: ['experiments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiments')
        .select('key, status, split, goal_event, description')
      if (error) throw error
      return (data ?? []) as Experiment[]
    },
    // Five minutes: long enough that this is not a per-navigation request,
    // short enough that stopping a runaway test takes effect without anyone
    // having to reload the app.
    staleTime: 5 * 60_000,
  })
}

/** Which arm of `key` this user is in.
 *
 *  Returns 'a' -- the control, the existing behaviour -- for every case that
 *  is not an actively running test: unknown key, draft, stopped, signed out,
 *  or the registry still loading. That default is load-bearing. It means a
 *  typo in an experiment key, or a failed request, silently ships the
 *  behaviour that already existed rather than the new one, and switching a
 *  test off is a single row change with no deploy.
 */
export function useExperiment(key: string): 'a' | 'b' {
  const userId = useAuthStore((s) => s.session?.user?.id)
  const { data: experiments } = useExperiments()

  const exp = experiments?.find((e) => e.key === key)
  const variant: 'a' | 'b' =
    exp && exp.status === 'running' && userId
      ? bucketFor(userId, key, exp.split)
      : 'a'

  // Stamp the variant onto everything this user does while the test is live,
  // so no call site has to know an experiment exists. Cleared on unmount, or
  // a stale key would keep tagging events after the screen is gone.
  useEffect(() => {
    if (exp && exp.status === 'running' && userId) {
      setActiveExperiment({ key, variant })
      return () => setActiveExperiment(null)
    }
  }, [exp, key, userId, variant])

  return variant
}

/** Fire the goal for an experiment.
 *
 *  A thin wrapper over track() that exists to make the intent obvious at the
 *  call site -- `trackGoal('offer_sent')` reads as "this is the thing we are
 *  measuring", where a bare track() call does not.
 */
export function trackGoal(name: EventName, props: Record<string, unknown> = {}) {
  track(name, props)
}
