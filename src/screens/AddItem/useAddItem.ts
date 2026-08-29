import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'

import type { PhotoState } from '@/components/ui/photo-well'
import { keys } from '@/lib/cache/queryClient'
import { getR2UploadUrls, insertItem } from '@/lib/api'
import { toWebP } from '@/lib/images'
import { DEFAULT_CONDITION, WANT_NOTE_PREFIX } from '@/lib/taxonomy'
import { useAuthStore } from '@/store/auth'
import { useMembershipStore } from '@/store/membership'
import { useOnboardingStore } from '@/store/onboarding'


/** items.expires_at is NOT NULL with no default — an insert that omits it is
 *  rejected outright, and get_feed hides anything already expired. */
const LISTING_DAYS = 30

export const ADD_STEPS = [
  // Details first, deliberately. Photos used to be step 0, so an upload could
  // start — and R2 storage be spent, and the listing cap counted against — for
  // a find that had no title yet. One live item reached production with a
  // photo and an empty title exactly that way. Describing the thing is cheap
  // and local; uploading is neither, so it comes second.
  { id: 'details', label: 'add.stepDetails' },
  { id: 'photos', label: 'add.stepPhotos' },
  { id: 'wants', label: 'add.stepWants' },
] as const

interface PhotoSlot {
  state: PhotoState
  swatch?: string
  /** Object URL for the local preview, shown while the upload is in flight
   *  and after it lands — the R2 object is not readable back immediately. */
  previewUrl?: string
  /** Public R2 URL, set once the PUT succeeds. Only slots that have one are
   *  written to items.images. */
  url?: string
  progress?: number
  /** Minted once per photo and reused on retry, so a retry overwrites the
   *  same key rather than duplicating it — see the upload invariant. */
  uploadId?: string
  /** Kept so retry can re-encode without asking the user to pick again. */
  file?: File
}

/** Listing a find, with no layout in it.
 *
 *  Only a photo is required. Everything else — title, story, category,
 *  condition, wants — is optional, because the fastest way to get someone's
 *  first find on the table is to ask for almost nothing.
 */
export function useAddItem() {
  const navigate = useNavigate()
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
  const [photos, setPhotos] = useState<PhotoSlot[]>([{ state: 'empty' }])
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
  const [publishError, setPublishError] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  /** Which slot the open file dialog is filling. */
  const pickingFor = useRef<number>(0)

  const hasPhoto = photos.some((p) => p.state === 'ready')
  const uploading = photos.some((p) => p.state === 'uploading')

  /** What each step needs before it can be left.
   *
   *  A find with no title renders as a nameless row wherever it appears — in
   *  the inbox, in a swap pair, on the profile grid — and one such item is
   *  live in production. The rules are enforced here rather than only on the
   *  publish button so the gap cannot be walked past in the first place.
   *
   *  Trimmed, so a title of spaces does not pass. */
  const detailsComplete =
    title.trim().length > 0 && description.trim().length > 0 && categories.length > 0

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

  const patchSlot = useCallback((index: number, patch: Partial<PhotoSlot>) => {
    setPhotos((ps) => ps.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }, [])

  /** Encode, mint an upload URL, PUT it to R2. One photo, start to finish. */
  const uploadInto = useCallback(
    async (index: number, file: File, existingUploadId?: string) => {
      const uploadId = existingUploadId ?? crypto.randomUUID()
      const previewUrl = URL.createObjectURL(file)

      patchSlot(index, { state: 'uploading', progress: 0.1, uploadId, file, previewUrl })

      try {
        const blob = await toWebP(file)
        patchSlot(index, { progress: 0.4 })

        const { data, error } = await getR2UploadUrls([uploadId])
        if (error) throw error

        const target = (data?.urls ?? []).find(
          (u: { uploadId: string }) => u.uploadId === uploadId,
        )
        if (!target) throw new Error('no upload url returned')
        patchSlot(index, { progress: 0.6 })

        const res = await fetch(target.uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: { 'Content-Type': 'image/webp' },
        })
        if (!res.ok) throw new Error(`upload failed: ${res.status}`)

        patchSlot(index, { state: 'ready', progress: 1, url: target.publicUrl })
      } catch (err) {
        // 402 means the listing cap was hit — that is the upgrade sheet's
        // job, not a failed photo. FunctionsHttpError carries the response on
        // `context`, so read the status from either shape.
        const e = err as {
          context?: { status?: number; clone?: () => Response }
          status?: number
        }
        const status = e?.context?.status ?? e?.status
        if (status === 402) {
          setCapped(true)
          patchSlot(index, { state: 'empty', progress: 0 })
          return
        }
        // FunctionsHttpError carries the Response on `context` but never
        // reads it, so the function's own message is otherwise lost and every
        // cause looks identical. Read it before giving up.
        let detail = ''
        try {
          const body = e?.context?.clone?.()
          if (body) detail = await body.text()
        } catch {
          /* the body is optional; the status below is the part that matters */
        }
        console.error('[add] photo upload failed', { status, detail, err })
        patchSlot(index, { state: 'failed', progress: 0 })
      }
    },
    [patchSlot],
  )

  /** Opens the file dialog. The actual work starts in onFilePicked. */
  const addPhoto = useCallback(
    (index?: number) => {
      pickingFor.current = index ?? photos.findIndex((p) => p.state === 'empty')
      if (pickingFor.current < 0) pickingFor.current = photos.length - 1
      fileInputRef.current?.click()
    },
    [photos],
  )

  const onFilePicked = useCallback(
    (file: File | undefined) => {
      // Clear the input so picking the same file twice still fires a change.
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (!file) return

      const index = pickingFor.current
      setPhotos((ps) => {
        // Keep exactly one trailing empty slot to tap.
        const next = [...ps]
        if (index === next.length - 1) next.push({ state: 'empty' })
        return next
      })
      void uploadInto(index, file)
    },
    [uploadInto],
  )

  const retryPhoto = useCallback(
    (index: number) => {
      const slot = photos[index]
      if (!slot?.file) return addPhoto(index)
      void uploadInto(index, slot.file, slot.uploadId)
    },
    [photos, uploadInto, addPhoto],
  )

  const removePhoto = (i: number) =>
    setPhotos((ps) => {
      const slot = ps[i]
      if (slot?.previewUrl) URL.revokeObjectURL(slot.previewUrl)
      const next = ps.filter((_, x) => x !== i)
      // There must always be an empty slot to add the next photo into.
      return next.some((p) => p.state === 'empty') ? next : [...next, { state: 'empty' }]
    })

  const toggleWant = (w: string) =>
    setWants((f) => (f.includes(w) ? f.filter((x) => x !== w) : [...f, w]))

  /** Order is meaningful: the first pick is the one stored in items.category,
   *  which is what the feed and search filter on. */
  const toggleCategory = (c: string) =>
    setCategories((f) => (f.includes(c) ? f.filter((x) => x !== c) : [...f, c]))

  const publish = async () => {
    if (!can('add_find')) return setCapped(true)
    if (!userId || publishing) return

    const images = photos.filter((p) => p.state === 'ready' && p.url).map((p) => p.url as string)
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

    const { error } = await insertItem({
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
    await queryClient.invalidateQueries({ queryKey: keys.myItems(userId) })
    navigate('/profile')
  }

  return {
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
    addPhoto,
    retryPhoto,
    removePhoto,
    hasPhoto,
    uploading,
    fileInputRef,
    onFilePicked,
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
    cancel: () => navigate(-1),
  }
}
