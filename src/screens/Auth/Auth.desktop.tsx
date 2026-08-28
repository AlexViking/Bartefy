import logoUrl from '@/assets/bartefy-logo-lockup.png'
import mapUrl from '@/assets/bartefy-bg-treasure-map.png'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { T, useT } from '@/i18n/T'
import { AuthForm } from './AuthForm'
import { useAuthScreen } from './useAuth'

/** Auth, desktop shape: the brand holds the left half, the form the right.
 *  The form column is deliberately narrow — a single email field stretched
 *  across a wide screen reads as a mistake.
 */
export default function AuthDesktop() {
  const a = useAuthScreen()
  const { t } = useT()

  return (
    <div className="grid min-h-dvh grid-cols-2 bg-background">
      <aside
        className="flex flex-col justify-between p-10"
        style={{
          backgroundImage: `linear-gradient(rgba(47,106,82,0.92), rgba(47,106,82,0.92)), url(${mapUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <img src={logoUrl} alt={t('brand.name')} className="h-14 w-fit brightness-0 invert" />
        <div className="max-w-[420px] space-y-4">
          <T as="h1" k="auth.welcomeTitle" className="font-display text-h2 text-primary-foreground" />
          <T
            as="p"
            k="auth.welcomeBody"
            className="font-body text-body leading-relaxed text-primary-foreground/80"
          />
        </div>
        <T
          as="p"
          k="membership.alwaysFreeBody"
          className="max-w-[420px] font-body text-sm leading-relaxed text-primary-foreground/70"
        />
      </aside>

      <main className="relative flex items-center justify-center px-14">
        <div className="absolute right-6 top-6">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-[400px]">
          <AuthForm a={a} />
        </div>
      </main>
    </div>
  )
}
