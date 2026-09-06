import { EmptyState } from '@/components/EmptyState'
import { Icon } from '@/components/ui/icon'
import { StatusRow } from '@/components/swap/StatusRow'
import { T, useT } from '@/i18n/T'
import type { SwapRow } from './useSwapsInbox'

/** The rows themselves, shared by both layouts. */
export function SwapList({
  rows,
  isLoading,
  tab,
  onOpen,
  onGoHunt,
  onArchive,
  selectedId,
}: {
  rows: SwapRow[]
  isLoading: boolean
  tab: 'active' | 'closed'
  onOpen: (id: string) => void
  onGoHunt: () => void
  /** Hide a finished row from my own list. Per side: one person tidying up
   *  must not remove it from the other's. */
  onArchive?: (id: string, isSideA: boolean) => void
  /** Desktop only: which row is showing in the pane beside the list. */
  selectedId?: string
}) {
  const { t } = useT()
  if (isLoading) {
    return (
      <T as="p" k="common.loading" className="py-10 text-center font-body text-sm text-muted-foreground" />
    )
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="swaps.emptyTitle"
        body="swaps.emptyBody"
        actionLabel={tab === 'active' ? 'swaps.goHunt' : undefined}
        onAction={onGoHunt}
      />
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((s) => (
        <li key={s.id} className="relative">
          {/* Point 5 of the spec, as its own line: "no longer available" is
              not the same as a swap being called off, and the person it
              happened to needs to know which. Archive sits with it because
              this row is finished -- there is nothing else to do with it. */}
          {s.cancelReason === 'item_traded_elsewhere' && (
            <div className="mb-1 flex items-center gap-2 rounded-card bg-secondary px-3 py-2">
              <Icon name="ShieldAlert" size={14} className="shrink-0 text-muted-foreground" />
              <T
                as="span"
                k="barter.cancelledElsewhere"
                className="flex-1 font-body text-xs text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => onArchive?.(s.id, s.isSideA)}
                data-i18n="swaps.archive"
                className="shrink-0 font-display text-xs font-semibold text-primary"
              >
                {t('swaps.archive')}
              </button>
            </div>
          )}
          <StatusRow
            item={{ id: s.id, title: s.title, photoColor: s.photoColor, photoUrl: s.photoUrl }}
            title={s.title}
            status={s.status}
            unread={s.unread}
            onClick={() => onOpen(s.id)}
            /* The open conversation has to be obvious at a glance: a green
               border alone read as hover, since hover already changes the
               background. The inset left bar is the unambiguous signal. */
            className={
              selectedId === s.id
                ? 'border-primary bg-popover shadow-[inset_3px_0_0_0_hsl(var(--primary))]'
                : undefined
            }
            aria-current={selectedId === s.id ? 'true' : undefined}
          />
        </li>
      ))}
    </ul>
  )
}
