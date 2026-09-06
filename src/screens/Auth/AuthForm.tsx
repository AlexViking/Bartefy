import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Mail } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { T, useT } from '@/i18n/T'
import { itemUp, listStagger, spring, tween } from '@/lib/motion'
import { CODE_LENGTH } from './useAuth'
import type { useAuthScreen } from './useAuth'

/** The email step and the code step, shared by sign-in and sign-up and by both
 *  platform layouts. The two screens differ by one field and one footer line,
 *  which is not enough to justify two copies of the code entry.
 */
export function AuthForm({ a }: { a: ReturnType<typeof useAuthScreen> }) {
  /** mode="wait" so the outgoing step finishes before the next arrives —
   *  crossfading a form into a row of code boxes reads as two things fighting
   *  for the same space. */
  return (
    <AnimatePresence mode="wait" initial={false}>
      {a.step === 'code' ? (
        <motion.div
          key="code"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={tween.base}
          className="w-full"
        >
          <CodeStep a={a} />
        </motion.div>
      ) : (
        <motion.div
          key="email"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={tween.base}
          className="w-full"
        >
          <EmailStep a={a} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Email, plus the invite field on sign-up. */
function EmailStep({ a }: { a: ReturnType<typeof useAuthScreen> }) {
  const { t } = useT()
  const isSignUp = a.mode === 'signup'

  return (
    <motion.form
      variants={listStagger}
      initial="hidden"
      animate="show"
      className="flex w-full flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        void a.send()
      }}
    >
      <motion.div variants={itemUp}>
        <T
          as="h2"
          k={isSignUp ? 'auth.signUpTitle' : 'auth.signInTitle'}
          className="font-display text-h3 text-foreground"
        />
      </motion.div>

      {/* Name first, as in v5: it is the friendliest thing to be asked, and it
          is the only field here that is about the person rather than the
          account. Sign-in has no use for it — that account already has one. */}
      {isSignUp && (
        <motion.div variants={itemUp}>
          <Field
            label="auth.nameLabel"
            help="auth.nameHelp"
            placeholder="auth.namePlaceholder"
            autoComplete="name"
            autoFocus
            autoCapitalize="words"
            maxLength={60}
            value={a.name}
            onChange={(e) => a.setName(e.target.value)}
            required
          />
        </motion.div>
      )}

      <motion.div variants={itemUp}>
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
          required
        />
      </motion.div>

      {isSignUp && (
        <motion.div variants={itemUp} className="relative">
          <Field
            label="auth.inviteLabel"
            hint="auth.inviteHint"
            placeholder="auth.invitePlaceholder"
            help={a.referralValid === true ? undefined : 'auth.inviteHelp'}
            value={a.referral}
            onChange={(e) => a.setReferral(e.target.value)}
            // Uppercase as typed, so the field always looks like the printed
            // code. autoCapitalize covers the mobile keyboard, which ignores
            // CSS text-transform.
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            // Uppercasing the input must not reach the placeholder, which is a
            // lowercase example sentence and reads as shouting in caps.
            className="uppercase placeholder:normal-case"
          />
          {/* A recognised code is worth confirming; an unrecognised one is not
              worth an error, because the field is optional and the check is
              unavailable until migration 012 is applied. */}
          {a.referralValid === true && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={spring.snap}
              className="mt-1 flex items-center gap-1 font-body text-sm text-primary"
            >
              <Check className="size-3.5" aria-hidden="true" />
              <T k="auth.inviteFound" />
            </motion.p>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {a.error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={spring.snap}
            className="font-body text-sm leading-relaxed text-destructive"
          >
            {a.error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div variants={itemUp}>
        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={!a.valid || a.busy}
          data-i18n={isSignUp ? 'auth.createAccount' : 'auth.sendCode'}
        >
          {a.busy ? t('common.loading') : t(isSignUp ? 'auth.createAccount' : 'auth.sendCode')}
        </Button>
      </motion.div>

      {/* "Continue with Google" belongs here per the wireframe, and is left out
          until the provider is actually configured. A button that cannot work
          is worse than one that is not there yet. */}

      <motion.div variants={itemUp} className="flex items-center justify-center gap-1">
        <T
          as="span"
          k={isSignUp ? 'auth.haveAccount' : 'auth.needAccount'}
          className="font-body text-sm text-muted-foreground"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => a.switchTo(isSignUp ? 'signin' : 'signup')}
          data-i18n={isSignUp ? 'auth.logIn' : 'auth.signUp'}
        >
          {t(isSignUp ? 'auth.logIn' : 'auth.signUp')}
        </Button>
      </motion.div>
    </motion.form>
  )
}

/** The six boxes. Verification fires on the last digit, so there is no submit
 *  button — pasting the code from the email finishes the job on its own.
 */
function CodeStep({ a }: { a: ReturnType<typeof useAuthScreen> }) {
  const { t } = useT()
  const { code, verify, busy } = a

  /** Fire once per distinct code, never once per render that happens to see a
   *  full one. Both `busy` and `verify`'s identity flip false->true->false across
   *  a single attempt, so an effect keyed on either re-runs while the six digits
   *  are still in the boxes and sends the same token twice. Supabase consumes a
   *  code on first use, so that second call is answered 403 and the person is
   *  told their correct code was wrong. The ref records what has already been
   *  submitted, which state cannot do without triggering the render it guards.
   */
  const submitted = useRef<string | null>(null)

  useEffect(() => {
    if (code.length !== CODE_LENGTH) {
      // Backspacing out of a full code arms the next attempt, so a genuinely
      // rejected code can be retyped -- including the same digits again.
      if (code.length === 0) submitted.current = null
      return
    }
    if (busy || submitted.current === code) return
    submitted.current = code
    void verify(code)
  }, [code, busy, verify])

  const clock = `${Math.floor(a.countdown / 60)}:${String(a.countdown % 60).padStart(2, '0')}`

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={spring.pop}
        className="flex size-16 items-center justify-center rounded-pill bg-primary/[0.10]"
      >
        <Mail className="size-7 text-primary" aria-hidden="true" />
      </motion.span>

      <T as="h2" k="auth.codeSentTitle" className="font-display text-h3 text-foreground" />
      <p
        data-i18n="auth.codeSentBody"
        className="max-w-[38ch] font-body text-body leading-relaxed text-muted-foreground"
      >
        {t('auth.codeSentBody', { email: a.email })}
      </p>

      <motion.div
        // Keyed on the error text so a second rejection replays the shake
        // rather than sitting still because the value did not change.
        key={a.error ?? 'ok'}
        animate={a.error ? { x: [0, -8, 8, -5, 5, 0] } : undefined}
        transition={{ duration: 0.36, ease: 'easeInOut' }}
      >
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
      </motion.div>

      <AnimatePresence>
        {a.error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={spring.snap}
            className="font-body text-sm leading-relaxed text-destructive"
          >
            {a.error}
          </motion.p>
        )}
      </AnimatePresence>

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
