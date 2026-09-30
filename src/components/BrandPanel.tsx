import { MaterialIcon, type MaterialIconName } from '@/components/ui/material-icon'
import { T } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** The mock's twelve finds (15-signin-b), kept in the bundle as 512px WebP
 *  (~25 KB each) rather than hot-linked from where the design tool left them,
 *  so they cannot disappear. Order is the mock's: the phone banner uses the
 *  first three, fanned out. */
const FINDS = Object.values(
  import.meta.glob('../assets/panel/find-*.webp', { eager: true, import: 'default' }),
) as string[]

/** The green half of Sign in and Onboarding (15-signin-b, 16-onboarding-b):
 *  Deep Forest, a tilted grid of finds under a gradient, the line, the steps. */
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
  if (compact) {
    return (
      <div className={cn('relative h-[168px] overflow-hidden rounded-3xl bg-forest', className)}>
        <div aria-hidden="true" className="absolute right-3 top-6 h-[130px] w-[164px]">
          {FINDS.slice(0, 3).map((src, i) => (
            <img
              key={src}
              alt=""
              src={src}
              className={cn(
                'absolute h-[96px] w-[74px] rounded-2xl object-cover shadow-lg ring-4 ring-forest',
                i === 0 && 'left-0 top-3 -rotate-6',
                i === 1 && 'left-[46px] top-0 rotate-3',
                i === 2 && 'left-[90px] top-5 rotate-12',
              )}
            />
          ))}
        </div>
        <T as="p" k={title} className="absolute bottom-5 left-5 w-[136px] font-display text-[24px] font-semibold leading-[1.08] text-white" />
      </div>
    )
  }

  const step = (icon: MaterialIconName, t: string, b: string) => (
    <div className="flex flex-col gap-2">
      <span className="grid size-10 place-items-center rounded-card bg-white/15">
        <MaterialIcon name={icon} size={22} />
      </span>
      <T as="p" k={t} className="font-body text-[15px] leading-5" />
      <T as="p" k={b} className="font-body text-body-sm text-white/75" />
    </div>
  )

  return (
    <aside className={cn('relative flex flex-col justify-end overflow-hidden bg-forest text-white', className)}>
      {/* Three columns, tilted 3°, every other tile dropped 32px (the mock). */}
      <div aria-hidden="true" className="absolute inset-0 grid origin-center -rotate-3 scale-110 grid-cols-3 gap-3 p-3">
        {FINDS.map((src, i) => (
          <img key={src} alt="" src={src} className={cn('size-full rounded-2xl object-cover', i % 2 === 1 && 'translate-y-8')} />
        ))}
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-forest via-forest/55 to-forest/10" />
      <div className="relative max-w-[640px] p-12 xl:p-16">
        <T as="p" k={title} className="font-display text-[56px] font-semibold leading-[1.02] tracking-tight" />
        {steps && (
          <div className="mt-8 grid grid-cols-3 gap-6">
            {step('table_restaurant', 'brand.step1', 'brand.step1Body')}
            {step('style', 'brand.step2', 'brand.step2Body')}
            {step('handshake', 'brand.step3', 'brand.step3Body')}
          </div>
        )}
      </div>
    </aside>
  )
}
