import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { OwnerRow } from '@/components/swap/OwnerRow'
import { WantsRow } from '@/components/swap/WantsRow'
import { OfferComposerSheet } from '@/components/offer/OfferComposerSheet'
import type { ItemRef, PersonRef } from '@/types/swap'

/** S1 - the one screen with a shareable link.
 *  T3 layout: gallery beside the decision on desktop, fixed action bar on mobile.
 */
export function ItemDetail() {
  const { itemId } = useParams()
  const navigate = useNavigate()
  const [offerOpen, setOfferOpen] = useState(false)
  const [photo, setPhoto] = useState(0)

  // TODO(api): getItem(itemId) - see MAPPING.md, needs eyeing_count + reserved status
  const item = {
    id: itemId ?? 'demo',
    title: 'Pentax ME Super',
    category: 'Cameras',
    condition: 'Good',
    description:
      'Shoots beautifully, light seals redone last spring. Comes with the 50mm and a worn leather strap that has clearly been somewhere.',
    photos: ['hsl(var(--illo-terracotta))', 'hsl(var(--illo-denim))', 'hsl(var(--illo-sage))', 'hsl(var(--accent))'],
    wants: ['Film lenses', 'Vinyl', 'Anything wool'],
    eyeing: 4,
    reserved: false,
  }

  const owner: PersonRef = {
    id: 'u_mira',
    name: 'Mira K.',
    rating: 4.8,
    swapCount: 31,
    verified: true,
    distanceLabel: '2 km away',
  }

  const theirItem: ItemRef = { id: item.id, title: item.title, photoColor: item.photos[0], condition: item.condition }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[1160px] px-0 pb-28 lg:px-6 lg:py-6">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          {/* Gallery */}
          <div className="flex flex-col gap-2.5">
            <div
              className="relative aspect-[4/3] w-full overflow-hidden lg:rounded"
              style={{ background: item.photos[photo] }}
            >
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Back"
                className="absolute left-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-full bg-card/90 lg:hidden"
              >
                <Icon name="ChevronLeft" size={18} />
              </button>
              <div className="absolute left-3.5 top-3.5 hidden lg:block">
                <Badge tone="brass">{item.condition}</Badge>
              </div>
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 lg:hidden">
                {item.photos.map((_, i) => (
                  <span
                    key={i}
                    className={i === photo ? 'h-1 w-5 rounded-sm bg-white' : 'h-1 w-5 rounded-sm bg-white/45'}
                  />
                ))}
              </div>
            </div>
            <div className="hidden grid-cols-4 gap-2 lg:grid">
              {item.photos.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPhoto(i)}
                  aria-label={'Photo ' + (i + 1)}
                  className={
                    i === photo
                      ? 'aspect-square rounded-sm ring-2 ring-primary'
                      : 'aspect-square rounded-sm ring-1 ring-border/[0.14]'
                  }
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* Decision */}
          <div className="flex flex-col gap-4 px-4 pt-4 lg:px-0 lg:pt-0">
            <div className="flex flex-col gap-1.5">
              <span className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground">
                {item.category} {'\u00b7'} {owner.distanceLabel} {'\u00b7'} {item.condition}
              </span>
              <h1 className="font-display text-2xl font-bold leading-tight text-foreground lg:text-h2">{item.title}</h1>
              <p className="font-body text-base text-muted-foreground" style={{ textWrap: 'pretty' }}>
                {item.description}
              </p>
            </div>

            <div className="rounded-sm border border-border/[0.14] bg-popover p-3">
              <OwnerRow person={owner} action="Profile" onAction={() => navigate('/u/' + owner.id)} />
            </div>

            <WantsRow wants={item.wants} matchCount={2} label={'She is looking for'} />

            {item.reserved && (
              <div className="rounded-sm bg-secondary p-3 font-body text-sm text-muted-foreground">
                Reserved while another swap finishes. We will tell you if it comes back.
              </div>
            )}

            <div className="hidden items-center gap-2.5 border-t border-border/[0.14] pt-4 lg:flex">
              <Button size="lg" disabled={item.reserved} onClick={() => setOfferOpen(true)}>
                Offer a swap
              </Button>
              <Button variant="ghost">Save it</Button>
              <span className="ml-auto font-body text-sm text-muted-foreground">{item.eyeing} people eyeing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile action bar - survives a long scroll */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2.5 border-t border-border/[0.14] bg-card px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 lg:hidden">
        <Button size="lg" fullWidth disabled={item.reserved} onClick={() => setOfferOpen(true)}>
          Offer a swap
        </Button>
        <button
          type="button"
          aria-label="Save it"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border/[0.14] text-muted-foreground"
        >
          <Icon name="Heart" size={18} />
        </button>
      </div>

      <OfferComposerSheet
        open={offerOpen}
        onOpenChange={setOfferOpen}
        theirItem={theirItem}
        theirName={owner.name}
      />
    </AppShell>
  )
}
