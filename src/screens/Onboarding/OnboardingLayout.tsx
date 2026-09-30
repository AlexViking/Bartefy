import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { OrzomiByline } from '@/components/OrzomiByline'
import { BrandLockup } from '@/components/shell/BrandMark'
import { Button } from '@/components/ui/button'
import { MaterialIcon, type MaterialIconName } from '@/components/ui/material-icon'
import { T, useT } from '@/i18n/T'
import { EARN_RATES, visitValue } from '@/lib/points'
import { CATEGORIES } from '@/lib/taxonomy'
import { cn } from '@/lib/utils'
import { useOnboarding } from './useOnboarding'

/** The mock's twelve finds (shared with Sign in), 1-based as the mock uses them. */
const FINDS = Object.values(
  import.meta.glob('../../assets/panel/find-*.webp', { eager: true, import: 'default' }),
) as string[]
const find = (n: number) => FINDS[n - 1]

/** Each category's icon in the tastes grid (16-onboarding-b). */
const TASTE_ICON: Record<string, MaterialIconName> = {
  electronics: 'devices',
  home_garden: 'yard',
  kitchen: 'cooking',
  furniture: 'chair',
  clothing: 'apparel',
  bags_jewellery: 'diamond',
  books_media: 'menu_book',
  music: 'music_note',
  sport_outdoors: 'pedal_bike',
  toys_games: 'extension',
  baby_kids: 'child_care',
  tools_diy: 'handyman',
  art_craft: 'palette',
  collectables: 'museum',
  other: 'inventory_2',
}

const LIST_PTS = EARN_RATES.find((r) => r.reason === 'list_find')?.points ?? 0

/** Onboarding (16-onboarding-b): welcome · Tbilisi · tastes · all set.
 *  Same column as Sign in; the green side changes with each step. Rules are
 *  useOnboarding's, unchanged (only the city step gates; skipping still saves
 *  the launch city). */
export function OnboardingLayout({ wide }: { wide: boolean }) {
  const o = useOnboarding()
  const { t } = useT()
  const id = o.stepId

  const title = (k: string, sub: string) => (
    <div>
      <T as="h1" k={k} className="font-display text-[32px] font-normal leading-10 text-foreground" />
      <T as="p" k={sub} className="mt-2 font-body text-[16px] leading-6 text-muted-foreground" />
    </div>
  )

  const tile = (icon: MaterialIconName) => (
    <span className="grid size-11 shrink-0 place-items-center rounded-card bg-mint text-forest">
      <MaterialIcon name={icon} size={22} />
    </span>
  )

  const body =
    id === 'intro' ? (
      <section className="flex flex-col gap-6">
        {title('ob.welcomeTitle', 'ob.welcomeBody')}
        <ol className="flex flex-col gap-4">
          {(
            [
              ['table_restaurant', 'ob.step1', 'ob.step1Body'],
              ['style', 'ob.step2', 'ob.step2Body'],
              ['handshake', 'ob.step3', 'ob.step3Body'],
            ] as const
          ).map(([icon, k, b]) => (
            <li key={k} className="flex gap-4">
              {tile(icon)}
              <div>
                <T as="p" k={k} className="font-body text-[15px] leading-normal text-foreground" />
                <T as="p" k={b} className="font-body text-body-sm text-muted-foreground" />
              </div>
            </li>
          ))}
        </ol>
        {/* Phone: the credit sits under the three steps, on this step only (the mock). */}
        {!wide && (
          <div className="pt-2">
            <OrzomiByline />
          </div>
        )}
      </section>
    ) : id === 'city' ? (
      <section className="flex flex-col gap-6">
        {title('ob.cityTitle', 'ob.cityBody')}
        <div className="flex flex-col gap-2">
          {/* One launch city: the choice is made for you and shown as made. */}
          <button
            type="button"
            aria-pressed={!!o.city}
            onClick={() => o.setCity(o.city || 'Tbilisi')}
            className="flex h-14 items-center gap-3 rounded-card bg-selected/40 px-4 text-left ring-2 ring-primary"
          >
            <MaterialIcon name="location_on" size={22} className="text-primary" />
            {/* A city is a place name. */}
            <span className="flex-1 font-body text-[15px] text-foreground">{o.city || 'Tbilisi'}</span>
            <MaterialIcon name="check_circle_fill" size={22} className="text-primary" />
          </button>
          <p className="flex h-14 items-center gap-3 rounded-card px-4 text-muted-foreground ring-1 ring-inset ring-input">
            <MaterialIcon name="schedule" size={20} />
            <T as="span" k="ob.moreCities" className="flex-1 font-body text-body-md" />
          </p>
        </div>
        <p className="font-body text-body-sm text-muted-foreground">
          {t('ob.cityNotePre')} <b className="text-foreground">{t('rail.km', { n: 10 })}</b>
          {t('ob.cityNotePost')}
        </p>
      </section>
    ) : id === 'taste' ? (
      <section className="flex flex-col gap-6">
        {title('ob.tasteTitle', 'ob.tasteBody')}
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((c) => {
            const on = o.tastes.includes(c.id)
            return (
              <button
                key={c.id}
                type="button"
                aria-pressed={on}
                onClick={() => o.toggleTaste(c.id)}
                className={cn(
                  'flex items-center rounded-card ring-inset transition-colors',
                  wide ? 'h-[52px] flex-row gap-2.5 px-3' : 'h-[76px] flex-col justify-center gap-1.5 px-2',
                  on ? 'bg-selected/40 text-forest ring-2 ring-primary' : 'bg-card text-muted-foreground ring-1 ring-input hover:bg-background',
                )}
              >
                <MaterialIcon name={TASTE_ICON[c.id] ?? 'inventory_2'} size={24} className="shrink-0" />
                <span className={cn('font-body text-label-md leading-4', wide ? 'text-left' : 'text-center')}>{t(c.label)}</span>
              </button>
            )
          })}
        </div>
        <p className="font-body text-body-sm text-muted-foreground">
          {o.tastes.length ? t('ob.tastePicked', { n: o.tastes.length }) : t('ob.tasteNone')}
        </p>
      </section>
    ) : (
      <section className="flex flex-col gap-6">
        {title('ob.doneTitle', 'ob.doneBody')}
        <div className="flex flex-col gap-1.5 rounded-2xl bg-card p-4 ring-1 ring-input">
          <p className="flex items-center gap-2 font-body text-[15px] text-foreground">
            <MaterialIcon name="toll" size={20} className="text-ink" />
            {t('ob.donePoints', { n: LIST_PTS })}
          </p>
          <p className="font-body text-body-sm text-muted-foreground">{t('ob.doneStreak', { n: visitValue(2) })}</p>
        </div>
      </section>
    )

  // Phone, last step: the two ways out stack full width, the main one on top,
  // and Back goes -- there is nothing left to go back and change (the mock).
  const stacked = !wide && o.isLast
  const actions = (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 pt-1',
        !wide && 'fixed inset-x-0 bottom-0 z-10 border-t border-input bg-background px-6 pb-[max(16px,env(safe-area-inset-bottom))] pt-3',
        stacked && 'flex-col-reverse flex-nowrap items-stretch',
      )}
    >
      {!o.isFirst && !stacked && (
        <Button variant="ghost" size="lg" className="border-0 bg-transparent px-4 text-muted-foreground" onClick={o.back}>
          <MaterialIcon name="arrow_back" size={18} />
          <T as="span" k="common.back" />
        </Button>
      )}
      {!stacked && <span className="flex-1" />}
      {o.isLast ? (
        <>
          <Button variant="ghost" size="lg" className="border-0 bg-transparent px-4 text-muted-foreground" onClick={() => void o.finish('/discover')}>
            <T as="span" k="onboarding.startHunting" />
          </Button>
          <Button size="lg" className="px-6 shadow-[0_6px_18px_rgba(27,107,85,0.28)]" onClick={() => void o.finish('/add')}>
            <MaterialIcon name="add_a_photo" size={18} />
            <T as="span" k="ob.listFirst" />
          </Button>
        </>
      ) : (
        <Button size="lg" className="px-6 shadow-[0_6px_18px_rgba(27,107,85,0.28)]" onClick={o.next} disabled={!o.canAdvance}>
          <T as="span" k="common.next" />
          <MaterialIcon name="arrow_forward" size={18} />
        </Button>
      )}
    </div>
  )

  const dots = (
    <ol className="flex gap-1.5" aria-label={t('common.stepOf', { current: o.step + 1, total: o.steps.length })}>
      {o.steps.map((s, i) => (
        <li key={s.id} className={cn('h-1.5 w-8 rounded-pill transition-colors', i <= o.step ? 'bg-primary' : 'bg-input')} />
      ))}
    </ol>
  )

  return (
    <div className="flex min-h-dvh bg-background">
      <main className={cn('flex shrink-0 flex-col py-8', wide ? 'w-[min(46%,640px)] px-16' : 'w-full px-6 pb-28')}>
        <div className="flex shrink-0 items-center justify-between gap-4">
          <BrandLockup withWord wordWidth={110} />
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            {!o.isLast && (
              <button type="button" onClick={() => void o.skip()} className="min-h-hit whitespace-nowrap px-2 font-body text-label-lg text-muted-foreground hover:underline">
                <T as="span" k="onboarding.skipForNow" />
              </button>
            )}
          </div>
        </div>
        <div className={cn('flex flex-1 pb-6 pt-8', wide && 'items-center')}>
          <div className="flex w-full max-w-[460px] flex-col gap-7">
            {dots}
            {body}
            {actions}
          </div>
        </div>
        {/* Bottom-left, under the column (the mock) -- not centred. */}
        {wide && (
          <div className="shrink-0">
            <OrzomiByline />
          </div>
        )}
      </main>
      {wide && <Art step={id} />}
    </div>
  )
}

/** The green side: one picture per step, and its line (the mock). */
function Art({ step }: { step: string }) {
  const card = 'rounded-3xl object-cover shadow-2xl ring-8 ring-forest'
  const art =
    step === 'intro' ? (
      <div className="relative h-[360px] w-[520px]">
        <img alt="" src={find(1)} className={cn('absolute left-0 top-10 h-[280px] w-[220px] -rotate-6', card)} />
        <img alt="" src={find(2)} className={cn('absolute left-[150px] top-0 h-[280px] w-[220px] rotate-2', card)} />
        <img alt="" src={find(3)} className={cn('absolute left-[300px] top-12 h-[280px] w-[220px] rotate-[10deg]', card)} />
      </div>
    ) : step === 'city' ? (
      <div className="relative grid size-[420px] place-items-center">
        <span className="absolute inset-0 rounded-full border-2 border-dashed border-white/30" />
        <span className="absolute inset-[70px] rounded-full bg-white/10" />
        <span className="relative grid size-16 place-items-center rounded-full bg-white text-forest shadow-xl">
          <MaterialIcon name="location_on_fill" size={34} />
        </span>
        {(
          [
            [4, 'left-2 top-16'],
            [5, 'right-0 top-8'],
            [7, 'left-10 bottom-4'],
            [6, 'right-6 bottom-10'],
          ] as const
        ).map(([n, pos]) => (
          <img key={n} alt="" src={find(n)} className={cn('absolute size-20 rounded-2xl object-cover shadow-lg ring-4 ring-forest', pos)} />
        ))}
        <T as="span" k="ob.artKm" className="absolute -bottom-10 font-body text-[15px] text-white/80" />
      </div>
    ) : step === 'taste' ? (
      <div className="grid w-[480px] grid-cols-3 gap-3">
        {[1, 6, 8, 10, 2, 7, 5, 4, 9].map((n, i) => (
          <img key={n} alt="" src={find(n)} className={cn('aspect-square w-full rounded-2xl object-cover', i % 2 === 1 && 'opacity-40')} />
        ))}
      </div>
    ) : (
      <div className="relative h-[400px] w-[300px] overflow-hidden rounded-3xl shadow-2xl ring-8 ring-forest">
        <img alt="" src={find(12)} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 pt-16 text-white">
          <T as="p" k="ob.artDecks" className="text-[12px] text-white/80" />
          <T as="p" k="ob.artFirst" className="font-display text-[20px] leading-6" />
        </div>
        <span className="absolute left-4 top-4 inline-flex h-7 items-center gap-1 rounded-pill bg-white/90 px-2.5 text-[12px] font-bold text-forest">
          <MaterialIcon name="add" size={16} />
          <T as="span" k="ob.artOnTable" />
        </span>
      </div>
    )
  const caption = step === 'intro' ? 'ob.capWelcome' : step === 'city' ? 'ob.capCity' : step === 'taste' ? 'ob.capTaste' : 'brand.swapLine'
  return (
    <aside className="relative flex flex-1 flex-col items-center justify-center gap-14 overflow-hidden bg-forest p-12">
      <div className="grid place-items-center">{art}</div>
      <T as="p" k={caption} className="max-w-[560px] text-center font-display text-[40px] font-semibold leading-tight text-white" />
    </aside>
  )
}
