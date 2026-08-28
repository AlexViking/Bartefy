import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, ChevronDown, MapPin } from 'lucide-react'
import { Button } from '../components/Button'
import { Field } from '@/components/ui/field'
import { Sheet } from '../components/Sheet'
import { CityPicker } from './CityPicker'
import { useAuthStore } from '../store/auth'
import { requestOTP } from '../lib/api'
import bgUrl from '../assets/bartefy-bg-treasure-map.png'

export function Register() {
  const navigate = useNavigate()
  const { setPendingEmail, setSelectedCity, selectedCity, profileName } = useAuthStore()
  const [email, setEmail] = useState('')
  const [notify, setNotify] = useState(true)
  const [cityOpen, setCityOpen] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async () => {
    if (!email) { setError('Please enter your email'); return }
    if (!selectedCity) { setError('Pick your city first'); return }
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
          gap: '16px',
          boxShadow: 'var(--shadow-float)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '18px', color: 'var(--ink)', margin: 0 }}>
            Create account
          </h3>
          <span style={{ width: '40px' }} />
        </div>

        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: 1.55, color: 'var(--text-muted)', margin: 0 }}>
          Just an email — we'll send you a magic link. No passwords to forget.
        </p>

        {/* Show selected name from design step */}
        {profileName && (
          <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            Signing up as <strong style={{ color: 'var(--ink)' }}>{profileName}</strong>
          </div>
        )}

        <Field
          label="Email"
          type="email"
          placeholder="you@somewhere.com"
          value={email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        />

        {/* City picker button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>
            Where do you swap?
          </div>
          <button
            onClick={() => setCityOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minHeight: '44px',
              padding: '11px 16px',
              background: '#fff',
              border: '1.5px solid var(--border-subtle)',
              borderRadius: 'var(--radius-card-sm)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              color: selectedCity ? 'var(--ink)' : 'var(--text-muted)',
              width: '100%',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} color="var(--bartefy-green)" />
              {selectedCity || 'Pick your city'}
            </span>
            <ChevronDown size={15} color="var(--bartefy-green)" />
          </button>
        </div>

        {/* Notify checkbox */}
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--ink)', minHeight: '28px' }}>
          <span
            style={{
              width: '22px', height: '22px', flexShrink: 0,
              borderRadius: '7px',
              background: notify ? 'var(--bartefy-green)' : 'var(--border-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 140ms',
            }}
            onClick={() => setNotify((v) => !v)}
          >
            {notify && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6.5L4.8 9.2L10 3.2" stroke="var(--parchment)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          Tell me when someone likes my finds
        </label>

        {error && (
          <p style={{ color: 'var(--terracotta)', fontFamily: 'var(--font-body)', fontSize: '14px', margin: 0 }}>
            {error}
          </p>
        )}

        <Button variant="primary" size="lg" fullWidth disabled={sending} onClick={handleSubmit}>
          {sending ? 'Sending…' : 'Send me a magic link'}
        </Button>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          By joining you agree to the house rules
        </p>
      </div>

      <Sheet open={cityOpen} onClose={() => setCityOpen(false)} title="Choose your city">
        <CityPicker onSelect={(city) => { setSelectedCity(city); setCityOpen(false) }} />
      </Sheet>
    </main>
  )
}
