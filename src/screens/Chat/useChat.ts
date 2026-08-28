import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { getMessages, sendMessage, subscribeMessages, updateSwapStatus } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { useChatStore, type ChatMessage } from '@/store/chat'

export interface SwapContext {
  status: string
  itemATitle: string
  itemBTitle: string
  itemAImages: string[]
  itemBImages: string[]
  otherName: string
  otherId: string
}

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

  const messages = useChatStore((s) => s.messages[swapId ?? ''] ?? [])
  const setMessages = useChatStore((s) => s.setMessages)
  const addMessage = useChatStore((s) => s.addMessage)

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [ctx, setCtx] = useState<SwapContext | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', otherId)
          .maybeSingle()
        otherName = String(profile?.name ?? 'Swapper')
      }

      if (cancelled) return
      setCtx({
        status: String(swap.status ?? 'chatting'),
        itemATitle: String(swap.item_a?.title ?? ''),
        itemBTitle: String(swap.item_b?.title ?? ''),
        itemAImages: Array.isArray(swap.item_a?.images) ? swap.item_a.images.map(String) : [],
        itemBImages: Array.isArray(swap.item_b?.images) ? swap.item_b.images.map(String) : [],
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
    if (!swapId) return
    const { error } = await updateSwapStatus(swapId, 'agreed')
    if (error) return console.error('[chat] agree failed', error)
    setCtx((c) => (c ? { ...c, status: 'agreed' } : c))
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
    bottomRef,
    goBack: () => navigate('/swaps'),
    goArrange: () => swapId && navigate(`/swaps/${swapId}/arrange`),
  }
}
