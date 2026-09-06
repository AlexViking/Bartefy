import { motion } from 'framer-motion'

import { Wordmark } from '@/components/Wordmark'
import { spring } from '@/lib/motion'
import mapUrl from '@/assets/bartefy-bg-treasure-map.webp'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { T } from '@/i18n/T'
import { AuthForm } from './AuthForm'
import { useAuthMode } from './useAuthMode'
import { useAuthScreen } from './useAuth'

/** Auth, phone shape: one parchment column, brand at the top left, form below.
 *
 *  The green header is gone. The logo is mostly Bartefy green, so on a green
 *  panel the wordmark vanished and only its illustrations survived — and a band
 *  of colour above the fold was spending vertical space on the screen where the
 *  form matters most. The treasure map carries the brand instead.
 */
export default function AuthMobile() {
  const a = useAuthScreen(useAuthMode())

  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{
        backgroundImage: `url(${mapUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* The wash sits on the whole column rather than on main alone: with no
          green band above it, a seam partway down would be a line with nothing
          on either side to justify it. */}
      <div
        className="flex min-h-dvh flex-col"
        style={{ backgroundColor: 'hsl(var(--background) / 0.93)' }}
      >
        <header className="flex shrink-0 items-start justify-between px-6 pt-8">
          <Wordmark />
          <LanguageSwitcher />
        </header>

        <motion.main
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.gentle}
          className="flex flex-1 flex-col gap-5 px-6 pb-8 pt-6"
        >
          <T
            as="h1"
            k="auth.welcomeTitle"
            className="max-w-[20ch] font-display text-h2 text-foreground"
          />
          <T
            as="p"
            k="auth.welcomeBody"
            className="font-body text-body leading-relaxed text-muted-foreground"
          />
          <AuthForm a={a} />
        </motion.main>
      </div>
    </div>
  )
}
