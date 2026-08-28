import { EmptyState } from '@/components/EmptyState'
import { StatusRow } from '@/components/swap/StatusRow'
import { T } from '@/i18n/T'
import type { SwapRow } from './useSwapsInbox'

/** The rows themselves, shared by both layouts. */
export function SwapList({
  rows,
  isLoading,
  tab,
  onOpen,
  onGoHunt,
  selectedId,
}: {
  rows: SwapRow[]
  isLoading: boolean
  tab: 'active' | 'activity' | 'closed'
  onOpen: (id: string) => void
  onGoHunt: () => void
  /** Desktop only: which row is showing in the pane beside the list. */
  selectedId?: string
}) {
  if (isLoading) {
    return (
      <T as="p" k="common.loading" className="py-10 text-center font-body text-sm text-muted-foreground" />
    )
  }

  if (tab === 'activity') {
    return <EmptyState title="swaps.emptyTitle" body="swaps.emptyBody" />
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
        <li key={s.id}>
          <StatusRow
            item={{ id: s.id, title: s.title, photoColor: s.photoColor, photoUrl: s.photoUrl }}
            title={s.title}
            status={s.status}
            onClick={() => onOpen(s.id)}
            className={selectedId === s.id ? 'border-primary bg-popover' : undefined}
          />
        </li>
      ))}
    </ul>
  )
}
