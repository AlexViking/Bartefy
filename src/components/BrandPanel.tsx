import symbolUrl from '@/assets/brand/symbol.webp'
import { Icon, type IconName } from '@/components/ui/icon'
import { T } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** The green half of Sign in and Onboarding (15-signin-b, 16-onboarding-b).
 *
 *  The mock fills it with stock photos of finds. Before sign-in there are no
 *  real listings the app may show (the feed needs a session), and stock photos
 *  would present things nobody has listed -- so the panel is the brand itself:
 *  Barter Green, the B symbol as a large quiet pattern, the line, the steps.
 */
export function BrandPanel({
  title,
  steps = true,
  compact = false,
  className,
}: {
  /** i18n key of the big line. */
  title: string
  steps?: boolean
  /** The phone's banner at the top of the form. */
  compact?: boolean
  className?: string
}) {
  const pattern = (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -right-16 -top-10 block bg-white/[0.07]"
      style={{
        width: compact ? 220 : 520,
        height: compact ? 340 : 800,
        WebkitMaskImage: `url(${symbolUrl})`,
        maskImage: `url(${symbolUrl})`,
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
      }}
    />
  )

  if (compact) {
    return (
      <div className={cn('relative flex h-[168px] items-end overflow-hidden rounded-3xl bg-forest p-5 text-white', className)}>
        {pattern}
        <T as="p" k={title} className="relative w-[136px] font-display text-[24px] font-semibold leading-[1.08]" />
      </div>
    )
  }

  const step = (icon: IconName, t: string, b: string) => (
    <div className="flex flex-col gap-2">
      <span className="grid size-10 place-items-center rounded-card bg-white/15">
        <Icon name={icon} size={22} />
      </span>
      <T as="p" k={t} className="font-body text-[15px] leading-5" />
      <T as="p" k={b} className="font-body text-body-sm text-white/75" />
    </div>
  )

  // Deep Forest under a gradient, the type at the foot, max 640 wide (mock).
  return (
    <aside className={cn('relative flex flex-col justify-end overflow-hidden bg-forest text-white', className)}>
      {pattern}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-forest via-forest/55 to-forest/10" />
      <div className="relative max-w-[640px] p-12 xl:p-16">
      <T as="p" k={title} className="font-display text-[56px] font-semibold leading-[1.02] tracking-tight" />
      {steps && (
        <div className="mt-8 grid grid-cols-3 gap-6">
          {step('Store', 'brand.step1', 'brand.step1Body')}
          {step('GalleryVerticalEnd', 'brand.step2', 'brand.step2Body')}
          {step('Handshake', 'brand.step3', 'brand.step3Body')}
        </div>
      )}
      </div>
    </aside>
  )
}
