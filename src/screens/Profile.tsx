import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { PersonCard } from '@/components/PersonCard'
import { AppShell } from '@/components/shell/AppShell'
import { TopBarContext } from '@/components/shell/TopBarContext'
import { useShellData } from '@/components/shell/useShellData'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Icon, type IconName } from '@/components/ui/icon'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { UserAvatar } from '@/components/ui/user-avatar'
import { T, useT } from '@/i18n/T'
import { getProfile, updateProfile } from '@/lib/api'
import { getMyMatches } from '@/lib/barter'
import { keys } from '@/lib/cache/queryClient'
import { tierOf } from '@/lib/membership'
import { EARN_RATES, TIER_PRICES } from '@/lib/points'
import { useIsDesktop } from '@/lib/platform'
import { useAuthStore } from '@/store/auth'

type Row = Record<string, unknown>
const one = (v: unknown) => (Array.isArray(v) ? v[0] : v) as Row | null
const img = (r: Row | null) => (Array.isArray(r?.images) && r!.images.length ? String((r!.images as unknown[])[0]) : undefined)

/** Profile (R2): who you are, and how others see you. Left, you -- with a
 *  box of what only you see (tier, points, your invite code). Middle, the
 *  person card exactly as anyone else gets it. Right, your finished swaps. */
export default function Profile() {
  const { t, lang } = useT()
  const navigate = useNavigate()
  const desktop = useIsDesktop()
  const shell = useShellData()
  const qc = useQueryClient()
  const userId = useAuthStore((s) => s.session?.user?.id)
  // profiles has no created_at; the sign-in account does. Yours only --
  // profiles_public has no date, so the card others see never claims one.
  const joined = useAuthStore((s) => s.session?.user?.created_at)
  const [editing, setEditing] = React.useState(false)

  const { data: me } = useQuery({
    queryKey: keys.profile(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await getProfile(userId!)
      if (error) throw error
      return data as Row
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  })

  const { data: done = [] } = useQuery({
    queryKey: ['barter', 'profile-done', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await getMyMatches(userId!)
      if (error) throw error
      return ((data ?? []) as Row[]).filter((m) => m.status === 'completed')
    },
    enabled: !!userId,
  })

  const name = String(me?.name ?? '') || shell.email
  const city = me?.home_city ? String(me.home_city) : ''
  const since = joined ? new Date(joined).getFullYear().toString() : ''
  const swaps = Number(me?.completed_trades ?? 0)
  const code = me?.referral_code ? String(me.referral_code) : ''
  const spec = tierOf(shell.tier)
  const swapPts = EARN_RATES.find((r) => r.reason === 'swap_completed')?.points ?? 0
  const referPts = EARN_RATES.find((r) => r.reason === 'referral_first_swap')?.points ?? 0

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`https://bartefy.com/signup?invite=${code}`)
      toast.success(t('pts.copied'))
    } catch {
      toast(code)
    }
  }

  const privateRow = (icon: IconName, title: React.ReactNode, sub: string, onClick?: () => void, right?: React.ReactNode) => {
    const inner = (
      <>
        <Icon name={icon} size={20} className="shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 text-left">
          <span className="block font-body text-label-lg text-foreground">{title}</span>
          <span className="block font-body text-[12px] text-muted-foreground">{sub}</span>
        </span>
        {right ?? (onClick && <Icon name="ChevronRight" size={20} className="text-muted-foreground" />)}
      </>
    )
    return onClick ? (
      <button type="button" onClick={onClick} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-background">
        {inner}
      </button>
    ) : (
      <div className="-mx-2 flex items-center gap-3 px-2 py-1.5">{inner}</div>
    )
  }

  const you = (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <UserAvatar name={name} src={shell.avatar} size="xl" tone="accent" className="size-20 text-2xl" />
        <div className="min-w-0">
          {/* A name and a city are user data. */}
          <p className="truncate font-display text-[28px] font-bold leading-8 text-foreground">{name}</p>
          {city && <p className="font-body text-body-sm text-muted-foreground">{city}</p>}
          {since && <p className="font-body text-[12px] text-muted-foreground">{t('person.since', { year: since })}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-card bg-background px-4 py-3">
          <p className="font-display text-[32px] font-semibold leading-9 tabular-nums text-foreground">{swaps}</p>
          <T as="p" k="person.swapsDone" className="font-body text-body-sm text-muted-foreground" />
        </div>
        <button type="button" onClick={() => navigate('/items')} className="rounded-card bg-background px-4 py-3 text-left hover:bg-secondary">
          <p className="font-display text-[32px] font-semibold leading-9 tabular-nums text-foreground">{shell.liveFinds}</p>
          <p className="font-body text-body-sm text-muted-foreground">{t('profile.onTable')} ›</p>
        </button>
      </div>
      <Button variant="ghost" className="h-10 gap-1.5 self-start rounded-card px-3.5 font-body text-label-lg text-foreground" onClick={() => setEditing(true)}>
        <Icon name="Pencil" size={18} />
        <T as="span" k="profile.edit" />
      </Button>
      <div className="flex flex-col gap-3 rounded-card border border-dashed border-muted-foreground/40 p-4">
        <p className="flex items-center gap-2 font-body text-label-sm uppercase tracking-wider text-muted-foreground">
          <Icon name="Lock" size={16} />
          <T as="span" k="profile.onlyYou" />
        </p>
        {privateRow(
          'Award',
          t(`shell.tier_${shell.tier}`),
          [
            spec.liveFinds != null ? t('profile.findsOf', { n: shell.liveFinds, max: spec.liveFinds }) : t('profile.findsN', { count: shell.liveFinds }),
            spec.radiusKm ? t('rail.km', { n: spec.radiusKm }) : t('rail.noCap'),
          ].join(' · '),
          () => navigate('/points?tab=tiers'),
        )}
        {privateRow(
          'Coins',
          `${shell.points} ${t('shell.pts')}`,
          shell.tier === 'hunter' && shell.points < TIER_PRICES.collector ? t('pts.toCollector', { n: TIER_PRICES.collector - shell.points }) : t('shell.nav_points'),
          () => navigate('/points'),
        )}
        {code &&
          privateRow(
            'UserPlus',
            t('profile.inviteCode', { code }),
            t('profile.inviteSub', { n: referPts }),
            undefined,
            <Button variant="ghost" className="h-8 rounded-lg px-3 font-body text-label-md text-primary" onClick={() => void copy()}>
              <T as="span" k="profile.copy" />
            </Button>,
          )}
      </div>
    </div>
  )

  const others = (
    <div>
      <T as="p" k="profile.othersSee" className="mb-3 font-body text-label-sm uppercase tracking-wider text-muted-foreground" />
      {/* Exactly what others get: built from what profiles_public holds, so
          no join date here -- they cannot see one. */}
      <PersonCard name={name} city={city} swaps={swaps} self />
      <T as="p" k="profile.othersNote" className="mt-3 font-body text-[12px] leading-4 text-muted-foreground" />
    </div>
  )

  const history = (
    <div>
      <T as="p" k="profile.finished" className="mb-2 font-body text-label-sm uppercase tracking-wider text-muted-foreground" />
      {done.length === 0 ? (
        <T as="p" k="profile.noFinished" className="font-body text-body-sm text-muted-foreground" />
      ) : (
        <ul className="divide-y divide-input">
          {done.map((m) => {
            const isA = String(m.user_a) === userId
            const mine = one(isA ? m.itemA : m.itemB)
            const theirs = one(isA ? m.itemB : m.itemA)
            const other = one(isA ? m.userB : m.userA)
            const otherName = other?.name ? String(other.name) : ''
            return (
              <li key={String(m.id)} className="flex items-center gap-3 py-3">
                <span className="flex shrink-0 items-center gap-1.5">
                  <Thumb src={img(mine)} />
                  <Icon name="ArrowLeftRight" size={16} className="text-muted-foreground" />
                  <Thumb src={img(theirs)} />
                </span>
                <span className="min-w-0 flex-1">
                  {/* Titles and names are user data. */}
                  <span className="block truncate font-body text-label-lg text-foreground">
                    {t('profile.swapTitle', { mine: String(mine?.title ?? ''), theirs: String(theirs?.title ?? '') })}
                  </span>
                  <span className="block truncate font-body text-[12px] text-muted-foreground">
                    {otherName && (
                      <>
                        {t('profile.withPre')}{' '}
                        <button type="button" onClick={() => navigate('/u/' + String(isA ? m.user_b : m.user_a))} className="text-primary hover:underline">
                          {otherName}
                        </button>
                      </>
                    )}
                    {otherName && m.completed_at ? ' · ' : ''}
                    {m.completed_at ? new Date(String(m.completed_at)).toLocaleDateString(lang, { month: 'short', year: 'numeric' }) : ''}
                  </span>
                </span>
                <span className="whitespace-nowrap font-display text-[13px] font-bold text-primary">+{swapPts} {t('shell.pts')}</span>
              </li>
            )
          })}
        </ul>
      )}
      <T as="p" k="profile.onlyYouList" className="mt-2 font-body text-[12px] text-muted-foreground" />
    </div>
  )

  return (
    <AppShell>
      <TopBarContext>
        <T as="h1" k="nav.profile" className="shrink-0 font-display text-headline-md text-foreground" />
      </TopBarContext>
      {desktop ? (
        // The mock: two cards the window's height, each scrolling on its own.
        <div className="flex h-full min-h-0 gap-6 px-6 pb-6 pt-6 lg:px-8">
          <div className="w-[clamp(340px,26vw,420px)] shrink-0 overflow-y-auto rounded-card bg-card p-6 ring-1 ring-input">{you}</div>
          <div className="min-w-0 flex-1 overflow-y-auto rounded-card bg-card p-6 ring-1 ring-input">
            <div className="grid grid-cols-[minmax(280px,340px)_1fr] gap-8">
              {others}
              {history}
            </div>
          </div>
        </div>
      ) : (
        // The mock's phone: white blocks with an 8px paper gap between them,
        // so the paper stat tiles read as tiles.
        <div className="flex flex-col gap-2">
          <section className="bg-card p-6">{you}</section>
          <section className="flex flex-col gap-8 bg-card p-6">
            {others}
            {history}
          </section>
        </div>
      )}
      <EditProfileSheet
        open={editing}
        onOpenChange={setEditing}
        name={String(me?.name ?? '')}
        onSaved={() => void qc.invalidateQueries({ queryKey: ['profile'] })}
      />
    </AppShell>
  )
}

function Thumb({ src }: { src?: string }) {
  return src ? <img alt="" className="size-14 shrink-0 rounded-lg object-cover" src={src} /> : <span className="size-14 shrink-0 rounded-lg bg-secondary" />
}

/** The name people see. Photos come later -- profiles_public has no photo
 *  column, so a photo set here would show to nobody but you. */
function EditProfileSheet({ open, onOpenChange, name, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; name: string; onSaved: () => void }) {
  const { t } = useT()
  const userId = useAuthStore((s) => s.session?.user?.id)
  const [value, setValue] = React.useState(name)
  const [saving, setSaving] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  React.useEffect(() => {
    if (open) {
      setValue(name)
      setFailed(false)
    }
  }, [open, name])

  const save = async () => {
    if (!userId || !value.trim() || saving) return
    setSaving(true)
    const { data, error } = await updateProfile(userId, { name: value.trim() })
    setSaving(false)
    if (error || !data || data.length === 0) {
      setFailed(true)
      return
    }
    onOpenChange(false)
    onSaved()
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="profile.editTitle"
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <T as="span" k="common.cancel" />
          </Button>
          <Button onClick={() => void save()} disabled={!value.trim() || saving}>
            {saving ? t('common.loading') : t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <Field label="profile.nameLabel" help="profile.nameHelp" value={value} onChange={(e) => setValue(e.target.value)} />
        {failed && <T as="p" k="finds.editFailed" className="rounded-card bg-coral px-3 py-2 font-body text-body-sm text-ink" />}
      </div>
    </ResponsiveSheet>
  )
}
