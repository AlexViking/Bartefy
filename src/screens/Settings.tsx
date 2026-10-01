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
import { Button } from '@/components/ui/button'
import { Icon, type IconName } from '@/components/ui/icon'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { Switch } from '@/components/ui/switch'
import { UserAvatar } from '@/components/ui/user-avatar'
import { SUPPORTED_LANGUAGES, loadLanguage } from '@/i18n'
import { T, useT } from '@/i18n/T'
import { getProfile, listBlocked, signOut, unblockUser, updateProfile } from '@/lib/api'
import { keys } from '@/lib/cache/queryClient'
import { tierOf } from '@/lib/membership'
import { useIsDesktop } from '@/lib/platform'
import { resetLocal } from '@/lib/resetLocal'
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
  { id: 'appearance', icon: 'Contrast' },
  { id: 'privacy', icon: 'ShieldAlert' },
  { id: 'membership', icon: 'Award' },
  { id: 'help', icon: 'CircleHelp' },
]

/** The mock's (13-settings-b) outlined button, on top of the shadcn Button. */
const OUTLINE = 'h-10 gap-1.5 whitespace-nowrap rounded-card px-3.5 font-body text-label-lg text-foreground'

/** From this width every section shows at once, in three columns (the mock:
 *  "Alex reviews at ~1920: short sections left the pane half empty"). */
const ALL_AT_ONCE = '(min-width: 1600px)'
/** Which sections stand in which column there -- fixed, as the mock lays them
 *  out, rather than left to CSS column balancing, which moves cards between
 *  columns whenever a section's height changes (a blocked person, a language). */
const COLUMNS: SectionId[][] = [['account'], ['notifications', 'language'], ['appearance', 'privacy', 'membership', 'help']]

function useMedia(query: string) {
  const get = () => typeof window !== 'undefined' && window.matchMedia(query).matches
  const [on, setOn] = React.useState(get)
  React.useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setOn(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return on
}

interface Blocked {
  id: string
  name: string | null
  since: string
}

/** Settings (proposal B, 13-settings-b): seven sections.
 *
 *  Phone: the list, and a section opens full screen. Desktop: the list beside
 *  the picked section, both the height of the window. From 1600px: no list --
 *  every section is a card, in three columns.
 *
 *  Every switch writes through at once (a Save button invites leaving without
 *  pressing it) -- and says so when it did NOT: the old screen logged a failed
 *  save to the console and left the switch looking saved.
 */
export function Settings() {
  const { t, lang: uiLang } = useT()
  const navigate = useNavigate()
  const desktop = useIsDesktop()
  const all = useMedia(ALL_AT_ONCE) && desktop
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
  const [unblocking, setUnblocking] = React.useState<Blocked | null>(null)

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
  const blockedKey = ['blocks', 'list', userId ?? '']
  const { data: blocked = [] } = useQuery({
    queryKey: blockedKey,
    queryFn: async (): Promise<Blocked[]> => {
      const { data, error } = await listBlocked(userId!)
      if (error) throw error
      return (data ?? []).map((r) => ({
        id: String(r.blocked),
        name: (r.profile as { name?: string | null } | null)?.name ?? null,
        since: String(r.created_at),
      }))
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

  const unblockNow = async () => {
    const who = unblocking
    if (!userId || !who) return
    setUnblocking(null)
    const { data, error } = await unblockUser(userId, who.id)
    // .select() on the delete: no row back means RLS refused it, silently.
    if (error || !data || data.length === 0) {
      toast.error(t('settings.unblockFailed'))
      return
    }
    qc.setQueryData(blockedKey, (old: Blocked[] | undefined) => (old ?? []).filter((b) => b.id !== who.id))
  }

  const city = String(me?.home_city ?? '')
  const langName = SUPPORTED_LANGUAGES.find((l) => l.code === lang)?.nativeLabel ?? lang
  const spec = tierOf(shell.tier)
  const reach = spec.radiusKm ? t('rail.km', { n: spec.radiusKm }) : t('rail.noCap')
  const version = `Bartefy v${__APP_VERSION__} · build ${__APP_COMMIT__} · ${String(__APP_BUILT_AT__).slice(0, 16).replace('T', ' ')}`
  const summary: Record<SectionId, string> = {
    account: [email, city].filter(Boolean).join(' · '),
    notifications: t('settings.notifSummary'),
    language: langName,
    appearance: t(`theme.${pref}`),
    privacy: t('settings.blockedN', { count: blocked.length }),
    membership: t(`shell.tier_${shell.tier}`),
    help: t('settings.helpSummary'),
  }
  const since = (iso: string) => {
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? '' : new Intl.DateTimeFormat(uiLang, { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
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
        className={cn('flex w-full items-center gap-3 rounded-card px-3 py-3 text-left transition-colors', on ? 'bg-selected' : 'hover:bg-secondary')}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-background text-muted-foreground">
          <Icon name={sec.icon} size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <T as="span" k={`settings.sec_${id}`} className="block font-body text-label-lg text-foreground" />
          <span className="block truncate font-body text-[12px] text-muted-foreground">{summary[id]}</span>
        </span>
        <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
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
            <div>
              {/* An email and a city are user data. */}
              {item(t('settings.email'), t('settings.emailBody', { email }))}
              {item(
                t('settings.area'),
                t('settings.areaBody', { city: city || t('settings.noArea') }),
                <Button variant="ghost" className={OUTLINE} onClick={() => setCityOpen(true)}>
                  <T as="span" k="area.change" />
                </Button>,
              )}
              {item(
                t('settings.nameAndPhoto'),
                String(me?.name ?? ''),
                <Button variant="ghost" className={OUTLINE} onClick={() => navigate('/profile')}>
                  <T as="span" k="settings.editInProfile" />
                </Button>,
              )}
              {item(
                t('settings.signOut'),
                t('settings.signOutBody'),
                <Button variant="ghost" className={OUTLINE} onClick={() => void signOutNow()}>
                  <Icon name="LogOut" size={18} />
                  <T as="span" k="settings.signOut" />
                </Button>,
              )}
            </div>
            <div className="mt-8 flex items-center gap-4 rounded-card bg-background p-4">
              <div className="min-w-0 flex-1">
                <T as="p" k="settings.deleteAccount" className="font-body text-label-lg text-foreground" />
                <T as="p" k="settings.deleteSummary" className="font-body text-body-sm text-muted-foreground" />
              </div>
              <Button variant="ghost" className={OUTLINE} onClick={() => setDeleteOpen(true)}>
                <T as="span" k="settings.deleteAction" />
              </Button>
            </div>
          </>
        )
      case 'notifications':
        return (
          <>
            <div>
              {(
                [
                  ['notif_match', 'settings.notifMatch', true],
                  ['notif_push', 'settings.notifMessage', true],
                  ['notif_email', 'settings.notifEmail', false],
                ] as const
              ).map(([col, k, def]) => (
                <React.Fragment key={col}>
                  {item(
                    t(k),
                    t(`${k}Help`),
                    <Switch checked={Boolean(me?.[col] ?? def)} onCheckedChange={(v) => void patch({ [col]: v })} aria-label={t(k)} />,
                  )}
                </React.Fragment>
              ))}
            </div>
            <T as="p" k="settings.pushNote" className="mt-4 font-body text-[12px] text-muted-foreground" />
          </>
        )
      case 'language':
        return (
          <>
            <T as="p" k="settings.languageHelp" className="mb-3 font-body text-body-sm text-muted-foreground" />
            <RadioGroup value={lang} onValueChange={(code) => void loadLanguage(code)} className="flex flex-col gap-0">
              {SUPPORTED_LANGUAGES.map((l, i) => (
                <label
                  key={l.code}
                  className={cn('flex cursor-pointer items-center gap-4 py-3', i > 0 && 'border-t border-input')}
                >
                  <RadioGroupItem value={l.code} className="size-5" />
                  <span className="flex-1">
                    {/* A language's own name is not translated. */}
                    <span className="block font-body text-label-lg text-foreground">{l.nativeLabel}</span>
                    {l.code === 'en' && <T as="span" k="settings.languageOriginal" className="block font-body text-[12px] text-muted-foreground" />}
                  </span>
                  <span className="font-display text-[12px] font-bold uppercase text-muted-foreground">{l.code}</span>
                </label>
              ))}
            </RadioGroup>
          </>
        )
      case 'appearance':
        return (
          <div className="grid grid-cols-3 gap-4 pt-1">
            {(['light', 'dark', 'system'] as ThemePref[]).map((p) => (
              <button key={p} type="button" aria-pressed={pref === p} onClick={() => setPref(p)} className="group flex flex-col gap-2 text-left">
                {/* A small picture of the page in that theme (the mock). */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'block aspect-[4/3] w-full overflow-hidden rounded-card p-3 ring-2 ring-transparent group-aria-pressed:ring-primary',
                    p === 'light' ? 'bg-paper' : p === 'dark' ? 'bg-ink' : 'bg-[linear-gradient(135deg,#F5F4EF_50%,#17191E_50%)]',
                  )}
                >
                  <span className={cn('block h-2.5 w-2/3 rounded-pill', p === 'dark' ? 'bg-white/20' : 'bg-ink/15')} />
                  <span className={cn('mt-2 block h-12 rounded-lg', p === 'dark' ? 'bg-white/10' : 'bg-white')} />
                  <span className="mt-2 block h-2.5 w-1/3 rounded-pill bg-green" />
                </span>
                <span className="flex items-center gap-2 font-body text-label-lg text-foreground">
                  <span className="grid size-5 place-items-center rounded-pill ring-2 ring-input group-aria-pressed:ring-primary">
                    <span className="size-2.5 rounded-pill bg-primary opacity-0 group-aria-pressed:opacity-100" />
                  </span>
                  <T as="span" k={`theme.${p}`} />
                </span>
              </button>
            ))}
          </div>
        )
      case 'privacy':
        return (
          <>
            <div className="flex gap-3 rounded-card bg-background p-4">
              <Icon name="Eye" size={20} className="shrink-0 text-muted-foreground" />
              <div>
                <T as="p" k="settings.privacyWho" className="font-body text-label-lg text-foreground" />
                <p className="font-body text-body-sm text-muted-foreground">
                  {t('settings.privacyWhoBody')}{' '}
                  {userId && (
                    <button type="button" onClick={() => navigate('/u/' + userId)} className="text-primary hover:underline">
                      {t('settings.privacySeeHow')}
                    </button>
                  )}
                </p>
              </div>
            </div>
            <T as="p" k="settings.blocked" className="mt-6 font-body text-label-sm uppercase tracking-wider text-muted-foreground" />
            <T as="p" k="settings.blockedBody" className="mt-1 font-body text-body-sm text-muted-foreground" />
            {blocked.length === 0 ? (
              <T as="p" k="settings.blockedEmptyTitle" className="mt-2 border-t border-input py-3 font-body text-body-sm text-muted-foreground" />
            ) : (
              <ul className="mt-2">
                {blocked.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 border-t border-input py-3">
                    <UserAvatar name={b.name || t('settings.someone')} size="md" />
                    <span className="min-w-0 flex-1">
                      {/* A name is user data. */}
                      <span className="block truncate font-body text-label-lg text-foreground">{b.name || t('settings.someone')}</span>
                      <span className="block font-body text-[12px] text-muted-foreground">{t('settings.blockedSince', { when: since(b.since) })}</span>
                    </span>
                    <Button variant="ghost" className={OUTLINE} onClick={() => setUnblocking(b)}>
                      <T as="span" k="settings.unblock" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <T as="p" k="settings.blockingFree" className="mt-4 font-body text-[12px] text-muted-foreground" />
          </>
        )
      case 'membership':
        return (
          <>
            {item(
              t(`shell.tier_${shell.tier}`),
              spec.liveFinds != null && spec.activeSwaps != null
                ? t('settings.memCaps', { finds: spec.liveFinds, swaps: spec.activeSwaps, reach })
                : t('settings.memNoCaps', { reach }),
              <Button variant="ghost" className={OUTLINE} onClick={() => navigate('/points?tab=tiers')}>
                <T as="span" k="settings.pointsAndTiers" />
              </Button>,
            )}
            <T as="p" k="settings.memNote" className="font-body text-body-sm text-muted-foreground" />
          </>
        )
      case 'help':
        return (
          <>
            <div>
              {item(
                t('settings.replayTips'),
                t('settings.replayTipsHelp'),
                <Button
                  variant="ghost"
                  className={OUTLINE}
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
              {item(
                t('settings.buildLabel'),
                version,
                <Button
                  variant="ghost"
                  className={OUTLINE}
                  onClick={() =>
                    void navigator.clipboard.writeText(version).then(
                      () => toast.success(t('settings.versionCopied')),
                      () => toast.error(t('settings.copyFailed')),
                    )
                  }
                >
                  <Icon name="Copy" size={18} />
                  <T as="span" k="settings.copy" />
                </Button>,
              )}
            </div>
            <div className="pt-4">
              <OrzomiByline />
            </div>
          </>
        )
    }
  }

  const title = (id: SectionId) => <T as="h2" k={`settings.sec_${id}`} className="font-display text-headline-md text-foreground" />
  const list = <nav className="flex flex-col gap-0.5 p-2">{SECTIONS.map((x) => row(x.id))}</nav>

  let body: React.ReactNode
  if (all) {
    body = (
      <div className="h-full overflow-y-auto px-8 pb-6 pt-6">
        <div className="grid grid-cols-3 items-start gap-6">
          {COLUMNS.map((col) => (
            <div key={col[0]} className="flex flex-col gap-6">
              {col.map((id) => (
                <section key={id} className="rounded-card bg-card px-6 pb-6 pt-5 ring-1 ring-input">
                  <div className="pb-2">{title(id)}</div>
                  {pane(id)}
                </section>
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  } else if (desktop) {
    body = (
      <div className="flex h-full min-h-0 gap-6 px-6 pb-6 pt-6 lg:px-8">
        <div className="w-[clamp(320px,26vw,400px)] shrink-0 overflow-y-auto rounded-card bg-card ring-1 ring-input">{list}</div>
        {current && (
          <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-card bg-card ring-1 ring-input">
            <header className="shrink-0 px-6 pb-2 pt-5">{title(current)}</header>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              <div className="max-w-[640px]">{pane(current)}</div>
            </div>
          </section>
        )}
      </div>
    )
  } else {
    body = (
      <>
        <div className="min-h-full bg-card">
          <div className="px-5 pt-4">
            <T as="h1" k="settings.title" className="font-display text-headline-md text-foreground" />
          </div>
          {list}
        </div>
        {current && (
          <div className="fixed inset-0 z-50 flex flex-col bg-card">
            <header className="flex shrink-0 items-center gap-2 px-6 pb-2 pt-5">
              <button type="button" onClick={() => open(null)} aria-label={t('common.back')} className="-ml-2 grid size-10 shrink-0 place-items-center rounded-pill hover:bg-secondary">
                <Icon name="ArrowLeft" size={22} />
              </button>
              {title(current)}
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{pane(current)}</div>
          </div>
        )}
      </>
    )
  }

  return (
    <AppShell>
      <TopBarContext>
        <T as="h1" k="settings.title" className="shrink-0 font-display text-headline-md text-foreground" />
      </TopBarContext>
      {body}

      <ResponsiveSheet open={cityOpen} onOpenChange={setCityOpen} title="onboarding.cityTitle">
        <CityPicker
          value={city}
          onSelect={async (c: string) => {
            setCityOpen(false)
            if (await patch({ home_city: c })) setSelectedCity(c)
          }}
        />
      </ResponsiveSheet>

      {/* Unblocking is ALWAYS_FREE, and it asks first (the mock). */}
      <AlertDialog open={!!unblocking} onOpenChange={(o) => !o && setUnblocking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            {/* The name is user data. */}
            <AlertDialogTitle>{t('settings.unblockNamed', { name: unblocking?.name || t('settings.someone') })}</AlertDialogTitle>
            <AlertDialogDescription>{t('settings.unblockBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void unblockNow()}>{t('settings.unblock')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
