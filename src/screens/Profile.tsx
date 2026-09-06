import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/shell/AppShell'
import { T, useT } from '@/i18n/T'
import { useIsDesktop } from '@/lib/platform'
import { UserAvatar } from '@/components/ui/user-avatar'
import { ToneBadge, Chip } from '@/components/ui/badge'
import { Masonry, MasonryPhoto } from '@/components/ui/masonry'
import { Button } from '@/components/ui/button'
import { Stat } from '@/components/ui/stat'
import { EmptyState } from '@/components/EmptyState'
import { PausedFindsSheet } from '@/components/membership/PausedFindsSheet'
import { useMembershipStore } from '@/store/membership'
import { useAuthStore } from '@/store/auth'
import { tierOf } from '@/lib/membership'
import { Icon } from '@/components/ui/icon'
import { resetLocal } from '@/lib/resetLocal'
import { cn } from '@/lib/utils'
import { getProfile, getMyItems, signOut } from '@/lib/api'
import { keys, STALE } from '@/lib/cache/queryClient'
import type { ItemRef } from '@/types/swap'
import { DEFAULT_CITY } from '@/screens/Onboarding/useOnboarding'

type Tab = 'live' | 'paused' | 'eyeing'

/** T3 - gallery. Identity, trust, then the finds. */
/** The four hub destinations, in the wireframe's order. Rewards is absent
 *  until the points wallet ships -- a row leading to a screen that says
 *  "coming soon" is worse than no row. */
const HUB_ROWS = [
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
  const [tab, setTab] = useState<Tab>('live')
  const [pausedOpen, setPausedOpen] = useState(false)

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

  const toRef = (it: Record<string, unknown>): ItemRef => {
    const photos = it.images as string[] | undefined
    return {
      id: String(it.id),
      title: String(it.title ?? ''),
      photoUrl: photos?.[0],
      photoColor: 'hsl(var(--illo-terracotta))',
      condition: String(it.condition ?? ''),
      category: String(it.category ?? ''),
      /** Days until this listing expires. A listing quietly dying is the main
       *  way someone loses matches without noticing, so the card says so
       *  rather than letting it happen silently. */
      daysLeft: it.expires_at
        ? Math.max(
            0,
            Math.ceil(
              (new Date(String(it.expires_at)).getTime() - Date.now()) / 86_400_000,
            ),
          )
        : undefined,
    }
  }

  const live = allItems.filter((it) => it.status === 'active').map(toRef)
  const paused = allItems.filter((it) => it.status === 'paused').map(toRef)
  const eyeing: ItemRef[] = [] // TODO: fetch saves

  const profileName = String(me?.name ?? me?.display_name ?? 'You')
  // completed_trades is the trust score (migration 015). swap_count is the
  // old column, kept as a fallback only until it is dropped.
  const swapCount = Number(me?.completed_trades ?? me?.swap_count ?? 0)
  const verified = Boolean(me?.verified)
  const referralCode = me?.referral_code ? String(me.referral_code) : ''
  const memberSince = me?.created_at ? new Date(String(me.created_at)).getFullYear().toString() : ''
  const city = String(me?.location_city ?? me?.city ?? DEFAULT_CITY)

  const shown = tab === 'live' ? live : tab === 'paused' ? paused : eyeing

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1160px] px-4 py-5">
        {/* Identity */}
        <div className={cn(
            'flex flex-col gap-4 rounded border border-border/[0.14] bg-card p-5 shadow-card',
            isDesktop && 'flex-row items-center',
          )}>
          <UserAvatar name={profileName} size="xl" verified={verified} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-h2 text-foreground">{profileName}</h1>
              {verified && <ToneBadge tone="green">{t('profile.verified')}</ToneBadge>}
            </div>
            {/* No stars. Trust is the count of finished swaps, shown in the
                stat row below -- peer ratings are cut from the product. */}
            <div className="flex items-center gap-2">
              <span className="font-body text-sm text-muted-foreground">
                {city}
                {memberSince ? ` \u00b7 ${t('profile.memberSince', { date: memberSince })}` : ''}
              </span>
            </div>
          </div>
          <div className="flex gap-6">
            <Stat value={swapCount} label={t('profile.statSwaps')} />
            <Stat value={live.length} label={t('profile.statLive')} />
            <Stat value={eyeing.length} label={t('profile.statEyeing')} />
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

        {/* Membership row */}
        <button
          type="button"
          onClick={() => navigate('/membership')}
          className="mt-3 flex w-full items-center gap-3 rounded-sm border border-border/[0.14] bg-popover p-3.5 text-left hover:bg-secondary"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[15px] font-semibold">{spec.name} membership</span>
            <span className="block font-body text-sm text-muted-foreground">
              {spec.radiusKm ? 'Hunting within ' + spec.radiusKm + ' km' : 'No radius cap'}
              {spec.liveFinds ? ' \u00b7 ' + spec.liveFinds + ' finds live' : ' \u00b7 unlimited finds'}
            </span>
          </span>
          <span className="font-body text-sm text-primary">{tier === 'hunter' ? 'See plans' : 'Manage'}</span>
        </button>

        {/* Finds */}
        <div className="mt-6 flex gap-1 border-b border-border/[0.14]">
          {(['live', 'paused', 'eyeing'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              aria-current={tab === t ? 'page' : undefined}
              className={cn(
                'min-h-hit border-b-[2.5px] px-3 font-display text-[15px] font-semibold capitalize transition-colors duration-fast ease-brand',
                tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t}
            </button>
          ))}
          {tab === 'paused' && paused.length > 0 && (
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setPausedOpen(true)}>
              Choose what stays live
            </Button>
          )}
        </div>

        {shown.length === 0 ? (
          <EmptyState
            title={
              tab === 'live'
                ? 'profile.emptyFindsTitle'
                : tab === 'paused'
                  ? 'profile.emptyPausedTitle'
                  : 'profile.emptyEyeingTitle'
            }
            body={
              tab === 'live'
                ? 'profile.emptyFindsBody'
                : tab === 'paused'
                  ? 'profile.emptyPausedBody'
                  : 'profile.emptyEyeingBody'
            }
            actionLabel={tab === 'live' ? 'nav.add' : tab === 'eyeing' ? 'swaps.goHunt' : undefined}
            onAction={() => navigate(tab === 'live' ? '/add' : '/discover')}
          />
        ) : (
          /* Masonry: a find keeps the shape it was photographed in. The fixed
             4:3 cell here was padding portrait photos and screenshots with
             bars of background, which is what made this grid look wrong. */
          <Masonry columns={isDesktop ? 4 : 2} gap={12} className="mt-4">
            {shown.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => navigate('/item/' + it.id)}
                className={cn(
                  'flex flex-col gap-2 rounded-lg border border-border/[0.14] bg-card p-3 text-left shadow-card transition-shadow duration-med ease-brand hover:shadow-float',
                  tab === 'paused' && 'opacity-70',
                )}
              >
                <MasonryPhoto
                  src={it.photoUrl}
                  alt={t('a11y.photoOf', { title: it.title })}
                  fallbackColor={it.photoColor}
                />
                <span className="truncate font-display text-base font-semibold">{it.title}</span>
                {tab === 'paused' && <ToneBadge tone="quiet">{t('profile.tabPaused')}</ToneBadge>}
                {/* The expiry, and only when it is close enough to matter.
                    A listing quietly dying is the main way someone loses
                    matches without noticing -- but "27 days left" on every
                    tile is noise that trains people to stop reading it. */}
                {tab === 'live' && it.daysLeft != null && it.daysLeft <= 7 && (
                  <span
                    data-i18n="profile.daysLeft"
                    className="font-body text-xs text-accent-foreground"
                  >
                    {t('profile.daysLeft', { count: it.daysLeft })}
                  </span>
                )}
              </button>
            ))}
          </Masonry>
        )}

        {tab === 'live' && (
          <div className="mt-5 flex flex-wrap gap-2">
            <Chip onClick={() => navigate('/add')}>{t('profile.listAnother')}</Chip>
          </div>
        )}

        {/* The hub, per the wireframe: rows, not chips buried under the grid.
            These are destinations, and a chip reads as a filter -- which is
            exactly what the chips directly above it are. */}
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

      <PausedFindsSheet
        open={pausedOpen}
        onOpenChange={setPausedOpen}
        items={[...live, ...paused]}
        keepCount={spec.liveFinds ?? 6}
      />
    </AppShell>
  )
}
