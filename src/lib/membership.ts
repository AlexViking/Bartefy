/** F7 - membership model. Sell reach and reassurance; never sell safety.
 *  Free members can complete every swap. Paying members complete more, faster.
 */
export type Tier = 'hunter' | 'collector' | 'curator'

export interface TierSpec {
  id: Tier
  name: string
  priceLabel: string
  blurb: string
  perks: string[]
  radiusKm: number | null
  liveFinds: number | null
  activeSwaps: number | null
  savedSearches: number
  seeEyeing: boolean
  spotlightsPerWeek: number
}

export const TIERS: TierSpec[] = [
  {
    id: 'hunter',
    name: 'Hunter',
    priceLabel: 'Free',
    blurb: 'The whole loop, at neighbourhood scale. Most people never need more.',
    perks: [
      'Unlimited hunting within 10 km',
      '6 finds live at a time',
      '3 swaps on the go',
      '1 saved search, daily digest',
      'Chat, meetups, ratings, reporting',
    ],
    radiusKm: 10,
    liveFinds: 6,
    activeSwaps: 3,
    savedSearches: 1,
    seeEyeing: false,
    spotlightsPerWeek: 0,
  },
  {
    id: 'collector',
    name: 'Collector',
    priceLabel: '$4.99 / month',
    blurb: 'For the person who swaps most weekends and hates missing a good find.',
    perks: [
      'Hunt out to 50 km, any category',
      'Unlimited finds live',
      'Unlimited swaps on the go',
      'See who is eyeing your finds',
      '5 saved searches, instant alerts',
      'One weekly spotlight',
      'Undo your last pass',
    ],
    radiusKm: 50,
    liveFinds: null,
    activeSwaps: null,
    savedSearches: 5,
    seeEyeing: true,
    spotlightsPerWeek: 1,
  },
  {
    id: 'curator',
    name: 'Curator',
    priceLabel: '$12 / month',
    blurb: 'For vintage traders and clear-out projects moving dozens of things a month.',
    perks: [
      'Everything in Collector',
      'Multi-city reach, no radius cap',
      '3 spotlights a week',
      'Bulk listing from camera roll',
      'Views, passes and wants per find',
      'Verified curator mark on your profile',
      'Discounted postage labels',
    ],
    radiusKm: null,
    liveFinds: null,
    activeSwaps: null,
    savedSearches: 25,
    seeEyeing: true,
    spotlightsPerWeek: 3,
  },
]

export const tierOf = (id: Tier) => TIERS.find((t) => t.id === id) ?? TIERS[0]

/** Never gated, at any tier. Keep this list in code so nobody paywalls it later. */
export const ALWAYS_FREE = [
  'report',
  'block',
  'chat',
  'arrange_meetup',
  'confirm_handover',
  'rate',
  'read_own_threads',
  'finish_agreed_swap',
] as const

export type UpgradeMoment =
  | 'radius'
  | 'live_finds'
  | 'active_swaps'
  | 'see_eyeing'
  | 'saved_search'
  | 'after_fourth_swap'

/** One sheet, one price, one line about what changes, and a visible free
 *  alternative. Never an interstitial on launch, never mid-swipe, never during
 *  a handover or a dispute.
 */
export const UPGRADE_COPY: Record<UpgradeMoment, { title: string; body: string; free: string }> = {
  radius: {
    title: 'Hunt further out',
    body: 'Collector opens the whole city and 50 km around it.',
    free: 'Or wait - new finds land within 10 km every day.',
  },
  live_finds: {
    title: 'Keep more finds live',
    body: 'Hunter holds six at a time. Collector has no cap.',
    free: 'Or pause an older find to make room - nothing is deleted.',
  },
  active_swaps: {
    title: 'More swaps at once',
    body: 'Hunter runs three at a time so nobody gets left waiting.',
    free: 'Or finish one of yours first.',
  },
  see_eyeing: {
    title: 'See who is eyeing this',
    body: 'Collector shows you who, so you can offer them something first.',
    free: 'The count stays free, always.',
  },
  saved_search: {
    title: 'Instant alerts',
    body: 'Collector saves five searches and tells you the moment one lands.',
    free: 'Your first search still arrives in the daily digest.',
  },
  after_fourth_swap: {
    title: 'Four swaps in. Nicely done.',
    body: 'Collector widens the map and lifts the caps, if you want more of this.',
    free: 'Staying on Hunter changes nothing about what you already have.',
  },
}
