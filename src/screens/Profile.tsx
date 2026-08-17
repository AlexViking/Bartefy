import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { Avatar } from '@/components/ui/avatar'
import { Badge, Tag } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Stars } from '@/components/ui/stars'
import { Stat } from '@/components/ui/stat'
import { EmptyState } from '@/components/EmptyState'
import { PausedFindsSheet } from '@/components/membership/PausedFindsSheet'
import { useMembershipStore } from '@/store/membership'
import { tierOf } from '@/lib/membership'
import { cn } from '@/lib/utils'
import type { ItemRef } from '@/types/swap'

type Tab = 'live' | 'paused' | 'eyeing'

/** T3 - gallery. Identity, trust, then the finds. Membership sits here as a
 *  quiet row, never as a banner.
 */
export function Profile() {
  const navigate = useNavigate()
  const tier = useMembershipStore((s) => s.tier)
  const spec = tierOf(tier)
  const [tab, setTab] = useState<Tab>('live')
  const [pausedOpen, setPausedOpen] = useState(false)

  // TODO(api): getProfile(userId) + getMyItems(userId) + saves list
  const me = { name: 'Mira K.', city: 'Berlin', rating: 4.8, swaps: 31, verified: true, memberSince: '2025' }
  const live: ItemRef[] = [
    { id: 'i1', title: 'Wool scarf', photoColor: 'hsl(var(--illo-denim))' },
    { id: 'i2', title: 'Ricoh flash', photoColor: 'hsl(var(--illo-sage))' },
    { id: 'i3', title: 'Brass compass', photoColor: 'hsl(var(--accent))' },
  ]
  const paused: ItemRef[] = [{ id: 'i4', title: 'Enamel jug', photoColor: 'hsl(var(--secondary))' }]
  const eyeing: ItemRef[] = [{ id: 'e1', title: 'Pentax ME Super', photoColor: 'hsl(var(--illo-terracotta))' }]

  const shown = tab === 'live' ? live : tab === 'paused' ? paused : eyeing

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1160px] px-4 py-5">
        {/* Identity */}
        <div className="flex flex-col gap-4 rounded border border-border/[0.14] bg-card p-5 shadow-card lg:flex-row lg:items-center">
          <Avatar name={me.name} size={72} verified={me.verified} />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-2xl font-bold">{me.name}</h1>
              {me.verified && <Badge tone="green">Verified</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <Stars value={me.rating} />
              <span className="font-body text-sm text-muted-foreground">
                {me.rating.toFixed(1)} {'\u00b7'} {me.city} {'\u00b7'} swapping since {me.memberSince}
              </span>
            </div>
          </div>
          <div className="flex gap-6">
            <Stat value={me.swaps} label="Swaps" />
            <Stat value={live.length} label="Finds live" />
            <Stat value={eyeing.length} label="Eyeing" />
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
                <span className="block aspect-[4/3] w-full rounded-sm" style={{ background: it.photoColor }} />
                <span className="truncate font-display text-base font-semibold">{it.title}</span>
                {tab === 'paused' && <Badge tone="quiet">Paused</Badge>}
              </button>
            ))}
          </div>
        )}

        {tab === 'live' && (
          <div className="mt-5 flex flex-wrap gap-2">
            <Tag onSelect={() => navigate('/add')}>List another find</Tag>
            <Tag onSelect={() => navigate('/settings')}>Settings</Tag>
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
