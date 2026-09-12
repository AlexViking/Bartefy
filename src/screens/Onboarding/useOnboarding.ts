import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { CATEGORIES } from '@/lib/taxonomy'

import { updateProfile } from '@/lib/api'
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

/** Launch is Tbilisi only, on purpose. A barter marketplace lives on density —
 *  a thin spread across several cities gives everyone an empty deck — so the
 *  list stays at one until that one is working.
 *
 *  It is still a list rather than a constant: the second city is a data change
 *  here, not a refactor of every screen that offers a choice.
 */
export const CITY_OPTIONS = ['Tbilisi'] as const

/** What a new account gets before onboarding has asked anything. With one city
 *  there is nothing to ask, but the value still has to reach the database —
 *  the feed filters on it. */
export const DEFAULT_CITY = CITY_OPTIONS[0]

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
  const userId = useAuthStore((s) => s.session?.user?.id)

  const isFirst = step === 0
  const isLast = step === ONBOARDING_STEPS.length - 1

  /** The city step is the only one that gates progress: without a city we have
   *  no feed to show. Taste is genuinely optional. */
  /** The current step, never undefined.
   *
   *  The store clamps on rehydrate, but indexing an array is the kind of thing
   *  that should not depend on someone else having been careful: a step that
   *  falls out of range here throws on render rather than showing a screen. */
  const current = ONBOARDING_STEPS[step] ?? ONBOARDING_STEPS[0]

  const canAdvance = current.id === 'city' ? city.length > 0 : true

  /** With one launch city there is no choice to make, so make it. Leaving the
   *  single chip unselected would gate the step behind a tap that conveys
   *  nothing — and someone who backs out before tapping it would otherwise
   *  arrive with no city at all. */
  useEffect(() => {
    if (!city) setCity(DEFAULT_CITY)
  }, [city, setCity])

  /** Write the city to the profile, not just to memory.
   *
   *  setSelectedCity alone put it in a Zustand store that is never persisted,
   *  and `complete` only sets a localStorage flag — so home_city stayed NULL
   *  for everyone who never opened Settings, which is the only other place that
   *  writes it. The feed filters on that column, so the choice was collected
   *  and then thrown away.
   *
   *  Skipping saves too: with one launch city there is nothing to choose, and
   *  an account with no city is one the feed cannot serve.
   */
  const persistCity = async (chosen: string) => {
    const value = chosen || DEFAULT_CITY
    setSelectedCity(value)
    if (!userId) return
    const { error } = await updateProfile(userId, { home_city: value })
    // Onboarding must not strand someone on a dead button when the write fails
    // — a missing city is recoverable in Settings, a blocked flow is not.
    if (error) console.error('[onboarding] could not save city', error)
  }

  const finish = async (destination: '/add' | '/discover') => {
    await persistCity(city)
    complete()
    navigate(destination, { replace: true })
  }

  /** Skipping still completes onboarding — someone who opts out should not be
   *  asked again on every load. */
  const skip = async () => {
    await persistCity(city)
    complete()
    navigate('/discover', { replace: true })
  }

  return {
    steps: ONBOARDING_STEPS,
    step,
    stepId: current.id,
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
