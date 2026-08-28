import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'

import type { PhotoState } from '@/components/ui/photo-well'
import { keys } from '@/lib/cache/queryClient'
import { getR2UploadUrls, insertItem } from '@/lib/api'
import { toWebP } from '@/lib/images'
import { useAuthStore } from '@/store/auth'
import { useMembershipStore } from '@/store/membership'
import { useOnboardingStore } from '@/store/onboarding'

export const ADD_CATEGORIES = ['Cameras', 'Books', 'Clothing', 'Curiosities', 'Vinyl', 'Kitchen']
export const ADD_CONDITIONS = ['Like new', 'Good', 'Well loved', 'Needs a fix']
export const ADD_WANTS = ['Film lenses', 'Vinyl', 'Anything wool', 'Books', 'Plants', 'Surprise me']

/** items.condition is a smallint 1-5. The picker shows words, the column
 *  stores a number, and this is the only place the two are tied together. */
const CONDITION_VALUE: Record<string, number> = {
  'Like new': 5,
  Good: 4,
  'Well loved': 3,
  'Needs a fix': 2,
}

/** items.expires_at is NOT NULL with no default — an insert that omits it is
 *  rejected outright, and get_feed hides anything already expired. */
const LISTING_DAYS = 30

export const ADD_STEPS = [
  { id: 'photos', label: 'add.stepPhotos' },
  { id: 'details', label: 'add.stepDetails' },
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
  const [category, setCategory] = useState<string | null>(null)
  const [condition, setCondition] = useState<string | null>(null)
  const [wants, setWants] = useState<string[]>([])
  const [capped, setCapped] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  /** Which slot the open file dialog is filling. */
  const pickingFor = useRef<number>(0)

  const hasPhoto = photos.some((p) => p.state === 'ready')
  const uploading = photos.some((p) => p.state === 'uploading')

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
        // job, not a failed photo.
        const status = (err as { context?: { status?: number } })?.context?.status
        if (status === 402) {
          setCapped(true)
          patchSlot(index, { state: 'empty', progress: 0 })
          return
        }
        console.error('[add] photo upload failed', err)
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

  const publish = async () => {
    if (!can('add_find')) return setCapped(true)
    if (!userId || publishing) return

    const images = photos.filter((p) => p.state === 'ready' && p.url).map((p) => p.url as string)
    if (images.length === 0) return

    setPublishing(true)
    setPublishError(false)

    const expires = new Date()
    expires.setDate(expires.getDate() + LISTING_DAYS)

    const { error } = await insertItem({
      user_id: userId,
      title: title.trim(),
      description: description.trim(),
      category: category ?? '',
      condition: condition ? (CONDITION_VALUE[condition] ?? 3) : 3,
      wants_in_return: wants,
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
    next: () => setStep((s) => Math.min(s + 1, ADD_STEPS.length - 1)),
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
    category,
    setCategory,
    condition,
    setCondition,
    wants,
    toggleWant,
    capped,
    setCapped,
    publishing,
    publishError,
    publish,
    cancel: () => navigate(-1),
  }
}
