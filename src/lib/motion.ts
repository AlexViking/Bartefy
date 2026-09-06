import type { Transition, Variants } from 'framer-motion'

/** Every animation pulls from here, so the feel changes in one place.
 *
 *  Ported from v5's lib/motion.ts, with the tweens retimed to the durations
 *  tokens.css already declares (--dur-fast 140ms, --dur-med 240ms) and the
 *  brand's cubic-bezier(0.2,0,0,1) rather than v5's easing. A second easing
 *  curve living only in TypeScript would drift from the CSS one silently.
 *
 *  Rule of thumb, kept from v5: chrome uses tween, anything a finger touches
 *  uses spring.
 */

const BRAND_EASE = [0.2, 0, 0, 1] as const

export const spring = {
  /** Default UI spring — settles fast, no visible overshoot. */
  snap: { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 } as Transition,
  /** Panels, layout shifts, a form arriving. */
  gentle: { type: 'spring', stiffness: 300, damping: 30, mass: 0.9 } as Transition,
  /** Celebration only — visible bounce. Sparingly, or it reads as cheap. */
  pop: { type: 'spring', stiffness: 600, damping: 18, mass: 0.9 } as Transition,
}

export const tween = {
  fast: { duration: 0.14, ease: BRAND_EASE } as Transition,
  base: { duration: 0.24, ease: BRAND_EASE } as Transition,
}

/** Stagger children in. Pair with itemUp. */
export const listStagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
}

export const itemUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: spring.snap },
}


/** Swipe commit thresholds, ported from V5.
 *
 *  Two ways to commit, not one: past the distance OR fast enough. Distance
 *  alone means a confident flick that travels 90px is ignored, which feels
 *  like the card stuck to your finger.
 */
export const SWIPE_COMMIT_PX = 110
export const SWIPE_COMMIT_VELOCITY = 520

/** Settle spring for a card released under the threshold. Softer than snap:
 *  a card springing back should look like it was let go, not rejected. */
export const settle = { type: 'spring', stiffness: 380, damping: 30, mass: 0.8 } as const
