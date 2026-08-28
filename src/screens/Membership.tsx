import { useState } from 'react'
import { AppShell } from '@/components/shell/AppShell'
import { ToneBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TIERS } from '@/lib/membership'
import { useMembershipStore } from '@/store/membership'
import { cn } from '@/lib/utils'

/** F7 - the tier page. Reached from Profile and from the upgrade sheet's
 *  "see everything" link, never pushed at anyone.
 */
export function Membership() {
  const current = useMembershipStore((s) => s.tier)
  const [busy, setBusy] = useState<string | null>(null)

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1160px] px-4 py-6">
        <div className="mb-6 flex flex-col gap-2">
          <span className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground">
            Membership
          </span>
          <h1 className="font-display text-2xl font-bold lg:text-h2">Swapping is free. Reach is not.</h1>
          <p className="max-w-[70ch] font-body text-[17px] text-muted-foreground">
            Listing, hunting, chatting, meeting, confirming, rating, blocking and reporting stay free forever. What
            you can pay for is a bigger map, more finds live at once, and being seen sooner.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {TIERS.map((t) => {
            const featured = t.id === 'collector'
            const isCurrent = t.id === current
            return (
              <section
                key={t.id}
                className={cn(
                  'flex flex-col gap-3.5 rounded p-6',
                  featured
                    ? 'bg-primary text-primary-foreground shadow-float'
                    : 'border border-border/[0.14] bg-card shadow-card',
                )}
              >
                <div className="flex items-baseline gap-2.5">
                  <h2 className={cn('font-display text-h3', featured && 'text-primary-foreground')}>{t.name}</h2>
                  {featured && <ToneBadge tone="brass">Most people</ToneBadge>}
                  {isCurrent && !featured && <ToneBadge tone="quiet">Current</ToneBadge>}
                </div>

                <div className="font-display text-[34px] font-bold leading-none">{t.priceLabel}</div>
                <p className={cn('font-body text-sm', featured ? 'opacity-85' : 'text-muted-foreground')}>{t.blurb}</p>

                <ul
                  className={cn(
                    'flex flex-col gap-2 border-t pt-3.5 font-body text-[15px]',
                    featured ? 'border-primary-foreground/25' : 'border-border/[0.14]',
                  )}
                >
                  {t.perks.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>

                <div className="mt-auto pt-2">
                  {isCurrent ? (
                    <Button variant="ghost" fullWidth disabled>
                      Current plan
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant={featured ? 'accent' : 'primary'}
                      disabled={busy === t.id}
                      onClick={() => setBusy(t.id)}
                    >
                      {t.id === 'hunter' ? 'Switch to Hunter' : 'Try a month'}
                    </Button>
                  )}
                </div>
              </section>
            )
          })}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-3 rounded border border-border/[0.14] bg-card p-5">
            <h3 className="font-display text-h3">Pay once, no membership</h3>
            <ul className="flex flex-col gap-2 font-body text-[15px]">
              <li className="flex justify-between gap-3 border-b border-border/[0.14] pb-2">
                <span>Spotlight one find for 48 hours</span>
                <strong className="font-display">$1.49</strong>
              </li>
              <li className="flex justify-between gap-3 border-b border-border/[0.14] pb-2">
                <span>Prepaid postage label for a distant swap</span>
                <strong className="font-display">at cost + $1</strong>
              </li>
              <li className="flex justify-between gap-3">
                <span>ID verification, keeps the green dot</span>
                <strong className="font-display">free</strong>
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-3 rounded bg-accent p-5">
            <h3 className="font-display text-h3">Never paywalled</h3>
            <p className="font-body text-[15px] leading-relaxed">
              Reporting, blocking, meeting safely, confirming a handover, rating, reading your own threads, and
              finishing a swap already agreed. No ads in the hunt stack either - promoted finds would break the one
              thing the feed is for.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
