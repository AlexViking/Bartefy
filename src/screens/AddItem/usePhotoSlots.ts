import { useCallback, useRef, useState } from 'react'

import type { PhotoState } from '@/components/ui/photo-well'
import { getR2UploadUrls } from '@/lib/api'
import { toWebP } from '@/lib/images'

export interface PhotoSlot {
  state: PhotoState
  swatch?: string
  /** Object URL for the local preview, shown while the upload is in flight
   *  and after it lands — the R2 object is not readable back immediately. */
  previewUrl?: string
  /** Public R2 URL, set once the PUT succeeds (or the photo was already on
   *  the find). Only slots that have one are written to items.images. */
  url?: string
  /** Encoded pixel dimensions, from toWebP. Written to items.photo_meta so a
   *  grid can reserve the right box before the photo loads. */
  width?: number
  height?: number
  progress?: number
  /** Minted once per photo and reused on retry, so a retry overwrites the
   *  same key rather than duplicating it — see the upload invariant. */
  uploadId?: string
  /** Kept so retry can re-encode without asking the user to pick again. */
  file?: File
}

/** A photo already on a find: its R2 URL and, when stored, its size. */
export interface ExistingPhoto {
  url: string
  w?: number | null
  h?: number | null
}

const startFrom = (initial: ExistingPhoto[]): PhotoSlot[] => [
  ...initial.map((p) => ({ state: 'ready' as const, url: p.url, width: p.w ?? undefined, height: p.h ?? undefined })),
  // Always one empty slot to tap.
  { state: 'empty' as const },
]

/** The photos of one listing: pick, encode in the browser, PUT straight to R2,
 *  retry, remove, make cover. Shared by Add a find and Edit (My finds), so
 *  both go through the one upload path -- the 400 KB ceiling, the real blob
 *  type, and the uploadId minted once per photo.
 *
 *  `onCapped` fires on a 402 from the upload-URL function: the listing cap,
 *  which is the upgrade sheet's job rather than a failed photo. */
export function usePhotoSlots({ initial = [], onCapped }: { initial?: ExistingPhoto[]; onCapped?: () => void } = {}) {
  const [photos, setPhotos] = useState<PhotoSlot[]>(() => startFrom(initial))
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
        const { blob, width, height } = await toWebP(file)
        patchSlot(index, { progress: 0.4 })

        const { data, error } = await getR2UploadUrls([uploadId])
        if (error) throw error

        const target = (data?.urls ?? []).find((u: { uploadId: string }) => u.uploadId === uploadId)
        if (!target) throw new Error('no upload url returned')
        patchSlot(index, { progress: 0.6 })

        const res = await fetch(target.uploadUrl, {
          method: 'PUT',
          body: blob,
          // The blob's own type, not a hardcoded one. toWebP falls back to
          // JPEG where WebP encoding is unavailable, and declaring webp for a
          // JPEG makes R2 serve it with the wrong content type.
          headers: { 'Content-Type': blob.type || 'image/webp' },
        })
        if (!res.ok) throw new Error(`upload failed: ${res.status}`)

        patchSlot(index, { state: 'ready', progress: 1, url: target.publicUrl, width, height })
      } catch (err) {
        // FunctionsHttpError carries the response on `context`, so read the
        // status from either shape.
        const e = err as { context?: { status?: number; clone?: () => Response }; status?: number }
        const status = e?.context?.status ?? e?.status
        // Without a cap handler (the Edit sheet) a 402 falls through to a
        // failed photo with Retry -- never a slot that silently empties.
        if (status === 402 && onCapped) {
          onCapped()
          patchSlot(index, { state: 'empty', progress: 0 })
          return
        }
        // FunctionsHttpError never reads the body, so the function's own
        // message is otherwise lost and every cause looks identical.
        let detail = ''
        try {
          const body = e?.context?.clone?.()
          if (body) detail = await body.text()
        } catch {
          /* the body is optional; the status above is the part that matters */
        }
        console.error('[photos] upload failed', { status, detail, err })
        patchSlot(index, { state: 'failed', progress: 0 })
      }
    },
    [patchSlot, onCapped],
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

  /** "Make cover": move a photo to the front -- the first image is the card
   *  in every deck. Only while nothing is uploading: uploads report back by
   *  slot INDEX, and reordering under one would land its URL on the wrong
   *  photo. */
  const makeCover = (i: number) => {
    if (uploading || i <= 0) return
    setPhotos((ps) => {
      const slot = ps[i]
      if (!slot || slot.state !== 'ready') return ps
      return [slot, ...ps.filter((_, x) => x !== i)]
    })
  }

  /** Start again from these photos (the edit sheet re-opening). */
  const reset = useCallback((next: ExistingPhoto[]) => setPhotos(startFrom(next)), [])

  /** What to write: the ready photos' URLs, and their sizes in the same order. */
  const ready = photos.filter((p) => p.state === 'ready' && p.url)
  const images = ready.map((p) => p.url as string)
  const photoMeta = ready.map((p) => ({ w: p.width ?? null, h: p.height ?? null }))

  return {
    photos,
    hasPhoto,
    uploading,
    fileInputRef,
    addPhoto,
    onFilePicked,
    retryPhoto,
    removePhoto,
    makeCover,
    reset,
    images,
    photoMeta,
  }
}

export type PhotoSlots = ReturnType<typeof usePhotoSlots>
