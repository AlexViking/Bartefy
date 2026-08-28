import { Chip } from '@/components/ui/tone-badge'
import { Field, TextField } from '@/components/ui/field'
import { PhotoWell, PhotoWellGrid } from '@/components/ui/photo-well'
import { LabelWithHint } from '@/components/guidance/InfoHint'
import { T, useT } from '@/i18n/T'
import { Slider } from '@/components/ui/slider'
import { CATEGORIES, CONDITIONS, conditionAt } from '@/lib/taxonomy'
import { type useAddItem } from './useAddItem'

/** The three sections of the form, shared by both layouts. Mobile shows one
 *  at a time as a wizard; desktop shows all three at once in two columns.
 */

export function PhotosSection({ a, columns = 3 }: { a: ReturnType<typeof useAddItem>; columns?: 2 | 3 }) {
  return (
    <div className="flex flex-col gap-4">
      <LabelWithHint label="add.photosTitle" hint="help.whyCondition" />
      {/* The one real file input. PhotoWell is the visible affordance; this
          stays off-screen and is opened by it. `capture` is deliberately not
          set, so phones offer the camera and the library both. */}
      <input
        ref={a.fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => a.onFilePicked(e.target.files?.[0])}
      />
      <PhotoWellGrid columns={columns}>
        {a.photos.map((p, i) => (
          <PhotoWell
            key={i}
            state={p.state}
            src={p.previewUrl}
            progress={p.progress}
            swatch={p.swatch}
            onPick={() => a.addPhoto(i)}
            onRetry={() => a.retryPhoto(i)}
            onRemove={() => a.removePhoto(i)}
          />
        ))}
      </PhotoWellGrid>
      <T as="p" k="add.photoStepHelp" className="font-body text-sm text-muted-foreground" />
    </div>
  )
}

export function DetailsSection({ a }: { a: ReturnType<typeof useAddItem> }) {
  const { t } = useT()
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
        <T
          as="span"
          k="add.categoryLabel"
          className="font-display text-[15px] font-semibold text-foreground"
        />
        <T as="p" k="add.categoryHelp" className="font-body text-sm text-muted-foreground" />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip key={c.id} active={a.category === c.id} onClick={() => a.setCategory(c.id)}>
              {t(c.label)}
            </Chip>
          ))}
        </div>
      </div>

      <ConditionPicker a={a} />
    </div>
  )
}

/** Condition is a five-point scale in the column, so it is a slider rather
 *  than chips: one gesture, and the ends read as a range instead of four
 *  unrelated options. The label under it names the chosen point, because a
 *  bare handle position tells nobody what "3" means.
 */
function ConditionPicker({ a }: { a: ReturnType<typeof useAddItem> }) {
  const { t } = useT()
  const current = conditionAt(a.condition)

  return (
    <div className="flex flex-col gap-2">
      <LabelWithHint label="add.conditionLabel" hint="help.whyCondition" />
      <Slider
        value={[a.condition]}
        onValueChange={([v]) => a.setCondition(v)}
        min={1}
        max={5}
        step={1}
        aria-label={t('add.conditionLabel')}
        className="my-2"
      />
      {/* The ends of the scale, so the handle position means something before
          it is moved. The chosen point is named below in full. */}
      <div className="flex items-baseline justify-between gap-3">
        <T as="span" k={CONDITIONS[0].label} className="font-body text-xs text-muted-foreground" />
        <T
          as="span"
          k={CONDITIONS[CONDITIONS.length - 1].label}
          className="font-body text-xs text-muted-foreground"
        />
      </div>
      <span data-i18n={current.label} className="font-display text-base font-semibold text-foreground">
        {t(current.label)}
      </span>
      <p data-i18n={current.help} className="font-body text-sm text-muted-foreground">
        {t(current.help)}
      </p>
    </div>
  )
}

/** Naming a specific item you want is a promise the market cannot keep —
 *  picking "PS4" does nothing when no PS4 is listed. So this asks for
 *  directions instead: categories you would trade toward, which
 *  get_item_detail can actually match your finds against, plus one free line
 *  for the specifics, which stays human and promises nothing.
 */
export function WantsSection({ a }: { a: ReturnType<typeof useAddItem> }) {
  const { t } = useT()
  const open = a.wants.length === 0

  return (
    <div className="flex flex-col gap-3">
      <LabelWithHint label="add.wantsHeading" hint="help.whyWants" />
      <T as="p" k="add.wantsHelp" className="font-body text-sm text-muted-foreground" />

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Chip key={c.id} active={a.wants.includes(c.id)} onClick={() => a.toggleWant(c.id)}>
            {t(c.label)}
          </Chip>
        ))}
      </div>

      {open && (
        <div className="rounded-sm border border-border/[0.14] bg-popover p-3">
          <T
            as="span"
            k="add.wantsAnything"
            className="block font-display text-[15px] font-semibold text-foreground"
          />
          <T
            as="span"
            k="add.wantsAnythingHelp"
            className="mt-0.5 block font-body text-sm text-muted-foreground"
          />
        </div>
      )}

      <TextField
        label="add.wantsNoteLabel"
        help="add.wantsNoteHelp"
        placeholder="add.wantsNotePlaceholder"
        value={a.wantsNote}
        onChange={(e) => a.setWantsNote(e.target.value)}
      />
    </div>
  )
}
