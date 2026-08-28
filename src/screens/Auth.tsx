import { useState } from 'react'
import { useNavigate } from 'react-router'
import bgUrl from '@/assets/bartefy-bg-treasure-map.png'
import logoUrl from '@/assets/bartefy-logo-lockup.png'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requestOTP } from '@/lib/api'

/** Auth screen — sign-in via magic link (email OTP).
 *  Desktop: two-column split (illustrated left, form right).
 *  Mobile: green header with logo, form below.
 */
export function Auth() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    setBusy(true)
    setError(null)
    const { error } = await requestOTP(email.trim())
    setBusy(false)
    if (error) return setError('That did not send. Check the address and try again.')
    setSent(true)
  }

  /* ── Sent state (check-your-email) ─────────────────────────────────── */
  if (sent) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `var(--parchment) url(${bgUrl}) center/cover no-repeat`,
          padding: '40px 16px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 440,
            background: '#fff',
            border: '1px solid var(--ink-faint)',
            borderRadius: 'var(--radius-card)',
            padding: 32,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: '#F0F6F3',
              border: '1px solid var(--ink-faint)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: 30, height: 22, border: '2px solid var(--bartefy-green)', borderRadius: 3 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ font: 'var(--type-h2)' }}>Check your email</div>
            <div style={{ fontSize: 16, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
              We sent a sign-in link to <strong style={{ color: 'var(--ink)' }}>{email}</strong>. It works once and
              expires in 15 minutes.
            </div>
          </div>
          <div
            style={{
              background: 'var(--cream)',
              border: '1px solid var(--ink-faint)',
              borderRadius: 'var(--radius-card-sm)',
              padding: '12px 14px',
              fontSize: 14,
              color: 'var(--ink-soft)',
              lineHeight: 1.5,
              textAlign: 'left',
              width: '100%',
            }}
          >
            Nothing yet? Look in promotions, or check the address for a typo. Resending replaces the old link.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <Button fullWidth onClick={send} disabled={busy}>
              {busy ? 'Sending…' : 'Resend link'}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setSent(false)}>
              Use a different email
            </Button>
          </div>
        </div>
      </div>
    )
  }

  /* ── Desktop layout ──────────────────────────────────────────────────── */
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--parchment)',
        padding: '40px 16px',
      }}
    >
      {/* Desktop: two-column card (hidden on mobile via media query) */}
      <div className="auth-desktop" style={{
        display: 'none', /* overridden by media query */
        width: '100%',
        maxWidth: 960,
        background: '#fff',
        border: '1px solid var(--ink-faint)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.05fr',
          minHeight: 560,
        }}>
          {/* Left — illustrated panel */}
          <div
            style={{
              background: `var(--bartefy-green) url(${bgUrl}) center/cover no-repeat`,
              padding: 40,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <img
              src={logoUrl}
              alt="Bartefy"
              style={{ width: 150, height: 'auto', borderRadius: 'var(--radius-card-sm)' }}
            />
            <div
              style={{
                background: 'var(--cream)',
                border: '1px solid var(--ink-faint)',
                borderRadius: 'var(--radius-card)',
                padding: 22,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 28,
                  lineHeight: 1.15,
                  color: 'var(--ink)',
                }}
              >
                Find Unique Treasures. Swap Your Own.
              </div>
              <div style={{ fontSize: 16, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
                No listing fees, no landfill. 12,400 finds looking for their next chapter this week.
              </div>
            </div>
          </div>

          {/* Right — form panel */}
          <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 18, justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ font: 'var(--type-h2)' }}>Welcome back</div>
              <div style={{ fontSize: 16, color: 'var(--ink-soft)' }}>
                New here?{' '}
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register') }} style={{ color: 'var(--bartefy-green)', fontWeight: 600 }}>
                  Create an account
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button variant="ghost" fullWidth>Continue with Google</Button>
              <Button variant="ghost" fullWidth>Continue with Apple</Button>
            </div>

            <Divider />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error ?? undefined}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: 18, height: 18, accentColor: 'var(--bartefy-green)' }} />
                Keep me signed in
              </label>
              <a href="#" style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 600, color: 'var(--bartefy-green)' }}>
                Forgot password?
              </a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button size="lg" fullWidth disabled={!email.includes('@') || busy} onClick={send}>
                {busy ? 'Sending…' : 'Sign in'}
              </Button>
              <Button variant="ghost" fullWidth onClick={send} disabled={!email.includes('@') || busy}>
                Email me a link instead
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: stacked layout */}
      <div className="auth-mobile" style={{
        display: 'flex', /* overridden by media query */
        flexDirection: 'column',
        width: '100%',
        maxWidth: 440,
        background: 'var(--parchment)',
        border: '1px solid var(--ink-faint)',
        borderRadius: 'var(--radius-hero)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}>
        {/* Green header */}
        <div
          style={{
            height: 200,
            background: `var(--bartefy-green) url(${bgUrl}) center/cover no-repeat`,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={logoUrl}
            alt="Bartefy"
            style={{ width: 168, height: 'auto', borderRadius: 'var(--radius-card-sm)' }}
          />
        </div>
        {/* Form body */}
        <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, lineHeight: 1.15 }}>
              Welcome back
            </div>
            <div style={{ fontSize: 15, color: 'var(--ink-soft)' }}>
              Your finds are where you left them.
            </div>
          </div>

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error ?? undefined}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
          />

          <a href="#" style={{ fontSize: 14, fontWeight: 600, color: 'var(--bartefy-green)' }}>
            Forgot password?
          </a>

          <Button size="lg" fullWidth disabled={!email.includes('@') || busy} onClick={send}>
            {busy ? 'Sending…' : 'Sign in'}
          </Button>

          <Divider />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button variant="ghost" fullWidth>Continue with Google</Button>
            <Button variant="ghost" fullWidth>Continue with Apple</Button>
          </div>

          <div style={{ marginTop: 'auto', fontSize: 14, color: 'var(--ink-soft)', textAlign: 'center' }}>
            New here?{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/register') }} style={{ color: 'var(--bartefy-green)', fontWeight: 600 }}>
              Create an account
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--ink-soft)' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--ink-faint)' }} />
      <div style={{ font: 'var(--type-caption)', letterSpacing: 'var(--tracking-caption)', textTransform: 'uppercase' as const }}>
        or
      </div>
      <div style={{ flex: 1, height: 1, background: 'var(--ink-faint)' }} />
    </div>
  )
}
