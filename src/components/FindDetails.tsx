import * as React from 'react'
import { useQuery } from '@tanstack/react-query'

import { Icon } from '@/components/ui/icon'
import { PhotoViewer } from '@/components/ui/photo-viewer'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { T, useT } from '@/i18n/T'
import { useIsDesktop } from '@/lib/platform'
import { categoryLabel, conditionAt, splitWants } from '@/lib/taxonomy'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type Row = Record<string, unknown>

/** One find, whole: every photo and what the listing says.
 *
 *  Item detail was cut in V6 -- the deck card carries a find's details, and a
 *  name never leads to someone's other finds. It comes back for exactly one
 *  place: the two finds of a swap you are in, from its chat (Alex,
 *  2026-10-02), so the people talking can look at what they are trading.
 *
 *  Read straight from items: 038 lets the two people in a match (or a pending
 *  offer) read both finds even once they are reserved. */
export function useFind(itemId: string | undefined) {
  return useQuery({
    queryKey: ['find', itemId ?? ''],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('id, title, description, images, category, categories, condition, wants_in_return, location_city, created_at, status')
        .eq('id', itemId!)
        .maybeSingle()
      if (error) throw error
      return (data ?? null) as Row | null
    },
    enabled: !!itemId,
    staleTime: 60_000,
  })
}

export function FindDetails({ itemId, owner, mine = false, wide = false }: { itemId?: string; owner: string; mine?: boolean; wide?: boolean }) {
  const { t, lang } = useT()
  const { data: it, isLoading, isError } = useFind(itemId)
  const [photo, setPhoto] = React.useState(0)
  const [full, setFull] = React.useState(false)

  if (isLoading) return <T as="p" k="common.loading" className="py-8 text-center font-body text-body-sm text-muted-foreground" />
  // A find RLS will not show reads as null, not as an error -- say so either way.
  if (isError || !it) return <T as="p" k="findDetails.unavailable" className="py-8 text-center font-body text-body-sm text-muted-foreground" />

  const photos = Array.isArray(it.images) ? (it.images as unknown[]).map(String) : []
  const cats = Array.isArray(it.categories) && it.categories.length ? (it.categories as string[]) : [String(it.category ?? 'other')]
  const wants = splitWants(it.wants_in_return)
  const wantCats = wants.categories.map((c) => t(categoryLabel(c)))
  const listed = it.created_at ? new Date(String(it.created_at)).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' }) : ''
  const chip = (text: string) => (
    <span key={text} className="inline-flex h-7 items-center rounded-pill bg-secondary px-2.5 text-[12px] font-semibold text-muted-foreground">
      {text}
    </span>
  )

  return (
    // Wide (desktop dialog): photos left, the words right -- everything in
    // view at once. Narrow (phone sheet): one column.
    <div className={cn(wide ? 'grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start gap-6' : 'flex flex-col gap-5')}>
      {/* Photos: the big one, then every other as a thumbnail. Tap for full screen. */}
      <div className="flex flex-col gap-2">
        {photos.length ? (
          <button
            type="button"
            onClick={() => setFull(true)}
            aria-label={t('deck.fullScreen')}
            className="relative block aspect-[4/3] w-full overflow-hidden rounded-card bg-secondary"
          >
            <img alt="" src={photos[photo]} className="size-full object-cover" />
            <span className="absolute right-3 top-3 grid size-9 place-items-center rounded-pill bg-black/45 text-white backdrop-blur">
              <Icon name="Maximize2" size={18} />
            </span>
            {photos.length > 1 && (
              <span className="absolute bottom-3 right-3 rounded-pill bg-black/55 px-2 py-0.5 text-[12px] font-semibold text-white">
                {photo + 1} / {photos.length}
              </span>
            )}
          </button>
        ) : (
          <span className="grid aspect-[4/3] w-full place-items-center rounded-card bg-secondary text-muted-foreground">
            <Icon name="ImagePlus" size={32} />
          </span>
        )}
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {photos.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setPhoto(i)}
                aria-label={t('findDetails.photoN', { n: i + 1 })}
                aria-current={i === photo}
                className={cn('size-16 shrink-0 overflow-hidden rounded-lg ring-2 transition', i === photo ? 'ring-primary' : 'ring-transparent opacity-80 hover:opacity-100')}
              >
                <img alt="" src={src} className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          {chip(t(conditionAt(Number(it.condition)).label))}
          {cats.map((c) => chip(t(categoryLabel(c))))}
        </div>
        {/* The owner's own words and place: user data. */}
        <h3 className="font-display text-[24px] font-bold leading-8 text-foreground">{String(it.title ?? '')}</h3>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[13px] text-muted-foreground">
          {it.location_city ? (
            <span className="inline-flex items-center gap-1">
              <Icon name="Navigation" size={16} />
              {String(it.location_city)}
            </span>
          ) : null}
          {listed && <span>{t('findDetails.listed', { date: listed })}</span>}
        </p>
      </div>

      <section>
        <p className="mb-1 font-body text-label-sm uppercase tracking-wider text-muted-foreground">
          {mine ? t('findDetails.youWant') : t('deck.wantsOf', { name: owner })}
        </p>
        {wants.note && <p className="font-body text-body-md text-foreground">{wants.note}</p>}
        {wantCats.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{wantCats.map((c) => chip(c))}</div>}
        {!wants.note && wantCats.length === 0 && (
          <p className="font-body text-body-md text-muted-foreground">{mine ? t('findDetails.youAnything') : t('deck.wantsAnything', { name: owner })}</p>
        )}
      </section>

      <section>
        <T as="p" k="deck.about" className="mb-1 font-body text-label-sm uppercase tracking-wider text-muted-foreground" />
        <p className="whitespace-pre-line font-body text-body-md text-foreground">{String(it.description ?? '') || t('deck.noStory')}</p>
      </section>
      </div>

      <PhotoViewer open={full} photos={photos} index={photo} onIndexChange={setPhoto} onClose={() => setFull(false)} title={String(it.title ?? '')} />
    </div>
  )
}

/** Find details in a sheet: from the right on desktop, from the bottom on a phone. */
export function FindDetailsSheet({
  open,
  onOpenChange,
  itemId,
  owner,
  mine = false,
  label,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemId?: string
  /** Whose find, by first name ("Nino wants"). */
  owner: string
  /** Your own find: "You want in return". */
  mine?: boolean
  /** "You give" / "You get". */
  label: string
}) {
  const desktop = useIsDesktop()
  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange} title="findDetails.title" titleValues={{ label }} className={desktop ? 'max-w-[920px]' : undefined}>
      <FindDetails itemId={itemId} owner={owner} mine={mine} wide={desktop} />
    </ResponsiveSheet>
  )
}
