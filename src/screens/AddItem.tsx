import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AppShell } from '@/components/shell/AppShell'
import { T } from '@/i18n/T'
import { Button } from '@/components/ui/button'
import { Field, TextField } from '@/components/ui/field'
import { Chip } from '@/components/ui/badge'
import { PhotoWell, PhotoWellGrid, type PhotoState } from '@/components/ui/photo-well'
import { useMembershipStore } from '@/store/membership'
import { UpgradeSheet } from '@/components/membership/UpgradeSheet'

const CATEGORIES = ['Cameras', 'Books', 'Clothing', 'Curiosities', 'Vinyl', 'Kitchen']
const CONDITIONS = ['Like new', 'Good', 'Well loved', 'Needs a fix']

/** T4 - three steps: photo, what is it, what you would like for it.
 *  Camera first, typing last. Only the photo step is required.
 */
export function AddItem() {
  const navigate = useNavigate()
  const can = useMembershipStore((s) => s.can)
  const [step, setStep] = useState(1)
  const [photos, setPhotos] = useState<{ state: PhotoState; swatch?: string }[]>([{ state: 'empty' }])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [condition, setCondition] = useState<string | null>(null)
  const [wants, setWants] = useState<string[]>([])
  const [capped, setCapped] = useState(false)

  const hasPhoto = photos.some((p) => p.state === 'ready')

  const addPhoto = () => {
    // TODO(api): pick file, getR2UploadUrls, then flip state ready/failed
    setPhotos((p) => [
      ...p.slice(0, -1),
      { state: 'ready', swatch: 'hsl(var(--illo-terracotta))' },
      { state: 'empty' },
    ])
  }

  const finish = () => {
    if (!can('add_find')) return setCapped(true)
    // TODO(api): insertItem({ ... })
    navigate('/profile')
  }

  return (
    <AppShell hideNav>
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-5 px-4 py-6">
        <div className="flex flex-col gap-2.5">
          <div className="h-2 overflow-hidden rounded-pill bg-secondary">
            <div
              className="h-full rounded-pill bg-primary transition-[width] duration-med ease-brand"
              style={{ width: Math.round((step / 3) * 100) + '%' }}
            />
          </div>
          <span className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground">
            Step {step} of 3
          </span>
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h1 className="font-display text-2xl font-bold leading-tight lg:text-h2">
              Show it. One photo is enough to start.
            </h1>
            <PhotoWellGrid columns={3}>
              {photos.map((p, i) => (
                <PhotoWell
                  key={i}
                  state={p.state}
                  swatch={p.swatch}
                  onPick={addPhoto}
                  onRetry={addPhoto}
                  onRemove={() => setPhotos((ps) => ps.filter((_, x) => x !== i))}
                />
              ))}
            </PhotoWellGrid>
            <p className="font-body text-sm text-muted-foreground">
              Daylight, no styling needed. The worn bits are the point.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <T as="h1" k="add.titleLabel" className="font-display text-h2 leading-tight text-foreground" />
            <Field label="add.nameIt" placeholder="add.titlePlaceholder" value={title} onChange={(e) => setTitle(e.target.value)} />
            <TextField
              label="add.storyOptional"
              placeholder="add.descriptionPlaceholder"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex flex-col gap-2">
              <T as="span" k="add.categoryLabel" className="font-display text-sm font-semibold" />
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
                    {c}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <T as="span" k="add.conditionLabel" className="font-display text-sm font-semibold" />
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((c) => (
                  <Chip key={c} active={condition === c} onClick={() => setCondition(c)}>
                    {c}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h1 className="font-display text-2xl font-bold leading-tight lg:text-h2">
              What would you like for it?
            </h1>
            <p className="font-body text-[15px] text-muted-foreground">
              Rough is fine. This is what puts your find in front of the right people.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Film lenses', 'Vinyl', 'Anything wool', 'Books', 'Plants', 'Surprise me'].map((w) => (
                <Chip
                  key={w}
                  active={wants.includes(w)}
                  onClick={() => setWants((f) => (f.includes(w) ? f.filter((x) => x !== w) : [...f, w]))}
                >
                  {w}
                </Chip>
              ))}
            </div>
          </div>
        )}

        <div className="mt-2 flex flex-col gap-2 border-t border-border/[0.14] pt-4">
          {step < 3 ? (
            <Button size="lg" fullWidth disabled={step === 1 && !hasPhoto} onClick={() => setStep(step + 1)}>
              Continue
            </Button>
          ) : (
            <Button size="lg" fullWidth onClick={finish}>
              Put it in the hunt
            </Button>
          )}
          <Button variant="ghost" fullWidth onClick={() => (step === 1 ? navigate(-1) : setStep(step - 1))}>
            {step === 1 ? 'Not now' : 'Back'}
          </Button>
        </div>
      </div>

      <UpgradeSheet open={capped} onOpenChange={setCapped} moment="live_finds" />
    </AppShell>
  )
}
