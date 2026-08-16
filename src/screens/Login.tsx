import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { useAuthStore } from '../store/auth'
import { requestOTP } from '../lib/api'
import bgUrl from '../assets/bartefy-bg-treasure-map.png'

export function Login() {
  const navigate = useNavigate()
  const { setPendingEmail } = useAuthStore()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async () => {
    if (!email) return
    setError('')
    setSending(true)
    const { error: err } = await requestOTP(email)
    setSending(false)
    if (err) { setError(err.message); return }
    setPendingEmail(email)
    navigate('/verify')
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
          padding: '24px',
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: 'var(--shadow-float)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => navigate(-1)}
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
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px', margin: 0 }}>Welcome back</h1>
        </div>

        <p style={{ font: 'var(--type-body)', color: 'var(--text-muted)', margin: 0 }}>
          Enter your email and we'll send you a magic link to sign in.
        </p>

        <Input
          label="Email"
          type="email"
          placeholder="you@somewhere.com"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        />

        {error && (
          <p style={{ color: 'var(--terracotta)', fontFamily: 'var(--font-body)', fontSize: '14px', margin: 0 }}>
            {error}
          </p>
        )}

        <Button variant="primary" size="lg" fullWidth disabled={sending} onClick={handleSubmit}>
          {sending ? 'Sending…' : 'Send me a magic link'}
        </Button>

        <p style={{ font: 'var(--type-caption)', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
          New here?{' '}
          <span
            onClick={() => navigate('/design')}
            style={{ color: 'var(--bartefy-green)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Create an account
          </span>
        </p>
      </div>
    </main>
  )
}
