import { useState } from 'react'
import { useNavigate } from 'react-router'
import bgUrl from '@/assets/bartefy-bg-treasure-map.png'
import logoUrl from '@/assets/bartefy-logo-lockup.png'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { requestOTP } from '@/lib/api'

/** One progressive auth screen. We do not ask whether someone is new - the
 *  magic link works either way, so Login, Register and Verify collapse to this
 *  plus the /verify return page.
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

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center bg-background bg-cover bg-center px-4 py-10"
      style={{ backgroundImage: 'url(' + bgUrl + ')' }}
    >
      <div className="flex w-full max-w-[440px] flex-col items-center gap-5 rounded-hero bg-popover/95 p-7 shadow-card">
        <img src={logoUrl} alt="Bartefy" className="h-[86px]" />

        {sent ? (
          <>
            <h1 className="text-center font-display text-2xl font-bold leading-tight">Check your inbox</h1>
            <p className="text-center font-body text-[15px] text-muted-foreground">
              We sent a link to <strong className="font-semibold text-foreground">{email}</strong>. Open it on this
              device and you are in.
            </p>
            <Button variant="ghost" fullWidth onClick={() => setSent(false)}>
              Use a different address
            </Button>
          </>
        ) : (
          <>
            <h1 className="text-center font-display text-2xl font-bold leading-tight">
              Find unique treasures. Swap your own.
            </h1>
            <p className="text-center font-body text-[15px] text-muted-foreground">
              No passwords. We send one link and it signs you in, new or returning.
            </p>
            <Input
              label="Your email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error ?? undefined}
            />
            <Button size="lg" fullWidth disabled={!email.includes('@') || busy} onClick={send}>
              {busy ? 'Sending' : 'Send my link'}
            </Button>
            <button
              type="button"
              onClick={() => navigate('/browse')}
              className="min-h-hit font-body text-sm text-primary underline-offset-2 hover:underline"
            >
              Have a look around first
            </button>
          </>
        )}
      </div>
    </div>
  )
}
