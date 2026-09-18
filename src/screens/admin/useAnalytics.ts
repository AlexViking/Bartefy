import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import type { Experiment } from '@/lib/experiments'

/** Everything /admin/analytics reads, with no layout in it.
 *
 *  Every number comes from a SECURITY DEFINER RPC that checks is_staff in SQL
 *  (migration 044). The gate below is for the UI only -- so a non-staff user
 *  sees a refusal rather than an empty page. It is not the security boundary,
 *  and the RPCs would refuse even if this check were deleted.
 */

export interface FunnelStep { step: string; ord: number; users: number }
export interface Retention {
  dau: number; wau: number; mau: number
  streak_2plus: number; streak_7plus: number; best_streak: number; tracked: number
}
export interface ActivityDay {
  day: string; swipes: number; offers: number; items: number; events: number
}
export interface EventTotal { name: string; total: number; users: number }
export interface VariantResult {
  variant: string; exposed: number; converted: number; conversion: number
}

export type Pane = 'funnel' | 'events' | 'experiments'

/** How many users per arm before a difference means anything.
 *
 *  Not a real power calculation -- that needs a baseline rate and a minimum
 *  detectable effect, which differ per test. It is a floor, and its job is to
 *  stop a 3-vs-1 result being read as a 3x win. Detecting a realistic shift
 *  (say 20% -> 26%) actually needs roughly 900 per arm; this threshold is
 *  deliberately far below that so the page says "early" rather than
 *  "significant" for a long time.
 */
export const MIN_PER_ARM = 100

export function useAnalytics() {
  const userId = useAuthStore((s) => s.session?.user?.id)
  const qc = useQueryClient()
  const [pane, setPane] = useState<Pane>('funnel')
  const [days, setDays] = useState(30)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  /** Staff gate for the UI. Loading is distinguished from "not staff": a
   *  refusal shown while the answer is in flight tells a moderator they have
   *  no access every time they open the page. */
  const { data: isStaff, isLoading: checkingStaff } = useQuery({
    queryKey: ['staff', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles').select('is_staff').eq('id', userId!).maybeSingle()
      if (error) throw error
      return Boolean(data?.is_staff)
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  })

  const enabled = !!userId && isStaff === true

  const funnel = useQuery({
    queryKey: ['admin', 'funnel', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_funnel', { p_days: days })
      if (error) throw error
      return (data ?? []) as FunnelStep[]
    },
    enabled,
  })

  const retention = useQuery({
    queryKey: ['admin', 'retention'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_retention')
      if (error) throw error
      // A set-returning function comes back as an array even when it returns
      // exactly one row.
      return (Array.isArray(data) ? data[0] : data) as Retention
    },
    enabled,
  })

  const activity = useQuery({
    queryKey: ['admin', 'activity', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_activity', {
        p_days: Math.min(days, 30),
      })
      if (error) throw error
      return (data ?? []) as ActivityDay[]
    },
    enabled,
  })

  const events = useQuery({
    queryKey: ['admin', 'events', days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_events', { p_days: days })
      if (error) throw error
      return (data ?? []) as EventTotal[]
    },
    enabled,
  })

  const experiments = useQuery({
    queryKey: ['admin', 'experiments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('experiments')
        .select('key, status, split, goal_event, description')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Experiment[]
    },
    enabled,
  })

  const activeKey = selectedKey ?? experiments.data?.[0]?.key ?? null

  const results = useQuery({
    queryKey: ['admin', 'experiment-results', activeKey],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_experiment_results', {
        p_key: activeKey!,
      })
      if (error) throw error
      return (data ?? []) as VariantResult[]
    },
    enabled: enabled && !!activeKey,
  })

  /** Create a test.
   *
   *  Always born as 'draft', never running: an experiment that started the
   *  moment it was typed would begin splitting real users before anyone had
   *  checked the key matches what the code actually asks for.
   *
   *  The key is the contract with the code -- useExperiment('<key>') -- so it
   *  is normalised here to the shape the codebase uses for identifiers, and a
   *  clash is reported rather than silently overwriting a running test.
   */
  const create = useMutation({
    mutationFn: async (input: {
      key: string
      goal_event: string
      split: number
      description: string
    }) => {
      const key = input.key.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_')
      if (!key) throw new Error('empty key')
      const { error } = await supabase.from('experiments').insert({
        key,
        goal_event: input.goal_event.trim(),
        split: Math.min(100, Math.max(0, Math.round(input.split))),
        description: input.description.trim() || null,
        status: 'draft',
      }).select()
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'experiments'] })
      void qc.invalidateQueries({ queryKey: ['experiments'] })
    },
  })

  /** Move the split.
   *
   *  Safe to change WHILE a test runs, because assignment is hashed rather
   *  than stored -- there are no rows to rewrite. It does mean some people
   *  cross from one arm to the other, so the honest use is ramping a rollout
   *  (10 -> 50 -> 100), not nudging the split to chase a result. */
  const setSplit = useMutation({
    mutationFn: async ({ key, split }: { key: string; split: number }) => {
      const { error } = await supabase
        .from('experiments')
        .update({ split: Math.min(100, Math.max(0, Math.round(split))) })
        .eq('key', key)
        .select()
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'experiments'] })
      void qc.invalidateQueries({ queryKey: ['experiments'] })
    },
  })

  /** Delete a test.
   *
   *  The events it produced are NOT deleted: they are the record of what
   *  happened, and removing the registry row must not rewrite history. Those
   *  rows keep their experiment/variant stamp and simply stop being joined to
   *  a live experiment. */
  const remove = useMutation({
    mutationFn: async (key: string) => {
      const { error } = await supabase.from('experiments').delete().eq('key', key).select()
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'experiments'] })
      void qc.invalidateQueries({ queryKey: ['experiments'] })
    },
  })

  /** Start or stop a test. One column, no deploy -- which is the whole point
   *  of keeping status in the database rather than in the bundle. */
  const setStatus = useMutation({
    mutationFn: async ({ key, status }: { key: string; status: Experiment['status'] }) => {
      const patch: Record<string, unknown> = { status }
      if (status === 'running') patch.started_at = new Date().toISOString()
      if (status === 'stopped') patch.stopped_at = new Date().toISOString()
      const { error } = await supabase
        .from('experiments').update(patch).eq('key', key).select()
      if (error) throw error
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'experiments'] })
      // The app-wide registry too, or a running test keeps its old status in
      // every other screen until its five-minute cache expires.
      void qc.invalidateQueries({ queryKey: ['experiments'] })
    },
  })

  return {
    isStaff, checkingStaff,
    pane, setPane,
    days, setDays,
    funnel: funnel.data ?? [],
    retention: retention.data,
    activity: activity.data ?? [],
    events: events.data ?? [],
    experiments: experiments.data ?? [],
    results: results.data ?? [],
    activeKey, setSelectedKey,
    loading: funnel.isLoading || retention.isLoading,
    setStatus: (key: string, status: Experiment['status']) =>
      setStatus.mutate({ key, status }),
    create: create.mutate,
    createError: create.error ? String(create.error.message ?? create.error) : null,
    setSplit: (key: string, split: number) => setSplit.mutate({ key, split }),
    remove: remove.mutate,
    saving:
      setStatus.isPending || create.isPending || setSplit.isPending || remove.isPending,
  }
}
