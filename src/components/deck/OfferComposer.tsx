import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Icon } from '@/components/ui/icon'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { T, useT } from '@/i18n/T'
import { useIsDesktop } from '@/lib/platform'
import { categoryId, categoryLabel, splitWants } from '@/lib/taxonomy'
import { cn } from '@/lib/utils'
import type { OfferOption } from '@/screens/Hunt/useHunt'
import type { CardItem } from '@/store/hunt'

/** Past this many finds the grid gets category chips (the mock's rule). */
const CHIPS_FROM = 12
const MULTI_MIN = 2
const MULTI_MAX = 4

/** offer_composer R1 -- "Put it on the table".
 *
 *  Under the locked rule a like IS an offer, so every Put on Table asks which
 *  of your finds you are putting up. Finds that fit what the owner listed come
 *  first; then everything, with category chips once there are more than 12.
 *
 *  Two switches at the foot (Alex, 2026-09-29): Super offer (50 pts, lands at
 *  the top of their offers) and "2-4 at once" (150 pts, they pick one). They
 *  combine the way the engine does: a multi offer is already priority, so
 *  Super is implied and locked on while 2-4 is on.
 *
 *  Cancel leaves the card on the stack -- backing out of the question is not
 *  passing on the find.
 */
export function OfferComposer({
  open,
  target,
  mine,
  preselect,
  superFirst,
  points,
  superPrice,
  multiPrice,
  sending,
  errorKey,
  onCancel,
  onSend,
  onSendMulti,
  onAdd,
  onNeedPoints,
}: {
  open: boolean
  target: CardItem | null
  mine: OfferOption[]
  /** A find to start with -- the fit pill on the card picked it. */
  preselect?: string
  /** Opened from the Super button. */
  superFirst: boolean
  points: number
  superPrice: number
  multiPrice: number
  sending: boolean
  errorKey: string | null
  onCancel: () => void
  onSend: (offeredItemId: string, asSuper: boolean) => void
  onSendMulti: (offeredItemIds: string[]) => void
  onAdd: () => void
  onNeedPoints: () => void
}) {
  const { t } = useT()
  const desktop = useIsDesktop()
  const [picked, setPicked] = React.useState<string[]>([])
  const [asSuper, setAsSuper] = React.useState(false)
  const [multi, setMulti] = React.useState(false)
  const [filter, setFilter] = React.useState<string>('all')

  React.useEffect(() => {
    if (!open) return
    setPicked(preselect ? [preselect] : [])
    setAsSuper(superFirst)
    setMulti(false)
    setFilter('all')
  }, [open, preselect, superFirst])

  const first = target ? target.owner.split(' ')[0] || target.owner : ''
  const wants = splitWants(target?.wants)
  const fits = mine.filter((o) => !!o.category && wants.categories.includes(categoryId(o.category)))
  const counts = mine.reduce<Record<string, number>>((acc, o) => {
    const c = categoryId(o.category)
    acc[c] = (acc[c] ?? 0) + 1
    return acc
  }, {})
  const shown = filter === 'all' ? mine : mine.filter((o) => categoryId(o.category) === filter)

  const toggle = (id: string) => {
    if (!multi) return setPicked([id])
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= MULTI_MAX ? p : [...p, id]))
  }
  const setMultiMode = (on: boolean) => {
    if (on && points < multiPrice) return onNeedPoints()
    setMulti(on)
    setPicked((p) => (on ? p : p.slice(0, 1)))
  }
  const setSuperMode = (on: boolean) => {
    if (on && points < superPrice) return onNeedPoints()
    setAsSuper(on)
  }

  const ready = multi ? picked.length >= MULTI_MIN : picked.length === 1
  const send = () => {
    if (!ready || sending) return
    if (multi) onSendMulti(picked)
    else onSend(picked[0], asSuper)
  }
  const cta = multi
    ? t('composer.sendMulti', { n: Math.max(picked.length, MULTI_MIN) })
    : asSuper
      ? t('composer.sendSuper')
      : t('composer.send')

  const one = picked.length === 1 ? mine.find((o) => o.id === picked[0]) : undefined

  const tile = (o: OfferOption) => {
    const on = picked.includes(o.id)
    return (
      <button
        key={o.id}
        type="button"
        onClick={() => toggle(o.id)}
        aria-pressed={on}
        className={cn(
          'group relative flex flex-col rounded-card bg-card p-1.5 text-left ring-1 transition-[box-shadow,transform] duration-200 ease-brand',
          on ? 'ring-2 ring-primary' : 'ring-input hover:-translate-y-0.5 hover:ring-muted-foreground/40',
        )}
      >
        <span className="block aspect-square overflow-hidden rounded-lg bg-secondary">
          {o.photoUrl && <img alt="" className="size-full object-cover" src={o.photoUrl} />}
        </span>
        {/* A find's title is user data. */}
        <span className="line-clamp-2 px-1 pb-0.5 pt-2 font-body text-[13px] font-semibold leading-4 text-foreground">{o.title}</span>
        {on && (
          <span className="absolute right-3 top-3 grid size-6 place-items-center rounded-pill bg-primary text-primary-foreground shadow">
            <Icon name="Check" size={14} strokeWidth={3} />
          </span>
        )}
      </button>
    )
  }

  const grid = desktop ? 'grid-cols-5' : 'grid-cols-3'

  const body = !target ? null : mine.length === 0 ? (
    <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
      <span className="grid size-14 place-items-center rounded-pill bg-coral text-ink">
        <Icon name="Package" size={26} />
      </span>
      <T as="p" k="barter.offerNoItems" className="max-w-[34ch] font-body text-body-md text-muted-foreground" />
      <Button variant="accent" onClick={onAdd}>
        <T as="span" k="shell.addFind" />
      </Button>
    </div>
  ) : (
    <>
      {/* The pair: theirs ⇄ what you are putting up. */}
      <div className="flex shrink-0 items-center gap-3 border-y border-input bg-background px-6 py-3">
        <span className="flex min-w-0 flex-1 items-center gap-3">
          {target.photos?.[0] || target.photoUrl ? (
            <img alt="" className="size-12 shrink-0 rounded-lg object-cover" src={target.photos?.[0] ?? target.photoUrl} />
          ) : (
            <span className="size-12 shrink-0 rounded-lg bg-secondary" />
          )}
          <span className="min-w-0">
            <span className="block font-body text-label-sm uppercase text-primary">{t('composer.theirs', { name: first })}</span>
            <span className="block truncate font-body text-label-lg text-foreground">{target.title}</span>
          </span>
        </span>
        <span className="grid size-8 shrink-0 place-items-center rounded-pill bg-card text-muted-foreground shadow-sm">
          <Icon name="ArrowLeftRight" size={16} />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-3">
          {one?.photoUrl ? (
            <img alt="" className="size-12 shrink-0 rounded-lg object-cover" src={one.photoUrl} />
          ) : (
            <span className="grid size-12 shrink-0 place-items-center rounded-lg border-2 border-dashed border-input text-muted-foreground">
              <Icon name={picked.length > 1 ? 'Layers' : 'Plus'} size={18} />
            </span>
          )}
          <span className="min-w-0 truncate font-body text-body-sm text-muted-foreground">
            {one ? (
              <span className="font-semibold text-foreground">{one.title}</span>
            ) : picked.length > 1 ? (
              t('composer.pickedN', { n: picked.length })
            ) : multi ? (
              t('composer.pickMulti')
            ) : (
              t('composer.pickOne')
            )}
          </span>
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {fits.length > 0 && (
          <section className="mb-5">
            <p className="flex items-center gap-1.5 font-body text-label-sm uppercase text-primary">
              <Icon name="CircleCheck" size={14} />
              {t('composer.fitsHead', { name: first })}
            </p>
            <p className="mb-2.5 mt-0.5 font-body text-body-sm text-muted-foreground">
              {t('composer.lookingFor', {
                name: first,
                what: [...wants.categories.map((c) => t(categoryLabel(c)))].join(', '),
              })}
              {wants.note && <> · “{wants.note}”</>}
            </p>
            <div className={cn('grid gap-2.5', grid)}>{fits.map(tile)}</div>
          </section>
        )}
        <section>
          <p className="mb-2.5 font-body text-label-sm uppercase text-muted-foreground">
            {t('composer.allFinds', { n: mine.length })}
          </p>
          {mine.length > CHIPS_FROM && (
            <div className={cn('mb-3 flex gap-1.5', desktop ? 'flex-wrap' : '-mx-6 overflow-x-auto px-6 [scrollbar-width:none]')}>
              {['all', ...Object.keys(counts)].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilter(c)}
                  aria-pressed={filter === c}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-pill bg-card px-3 font-body text-label-md text-muted-foreground ring-1 ring-inset ring-input aria-pressed:bg-ink aria-pressed:text-paper aria-pressed:ring-ink"
                >
                  {c === 'all' ? t('composer.all') : t(categoryLabel(c))}
                  <span className="opacity-70">{c === 'all' ? mine.length : counts[c]}</span>
                </button>
              ))}
            </div>
          )}
          <div className={cn('grid gap-2.5', grid)}>{shown.map(tile)}</div>
        </section>
      </div>

      <div className="shrink-0 border-t border-input px-6 py-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        {errorKey && (
          <p role="alert" className="mb-3 rounded-card bg-coral px-3 py-2 font-body text-body-sm text-ink">
            {t(errorKey)}
          </p>
        )}
        <div className={cn('flex gap-3', desktop ? 'items-center' : 'flex-col')}>
          <div className="flex gap-2">
            <label className={cn('flex flex-1 cursor-pointer items-center rounded-card py-2 ring-1 ring-input', desktop ? 'gap-3 px-3' : 'gap-2 px-2.5')}>
              <Switch checked={asSuper || multi} disabled={multi} onCheckedChange={setSuperMode} />
              <span>
                <span className="flex items-center gap-1 whitespace-nowrap font-body text-label-lg text-foreground">
                  <Icon name="Zap" size={16} />
                  {t('composer.super')}
                </span>
                <span className="block text-[12px] text-muted-foreground">{t('composer.superHelp', { n: superPrice })}</span>
              </span>
            </label>
            <label className={cn('flex flex-1 cursor-pointer items-center rounded-card py-2 ring-1 ring-input', desktop ? 'gap-3 px-3' : 'gap-2 px-2.5')}>
              <Switch checked={multi} onCheckedChange={setMultiMode} />
              <span>
                <span className="flex items-center gap-1 whitespace-nowrap font-body text-label-lg text-foreground">
                  <Icon name="Layers" size={16} />
                  {t('composer.multi')}
                </span>
                <span className="block text-[12px] text-muted-foreground">{t('composer.multiHelp', { n: multiPrice })}</span>
              </span>
            </label>
          </div>
          <div className={cn('flex gap-2', desktop ? 'ml-auto' : 'w-full')}>
            {/* On a phone the ✕ in the header is the way out, and the button
                gets the full width (the mock). */}
            {desktop && (
              <Button variant="ghost" onClick={onCancel}>
                <T as="span" k="common.cancel" />
              </Button>
            )}
            <Button onClick={send} disabled={!ready || sending} size={desktop ? 'md' : 'lg'} fullWidth={!desktop}>
              <Icon name="Handshake" size={18} />
              <span>{cta}</span>
            </Button>
          </div>
        </div>
      </div>
    </>
  )

  const head = (
    <div className="flex shrink-0 items-start gap-4 px-6 pb-4 pt-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-selected text-primary">
        <Icon name="Store" size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <T as="p" k="composer.title" className="font-display text-headline-sm text-foreground" />
        <p className="font-body text-body-sm text-muted-foreground">
          {target ? t('composer.subtitle', { name: first, title: target.title }) : ''}
        </p>
      </div>
      <button
        type="button"
        onClick={onCancel}
        aria-label={t('common.cancel')}
        className="grid size-9 shrink-0 place-items-center rounded-pill text-muted-foreground hover:bg-secondary"
      >
        <Icon name="X" size={20} />
      </button>
    </div>
  )

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
        <DialogContent
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="flex max-h-[88dvh] w-[760px] max-w-[calc(100vw-32px)] flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-card p-0 [&>button]:hidden">
          <DialogTitle className="sr-only">{t('composer.title')}</DialogTitle>
          <DialogDescription className="sr-only">{target ? t('composer.subtitle', { name: first, title: target.title }) : ''}</DialogDescription>
          <div className="flex min-h-0 flex-1 flex-col">
            {head}
            {body}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onCancel()}>
      <SheetContent
        side="bottom"
        className="flex h-[94dvh] flex-col gap-0 rounded-t-2xl border-0 bg-card p-0 [&>button]:hidden"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetTitle className="sr-only">{t('composer.title')}</SheetTitle>
        <SheetDescription className="sr-only">{target ? t('composer.subtitle', { name: first, title: target.title }) : ''}</SheetDescription>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex justify-center pt-2.5">
            <span aria-hidden="true" className="h-1 w-10 rounded-pill bg-input" />
          </div>
          {head}
          {body}
        </div>
      </SheetContent>
    </Sheet>
  )
}
