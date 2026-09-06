import { motion } from 'framer-motion'

import { Wordmark } from '@/components/Wordmark'
import { DriftingBlobs, SwapAnimation } from '@/components/auth/SwapAnimation'
import { spring } from '@/lib/motion'
import mapUrl from '@/assets/bartefy-bg-treasure-map.webp'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { T } from '@/i18n/T'
import { AuthForm } from './AuthForm'
import { useAuthMode } from './useAuthMode'
import { useAuthScreen } from './useAuth'

/** Auth, desktop shape: the brand holds the left half, the form the right.
 *  The form column is deliberately narrow — a single email field stretched
 *  across a wide screen reads as a mistake.
 */
export default function AuthDesktop() {
  const a = useAuthScreen(useAuthMode())

  return (
    // The map spans the whole screen rather than sitting inside the green
    // panel, so it is one continuous drawing crossing the seam instead of two
    // that happen to meet. Each half then lays its own tint over it: near-opaque
    // green on the left, a heavy parchment wash on the right where a form has
    // to stay readable on top of it.
    <div
      className="grid min-h-dvh grid-cols-2 bg-background"
      style={{
        backgroundImage: `url(${mapUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Both washes are drawn from tokens rather than literal rgba, so the
          dark theme moves them with everything else. --brand-deep stays the
          book green in both themes: this panel is the brand surface, and a
          lifted green here would read as a different colour to the logo
          sitting beside it. */}
      <aside
        className="relative flex flex-col justify-between overflow-hidden p-10"
        style={{
          backgroundColor: 'hsl(var(--brand-deep) / 0.94)',
        }}
      >
        <DriftingBlobs />

        {/* The logo lives on the parchment side, not here: the mark is mostly
            Bartefy green, so on a green panel the wordmark disappears and only
            its illustrations survive. relative on each child keeps the blobs
            behind the copy. */}
        <div className="relative max-w-[420px] space-y-4">
          <T as="h1" k="auth.welcomeTitle" className="font-display text-h2 text-[hsl(var(--parchment-on-brand))]" />
          <T
            as="p"
            k="auth.welcomeBody"
            className="font-body text-body leading-relaxed text-[hsl(var(--parchment-on-brand))]/80"
          />
        </div>

        <SwapAnimation className="relative" />

        <T
          as="p"
          k="membership.alwaysFreeBody"
          className="relative max-w-[420px] font-body text-sm leading-relaxed text-[hsl(var(--parchment-on-brand))]/70"
        />
      </aside>

      {/* 0.93 was found by looking: at 0.85 the map read as dirt behind the
          labels, and much above 0.95 it disappeared entirely. */}
      <main
        className="relative flex items-center justify-center px-14"
        style={{ backgroundColor: 'hsl(var(--background) / 0.93)' }}
      >
        <div className="absolute right-6 top-6">
          <LanguageSwitcher />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.gentle}
          className="flex w-full max-w-[400px] flex-col gap-6"
        >
          <Wordmark />
          <AuthForm a={a} />
        </motion.div>
      </main>
    </div>
  )
}
