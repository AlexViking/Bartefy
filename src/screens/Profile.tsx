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
import { cn } from '@/lib/utils'
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
  const since = me?.created_at ? new Date(String(me.created_at)).getFullYear().toString() : ''
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

  const privateRow = (icon: IconName, title: string, sub: string, onClick?: () => void, right?: React.ReactNode) => (
    <div className="flex items-center gap-3 py-2.5">
      <Icon name={icon} size={20} className="shrink-0 text-muted-foreground" />
      <button type="button" onClick={onClick} disabled={!onClick} className="min-w-0 flex-1 text-left">
        <span className="block font-body text-label-lg text-foreground">{title}</span>
        <span className="block font-body text-[12px] text-muted-foreground">{sub}</span>
      </button>
      {right ?? (onClick && <Icon name="ChevronRight" size={18} className="text-muted-foreground" />)}
    </div>
  )

  const you = (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <UserAvatar name={name} src={shell.avatar} size="xl" tone="accent" />
        <div className="min-w-0">
          {/* A name is user data. */}
          <p className="truncate font-display text-headline-lg text-foreground">{name}</p>
          <p className="font-body text-body-sm text-muted-foreground">{[city, since ? t('person.since', { year: since }) : ''].filter(Boolean).join(' · ')}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-card bg-background px-4 py-3">
          <p className="font-display text-[28px] font-bold leading-8 tabular-nums text-foreground">{swaps}</p>
          <T as="p" k="person.swapsDone" className="font-body text-[12px] text-muted-foreground" />
        </div>
        <button type="button" onClick={() => navigate('/items')} className="rounded-card bg-background px-4 py-3 text-left hover:bg-secondary">
          <p className="font-display text-[28px] font-bold leading-8 tabular-nums text-foreground">{shell.liveFinds}</p>
          <p className="font-body text-[12px] text-muted-foreground">{t('profile.onTable')} ›</p>
        </button>
      </div>
      <Button variant="ghost" size="sm" className="self-start" onClick={() => setEditing(true)}>
        <Icon name="Settings" size={16} />
        <T as="span" k="profile.edit" />
      </Button>
      <div className="rounded-card border border-dashed border-input px-4 py-2">
        <p className="flex items-center gap-2 pt-2 font-body text-label-sm uppercase text-muted-foreground">
          <Icon name="Lock" size={14} />
          <T as="span" k="profile.onlyYou" />
        </p>
        {privateRow(
          'Star',
          t(`shell.tier_${shell.tier}`),
          spec.radiusKm ? t('rail.km', { n: spec.radiusKm }) : t('rail.noCap'),
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
            <Button variant="ghost" size="sm" onClick={() => void copy()}>
              <T as="span" k="profile.copy" />
            </Button>,
          )}
      </div>
    </div>
  )

  const others = (
    <div>
      <T as="p" k="profile.othersSee" className="mb-3 font-body text-label-sm uppercase text-muted-foreground" />
      <PersonCard name={name} city={city} swaps={swaps} since={since} />
      <T as="p" k="profile.othersNote" className="mt-3 font-body text-[12px] leading-4 text-muted-foreground" />
    </div>
  )

  const history = (
    <div>
      <T as="p" k="profile.finished" className="mb-3 font-body text-label-sm uppercase text-muted-foreground" />
      {done.length === 0 ? (
        <T as="p" k="profile.noFinished" className="font-body text-body-sm text-muted-foreground" />
      ) : (
        <ul className="divide-y divide-input">
          {done.map((m) => {
            const isA = String(m.user_a) === userId
            const mine = one(isA ? m.itemA : m.itemB)
            const theirs = one(isA ? m.itemB : m.itemA)
            const other = one(isA ? m.userB : m.userA)
            return (
              <li key={String(m.id)} className="flex items-center gap-2 py-2.5">
                <Thumb src={img(mine)} />
                <Icon name="ArrowLeftRight" size={14} className="text-muted-foreground" />
                <Thumb src={img(theirs)} />
                <span className="min-w-0 flex-1 pl-1">
                  <span className="block truncate font-body text-label-md text-foreground">{String(theirs?.title ?? '')}</span>
                  <span className="block truncate font-body text-[12px] text-muted-foreground">
                    {[other?.name ? t('profile.with', { who: String(other.name) }) : '', m.completed_at ? new Date(String(m.completed_at)).toLocaleDateString(lang, { month: 'short', year: 'numeric' }) : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <span className="font-display text-[13px] font-bold text-primary">+{swapPts}</span>
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
        <div className="flex min-h-full gap-6 px-6 py-4 lg:px-8">
          <div className="w-[360px] shrink-0 self-start rounded-card bg-card p-5 ring-1 ring-input">{you}</div>
          <div className={cn('grid min-w-0 flex-1 gap-6 self-start rounded-card bg-card p-5 ring-1 ring-input', 'grid-cols-[minmax(240px,300px)_1fr]')}>
            {others}
            {history}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 px-4 pb-6 pt-4">
          {you}
          {others}
          {history}
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
  return src ? <img alt="" className="size-11 shrink-0 rounded-lg object-cover" src={src} /> : <span className="size-11 shrink-0 rounded-lg bg-secondary" />
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
