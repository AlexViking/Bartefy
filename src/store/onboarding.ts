import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Onboarding is a first-run flow, not a screen you can get lost in.
 *
 *  Progress persists, so closing the tab mid-way resumes where it left off
 *  rather than starting over. `completed` is what the router checks: a signed-in
 *  person who has not completed onboarding is sent to it before anything else.
 */
export const ONBOARDING_STEPS = [
  { id: 'intro', label: 'onboarding.step1Title' },
  { id: 'city', label: 'onboarding.cityTitle' },
  { id: 'taste', label: 'onboarding.tasteTitle' },
  { id: 'finish', label: 'onboarding.finishTitle' },
] as const

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]['id']

interface OnboardingState {
  step: number
  city: string
  tastes: string[]
  completed: boolean
  /** True only for the run that just finished, so Hunt can greet a brand-new
   *  swapper differently from a returning one. */
  justFinished: boolean

  next: () => void
  back: () => void
  goTo: (step: number) => void
  setCity: (city: string) => void
  toggleTaste: (taste: string) => void
  complete: () => void
  clearJustFinished: () => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      step: 0,
      city: '',
      tastes: [],
      completed: false,
      justFinished: false,

      next: () =>
        set((s) => ({ step: Math.min(s.step + 1, ONBOARDING_STEPS.length - 1) })),
      back: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),
      goTo: (step) =>
        set({ step: Math.max(0, Math.min(step, ONBOARDING_STEPS.length - 1)) }),
      setCity: (city) => set({ city }),
      toggleTaste: (taste) =>
        set((s) => ({
          tastes: s.tastes.includes(taste)
            ? s.tastes.filter((t) => t !== taste)
            : [...s.tastes, taste],
        })),
      complete: () => set({ completed: true, justFinished: true }),
      clearJustFinished: () => set({ justFinished: false }),
      reset: () =>
        set({ step: 0, city: '', tastes: [], completed: false, justFinished: false }),
    }),
    {
      name: 'bartefy.onboarding',
      partialize: (s) => ({
        step: s.step,
        city: s.city,
        tastes: s.tastes,
        completed: s.completed,
      }),
    },
  ),
)
