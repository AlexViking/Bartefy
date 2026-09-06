import { ArrowLeft, Flag, Heart } from 'lucide-react'

import { useState } from 'react'
import { useNavigate } from 'react-router'

import { AppShell } from '@/components/shell/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { PhotoViewer } from '@/components/ui/photo-viewer'
import { OfferSheet } from '@/components/offer/OfferSheet'
import { ReportItemSheet } from '@/components/hunt/ReportItemSheet'
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
  const navigate = useNavigate()
  const [reporting, setReporting] = useState(false)

  if (d.notFound) {
    return (
      <AppShell>
        <div className="flex min-h-dvh items-center justify-center px-5">
          <EmptyState
            title="item.notFoundTitle"
            body="item.notFoundBody"
            actionLabel="nav.discover"
            onAction={() => navigate('/discover')}
          />
        </div>
      </AppShell>
    )
  }

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
            // Tapping the photo opens it full screen. A listing photo is the
            // only thing anyone has to judge a find by, and a card-sized one
            // cannot answer "is that a chip or a reflection?".
            <button
              type="button"
              onClick={() => d.setViewerOpen(true)}
              aria-label={t('item.viewPhotos')}
              className="size-full"
            >
              <img
                src={current.url}
                alt={t('a11y.photoOf', { title: d.item.title })}
                className="size-full object-contain"
              />
            </button>
          )}
          <button
            type="button"
            onClick={d.goBack}
            aria-label={t('common.back')}
            className="absolute left-3.5 top-3.5 flex size-9 items-center justify-center rounded-pill bg-card/90 text-foreground backdrop-blur-sm"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          {/* Reporting is ALWAYS_FREE and the wireframe puts a flag on every
              surface that shows someone else's listing. It was only ever on
              the Hunt card, so a find opened from anywhere else could not be
              reported at all. Hidden on your own listing: there is no one to
              report but yourself. */}
          {!d.owned && (
            <button
              type="button"
              onClick={() => setReporting(true)}
              aria-label={t('item.report')}
              className="absolute right-3.5 top-3.5 flex size-9 items-center justify-center rounded-pill bg-card/90 text-muted-foreground backdrop-blur-sm"
            >
              <Flag className="size-4" aria-hidden="true" />
            </button>
          )}

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
        {/* Ownership swaps the whole action set: you manage your own listing
            and cannot offer a swap to yourself. */}
        {/* Four actions in a grid, per the pilot. Edit and renew are the
            everyday pair; pause and remove take the find out of circulation,
            so they sit together underneath. */}
        {d.owned ? (
          <div className="grid w-full grid-cols-2 gap-2">
            <Button onClick={d.goEdit} data-i18n="item.manage">
              {t('item.manage')}
            </Button>
            <Button variant="ghost" onClick={d.renew} data-i18n="item.renew">
              {t('item.renew')}
            </Button>
            <Button
              variant="ghost"
              onClick={d.togglePause}
              data-i18n={d.paused ? 'item.unpause' : 'item.pause'}
            >
              {t(d.paused ? 'item.unpause' : 'item.pause')}
            </Button>
            <Button variant="ghost" onClick={() => d.setRemoving(true)} data-i18n="item.remove">
              {t('item.remove')}
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            fullWidth
            disabled={d.item.reserved}
            onClick={() => d.setOfferOpen(true)}
            data-i18n="item.offerSwap"
          >
            {t('item.offerSwap')}
          </Button>
        )}
        <button
          type="button"
          aria-label={t('item.save')}
          className="flex size-12 shrink-0 items-center justify-center rounded-pill border-[1.5px] border-border/[0.14] text-muted-foreground"
        >
          <Heart className="size-[18px]" aria-hidden="true" />
        </button>
      </div>

      {/* Removing is soft -- the row stays, its status changes -- but it is
          still the listing disappearing from every deck, so it asks first. */}
      <ResponsiveSheet
        open={d.removing}
        onOpenChange={d.setRemoving}
        title="item.removeTitle"
        description="item.removeBody"
        footer={
          <div className="flex w-full flex-col gap-2">
            <Button fullWidth size="lg" onClick={d.removeItem} data-i18n="item.remove">
              {t('item.remove')}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => d.setRemoving(false)} data-i18n="common.cancel">
              {t('common.cancel')}
            </Button>
          </div>
        }
      >
        <span className="sr-only">{t('item.removeBody')}</span>
      </ResponsiveSheet>

      <PhotoViewer
        open={d.viewerOpen}
        photos={d.realPhotos}
        index={d.photo}
        onIndexChange={d.setPhoto}
        onClose={() => d.setViewerOpen(false)}
        title={d.item.title}
      />

      <ReportItemSheet
        open={reporting}
        onOpenChange={setReporting}
        itemId={d.item.id}
        itemTitle={d.item.title}
        ownerId={d.owner.id}
        ownerName={d.owner.name}
        onDone={() => setReporting(false)}
      />

      <OfferSheet
        open={d.offerOpen}
        targetTitle={d.item.title}
        mine={d.myOfferables}
        onCancel={() => d.setOfferOpen(false)}
        onConfirm={d.sendOffer}
        sending={d.sending}
        errorKey={d.offerError}
        onAdd={d.goAdd}
      />
    </AppShell>
  )
}
