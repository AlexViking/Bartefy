import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Mail } from 'lucide-react'

import mapUrl from '@/assets/bartefy-bg-treasure-map.png'
import { Button } from '@/components/ui/button'
import { T, useT } from '@/i18n/T'
import { requestOTP } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

const RESEND_SECONDS = 60

/** "Check your email" — the pause between asking for a link and clicking it.
 *  One column on both platforms; there is one thing to say and one thing to do.
 */
export function Verify() {
  const navigate = useNavigate()
  const { t } = useT()
  const pendingEmail = useAuthStore((s) => s.pendingEmail)
  const [countdown, setCountdown] = useState(RESEND_SECONDS)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (countdown <= 0) return
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown])

  const resend = async () => {
    if (!pendingEmail || countdown > 0 || sending) return
    setSending(true)
    const { error } = await requestOTP(pendingEmail)
    if (error) console.error('[verify] resend failed', error)
    setCountdown(RESEND_SECONDS)
    setSending(false)
  }

  const clock = `${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}`

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-5 px-6 text-center"
      style={{
        backgroundImage: `linear-gradient(rgba(247,242,225,0.94), rgba(247,242,225,0.94)), url(${mapUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <span className="flex size-16 items-center justify-center rounded-pill bg-primary/[0.10]">
        <Mail className="size-7 text-primary" aria-hidden="true" />
      </span>

      <T as="h1" k="auth.linkSentTitle" className="font-display text-h2 text-foreground" />
      <p
        data-i18n="auth.linkSentBody"
        className="max-w-[38ch] font-body text-body leading-relaxed text-muted-foreground"
      >
        {t('auth.linkSentBody', { email: pendingEmail || t('auth.emailLabel') })}
      </p>

      <div className="flex flex-col items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => void resend()}
          disabled={countdown > 0 || sending}
          data-i18n="auth.resend"
        >
          {countdown > 0 ? `${t('auth.resend')} · ${clock}` : t('auth.resend')}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} data-i18n="auth.wrongEmail">
          {t('auth.wrongEmail')}
        </Button>
      </div>
    </div>
  )
}
