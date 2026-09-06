import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'

import {
  barterErrorKey,
  cancelBarter,
  confirmBarter,
  getMatchMessages,
  sendMatchMessage,
} from '@/lib/barter'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

/** The thread for a barter_matches row.
 *
 *  A parallel hook rather than a rewrite of useChat. That one is wired to the
 *  old swaps tables and carries two pieces of hard-won behaviour -- the
 *  client_msg_id dedupe and the read-marking loop that took a bug to get right
 *  -- and editing it in place while both engines are live would put those at
 *  risk for no gain. It goes when the old tables do.
 *
 *  Two rules preserved from it deliberately:
 *   - client_msg_id is minted once per message and reused on resend, so
 *     UNIQUE(match_id, client_msg_id) dedupes instead of duplicating.
 *   - a duplicate-key error on send is SUCCESS: it means the first attempt
 *     landed after all, and showing an error would be a lie.
 */

export type MatchMessage = {
  id: string
  match_id: string
  sender_id: string
  body: string
  client_msg_id: string
  created_at: string
}

export type MatchContext = {
  status: 'active' | 'completed' | 'cancelled'
  cancelReason: string | null
  /** True when I am user_a, which decides which confirm column is mine. */
  isSideA: boolean
  mineConfirmed: boolean
  theirsConfirmed: boolean
  myItemTitle: string
  myItemImage?: string
  theirItemTitle: string
  theirItemImage?: string
  otherName: string
  otherId: string
}

type Row = Record<string, unknown>

function shape(m: Row): MatchMessage {
  return {
    id: String(m.id ?? ''),
    match_id: String(m.match_id ?? ''),
    sender_id: String(m.sender_id ?? ''),
    body: String(m.body ?? ''),
    client_msg_id: String(m.client_msg_id ?? ''),
    created_at: String(m.created_at ?? ''),
  }
}

export function useMatchChat() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { swapId: matchId } = useParams<{ swapId: string }>()
  const userId = useAuthStore((s) => s.session?.user?.id)

  const [messages, setMessages] = useState<MatchMessage[]>([])
  const [ctx, setCtx] = useState<MatchContext | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /** Load the match and its history, then follow it live. */
  const load = useCallback(async () => {
    if (!matchId || !userId) return

    const { data: match, error } = await supabase
      .from('barter_matches')
      .select(
        `id, user_a, user_b, item_a, item_b, status, a_confirmed, b_confirmed,
         cancel_reason, completed_at,
         itemA:items!barter_matches_item_a_fkey (id, title, images, user_id),
         itemB:items!barter_matches_item_b_fkey (id, title, images, user_id)`,
      )
      .eq('id', matchId)
      .maybeSingle()

    if (error || !match) {
      setLoading(false)
      return
    }

    const isSideA = String(match.user_a) === userId
    const otherId = String(isSideA ? match.user_b : match.user_a)

    // profiles_public exposes name and the trust score only; the base table is
    // readable by its owner alone (migration 008).
    const { data: profile } = await supabase
      .from('profiles_public')
      .select('name')
      .eq('id', otherId)
      .maybeSingle()

    // Decide whose find is whose by ownership, never by position. item_a is
    // user_a's by construction here, but reading the owner is what keeps this
    // correct if that ever stops being true.
    const a = (Array.isArray(match.itemA) ? match.itemA[0] : match.itemA) as Row | null
    const b = (Array.isArray(match.itemB) ? match.itemB[0] : match.itemB) as Row | null
    const aIsMine = String(a?.user_id ?? '') === userId
    const mine = aIsMine ? a : b
    const theirs = aIsMine ? b : a
    const img = (r: Row | null) =>
      Array.isArray(r?.images) && r.images.length > 0 ? String(r.images[0]) : undefined

    setCtx({
      status: String(match.status) as MatchContext['status'],
      cancelReason: (match.cancel_reason as string) ?? null,
      isSideA,
      mineConfirmed: Boolean(isSideA ? match.a_confirmed : match.b_confirmed),
      theirsConfirmed: Boolean(isSideA ? match.b_confirmed : match.a_confirmed),
      myItemTitle: String(mine?.title ?? ''),
      myItemImage: img(mine),
      theirItemTitle: String(theirs?.title ?? ''),
      theirItemImage: img(theirs),
      otherName: String(profile?.name ?? ''),
      otherId,
    })
    setLoading(false)
  }, [matchId, userId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!matchId) return
    let cancelled = false

    void (async () => {
      const { data } = await getMatchMessages(matchId)
      if (!cancelled && data) setMessages((data as Row[]).map(shape))
    })()

    // Push, not poll. The realtime patch also refreshes the match itself,
    // because the other person confirming is a change to this screen that
    // arrives with no message attached.
    const channel = supabase
      .channel('barter-match-' + matchId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'barter_messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          const msg = shape(payload.new as Row)
          setMessages((prev) =>
            // The optimistic copy is already here under the same
            // client_msg_id, so echoing it back would double the line.
            prev.some((m) => m.client_msg_id === msg.client_msg_id) ? prev : [...prev, msg],
          )
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'barter_matches', filter: `id=eq.${matchId}` },
        () => void load(),
      )
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [matchId, load])

  const send = async () => {
    const body = input.trim()
    if (!body || !userId || !matchId || sending) return

    const clientMsgId = crypto.randomUUID()
    // Shown immediately; the realtime echo is deduped against this id.
    setMessages((prev) => [
      ...prev,
      {
        id: clientMsgId,
        match_id: matchId,
        sender_id: userId,
        body,
        client_msg_id: clientMsgId,
        created_at: new Date().toISOString(),
      },
    ])
    setInput('')
    setSending(true)

    const { error } = await sendMatchMessage({ matchId, senderId: userId, body, clientMsgId })
    setSending(false)

    const duplicate =
      error?.message?.includes('duplicate') || error?.message?.includes('23505')
    if (error && !duplicate) {
      // Roll the optimistic line back rather than leaving a message on screen
      // that no one else will ever receive.
      setMessages((prev) => prev.filter((m) => m.client_msg_id !== clientMsgId))
      setInput(body)
      setErrorKey('barter.errorGeneric')
    }
  }

  /** "We met and swapped." The RPC decides when both sides are in; nothing is
   *  settled client-side. Always free -- never gated on tier. */
  const confirm = async () => {
    if (!matchId || busy) return
    setBusy(true)
    setErrorKey(null)
    const { error } = await confirmBarter(matchId)
    setBusy(false)
    if (error) {
      setErrorKey(barterErrorKey(error))
      return
    }
    await load()
    qc.invalidateQueries({ queryKey: ['barter'] })
  }

  /** Either side may call it off before completion. Both finds go back into
   *  circulation. */
  const cancel = async (reason?: string) => {
    if (!matchId || busy) return
    setBusy(true)
    setErrorKey(null)
    const { error } = await cancelBarter(matchId, reason)
    setBusy(false)
    if (error) {
      setErrorKey(barterErrorKey(error))
      return
    }
    await load()
    qc.invalidateQueries({ queryKey: ['barter'] })
  }

  return {
    matchId,
    userId,
    messages,
    ctx,
    loading,
    input,
    setInput,
    send,
    sending,
    confirm,
    cancel,
    busy,
    errorKey,
    bottomRef,
    /** The thread is read-only once the swap closes. Disabled, never deleted:
     *  the history is what settles a dispute later. */
    canSend: ctx?.status === 'active',
    goBack: () => navigate('/swaps'),
  }
}
