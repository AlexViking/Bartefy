import * as React from 'react'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field, TextField } from '@/components/ui/field'
import { Icon } from '@/components/ui/icon'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { T, useT } from '@/i18n/T'
import { updateItemDetails } from '@/lib/api'
import { CATEGORIES, CONDITIONS, categoryLabel, conditionAt, WANT_NOTE_PREFIX } from '@/lib/taxonomy'
import { cn } from '@/lib/utils'
import { TimerPill } from '@/screens/Swaps/SwapsList'
import { SOON_DAYS, type MyFind } from './useMyFinds'

const LISTING_DAYS = 30

// The mock's sizes on top of the shadcn Button.
const QUIET = 'h-11 gap-1.5 rounded-card border-0 bg-transparent px-3.5 font-body text-label-lg text-muted-foreground hover:bg-secondary'
const LOUD = 'h-11 gap-2 whitespace-nowrap rounded-card px-5 font-body text-label-lg shadow-[0_6px_18px_rgba(27,107,85,0.28)]'

/** One of my finds, in full: the photo, how long it stays on the deck, the
 *  offers for it, what I want back -- and what I can do: Edit, Pause (or put
 *  back), Renew, and Remove behind ⋮. Item detail is cut in V6, so this is
 *  where a find is managed. */
export function FindPane({
  f,
  busy,
  errorKey,
  onBack,
  onAct,
  onEdited,
}: {
  f: MyFind
  busy: boolean
  errorKey: string | null
  onBack?: () => void
  onAct: (what: 'pause' | 'resume' | 'renew' | 'remove') => void
  onEdited: () => void
}) {
  const { t } = useT()
  const navigate = useNavigate()
  const [editing, setEditing] = React.useState(false)
  const [confirmRemove, setConfirmRemove] = React.useState(false)
  const cover = f.photos[0]
  // One threshold for "leaving soon": the grid's badge and Needs-you chip use it too.
  const soon = f.daysLeft !== null && f.daysLeft <= SOON_DAYS

  return (
    <article className="flex h-full flex-col">
      <header className="flex shrink-0 items-start gap-3 px-5 pb-3 pt-5">
        {onBack && (
          <button type="button" onClick={onBack} aria-label={t('desk.back')} className="-ml-2 grid size-10 shrink-0 place-items-center rounded-pill hover:bg-secondary">
            <Icon name="ArrowLeft" size={22} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {/* A find's title is user data. */}
          <p className="font-display text-headline-sm text-foreground">{f.title}</p>
          <p className="font-body text-body-sm text-muted-foreground">
            {t(categoryLabel(f.category))} · {t(conditionAt(f.condition).label)}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label={t('desk.more')} className="grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary">
              <Icon name="EllipsisVertical" size={20} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onSelect={() => setConfirmRemove(true)} className="h-10 gap-3">
              <Icon name="Trash2" size={18} className="text-muted-foreground" />
              <T as="span" k="finds.remove" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-5">
        {cover ? (
          <img alt="" className="aspect-[4/3] w-full rounded-card object-cover" src={cover} />
        ) : (
          <span className="block aspect-[4/3] w-full rounded-card bg-secondary" />
        )}

        {f.status === 'active' && f.daysLeft !== null && (
          <div className={cn('rounded-card px-4 py-3', soon ? 'bg-sun/60' : 'bg-background')}>
            <p className="font-body text-label-lg text-foreground">{t('finds.leavesIn', { count: f.daysLeft })}</p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-white/70">
              <div className="h-full rounded-pill bg-ink/80" style={{ width: `${Math.round((f.daysLeft / LISTING_DAYS) * 100)}%` }} />
            </div>
            <T as="p" k="finds.renewNote" className="mt-2 font-body text-[12px] leading-4 text-muted-foreground" />
          </div>
        )}
        {f.status === 'reserved' && (
          <p className="flex items-center gap-2 rounded-card bg-mint px-4 py-3 font-body text-body-sm text-forest">
            <Icon name="Handshake" size={18} />
            <T as="span" k="finds.inSwapNote" />
          </p>
        )}
        {f.status === 'paused' && (
          <T as="p" k="finds.pausedNote" className="rounded-card bg-background px-4 py-3 font-body text-body-sm text-muted-foreground" />
        )}

        {f.offers.length > 0 && (
          <section>
            <p className="mb-2 font-body text-label-sm uppercase text-muted-foreground">{t('finds.offersFor', { count: f.offers.length })}</p>
            <ul className="flex flex-col gap-2">
              {f.offers.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => navigate('/matches?offer=' + o.id)}
                    className="flex w-full items-center gap-3 rounded-card p-2 text-left ring-1 ring-input hover:bg-background"
                  >
                    {o.theirPhoto ? <img alt="" className="size-12 rounded-lg object-cover" src={o.theirPhoto} /> : <span className="size-12 rounded-lg bg-secondary" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-body text-label-lg text-foreground">{o.theirTitle}</span>
                      <span className="block truncate font-body text-[12px] text-muted-foreground">{t('finds.from', { who: o.who })}</span>
                    </span>
                    <TimerPill at={o.expiresAt} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <T as="p" k="finds.youWant" className="mb-1 font-body text-label-sm uppercase text-muted-foreground" />
          {f.wantsNote && <p className="font-body text-body-md text-foreground">{f.wantsNote}</p>}
          {f.wantsCats.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {f.wantsCats.map((c) => (
                <span key={c} className="inline-flex h-6 items-center rounded-pill bg-secondary px-2 text-[12px] font-semibold text-muted-foreground">
                  {t(categoryLabel(c))}
                </span>
              ))}
            </div>
          )}
          {!f.wantsNote && f.wantsCats.length === 0 && <T as="p" k="finds.wantsAnything" className="font-body text-body-md text-muted-foreground" />}
        </section>
        {errorKey && <p role="alert" className="rounded-card bg-coral px-3 py-2 font-body text-body-sm text-ink">{t(errorKey)}</p>}
      </div>

      {/* The mock's bar (08-my-finds-b): two quiet text buttons, then ONE green
          action. Leaving the deck soon, Renew wins even with offers waiting
          (the mock's Fuji); otherwise offers waiting means Review offers (its
          Marantz), and nothing waiting means Renew. */}
      <footer className="flex shrink-0 items-center gap-1 border-t border-input px-3 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
        <Button variant="ghost" onClick={() => setEditing(true)} disabled={busy} className={QUIET}>
          <Icon name="Pencil" size={18} />
          <T as="span" k="finds.edit" />
        </Button>
        {f.status !== 'reserved' && (
          <Button variant="ghost" onClick={() => onAct(f.status === 'paused' ? 'resume' : 'pause')} disabled={busy} className={QUIET}>
            <Icon name={f.status === 'paused' ? 'Play' : 'Pause'} size={18} />
            <T as="span" k={f.status === 'paused' ? 'finds.putBack' : 'finds.pause'} />
          </Button>
        )}
        <span className="flex-1" />
        {f.offers.length > 0 && !(soon && f.status === 'active') ? (
          <Button onClick={() => navigate('/matches?offer=' + f.offers[0].id)} className={LOUD}>
            <Icon name="Handshake" size={20} />
            <T as="span" k="finds.reviewOffers" />
          </Button>
        ) : (
          f.status === 'active' && (
            <Button onClick={() => onAct('renew')} disabled={busy} className={LOUD}>
              <Icon name="RotateCcw" size={20} />
              {t('finds.renew', { n: LISTING_DAYS })}
            </Button>
          )
        )}
      </footer>

      <EditFindSheet open={editing} onOpenChange={setEditing} f={f} onSaved={onEdited} />

      <ResponsiveSheet
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title="finds.removeTitle"
        description="finds.removeBody"
        footer={
          <div className="flex w-full flex-col gap-2">
            <Button
              fullWidth
              size="lg"
              disabled={busy}
              onClick={() => {
                setConfirmRemove(false)
                onAct('remove')
              }}
            >
              <T as="span" k="finds.remove" />
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setConfirmRemove(false)}>
              <T as="span" k="common.notYet" />
            </Button>
          </div>
        }
      >
        <span className="sr-only">{t('finds.removeBody')}</span>
      </ResponsiveSheet>
    </article>
  )
}

const PILL =
  'inline-flex h-9 items-center rounded-pill px-3.5 font-body text-label-md ring-1 ring-inset transition-colors ' +
  'aria-pressed:bg-selected aria-pressed:text-selected-foreground aria-pressed:ring-primary/40'

/** Edit the words of a listing. Photos stay as they are -- a new photo is a
 *  new upload with its own id. */
function EditFindSheet({ open, onOpenChange, f, onSaved }: { open: boolean; onOpenChange: (o: boolean) => void; f: MyFind; onSaved: () => void }) {
  const { t } = useT()
  const [title, setTitle] = React.useState(f.title)
  const [story, setStory] = React.useState(f.description)
  const [cats, setCats] = React.useState<string[]>(f.categories)
  const [condition, setCondition] = React.useState(f.condition)
  const [wants, setWants] = React.useState<string[]>(f.wantsCats)
  const [note, setNote] = React.useState(f.wantsNote)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setTitle(f.title)
    setStory(f.description)
    setCats(f.categories)
    setCondition(f.condition)
    setWants(f.wantsCats)
    setNote(f.wantsNote)
    setError(false)
  }, [open, f])

  const toggle = (list: string[], set: (v: string[]) => void, id: string) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  const save = async () => {
    if (!title.trim() || saving) return
    setSaving(true)
    setError(false)
    const { data, error: e } = await updateItemDetails(f.id, {
      title: title.trim(),
      description: story.trim(),
      category: cats[0] ?? 'other',
      categories: cats,
      condition,
      wants_in_return: [...wants, ...(note.trim() ? [WANT_NOTE_PREFIX + note.trim()] : [])],
    })
    setSaving(false)
    // An update RLS refuses returns no rows and no error.
    if (e || !data || data.length === 0) {
      setError(true)
      return
    }
    onOpenChange(false)
    onSaved()
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="finds.editTitle"
      className="max-w-[640px]"
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <T as="span" k="common.cancel" />
          </Button>
          <Button onClick={() => void save()} disabled={!title.trim() || saving}>
            {saving ? t('common.loading') : t('common.save')}
          </Button>
        </div>
      }
    >
      <div className="flex max-h-[60dvh] flex-col gap-5 overflow-y-auto pr-1">
        <Field label="add.nameIt" value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextField label="add.storyOptional" value={story} onChange={(e) => setStory(e.target.value)} />
        <div className="flex flex-col gap-2">
          <T as="p" k="add.categoryLabel" className="font-body text-label-lg text-foreground" />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c.id} type="button" aria-pressed={cats.includes(c.id)} onClick={() => toggle(cats, setCats, c.id)} className={cn(PILL, !cats.includes(c.id) && 'bg-card text-muted-foreground ring-input')}>
                {t(c.label)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <T as="p" k="add.conditionLabel" className="font-body text-label-lg text-foreground" />
          <div className="flex flex-wrap gap-2">
            {[...CONDITIONS].reverse().map((c) => (
              <button key={c.value} type="button" aria-pressed={condition === c.value} onClick={() => setCondition(c.value)} className={cn(PILL, condition !== c.value && 'bg-card text-muted-foreground ring-input')}>
                {t(c.label)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <T as="p" k="add.wantsHeading" className="font-body text-label-lg text-foreground" />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c.id} type="button" aria-pressed={wants.includes(c.id)} onClick={() => toggle(wants, setWants, c.id)} className={cn(PILL, !wants.includes(c.id) && 'bg-card text-muted-foreground ring-input')}>
                {t(c.label)}
              </button>
            ))}
          </div>
          <TextField label="add.wantsNoteLabel" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        {error && <T as="p" k="finds.editFailed" className="rounded-card bg-coral px-3 py-2 font-body text-body-sm text-ink" />}
      </div>
    </ResponsiveSheet>
  )
}
