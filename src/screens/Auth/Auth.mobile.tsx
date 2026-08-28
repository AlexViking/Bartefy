import logoUrl from '@/assets/bartefy-logo-lockup.png'
import mapUrl from '@/assets/bartefy-bg-treasure-map.png'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { T, useT } from '@/i18n/T'
import { AuthForm } from './AuthForm'
import { useAuthScreen } from './useAuth'

/** Auth, phone shape: a green header carrying the brand, the form below on
 *  parchment. One column, nothing to scroll past before the field.
 */
export default function AuthMobile() {
  const a = useAuthScreen()
  const { t } = useT()

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header
        className="relative flex flex-col items-center gap-3 px-6 pb-8 pt-10 text-center"
        style={{
          backgroundImage: `linear-gradient(rgba(47,106,82,0.92), rgba(47,106,82,0.92)), url(${mapUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute right-3 top-3">
          <LanguageSwitcher className="text-primary-foreground hover:bg-primary-foreground/10" />
        </div>
        <img src={logoUrl} alt={t('brand.name')} className="h-14 brightness-0 invert" />
        <T
          as="h1"
          k="auth.welcomeTitle"
          className="max-w-[22ch] font-display text-h3 text-primary-foreground"
        />
      </header>

      <main className="flex flex-1 flex-col gap-5 px-6 py-8">
        <T
          as="p"
          k="auth.welcomeBody"
          className="font-body text-body leading-relaxed text-muted-foreground"
        />
        <AuthForm a={a} />
      </main>
    </div>
  )
}
