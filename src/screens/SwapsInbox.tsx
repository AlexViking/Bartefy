import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { StatusRow } from '@/components/swap/StatusRow'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { SwapStatus } from '@/types/swap'

type Tab = 'active' | 'activity' | 'closed'

/** T2 - list + detail. Matches and Activity merged into one inbox, because two
 *  places for "what happened" meant neither felt like home.
 *  /activity now redirects here with ?tab=activity.
 */
export function SwapsInbox() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) ?? 'active'
  const [swaps] = useState(() => [
    {
      id: 's1',
      title: 'Pentax ME Super',
      subtitle: 'Mira K. \u00b7 your move',
      status: 'agreed' as SwapStatus,
      photoColor: 'hsl(var(--illo-terracotta))',
    },
    {
      id: 's2',
      title: 'Hardback Calvino',
      subtitle: 'Jonas D. \u00b7 offer sent yesterday',
      status: 'offered' as SwapStatus,
      photoColor: 'hsl(var(--illo-denim))',
    },
    {
      id: 's3',
      title: 'Brass compass',
      subtitle: 'Withdrawn by owner',
      status: 'cancelled' as SwapStatus,
      photoColor: 'hsl(var(--secondary))',
    },
  ])

  const activity = [
    { id: 'a1', when: 'Today', who: 'Mira K.', what: 'wants your wool scarf', to: '/swaps/s1' },
    { id: 'a2', when: 'Today', who: 'Jonas D.', what: 'countered your offer', to: '/swaps/s2' },
    { id: 'a3', when: 'Yesterday', who: 'Ana P.', what: 'is eyeing your brass compass', to: '/item/i3' },
  ]

  const active = swaps.filter((s) => s.status !== 'done' && s.status !== 'cancelled')
  const closed = swaps.filter((s) => s.status === 'done' || s.status === 'cancelled')
  const setTab = (t: Tab) => setParams(t === 'active' ? {} : { tab: t })

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[720px] px-4 py-5">
        <h1 className="mb-4 font-display text-2xl font-bold lg:text-h2">Swaps</h1>

        <div className="mb-4 flex gap-1 border-b border-border/[0.14]">
          {(['active', 'activity', 'closed'] as Tab[]).map((t) => (
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
        </div>

        {tab === 'activity' ? (
          <ul className="flex flex-col gap-2">
            {activity.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => navigate(a.to)}
                  className="flex w-full items-center gap-3 rounded-sm border border-border/[0.14] bg-card p-3 text-left hover:bg-popover"
                >
                  <Avatar name={a.who} size={36} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-body text-[15px]">
                      <strong className="font-display font-semibold">{a.who}</strong> {a.what}
                    </span>
                    <span className="block font-body text-xs text-muted-foreground">{a.when}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="flex flex-col gap-2">
            {(tab === 'active' ? active : closed).map((s) => (
              <li key={s.id}>
                <StatusRow
                  item={{ id: s.id, title: s.title, photoColor: s.photoColor }}
                  title={s.title}
                  subtitle={s.subtitle}
                  status={s.status}
                  onClick={() => navigate('/swaps/' + s.id)}
                />
              </li>
            ))}
            {(tab === 'active' ? active : closed).length === 0 && (
              <EmptyState
                title={tab === 'active' ? 'No swaps on the go' : 'Nothing closed yet'}
                body={
                  tab === 'active'
                    ? 'When you and someone else both want what the other has, it lands here.'
                    : 'Finished and cancelled swaps keep their thread for 90 days.'
                }
                actionLabel={tab === 'active' ? 'Start hunting' : undefined}
                onAction={() => navigate('/hunt')}
              />
            )}
          </ul>
        )}
      </div>
    </AppShell>
  )
}
