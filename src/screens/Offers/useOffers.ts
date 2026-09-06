import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  barterErrorKey,
  getIncomingOffers,
  getSentOffers,
  respondToBarterOffer,
} from '@/lib/barter'
import { useAuthStore } from '@/store/auth'

/** One offer, flattened for rendering.
 *
 *  The embedded rows come back from PostgREST as arrays when the relationship
 *  cannot be proved to be one-to-one, so they are normalised here rather than
 *  in four places in the markup.
 */
export type OfferRow = {
  id: string
  note: string | null
  createdAt: string
  status: string
  /** What they want from me. */
  wanted: { id: number; title: string; image?: string } | null
  /** What they are putting up. */
  offered: { id: number; title: string; image?: string } | null
  /** Who is asking. Absent on the sent list -- that is me. */
  sender?: { id: string; name: string | null; completedTrades: number } | null
}

type Row = Record<string, unknown>

/** PostgREST returns an embedded row as an object or a one-element array
 *  depending on how it resolves the relationship. Both shapes mean the same
 *  thing here. */
function one<T>(v: unknown): T | null {
  if (Array.isArray(v)) return (v[0] as T) ?? null
  return (v as T) ?? null
}

function item(v: unknown) {
  const r = one<Row>(v)
  if (!r) return null
  const images = Array.isArray(r.images) ? (r.images as string[]) : []
  return {
    id: Number(r.id),
    title: String(r.title ?? ''),
    image: images[0],
  }
}

function shape(r: Row, withSender: boolean): OfferRow {
  const sender = withSender ? one<Row>(r.sender) : null
  return {
    id: String(r.id),
    note: (r.note as string) ?? null,
    createdAt: String(r.created_at ?? ''),
    status: String(r.status ?? 'pending'),
    wanted: item(r.wanted),
    offered: item(r.offered),
    sender: sender
      ? {
          id: String(sender.id),
          name: (sender.name as string) ?? null,
          completedTrades: Number(sender.completed_trades ?? 0),
        }
      : null,
  }
}

/** The offers inbox: what is waiting for me to answer, and what I have sent.
 *
 *  This screen had no equivalent in the old app, because under mutual-like
 *  matching nobody ever accepted anything -- two right swipes made a match on
 *  their own. With the locked rule an offer sits here until the owner answers,
 *  so without this screen the loop cannot complete at all.
 */
export function useOffers() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.session?.user?.id)
  const [tab, setTab] = useState<'incoming' | 'sent'>('incoming')
  const [errorKey, setErrorKey] = useState<string | null>(null)
  /** Which row is mid-request, so only that card shows a pending state. */
  const [busyId, setBusyId] = useState<string | null>(null)

  const incoming = useQuery({
    queryKey: ['barter', 'offers', 'incoming', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await getIncomingOffers(userId!)
      if (error) throw error
      return (data ?? []).map((r) => shape(r as Row, true))
    },
    enabled: !!userId,
  })

  const sent = useQuery({
    queryKey: ['barter', 'offers', 'sent', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await getSentOffers(userId!)
      if (error) throw error
      return (data ?? []).map((r) => shape(r as Row, false))
    },
    enabled: !!userId && tab === 'sent',
  })

  const respond = useMutation({
    mutationFn: async ({ offerId, accept }: { offerId: string; accept: boolean }) => {
      const { data, error } = await respondToBarterOffer(offerId, accept)
      if (error) throw error
      return data as { id: string } | null
    },
    onMutate: ({ offerId }) => {
      setBusyId(offerId)
      setErrorKey(null)
    },
    onSettled: () => setBusyId(null),
    onSuccess: (match, { accept }) => {
      // Both lists change on either answer: an accepted offer leaves the inbox
      // and a match appears, and the cascade may have cancelled rivals.
      qc.invalidateQueries({ queryKey: ['barter'] })
      // Accepting opens a chat, and the whole point of accepting is to talk.
      if (accept && match?.id) navigate('/matches/' + match.id)
    },
    onError: (e: { code?: string }) => setErrorKey(barterErrorKey(e)),
  })

  return {
    tab,
    setTab,
    incoming: incoming.data ?? [],
    sent: sent.data ?? [],
    isLoading: tab === 'incoming' ? incoming.isLoading : sent.isLoading,
    errorKey,
    busyId,
    accept: (offerId: string) => respond.mutate({ offerId, accept: true }),
    decline: (offerId: string) => respond.mutate({ offerId, accept: false }),
    openItem: (id: number) => navigate('/item/' + id),
    goHunt: () => navigate('/discover'),
  }
}
