import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { AppShell } from '@/components/shell/AppShell'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { ToneBadge } from '@/components/ui/tone-badge'
import { T, useT } from '@/i18n/T'
import { useAuthStore } from '@/store/auth'
import { useIsDesktop } from '@/lib/platform'
import { cn } from '@/lib/utils'
import {
  EARN_RATES,
  PERK_DAYS,
  PERK_PRICES,
  TIER_PRICES,
  getBalance,
  getGrants,
  getLedger,
  pointsErrorKey,
  spendOnPerk,
  spendOnTier,
  type Perk,
} from '@/lib/points'

type Row = Record<string, unknown>

/** The wallet. Wireframe 10: what you have, how it is earned, what it buys.
 *
 *  This screen does NOT sell. The tier sheet's trigger map is explicit that a
 *  paywall shown on a settings page converts nobody -- every prompt belongs at
 *  the moment the person wants the thing, which is what UpgradeSheet is for.
 *  So this is a statement of account: a balance, an honest earn table, and a
 *  redeem list for somebody who came here on purpose.
 *
 *  Points are the currency because there is no card payment yet. Everything is
 *  free and earned. When checkout ships, `spend_points_on_tier` and Stripe
 *  write the same two columns, so nothing here needs rebuilding.
 */
export default function Rewards() {
  const { t } = useT()
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  const queryClient = useQueryClient()
  const userId = useAuthStore((s) => s.session?.user?.id)
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const { data: balance = 0, isLoading } = useQuery({
    queryKey: ['points', 'balance', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await getBalance(userId!)
      if (error) throw error
      return Number(data ?? 0)
    },
    enabled: !!userId,
  })

  const { data: ledger = [] } = useQuery({
    queryKey: ['points', 'ledger', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await getLedger(userId!)
      if (error) throw error
      return (data ?? []) as Row[]
    },
    enabled: !!userId,
  })

  const { data: grants = [] } = useQuery({
    queryKey: ['points', 'grants', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await getGrants(userId!)
      if (error) throw error
      return (data ?? []) as Row[]
    },
    enabled: !!userId,
  })

  /** One invalidation set for both spend paths: the balance changed, the
   *  ledger has a new row, and entitlements may have widened. */
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['points'] })
    void queryClient.invalidateQueries({ queryKey: ['profile'] })
  }

  const buyTier = useMutation({
    mutationFn: async (tier: 'collector' | 'curator') => {
      const { error } = await spendOnTier(tier)
      if (error) throw error
    },
    onSuccess: () => {
      setErrorKey(null)
      refresh()
    },
    onError: (e: { code?: string }) => setErrorKey(pointsErrorKey(e)),
  })

  const buyPerk = useMutation({
    mutationFn: async (perk: Perk) => {
      // Boost targets one listing, so it is bought from that find rather than
      // here -- see ItemDetail. The other two are account-wide.
      const { error } = await spendOnPerk(perk)
      if (error) throw error
    },
    onSuccess: () => {
      setErrorKey(null)
      refresh()
    },
    onError: (e: { code?: string }) => setErrorKey(pointsErrorKey(e)),
  })

  const busy = buyTier.isPending || buyPerk.isPending
  const hasGrant = (perk: Perk) => grants.some((g) => g.perk === perk)

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[720px] px-4 py-5">
        <div className="mb-5 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            pill
            onClick={() => navigate(-1)}
            aria-label={t('common.back')}
            className="-ml-2"
          >
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <T as="h1" k="points.title" className="font-display text-h2 text-foreground" />
        </div>

        {/* The balance. Brass, because it is the same currency as the accent
            everywhere else in the app. */}
        <div className="flex flex-col items-center gap-1 rounded-card border-[1.5px] border-accent/50 bg-accent/[0.12] px-5 py-7">
          <span className="font-display text-[44px] font-bold leading-none text-foreground tabular-nums">
            {isLoading ? '—' : balance.toLocaleString()}
          </span>
          <T as="span" k="points.balanceLabel" className="font-body text-sm text-muted-foreground" />
        </div>

        {errorKey && (
          <T
            as="p"
            k={errorKey}
            className="mt-3 text-center font-body text-sm text-destructive"
            role="alert"
          />
        )}

        {/* How you earn. Stated plainly and in full: someone who cannot see
            how the number moves assumes it is arbitrary. */}
        <T
          as="h2"
          k="points.earnTitle"
          className="mb-2 mt-7 font-display text-caption uppercase tracking-[0.18em] text-muted-foreground"
        />
        <div className="overflow-hidden rounded-card border border-border/[0.14] bg-card">
          {EARN_RATES.map((rate, i) => (
            <div
              key={rate.reason}
              className={cn(
                'flex items-center gap-3 px-4 py-3.5',
                i > 0 && 'border-t border-border/[0.14]',
              )}
            >
              <span data-i18n={'points.earn_' + rate.reason} className="flex-1 font-body text-body">
                {t('points.earn_' + rate.reason)}
              </span>
              <span className="font-display text-[15px] font-bold text-primary tabular-nums">
                +{rate.points}
              </span>
            </div>
          ))}
        </div>

        {/* What it buys. A month of a tier, or a single perk -- both, because
            somebody who only wants to see who is eyeing should not have to buy
            a whole tier to do it. */}
        <T
          as="h2"
          k="points.spendTitle"
          className="mb-2 mt-7 font-display text-caption uppercase tracking-[0.18em] text-muted-foreground"
        />
        <div className={cn('grid gap-3', isDesktop && 'grid-cols-2')}>
          {(['collector', 'curator'] as const).map((tier) => {
            const price = TIER_PRICES[tier]
            const afford = balance >= price
            return (
              <div
                key={tier}
                className="flex flex-col gap-2 rounded-card border border-border/[0.14] bg-card p-4"
              >
                <div className="flex items-baseline gap-2">
                  <span
                    data-i18n={'points.tier_' + tier}
                    className="font-display text-[17px] font-semibold"
                  >
                    {t('points.tier_' + tier)}
                  </span>
                  <span className="ml-auto font-display text-[15px] font-bold tabular-nums">
                    {price.toLocaleString()}
                  </span>
                </div>
                <T
                  as="p"
                  k={'points.tierBlurb_' + tier}
                  className="font-body text-sm text-muted-foreground"
                />
                <Button
                  fullWidth
                  className="mt-1"
                  disabled={!afford || busy}
                  onClick={() => buyTier.mutate(tier)}
                  data-i18n={afford ? 'points.redeem' : 'points.needMore'}
                >
                  {t(afford ? 'points.redeem' : 'points.needMore', { n: price - balance })}
                </Button>
              </div>
            )
          })}
        </div>

        {/* Single perks. Boost is absent on purpose: it applies to one listing,
            so it is bought from that find rather than from a list with no idea
            which find you meant. */}
        <div className="mt-3 overflow-hidden rounded-card border border-border/[0.14] bg-card">
          {(['eyeing', 'radius'] as const).map((perk, i) => {
            const price = PERK_PRICES[perk]
            const afford = balance >= price
            const live = hasGrant(perk)
            return (
              <div
                key={perk}
                className={cn(
                  'flex items-center gap-3 px-4 py-3.5',
                  i > 0 && 'border-t border-border/[0.14]',
                )}
              >
                <span className="min-w-0 flex-1">
                  <span
                    data-i18n={'points.perk_' + perk}
                    className="block font-body text-body text-foreground"
                  >
                    {t('points.perk_' + perk)}
                  </span>
                  <span
                    data-i18n="points.perkDays"
                    className="block font-body text-sm text-muted-foreground"
                  >
                    {t('points.perkDays', { count: PERK_DAYS[perk] })}
                  </span>
                </span>
                {live ? (
                  <ToneBadge tone="green">{t('points.perkActive')}</ToneBadge>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!afford || busy}
                    onClick={() => buyPerk.mutate(perk)}
                  >
                    {price.toLocaleString()}
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        {/* The ledger. Every point traces to the thing that earned it -- a
            balance nobody can account for is a balance nobody trusts. */}
        {ledger.length > 0 && (
          <>
            <T
              as="h2"
              k="points.historyTitle"
              className="mb-2 mt-7 font-display text-caption uppercase tracking-[0.18em] text-muted-foreground"
            />
            <div className="overflow-hidden rounded-card border border-border/[0.14] bg-card">
              {ledger.map((row, i) => {
                const delta = Number(row.delta ?? 0)
                return (
                  <div
                    key={String(row.id)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3',
                      i > 0 && 'border-t border-border/[0.14]',
                    )}
                  >
                    <span
                      data-i18n={'points.reason_' + String(row.reason)}
                      className="min-w-0 flex-1 truncate font-body text-sm"
                    >
                      {t('points.reason_' + String(row.reason))}
                    </span>
                    <span
                      className={cn(
                        'font-display text-sm font-bold tabular-nums',
                        delta > 0 ? 'text-primary' : 'text-muted-foreground',
                      )}
                    >
                      {delta > 0 ? '+' : ''}
                      {delta}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <T
          as="p"
          k="points.footnote"
          className="mt-6 text-center font-body text-sm text-muted-foreground"
        />
      </div>
    </AppShell>
  )
}
