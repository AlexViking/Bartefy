import { useState } from 'react'

import { requestOTP } from '@/lib/api'
import { useT } from '@/i18n/T'
import { useAuthStore } from '@/store/auth'

/** Sign-in is one email field and one button. There is no password to forget,
 *  so there is no "forgot password", no confirm field, and no second screen —
 *  which is the entire reason Login, Register and Welcome could be deleted.
 */
export function useAuthScreen() {
  const { t } = useT()
  const setPendingEmail = useAuthStore((s) => s.setPendingEmail)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())

  const send = async () => {
    if (!valid || busy) return
    setBusy(true)
    setError(null)
    const { error: otpError } = await requestOTP(email.trim())
    setBusy(false)
    if (otpError) {
      setError(t('auth.errorGeneric'))
      return
    }
    setPendingEmail(email.trim())
    setSent(true)
  }

  return {
    email,
    setEmail,
    valid,
    sent,
    busy,
    error,
    send,
    reset: () => {
      setSent(false)
      setError(null)
    },
  }
}
