import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

export type QueueStatus = 'open' | 'reviewing' | 'resolved'

export type ReportRow = {
  id: string
  reason: string
  status: string
  createdAt: string
  note: string | null
  reporterId: string
  aboutUserId: string | null
  /** Free-text evidence the reporter attached. Storage paths, not URLs. */
  evidence: string[]
}

export type HeldItem = {
  id: number
  title: string
  image?: string
  ownerId: string
  createdAt: string
  /** 'pending' -- never reviewed; 'held' -- a moderator pulled it back. The
   *  actions are the same either way, but the queue says which it is. */
  moderationStatus: string
}

type Row = Record<string, unknown>

/** The moderation queue.
 *
 *  Two lists, because the screen answers two different questions: reports a
 *  person filed about someone, and items the AI check held before publishing.
 *
 *  Nothing here decides anything automatically. Every outcome is a human
 *  pressing a button, which is the rule the scope contract states and the
 *  reason this screen exists at all rather than a cron job.
 */
export function useReportQueue() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.session?.user?.id)
  const [status, setStatus] = useState<QueueStatus>('open')
  const [selected, setSelected] = useState<string | null>(null)
  const [note, setNote] = useState('')

  /** Am I staff? The gate is a real column, checked against the server.
   *
   *  Loading is deliberately distinguished from "not staff": showing the
   *  refusal while the answer is still in flight tells a moderator they have
   *  no access every single time they open the page.
   */
  const { data: isStaff, isLoading: checkingStaff } = useQuery({
    queryKey: ['staff', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_staff')
        .eq('id', userId!)
        .maybeSingle()
      if (error) throw error
      return Boolean(data?.is_staff)
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  })

  const reports = useQuery({
    queryKey: ['admin', 'reports', status],
    queryFn: async () => {
      // Columns are read from the real table, not from what the screen wished
      // it had: reports has about_user and evidence_paths, and no link to an
      // item at all -- a report is filed about a person or a swap.
      const { data, error } = await supabase
        .from('reports')
        .select('id, reason, status, created_at, note, from_user, about_user, evidence_paths')
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return (data ?? []).map((r: Row): ReportRow => ({
        id: String(r.id),
        reason: String(r.reason ?? ''),
        status: String(r.status ?? 'open'),
        createdAt: String(r.created_at ?? ''),
        note: (r.note as string) ?? null,
        reporterId: String(r.from_user ?? ''),
        aboutUserId: (r.about_user as string) ?? null,
        evidence: Array.isArray(r.evidence_paths) ? (r.evidence_paths as string[]) : [],
      }))
    },
    enabled: !!isStaff,
  })

  /** Items the AI check held. They are not in anyone's deck until a human
   *  says otherwise, so this list is the only thing standing between a held
   *  photo and it never being seen again. */
  const held = useQuery({
    queryKey: ['admin', 'held'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('id, title, images, user_id, created_at, moderation_status')
        // Both states a human still has to act on. 'pending' is a new
        // listing nobody has looked at yet -- since migration 028 that is
        // every listing -- and 'held' is one a moderator pulled back. The
        // screen shows them in one queue because the decision is the same.
        .in('moderation_status', ['pending', 'held'])
        .order('created_at', { ascending: true })
        .limit(100)
      if (error) throw error
      return (data ?? []).map((r: Row): HeldItem => {
        const images = Array.isArray(r.images) ? (r.images as string[]) : []
        return {
          id: Number(r.id),
          title: String(r.title ?? ''),
          image: images[0],
          ownerId: String(r.user_id ?? ''),
          createdAt: String(r.created_at ?? ''),
          moderationStatus: String(r.moderation_status ?? 'pending'),
        }
      })
    },
    enabled: !!isStaff,
  })

  const resolveReport = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: 'reviewing' | 'resolved' }) => {
      const { error } = await supabase
        .from('reports')
        .update({ status: next })
        .eq('id', id)
        .select()
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  })

  /** Publish or remove a held item. This is the only place in the app where a
   *  removal happens, and even here it is a status change, never a delete. */
  const decideItem = useMutation({
    mutationFn: async ({ id, publish }: { id: number; publish: boolean }) => {
      const { error } = await supabase
        .from('items')
        .update(
          publish
            ? { moderation_status: 'ok' }
            : { moderation_status: 'held', status: 'removed' },
        )
        .eq('id', id)
        .select()
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  })

  const rows = reports.data ?? []

  return {
    isStaff: !!isStaff,
    checkingStaff,
    status,
    setStatus,
    rows,
    current: rows.find((r) => r.id === selected) ?? rows[0] ?? null,
    select: setSelected,
    held: held.data ?? [],
    isLoading: reports.isLoading || held.isLoading,
    note,
    setNote,
    review: (id: string) => resolveReport.mutate({ id, next: 'reviewing' }),
    resolve: (id: string) => resolveReport.mutate({ id, next: 'resolved' }),
    publishItem: (id: number) => decideItem.mutate({ id, publish: true }),
    removeItem: (id: number) => decideItem.mutate({ id, publish: false }),
    busy: resolveReport.isPending || decideItem.isPending,
    goBack: () => navigate('/profile'),
  }
}
