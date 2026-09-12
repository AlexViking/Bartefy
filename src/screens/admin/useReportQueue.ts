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
  /** The URL token. The row's own id stays the bigint for the hide/restore
   *  update, which keys on the primary key. */
  publicId: string
  description: string
  category: string
  city: string
  images: string[]
  /** Who listed it. Null only if the profile row is missing, which should not
   *  happen -- items.user_id is a foreign key. */
  owner: {
    id: string
    /** Empty when the account never typed one -- name is optional at signup. */
    name: string
    /** Always present. The fallback identity when there is no name. */
    email: string
    city: string
    trades: number
    suspendedAt: string | null
    /** When the account was created (auth.users.created_at). "40 listings on
     *  a day-old account" is a signal nothing else carries. */
    signedUpAt: string
    /** How many people have blocked them. The strongest signal that is not a
     *  report: people block quietly, long before they fill in a form. */
    blockedBy: number
    itemsTotal: number
    itemsHidden: number
    reportsAbout: number
  } | null
  /** 'ok' -- live and visible; 'held' -- a moderator hid it. */
  moderationStatus: string
  /** The listing's own lifecycle: active, traded, removed, expired. A traded
   *  item is not a moderation problem, and hiding one would be noise. */
  itemStatus: string
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

  /** Every listing, newest first.
   *
   *  People publish straight away -- there is no review gate -- so this is an
   *  audit feed rather than a queue: a moderator reads down it and hides
   *  anything against policy. That is also why it is NOT filtered to items
   *  needing action: the whole point is seeing what was uploaded, including
   *  the ones that are fine.
   *
   *  Newest first, because the only listing a moderator can act on before
   *  anyone sees it is the one that just arrived.
   *
   *  Reading every row depends on the staff SELECT policy in migration 028.
   *  Without it RLS hands a moderator only their own items and the screen
   *  looks empty rather than unauthorised. */
  const held = useQuery({
    queryKey: ['admin', 'uploads'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select(
          `id, public_id, title, description, images, user_id, created_at,
           moderation_status, status, category, location_city`,
        )
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error

      /** Who listed each find, in one batched lookup.
       *
       *  Not a PostgREST embed: items.user_id references auth.users, not
       *  profiles, so there is no constraint to embed across -- and a bad
       *  embed returns an empty array rather than an error, which would have
       *  shown every upload with no owner and looked like missing data.
       *
       *  profiles_public, not profiles: name, city and trade count are what a
       *  moderation decision needs. Email and push tokens are not, and the
       *  public view is what keeps them out of the bundle. */
      const rows = (data ?? []) as Row[]
      const ownerIds = [...new Set(rows.map((r) => String(r.user_id ?? '')).filter(Boolean))]
      const owners: Record<string, Record<string, unknown>> = {}
      if (ownerIds.length) {
        // profiles_moderation (030), not profiles_public: it carries the
        // email, the block counts and the suspension flag. "Someone" on every
        // row was accurate -- profiles.name is optional at signup -- but a
        // moderator still has to be able to identify the account.
        const { data: profiles, error: pErr } = await supabase
          .from('profiles_moderation')
          .select(
            `id, name, email, home_city, swap_count, suspended_at, signed_up_at,
             blocked_by_count, items_total, items_hidden, reports_about`,
          )
          .in('id', ownerIds)
        // A missing name is not worth failing the queue over, but it IS worth
        // logging: silence is how a screen ends up showing "Unknown" for
        // everyone and nobody finds out why.
        if (pErr) console.error('[admin] uploader lookup failed', pErr.message)
        for (const p of profiles ?? []) owners[String((p as Record<string, unknown>).id)] = p as Record<string, unknown>
      }

      return rows.map((r: Row): HeldItem => {
        const images = Array.isArray(r.images) ? (r.images as string[]) : []
        return {
          id: Number(r.id),
          title: String(r.title ?? ''),
          image: images[0],
          ownerId: String(r.user_id ?? ''),
          createdAt: String(r.created_at ?? ''),
          publicId: String(r.public_id ?? ''),
          description: r.description ? String(r.description) : '',
          category: r.category ? String(r.category) : '',
          city: r.location_city ? String(r.location_city) : '',
          images,
          owner: (() => {
            const o = owners[String(r.user_id ?? '')]
            return o
              ? {
                  id: String(o.id ?? ''),
                  name: o.name ? String(o.name) : '',
                  email: o.email ? String(o.email) : '',
                  city: o.home_city ? String(o.home_city) : '',
                  trades: Number(o.swap_count ?? 0),
                  suspendedAt: o.suspended_at ? String(o.suspended_at) : null,
                  signedUpAt: o.signed_up_at ? String(o.signed_up_at) : '',
                  blockedBy: Number(o.blocked_by_count ?? 0),
                  itemsTotal: Number(o.items_total ?? 0),
                  itemsHidden: Number(o.items_hidden ?? 0),
                  reportsAbout: Number(o.reports_about ?? 0),
                }
              : null
          })(),
          moderationStatus: String(r.moderation_status ?? 'ok'),
          itemStatus: String(r.status ?? 'active'),
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

  /** Hide a listing, or put a hidden one back.
   *
   *  Never a delete, in either direction. Hiding sets moderation_status to
   *  'held', which migration 028 taught get_feed to exclude, and marks the
   *  item removed so it leaves its owner's live tab too. Restoring undoes
   *  both, so a listing hidden by mistake comes back whole -- its photos, its
   *  age and anything already eyeing it survive, which a delete would not. */
  const decideItem = useMutation({
    mutationFn: async ({ id, publish }: { id: number; publish: boolean }) => {
      const { error } = await supabase
        .from('items')
        .update(
          publish
            ? { moderation_status: 'ok', status: 'active' }
            : { moderation_status: 'held', status: 'removed' },
        )
        .eq('id', id)
        .select()
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  })

  /** Suspend or reinstate an account.
   *
   *  Through an RPC, never a direct UPDATE: profiles' own-row update policy
   *  would otherwise let anyone clear their own suspension. set_suspended
   *  checks is_staff server-side and refuses self-suspension. */
  const suspend = useMutation({
    mutationFn: async ({ userId: target, reason, on }: { userId: string; reason?: string; on: boolean }) => {
      const { error } = on
        ? await supabase.rpc('set_suspended', { p_user: target, p_reason: reason ?? null })
        : await supabase.rpc('clear_suspended', { p_user: target })
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
    uploads: held.data ?? [],
    isLoading: reports.isLoading || held.isLoading,
    note,
    setNote,
    review: (id: string) => resolveReport.mutate({ id, next: 'reviewing' }),
    resolve: (id: string) => resolveReport.mutate({ id, next: 'resolved' }),
    /** Open the listing itself. Hiding something on the strength of a
     *  thumbnail and a title is how a good listing gets removed. */
    openItem: (publicId: string) => navigate('/item/' + publicId),
    openProfile: (userId: string) => navigate('/u/' + userId),
    /** Stop an account listing and pull its finds from every deck. Reversible:
     *  existing matches stay readable, because someone mid-swap still needs
     *  the thread to arrange or cancel. */
    suspendUser: (target: string, reason?: string) =>
      suspend.mutate({ userId: target, reason, on: true }),
    reinstateUser: (target: string) => suspend.mutate({ userId: target, on: false }),
    suspending: suspend.isPending,
    /** Put a hidden listing back in the decks. */
    restoreItem: (id: number) => decideItem.mutate({ id, publish: true }),
    /** Take a listing out of every deck. Reversible. */
    hideItem: (id: number) => decideItem.mutate({ id, publish: false }),
    busy: resolveReport.isPending || decideItem.isPending,
    goBack: () => navigate('/profile'),
  }
}
