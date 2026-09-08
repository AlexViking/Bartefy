import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { checkReferralCode, requestSignInOTP, requestSignUpOTP, verifyOTP } from '@/lib/api'
import { useT } from '@/i18n/T'
import { useAuthStore } from '@/store/auth'

/** Must match "Email OTP Length" under Authentication > Providers > Email in the
 *  Supabase dashboard. Supabase defaults to 8; six is the length people expect
 *  from an auth code and the one that fits a phone-width row of boxes. If the
 *  two ever disagree the boxes fill before the code is complete and every
 *  attempt fails, so change them together.
 */
export const CODE_LENGTH = 6
const RESEND_SECONDS = 60

/** Which screen is using this hook. Both ask for an email and then a code, so
 *  they share one engine — but they must not share a request, because the whole
 *  point of splitting them is that a typo on sign-in should say "no account
 *  here" instead of silently creating one.
 */
export type AuthMode = 'signin' | 'signup'

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** Invite codes are generated from an alphabet with no O/0 or I/1/L, so anything
 *  outside this set is a typo rather than a code we could look up. Accepting the
 *  hyphen keeps the ALEX-7F3 shape from the wireframe typeable.
 */
const CODE_RE = /^[A-Z0-9-]{3,16}$/

export function useAuthScreen(mode: AuthMode) {
  const { t } = useT()
  const navigate = useNavigate()
  const location = useLocation()
  const setPendingEmail = useAuthStore((s) => s.setPendingEmail)

  const [step, setStep] = useState<'email' | 'code'>('email')
  /** switchTo carries the address across, so someone told "no account here"
   *  does not retype it just to act on being told. */
  const [email, setEmail] = useState(
    () => (location.state as { email?: string } | null)?.email ?? '',
  )
  const [name, setName] = useState('')
  const [referral, setReferralRaw] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  /** null = not checked or not checkable. The field stays optional either way;
   *  this only ever softens into a hint, never a block. */
  const [referralValid, setReferralValid] = useState<boolean | null>(null)
  /** The code this screen has already sent for checking.
   *
   *  NOT an in-flight flag. An in-flight flag is released the moment the
   *  request resolves, which is *before* React commits the render that
   *  resolution caused -- so the auto-submit effect re-ran with six digits
   *  still in the boxes and a guard already back to false, and sent the same
   *  token a second time. Supabase consumes a code on first use, so that second
   *  call was answered 403 and someone whose login had just SUCCEEDED was told
   *  their code was wrong. Refreshing then "fixed" it only because the session
   *  from the first call was already in storage.
   *
   *  Remembering the value instead closes that window: the code stays claimed
   *  after the request ends, and only editing the code or asking for a new one
   *  releases it. */
  const attempted = useRef<string | null>(null)
  /** In-flight guard for send, kept apart from verify's. Sharing one flag is
   *  what let a blocked submit fire the moment a verification returned. */
  const sending = useRef(false)

  const emailValid = EMAIL_RE.test(email.trim())
  /** Required on sign-up: this is the one thing the other side of a swap sees
   *  before deciding whether to meet you, and there is nowhere else in the app
   *  to set it. Capped to match the 60 the trigger truncates at, so the limit
   *  is felt while typing rather than discovered afterwards. */
  const nameValid = mode !== 'signup' || (name.trim().length >= 2 && name.trim().length <= 60)
  // An invite code is optional, so an empty one is valid. A malformed one is
  // not worth sending — but it never blocks signup, only warns.
  const referralWellFormed = referral.trim() === '' || CODE_RE.test(referral.trim())
  const valid = emailValid && nameValid && referralWellFormed

  useEffect(() => {
    if (countdown <= 0) return
    const id = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [countdown])

  /** Codes are shown and printed uppercase, and nobody types an invite the way
   *  it was printed. Uppercasing as they type means the field always looks like
   *  the code they were given. */
  const setReferral = (value: string) => {
    setReferralRaw(value.toUpperCase())
    setReferralValid(null)
    if (error) setError(null)
  }

  /** Check the code once typing settles, so the person hears about a bad invite
   *  before they commit rather than after the account exists. Debounced because
   *  this fires per keystroke otherwise. */
  useEffect(() => {
    if (mode !== 'signup') return
    const value = referral.trim()
    if (!value || !CODE_RE.test(value)) return
    let cancelled = false
    const id = setTimeout(async () => {
      const result = await checkReferralCode(value)
      if (!cancelled) setReferralValid(result)
    }, 500)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
  }, [referral, mode])

  /** Which step failed decides the wording. Supabase says "invalid" for both a
   *  rejected address and a rejected code, so matching on the text alone would
   *  tell someone their code was wrong before they had been given one.
   */
  const messageFor = (raw: string, where: 'send' | 'verify'): string => {
    const m = raw.toLowerCase()
    // Underscored codes as well as prose: Supabase answers
    // over_email_send_rate_limit and over_request_rate_limit, neither of which
    // contains "rate limit" with a space, so matching prose alone let a
    // throttled send fall through to the generic message.
    if (
      m.includes('rate limit') ||
      m.includes('rate_limit') ||
      m.includes('too many') ||
      m.includes('security purposes')
    )
      return t('auth.errorRateLimited')
    if (where === 'verify') {
      // Supabase answers "Token has expired or is invalid" for a mistyped code
      // and a stale one alike, so one message has to cover both honestly
      // rather than assert which of the two it was.
      //
      // What it must NOT do is tell the person to ask for a fresh code. A
      // resend is the one action that spends the quota they may already be
      // against, and requesting one invalidates the code sitting in their
      // inbox -- so advising it turns one failure into a loop. Retyping is
      // free; the resend button is right there when they want it.
      if (m.includes('expired') || m.includes('invalid') || m.includes('token'))
        return t('auth.errorBadCode')
      return t('auth.errorGeneric')
    }
    // Sign-in with shouldCreateUser:false answers otp_disabled for an address
    // that has no account. That is the entire reason these are two screens, so
    // it gets its own message pointing at the other one.
    if (m.includes('signups not allowed') || m.includes('otp_disabled'))
      return t('auth.errorNoAccount')
    if (m.includes('already registered') || m.includes('already been registered'))
      return t('auth.errorHaveAccount')
    if (m.includes('invalid') || m.includes('email')) return t('auth.errorBadEmail')
    return t('auth.errorGeneric')
  }

  /** Ask for a code. Doubles as the resend, which is why it clears whatever
   *  the last failed attempt left in the boxes.
   *
   *  NEVER called automatically. A code is good for an hour, so a second email
   *  arriving on its own is not a convenience -- it invalidates the code the
   *  person is already holding, and they are then typing a dead one from an
   *  email they were reading a moment ago. Only the Resend button and the
   *  email form's own submit reach this.
   */
  const send = async () => {
    // Guarded on its own ref, not on `busy`. `busy` is shared with verify, so
    // it flips false the instant a verification finishes -- and a submit that
    // was blocked during the check would then go through and send a second
    // email nobody asked for.
    if (!valid || sending.current || countdown > 0) return
    // A resend belongs to the email step. Reaching here from the code step
    // means a stray submit, which is exactly the duplicate-email path.
    if (step === 'code' && countdown > 0) return
    sending.current = true
    setBusy(true)
    setError(null)
    const address = email.trim()

    const { error: otpError } =
      mode === 'signup'
        ? await requestSignUpOTP(address, {
            name: name.trim() || undefined,
            referralCode: referral.trim() || undefined,
          })
        : await requestSignInOTP(address)

    sending.current = false
    setBusy(false)
    if (otpError) {
      setError(messageFor(otpError.message, 'send'))
      return
    }
    setPendingEmail(address)
    setCode('')
    // A fresh code is a fresh claim: whatever was tried against the old one
    // must not block the new one, even if the digits happen to repeat.
    attempted.current = null
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
      // Claimed before the await and deliberately NOT released after it. A code
      // is spent the moment Supabase sees it, so "have I already sent this
      // one?" is the honest question -- "is one in flight?" reopens the moment
      // the request lands and lets the same token go twice.
      if (value.length !== CODE_LENGTH || attempted.current === value) return
      attempted.current = value
      setBusy(true)
      setError(null)
      const { error: verifyError } = await verifyOTP(email.trim(), value)
      setBusy(false)
      if (verifyError) {
        setError(messageFor(verifyError.message, 'verify'))
        // Clear the boxes so the next attempt starts from empty rather than
        // needing six backspaces first. changeCode releases the claim, so the
        // very same digits can be typed again -- which matters when the code
        // was fine and the network was not.
        setCode('')
      }
      // On success nothing is cleared: the session lands via onAuthStateChange
      // and this screen unmounts. Leaving the claim in place stops a late
      // re-render from spending the consumed token on the way out.
    },
    // messageFor closes over t, which is stable per language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [email, t],
  )

  /** Typing again after a rejected code should clear the error, otherwise it
   *  sits under boxes the person is actively fixing. */
  const changeCode = (value: string) => {
    // Editing the code releases the claim, so the same six digits can be sent
    // again after a failure. This is what an earlier "remember the code" guard
    // got wrong: it never released, so a rejected code became untypeable and
    // people were locked out of a code that was good for another hour.
    if (value !== attempted.current) attempted.current = null
    setCode(value)
    if (error) setError(null)
  }

  /** Move to the other screen carrying the address across. Someone told "no
   *  account here" should not have to type their email a second time to act on
   *  it, and the same in reverse. */
  const switchTo = (target: AuthMode) => {
    navigate(target === 'signup' ? '/signup' : '/login', {
      replace: true,
      state: { email: email.trim() },
    })
  }

  return {
    mode,
    step,
    email,
    setEmail,
    name,
    setName,
    nameValid,
    referral,
    setReferral,
    referralValid,
    code,
    setCode: changeCode,
    emailValid,
    valid,
    busy,
    error,
    countdown,
    canResend: countdown === 0 && !busy,
    send,
    verify,
    switchTo,
    /** Back to the email field — "that is the wrong address". */
    reset: () => {
      setStep('email')
      setCode('')
      attempted.current = null
      setError(null)
      setCountdown(0)
    },
  }
}
