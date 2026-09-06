import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/shell/AppShell'
import { T, useT } from '@/i18n/T'
import { useIsDesktop } from '@/lib/platform'
import { UserAvatar } from '@/components/ui/user-avatar'
import { ToneBadge } from '@/components/ui/tone-badge'
import { Stat } from '@/components/ui/stat'
import { useMembershipStore } from '@/store/membership'
import { useAuthStore } from '@/store/auth'
import { tierOf } from '@/lib/membership'
import { Icon } from '@/components/ui/icon'
import { resetLocal } from '@/lib/resetLocal'
import { cn } from '@/lib/utils'
import { getProfile, getMyItems, signOut } from '@/lib/api'
import { keys, STALE } from '@/lib/cache/queryClient'
import { DEFAULT_CITY } from '@/screens/Onboarding/useOnboarding'

/** Who you are, and the way to everything that is not a destination.
 *
 *  Your listings are no longer here -- they are a nav destination of their own
 *  (screens/MyItems), which is where both the wireframe and V5 put them. What
 *  is left is identity, trust, the invite code, the tier, and the hub rows.
 *
 *  Profile came off the tab bar when My Items took its slot; the avatar in the
 *  topbar and at the head of the phone menu is how you get here now.
 */
const HUB_ROWS = [
  { path: '/items', label: 'nav.items', icon: 'Package' as const },
  { path: '/invite', label: 'profile.hubInvite', icon: 'Sparkles' as const },
  { path: '/settings/blocked', label: 'profile.hubBlocked', icon: 'ShieldAlert' as const },
  { path: '/settings', label: 'profile.hubSettings', icon: 'Settings' as const },
]

export function Profile() {
  const { t } = useT()
  const isDesktop = useIsDesktop()
  const navigate = useNavigate()

  /** Signing out clears the local caches too -- see lib/resetLocal. A browser
   *  that keeps the previous account's cached feed shows it to whoever signs
   *  in next. */
  const handleSignOut = async () => {
    await resetLocal({ signOut })
    navigate('/')
  }
  const userId = useAuthStore((s) => s.session?.user?.id)
  const tier = useMembershipStore((s) => s.tier)
  const spec = tierOf(tier)

  const { data: me } = useQuery({
    queryKey: keys.profile(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await getProfile(userId!)
      if (error) throw error
      return data as Record<string, unknown>
    },
    enabled: !!userId,
    staleTime: STALE.mine,
  })

  /** Only for the "live finds" stat. The grid itself moved to My Items, but
   *  the count belongs beside the trust score. */
  const { data: allItems = [] } = useQuery({
    queryKey: keys.myItems(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await getMyItems(userId!)
      if (error) throw error
      return (data ?? []) as Record<string, unknown>[]
    },
    enabled: !!userId,
    staleTime: STALE.mine,
  })

  const liveCount = allItems.filter((it) => it.status === 'active').length

  // Falls back to translated copy rather than a bare English "You" -- the old
  // literal shipped untranslated to every non-EN user.
  const profileName = String(me?.name ?? me?.display_name ?? t('profile.you'))
  // completed_trades is the trust score (migration 015). swap_count is the
  // old column, kept as a fallback only until it is dropped.
  const swapCount = Number(me?.completed_trades ?? me?.swap_count ?? 0)
  const verified = Boolean(me?.verified)
  const referralCode = me?.referral_code ? String(me.referral_code) : ''
  const memberSince = me?.created_at ? new Date(String(me.created_at)).getFullYear().toString() : ''
  const city = String(me?.location_city ?? me?.city ?? DEFAULT_CITY)

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1160px] px-4 py-5">
        {/* Identity */}
        <div className={cn(
            'flex flex-col gap-4 rounded border border-border/[0.14] bg-card p-5 shadow-card',
            isDesktop && 'flex-row items-center',
          )}>
          <UserAvatar name={profileName} size="xl" tone="accent" verified={verified} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-h2 text-foreground">{profileName}</h1>
              {verified && <ToneBadge tone="green">{t('profile.verified')}</ToneBadge>}
            </div>
            {/* No stars. Trust is the count of finished swaps, shown in the
                stat row beside -- peer ratings are cut from the product. */}
            <div className="flex items-center gap-2">
              <span className="font-body text-sm text-muted-foreground">
                {city}
                {memberSince ? ` · ${t('profile.memberSince', { date: memberSince })}` : ''}
              </span>
            </div>
          </div>
          {/* Two stats, not three. "Eyeing" counted a list that was never
              fetched, so it read 0 for everyone forever. */}
          <div className="flex gap-6">
            <Stat value={swapCount} label={t('profile.statSwaps')} />
            <Stat value={liveCount} label={t('profile.statLive')} />
          </div>
        </div>

        {/* Your invite code. Migration 012 has given every profile one since
            6 September and nothing in the app showed it, so the whole referral
            feature was inert -- there was no way to invite anyone.

            The reward lands on the invitee's first real trade, never at
            signup: paying at signup is what makes fake accounts worth farming.
            profiles_own_read (migration 008) lets me read my own row in full,
            and the code is correctly absent from profiles_public -- someone
            else's invite code is not public data. */}
        {referralCode && (
          <div className="mt-3 flex items-center gap-3 rounded-card border-[1.5px] border-accent/50 bg-accent/[0.12] p-3.5">
            <span className="min-w-0 flex-1">
              <T
                as="span"
                k="profile.inviteTitle"
                className="block font-display text-[15px] font-semibold text-foreground"
              />
              <T
                as="span"
                k="profile.inviteBody"
                className="block font-body text-sm text-muted-foreground"
              />
            </span>
            {/* data-selectable: global.css turns selection off app-wide, and a
                code you cannot select is a code you cannot share. */}
            <code
              data-selectable
              className="shrink-0 rounded-card-sm bg-card px-2.5 py-1.5 font-display text-[15px] font-bold tracking-wider text-foreground"
            >
              {referralCode}
            </code>
          </div>
        )}

        {/* Membership row. Every string here was English in JSX -- the tier
            name, the radius line and the call to action all shipped
            untranslated. The tier name is data, so it stays as it is; the
            sentence around it is now a key with values. */}
        <button
          type="button"
          onClick={() => navigate('/membership')}
          className="mt-3 flex w-full items-center gap-3 rounded-sm border border-border/[0.14] bg-popover p-3.5 text-left hover:bg-secondary"
        >
          <span className="min-w-0 flex-1">
            <span
              data-i18n="profile.membershipRow"
              className="block font-display text-[15px] font-semibold"
            >
              {t('profile.membershipRow', { tier: spec.name })}
            </span>
            <span className="block font-body text-sm text-muted-foreground">
              {spec.radiusKm
                ? t('profile.membershipRadius', { radius: spec.radiusKm })
                : t('profile.membershipNoRadius')}
              {' · '}
              {spec.liveFinds
                ? t('profile.membershipFinds', { count: spec.liveFinds })
                : t('profile.membershipUnlimited')}
            </span>
          </span>
          <span
            data-i18n={tier === 'hunter' ? 'profile.seePlans' : 'profile.managePlan'}
            className="font-body text-sm text-primary"
          >
            {t(tier === 'hunter' ? 'profile.seePlans' : 'profile.managePlan')}
          </span>
        </button>

        {/* The hub, per the wireframe: rows, not chips. These are
            destinations, and My Items leads the list because it is the one
            people come here looking for. */}
        <nav className="mt-6 overflow-hidden rounded-card border-[1.5px] border-border/[0.14] bg-card">
          {HUB_ROWS.map((row, i) => (
            <button
              key={row.path}
              type="button"
              onClick={() => navigate(row.path)}
              className={cn(
                'flex min-h-hit w-full items-center gap-3 px-4 py-3.5 text-left',
                'transition-colors duration-fast ease-brand hover:bg-secondary',
                i > 0 && 'border-t border-border/[0.14]',
              )}
            >
              <Icon name={row.icon} size={18} className="shrink-0 text-muted-foreground" />
              <span data-i18n={row.label} className="flex-1 font-body text-body text-foreground">
                {t(row.label)}
              </span>
              <Icon name="ChevronRight" size={16} className="shrink-0 text-muted-foreground" />
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleSignOut}
          data-i18n="settings.signOut"
          className="mt-4 min-h-hit w-full font-body text-body text-muted-foreground transition-colors hover:text-destructive"
        >
          {t('settings.signOut')}
        </button>
      </div>
    </AppShell>
  )
}
