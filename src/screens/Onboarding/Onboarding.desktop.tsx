import mapUrl from '@/assets/bartefy-bg-treasure-map.png'
import { Wordmark } from '@/components/Wordmark'
import { Button } from '@/components/ui/button'
import { FlowSteps } from '@/components/guidance/FlowSteps'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { T, useT } from '@/i18n/T'
import { CityStep, FinishStep, IntroStep, TasteStep } from './steps'
import { useOnboarding } from './useOnboarding'

/** Onboarding, desktop shape: a split with the brand on the left and the step
 *  on the right. The labelled step track is visible throughout, so the whole
 *  path is legible at a glance rather than revealed one screen at a time.
 */
export default function OnboardingDesktop() {
  const o = useOnboarding()
  const { t } = useT()
  const titleKey = o.steps[o.step].label

  return (
    <div className="grid min-h-dvh grid-cols-[minmax(0,1fr)_minmax(0,560px)] overflow-x-hidden bg-background">
      <aside
        className="relative flex min-w-0 flex-col justify-between bg-primary p-10"
        style={{
          backgroundImage: `linear-gradient(rgba(47,106,82,0.92), rgba(47,106,82,0.92)), url(${mapUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Wordmark on="dark" />
        <div className="max-w-[420px] space-y-3">
          <T as="h2" k="auth.welcomeTitle" className="font-display text-h2 text-primary-foreground" />
          <T
            as="p"
            k="brand.tagline"
            className="font-body text-body text-primary-foreground/80"
          />
        </div>
        <T
          as="p"
          k="membership.alwaysFreeBody"
          className="max-w-[420px] font-body text-sm leading-relaxed text-primary-foreground/70"
        />
      </aside>

      <main className="flex min-w-0 flex-col justify-center px-10 py-10">
        <div className="mb-8 flex items-center justify-between">
          <FlowSteps steps={[...o.steps]} current={o.step} />
          <LanguageSwitcher />
        </div>

        <div className="space-y-5">
          <T as="h1" k={titleKey} className="font-display text-h2 text-foreground" />
          {o.stepId === 'intro' && <IntroStep />}
          {o.stepId === 'city' && <CityStep city={o.city} onSelect={o.setCity} />}
          {o.stepId === 'taste' && <TasteStep tastes={o.tastes} onToggle={o.toggleTaste} />}
          {o.stepId === 'finish' && <FinishStep />}
        </div>

        <div className="mt-10 flex items-center gap-3">
          {!o.isFirst && (
            <Button variant="ghost" size="lg" onClick={o.back} data-i18n="common.back">
              {t('common.back')}
            </Button>
          )}
          {o.isLast ? (
            <>
              <Button size="lg" onClick={() => o.finish('/add')} data-i18n="onboarding.listFirst">
                {t('onboarding.listFirst')}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => o.finish('/hunt')}
                data-i18n="onboarding.startHunting"
              >
                {t('onboarding.startHunting')}
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={o.next} disabled={!o.canAdvance} data-i18n="common.next">
              {t('common.next')}
            </Button>
          )}
          <button
            type="button"
            onClick={o.skip}
            data-i18n="common.skip"
            className="ml-auto min-h-hit px-2 font-display text-[15px] font-semibold text-muted-foreground hover:text-foreground"
          >
            {t('common.skip')}
          </button>
        </div>
      </main>
    </div>
  )
}
