import { useLocation, useNavigate } from 'react-router'

import { TopBarContext } from '@/components/shell/TopBarContext'
import { Icon } from '@/components/ui/icon'
import { T, useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

const TABS = [
  { path: '/admin/reports', k: 'staff.moderation' },
  { path: '/admin/analytics', k: 'staff.analytics' },
]

/** Staff tools (19-staff-b): Moderation and Analytics under one heading.
 *  Both pages keep their own staff gate -- this is navigation, not access.
 *  "Nothing is decided automatically": every report waits for a person. */
export function StaffTabs() {
  const { t } = useT()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return (
    <>
      <TopBarContext>
        <T as="h1" k="staff.title" className="shrink-0 font-display text-headline-md text-foreground" />
        <span className="inline-flex h-6 items-center gap-1 rounded-pill bg-sky px-2 font-body text-[11px] font-bold text-ink">
          <Icon name="ShieldCheck" size={12} />
          <T as="span" k="staff.only" />
        </span>
      </TopBarContext>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-input px-6 pt-4 lg:px-8">
        <div role="tablist" className="flex gap-5">
          {TABS.map((x) => {
            const on = pathname.startsWith(x.path)
            return (
              <button
                key={x.path}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => navigate(x.path)}
                className={cn('-mb-px border-b-2 px-1 pb-2.5 font-body text-label-lg', on ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}
              >
                {t(x.k)}
              </button>
            )
          })}
        </div>
        <T as="p" k="staff.nothingAuto" className="pb-2.5 font-body text-[12px] text-muted-foreground" />
      </div>
    </>
  )
}
