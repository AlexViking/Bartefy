import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, ChevronRight } from 'lucide-react'

import { AppShell } from '@/components/shell/AppShell'
import { CityPicker } from '@/components/CityPicker'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { InfoHint } from '@/components/guidance/InfoHint'
import { resetNudges } from '@/components/guidance/NextStep'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { ToneBadge } from '@/components/ui/tone-badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { T, useT } from '@/i18n/T'
import { getProfile, signOut, updateProfile } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { useOnboardingStore } from '@/store/onboarding'

interface ProfileSettings {
  notif_match: boolean
  notif_push: boolean
  notif_email: boolean
  home_city: string
  tier: string | null
}

/** Settings is one column on both platforms — a list of rows reads the same
 *  everywhere, so it is width-constrained rather than platform-split.
 */
export function Settings() {
  const navigate = useNavigate()
  const { t } = useT()
  const userId = useAuthStore((s) => s.session?.user?.id)
  const email = useAuthStore((s) => s.session?.user?.email) ?? ''
  const setSelectedCity = useAuthStore((s) => s.setSelectedCity)
  const resetOnboarding = useOnboardingStore((s) => s.reset)

  const [notifMatch, setNotifMatch] = useState(true)
  const [notifPush, setNotifPush] = useState(true)
  const [notifEmail, setNotifEmail] = useState(false)
  const [homeCity, setHomeCity] = useState('')
  const [tier, setTier] = useState<string>('free')
  const [cityOpen, setCityOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    void (async () => {
      const { data, error } = await getProfile(userId)
      if (error || cancelled || !data) return
      const p = data as unknown as ProfileSettings
      setNotifMatch(p.notif_match ?? true)
      setNotifPush(p.notif_push ?? true)
      setNotifEmail(p.notif_email ?? false)
      setHomeCity(p.home_city ?? '')
      setTier(p.tier ?? 'free')
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  /** Every toggle writes through immediately — a settings screen with a Save
   *  button invites people to leave without pressing it. */
  const patch = async (changes: Record<string, unknown>) => {
    if (!userId) return
    const { error } = await updateProfile(userId, changes)
    if (error) console.error('[settings] save failed', error)
  }

  const chooseCity = async (city: string) => {
    setHomeCity(city)
    setSelectedCity(city)
    setCityOpen(false)
    await patch({ home_city: city })
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  /** Real deletion needs the service role, so this asks the server and signs
   *  out. Never pretend an account is gone when it is not. */
  const handleDelete = async () => {
    setDeleteOpen(false)
    await patch({ deletion_requested_at: new Date().toISOString() })
    await signOut()
    navigate('/')
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[640px] px-5 pb-10 pt-4">
        <header className="mb-6 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label={t('common.back')}
            className="flex size-11 items-center justify-center rounded-pill text-foreground hover:bg-foreground/[0.06]"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <T as="h1" k="settings.title" className="font-display text-h2 text-foreground" />
        </header>

        <Section title="settings.account">
          <Row label={email} literal />
          <Separator />
          <Row
            label="settings.language"
            help="settings.languageHelp"
            control={<LanguageSwitcher />}
          />
          <Separator />
          <Row
            label="onboarding.cityTitle"
            control={
              <button
                type="button"
                onClick={() => setCityOpen(true)}
                className="flex min-h-hit items-center gap-1 font-body text-muted-foreground hover:text-foreground"
              >
                {homeCity || t('common.optional')}
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            }
          />
        </Section>

        <Section title="settings.membership">
          {/* Label, badge and button do not fit one phone-width row, so this
              one stacks rather than truncating the label to "Mem…". */}
          <div className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center gap-2">
              <T as="p" k="membership.title" className="font-body text-base text-foreground" />
              <ToneBadge tone={tier === 'free' ? 'quiet' : 'green'}>
                {t(`membership.tier${tier.charAt(0).toUpperCase()}${tier.slice(1)}`)}
              </ToneBadge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/membership')}
              className="self-start"
              data-i18n="membership.manage"
            >
              {t('membership.manage')}
            </Button>
          </div>
          <Separator />
          <div className="px-4 py-3">
            <div className="flex items-center gap-1.5">
              <T
                as="p"
                k="membership.alwaysFreeTitle"
                className="font-display text-[15px] font-semibold text-foreground"
              />
              <InfoHint k="help.whyNoMoney" />
            </div>
            <T
              as="p"
              k="membership.alwaysFreeBody"
              className="mt-1 font-body text-sm leading-relaxed text-muted-foreground"
            />
          </div>
        </Section>

        <Section title="settings.notifications">
          <Row
            label="settings.notifMatch"
            control={
              <Switch
                checked={notifMatch}
                onCheckedChange={(v) => {
                  setNotifMatch(v)
                  void patch({ notif_match: v })
                }}
              />
            }
          />
          <Separator />
          <Row
            label="settings.notifMessage"
            control={
              <Switch
                checked={notifPush}
                onCheckedChange={(v) => {
                  setNotifPush(v)
                  void patch({ notif_push: v })
                }}
              />
            }
          />
          <Separator />
          <Row
            label="settings.notifEmail"
            control={
              <Switch
                checked={notifEmail}
                onCheckedChange={(v) => {
                  setNotifEmail(v)
                  void patch({ notif_email: v })
                }}
              />
            }
          />
        </Section>

        <Section title="stuck.title">
          <Row
            label="settings.replayTips"
            help="settings.replayTipsHelp"
            control={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetNudges()
                  resetOnboarding()
                  navigate('/welcome')
                }}
              >
                {t('common.retry')}
              </Button>
            }
          />
          <Separator />
          <Row
            label="settings.blocked"
            control={
              <button
                type="button"
                onClick={() => navigate('/settings/blocked')}
                className="flex min-h-hit items-center text-muted-foreground hover:text-foreground"
                aria-label={t('settings.blocked')}
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            }
          />
        </Section>

        <div className="mt-6 flex flex-col gap-2">
          <Button variant="ghost" fullWidth onClick={handleSignOut} data-i18n="settings.signOut">
            {t('settings.signOut')}
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => setDeleteOpen(true)}
            className="text-destructive"
            data-i18n="settings.deleteAccount"
          >
            {t('settings.deleteAccount')}
          </Button>
        </div>
      </div>

      <ResponsiveSheet open={cityOpen} onOpenChange={setCityOpen} title="onboarding.cityTitle">
        <CityPicker value={homeCity} onSelect={chooseCity} />
      </ResponsiveSheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-hero">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-h3">
              {t('settings.deleteAccount')}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-muted-foreground">
              {t('error.genericBody')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t('common.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useT()
  return (
    <section className="mb-6">
      <h2
        data-i18n={title}
        className="mb-2 px-1 font-display text-caption uppercase tracking-[0.18em] text-muted-foreground"
      >
        {t(title)}
      </h2>
      <Card className="overflow-hidden rounded border-border/[0.14] bg-card">{children}</Card>
    </section>
  )
}

function Row({
  label,
  help,
  literal = false,
  control,
}: {
  /** A translation key, unless `literal` is set. */
  label: string
  help?: string
  /** True when the label is user data (an email, a name) rather than a key.
   *  Such a row renders the text as-is and carries no data-i18n, so the
   *  translation sweep does not report it as an untranslated key. */
  literal?: boolean
  control?: React.ReactNode
}) {
  const { t } = useT()
  return (
    <div className="flex min-h-hit items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p
          data-i18n={literal ? undefined : label}
          className="truncate font-body text-base text-foreground"
        >
          {literal ? label : t(label)}
        </p>
        {help && (
          <p data-i18n={help} className="mt-0.5 font-body text-sm text-muted-foreground">
            {t(help)}
          </p>
        )}
      </div>
      {control}
    </div>
  )
}
