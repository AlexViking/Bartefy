import { useState } from 'react'

import { AppShell } from '@/components/shell/AppShell'
import { ToneBadge } from '@/components/ui/tone-badge'
import { Button } from '@/components/ui/button'
import { InfoHint } from '@/components/guidance/InfoHint'
import { T, useT } from '@/i18n/T'
import { TIERS } from '@/lib/membership'
import { useIsDesktop } from '@/lib/platform'
import { useMembershipStore } from '@/store/membership'
import { cn } from '@/lib/utils'

/** F7 - the tier page. Reached from Profile and from the upgrade sheet's
 *  "see everything" link, never pushed at anyone.
 */
export function Membership() {
  const current = useMembershipStore((s) => s.tier)
  const { t } = useT()
  const isDesktop = useIsDesktop()
  const [busy, setBusy] = useState<string | null>(null)

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1160px] px-4 py-6">
        <div className="mb-6 flex flex-col gap-2">
          <T
            as="span"
            k="membership.title"
            className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground"
          />
          <T as="h1" k="membership.headline" className="font-display text-h2 text-foreground" />
          <T
            as="p"
            k="membership.subhead"
            className="max-w-[70ch] font-body text-body leading-relaxed text-muted-foreground"
          />
        </div>

        <div className={cn('grid gap-5', isDesktop ? 'grid-cols-3' : 'grid-cols-1')}>
          {TIERS.map((tier) => {
            const featured = tier.id === 'collector'
            const isCurrent = tier.id === current
            return (
              <section
                key={tier.id}
                className={cn(
                  'flex flex-col gap-3.5 rounded p-6',
                  featured
                    ? 'bg-primary text-primary-foreground shadow-float'
                    : 'border border-border/[0.14] bg-card shadow-card',
                )}
              >
                <div className="flex items-baseline gap-2.5">
                  <h2 className={cn('font-display text-h3', featured && 'text-primary-foreground')}>{tier.name}</h2>
                  {featured && <ToneBadge tone="brass">{t('membership.mostPopular')}</ToneBadge>}
                  {isCurrent && !featured && <ToneBadge tone="quiet">{t('membership.current')}</ToneBadge>}
                </div>

                <div className="font-display text-[34px] font-bold leading-none">{tier.priceLabel}</div>
                <p className={cn('font-body text-sm', featured ? 'opacity-85' : 'text-muted-foreground')}>{tier.blurb}</p>

                <ul
                  className={cn(
                    'flex flex-col gap-2 border-t pt-3.5 font-body text-[15px]',
                    featured ? 'border-primary-foreground/25' : 'border-border/[0.14]',
                  )}
                >
                  {tier.perks.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>

                <div className="mt-auto pt-2">
                  {isCurrent ? (
                    <Button variant="ghost" fullWidth disabled data-i18n="membership.current">
                      {t('membership.current')}
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant={featured ? 'accent' : 'primary'}
                      disabled={busy === tier.id}
                      onClick={() => setBusy(tier.id)}
                    >
                      {t('membership.upgrade')}
                    </Button>
                  )}
                </div>
              </section>
            )
          })}
        </div>

        <div className={cn('mt-6 grid gap-5', isDesktop ? 'grid-cols-2' : 'grid-cols-1')}>
          <div className="flex flex-col gap-3 rounded border border-border/[0.14] bg-card p-5">
            <T as="h3" k="membership.oneOffTitle" className="font-display text-h3 text-foreground" />
            <ul className="flex flex-col gap-2 font-body text-[15px]">
              <li className="flex justify-between gap-3 border-b border-border/[0.14] pb-2">
                <T k="membership.spotlight" />
                <strong className="font-display">$1.49</strong>
              </li>
              <li className="flex justify-between gap-3 border-b border-border/[0.14] pb-2">
                <T k="membership.postage" />
                <strong className="font-display">at cost + $1</strong>
              </li>
              <li className="flex justify-between gap-3">
                <T k="settings.account" />
                <strong className="font-display">{t('membership.freePrice')}</strong>
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-3 rounded bg-accent p-5">
            <div className="flex items-center gap-1.5">
              <T as="h3" k="membership.alwaysFreeTitle" className="font-display text-h3" />
              <InfoHint k="help.whyNoMoney" />
            </div>
            <T
              as="p"
              k="membership.alwaysFreeBody"
              className="font-body text-[15px] leading-relaxed"
            />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
