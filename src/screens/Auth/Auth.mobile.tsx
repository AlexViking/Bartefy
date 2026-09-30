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

/** Sign in / sign up on a phone (15-signin-b): the brand as a green banner,
 *  then the form. AuthForm is unchanged. */
export default function AuthMobile() {
  const a = useAuthScreen(useAuthMode())

  return (
    <div className="flex min-h-dvh flex-col bg-background px-6 py-8">
      <header className="flex items-center justify-between">
        <BrandLockup withWord wordWidth={110} />
        <LanguageSwitcher />
      </header>
      <BrandPanel title="brand.swapLine" compact className="mt-6" />
      <motion.main
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring.gentle}
        className="flex flex-1 flex-col pb-8 pt-6"
      >
        <AuthForm a={a} />
      </motion.main>
      <footer className="flex flex-col gap-2 pt-6">
        <OrzomiByline className="self-start" />
        <T as="p" k="auth.terms" className="font-body text-[12px] text-muted-foreground" />
      </footer>
    </div>
  )
}
