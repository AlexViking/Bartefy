import { useState } from 'react'
import { useNavigate } from 'react-router'

import type { PhotoState } from '@/components/ui/photo-well'
import { useMembershipStore } from '@/store/membership'

export const ADD_CATEGORIES = ['Cameras', 'Books', 'Clothing', 'Curiosities', 'Vinyl', 'Kitchen']
export const ADD_CONDITIONS = ['Like new', 'Good', 'Well loved', 'Needs a fix']
export const ADD_WANTS = ['Film lenses', 'Vinyl', 'Anything wool', 'Books', 'Plants', 'Surprise me']

export const ADD_STEPS = [
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
  const can = useMembershipStore((s) => s.can)

  const [step, setStep] = useState(0)
  const [photos, setPhotos] = useState<{ state: PhotoState; swatch?: string }[]>([{ state: 'empty' }])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [condition, setCondition] = useState<string | null>(null)
  const [wants, setWants] = useState<string[]>([])
  const [capped, setCapped] = useState(false)

  const hasPhoto = photos.some((p) => p.state === 'ready')

  const addPhoto = () => {
    // TODO(api): pick file, getR2UploadUrls, then flip state ready/failed.
    // The uploadId is minted once per photo so a retry overwrites rather than
    // duplicating — see the upload invariant in CLAUDE.md.
    setPhotos((p) => [
      ...p.slice(0, -1),
      { state: 'ready', swatch: 'hsl(var(--illo-terracotta))' },
      { state: 'empty' },
    ])
  }

  const removePhoto = (i: number) => setPhotos((ps) => ps.filter((_, x) => x !== i))

  const toggleWant = (w: string) =>
    setWants((f) => (f.includes(w) ? f.filter((x) => x !== w) : [...f, w]))

  const publish = () => {
    if (!can('add_find')) return setCapped(true)
    // TODO(api): insertItem({ ... })
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
    removePhoto,
    hasPhoto,
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
    publish,
    cancel: () => navigate(-1),
  }
}
