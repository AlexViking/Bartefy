import { AppShell } from '@/components/shell/AppShell'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { UpgradeSheet } from '@/components/membership/UpgradeSheet'
import { T, useT } from '@/i18n/T'
import { DetailsSection, PhotosSection, WantsSection } from './sections'
import { useAddItem } from './useAddItem'

/** Listing a find, desktop shape: photos left, everything else right, all
 *  visible at once. A wide screen has room for the whole form, and stepping
 *  someone through three screens they could see in one would be busywork.
 */
export default function AddItemDesktop() {
  const a = useAddItem()
  const { t } = useT()

  return (
    <AppShell>
      <div className="grid h-[calc(100dvh-68px)] grid-cols-[520px_1fr]">
        <section className="overflow-y-auto border-r border-border/[0.14] p-8">
          <T as="h1" k="add.title" className="mb-5 font-display text-h2 text-foreground" />
          <PhotosSection a={a} columns={2} />
        </section>

        <section className="flex flex-col overflow-y-auto p-8">
          <div className="flex-1 space-y-6">
            <DetailsSection a={a} />
            <Separator />
            <WantsSection a={a} />
          </div>

          <div className="mt-8 flex items-center gap-3 border-t border-border/[0.14] pt-5">
            <Button size="lg" onClick={a.publish} disabled={!a.hasPhoto} data-i18n="add.publish">
              {t('add.publish')}
            </Button>
            <Button variant="ghost" size="lg" onClick={a.cancel} data-i18n="add.notNow">
              {t('add.notNow')}
            </Button>
            {!a.hasPhoto && (
              <T as="p" k="add.photoStepHelp" className="font-body text-sm text-muted-foreground" />
            )}
          </div>
        </section>
      </div>

      <UpgradeSheet open={a.capped} onOpenChange={a.setCapped} moment="live_finds" />
    </AppShell>
  )
}
