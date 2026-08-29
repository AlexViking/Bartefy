import { Check, ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { T, useT } from '@/i18n/T'
import type { OfferOption } from '@/screens/Hunt/useHunt'

/** Which of my finds I am hunting with.
 *
 *  A barter has two sides, and until now the app only ever asked about one of
 *  them: you swiped, and the match logic picked whichever of your items the
 *  other person happened to have liked most recently. This makes your side of
 *  the trade a deliberate choice, and — just as important — visible while you
 *  swipe, so "what am I offering for this?" has an answer on screen.
 *
 *  With nothing listed there is nothing to trade, so the control becomes the
 *  prompt to list a first find rather than an empty dropdown.
 */
export function OfferPicker({
  offers,
  selectedId,
  onSelect,
  onAdd,
  className,
}: {
  offers: OfferOption[]
  selectedId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
  className?: string
}) {
  const { t } = useT()

  if (offers.length === 0) {
    return (
      <Button variant="ghost" size="sm" onClick={onAdd} className={className} data-i18n="hunt.offerNone">
        {t('hunt.offerNone')}
      </Button>
    )
  }

  const selected = offers.find((o) => o.id === selectedId) ?? offers[0]

  return (
    <div className={className}>
      <T
        as="span"
        k="hunt.offerLabel"
        className="block font-body text-xs text-muted-foreground"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex min-h-hit max-w-full items-center gap-2 rounded-pill border-[1.5px] border-border/[0.14] bg-card px-2 py-1 text-left"
            aria-label={t('hunt.offerLabel')}
          >
            <span
              className="size-7 shrink-0 overflow-hidden rounded-lg bg-secondary"
              aria-hidden="true"
            >
              {selected.photoUrl && (
                <img src={selected.photoUrl} alt="" className="size-full object-contain" />
              )}
            </span>
            {/* The title is the user's own words, so it carries no data-i18n. */}
            <span className="min-w-0 truncate font-display text-sm font-semibold text-foreground">
              {selected.title}
            </span>
            <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="max-w-[280px]">
          {offers.map((o) => (
            <DropdownMenuItem
              key={o.id}
              onSelect={() => onSelect(o.id)}
              className="flex items-center gap-2"
            >
              <span className="size-7 shrink-0 overflow-hidden rounded-lg bg-secondary" aria-hidden="true">
                {o.photoUrl && <img src={o.photoUrl} alt="" className="size-full object-contain" />}
              </span>
              <span className="min-w-0 flex-1 truncate font-body text-sm">{o.title}</span>
              {o.id === selected.id && (
                <Check aria-hidden="true" className="size-4 shrink-0 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
