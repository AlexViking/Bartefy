import * as React from 'react'
import { useNavigate } from 'react-router'

import { EmptyState } from '@/components/EmptyState'
import { AppShell } from '@/components/shell/AppShell'
import { TopBarContext } from '@/components/shell/TopBarContext'
import { Icon, type IconName } from '@/components/ui/icon'
import { T, useT } from '@/i18n/T'
import { useIsDesktop } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { FindPane } from './FindPane'
import { SOON_DAYS, useMyFinds, type MyFind } from './useMyFinds'

/** My finds (proposal B): your photo grid, what needs you, and the picked
 *  find in full. Desktop: grid + panel. Phone: the grid, and a find opens full
 *  screen with a back arrow. */
export default function MyFinds() {
  const m = useMyFinds()
  const { t } = useT()
  const navigate = useNavigate()
  const desktop = useIsDesktop()

  // The panel always shows a find on desktop: the first, until one is picked.
  const first = m.shown[0]
  React.useEffect(() => {
    if (desktop && !m.selected && first && !m.missing) m.select(first)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktop, m.selected, first?.id, m.missing])

  const pane = (onBack?: () => void) =>
    m.selected ? (
      <FindPane
        key={m.selected.id}
        f={m.selected}
        busy={m.busy}
        errorKey={m.actError}
        onBack={onBack}
        onAct={(what) =>
          void m
            .act(m.selected!, what)
            .then(() => (what === 'remove' || what === 'pause' || what === 'resume' ? m.select(null) : undefined))
            .catch(() => {})
        }
        onEdited={m.refresh}
      />
    ) : null

  const tabs = (
    <div role="tablist" className="flex gap-5 border-b border-input px-1">
      {(['table', 'paused'] as const).map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={m.tab === id}
          onClick={() => m.setTab(id)}
          className={cn(
            '-mb-px border-b-2 px-1 pb-2.5 pt-1 font-body text-label-lg transition-colors',
            m.tab === id ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {t(id === 'table' ? 'finds.tabTable' : 'finds.tabPaused')}{' '}
          <span className="font-normal text-muted-foreground">{id === 'table' ? m.table.length : m.paused.length}</span>
        </button>
      ))}
    </div>
  )

  const needsYou = m.tab === 'table' && (m.leavingSoon.length > 0 || m.offersWaiting > 0 || m.inSwap.length > 0) && (
    <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
      <T as="span" k="dmenu.needsYou" className="shrink-0 font-body text-label-sm uppercase text-muted-foreground" />
      {m.leavingSoon.length > 0 && (
        <Nudge tone="bg-sun text-ink" onClick={() => m.select(m.leavingSoon[0])}>
          {t('finds.leavingSoon', { count: m.leavingSoon.length })}
        </Nudge>
      )}
      {m.offersWaiting > 0 && (
        <Nudge tone="bg-coral text-ink" onClick={() => navigate('/matches')}>
          {t('finds.offersWaiting', { count: m.offersWaiting })}
        </Nudge>
      )}
      {m.inSwap.length > 0 && (
        <Nudge tone="bg-mint text-forest" onClick={() => navigate('/matches')}>
          {t('finds.inSwap', { count: m.inSwap.length })}
        </Nudge>
      )}
    </div>
  )

  const grid = m.isLoading ? (
    <T as="p" k="common.loading" className="py-6 font-body text-body-sm text-muted-foreground" />
  ) : m.shown.length === 0 ? (
    <div className="py-10">
      {m.tab === 'paused' ? (
        <EmptyState title="items.emptyPausedTitle" body="items.emptyPausedBody" />
      ) : (
        <EmptyState title="items.emptyLiveTitle" body="items.emptyLiveBody" actionLabel="shell.addFind" onAction={() => navigate('/add')} />
      )}
    </div>
  ) : (
    <div className="grid grid-cols-[repeat(2,minmax(0,1fr))] gap-3 md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] md:gap-4">
      {m.shown.map((f) => (
        <Tile key={f.id} f={f} on={desktop && m.selected?.id === f.id} onPick={() => m.select(f)} />
      ))}
    </div>
  )

  return (
    <AppShell>
      <TopBarContext>
        <T as="h1" k="shell.nav_finds" className="shrink-0 font-display text-headline-md text-foreground" />
        <span className="whitespace-nowrap font-body text-body-sm text-muted-foreground">{t('add.onTable', { n: m.table.filter((f) => f.status === 'active').length })}</span>
      </TopBarContext>

      {desktop ? (
        <div className="flex h-full min-h-0 gap-6 px-6 py-4 lg:px-8">
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-card bg-card ring-1 ring-input">
            <div className="flex shrink-0 flex-col gap-3 px-5 pt-4">
              {tabs}
              {needsYou}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">{grid}</div>
          </div>
          {m.selected && (
            <div className="w-[380px] shrink-0 overflow-hidden rounded-card bg-card ring-1 ring-input xl:w-[420px]">{pane()}</div>
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 px-4 pb-6 pt-3">
            <T as="h1" k="shell.nav_finds" className="font-display text-[24px] font-bold leading-8 text-foreground" />
            {tabs}
            {needsYou}
            {grid}
          </div>
          {m.selected && <div className="fixed inset-0 z-50 flex flex-col bg-card">{pane(() => m.select(null))}</div>}
        </>
      )}
    </AppShell>
  )
}

function Nudge({ tone, onClick, children }: { tone: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn('inline-flex h-8 shrink-0 items-center gap-1 rounded-pill px-3 font-body text-label-md', tone)}>
      {children}
      <Icon name="ArrowRight" size={14} />
    </button>
  )
}

/** One find in the grid. The badge says the one thing it needs: offers, days
 *  left, in a swap, boosted. */
function Tile({ f, on, onPick }: { f: MyFind; on: boolean; onPick: () => void }) {
  const { t } = useT()
  const badge: { tone: string; icon?: IconName; text: string } | null =
    f.status === 'reserved'
      ? { tone: 'bg-mint text-forest', icon: 'Handshake', text: t('finds.badgeSwap') }
      : f.offers.length > 0
        ? { tone: 'bg-coral text-ink', text: t('finds.badgeOffers', { count: f.offers.length }) }
        : f.daysLeft !== null && f.daysLeft <= SOON_DAYS
          ? { tone: 'bg-sun text-ink', icon: 'Clock', text: t('finds.badgeDays', { count: f.daysLeft }) }
          : f.boosted
            ? { tone: 'bg-sun text-ink', icon: 'Zap', text: t('finds.badgeBoosted') }
            : null
  const sub =
    f.status === 'reserved'
      ? t('finds.subSwap')
      : f.status === 'paused'
        ? t('finds.subPaused')
        : f.daysLeft !== null
          ? t('finds.daysLeft', { count: f.daysLeft })
          : ''
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={on}
      className={cn(
        'flex min-w-0 flex-col rounded-card p-1.5 text-left transition-colors',
        on ? 'bg-selected ring-2 ring-primary/40' : 'hover:bg-background',
        f.status === 'paused' && 'opacity-75',
      )}
    >
      <span className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-secondary">
        {f.photos[0] && <img alt="" className="size-full object-cover" src={f.photos[0]} />}
        {badge && (
          <span className={cn('absolute left-2 top-2 inline-flex h-6 items-center gap-1 rounded-pill px-2 text-[11px] font-bold', badge.tone)}>
            {badge.icon && <Icon name={badge.icon} size={13} />}
            {badge.text}
          </span>
        )}
      </span>
      {/* A find's title is user data. */}
      <span className="truncate px-1 pt-2 font-body text-label-lg text-foreground">{f.title}</span>
      <span className="truncate px-1 pb-0.5 font-body text-[12px] text-muted-foreground">{sub}</span>
    </button>
  )
}
