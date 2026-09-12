import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import { AppShell } from '@/components/shell/AppShell'
import { PageBody } from '@/components/shell/PageBody'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Masonry, MasonryPhoto } from '@/components/ui/masonry'
import { ToneBadge } from '@/components/ui/tone-badge'
import { PausedFindsSheet } from '@/components/membership/PausedFindsSheet'
import { T, useT } from '@/i18n/T'
import { getMyItems, getMySaves } from '@/lib/api'
import { keys, STALE } from '@/lib/cache/queryClient'
import { useIsDesktop } from '@/lib/platform'
import { tierOf } from '@/lib/membership'
import { useAuthStore } from '@/store/auth'
import { useMembershipStore } from '@/store/membership'
import { cn } from '@/lib/utils'
import type { ItemRef } from '@/types/swap'

type Tab = 'live' | 'paused' | 'eyeing'

/** Your own listings, as a destination rather than a strip inside Profile.
 *
 *  Both references put "My items" in the nav -- the desktop wireframe's rail
 *  lists it third, and V5's NAV array has it in the same position. It was the
 *  one destination the client never had: your listings were a tab strip
 *  halfway down Profile, below the invite code and the membership row, which
 *  is a long way to scroll to reach the thing the whole app is about.
 *
 *  "Eyeing" is back. It was a permanently blank panel on Profile because the
 *  saves query was never written and nothing ever wrote to the table -- the
 *  Save button on ItemDetail had no handler at all. Both ends are wired now,
 *  so the tab has something to show.
 */
export default function MyItems() {
  const { t } = useT()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const userId = useAuthStore((s) => s.session?.user?.id)
  const tier = useMembershipStore((s) => s.tier)
  const spec = tierOf(tier)

  const [tab, setTab] = useState<Tab>('live')
  const [pausedOpen, setPausedOpen] = useState(false)

  const { data: allItems = [], isLoading } = useQuery({
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

  /** Finds I have saved. Only ones still active: a saved listing that has
   *  since been traded or removed is not something anyone can act on. */
  const { data: savedRows = [] } = useQuery({
    queryKey: ['saves', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await getMySaves(userId!)
      if (error) throw error
      return (data ?? []) as Record<string, unknown>[]
    },
    enabled: !!userId,
    staleTime: STALE.mine,
  })

  const live = allItems.filter((it) => it.status === 'active').map(toRef)
  const paused = allItems.filter((it) => it.status === 'paused').map(toRef)
  const eyeing = savedRows
    // PostgREST returns an embedded one-to-one as an object; older client
    // versions type it as an array.
    .map((r) => (Array.isArray(r.items) ? r.items[0] : r.items) as Record<string, unknown> | null)
    .filter((it): it is Record<string, unknown> => !!it && it.status === 'active')
    .map(toRef)

  const shown = tab === 'live' ? live : tab === 'paused' ? paused : eyeing

  const TABS: { id: Tab; label: string }[] = [
    { id: 'live', label: 'items.tabLive' },
    { id: 'paused', label: 'items.tabPaused' },
    { id: 'eyeing', label: 'items.tabEyeing' },
  ]

  return (
    <AppShell>
      <PageBody variant="wide">
        <div className="flex items-center gap-3">
          <T as="h1" k="items.title" className="font-display text-h2 text-foreground" />
          <Button size="sm" className="ml-auto" onClick={() => navigate('/add')} data-i18n="nav.add">
            {t('nav.add')}
          </Button>
        </div>

        <div className="mt-5 flex gap-1 border-b border-border/[0.14]">
          {/* The map parameter is `item`, not `t`: on Profile this loop bound
              `t` and shadowed the translator, so no label inside it could be
              translated even by accident -- which is how the raw state value
              ended up on screen behind a `capitalize` class. */}
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-current={tab === item.id ? 'page' : undefined}
              data-i18n={item.label}
              className={cn(
                'min-h-hit border-b-[2.5px] px-3 font-display text-[15px] font-semibold transition-colors duration-fast ease-brand',
                tab === item.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t(item.label)}
            </button>
          ))}
          {tab === 'paused' && paused.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setPausedOpen(true)}
              data-i18n="items.chooseLive"
            >
              {t('items.chooseLive')}
            </Button>
          )}
        </div>

        {isLoading ? (
          <T as="p" k="common.loading" className="py-10 text-center font-body text-sm text-muted-foreground" />
        ) : shown.length === 0 ? (
          <EmptyState
            title={
              tab === 'live'
                ? 'items.emptyLiveTitle'
                : tab === 'paused'
                  ? 'items.emptyPausedTitle'
                  : 'items.emptyEyeingTitle'
            }
            body={
              tab === 'live'
                ? 'items.emptyLiveBody'
                : tab === 'paused'
                  ? 'items.emptyPausedBody'
                  : 'items.emptyEyeingBody'
            }
            actionLabel={tab === 'live' ? 'nav.add' : tab === 'eyeing' ? 'nav.discover' : undefined}
            onAction={
              tab === 'live'
                ? () => navigate('/add')
                : tab === 'eyeing'
                  ? () => navigate('/discover')
                  : undefined
            }
          />
        ) : (
          /* Masonry: a find keeps the shape it was photographed in. A fixed
             4:3 cell padded portrait photos and screenshots with bars of
             background, which is what made this grid look wrong. */
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
                {tab === 'paused' && <ToneBadge tone="quiet">{t('items.tabPaused')}</ToneBadge>}
                {/* The expiry, and only when it is close enough to matter.
                    "27 days left" on every tile is noise that trains people
                    to stop reading it. */}
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
      </PageBody>

      <PausedFindsSheet
        open={pausedOpen}
        onOpenChange={setPausedOpen}
        items={[...live, ...paused]}
        keepCount={spec.liveFinds ?? 6}
      />
    </AppShell>
  )
}
