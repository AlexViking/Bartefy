import { Compass, HandHeart, PackageOpen, Sparkles } from 'lucide-react'

import { Chip } from '@/components/ui/tone-badge'
import { InfoHint } from '@/components/guidance/InfoHint'
import { T, useT } from '@/i18n/T'
import { CITY_OPTIONS, TASTE_OPTIONS } from './useOnboarding'
import { cn } from '@/lib/utils'

/** Step bodies, shared by both platform layouts. They are content only — the
 *  mobile and desktop shells decide how they are framed, paced and navigated.
 */

/** Step 1: what Bartefy actually is. Four plain sentences, because a new
 *  visitor has no idea what "bartefy" means and will not read a paragraph. */
export function IntroStep() {
  const points = [
    { icon: PackageOpen, title: 'onboarding.step2Title', body: 'onboarding.step2Body' },
    { icon: Compass, title: 'onboarding.step3Title', body: 'onboarding.step3Body' },
    { icon: HandHeart, title: 'onboarding.step4Title', body: 'onboarding.step4Body' },
  ]
  return (
    <div className="space-y-5">
      <T as="p" k="onboarding.step1Body" className="font-body text-body text-muted-foreground" />
      <ul className="space-y-4">
        {points.map(({ icon: Ico, title, body }) => (
          <li key={title} className="flex gap-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-primary/[0.10]">
              <Ico className="size-5 text-primary" aria-hidden="true" />
            </span>
            <div className="space-y-0.5">
              <T as="p" k={title} className="font-display text-h3 text-foreground" />
              <T as="p" k={body} className="font-body text-sm leading-relaxed text-muted-foreground" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CityStep({
  city,
  onSelect,
}: {
  city: string
  onSelect: (city: string) => void
}) {
  return (
    <div className="space-y-4">
      <T as="p" k="onboarding.cityBody" className="font-body text-body text-muted-foreground" />
      <div className="flex flex-wrap gap-2">
        {CITY_OPTIONS.map((c) => (
          <Chip key={c} active={city === c} onClick={() => onSelect(c)}>
            {c}
          </Chip>
        ))}
      </div>
    </div>
  )
}

export function TasteStep({
  tastes,
  onToggle,
}: {
  tastes: string[]
  onToggle: (id: string) => void
}) {
  const { t } = useT()
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-1.5">
        <T as="p" k="onboarding.tasteBody" className="font-body text-body text-muted-foreground" />
        <InfoHint k="help.whyWants" />
      </div>
      <div className="flex flex-wrap gap-2">
        {TASTE_OPTIONS.map((tOpt) => (
          <Chip
            key={tOpt.id}
            icon={tOpt.icon}
            active={tastes.includes(tOpt.id)}
            onClick={() => onToggle(tOpt.id)}
          >
            {t(tOpt.label)}
          </Chip>
        ))}
      </div>
    </div>
  )
}

export function FinishStep({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      <span className="flex size-14 items-center justify-center rounded-pill bg-accent/[0.30]">
        <Sparkles className="size-7 text-accent-foreground" aria-hidden="true" />
      </span>
      <T as="p" k="onboarding.finishBody" className="font-body text-body text-muted-foreground" />
      <div className="rounded border border-border/[0.14] bg-secondary p-4">
        <T
          as="p"
          k="membership.alwaysFreeTitle"
          className="font-display text-[15px] font-semibold text-foreground"
        />
        <T
          as="p"
          k="membership.alwaysFreeBody"
          className="mt-1 font-body text-sm leading-relaxed text-muted-foreground"
        />
      </div>
    </div>
  )
}
