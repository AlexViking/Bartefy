import { AppShell } from '@/components/shell/AppShell'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { UpgradeSheet } from '@/components/membership/UpgradeSheet'
import { T, useT } from '@/i18n/T'
import { DetailsSection, PhotosSection, WantsSection , PublishedSection } from './sections'
import { useAddItem } from './useAddItem'

/** Listing a find, desktop shape: photos left, everything else right, all
 *  visible at once. A wide screen has room for the whole form, and stepping
 *  someone through three screens they could see in one would be busywork.
 */
export default function AddItemDesktop() {
  const a = useAddItem()
  const { t } = useT()

  // The listing exists: show what happened to it instead of navigating away
  // silently, which left people wondering whether it had worked at all.
  if (a.published) {
    return (
      <AppShell hideNav>
        <div className="mx-auto w-full max-w-[560px] px-5 py-6">
          <PublishedSection state={a.published} onDone={a.goToItems} onAnother={a.listAnother} />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="grid h-[calc(100dvh-68px)] grid-cols-[520px_1fr]">
        <section className="overflow-y-auto border-r border-border/[0.14] p-8">
          <T as="h1" k="add.title" className="mb-5 font-display text-h2 text-foreground" />
          <PhotosSection a={a} columns={2} />
        </section>

        {/* The form scrolls; the publish bar does not.
            
            It used to sit at the END of this scrolling column, so on a laptop
            the only way to reach the button that finishes the job was to
            scroll past every category chip. A primary action must be visible
            the whole time the form is being filled in -- min-h-0 on the
            scroller and a shrink-0 bar below it is what pins it. */}
        <section className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-8">
            <DetailsSection a={a} />
            <Separator />
            <WantsSection a={a} />
          </div>

          {a.publishError && (
            <T
              as="p"
              k="add.publishFailed"
              className="shrink-0 px-8 pt-3 text-center font-body text-sm text-destructive"
              role="alert"
            />
          )}
          <div className="flex shrink-0 items-center gap-3 border-t border-border/[0.14] bg-background px-8 py-5">
            <Button
              size="lg"
              onClick={a.publish}
              disabled={!a.canPublish || a.publishing}
              data-i18n="add.publish"
            >
              {a.publishing ? t('common.loading') : t('add.publish')}
            </Button>
            <Button variant="ghost" size="lg" onClick={a.cancel} data-i18n="add.notNow">
              {t('add.notNow')}
            </Button>
            {/* This layout shows every section at once, so it names whichever
                requirement is still outstanding rather than a step. Details
                first: it is the one that produced a nameless live listing. */}
            {!a.canPublish && !a.uploading && (
              <T
                as="p"
                k={!a.detailsComplete ? 'add.needDetails' : 'add.needPhoto'}
                className="font-body text-sm text-muted-foreground"
              />
            )}
          </div>
        </section>
      </div>

      <UpgradeSheet open={a.capped} onOpenChange={a.setCapped} moment="live_finds" />
    </AppShell>
  )
}
