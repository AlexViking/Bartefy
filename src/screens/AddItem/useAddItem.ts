import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'

import { insertItem } from '@/lib/api'
import { PERK_PRICES, pointsErrorKey, spendOnPerk } from '@/lib/points'
import { useT } from '@/i18n/T'
import { toast } from 'sonner'
import { DEFAULT_CONDITION, WANT_NOTE_PREFIX } from '@/lib/taxonomy'
import { useAuthStore } from '@/store/auth'
import { useMembershipStore } from '@/store/membership'
import { useOnboardingStore } from '@/store/onboarding'
import { usePhotoSlots } from './usePhotoSlots'


/** items.expires_at is NOT NULL with no default — an insert that omits it is
 *  rejected outright, and get_feed hides anything already expired. */
const LISTING_DAYS = 30

export const ADD_STEPS = [
  // V6 (18-add-b, approved by Alex): the photo first -- "Show it. One photo
  // is enough to start."
  //
  // The order used to be details first, deliberately: an upload spends
  // metered R2 storage, and one live item reached production with a photo and
  // an empty title. The empty title cannot recur -- publish still requires a
  // name (canPublish). What photo-first does cost is the bytes of drafts that
  // are abandoned after a photo. Flip these two lines to go back.
  { id: 'photos', label: 'add.stepPhotos' },
  { id: 'details', label: 'add.stepDetails' },
  { id: 'wants', label: 'add.stepWants' },
] as const

/** Listing a find, with no layout in it.
 *
 *  Only a photo is required. Everything else — title, story, category,
 *  condition, wants — is optional, because the fastest way to get someone's
 *  first find on the table is to ask for almost nothing.
 */
export function useAddItem() {
  const navigate = useNavigate()
  const { t } = useT()
  /** Set when Hunt sent us here from the offer sheet: the public id of the
   *  find they wanted to offer on. */
  const offerOn = new URLSearchParams(useLocation().search).get('offerOn') || ''
  const queryClient = useQueryClient()
  const can = useMembershipStore((s) => s.can)
  const userId = useAuthStore((s) => s.session?.user?.id)
  // selectedCity lives only in memory, so it is empty on a cold load. The
  // onboarding store persists the city the person actually chose, and an item
  // inserted with an empty location_city sorts into nobody's feed.
  const selectedCity = useAuthStore((s) => s.selectedCity)
  const onboardingCity = useOnboardingStore((s) => s.city)
  const city = selectedCity || onboardingCity

  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  /** A find is often genuinely two things — a camera bag is bags and cameras.
   *  items.category is a single column, so the first pick is what gets stored
   *  and stays matchable; the rest ride along as extra categories. */
  const [categories, setCategories] = useState<string[]>([])
  const [condition, setCondition] = useState<number>(DEFAULT_CONDITION)
  const [wants, setWants] = useState<string[]>([])
  const [wantsNote, setWantsNote] = useState('')
  const [capped, setCapped] = useState(false)
  const [publishing, setPublishing] = useState(false)
  /** null while composing; 'ok' or 'held' once the listing exists. Drives the
   *  outcome screen rather than navigating away silently. */
  const [published, setPublished] = useState<'ok' | 'held' | null>(null)
  /** The find that was just listed, for the boost prompt. */
  const [publishedId, setPublishedId] = useState<string | null>(null)
  const [boosting, setBoosting] = useState(false)
  const [publishError, setPublishError] = useState(false)

  // The photos: one upload path, shared with Edit on My finds.
  const ph = usePhotoSlots({ onCapped: () => setCapped(true) })
  const { photos, hasPhoto, uploading } = ph

  /** What each step needs before it can be left.
   *
   *  A find with no title renders as a nameless row wherever it appears — in
   *  the inbox, in a swap pair, on the profile grid — and one such item is
   *  live in production. The rules are enforced here rather than only on the
   *  publish button so the gap cannot be walked past in the first place.
   *
   *  Trimmed, so a title of spaces does not pass. */
  // V6: "Only a photo is required -- the rest helps the right people find
  // it." A NAME stays required too (see ADD_STEPS). The story is optional,
  // and a find with no category is stored as 'other' rather than blocked.
  const detailsComplete = title.trim().length > 0

  /** Whether the current step may be left for the next one. Photos additionally
   *  requires that nothing is still in flight, so publish cannot fire against a
   *  half-written upload. */
  const canAdvance =
    ADD_STEPS[step].id === 'details'
      ? detailsComplete
      : ADD_STEPS[step].id === 'photos'
        ? hasPhoto && !uploading
        : true

  /** Everything a listing needs. Re-checked at publish rather than trusted from
   *  the step gate: back-navigation can empty a field after its step passed. */
  const canPublish = detailsComplete && hasPhoto && !uploading

  const toggleWant = (w: string) =>
    setWants((f) => (f.includes(w) ? f.filter((x) => x !== w) : [...f, w]))

  /** Order is meaningful: the first pick is the one stored in items.category,
   *  which is what the feed and search filter on. */
  const toggleCategory = (c: string) =>
    setCategories((f) => (f.includes(c) ? f.filter((x) => x !== c) : [...f, c]))

  const publish = async () => {
    if (!can('add_find')) return setCapped(true)
    if (!userId || publishing) return

    const images = ph.images
    /** Dimensions per photo, in the same order as `images`.
     *
     *  items.photo_meta has existed since migration 005 and nothing has ever
     *  written to it, so every grid had to assume 4:3 and then reflow when the
     *  real photo loaded -- the orange boxes that resize. With this stored,
     *  the box is correct on first paint. */
    const photoMeta = ph.photoMeta
    // The last line of defence. insertItem would otherwise happily write
    // title: '' — which is how a nameless find got into production.
    if (images.length === 0 || !canPublish) return

    setPublishing(true)
    setPublishError(false)

    const expires = new Date()
    expires.setDate(expires.getDate() + LISTING_DAYS)

    // Category ids, plus the free-text wish behind its prefix. get_item_detail
    // matches your finds against these, so ids stay matchable data while the
    // note stays human.
    const wantsColumn = [...wants]
    if (wantsNote.trim()) wantsColumn.push(WANT_NOTE_PREFIX + wantsNote.trim())

    const { data: inserted, error } = await insertItem({
      user_id: userId,
      title: title.trim(),
      description: description.trim(),
      // The first pick stays in the single column the feed and search filter
      // on; the whole set rides alongside it (migration 009).
      category: categories[0] ?? 'other',
      categories,
      condition,
      wants_in_return: wantsColumn,
      images,
      photo_meta: photoMeta,
      location_city: city,
      status: 'active',
      expires_at: expires.toISOString(),
    })

    setPublishing(false)

    if (error) {
      console.error('[add] insert failed', error)
      setPublishError(true)
      return
    }

    // Profile reads the listing straight back, and the feed excludes your own
    // items — refetch both rather than showing a stale "nothing here yet".
    // The PREFIX, deliberately: keys.myItems now ends in a scope ('active'
    // or 'all'), and a new listing has to refresh both -- the offer pickers
    // and the My Items grid. invalidateQueries matches by prefix, so dropping
    // the scope catches every variant.
    await queryClient.invalidateQueries({ queryKey: ['my-items', userId] })

    // The wireframe shows the moderation outcome rather than dropping the
    // person back on Profile to guess. Read the status the row actually
    // landed with: today everything defaults to 'ok', and when the photo
    // check ships some listings will come back 'held' instead. Showing it
    // now means that day changes nothing in this file.
    const row = Array.isArray(inserted) ? inserted[0] : inserted
    // Kept so the boost prompt below knows WHICH find to boost. The bigint,
    // because spend_points_on_perk('boost', subject) checks ownership against
    // items.id.
    setPublishedId(
      (row as Record<string, unknown> | null)?.id != null
        ? String((row as Record<string, unknown>).id)
        : null,
    )
    setPublished(
      String((row as Record<string, unknown> | null)?.moderation_status ?? 'ok') === 'held'
        ? 'held'
        : 'ok',
    )
  }

  return {
    /** Step back through the flow, and out of it from the first step. Losing a
     *  half-filled listing to a stray tap is worse than one extra tap. */
    goBack: () => (step > 0 ? setStep((v) => v - 1) : navigate(-1)),
    steps: ADD_STEPS,
    step,
    stepId: ADD_STEPS[step].id,
    // Gated: advancing past an incomplete step is what let an untitled find
    // reach the photo upload, and then production.
    next: () => {
      if (!canAdvance) return
      setStep((s) => Math.min(s + 1, ADD_STEPS.length - 1))
    },
    canAdvance,
    canPublish,
    detailsComplete,
    back: () => setStep((s) => Math.max(s - 1, 0)),
    isFirst: step === 0,
    isLast: step === ADD_STEPS.length - 1,
    photos,
    makeCover: ph.makeCover,
    addPhoto: ph.addPhoto,
    retryPhoto: ph.retryPhoto,
    removePhoto: ph.removePhoto,
    hasPhoto,
    uploading,
    fileInputRef: ph.fileInputRef,
    onFilePicked: ph.onFilePicked,
    title,
    setTitle,
    description,
    setDescription,
    categories,
    toggleCategory,
    condition,
    setCondition,
    wants,
    toggleWant,
    wantsNote,
    setWantsNote,
    capped,
    setCapped,
    publishing,
    publishError,
    publish,
    published,
    /** Boost the find just listed -- the tier sheet's "Get seen 10x faster",
     *  fired at the one moment a seller most wants it. Spends points through
     *  the same RPC the Rewards screen uses, so there is one spend path. */
    boostPrice: PERK_PRICES.boost,
    onBoost: publishedId
      ? async () => {
          if (boosting) return
          setBoosting(true)
          const { error: e } = await spendOnPerk('boost', publishedId)
          setBoosting(false)
          if (e) {
            toast.error(t(pointsErrorKey(e)))
            return
          }
          toast.success(t('add.boostDone'))
        }
      : undefined,
    /** Where "done" goes.
     *
     *  Straight back to the find you were trying to offer on, when you got
     *  here from the offer sheet with nothing to trade. Landing on Profile
     *  instead meant the item you wanted was simply gone, and the deck may
     *  never show it again -- so the whole reason you listed something was
     *  lost at the last step. */
    goToItems: () => navigate(offerOn ? '/discover' : '/items'),
    publishedId,
    listAnother: () => window.location.reload(),
    cancel: () => navigate(-1),
  }
}
