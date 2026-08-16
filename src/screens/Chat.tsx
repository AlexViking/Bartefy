import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowLeft, MoreVertical, Send } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Sheet } from '../components/Sheet'
import { DesktopNav } from '../components/DesktopNav'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'
import { useChatStore, type ChatMessage } from '../store/chat'
import { getMessages, sendMessage, subscribeMessages, updateSwapStatus } from '../lib/api'

class ChatErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null}> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--terracotta)' }}>
        <h2>Something went wrong</h2>
        <pre style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
      </div>
    )
    return this.props.children
  }
}

type SwapContext = {
  status: string
  itemATitle: string
  itemBTitle: string
  itemAImages: string[]
  itemBImages: string[]
  otherName: string
}

const AVATAR_COLORS = ['var(--terracotta)', 'var(--denim)', 'var(--sage)', 'var(--brass)']

export function Chat() {
  return <ChatErrorBoundary><ChatInner /></ChatErrorBoundary>
}

function ChatInner() {
  const navigate = useNavigate()
  const { matchId } = useParams<{ matchId: string }>()
  const session = useAuthStore((s) => s.session)
  const userId = session?.user?.id

  const messages = useChatStore((s) => s.messages[matchId ?? ''] ?? [])
  const setMessages = useChatStore((s) => s.setMessages)
  const addMessage = useChatStore((s) => s.addMessage)

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [ctx, setCtx] = useState<SwapContext>({
    status: 'proposed',
    itemATitle: 'Your item',
    itemBTitle: 'Their item',
    itemAImages: [],
    itemBImages: [],
    otherName: 'Finder',
  })
  const [detailsOpen, setDetailsOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!matchId || !userId) return

    loadContext()
    loadHistory()

    const channel = subscribeMessages(matchId, (msg) => {
      const m = msg as Record<string, unknown>
      addMessage(matchId, {
        id: String(m.id ?? ''),
        swap_id: String(m.swap_id ?? ''),
        sender_id: String(m.sender_id ?? ''),
        body: String(m.body ?? ''),
        client_msg_id: String(m.client_msg_id ?? ''),
        created_at: String(m.created_at ?? ''),
        read_at: m.read_at ? String(m.read_at) : null,
      })
    })

    return () => { channel.unsubscribe() }
  }, [matchId, userId])

  async function loadHistory() {
    if (!matchId) return
    const { data } = await getMessages(matchId)
    if (data) {
      const safe: ChatMessage[] = (data as Record<string, unknown>[]).map((m) => ({
        id: String(m.id ?? ''),
        swap_id: String(m.swap_id ?? ''),
        sender_id: String(m.sender_id ?? ''),
        body: String(m.body ?? ''),
        client_msg_id: String(m.client_msg_id ?? ''),
        created_at: String(m.created_at ?? ''),
        read_at: m.read_at ? String(m.read_at) : null,
      }))
      setMessages(matchId, safe)
    }
  }

  async function loadContext() {
    if (!matchId || !userId) return

    const { data: swap } = await supabase
      .from('swaps')
      .select('*, item_a:item_a_id(*), item_b:item_b_id(*)')
      .eq('id', matchId)
      .maybeSingle()

    if (swap) {
      const isUserA = swap.user_a_id === userId
      const otherId = isUserA ? swap.user_b_id : swap.user_a_id

      // Fetch other user's profile name separately
      let otherName = 'Finder'
      if (otherId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', otherId)
          .maybeSingle()
        otherName = profile?.name ?? 'Finder'
      }

      setCtx({
        status: String(swap.status ?? 'proposed'),
        itemATitle: String(swap.item_a?.title ?? 'Item A'),
        itemBTitle: String(swap.item_b?.title ?? 'Item B'),
        itemAImages: Array.isArray(swap.item_a?.images) ? swap.item_a.images.map(String) : [],
        itemBImages: Array.isArray(swap.item_b?.images) ? swap.item_b.images.map(String) : [],
        otherName: String(otherName),
      })
    }
  }

  const handleSend = async () => {
    if (!input.trim() || !userId || !matchId || sending) return
    const body = input.trim()
    const clientMsgId = crypto.randomUUID()

    // Optimistic add
    const optimistic: ChatMessage = {
      id: clientMsgId,
      swap_id: matchId,
      sender_id: userId,
      body,
      client_msg_id: clientMsgId,
      created_at: new Date().toISOString(),
      read_at: null,
    }
    addMessage(matchId, optimistic)
    setInput('')
    setSending(true)

    const { error } = await sendMessage(matchId, userId, body, clientMsgId)
    // 409 = duplicate (resend) — treat as success
    if (error && !error.message?.includes('duplicate') && !error.message?.includes('23505')) {
      console.error('Send failed:', error)
    }
    setSending(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--surface-page)', overflow: 'hidden' }}>
      <DesktopNav />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, maxWidth: 720, width: '100%', margin: '0 auto' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          flexShrink: 0,
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => navigate('/matches')}
            style={{
              width: '40px', height: '40px', borderRadius: '50%',
              border: '1.5px solid var(--border-subtle)',
              background: 'var(--surface-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, padding: 0,
            }}
          >
            <ArrowLeft size={19} color="var(--ink)" />
          </button>
          <Avatar initials={ctx.otherName[0]?.toUpperCase() ?? 'S'} color={AVATAR_COLORS[0]} size={42} />
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '17px', color: 'var(--ink)', margin: 0 }}>{ctx.otherName}</p>
          </div>
        </div>
        <button
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: '1.5px solid var(--border-subtle)',
            background: 'var(--surface-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, padding: 0,
          }}
        >
          <MoreVertical size={19} color="var(--ink)" />
        </button>
      </header>

      {/* Pinned swap card */}
      <div style={{ padding: '4px 16px', flexShrink: 0 }}>
        <Card style={{ padding: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'var(--brass)', flexShrink: 0, overflow: 'hidden' }}>
              {ctx.itemAImages[0] && <img src={ctx.itemAImages[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--bartefy-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h13M14 4l4 4-4 4M20 16H7M10 12l-4 4 4 4"/></svg>
            <div style={{ width: '42px', height: '42px', borderRadius: '8px', background: 'var(--denim)', flexShrink: 0, overflow: 'hidden' }}>
              {ctx.itemBImages[0] && <img src={ctx.itemBImages[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14.5px', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                {ctx.itemATitle} ⇄ {ctx.itemBTitle}
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>swap in progress</div>
            </div>
            <button
              onClick={() => setDetailsOpen(true)}
              style={{
                padding: '7px 16px',
                minHeight: '36px',
                background: 'transparent',
                border: '1.5px solid var(--border-subtle)',
                borderRadius: 'var(--radius-pill)',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                color: 'var(--ink)',
                flexShrink: 0,
              }}
            >
              Details
            </button>
          </div>
        </Card>
      </div>

      {/* Action bar — Confirm swap / Mark complete + Cancel */}
      {(ctx.status === 'proposed' || ctx.status === 'confirmed') && (
        <div style={{ padding: '8px 16px', flexShrink: 0, display: 'flex', gap: '10px' }}>
          <Button
            variant="primary"
            size="md"
            style={{ flex: 1 }}
            onClick={async () => {
              if (ctx.status === 'proposed' && matchId) {
                await updateSwapStatus(matchId, 'confirmed')
                setCtx((c) => ({ ...c, status: 'confirmed' }))
              } else if (ctx.status === 'confirmed' && matchId) {
                await updateSwapStatus(matchId, 'completed')
                navigate(`/rate/${matchId}`)
              }
            }}
          >
            {ctx.status === 'confirmed' ? 'Mark complete' : 'Confirm swap'}
          </Button>
          <Button
            variant="ghost"
            size="md"
            style={{ color: 'var(--terracotta)', borderColor: 'var(--terracotta)' }}
            onClick={() => navigate(`/cancel/${matchId}`)}
          >
            Cancel swap
          </Button>
        </div>
      )}

      {/* Messages saved status */}
      <div style={{ padding: '0 16px 4px', flexShrink: 0 }}>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', margin: 0, fontFamily: 'var(--font-body)' }}>
          messages saved
        </p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Welcome message */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div
            style={{
              maxWidth: '76%',
              padding: '10px 14px',
              background: 'var(--surface-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px 16px 16px 4px',
              boxShadow: 'var(--shadow-card)',
              fontSize: '15.5px',
              lineHeight: 1.45,
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
            }}
          >
            It's a match! Say hello
          </div>
        </div>

        {messages.map((msg) => {
          const fromMe = msg.sender_id === userId
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: fromMe ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
                  maxWidth: '76%',
                  padding: '10px 14px',
                  background: fromMe ? 'var(--bartefy-green)' : 'var(--surface-card)',
                  color: fromMe ? 'var(--parchment)' : 'var(--ink)',
                  border: fromMe ? 'none' : '1px solid var(--border-subtle)',
                  borderRadius: fromMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  boxShadow: 'var(--shadow-card)',
                  fontSize: '15.5px',
                  lineHeight: 1.45,
                  fontFamily: 'var(--font-body)',
                }}
              >
                {msg.body}
                {fromMe && (
                  <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.7, textAlign: 'right' }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          padding: '8px 16px env(safe-area-inset-bottom, 10px)',
          flexShrink: 0,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Message ${ctx.otherName}…`}
          style={{
            flex: 1,
            minHeight: '48px',
            padding: '0 20px',
            background: '#fff',
            border: '1.5px solid var(--border-subtle)',
            borderRadius: 'var(--radius-pill)',
            fontFamily: 'var(--font-body)',
            fontSize: '16px',
            outline: 'none',
            color: 'var(--ink)',
          }}
        />
        <button
          onClick={handleSend}
          disabled={sending}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--bartefy-green)',
            border: 'none',
            cursor: sending ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            opacity: sending ? 0.7 : 1,
          }}
        >
          <Send size={20} color="var(--parchment)" />
        </button>
      </div>
      <Sheet open={detailsOpen} onClose={() => setDetailsOpen(false)} title="Swap details" height="auto">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '8px' }}>
          {[
            { title: ctx.itemATitle, images: ctx.itemAImages, label: 'Your item' },
            { title: ctx.itemBTitle, images: ctx.itemBImages, label: `${ctx.otherName}'s item` },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: 'var(--radius-card)', overflow: 'hidden', flexShrink: 0, background: 'var(--parchment-deep)' }}>
                {item.images[0]
                  ? <img src={item.images[0]} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%' }} />
                }
              </div>
              <div>
                <div style={{ fontSize: '12px', fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '2px' }}>{item.label}</div>
                <div style={{ fontSize: '16px', fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)' }}>{item.title}</div>
              </div>
            </div>
          ))}
          <div style={{ height: '1px', background: 'var(--border-subtle)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}>
            <span>Status</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--ink)', textTransform: 'capitalize' }}>{ctx.status}</span>
          </div>
        </div>
      </Sheet>
      </div>
    </div>
  )
}
