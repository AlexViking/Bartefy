import { Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { T, useT } from '@/i18n/T'
import type { useAuthScreen } from './useAuth'

/** The form and the check-your-email state, shared by both layouts. */
export function AuthForm({ a }: { a: ReturnType<typeof useAuthScreen> }) {
  const { t } = useT()

  if (a.sent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex size-16 items-center justify-center rounded-pill bg-primary/[0.10]">
          <Mail className="size-7 text-primary" aria-hidden="true" />
        </span>
        <T as="h2" k="auth.linkSentTitle" className="font-display text-h3 text-foreground" />
        <p
          data-i18n="auth.linkSentBody"
          className="max-w-[38ch] font-body text-body leading-relaxed text-muted-foreground"
        >
          {t('auth.linkSentBody', { email: a.email })}
        </p>
        <div className="flex flex-col items-center gap-1">
          <Button variant="ghost" onClick={() => void a.send()} disabled={a.busy} data-i18n="auth.resend">
            {t('auth.resend')}
          </Button>
          <Button variant="ghost" size="sm" onClick={a.reset} data-i18n="auth.wrongEmail">
            {t('auth.wrongEmail')}
          </Button>
        </div>
      </div>
    )
  }

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
        data-i18n="auth.sendLink"
      >
        {a.busy ? t('common.loading') : t('auth.sendLink')}
      </Button>
    </form>
  )
}
