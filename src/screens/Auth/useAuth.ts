import { useCallback, useEffect, useState } from 'react'

import { requestOTP, verifyOTP } from '@/lib/api'
import { useT } from '@/i18n/T'
import { useAuthStore } from '@/store/auth'

export const CODE_LENGTH = 6
const RESEND_SECONDS = 60

/** Sign-in is one email field, then the six digits we email back. There is no
 *  password to forget, so there is no "forgot password" and no register screen —
 *  an address we have not seen gets an account on the way through.
 *
 *  Both steps live on this one screen on purpose. The code replaced a magic
 *  link precisely so nobody has to leave the tab they started in: sending the
 *  person to another page to type it would give back the context switch the
 *  link was costing.
 */
export function useAuthScreen() {
  const { t } = useT()
  const setPendingEmail = useAuthStore((s) => s.setPendingEmail)

  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())

  useEffect(() => {
    if (countdown <= 0) return
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown])

  /** Which step failed decides the wording. Supabase says "invalid" for both a
   *  rejected address and a rejected code, so matching on the text alone would
   *  tell someone their code was wrong before they had been given one.
   */
  const messageFor = (raw: string, where: 'send' | 'verify'): string => {
    const m = raw.toLowerCase()
    if (m.includes('rate limit') || m.includes('too many') || m.includes('security purposes'))
      return t('auth.errorRateLimited')
    if (where === 'verify') {
      // Supabase answers "Token has expired or is invalid" for a mistyped code
      // and a stale one alike, so one message has to cover both honestly
      // rather than assert which of the two it was.
      if (m.includes('expired') || m.includes('invalid') || m.includes('token'))
        return t('auth.errorBadCode')
      return t('auth.errorGeneric')
    }
    if (m.includes('invalid') || m.includes('email')) return t('auth.errorBadEmail')
    return t('auth.errorGeneric')
  }

  /** Ask for a code. Doubles as the resend, which is why it clears whatever
   *  the last failed attempt left in the boxes. */
  const send = async () => {
    if (!valid || busy || countdown > 0) return
    setBusy(true)
    setError(null)
    const address = email.trim()
    const { error: otpError } = await requestOTP(address)
    setBusy(false)
    if (otpError) {
      setError(messageFor(otpError.message, 'send'))
      return
    }
    setPendingEmail(address)
    setCode('')
    setCountdown(RESEND_SECONDS)
    setStep('code')
  }

  /** Verify. On success the session lands via onAuthStateChange in App.tsx and
   *  HomeRoute redirects — there is nothing to navigate to from here.
   *
   *  Wrapped in useCallback because the code input auto-submits from an effect
   *  on the sixth digit; an unstable identity there would re-fire the request.
   */
  const verify = useCallback(
    async (value: string) => {
      if (value.length !== CODE_LENGTH || busy) return
      setBusy(true)
      setError(null)
      const { error: verifyError } = await verifyOTP(email.trim(), value)
      setBusy(false)
      if (verifyError) {
        setError(messageFor(verifyError.message, 'verify'))
        // Clear the boxes so the next attempt starts from empty rather than
        // needing six backspaces first.
        setCode('')
      }
    },
    // messageFor closes over t, which is stable per language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busy, email, t],
  )

  /** Typing again after a rejected code should clear the error, otherwise it
   *  sits under boxes the person is actively fixing. */
  const changeCode = (value: string) => {
    setCode(value)
    if (error) setError(null)
  }

  return {
    step,
    email,
    setEmail,
    code,
    setCode: changeCode,
    valid,
    busy,
    error,
    countdown,
    canResend: countdown === 0 && !busy,
    send,
    verify,
    /** Back to the email field — "that is the wrong address". */
    reset: () => {
      setStep('email')
      setCode('')
      setError(null)
      setCountdown(0)
    },
  }
}
