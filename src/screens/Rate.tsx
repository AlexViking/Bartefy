import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router'
import { Star } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { Tag } from '../components/Tag'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'
import { submitRating, updateSwapStatus } from '../lib/api'

const COMPLETE_TAGS = ['on time', 'friendly', 'item as described', 'would swap again']
const CANCEL_TAGS = ['unresponsive', 'item not as described', 'no-show', 'changed mind last minute']

export function Rate() {
  const navigate = useNavigate()
  const location = useLocation()
  const { matchId } = useParams<{ matchId: string }>()
  const session = useAuthStore((s) => s.session)
  const userId = session?.user?.id

  const rateContext: 'complete' | 'cancel' = (location.state as { context?: string } | null)?.context === 'cancel' ? 'cancel' : 'complete'
  const availableTags = rateContext === 'cancel' ? CANCEL_TAGS : COMPLETE_TAGS

  const [stars, setStars] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [otherUserId, setOtherUserId] = useState<string | null>(null)
  const [otherName, setOtherName] = useState('them')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!matchId || !userId) return
    loadSwapContext()
  }, [matchId, userId])

  async function loadSwapContext() {
    if (!matchId || !userId) return
    const { data: swap } = await supabase
      .from('swaps')
      .select('user_a_id, user_b_id')
      .eq('id', matchId)
      .maybeSingle()

    if (swap) {
      const isUserA = swap.user_a_id === userId
      const otherId = isUserA ? swap.user_b_id : swap.user_a_id
      setOtherUserId(otherId)

      if (otherId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', otherId)
          .maybeSingle()
        setOtherName(profile?.name ?? 'them')
      }
    }
  }

  const toggleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  async function handleSubmit() {
    if (!matchId || !userId || !otherUserId || stars === 0) return
    setSubmitting(true)
    try {
      await submitRating({
        swapId: matchId,
        fromUser: userId,
        toUser: otherUserId,
        stars,
        tags,
        context: note || undefined,
      })
      await updateSwapStatus(matchId, 'completed')
      navigate('/matches')
    } finally {
      setSubmitting(false)
    }
  }

  const initial = otherName[0]?.toUpperCase() ?? 'S'

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: 'var(--surface-page)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 24px 32px',
        gap: '20px',
        textAlign: 'center',
      }}
    >
      {/* Kicker */}
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase', color: rateContext === 'cancel' ? 'var(--terracotta)' : 'var(--bartefy-green)' }}>
        {rateContext === 'cancel' ? 'Swap ended' : 'Swap complete'}
      </div>

      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '28px', lineHeight: 1.15, color: 'var(--ink)', margin: 0 }}>
        How was trading<br />with {otherName}?
      </h1>

      <Avatar initials={initial} color="var(--terracotta)" size={72} />

      {/* Stars */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => setStars(s)}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <Star
              size={36}
              color="var(--brass)"
              fill={s <= (hovered || stars) ? 'var(--brass)' : 'transparent'}
            />
          </button>
        ))}
      </div>

      {/* Quick tags — context-dependent */}
      {stars > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
          {availableTags.map((tag) => (
            <Tag key={tag} selected={tags.includes(tag)} onSelect={() => toggleTag(tag)}>
              {tag}
            </Tag>
          ))}
        </div>
      )}

      {/* Note */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Say something kind (optional)"
        style={{
          width: '100%',
          maxWidth: '400px',
          boxSizing: 'border-box',
          padding: '12px 16px',
          background: '#fff',
          border: '1.5px solid var(--border-subtle)',
          borderRadius: 'var(--radius-card-sm)',
          fontFamily: 'var(--font-body)',
          fontSize: '15px',
          height: '76px',
          resize: 'none',
          outline: 'none',
          color: 'var(--ink)',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '400px' }}>
        <Button variant="primary" size="lg" fullWidth disabled={stars === 0 || submitting} onClick={handleSubmit}>
          {submitting ? 'Sending…' : 'Send rating'}
        </Button>
        <Button variant="ghost" size="md" fullWidth onClick={() => navigate('/matches')}>
          Skip for now
        </Button>
      </div>
    </main>
  )
}
