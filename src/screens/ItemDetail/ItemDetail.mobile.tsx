import { ArrowLeft, Heart } from 'lucide-react'

import { AppShell } from '@/components/shell/AppShell'
import { Button } from '@/components/ui/button'
import { OfferComposerSheet } from '@/components/offer/OfferComposerSheet'
import { T, useT } from '@/i18n/T'
import { Facts } from './Facts'
import { useItemDetail } from './useItemDetail'

/** The find, phone shape: a full-bleed photo you swipe through, the facts
 *  below it, and the offer button pinned to the bottom so it is always in
 *  reach however far you have scrolled.
 */
export default function ItemDetailMobile() {
  const d = useItemDetail()
  const { t } = useT()

  if (!d.ready) {
    return (
      <AppShell>
        <div className="flex min-h-dvh items-center justify-center">
          <T as="p" k="common.loading" className="font-body text-sm text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  const current = d.gallery[d.photo] ?? d.gallery[0]

  return (
    <AppShell hideNav>
      <div className="pb-28">
        <div
          className="relative aspect-[4/3] w-full"
          style={{ background: current?.color }}
        >
          {current?.url && (
            <img
              src={current.url}
              alt={t('a11y.photoOf', { title: d.item.title })}
              className="size-full object-cover"
            />
          )}
          <button
            type="button"
            onClick={d.goBack}
            aria-label={t('common.back')}
            className="absolute left-3.5 top-3.5 flex size-9 items-center justify-center rounded-pill bg-card/90 text-foreground backdrop-blur-sm"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>

          {d.gallery.length > 1 && (
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {d.gallery.map((g) => (
                <button
                  key={g.index}
                  type="button"
                  onClick={() => d.setPhoto(g.index)}
                  aria-label={t('item.photoN', { n: g.index + 1 })}
                  className={
                    g.index === d.photo
                      ? 'h-1.5 w-5 rounded-pill bg-card'
                      : 'size-1.5 rounded-pill bg-card/60'
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-4 pt-4">
          <Facts d={d} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2.5 border-t border-border/[0.14] bg-card px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
        <Button
          size="lg"
          fullWidth
          disabled={d.item.reserved}
          onClick={() => d.setOfferOpen(true)}
          data-i18n="item.offerSwap"
        >
          {t('item.offerSwap')}
        </Button>
        <button
          type="button"
          aria-label={t('item.save')}
          className="flex size-12 shrink-0 items-center justify-center rounded-pill border-[1.5px] border-border/[0.14] text-muted-foreground"
        >
          <Heart className="size-[18px]" aria-hidden="true" />
        </button>
      </div>

      <OfferComposerSheet
        open={d.offerOpen}
        onOpenChange={d.setOfferOpen}
        theirItem={d.theirItem}
        theirName={d.owner.name}
      />
    </AppShell>
  )
}
