import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { CityPicker } from '@/components/CityPicker'
import { OrzomiByline } from '@/components/OrzomiByline'
import { resetNudges } from '@/components/guidance/NextStep'
import { AppShell } from '@/components/shell/AppShell'
import { TopBarContext } from '@/components/shell/TopBarContext'
import { useShellData } from '@/components/shell/useShellData'
import { Button } from '@/components/ui/button'
import { Icon, type IconName } from '@/components/ui/icon'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { Switch } from '@/components/ui/switch'
import { SUPPORTED_LANGUAGES, loadLanguage } from '@/i18n'
import { T, useT } from '@/i18n/T'
import { getProfile, signOut, updateProfile } from '@/lib/api'
import { keys } from '@/lib/cache/queryClient'
import { useIsDesktop } from '@/lib/platform'
import { resetLocal } from '@/lib/resetLocal'
import { supabase } from '@/lib/supabase'
import { useTheme, type ThemePref } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { useOnboardingStore } from '@/store/onboarding'

type Row = Record<string, unknown>
type SectionId = 'account' | 'notifications' | 'language' | 'appearance' | 'privacy' | 'membership' | 'help'
const SECTIONS: { id: SectionId; icon: IconName }[] = [
  { id: 'account', icon: 'User' },
  { id: 'notifications', icon: 'Bell' },
  { id: 'language', icon: 'Languages' },
  { id: 'appearance', icon: 'Moon' },
  { id: 'privacy', icon: 'ShieldCheck' },
  { id: 'membership', icon: 'Star' },
  { id: 'help', icon: 'Info' },
]

/** Settings (proposal B): seven sections. Desktop shows the list and the
 *  picked section side by side; a phone opens a section full screen.
 *
 *  Every switch writes through at once (a Save button invites leaving without
 *  pressing it) -- and says so when it did NOT: the old screen logged a failed
 *  save to the console and left the switch looking saved.
 */
export function Settings() {
  const { t } = useT()
  const navigate = useNavigate()
  const desktop = useIsDesktop()
  const qc = useQueryClient()
  const shell = useShellData()
  const userId = useAuthStore((s) => s.session?.user?.id)
  const email = useAuthStore((s) => s.session?.user?.email) ?? ''
  const setSelectedCity = useAuthStore((s) => s.setSelectedCity)
  const resetOnboarding = useOnboardingStore((s) => s.reset)
  const { i18n } = useTranslation()
  const { pref, setPref } = useTheme()
  const lang = i18n.language?.split('-')[0] ?? 'en'
  const s = new URLSearchParams(useLocation().search).get('s') as SectionId | null
  const current: SectionId | null = s && SECTIONS.some((x) => x.id === s) ? s : desktop ? 'account' : null
  const open = (id: SectionId | null) => navigate(id ? `/settings?s=${id}` : '/settings', { replace: desktop })

  const [cityOpen, setCityOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  const { data: me } = useQuery({
    queryKey: keys.profile(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await getProfile(userId!)
      if (error) throw error
      return data as Row
    },
    enabled: !!userId,
    staleTime: 60_000,
  })
  const { data: blockedN = 0 } = useQuery({
    queryKey: ['blocks', 'count', userId ?? ''],
    queryFn: async () => {
      const { count, error } = await supabase.from('blocks').select('blocked', { count: 'exact', head: true }).eq('blocker', userId!)
      if (error) throw error
      return count ?? 0
    },
    enabled: !!userId,
  })

  /** Write one change; on failure say so and put the switch back. */
  const patch = async (changes: Row) => {
    if (!userId) return false
    const { data, error } = await updateProfile(userId, changes)
    if (error || !data || data.length === 0) {
      toast.error(t('settings.saveFailed'))
      void qc.invalidateQueries({ queryKey: keys.profile(userId) })
      return false
    }
    qc.setQueryData(keys.profile(userId), (old: Row | undefined) => ({ ...(old ?? {}), ...changes }))
    return true
  }

  const city = String(me?.home_city ?? '')
  const langName = SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.nativeLabel ?? lang
  const summary: Record<SectionId, string> = {
    account: [email, city].filter(Boolean).join(' · '),
    notifications: t('settings.notifSummary'),
    language: langName,
    appearance: t(`theme.${pref}`),
    privacy: t('settings.blockedN', { count: blockedN }),
    membership: t(`shell.tier_${shell.tier}`),
    help: t('settings.helpSummary'),
  }

  const row = (id: SectionId) => {
    const sec = SECTIONS.find((x) => x.id === id)!
    const on = current === id && desktop
    return (
      <button
        key={id}
        type="button"
        onClick={() => open(id)}
        aria-current={on ? 'true' : undefined}
        className={cn('flex w-full items-center gap-3 rounded-card px-3 py-3 text-left transition-colors', on ? 'bg-selected' : 'hover:bg-background')}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-background text-muted-foreground">
          <Icon name={sec.icon} size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <T as="span" k={`settings.sec_${id}`} className="block font-body text-label-lg text-foreground" />
          <span className="block truncate font-body text-[12px] text-muted-foreground">{summary[id]}</span>
        </span>
        <Icon name="ChevronRight" size={18} className="text-muted-foreground" />
      </button>
    )
  }

  const item = (title: string, body: React.ReactNode, control?: React.ReactNode) => (
    <div className="flex items-center gap-4 border-b border-input py-4 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="font-body text-label-lg text-foreground">{title}</p>
        <div className="font-body text-body-sm text-muted-foreground">{body}</div>
      </div>
      {control}
    </div>
  )

  const signOutNow = async () => {
    await resetLocal({ signOut })
    navigate('/')
  }

  const pane = (id: SectionId) => {
    switch (id) {
      case 'account':
        return (
          <>
            {/* An email and a city are user data. */}
            {item(t('settings.email'), t('settings.emailBody', { email }))}
            {item(
              t('settings.area'),
              t('settings.areaBody', { city: city || t('settings.noArea') }),
              <Button variant="ghost" size="sm" onClick={() => setCityOpen(true)}>
                <T as="span" k="area.change" />
              </Button>,
            )}
            {item(
              t('settings.nameAndPhoto'),
              String(me?.name ?? ''),
              <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
                <T as="span" k="settings.editInProfile" />
              </Button>,
            )}
            {item(
              t('settings.signOut'),
              t('settings.signOutBody'),
              <Button variant="ghost" size="sm" onClick={() => void signOutNow()}>
                <Icon name="LogOut" size={16} />
                <T as="span" k="settings.signOut" />
              </Button>,
            )}
            <div className="mt-6 flex items-center gap-4 rounded-card bg-background px-4 py-3">
              <div className="min-w-0 flex-1">
                <T as="p" k="settings.deleteAccount" className="font-body text-label-lg text-foreground" />
                <T as="p" k="settings.deleteSummary" className="font-body text-body-sm text-muted-foreground" />
              </div>
              <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)}>
                <T as="span" k="settings.deleteAction" />
              </Button>
            </div>
          </>
        )
      case 'notifications':
        return (
          <>
            {(
              [
                ['notif_match', 'settings.notifMatch', true],
                ['notif_push', 'settings.notifMessage', true],
                ['notif_email', 'settings.notifEmail', false],
              ] as const
            ).map(([col, k, def]) =>
              item(
                t(k),
                t(`${k}Help`),
                <Switch checked={Boolean(me?.[col] ?? def)} onCheckedChange={(v) => void patch({ [col]: v })} aria-label={t(k)} />,
              ),
            )}
            <T as="p" k="settings.pushNote" className="pt-3 font-body text-[12px] text-muted-foreground" />
          </>
        )
      case 'language':
        return (
          <div className="flex flex-col gap-1 pt-2">
            <T as="p" k="settings.languageHelp" className="pb-2 font-body text-body-sm text-muted-foreground" />
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                role="menuitemradio"
                aria-checked={l.code === lang}
                onClick={() => void loadLanguage(l.code)}
                className="flex h-12 items-center gap-3 rounded-card px-3 text-left hover:bg-background aria-checked:bg-selected"
              >
                <span className="w-8 font-body text-[11px] font-bold uppercase text-muted-foreground">{l.code}</span>
                {/* A language's own name is not translated. */}
                <span className="flex-1 font-body text-body-md text-foreground">{l.nativeLabel}</span>
                {l.code === lang && <Icon name="Check" size={18} className="text-primary" />}
              </button>
            ))}
          </div>
        )
      case 'appearance':
        return (
          <div className="grid grid-cols-3 gap-3 pt-3">
            {(['light', 'dark', 'system'] as ThemePref[]).map((p) => (
              <button key={p} type="button" aria-pressed={pref === p} onClick={() => setPref(p)} className="group flex flex-col gap-2 text-left">
                <span
                  className={cn(
                    'block aspect-[4/3] rounded-card ring-1 ring-input group-aria-pressed:ring-2 group-aria-pressed:ring-primary',
                    p === 'light' ? 'bg-paper' : p === 'dark' ? 'bg-ink' : 'bg-gradient-to-br from-paper from-50% to-ink to-50%',
                  )}
                />
                <T as="span" k={`theme.${p}`} className="font-body text-label-md text-foreground" />
              </button>
            ))}
          </div>
        )
      case 'privacy':
        return (
          <>
            {item(t('settings.privacyWho'), t('settings.privacyWhoBody'))}
            {item(t('settings.privacyArea'), t('settings.privacyAreaBody'))}
            {item(
              t('settings.blocked'),
              t('settings.blockedN', { count: blockedN }),
              <Button variant="ghost" size="sm" onClick={() => navigate('/settings/blocked')}>
                <T as="span" k="settings.seeBlocked" />
              </Button>,
            )}
          </>
        )
      case 'membership':
        return (
          <>
            {item(
              t(`shell.tier_${shell.tier}`),
              t('settings.membershipBody'),
              <Button size="sm" onClick={() => navigate('/points?tab=tiers')}>
                <T as="span" k="settings.seeTiers" />
              </Button>,
            )}
            <T as="p" k="pts.alwaysFree" className="pt-3 font-body text-[12px] text-muted-foreground" />
          </>
        )
      case 'help':
        return (
          <>
            {item(
              t('settings.replayTips'),
              t('settings.replayTipsHelp'),
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  resetNudges()
                  resetOnboarding()
                  toast.success(t('settings.tipsBack'))
                }}
              >
                <T as="span" k="settings.replayTipsAction" />
              </Button>,
            )}
            {/* A version string is the same in every language. */}
            {item(t('settings.buildLabel'), `Bartefy v${__APP_VERSION__} · ${__APP_COMMIT__} · ${__APP_BUILT_AT__}`)}
            <div className="pt-4">
              <OrzomiByline />
            </div>
          </>
        )
    }
  }

  const list = <nav className="flex flex-col gap-1">{SECTIONS.map((x) => row(x.id))}</nav>

  return (
    <AppShell>
      <TopBarContext>
        <T as="h1" k="settings.title" className="shrink-0 font-display text-headline-md text-foreground" />
      </TopBarContext>
      {desktop ? (
        <div className="flex min-h-full gap-6 px-6 py-4 lg:px-8">
          <div className="w-[360px] shrink-0 self-start rounded-card bg-card p-2 ring-1 ring-input">{list}</div>
          {current && (
            <div className="min-w-0 max-w-[720px] flex-1 self-start rounded-card bg-card px-6 py-5 ring-1 ring-input">
              <T as="h2" k={`settings.sec_${current}`} className="mb-2 font-display text-headline-md text-foreground" />
              {pane(current)}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 px-4 pb-6 pt-3">
            <T as="h1" k="settings.title" className="font-display text-[24px] font-bold leading-8 text-foreground" />
            {list}
          </div>
          {current && (
            <div className="fixed inset-0 z-50 flex flex-col bg-card">
              <header className="flex shrink-0 items-center gap-3 px-4 py-3">
                <button type="button" onClick={() => open(null)} aria-label={t('common.back')} className="-ml-2 grid size-10 place-items-center rounded-pill hover:bg-secondary">
                  <Icon name="ArrowLeft" size={22} />
                </button>
                <T as="h2" k={`settings.sec_${current}`} className="font-display text-headline-sm text-foreground" />
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">{pane(current)}</div>
            </div>
          )}
        </>
      )}

      <ResponsiveSheet open={cityOpen} onOpenChange={setCityOpen} title="onboarding.cityTitle">
        <CityPicker
          value={city}
          onSelect={async (c: string) => {
            setCityOpen(false)
            if (await patch({ home_city: c })) setSelectedCity(c)
          }}
        />
      </ResponsiveSheet>

      {/* Honest about what happens (open question, 2026-09-30): real deletion
          needs a service-role job that does not exist yet, so this RECORDS the
          request and signs out -- it does not say the account is gone. */}
      <ResponsiveSheet
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="settings.deleteTitle"
        description="settings.deleteBody"
        footer={
          <div className="flex w-full flex-col gap-2">
            <Button
              fullWidth
              size="lg"
              onClick={async () => {
                setDeleteOpen(false)
                if (await patch({ deletion_requested_at: new Date().toISOString() })) await signOutNow()
              }}
            >
              <T as="span" k="settings.deleteConfirm" />
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setDeleteOpen(false)}>
              <T as="span" k="common.notYet" />
            </Button>
          </div>
        }
      >
        <span className="sr-only">{t('settings.deleteBody')}</span>
      </ResponsiveSheet>
    </AppShell>
  )
}
