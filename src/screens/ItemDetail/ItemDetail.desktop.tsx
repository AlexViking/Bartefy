import { ArrowLeft, Eye } from 'lucide-react'

import { AppShell } from '@/components/shell/AppShell'
import { Button } from '@/components/ui/button'
import { InfoHint } from '@/components/guidance/InfoHint'
import { OfferComposerSheet } from '@/components/offer/OfferComposerSheet'
import { T, useT } from '@/i18n/T'
import { Facts } from './Facts'
import { useItemDetail } from './useItemDetail'

/** The find, desktop shape: the photo and a thumbnail strip on the left, the
 *  facts and the decision on the right. Both are on screen at once, so the
 *  offer button needs no pinned bar.
 */
export default function ItemDetailDesktop() {
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
    <AppShell>
      <div className="mx-auto w-full max-w-[1160px] px-6 py-6">
        <Button variant="ghost" size="sm" onClick={d.goBack} className="mb-4" data-i18n="common.back">
          <ArrowLeft aria-hidden="true" />
          {t('common.back')}
        </Button>

        <div className="grid gap-8 grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col gap-3">
            <div
              className="relative aspect-[4/3] w-full overflow-hidden rounded"
              style={{ background: current?.color }}
            >
              {current?.url && (
                <img
                  src={current.url}
                  alt={t('a11y.photoOf', { title: d.item.title })}
                  className="size-full object-cover"
                />
              )}
            </div>

            {d.gallery.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {d.gallery.map((g) => (
                  <button
                    key={g.index}
                    type="button"
                    onClick={() => d.setPhoto(g.index)}
                    aria-label={t('item.photoN', { n: g.index + 1 })}
                    aria-current={g.index === d.photo}
                    className={
                      g.index === d.photo
                        ? 'aspect-square overflow-hidden rounded-sm ring-2 ring-primary'
                        : 'aspect-square overflow-hidden rounded-sm ring-1 ring-border/[0.14]'
                    }
                    style={{ background: g.color }}
                  >
                    {g.url && <img src={g.url} alt="" loading="lazy" className="size-full object-cover" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Facts d={d} />

            <div className="flex items-center gap-2.5 border-t border-border/[0.14] pt-4">
              <Button
                size="lg"
                disabled={d.item.reserved}
                onClick={() => d.setOfferOpen(true)}
                data-i18n="item.offerSwap"
              >
                {t('item.offerSwap')}
              </Button>
              <Button variant="ghost" data-i18n="item.save">
                {t('item.save')}
              </Button>
              {d.item.eyeing > 0 && (
                <span className="ml-auto flex items-center gap-1.5 font-body text-sm text-muted-foreground">
                  <Eye className="size-4" aria-hidden="true" />
                  {t('item.eyeing', { count: d.item.eyeing })}
                  <InfoHint k="help.whyEyeing" side="left" />
                </span>
              )}
            </div>
          </div>
        </div>
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
