import { useT } from '@/i18n/T'
import { INBOX_TABS, type InboxTab } from './useSwapsInbox'
import { cn } from '@/lib/utils'

export function InboxTabs({
  tab,
  onChange,
  className,
}: {
  tab: InboxTab
  onChange: (t: InboxTab) => void
  className?: string
}) {
  const { t } = useT()
  return (
    <div className={cn('flex gap-1 border-b border-border/[0.14]', className)}>
      {INBOX_TABS.map((entry) => (
        <button
          key={entry.id}
          type="button"
          onClick={() => onChange(entry.id)}
          aria-current={tab === entry.id ? 'page' : undefined}
          data-i18n={entry.label}
          className={cn(
            'min-h-hit border-b-[2.5px] px-3 font-display text-[15px] font-semibold',
            'transition-colors duration-fast ease-brand',
            tab === entry.id
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {t(entry.label)}
        </button>
      ))}
    </div>
  )
}
