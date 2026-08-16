import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Mail } from 'lucide-react'
import { Button } from '../components/Button'
import { useAuthStore } from '../store/auth'
import { requestOTP } from '../lib/api'
import bgUrl from '../assets/bartefy-bg-treasure-map.png'

export function Verify() {
  const navigate = useNavigate()
  const { pendingEmail } = useAuthStore()
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const formattedTime = `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`

  const handleResend = async () => {
    if (!pendingEmail) return
    await requestOTP(pendingEmail)
    setCountdown(60)
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '18px',
          padding: '32px 24px 28px',
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          boxShadow: 'var(--shadow-float)',
          textAlign: 'center',
        }}
      >
        {/* Green circle with mail icon */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'var(--bartefy-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Mail size={32} color="var(--parchment)" />
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '26px', color: 'var(--ink)', margin: 0 }}>
          Check your inbox
        </h1>

        <p style={{ font: 'var(--type-body)', color: 'var(--text-muted)', maxWidth: '280px', margin: 0 }}>
          We sent a magic link to{' '}
          <strong style={{ color: 'var(--ink)' }}>{pendingEmail || 'your email'}</strong>.
          Tap it to sign in instantly.
        </p>

        <Button
          variant="ghost"
          fullWidth
          disabled={countdown > 0}
          onClick={handleResend}
          style={{ color: countdown > 0 ? 'var(--text-muted)' : 'var(--bartefy-green)' }}
        >
          {countdown > 0 ? `Resend link (${formattedTime})` : 'Resend link'}
        </Button>

        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--bartefy-green)',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '15px',
            textDecoration: 'underline',
          }}
        >
          Use a different email
        </button>
      </div>
    </main>
  )
}
