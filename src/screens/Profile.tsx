import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/shell/AppShell'
import { useT } from '@/i18n/T'
import { UserAvatar } from '@/components/ui/user-avatar'
import { ToneBadge, Chip } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Stars } from '@/components/ui/stars'
import { Stat } from '@/components/ui/stat'
import { EmptyState } from '@/components/EmptyState'
import { PausedFindsSheet } from '@/components/membership/PausedFindsSheet'
import { useMembershipStore } from '@/store/membership'
import { useAuthStore } from '@/store/auth'
import { tierOf } from '@/lib/membership'
import { cn } from '@/lib/utils'
import { getProfile, getMyItems } from '@/lib/api'
import { keys, STALE } from '@/lib/cache/queryClient'
import type { ItemRef } from '@/types/swap'

type Tab = 'live' | 'paused' | 'eyeing'

/** T3 - gallery. Identity, trust, then the finds. */
export function Profile() {
  const { t } = useT()
  const navigate = useNavigate()
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
    }
  }

  const live = allItems.filter((it) => it.status === 'active').map(toRef)
  const paused = allItems.filter((it) => it.status === 'paused').map(toRef)
  const eyeing: ItemRef[] = [] // TODO: fetch saves

  const profileName = String(me?.name ?? me?.display_name ?? 'You')
  const rating = me?.rating != null ? Number(me.rating) : 0
  const swapCount = me?.swap_count != null ? Number(me.swap_count) : 0
  const verified = Boolean(me?.verified)
  const memberSince = me?.created_at ? new Date(String(me.created_at)).getFullYear().toString() : ''
  const city = String(me?.location_city ?? me?.city ?? 'Berlin')

  const shown = tab === 'live' ? live : tab === 'paused' ? paused : eyeing

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1160px] px-4 py-5">
        {/* Identity */}
        <div className="flex flex-col gap-4 rounded border border-border/[0.14] bg-card p-5 shadow-card lg:flex-row lg:items-center">
          <UserAvatar name={profileName} size="xl" verified={verified} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold">{profileName}</h1>
              {verified && <ToneBadge tone="green">{t('profile.verified')}</ToneBadge>}
            </div>
            <div className="flex items-center gap-2">
              <Stars value={rating} />
              <span className="font-body text-sm text-muted-foreground">
                {rating.toFixed(1)} {'\u00b7'} {city} {memberSince ? `\u00b7 swapping since ${memberSince}` : ''}
              </span>
            </div>
          </div>
          <div className="flex gap-6">
            <Stat value={swapCount} label={t('profile.statSwaps')} />
            <Stat value={live.length} label={t('profile.statLive')} />
            <Stat value={eyeing.length} label={t('profile.statEyeing')} />
          </div>
        </div>

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
              tab === 'live' ? 'Nothing in the hunt yet' : tab === 'paused' ? 'Nothing paused' : 'Nothing saved yet'
            }
            body={
              tab === 'live'
                ? 'List one thing and the feed starts working both ways.'
                : tab === 'paused'
                  ? 'Finds you park land here. They keep their photos and story.'
                  : 'Save a find while you think about it - it will be here.'
            }
            actionLabel={tab === 'live' ? 'List a find' : tab === 'eyeing' ? 'Start hunting' : undefined}
            onAction={() => navigate(tab === 'live' ? '/add' : '/hunt')}
          />
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                <span
                  className="block aspect-[4/3] w-full overflow-hidden rounded-sm"
                  style={{ background: it.photoColor }}
                >
                  {it.photoUrl && (
                    <img src={it.photoUrl} alt={it.title} className="h-full w-full object-cover" />
                  )}
                </span>
                <span className="truncate font-display text-base font-semibold">{it.title}</span>
                {tab === 'paused' && <ToneBadge tone="quiet">{t('profile.tabPaused')}</ToneBadge>}
              </button>
            ))}
          </div>
        )}

        {tab === 'live' && (
          <div className="mt-5 flex flex-wrap gap-2">
            <Chip onClick={() => navigate('/add')}>{t('profile.listAnother')}</Chip>
            <Chip onClick={() => navigate('/settings')}>{t('settings.title')}</Chip>
          </div>
        )}
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
