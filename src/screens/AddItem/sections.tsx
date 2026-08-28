import { Chip } from '@/components/ui/tone-badge'
import { Field, TextField } from '@/components/ui/field'
import { PhotoWell, PhotoWellGrid } from '@/components/ui/photo-well'
import { LabelWithHint } from '@/components/guidance/InfoHint'
import { T } from '@/i18n/T'
import { ADD_CATEGORIES, ADD_CONDITIONS, ADD_WANTS, type useAddItem } from './useAddItem'

/** The three sections of the form, shared by both layouts. Mobile shows one
 *  at a time as a wizard; desktop shows all three at once in two columns.
 */

export function PhotosSection({ a, columns = 3 }: { a: ReturnType<typeof useAddItem>; columns?: 2 | 3 }) {
  return (
    <div className="flex flex-col gap-4">
      <LabelWithHint label="add.photosTitle" hint="help.whyCondition" />
      <PhotoWellGrid columns={columns}>
        {a.photos.map((p, i) => (
          <PhotoWell
            key={i}
            state={p.state}
            swatch={p.swatch}
            onPick={a.addPhoto}
            onRetry={a.addPhoto}
            onRemove={() => a.removePhoto(i)}
          />
        ))}
      </PhotoWellGrid>
      <T as="p" k="add.photoStepHelp" className="font-body text-sm text-muted-foreground" />
    </div>
  )
}

export function DetailsSection({ a }: { a: ReturnType<typeof useAddItem> }) {
  return (
    <div className="flex flex-col gap-4">
      <Field
        label="add.nameIt"
        placeholder="add.titlePlaceholder"
        value={a.title}
        onChange={(e) => a.setTitle(e.target.value)}
      />
      <TextField
        label="add.storyOptional"
        help="add.photosHelp"
        placeholder="add.descriptionPlaceholder"
        value={a.description}
        onChange={(e) => a.setDescription(e.target.value)}
      />

      <div className="flex flex-col gap-2">
        <T as="span" k="add.categoryLabel" className="font-display text-[15px] font-semibold text-foreground" />
        <div className="flex flex-wrap gap-2">
          {ADD_CATEGORIES.map((c) => (
            <Chip key={c} active={a.category === c} onClick={() => a.setCategory(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <LabelWithHint label="add.conditionLabel" hint="help.whyCondition" />
        <div className="flex flex-wrap gap-2">
          {ADD_CONDITIONS.map((c) => (
            <Chip key={c} active={a.condition === c} onClick={() => a.setCondition(c)}>
              {c}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  )
}

export function WantsSection({ a }: { a: ReturnType<typeof useAddItem> }) {
  return (
    <div className="flex flex-col gap-3">
      <LabelWithHint label="add.wantsLabel" hint="help.whyWants" />
      <T as="p" k="add.wantsHelp" className="font-body text-sm text-muted-foreground" />
      <div className="flex flex-wrap gap-2">
        {ADD_WANTS.map((w) => (
          <Chip key={w} active={a.wants.includes(w)} onClick={() => a.toggleWant(w)}>
            {w}
          </Chip>
        ))}
      </div>
    </div>
  )
}
