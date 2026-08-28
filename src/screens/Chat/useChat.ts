import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'

import {
  blockUser,
  confirmReceipt,
  fileReport,
  getMessages,
  markThreadRead,
  rateSwap,
  sendMessage,
  subscribeMessages,
  updateSwapStatus,
} from '@/lib/api'
import { keys } from '@/lib/cache/queryClient'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { useChatStore, type ChatMessage } from '@/store/chat'
import { STATUS_FROM_DB } from '@/types/swap'
import type { TroubleReason } from '@/components/swap/TroubleSheet'

export interface SwapContext {
  status: string
  itemATitle: string
  itemBTitle: string
  itemAImages: string[]
  itemBImages: string[]
  otherName: string
  otherId: string
}

/** One frozen empty array, shared. See the selector note in useChat. */
const EMPTY: ChatMessage[] = []

function shape(m: Record<string, unknown>): ChatMessage {
  return {
    id: String(m.id ?? ''),
    swap_id: String(m.swap_id ?? ''),
    sender_id: String(m.sender_id ?? ''),
    body: String(m.body ?? ''),
    client_msg_id: String(m.client_msg_id ?? ''),
    created_at: String(m.created_at ?? ''),
    read_at: m.read_at ? String(m.read_at) : null,
  }
}

/** The thread's behaviour, with no layout in it.
 *
 *  Two things here are load-bearing and must not regress:
 *   - client_msg_id is minted once per message and reused on every resend, so
 *     UNIQUE(swap_id, client_msg_id) dedupes rather than duplicating.
 *   - a duplicate-key error on send is success, not failure: it means the
 *     first attempt landed after all.
 */
export function useChat() {
  const navigate = useNavigate()
  // The route is /swaps/:swapId. This previously read `matchId`, which is not
  // a param on that route, so it was always undefined and the thread never
  // loaded from a direct link.
  const { swapId } = useParams<{ swapId: string }>()
  const userId = useAuthStore((s) => s.session?.user?.id)

  // Must not be `s.messages[id] ?? []`: the fallback allocates a new array on
  // every render, so the selector never returns a stable reference and Zustand
  // re-renders forever ("Maximum update depth exceeded"). Select the possibly
  // undefined slice, then default outside the selector.
  const stored = useChatStore((s) => s.messages[swapId ?? ''])
  const messages = stored ?? EMPTY
  const setMessages = useChatStore((s) => s.setMessages)
  const addMessage = useChatStore((s) => s.addMessage)

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [agreeing, setAgreeing] = useState(false)
  const [agreeError, setAgreeError] = useState(false)
  const [troubleOpen, setTroubleOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [ctx, setCtx] = useState<SwapContext | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /** Reading the thread is what clears the badge.
   *
   *  Keyed on `messages` as well as the id, so a message arriving while the
   *  thread is already open is marked read too — otherwise the dot would
   *  reappear over a conversation the user is actively looking at.
   *
   *  The recipient-update RLS policy permits only messages sent TO you, and
   *  markThreadRead filters on exactly that, so this is a no-op when there is
   *  nothing unread rather than a rejected write.
   */
  useEffect(() => {
    if (!swapId || !userId) return
    const unread = messages.some((m) => m.sender_id !== userId && !m.read_at)
    if (!unread) return

    void (async () => {
      const { error } = await markThreadRead(swapId, userId)
      if (error) {
        console.error('[chat] mark read failed', error)
        return
      }
      qc.invalidateQueries({ queryKey: keys.unread(userId) })
    })()
  }, [swapId, userId, messages, qc])

  useEffect(() => {
    if (!swapId || !userId) return
    let cancelled = false

    void (async () => {
      const { data, error } = await getMessages(swapId)
      if (error) console.error('[chat] history failed', error)
      if (!cancelled && data) {
        setMessages(swapId, (data as Record<string, unknown>[]).map(shape))
      }
      if (!cancelled) setLoading(false)
    })()

    void (async () => {
      const { data: swap, error } = await supabase
        .from('swaps')
        .select('*, item_a:item_a_id(*), item_b:item_b_id(*)')
        .eq('id', swapId)
        .maybeSingle()
      if (error) console.error('[chat] swap context failed', error)
      if (cancelled || !swap) return

      const isUserA = swap.user_a_id === userId
      const otherId = String((isUserA ? swap.user_b_id : swap.user_a_id) ?? '')

      let otherName = 'Swapper'
      if (otherId) {
        // profiles_public exposes name/rating/swap_count only; the base table
        // is readable to its owner alone (migration 008).
        const { data: profile } = await supabase
          .from('profiles_public')
          .select('name')
          .eq('id', otherId)
          .maybeSingle()
        otherName = String(profile?.name ?? 'Swapper')
      }

      if (cancelled) return

      // item_a does NOT reliably belong to user_a in the existing rows, so
      // decide which find is yours by who owns it rather than by position.
      // itemA is always *mine* and itemB always *theirs* downstream.
      const aOwner = String(swap.item_a?.user_id ?? '')
      const aIsMine = swap.item_a ? aOwner === userId : isUserA
      const mine = aIsMine ? swap.item_a : swap.item_b
      const theirs = aIsMine ? swap.item_b : swap.item_a

      setCtx({
        // Map the DB's vocabulary in, or every `status === 'agreed'` check
        // downstream silently never fires.
        status: STATUS_FROM_DB[String(swap.status ?? '')] ?? 'chatting',
        itemATitle: String(mine?.title ?? ''),
        itemBTitle: String(theirs?.title ?? ''),
        itemAImages: Array.isArray(mine?.images) ? mine.images.map(String) : [],
        itemBImages: Array.isArray(theirs?.images) ? theirs.images.map(String) : [],
        otherName,
        otherId,
      })
    })()

    const channel = subscribeMessages(swapId, (msg) =>
      addMessage(swapId, shape(msg as Record<string, unknown>)),
    )
    return () => {
      cancelled = true
      channel.unsubscribe()
    }
  }, [swapId, userId, setMessages, addMessage])

  const send = async () => {
    const body = input.trim()
    if (!body || !userId || !swapId || sending) return

    const clientMsgId = crypto.randomUUID()
    addMessage(swapId, {
      id: clientMsgId,
      swap_id: swapId,
      sender_id: userId,
      body,
      client_msg_id: clientMsgId,
      created_at: new Date().toISOString(),
      read_at: null,
    })
    setInput('')
    setSending(true)

    const { error } = await sendMessage(swapId, userId, body, clientMsgId)
    // A duplicate key means the earlier attempt landed. That is success.
    const duplicate =
      error?.message?.includes('duplicate') || error?.message?.includes('23505')
    if (error && !duplicate) console.error('[chat] send failed', error)
    setSending(false)
  }

  const agree = async () => {
    if (!swapId || agreeing) return
    setAgreeing(true)
    setAgreeError(false)

    const { error } = await updateSwapStatus(swapId, 'agreed')
    setAgreeing(false)

    if (error) {
      console.error('[chat] agree failed', error)
      setAgreeError(true)
      return
    }
    setCtx((c) => (c ? { ...c, status: 'agreed' } : c))
  }

  /** Confirming you received their find. The RPC behind this decides when
   *  both sides are in and the swap is done — nothing is settled client-side.
   *  Confirming a handover is ALWAYS_FREE. */
  const confirmHandover = async () => {
    if (!swapId) return
    const { error } = await confirmReceipt(swapId)
    if (error) return console.error('[chat] confirm receipt failed', error)
    setCtx((c) => (c ? { ...c, status: 'received_one_side' } : c))
  }

  /** Ratings are blind: neither side sees the other's until both have left
   *  one, which the server enforces. Rating is ALWAYS_FREE. */
  const rate = async (stars: number, tags: string[]) => {
    if (!swapId) return
    const { error } = await rateSwap(swapId, stars, tags)
    if (error) return console.error('[chat] rating failed', error)
    setConfirmOpen(false)
    navigate('/swaps')
  }

  /** Opens the trouble sheet. Reporting and backing out are ALWAYS_FREE, so
   *  this is never gated on tier. */
  const openTrouble = () => setTroubleOpen(true)

  /** Files the report, and blocks the other person if that was ticked.
   *
   *  Nothing is decided here: the report is recorded and a human reads it.
   *  The block is applied immediately though, because someone who says they
   *  felt unsafe should not have to wait on a queue to stop being contacted.
   */
  const submitTrouble = async (reason: TroubleReason, note: string, block: boolean) => {
    if (!userId) return
    const otherId = ctx?.otherId

    const { error } = await fileReport({
      swapId: swapId ?? undefined,
      fromUser: userId,
      aboutUser: otherId || undefined,
      reason,
      note,
      block,
    })
    if (error) console.error('[chat] report failed', error)

    if (block && otherId) {
      const { error: blockError } = await blockUser(userId, otherId)
      if (blockError) console.error('[chat] block failed', blockError)
    }

    setTroubleOpen(false)
    navigate('/swaps')
  }

  return {
    swapId,
    userId,
    messages,
    ctx,
    loading,
    input,
    setInput,
    sending,
    send,
    agree,
    agreeing,
    agreeError,
    troubleOpen,
    setTroubleOpen,
    openTrouble,
    submitTrouble,
    confirmOpen,
    setConfirmOpen,
    confirmHandover,
    rate,
    bottomRef,
    goBack: () => navigate('/swaps'),
    goArrange: () => swapId && navigate(`/swaps/${swapId}/arrange`),
  }
}
