import { useEffect } from 'react'
import { Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { T, useT } from '@/i18n/T'
import { CODE_LENGTH } from './useAuth'
import type { useAuthScreen } from './useAuth'

/** The email step and the code step, shared by both layouts. */
export function AuthForm({ a }: { a: ReturnType<typeof useAuthScreen> }) {
  const { t } = useT()

  if (a.step === 'code') return <CodeStep a={a} />

  return (
    <form
      className="flex w-full flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        void a.send()
      }}
    >
      <Field
        type="email"
        inputMode="email"
        autoComplete="email"
        autoFocus
        label="auth.emailLabel"
        help="auth.emailHelp"
        placeholder="auth.emailPlaceholder"
        value={a.email}
        onChange={(e) => a.setEmail(e.target.value)}
        error={a.error ?? undefined}
        required
      />
      <Button
        type="submit"
        size="lg"
        fullWidth
        disabled={!a.valid || a.busy}
        data-i18n="auth.sendCode"
      >
        {a.busy ? t('common.loading') : t('auth.sendCode')}
      </Button>
    </form>
  )
}

/** The six boxes. Verification fires on the last digit, so there is no submit
 *  button — pasting the code from the email finishes the job on its own.
 */
function CodeStep({ a }: { a: ReturnType<typeof useAuthScreen> }) {
  const { t } = useT()
  const { code, verify, busy } = a

  useEffect(() => {
    if (code.length === CODE_LENGTH && !busy) void verify(code)
  }, [code, busy, verify])

  const clock = `${Math.floor(a.countdown / 60)}:${String(a.countdown % 60).padStart(2, '0')}`

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-pill bg-primary/[0.10]">
        <Mail className="size-7 text-primary" aria-hidden="true" />
      </span>

      <T as="h2" k="auth.codeSentTitle" className="font-display text-h3 text-foreground" />
      <p
        data-i18n="auth.codeSentBody"
        className="max-w-[38ch] font-body text-body leading-relaxed text-muted-foreground"
      >
        {t('auth.codeSentBody', { email: a.email })}
      </p>

      <InputOTP
        maxLength={CODE_LENGTH}
        value={code}
        onChange={a.setCode}
        disabled={busy}
        autoFocus
        // Lets iOS and Android offer the code straight from the notification.
        autoComplete="one-time-code"
        inputMode="numeric"
        aria-label={t('auth.codeLabel')}
        containerClassName="justify-center"
      >
        <InputOTPGroup className="gap-2">
          {Array.from({ length: CODE_LENGTH }, (_, i) => (
            <InputOTPSlot
              key={i}
              index={i}
              className="size-12 rounded border-[1.5px] border-border/[0.14] bg-card font-display text-h3 text-foreground first:rounded-l last:rounded-r"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>

      {a.error && (
        <p role="alert" className="font-body text-sm leading-relaxed text-destructive">
          {a.error}
        </p>
      )}

      {busy && <T as="p" k="common.loading" className="font-body text-sm text-muted-foreground" />}

      <div className="flex flex-col items-center gap-1">
        <Button
          variant="ghost"
          onClick={() => void a.send()}
          disabled={!a.canResend}
          data-i18n="auth.resend"
        >
          {a.countdown > 0 ? `${t('auth.resend')} · ${clock}` : t('auth.resend')}
        </Button>
        <Button variant="ghost" size="sm" onClick={a.reset} data-i18n="auth.wrongEmail">
          {t('auth.wrongEmail')}
        </Button>
      </div>
    </div>
  )
}
