import { motion } from 'framer-motion'

import { BrandPanel } from '@/components/BrandPanel'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { OrzomiByline } from '@/components/OrzomiByline'
import { BrandLockup } from '@/components/shell/BrandMark'
import { T } from '@/i18n/T'
import { spring } from '@/lib/motion'
import { AuthForm } from './AuthForm'
import { useAuthMode } from './useAuthMode'
import { useAuthScreen } from './useAuth'

/** Sign in / sign up on desktop (15-signin-b): the form on the left, the
 *  brand on the right. The form and its code step are AuthForm, unchanged --
 *  the one-time-code rules in CLAUDE.md live there and in useAuth. */
export default function AuthDesktop() {
  const a = useAuthScreen(useAuthMode())

  return (
    <div className="grid min-h-dvh grid-cols-[minmax(420px,5fr)_7fr] bg-background">
      <main className="relative flex flex-col px-12 py-8">
        <div className="flex items-center justify-between">
          <BrandLockup withWord />
          <LanguageSwitcher />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.gentle}
          className="flex min-h-0 flex-1 flex-col justify-center"
        >
          <div className="w-full max-w-[400px]">
            <AuthForm a={a} />
          </div>
        </motion.div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <OrzomiByline />
          <T as="p" k="auth.terms" className="font-body text-[12px] text-muted-foreground" />
        </div>
      </main>
      <BrandPanel title="brand.swapLine" />
    </div>
  )
}
