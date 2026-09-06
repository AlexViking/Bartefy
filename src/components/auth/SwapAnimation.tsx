import { motion, useReducedMotion } from 'framer-motion'

import card1 from '@/assets/swap-card-1.png'
import card2 from '@/assets/swap-card-2.png'
import card3 from '@/assets/swap-card-3.png'

/** Two finds trading places on a slow loop, ported from v5's BrandPanel.
 *
 *  It says what the product does without a word of copy, which is why it earns
 *  a permanent loop where nothing else in the app gets one: the auth screen is
 *  a screen you wait on, with nothing else asking for attention. Anywhere past
 *  sign-in this would be noise competing with real content.
 *
 *  Everything here is decorative, so a reduced-motion setting drops the motion
 *  and keeps the composition — the shapes still read as objects mid-trade, they
 *  simply hold still. Returning null instead would leave a hole where the
 *  layout expects a picture.
 */
export function SwapAnimation({ className }: { className?: string }) {
  const still = useReducedMotion()

  return (
    <div className={className} aria-hidden="true">
      <div className="relative flex h-[150px] items-center justify-center">
        {/* The two arcs are one circuit: something leaving along the top as
            something else returns along the bottom. */}
        <svg
          viewBox="0 0 300 120"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full opacity-50"
        >
          <motion.path
            d="M70 74 C 110 24, 190 24, 230 74"
            fill="none"
            stroke="rgba(255,255,255,.85)"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeDasharray="5 9"
            animate={still ? undefined : { strokeDashoffset: [0, -56] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'linear' }}
          />
          <motion.path
            d="M230 86 C 190 130, 110 130, 70 86"
            fill="none"
            stroke="rgba(255,255,255,.55)"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeDasharray="5 9"
            animate={still ? undefined : { strokeDashoffset: [-56, 0] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'linear' }}
          />
        </svg>

        {/* The outer two swap; the middle one stays put, so the exchange reads
            as two things passing rather than everything drifting.

            Each card carries a real find rather than a blank tile — a guitar
            going one way, a ring the other, which is the swap the copy beside
            it describes. The three artworks have quite different aspect ratios
            (0.53, 1.15, 1.37), so they are fitted rather than filled: cropping
            a guitar to a card shape would cut the neck off. */}
        <SwapCard offset={-130} tone=".28" travel={196} float={4.2} arc={-34} art={card1} still={still} />
        <SwapCard offset={-32} tone=".12" travel={0} float={5.6} delay={0.7} art={card2} still={still} />
        <SwapCard offset={66} tone=".22" travel={-196} float={4.8} arc={34} delay={0.35} art={card3} still={still} />
      </div>
    </div>
  )
}

function SwapCard({
  offset,
  tone,
  travel,
  float,
  arc = 0,
  delay = 0,
  art,
  still,
}: {
  offset: number
  tone: string
  travel: number
  float: number
  /** Vertical detour at the midpoint, so two travellers pass instead of collide. */
  arc?: number
  delay?: number
  /** Artwork for this card. Fitted, never cropped. */
  art: string
  still: boolean | null
}) {
  const swapping = travel !== 0 && !still
  return (
    <motion.div
      className="absolute left-1/2"
      style={{ marginLeft: offset }}
      animate={
        swapping
          ? {
              x: [0, travel, 0],
              // The two travellers arc over and under each other rather than
              // straight through. In v5 the panel was wide enough that they
              // cleared on the horizontal alone; in half a split screen they
              // met in the middle and read as one smear.
              y: [0, arc, 0],
              rotate: [-7, 7, -7],
            }
          : { rotate: -2 }
      }
      transition={swapping ? { duration: 9, repeat: Infinity, ease: [0.45, 0, 0.35, 1] } : undefined}
    >
      <motion.span
        animate={still ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: float, repeat: Infinity, ease: 'easeInOut', delay }}
        className="flex h-[82px] w-16 items-center justify-center overflow-hidden rounded-[9px] p-1.5"
        style={{ background: `rgba(255,255,255,${tone})` }}
      >
        <img
          src={art}
          alt=""
          draggable={false}
          // contain, so each artwork keeps its own proportions inside a card
          // shape none of them share.
          className="size-full select-none object-contain"
        />
      </motion.span>
    </motion.div>
  )
}

/** The two drifting blobs behind the brand copy. Separated from SwapAnimation
 *  because they are background for a whole panel, not part of the picture. */
export function DriftingBlobs() {
  const still = useReducedMotion()
  if (still) return null

  return (
    <>
      <motion.span
        aria-hidden="true"
        animate={{ x: [0, 26, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -right-10 -top-16 size-72 rounded-pill bg-white/[.06]"
      />
      <motion.span
        aria-hidden="true"
        animate={{ x: [0, -22, 0], y: [0, 18, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -bottom-16 -left-12 size-56 rounded-pill bg-white/[.05]"
      />
    </>
  )
}
