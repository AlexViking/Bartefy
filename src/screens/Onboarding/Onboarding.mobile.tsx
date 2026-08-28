import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FlowSteps } from '@/components/guidance/FlowSteps'
import { T, useT } from '@/i18n/T'
import { CityStep, FinishStep, IntroStep, TasteStep } from './steps'
import { useOnboarding } from './useOnboarding'

/** Onboarding, phone shape: one step per screen, full height, the action
 *  pinned in the thumb zone. Nothing scrolls out from under the button, and
 *  there is always a visible way back.
 */
export default function OnboardingMobile() {
  const o = useOnboarding()
  const { t } = useT()
  const titleKey = o.steps[o.step].label

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
        {o.isFirst ? (
          <span className="size-11" aria-hidden="true" />
        ) : (
          <button
            type="button"
            onClick={o.back}
            aria-label={t('common.back')}
            className="flex size-11 items-center justify-center rounded-pill text-foreground hover:bg-foreground/[0.06]"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
        )}
        <FlowSteps steps={[...o.steps]} current={o.step} />
        <button
          type="button"
          onClick={o.skip}
          data-i18n="common.skip"
          className="min-h-11 px-2 font-display text-[15px] font-semibold text-muted-foreground"
        >
          {t('common.skip')}
        </button>
      </header>

      <main className="flex-1 space-y-5 overflow-y-auto px-5 pb-6 pt-4">
        <T as="h1" k={titleKey} className="font-display text-h2 text-foreground" />
        {o.stepId === 'intro' && <IntroStep />}
        {o.stepId === 'city' && <CityStep city={o.city} onSelect={o.setCity} />}
        {o.stepId === 'taste' && <TasteStep tastes={o.tastes} onToggle={o.toggleTaste} />}
        {o.stepId === 'finish' && <FinishStep />}
      </main>

      <footer className="space-y-2 border-t border-border/[0.14] bg-card px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
        {o.isLast ? (
          <>
            <Button size="lg" fullWidth onClick={() => o.finish('/add')} data-i18n="onboarding.listFirst">
              {t('onboarding.listFirst')}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              fullWidth
              onClick={() => o.finish('/hunt')}
              data-i18n="onboarding.startHunting"
            >
              {t('onboarding.startHunting')}
            </Button>
          </>
        ) : (
          <Button
            size="lg"
            fullWidth
            onClick={o.next}
            disabled={!o.canAdvance}
            data-i18n="common.next"
          >
            {t('common.next')}
          </Button>
        )}
      </footer>
    </div>
  )
}
