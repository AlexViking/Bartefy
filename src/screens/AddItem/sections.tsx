import * as React from 'react'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Field, TextField } from '@/components/ui/field'
import { Icon } from '@/components/ui/icon'
import { PhotoWell } from '@/components/ui/photo-well'
import { T, useT } from '@/i18n/T'
import { getLedger, PAID_LISTINGS_PER_MONTH } from '@/lib/points'
import { CATEGORIES, CONDITIONS } from '@/lib/taxonomy'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import type { useAddItem } from './useAddItem'

type Add = ReturnType<typeof useAddItem>

/** Add a find, proposal B (approved 2026-09-30). Sections shared by the
 *  desktop page (all at once) and the phone's three steps. */

const PILL =
  'inline-flex h-9 items-center rounded-pill px-3.5 font-body text-label-md ring-1 ring-inset transition-colors duration-fast ease-brand ' +
  'aria-pressed:bg-selected aria-pressed:text-selected-foreground aria-pressed:ring-primary/40'
const PILL_IDLE = 'bg-card text-muted-foreground ring-input hover:bg-background'

/** "Show it. One photo is enough to start." The first photo is the cover --
 *  large, marked; every other photo can be made the cover. */
export function PhotosSection({ a }: { a: Add }) {
  const { t } = useT()
  const ready = a.photos.filter((p) => p.state !== 'empty')
  const empty = a.photos.findIndex((p) => p.state === 'empty')

  const tile = (i: number, cover: boolean) => {
    const p = a.photos[i]
    if (p.state !== 'ready') {
      return (
        <PhotoWell
          key={i}
          state={p.state}
          src={p.previewUrl}
          progress={p.progress}
          swatch={p.swatch}
          onPick={() => a.addPhoto(i)}
          onRetry={() => a.retryPhoto(i)}
          onRemove={() => a.removePhoto(i)}
          className={cn('w-full rounded-card', cover ? 'aspect-[4/3]' : 'aspect-square')}
        />
      )
    }
    return (
      <div key={i} className={cn('relative w-full overflow-hidden rounded-card bg-secondary', cover ? 'aspect-[4/3]' : 'aspect-square')}>
        <img alt="" className="size-full object-cover" src={p.previewUrl ?? p.url} />
        <button
          type="button"
          onClick={() => a.removePhoto(i)}
          aria-label={t('add.removePhoto')}
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-pill bg-black/55 text-white hover:bg-black/70"
        >
          <Icon name="X" size={16} />
        </button>
        {cover ? (
          <span className="absolute left-3 top-3 inline-flex h-6 items-center rounded-pill bg-white/95 px-2 text-[11px] font-bold text-ink">
            <T as="span" k="add.cover" />
          </span>
        ) : (
          <button
            type="button"
            onClick={() => a.makeCover(i)}
            disabled={a.uploading}
            className="absolute bottom-2 left-2 inline-flex h-8 items-center gap-1.5 rounded-pill bg-white/95 px-2.5 text-[12px] font-bold text-ink shadow disabled:opacity-60"
          >
            <Icon name="Star" size={14} />
            <T as="span" k="add.makeCover" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <T as="p" k="add.showIt" className="font-body text-body-lg text-foreground" />
        <T as="p" k="add.photoStepHelp" className="font-body text-body-sm text-muted-foreground" />
      </div>
      {/* The one real file input. `capture` is deliberately not set, so a
          phone offers both the camera and the library. */}
      <input
        ref={a.fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => a.onFilePicked(e.target.files?.[0])}
      />
      {ready.length === 0 ? (
        <button
          type="button"
          onClick={() => a.addPhoto(0)}
          className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-input text-muted-foreground hover:bg-background"
        >
          <Icon name="Camera" size={32} />
          <T as="span" k="add.addPhoto" className="font-body text-label-lg text-foreground" />
        </button>
      ) : (
        <>
          {tile(0, true)}
          <div className="grid grid-cols-2 gap-3">
            {a.photos.map((p, i) => (i === 0 || p.state === 'empty' ? null : tile(i, false)))}
            {empty > 0 && (
              <button
                type="button"
                onClick={() => a.addPhoto(empty)}
                className="flex aspect-square w-full flex-col items-center justify-center gap-1.5 rounded-card border-2 border-dashed border-input text-muted-foreground hover:bg-background"
              >
                <Icon name="Plus" size={24} />
                <T as="span" k="add.addAnother" className="font-body text-label-md" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function DetailsSection({ a, wide }: { a: Add; wide: boolean }) {
  const { t } = useT()
  return (
    <div className="flex flex-col gap-6">
      <Field label="add.nameIt" placeholder="add.titlePlaceholder" value={a.title} onChange={(e) => a.setTitle(e.target.value)} />
      <TextField
        label="add.storyOptional"
        help="add.optional"
        placeholder="add.descriptionPlaceholder"
        value={a.description}
        onChange={(e) => a.setDescription(e.target.value)}
      />

      <div className="flex flex-col gap-2">
        <T as="p" k="add.categoryLabel" className="font-body text-body-lg text-foreground" />
        <T as="p" k="add.categoryHelp" className="font-body text-body-sm text-muted-foreground" />
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={a.categories.includes(c.id)}
              onClick={() => a.toggleCategory(c.id)}
              className={cn(PILL, !a.categories.includes(c.id) && PILL_IDLE)}
            >
              {t(c.label)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <T as="p" k="add.conditionLabel" className="font-body text-body-lg text-foreground" />
        <div className={cn('grid gap-2.5', wide ? 'grid-cols-3' : 'grid-cols-1')}>
          {[...CONDITIONS].reverse().map((c) => {
            const on = a.condition === c.value
            return (
              <button
                key={c.value}
                type="button"
                aria-pressed={on}
                onClick={() => a.setCondition(c.value)}
                className={cn(
                  'rounded-card px-3.5 py-3 text-left ring-1 ring-inset transition-colors duration-fast ease-brand',
                  on ? 'bg-selected ring-2 ring-primary' : 'bg-card ring-input hover:bg-background',
                )}
              >
                <span className={cn('block font-body text-label-lg', on ? 'text-selected-foreground' : 'text-foreground')}>{t(c.label)}</span>
                <span className="mt-0.5 block font-body text-[12px] leading-4 text-muted-foreground">{t(c.help)}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** What you would like in return: directions, not a shopping list -- the
 *  categories feed "Your X fits" on other people's cards. */
export function WantsSection({ a }: { a: Add }) {
  const { t } = useT()
  return (
    <div className="flex flex-col gap-3">
      <div>
        <T as="p" k="add.wantsHeading" className="font-body text-body-lg text-foreground" />
        <T as="p" k="add.wantsHelp" className="font-body text-body-sm text-muted-foreground" />
      </div>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={a.wants.includes(c.id)}
            onClick={() => a.toggleWant(c.id)}
            className={cn(PILL, !a.wants.includes(c.id) && PILL_IDLE)}
          >
            {t(c.label)}
          </button>
        ))}
      </div>
      {a.wants.length === 0 && (
        <p className="rounded-card bg-background px-3.5 py-2.5 font-body text-body-sm text-muted-foreground">
          <b className="text-foreground">{t('add.wantsAnything')}</b> {t('add.wantsAnythingHelp')}
        </p>
      )}
      <TextField
        label="add.wantsNoteLabel"
        help="add.optional"
        placeholder="add.wantsNotePlaceholder"
        value={a.wantsNote}
        onChange={(e) => a.setWantsNote(e.target.value)}
      />
    </div>
  )
}

/** "It's on the table" -- or held for a look. Points are shown only when the
 *  ledger says they were paid: the first ten listings a month earn them. */
export function PublishedSection({ a }: { a: Add }) {
  const { t } = useT()
  const userId = useAuthStore((s) => s.session?.user?.id)
  const held = a.published === 'held'
  const cover = a.photos.find((p) => p.state === 'ready')

  const { data: paid } = useQuery({
    queryKey: ['points', 'listing-paid', a.publishedId ?? ''],
    queryFn: async () => {
      const { data, error } = await getLedger(userId!, 50)
      if (error) throw error
      const rows = (data ?? []) as { reason: string; subject: string | null; delta: number; created_at: string }[]
      const mine = rows.find((r) => r.reason === 'list_find' && r.subject === a.publishedId)
      const month = new Date().toISOString().slice(0, 7)
      const count = rows.filter((r) => r.reason === 'list_find' && r.created_at.startsWith(month)).length
      return mine ? { delta: mine.delta, count } : null
    },
    enabled: !!userId && !!a.publishedId && !held,
    // The award is written by a trigger in the same transaction as the
    // insert, so it is there on the first read.
    staleTime: Infinity,
  })

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
      {cover?.previewUrl || cover?.url ? (
        <img alt="" className="size-40 rounded-2xl object-cover shadow-md" src={cover.previewUrl ?? cover.url} />
      ) : (
        <span className="grid size-16 place-items-center rounded-pill bg-selected text-primary">
          <Icon name={held ? 'Clock' : 'Check'} size={28} />
        </span>
      )}
      <T as="h2" k={held ? 'add.heldTitle' : 'add.publishedTitle'} className="font-display text-[32px] font-bold leading-10 text-foreground" />
      <T as="p" k={held ? 'add.heldBody' : 'add.publishedBody'} className="max-w-[44ch] font-body text-body-md text-muted-foreground" />
      {paid && (
        <span className="inline-flex h-8 items-center gap-1.5 rounded-pill bg-mint px-3 font-body text-label-md text-forest">
          <Icon name="Coins" size={16} />
          {t('add.earned', { n: paid.delta, count: Math.min(paid.count, PAID_LISTINGS_PER_MONTH), max: PAID_LISTINGS_PER_MONTH })}
        </span>
      )}
      {!held && a.onBoost && (
        <div className="flex w-full max-w-[420px] items-center gap-3 rounded-card p-4 text-left ring-1 ring-input">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-sun text-ink">
            <Icon name="Zap" size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <T as="span" k="add.boostTitle" className="block font-body text-label-lg text-foreground" />
            <T as="span" k="add.boostBody" className="block font-body text-[12px] leading-4 text-muted-foreground" />
          </span>
          <Button variant="ghost" size="sm" onClick={a.onBoost}>
            {t('add.boostAction', { price: a.boostPrice })}
          </Button>
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <Button variant="ghost" onClick={a.listAnother}>
          <Icon name="Plus" size={18} />
          <T as="span" k="add.listAnother" />
        </Button>
        <Button onClick={a.goToItems}>
          <T as="span" k="add.seeMyItems" />
        </Button>
      </div>
    </div>
  )
}

/** Whatever the form still needs, named -- not a greyed button to guess at. */
export function useMissing(a: Add) {
  if (!a.hasPhoto) return 'add.needPhoto'
  if (a.uploading) return 'add.needUpload'
  if (!a.title.trim()) return 'add.needName'
  return null
}

export const PageTitle = React.memo(function PageTitle() {
  return <T as="h1" k="add.title" className="shrink-0 font-display text-headline-md text-foreground" />
})
