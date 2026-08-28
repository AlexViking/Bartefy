import { useNavigate } from 'react-router'
import { CATEGORIES } from '@/lib/taxonomy'

import { ONBOARDING_STEPS, useOnboardingStore } from '@/store/onboarding'
import { useAuthStore } from '@/store/auth'

/** Everything the onboarding flow does, with no layout in it.
 *  Both Onboarding.mobile and Onboarding.desktop call this, so the two layouts
 *  can never drift apart in behaviour.
 */
/** Tastes are category ids, so what someone picks here actually seeds Hunt's
 *  filters. They used to be their own list ('cameras', 'plants', 'bikes'),
 *  none of which matched a category, so the seeding silently matched nothing. */
export const TASTE_OPTIONS = CATEGORIES

/** Seeded from the cities we have meeting spots for. */
export const CITY_OPTIONS = ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Leipzig'] as const

export function useOnboarding() {
  const navigate = useNavigate()
  const step = useOnboardingStore((s) => s.step)
  const city = useOnboardingStore((s) => s.city)
  const tastes = useOnboardingStore((s) => s.tastes)
  const next = useOnboardingStore((s) => s.next)
  const back = useOnboardingStore((s) => s.back)
  const setCity = useOnboardingStore((s) => s.setCity)
  const toggleTaste = useOnboardingStore((s) => s.toggleTaste)
  const complete = useOnboardingStore((s) => s.complete)
  const setSelectedCity = useAuthStore((s) => s.setSelectedCity)

  const isFirst = step === 0
  const isLast = step === ONBOARDING_STEPS.length - 1

  /** The city step is the only one that gates progress: without a city we have
   *  no feed to show. Taste is genuinely optional. */
  const canAdvance = ONBOARDING_STEPS[step].id === 'city' ? city.length > 0 : true

  const finish = (destination: '/add' | '/hunt') => {
    setSelectedCity(city)
    complete()
    navigate(destination, { replace: true })
  }

  /** Skipping still completes onboarding — someone who opts out should not be
   *  asked again on every load. */
  const skip = () => {
    if (city) setSelectedCity(city)
    complete()
    navigate('/hunt', { replace: true })
  }

  return {
    steps: ONBOARDING_STEPS,
    step,
    stepId: ONBOARDING_STEPS[step].id,
    city,
    tastes,
    isFirst,
    isLast,
    canAdvance,
    next,
    back,
    setCity,
    toggleTaste,
    finish,
    skip,
  }
}
