import { BrandPanel } from '@/components/BrandPanel'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { OrzomiByline } from '@/components/OrzomiByline'
import { BrandLockup } from '@/components/shell/BrandMark'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { T, useT } from '@/i18n/T'
import { cn } from '@/lib/utils'
import { CityStep, FinishStep, IntroStep, TasteStep } from './steps'
import { useOnboarding } from './useOnboarding'

/** Onboarding (16-onboarding-b): welcome · Tbilisi · tastes · all set.
 *  Desktop: the steps on the left, the brand on the right. Phone: one column,
 *  Next pinned to the foot. The steps' content and rules are unchanged
 *  (steps.tsx, useOnboarding). */
export function OnboardingLayout({ wide }: { wide: boolean }) {
  const o = useOnboarding()
  const { t } = useT()
  const titleKey = (o.steps[o.step] ?? o.steps[0]).label

  const bars = (
    <div className="flex gap-1.5" aria-label={t('common.stepOf', { current: o.step + 1, total: o.steps.length })}>
      {o.steps.map((s, i) => (
        <span key={s.id} className={cn('h-1.5 w-8 rounded-pill', i <= o.step ? 'bg-primary' : 'bg-secondary')} />
      ))}
    </div>
  )

  const body = (
    <div className="flex flex-col gap-5">
      <T as="h1" k={titleKey} className={cn('font-display font-bold text-foreground', wide ? 'text-[32px] leading-10' : 'text-[26px] leading-8')} />
      {o.stepId === 'intro' && <IntroStep />}
      {o.stepId === 'city' && <CityStep city={o.city} onSelect={o.setCity} />}
      {o.stepId === 'taste' && <TasteStep tastes={o.tastes} onToggle={o.toggleTaste} />}
      {o.stepId === 'finish' && <FinishStep />}
    </div>
  )

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      {!o.isFirst && (
        <Button variant="ghost" onClick={o.back}>
          <T as="span" k="common.back" />
        </Button>
      )}
      <span className="flex-1" />
      {o.isLast ? (
        <>
          <Button variant="ghost" onClick={() => void o.finish('/discover')}>
            <T as="span" k="onboarding.startHunting" />
          </Button>
          <Button size="lg" onClick={() => void o.finish('/add')}>
            <T as="span" k="onboarding.listFirst" />
          </Button>
        </>
      ) : (
        <Button size="lg" onClick={o.next} disabled={!o.canAdvance}>
          <T as="span" k="common.next" />
          <Icon name="ArrowRight" size={18} />
        </Button>
      )}
    </div>
  )

  const top = (
    <div className="flex items-center justify-between gap-3">
      <BrandLockup withWord />
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <button type="button" onClick={() => void o.skip()} className="min-h-hit whitespace-nowrap px-2 font-body text-label-lg text-muted-foreground hover:text-foreground">
          <T as="span" k="onboarding.skipForNow" />
        </button>
      </div>
    </div>
  )

  if (wide) {
    return (
      <div className="grid min-h-dvh grid-cols-[minmax(460px,5fr)_7fr] bg-background">
        <main className="flex flex-col px-12 py-8">
          {top}
          <div className="flex min-h-0 flex-1 flex-col justify-center py-8">
            <div className="flex w-full max-w-[480px] flex-col gap-6">
              {bars}
              {body}
              {actions}
            </div>
          </div>
          <OrzomiByline />
        </main>
        <BrandPanel title="brand.onboardLine" steps={false} />
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="flex flex-col gap-4 px-5 pt-5">
        {top}
        {bars}
      </div>
      <main className="flex-1 overflow-y-auto px-5 pb-6 pt-5">{body}</main>
      <footer className="sticky bottom-0 border-t border-input bg-card px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">{actions}</footer>
    </div>
  )
}
