import { ArrowLeft, Eye, Flag, Heart } from 'lucide-react'

import { useState } from 'react'
import { useNavigate } from 'react-router'

import { AppShell } from '@/components/shell/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { InfoHint } from '@/components/guidance/InfoHint'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { PhotoViewer } from '@/components/ui/photo-viewer'
import { OfferSheet } from '@/components/offer/OfferSheet'
import { ReportItemSheet } from '@/components/hunt/ReportItemSheet'
import { UpgradeSheet } from '@/components/membership/UpgradeSheet'
import type { UpgradeMoment } from '@/lib/membership'
import { T, useT } from '@/i18n/T'
import { Facts } from './Facts'
import { useItemDetail } from './useItemDetail'

/** The find, desktop shape: the photo and a thumbnail strip on the left, the
 *  facts and the decision on the right. Both are on screen at once, so the
 *  offer button needs no pinned bar.
 */
export default function ItemDetailDesktop() {
  const d = useItemDetail()
  const [reporting, setReporting] = useState(false)
  const [upgrade, setUpgrade] = useState<UpgradeMoment | null>(null)
  const { t } = useT()
  const navigate = useNavigate()

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
    <AppShell>
      <div className="mx-auto w-full max-w-[1160px] px-6 py-6">
        <div className="mb-4 flex items-center">
          <Button variant="ghost" size="sm" onClick={d.goBack} data-i18n="common.back">
            <ArrowLeft aria-hidden="true" />
            {t('common.back')}
          </Button>
          {/* Reporting is ALWAYS_FREE and belongs on every surface showing
              someone else's listing, not only the Hunt card. */}
          {!d.owned && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReporting(true)}
              className="ml-auto"
              data-i18n="item.report"
            >
              <Flag aria-hidden="true" />
              {t('item.report')}
            </Button>
          )}
        </div>

        <div className="grid gap-8 grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col gap-3">
            <div
              className="relative aspect-[4/3] w-full overflow-hidden rounded"
              style={{ background: current?.color }}
            >
              {current?.url && (
                // Click to open full screen -- see the note in the mobile file.
                <button
                  type="button"
                  onClick={() => d.setViewerOpen(true)}
                  aria-label={t('item.viewPhotos')}
                  className="size-full cursor-zoom-in"
                >
                  <img
                    src={current.url}
                    alt={t('a11y.photoOf', { title: d.item.title })}
                    className="size-full object-contain"
                  />
                </button>
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
                    {g.url && <img src={g.url} alt="" loading="lazy" className="size-full object-contain" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Facts d={d} />

            <div className="flex items-center gap-2.5 border-t border-border/[0.14] pt-4">
              {/* Ownership swaps the whole action set: you manage your own
                  listing and cannot offer a swap to yourself. */}
              {/* Four actions in a grid, per the pilot. Edit and renew are the
                  everyday pair; pause and remove take the find out of
                  circulation, so they sit together underneath. */}
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
                <>
                  <Button
                    size="lg"
                    disabled={d.item.reserved}
                    onClick={() => d.setOfferOpen(true)}
                    data-i18n="item.offerSwap"
                  >
                    {t('item.offerSwap')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => void d.toggleSave()}
                    aria-pressed={d.saved}
                    data-i18n={d.saved ? 'item.unsave' : 'item.save'}
                  >
                    <Heart
                      className={d.saved ? 'fill-current text-accent-foreground' : undefined}
                      aria-hidden="true"
                    />
                    {t(d.saved ? 'item.unsave' : 'item.save')}
                  </Button>
                </>
              )}
              {d.item.eyeing > 0 && (
                /* The tier sheet's strongest converter: "3 people want your
                   guitar", shown on YOUR listing at the moment the wanting is
                   concrete. The count is always free -- only the names are
                   behind the unlock, which keeps this a nudge and not a
                   hostage situation. */
                <span className="ml-auto flex items-center gap-1.5 font-body text-sm text-muted-foreground">
                  <Eye className="size-4" aria-hidden="true" />
                  {t('item.eyeing', { count: d.item.eyeing })}
                  {d.owned && !d.canSeeEyeing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUpgrade('someone_likes_yours')}
                      data-i18n="item.seeWho"
                    >
                      {t('item.seeWho')}
                    </Button>
                  )}
                  <InfoHint k="help.whyEyeing" side="left" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

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

      <UpgradeSheet
        open={!!upgrade}
        onOpenChange={(o) => !o && setUpgrade(null)}
        moment={upgrade ?? 'see_eyeing'}
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
