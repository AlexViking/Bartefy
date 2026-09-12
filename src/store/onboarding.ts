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
      /** Clamp the rehydrated step into the current array.
       *
       *  This is persisted state written by whatever build the person last
       *  used. An earlier build had more steps, so a browser carrying step 4
       *  or 5 rehydrated it unchecked, ONBOARDING_STEPS[step] was undefined,
       *  and reading `.id` off it threw on the first render -- the
       *  ErrorBoundary's "This part did not load" at /welcome, for anyone with
       *  an old value in localStorage and nobody else. Clearing site data
       *  "fixed" it, which is what made it look random.
       *
       *  `merge` rather than `onRehydrateStorage`: the latter runs AFTER the
       *  persisted object has been merged into the store, so correcting it
       *  there leaves the bad value on disk to be re-read on every visit.
       *  Fixing it here means the next write persists the corrected step.
       */
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<OnboardingState>
        const last = ONBOARDING_STEPS.length - 1
        const raw = Number(p.step)
        return {
          ...current,
          ...p,
          step: Number.isInteger(raw) ? Math.min(Math.max(0, raw), last) : 0,
        }
      },
    },
  ),
)
