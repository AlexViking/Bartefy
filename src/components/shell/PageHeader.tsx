import * as React from 'react'

import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** The top of every screen, so no two disagree about where a page begins.
 *
 *  Before this, seven screens each drew their own: the title landed at four
 *  different x positions, two carried a back arrow and five did not, and the
 *  same "switch between sub-views" control existed as an underline strip on
 *  Matches, a hand-rolled copy of it on My items, and pills on Moderation.
 *  Someone moving between destinations had to re-find the page each time.
 *
 *  No back arrow. Every screen this renders on is a destination in the rail --
 *  you did not arrive there from somewhere, so there is nowhere to go "back"
 *  to. Sub-pages that ARE pushed (an item, a thread) keep their own arrow.
 */
export function PageHeader({
  title,
  /** Untranslated text, for a heading that is user data rather than copy. */
  literalTitle,
  subtitle,
  actions,
  tabs,
  className,
}: {
  title?: string
  literalTitle?: string
  subtitle?: string
  /** Buttons that belong to the page, aligned with the title's baseline. */
  actions?: React.ReactNode
  /** The tab strip, rendered flush to the bottom edge so its underline reads
   *  as the header's own boundary rather than a line floating below it. */
  tabs?: React.ReactNode
  className?: string
}) {
  const { t } = useT()

  return (
    <header className={cn('mb-5', className)}>
      <div className="flex min-h-hit items-start justify-between gap-4">
        <div className="min-w-0">
          {literalTitle !== undefined ? (
            // User data: never stamped with a translation key.
            <h1 className="truncate font-display text-h2 text-foreground">{literalTitle}</h1>
          ) : (
            <h1 data-i18n={title} className="truncate font-display text-h2 text-foreground">
              {title ? t(title) : null}
            </h1>
          )}
          {subtitle && (
            <p data-i18n={subtitle} className="mt-1 font-body text-sm text-muted-foreground">
              {t(subtitle)}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {tabs && <div className="mt-4">{tabs}</div>}
    </header>
  )
}

export interface PageTab<T extends string = string> {
  id: T
  label: string
  /** A count beside the label -- pending reports, unread threads. Hidden at 0
   *  rather than shown as "(0)", which reads as a broken badge. */
  count?: number
}

/** The one tab strip. Ported from the inbox's, which was the only one of the
 *  three that matched the design: an underline that continues the header's
 *  bottom rule, not a row of pills sitting on the page.
 */
export function PageTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: PageTab<T>[]
  value: T
  onChange: (id: T) => void
  className?: string
}) {
  const { t } = useT()

  return (
    <div
      role="tablist"
      className={cn('flex gap-1 overflow-x-auto border-b border-border/[0.14]', className)}
    >
      {tabs.map((tab) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-current={active ? 'page' : undefined}
            onClick={() => onChange(tab.id)}
            data-i18n={tab.label}
            className={cn(
              'min-h-hit shrink-0 whitespace-nowrap border-b-[2.5px] px-3 font-display text-[15px] font-semibold',
              'transition-colors duration-fast ease-brand',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t(tab.label)}
            {tab.count ? (
              <span className="ml-1.5 font-body text-xs text-muted-foreground">{tab.count}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
