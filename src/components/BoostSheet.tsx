import * as React from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { useShellData } from '@/components/shell/useShellData'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { T, useT } from '@/i18n/T'
import { track } from '@/lib/analytics'
import { getGrants, PERK_PRICES, pointsErrorKey, spendOnPerk } from '@/lib/points'
import { cn } from '@/lib/utils'

/** Hours left on each find's running boost, by item id. Shared with My finds,
 *  which shows "Boosted · 18h left" on the find itself. */
export function useBoosts() {
  const shell = useShellData()
  const { data: grants = [] } = useQuery({
    queryKey: ['points', 'grants', shell.userId ?? ''],
    queryFn: async () => {
      const { data, error } = await getGrants(shell.userId!)
      if (error) throw error
      return (data ?? []) as Record<string, unknown>[]
    },
    enabled: !!shell.userId,
  })
  const now = Date.now()
  const left = new Map<string, number>()
  for (const g of grants) {
    if (g.perk !== 'boost') continue
    const h = Math.max(1, Math.round((Date.parse(String(g.expires_at)) - now) / 3_600_000))
    left.set(String(g.subject ?? '').split(':')[0], h)
  }
  return left
}

/** Boost: one of YOUR finds goes first in nearby decks for a day, 75 pts.
 *
 *  Always two steps -- pick the find, then confirm with the price on the
 *  button. The Discover button used to spend 75 pts at the first tap, on
 *  whichever find the offer picker happened to have selected, with no way to
 *  choose or undo (Alex, 2026-10-01: three boosts on one find, two of them
 *  three minutes apart). A find already boosted cannot be picked again.
 */
export function BoostSheet({
  open,
  onOpenChange,
  preselect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Item id to start on (the find you pressed Boost on, in My finds). */
  preselect?: string
}) {
  const { t } = useT()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const shell = useShellData()
  const boosts = useBoosts()
  const price = PERK_PRICES.boost
  const finds = shell.table
  const [picked, setPicked] = React.useState<string>('')
  const [busy, setBusy] = React.useState(false)
  // The spend is guarded on a ref, not on `busy`: a second tap before React
  // re-renders must not spend twice.
  const spending = React.useRef(false)

  React.useEffect(() => {
    if (!open) return
    const free = finds.filter((f) => !boosts.has(f.id))
    const start = preselect && !boosts.has(preselect) ? preselect : free.length === 1 ? free[0].id : ''
    setPicked(start)
    // Only when the sheet opens: re-picking on every data refresh would undo
    // the person's choice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preselect])

  const enough = shell.points >= price
  const pickedFind = finds.find((f) => f.id === picked)

  const boost = async () => {
    if (!pickedFind || !enough || spending.current) return
    spending.current = true
    setBusy(true)
    const { error } = await spendOnPerk('boost', pickedFind.id)
    spending.current = false
    setBusy(false)
    if (error) {
      toast.error(t(pointsErrorKey(error)))
      return
    }
    track('points_spent', { perk: 'boost', price })
    // A find's title is user data.
    toast.success(t('boost.done', { title: pickedFind.title }))
    void qc.invalidateQueries({ queryKey: ['points'] })
    void qc.invalidateQueries({ queryKey: ['my-items'] })
    onOpenChange(false)
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="boost.title"
      description="boost.body"
      descriptionValues={{ n: price }}
      className="max-w-[520px]"
      footer={
        <div className="flex w-full flex-col gap-2">
          <p className="text-center font-body text-body-sm text-muted-foreground">
            {enough ? t('boost.balance', { n: shell.points }) : t('boost.notEnough', { n: price - shell.points })}
          </p>
          {enough ? (
            <Button size="lg" fullWidth onClick={() => void boost()} disabled={!pickedFind || busy}>
              <Icon name="Zap" size={18} filled />
              {pickedFind ? t('boost.confirm', { title: pickedFind.title, n: price }) : t('boost.pickFirst')}
            </Button>
          ) : (
            <Button size="lg" fullWidth onClick={() => navigate('/points')}>
              <T as="span" k="boost.earn" />
            </Button>
          )}
          <Button variant="ghost" fullWidth onClick={() => onOpenChange(false)}>
            <T as="span" k="common.cancel" />
          </Button>
        </div>
      }
    >
      {finds.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <T as="p" k="boost.noFinds" className="font-body text-body-md text-muted-foreground" />
          <Button variant="ghost" onClick={() => navigate('/add')}>
            <T as="span" k="shell.addFind" />
          </Button>
        </div>
      ) : (
        <RadioGroup value={picked} onValueChange={setPicked} className="flex max-h-[45dvh] flex-col gap-1 overflow-y-auto">
          {finds.map((f) => {
            const hours = boosts.get(f.id)
            const on = hours != null
            return (
              <label
                key={f.id}
                className={cn(
                  'flex items-center gap-3 rounded-card px-2 py-2 transition-colors',
                  on ? 'cursor-default opacity-70' : 'cursor-pointer hover:bg-background',
                  picked === f.id && 'bg-selected',
                )}
              >
                <RadioGroupItem value={f.id} disabled={on} className="size-5" />
                {f.photo ? (
                  <img alt="" src={f.photo} className="size-12 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="size-12 shrink-0 rounded-lg bg-secondary" />
                )}
                <span className="min-w-0 flex-1">
                  {/* A find's title is user data. */}
                  <span className="block truncate font-body text-label-lg text-foreground">{f.title}</span>
                  {on && (
                    <span className="inline-flex items-center gap-1 font-body text-[12px] text-muted-foreground">
                      <Icon name="Zap" size={12} filled />
                      {t('boost.already', { h: hours })}
                    </span>
                  )}
                </span>
              </label>
            )
          })}
        </RadioGroup>
      )}
    </ResponsiveSheet>
  )
}
