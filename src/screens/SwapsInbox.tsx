import { useNavigate, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '@/components/shell/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { StatusRow } from '@/components/swap/StatusRow'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { getMySwaps } from '@/lib/api'
import { keys, STALE } from '@/lib/cache/queryClient'
import type { SwapStatus } from '@/types/swap'

type Tab = 'active' | 'activity' | 'closed'

interface SwapRow {
  id: string
  title: string
  subtitle: string
  status: SwapStatus
  photoUrl?: string
  photoColor: string
}

/** T2 - list + detail. Matches and Activity merged into one inbox. */
export function SwapsInbox() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.session?.user?.id)
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) ?? 'active'

  const { data: swaps = [], isLoading } = useQuery({
    queryKey: keys.swaps(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await getMySwaps(userId!)
      if (error) throw error
      return (data ?? []).map((s: Record<string, unknown>): SwapRow => {
        const itemA = s.item_a as Record<string, unknown> | null
        const itemB = s.item_b as Record<string, unknown> | null
        const isUserA = s.user_a_id === userId
        const theirItem = isUserA ? itemB : itemA
        const status = String(s.status ?? 'new') as SwapStatus
        const title = String(theirItem?.title ?? 'Swap')
        const photos = theirItem?.images as string[] | undefined
        return {
          id: String(s.id),
          title,
          subtitle: status,
          status,
          photoUrl: photos?.[0],
          photoColor: 'hsl(var(--illo-denim))',
        }
      })
    },
    enabled: !!userId,
    staleTime: STALE.realtime,
  })

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

        {isLoading ? (
          <p className="py-10 text-center font-body text-sm text-muted-foreground">Loading swaps…</p>
        ) : tab === 'activity' ? (
          <EmptyState
            title="No recent activity"
            body="When someone eyes your finds or responds to an offer, it lands here."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {(tab === 'active' ? active : closed).map((s) => (
              <li key={s.id}>
                <StatusRow
                  item={{ id: s.id, title: s.title, photoColor: s.photoColor, photoUrl: s.photoUrl }}
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
