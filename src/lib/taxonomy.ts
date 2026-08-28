/** The one list of categories.
 *
 *  Before this there were four hardcoded lists that had already drifted apart
 *  — Hunt offered five, Browse and AddItem six, onboarding its own set — and
 *  none of them matched the categories already in the database, which came
 *  from v2 (Fashion, Electronics, Home). A 3D printer had nowhere to go but
 *  "Curiosities", which tells a hunter nothing.
 *
 *  The set below is deliberately broad. It has to cover a whole flea market
 *  without anyone hunting for the right shelf, so it errs towards fewer,
 *  wider buckets, with `other` as the honest escape hatch rather than a
 *  free-text box that would fragment the data.
 *
 *  `id` is what goes in items.category and never changes; `label` is a
 *  translation key. items.category is a plain VARCHAR with no constraint, so
 *  adding a category needs no migration — but old rows keep whatever v2 wrote,
 *  which is why LEGACY_CATEGORY_MAP exists.
 */
export interface Category {
  id: string
  label: string
}

export const CATEGORIES: Category[] = [
  { id: 'electronics', label: 'category.electronics' },
  { id: 'home_garden', label: 'category.homeGarden' },
  { id: 'kitchen', label: 'category.kitchen' },
  { id: 'furniture', label: 'category.furniture' },
  { id: 'clothing', label: 'category.clothing' },
  { id: 'bags_jewellery', label: 'category.bagsJewellery' },
  { id: 'books_media', label: 'category.booksMedia' },
  { id: 'music', label: 'category.music' },
  { id: 'sport_outdoors', label: 'category.sportOutdoors' },
  { id: 'toys_games', label: 'category.toysGames' },
  { id: 'baby_kids', label: 'category.babyKids' },
  { id: 'tools_diy', label: 'category.toolsDiy' },
  { id: 'art_craft', label: 'category.artCraft' },
  { id: 'collectables', label: 'category.collectables' },
  { id: 'other', label: 'category.other' },
]

/** What v2 wrote into items.category, mapped onto the ids above. Rows listed
 *  before this taxonomy existed still have to render and still have to filter,
 *  so every read normalises through categoryId(). */
const LEGACY_CATEGORY_MAP: Record<string, string> = {
  fashion: 'clothing',
  clothing: 'clothing',
  electronics: 'electronics',
  home: 'home_garden',
  kitchen: 'kitchen',
  cameras: 'electronics',
  books: 'books_media',
  vinyl: 'music',
  curiosities: 'collectables',
}

/** Normalise whatever is in the column onto a known category id.
 *  An empty or unrecognised value becomes 'other' rather than disappearing. */
export function categoryId(raw: unknown): string {
  const key = String(raw ?? '').trim().toLowerCase()
  if (!key) return 'other'
  if (LEGACY_CATEGORY_MAP[key]) return LEGACY_CATEGORY_MAP[key]
  return CATEGORIES.some((c) => c.id === key) ? key : 'other'
}

/** Translation key for a category id, for rendering a stored value. */
export function categoryLabel(raw: unknown): string {
  const id = categoryId(raw)
  return CATEGORIES.find((c) => c.id === id)?.label ?? 'category.other'
}

/** Condition is a smallint 1-5 in the database, so the scale is fixed at five
 *  points. The labels describe wear honestly — Bartefy's voice is a friend at
 *  a flea market, not a listing site, and "the worn bits are the point".
 *
 *  Ordered low to high so the array index maps onto the slider position.
 */
export const CONDITIONS = [
  { value: 1, label: 'condition.forParts', help: 'condition.forPartsHelp' },
  { value: 2, label: 'condition.needsWork', help: 'condition.needsWorkHelp' },
  { value: 3, label: 'condition.wellLoved', help: 'condition.wellLovedHelp' },
  { value: 4, label: 'condition.good', help: 'condition.goodHelp' },
  { value: 5, label: 'condition.likeNew', help: 'condition.likeNewHelp' },
] as const

export const DEFAULT_CONDITION = 4

export function conditionAt(value: number) {
  return CONDITIONS.find((c) => c.value === value) ?? CONDITIONS[3]
}

/** Prefix marking the free-text wish inside items.wants_in_return. Kept here
 *  so writers and readers cannot disagree about it. */
export const WANT_NOTE_PREFIX = 'note:'

/** Split a stored wants array into matchable category ids and the one
 *  human sentence. Old rows hold free text with no prefix ("Surprise me",
 *  "კოლაი"); anything that is not a known category id is treated as part of
 *  the note rather than shown as a filterable chip that would match nothing.
 */
export function splitWants(raw: unknown): { categories: string[]; note: string } {
  const all = Array.isArray(raw) ? (raw as unknown[]).map(String) : []
  const categories: string[] = []
  const notes: string[] = []

  for (const entry of all) {
    if (entry.startsWith(WANT_NOTE_PREFIX)) {
      notes.push(entry.slice(WANT_NOTE_PREFIX.length).trim())
    } else if (CATEGORIES.some((c) => c.id === entry)) {
      categories.push(entry)
    } else if (entry.trim()) {
      notes.push(entry.trim())
    }
  }
  return { categories, note: notes.join(' · ') }
}
