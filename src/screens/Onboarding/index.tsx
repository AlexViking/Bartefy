import { createScreen } from '@/lib/platform'

/** First run. Mounts one layout or the other — never both, never a compromise
 *  between them. See src/lib/platform.tsx for why the split exists.
 */
export const Onboarding = createScreen({
  mobile: () => import('./Onboarding.mobile'),
  desktop: () => import('./Onboarding.desktop'),
})
