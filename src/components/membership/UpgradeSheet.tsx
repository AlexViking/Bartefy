import { useNavigate } from 'react-router'

import { ResponsiveSheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n/T'
import { tierOf, type UpgradeMoment } from '@/lib/membership'

/** The only upgrade surface. Called from the moment that earned it, never on
 *  launch and never mid-swipe.
 *
 *  Copy lives in i18n under `membership.moments.<moment>`, not in a TS
 *  constant: this sheet is user-visible copy like any other, and a hardcoded
 *  English string here would never translate.
 */
export function UpgradeSheet({
  open,
  onOpenChange,
  moment,
  onUpgrade,
  onFreeRoute,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  moment: UpgradeMoment
  onUpgrade?: () => void
  onFreeRoute?: () => void
}) {
  const { t } = useT()
  const navigate = useNavigate()
  const collector = tierOf('collector')
  const at = (part: 'title' | 'body' | 'free') => t(`membership.moments.${moment}.${part}`)

  /** Until card payments exist, a tier is bought with points, so the primary
   *  action goes to the Rewards screen -- which is where the balance and the
   *  spend live. A call site can still override it. */
  const upgrade = onUpgrade ?? (() => {
    onOpenChange(false)
    navigate('/points')
  })

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title={at('title')}>
      <div className="flex flex-col gap-4">
        <p className="font-body text-[17px] leading-relaxed">{at('body')}</p>

        <div className="flex flex-col gap-2 rounded border border-border/[0.14] bg-popover p-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-h3">{collector.name}</span>
            <span className="ml-auto font-display text-xl font-bold">{collector.priceLabel}</span>
          </div>
          <ul className="flex flex-col gap-1.5 font-body text-[15px]">
            {collector.perks.slice(0, 4).map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-2">
          <Button size="lg" fullWidth onClick={upgrade}>
            {t('membership.tryMonth')}
          </Button>
          {/* The free route is a whole sentence, not a label, and the button
              base is `whitespace-nowrap` -- which clipped it at both ends on a
              390px screen. Wrapping is overridden here rather than in the
              button, because every other caller passes a short label and
              relies on nowrap. */}
          <Button
            variant="ghost"
            fullWidth
            onClick={onFreeRoute ?? (() => onOpenChange(false))}
            className="h-auto min-h-[44px] whitespace-normal py-2.5 text-center leading-snug"
          >
            {at('free')}
          </Button>
        </div>

        <p className="font-body text-sm text-muted-foreground">{t('membership.cancelAny')}</p>
      </div>
    </ResponsiveSheet>
  )
}
