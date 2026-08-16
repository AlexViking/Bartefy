import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Button } from '../components/Button'
import { Radio } from '../components/Radio'
import { useAuthStore } from '../store/auth'
import { updateSwapStatus } from '../lib/api'

const CANCEL_REASONS = [
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'no_meetup', label: "Couldn't agree on a meetup" },
  { value: 'no_reply', label: 'Other person stopped replying' },
  { value: 'not_expected', label: "Item isn't what I expected" },
  { value: 'other', label: 'Something else' },
]

export function Cancel() {
  const navigate = useNavigate()
  const { matchId } = useParams<{ matchId: string }>()
  const session = useAuthStore((s) => s.session)
  const userId = session?.user?.id
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // suppress unused warning
  void userId

  async function handleCancel() {
    if (!matchId || !reason) return
    setSubmitting(true)
    try {
      await updateSwapStatus(matchId, 'cancelled', reason)
      navigate(`/rate/${matchId}`, { state: { context: 'cancel' } })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--surface-page)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '480px', width: '100%', margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '26px', color: 'var(--ink)' }}>
          Cancel this swap?
        </h1>

        <p style={{ font: 'var(--type-body)', color: 'var(--text-muted)' }}>
          Both of you put time into this swap. Cancellations affect your trust score — are you sure?
        </p>

        <Radio options={CANCEL_REASONS} value={reason} onChange={setReason} name="cancel-reason" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px' }}>
            Anything else? (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note…"
            rows={3}
            style={{
              padding: '10px 14px',
              background: '#fff',
              border: '1.5px solid var(--border-subtle)',
              borderRadius: 'var(--radius-card-sm)',
              fontFamily: 'var(--font-body)',
              fontSize: '15px',
              resize: 'none',
              outline: 'none',
              color: 'var(--ink)',
              width: '100%',
              height: '56px',
            }}
          />
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button
            variant="danger"
            size="lg"
            fullWidth
            disabled={!reason || submitting}
            onClick={handleCancel}
            style={{ background: 'var(--terracotta)', color: '#fff', border: 'none' }}
          >
            {submitting ? 'Cancelling…' : 'Cancel this swap'}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            onClick={() => navigate(-1)}
          >
            Never mind
          </Button>
        </div>
      </div>
    </main>
  )
}
