import { useLocation, useNavigate } from 'react-router'

import { Icon } from '@/components/ui/icon'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { T, useT } from '@/i18n/T'
import { tierOf } from '@/lib/membership'
import { cn } from '@/lib/utils'
import { ADD_PATH, DESTINATIONS, isActive, type Destination } from '@/navigation/destinations'
import { cap, type ShellData } from './useShellData'

const ITEM =
  'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 font-body text-[14px] font-bold leading-5 tracking-[0.02em] ' +
  'outline-none transition-colors duration-fast ease-brand focus-visible:ring-2 focus-visible:ring-ring/50'
const IDLE = 'text-muted-foreground hover:bg-secondary hover:text-foreground'
const ACTIVE = 'bg-selected text-selected-foreground shadow-sm'

/** The status under each row. Badges sit BELOW the label: inline they
 *  overflow 256px. Accents are fills with Ink text (Brand Book). */
function badgeFor(d: Destination, data: ShellData, t: (k: string, v?: Record<string, string | number>) => string) {
  if (d.badge === 'swaps') {
    const n = data.offers + data.unread
    return n > 0 ? { text: t('shell.badgeNew', { n: cap(n) }), tone: 'bg-coral text-ink', dot: 'bg-coral' } : null
  }
  if (d.badge === 'finds') {
    // Against the tier's cap where there is one: "6/6 Live" (the mock).
    const n = data.liveFinds
    const max = tierOf(data.tier).liveFinds
    const text = max != null ? t('shell.badgeLiveOf', { n: cap(n), max }) : t('shell.badgeLive', { n: cap(n) })
    return n > 0 ? { text, tone: 'bg-mint text-forest', dot: 'bg-green' } : null
  }
  if (d.badge === 'admirers') {
    const n = data.admirers
    return n > 0 ? { text: t('shell.badgeAdmirers', { n: cap(n) }), tone: 'bg-sun text-ink', dot: 'bg-sun' } : null
  }
  return null
}

/** V6 side navigation: everything that takes you somewhere.
 *
 *  Full (256px) on desktop, with Add a find on top and Collapse at the foot.
 *  The rail (72px) is the tablet's only width and desktop's collapsed one:
 *  icons, a dot for each badge, the name in a tooltip to the right.
 */
export function SideNav({
  data,
  collapsed,
  onToggle,
}: {
  data: ShellData
  collapsed: boolean
  /** Absent on tablet, where the rail is the only width. */
  onToggle?: () => void
}) {
  const { t } = useT()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  if (collapsed) {
    return (
      <aside className="flex w-[72px] shrink-0 flex-col gap-1 overflow-y-auto bg-background py-4 shadow-[1px_0_8px_rgba(0,0,0,0.04)]">
        <RailTip label={t('shell.addFind')}>
          <button
            type="button"
            onClick={() => navigate(ADD_PATH)}
            aria-label={t('shell.addFind')}
            className="mx-auto mb-2 grid size-12 place-items-center rounded-pill bg-coral text-ink shadow-sm outline-none transition-[filter] duration-fast ease-brand hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Icon name="Plus" size={22} />
          </button>
        </RailTip>
        <nav aria-label={t('shell.navLabel')} className="flex flex-col gap-1">
          {DESTINATIONS.map((d) => {
            const on = isActive(d, pathname)
            const b = badgeFor(d, data, t)
            const label = b ? `${t(d.label)} · ${b.text}` : t(d.label)
            return (
              <RailTip key={d.id} label={label}>
                <button
                  type="button"
                  onClick={() => navigate(d.path)}
                  aria-current={on ? 'page' : undefined}
                  aria-label={label}
                  className={cn(ITEM, 'relative mx-auto size-12 justify-center px-0', on ? ACTIVE : IDLE)}
                >
                  <Icon name={d.icon} size={20} />
                  {b && <span aria-hidden="true" className={cn('absolute right-2 top-2 size-2.5 rounded-pill ring-2 ring-background', b.dot)} />}
                </button>
              </RailTip>
            )
          })}
        </nav>
        {onToggle && (
          <div className="mt-auto">
            <RailTip label={t('nav.expand')}>
              <button
                type="button"
                onClick={onToggle}
                aria-label={t('nav.expand')}
                className={cn(ITEM, 'mx-auto size-12 justify-center px-0', IDLE)}
              >
                <Icon name="PanelLeftOpen" size={20} />
              </button>
            </RailTip>
          </div>
        )}
      </aside>
    )
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-1 overflow-y-auto bg-background p-4 shadow-[1px_0_8px_rgba(0,0,0,0.04)]">
      <button
        type="button"
        onClick={() => navigate(ADD_PATH)}
        // Left-aligned on the rows' own px-3 / gap-3, so the ⊕ sits in the icon
        // column and the words start where every label starts (Alex,
        // 2026-10-01; the mock centred them).
        className="mb-2 flex h-11 items-center gap-3 rounded-card bg-coral px-3 font-body text-[14px] font-bold leading-5 tracking-[0.02em] text-ink shadow-sm outline-none transition-[filter] duration-fast ease-brand hover:brightness-95 focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <Icon name="CirclePlus" size={20} />
        <T as="span" k="shell.addFind" />
      </button>
      <nav aria-label={t('shell.navLabel')} className="flex flex-col gap-1">
        {DESTINATIONS.map((d) => {
          const on = isActive(d, pathname)
          const b = badgeFor(d, data, t)
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => navigate(d.path)}
              aria-current={on ? 'page' : undefined}
              className={cn(ITEM, 'text-left', on ? ACTIVE : IDLE)}
            >
              <Icon name={d.icon} size={20} className="shrink-0" />
              <span className="flex min-w-0 flex-1 flex-col">
                <T as="span" k={d.side ?? d.label} className="truncate" />
                {b && (
                  <span className={cn('mt-1 self-start rounded-pill px-1.5 py-0.5 text-[11px] font-bold leading-[14px] tracking-[0.05em]', b.tone)}>
                    {b.text}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </nav>
      {onToggle && (
        <div className="mt-auto flex flex-col gap-1 pt-2">
          <div className="mb-2 h-px bg-input" />
          <button type="button" onClick={onToggle} className={cn(ITEM, IDLE)}>
            <Icon name="PanelLeftClose" size={20} />
            <T as="span" k="nav.collapse" className="flex-1 text-left" />
          </button>
        </div>
      )}
    </aside>
  )
}

function RailTip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}
