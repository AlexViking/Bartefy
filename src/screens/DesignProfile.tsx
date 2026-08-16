import { useNavigate } from 'react-router'
import { Button } from '../components/Button'
import { useAuthStore, PALETTES, type PaletteId } from '../store/auth'
import bgUrl from '../assets/bartefy-bg-treasure-map.png'

export function DesignProfile() {
  const navigate = useNavigate()
  const { profileName, setProfileName, palette, setPalette, cardStyle, setCardStyle } = useAuthStore()

  const pal = PALETTES[palette]
  const prevRadius = cardStyle === 'rounded' ? '16px' : '4px'
  const initial = profileName.trim() ? profileName.trim().charAt(0).toUpperCase() : '?'
  const displayName = profileName.trim() || 'Your name'

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
          padding: '28px 24px 24px',
          width: '100%',
          maxWidth: '380px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: 'var(--shadow-float)',
        }}
      >
        {/* Kicker */}
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '12px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--bartefy-green)',
            textAlign: 'center',
          }}
        >
          Design your profile
        </div>

        {/* Live preview card */}
        <div
          style={{
            background: pal.accent,
            borderRadius: prevRadius,
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            transition: 'background 240ms cubic-bezier(0.2,0,0,1), border-radius 240ms cubic-bezier(0.2,0,0,1)',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: pal.surf,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '22px',
              color: pal.accent,
              flexShrink: 0,
              transition: 'background 240ms, color 240ms',
            }}
          >
            {initial}
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '17px',
                color: pal.surf,
                transition: 'color 240ms',
              }}
            >
              {displayName}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                color: pal.surf === '#33322B' ? 'rgba(51,50,43,0.55)' : 'rgba(247,242,225,0.6)',
                transition: 'color 240ms',
              }}
            >
              swapping since 2026
            </div>
          </div>
        </div>

        {/* Name input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '14px',
              color: 'var(--ink)',
            }}
          >
            Your name
          </label>
          <input
            value={profileName}
            onChange={(e) => setProfileName(e.target.value.slice(0, 30))}
            placeholder="e.g. Robin"
            style={{
              minHeight: '44px',
              padding: '11px 16px',
              background: '#fff',
              border: '1.5px solid var(--border-subtle)',
              borderRadius: 'var(--radius-card-sm)',
              fontFamily: 'var(--font-body)',
              fontSize: '16px',
              color: 'var(--ink)',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Palette swatches */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '14px',
              color: 'var(--ink)',
            }}
          >
            Colour palette
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {PALETTES.map((p, i) => {
              const selected = i === palette
              return (
                <button
                  key={p.name}
                  onClick={() => setPalette(i as PaletteId)}
                  title={p.name}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: p.accent,
                    border: 'none',
                    outline: selected ? '3px solid var(--ink)' : '3px solid transparent',
                    outlineOffset: '3px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: selected ? 'scale(1.12)' : 'scale(1)',
                    transition: 'transform 140ms, outline 140ms',
                    padding: 0,
                  }}
                >
                  {selected && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12.5l5 5L20 6.5" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Card style */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '14px',
              color: 'var(--ink)',
            }}
          >
            Card style
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(['rounded', 'sharp'] as const).map((style) => {
              const selected = cardStyle === style
              return (
                <button
                  key={style}
                  onClick={() => setCardStyle(style)}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-pill)',
                    background: selected ? 'var(--bartefy-green)' : '#fff',
                    color: selected ? 'var(--parchment)' : 'var(--ink)',
                    border: selected ? '1.5px solid var(--bartefy-green)' : '1.5px solid var(--border-subtle)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'background 140ms, color 140ms',
                    textTransform: 'capitalize',
                  }}
                >
                  {style}
                </button>
              )
            })}
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            disabled={!profileName.trim()}
            onClick={() => navigate('/register')}
          >
            Continue to sign up
          </Button>
          <p
            style={{
              textAlign: 'center',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              color: 'var(--text-muted)',
              margin: 0,
            }}
          >
            Already have an account?{' '}
            <span
              onClick={() => navigate('/login')}
              style={{
                color: 'var(--bartefy-green)',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontWeight: 600,
              }}
            >
              Log in
            </span>
          </p>
        </div>
      </div>
    </main>
  )
}
