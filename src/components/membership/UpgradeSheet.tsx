import { ResponsiveSheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { UPGRADE_COPY, tierOf, type UpgradeMoment } from '@/lib/membership'

/** The only upgrade surface. Called from the moment that earned it, never on
 *  launch and never mid-swipe.
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
  const copy = UPGRADE_COPY[moment]
  const collector = tierOf('collector')

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title={copy.title}>
      <div className="flex flex-col gap-4">
        <p className="font-body text-[17px] leading-relaxed">{copy.body}</p>

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
          <Button size="lg" fullWidth onClick={onUpgrade}>
            Try a month
          </Button>
          <Button variant="ghost" fullWidth onClick={onFreeRoute ?? (() => onOpenChange(false))}>
            {copy.free}
          </Button>
        </div>

        <p className="font-body text-sm text-muted-foreground">
          Cancel any time. Swaps already agreed always finish under the limits you had.
        </p>
      </div>
    </ResponsiveSheet>
  )
}
