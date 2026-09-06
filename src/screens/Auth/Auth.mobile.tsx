import { motion } from 'framer-motion'

import { Wordmark } from '@/components/Wordmark'
import { DriftingBlobs } from '@/components/auth/SwapAnimation'
import { spring } from '@/lib/motion'
import mapUrl from '@/assets/bartefy-bg-treasure-map.webp'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { T } from '@/i18n/T'
import { AuthForm } from './AuthForm'
import { useAuthMode } from './useAuthMode'
import { useAuthScreen } from './useAuth'

/** Auth, phone shape: a green header carrying the brand, the form below on
 *  parchment. One column, nothing to scroll past before the field.
 */
export default function AuthMobile() {
  const a = useAuthScreen(useAuthMode())

  return (
    // Map behind the whole screen, not just the header, so it carries past the
    // green edge instead of stopping at it.
    <div
      className="flex min-h-dvh flex-col bg-background"
      style={{
        backgroundImage: `url(${mapUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <header
        // shrink-0 because overflow-hidden (needed to clip the blobs) turns any
        // flex squeeze into a clipped heading — the taller sign-up form was
        // cutting "someone's treasure" in half.
        className="relative flex shrink-0 flex-col items-center gap-3 overflow-hidden px-6 pb-8 pt-10 text-center"
        style={{ backgroundColor: 'rgba(47,106,82,0.94)' }}
      >
        <div className="absolute right-3 top-3">
          <LanguageSwitcher className="text-primary-foreground hover:bg-primary-foreground/10" />
        </div>
        {/* No swap picture on the phone: the header is short, and the form is
            the thing to reach. The blobs give the panel life without taking
            vertical space the field needs. */}
        <DriftingBlobs />
        <Wordmark on="dark" className="relative" />
        <T
          as="h1"
          k="auth.welcomeTitle"
          className="relative max-w-[22ch] font-display text-h3 text-primary-foreground"
        />
      </header>

      <motion.main
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
        style={{ backgroundColor: 'rgba(247,242,225,0.93)' }}
        className="flex flex-1 flex-col gap-5 px-6 py-8"
      >
        <T
          as="p"
          k="auth.welcomeBody"
          className="font-body text-body leading-relaxed text-muted-foreground"
        />
        <AuthForm a={a} />
      </motion.main>
    </div>
  )
}
