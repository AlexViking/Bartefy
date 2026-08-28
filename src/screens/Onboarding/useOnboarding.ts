import { useNavigate } from 'react-router'

import { ONBOARDING_STEPS, useOnboardingStore } from '@/store/onboarding'
import { useAuthStore } from '@/store/auth'

/** Everything the onboarding flow does, with no layout in it.
 *  Both Onboarding.mobile and Onboarding.desktop call this, so the two layouts
 *  can never drift apart in behaviour.
 */
export const TASTE_OPTIONS = [
  { id: 'cameras', label: 'Cameras' },
  { id: 'books', label: 'Books' },
  { id: 'vinyl', label: 'Vinyl' },
  { id: 'clothing', label: 'Clothing' },
  { id: 'furniture', label: 'Furniture' },
  { id: 'plants', label: 'Plants' },
  { id: 'tools', label: 'Tools' },
  { id: 'games', label: 'Games' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'art', label: 'Art' },
  { id: 'bikes', label: 'Bikes' },
  { id: 'curiosities', label: 'Curiosities' },
] as const

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
