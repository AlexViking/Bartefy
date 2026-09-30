import * as React from 'react'
import { useNavigate } from 'react-router'

import { Icon } from '@/components/ui/icon'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { T, useT } from '@/i18n/T'
import { tierOf, type Tier } from '@/lib/membership'
import { cn } from '@/lib/utils'
import { useHuntStore } from '@/store/hunt'

const STEPS = [2, 5, 10, 25, 50]

/** Discover's context in the top bar (Alex, 2026-09-28): the middle of the
 *  bar was empty, and there is no search -- so the bar says what the deck IS:
 *  finds within N km of a place. The chip sets the deck's reach; distances
 *  past the tier's radius are shown locked, with the way to unlock them. */
export function AreaChip({ city, tier }: { city: string; tier: Tier }) {
  const { t } = useT()
  const navigate = useNavigate()
  const km = useHuntStore((s) => s.radiusKm)
  const setKm = useHuntStore((s) => s.setRadiusKm)
  const [open, setOpen] = React.useState(false)
  const reach = tierOf(tier).radiusKm // null = no cap

  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }

  return (
    <>
      <T as="h1" k="shell.nav_discover" className="shrink-0 font-display text-headline-md text-foreground" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={t('area.label', { city, km })}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-pill px-3 outline-none ring-1 ring-inset transition-colors duration-200 ease-brand focus-visible:ring-2 focus-visible:ring-ring/50',
              open ? 'bg-card shadow-sm ring-input' : 'bg-background ring-transparent hover:bg-secondary hover:ring-input',
            )}
          >
            <Icon name="MapPin" size={18} className="text-primary" />
            {/* A city is a place name, not copy. */}
            <span className="font-body text-label-lg text-foreground">{city}</span>
            <span className="font-body text-body-sm text-muted-foreground">· {t('rail.km', { n: km })}</span>
            <Icon name="ChevronDown" size={18} className="-mr-1 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="w-[340px] overflow-hidden rounded-card border-input p-0 shadow-[0_16px_40px_rgba(31,27,24,0.18)]"
        >
          <div className="flex flex-col gap-4 p-4">
            <div>
              <T as="p" k="area.title" className="font-display text-headline-sm text-foreground" />
              <T as="p" k="area.body" className="font-body text-body-sm text-muted-foreground" />
            </div>
            <div className="flex h-12 items-center gap-3 rounded-lg bg-background px-3">
              <Icon name="MapPin" size={20} className="text-primary" />
              <span className="flex-1 font-body text-label-lg text-foreground">{city}</span>
              <button type="button" onClick={() => go('/settings')} className="font-body text-label-md text-primary hover:underline">
                <T as="span" k="area.change" />
              </button>
            </div>
            <div>
              <T as="p" k="area.howFar" className="mb-2 font-body text-label-sm uppercase text-muted-foreground" />
              <div className="grid grid-cols-5 gap-1.5">
                {STEPS.map((k) => {
                  const locked = reach !== null && k > reach
                  return (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={k === km}
                      onClick={() => (locked ? go('/points') : setKm(k))}
                      title={locked ? t('area.locked', { n: k }) : undefined}
                      className={cn(
                        'inline-flex h-9 items-center justify-center gap-1 rounded-lg font-body text-label-lg ring-1 ring-inset transition-colors',
                        locked
                          ? 'text-muted-foreground ring-input'
                          : k === km
                            ? 'bg-primary text-primary-foreground ring-primary'
                            : 'text-foreground ring-input hover:bg-background',
                      )}
                    >
                      {locked && <Icon name="Lock" size={14} />}
                      {locked ? k : t('rail.km', { n: k })}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          {reach !== null && reach < 50 && (
            <button
              type="button"
              onClick={() => go('/points')}
              className="flex w-full items-center justify-between border-t border-input px-4 py-3 text-left font-body text-label-lg text-primary hover:bg-background"
            >
              <T as="span" k="area.collector" />
              <Icon name="ArrowRight" size={18} />
            </button>
          )}
        </PopoverContent>
      </Popover>
    </>
  )
}
