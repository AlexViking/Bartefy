import { useNavigate } from 'react-router'
import { Camera, Star, Heart } from 'lucide-react'
import { Button } from '../components/Button'
import logoUrl from '../assets/bartefy-logo-lockup.png'
import bgUrl from '../assets/bartefy-bg-treasure-map.png'

export function Welcome() {
  const navigate = useNavigate()

  return (
    <main
      className="welcome-split"
      style={{
        minHeight: '100dvh',
        backgroundImage: `url(${bgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Centered card */}
      <div
        className="welcome-form"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '10px 28px 24px',
          gap: '20px',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.92)',
            borderRadius: '18px',
            padding: '32px 24px 28px',
            width: '100%',
            maxWidth: '380px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '18px',
            boxShadow: 'var(--shadow-float)',
          }}
        >
          <img src={logoUrl} alt="Bartefy" style={{ width: 180, borderRadius: 12 }} className="mobile-welcome-logo" />

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '30px',
              lineHeight: 1.15,
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            Find Unique Treasures.<br />Swap Your Own.
          </h1>

          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', lineHeight: 1.55, color: 'var(--text-muted)', maxWidth: '300px', margin: 0 }}>
            Trade the things you've outgrown for things you'll love. No fees, no landfill.
          </p>

          {/* Photo swatches */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
            <div style={{ width: '80px', height: '80px', background: 'var(--terracotta)', borderRadius: '14px', transform: 'rotate(-5deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow-card)' }}><Camera size={24} color="rgba(251,248,238,0.75)" /></div>
            <div style={{ width: '80px', height: '80px', background: 'var(--denim)', borderRadius: '14px', transform: 'rotate(3deg) translateY(-6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow-card)' }}><Star size={24} color="rgba(251,248,238,0.75)" /></div>
            <div style={{ width: '80px', height: '80px', background: 'var(--brass)', borderRadius: '14px', transform: 'rotate(6deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--shadow-card)' }}><Heart size={24} color="rgba(251,248,238,0.75)" /></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '4px' }}>
            <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/design')}>
              Get started
            </Button>
            <Button variant="ghost" size="lg" fullWidth onClick={() => navigate('/login')}>
              I already have an account
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
