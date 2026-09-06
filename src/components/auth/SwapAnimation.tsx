import { motion, useReducedMotion } from 'framer-motion'

import card1 from '@/assets/swap-card-1.webp'
import card2 from '@/assets/swap-card-2.webp'
import card3 from '@/assets/swap-card-3.webp'

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
        {/* All three change places, in a rotation rather than a swap: each
            card takes the next one's seat, so over a full cycle every find has
            been everywhere. Two travelling while a third sat still read as one
            pair trading past a bystander.

            Each carries a real find — the artworks have quite different aspect
            ratios (0.53, 1.15, 1.37), so they are fitted rather than filled:
            cropping a guitar to a card shape would cut the neck off. */}
        <SwapCard seat={0} tone=".28" float={4.2} art={card1} still={still} />
        <SwapCard seat={1} tone=".14" float={5.6} delay={0.7} art={card2} still={still} />
        <SwapCard seat={2} tone=".22" float={4.8} delay={0.35} art={card3} still={still} />
      </div>
    </div>
  )
}

/** The three places a card can sit, left to right. */
const SEATS = [-160, 0, 160]

/** Each card owns a lane, so two cards crossing in opposite directions pass
 *  above and below one another instead of through. Three cards sharing one
 *  corridor is what made the earlier rotation stack them mid-flight. */
const LANES = [-46, 4, 54]

function SwapCard({
  seat,
  tone,
  float,
  delay = 0,
  art,
  still,
}: {
  /** Which seat this card starts in. It visits the other two in turn. */
  seat: number
  tone: string
  float: number
  delay?: number
  /** Artwork for this card. Fitted, never cropped. */
  art: string
  still: boolean | null
}) {
  // Each card walks the seats in order from wherever it starts, holding each
  // new seat for a beat before moving on. It stays in its own lane throughout,
  // which is what keeps three moving cards from ever occupying one point.
  const steps = [0, 1, 1, 2, 2, 3, 3]
  const path = steps.map((step) => SEATS[(seat + step) % 3] - SEATS[seat])
  const lane = LANES[seat]

  return (
    <motion.div
      className="absolute left-1/2"
      style={{ marginLeft: SEATS[seat] - 32, marginTop: lane }}
      animate={
        still
          ? { rotate: -2 }
          : {
              x: path,
              rotate: [-6, 4, 4, -5, -5, 3, -6],
            }
      }
      transition={
        still
          ? undefined
          : {
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
              // Cross, rest, cross, rest — the pauses are what stop three cards
              // being in the same place at the same moment.
              times: [0, 0.22, 0.38, 0.6, 0.76, 0.96, 1],
            }
      }
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
