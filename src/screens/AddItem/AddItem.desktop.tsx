import { AppShell } from '@/components/shell/AppShell'
import { TopBarContext } from '@/components/shell/TopBarContext'
import { useShellData } from '@/components/shell/useShellData'
import { UpgradeSheet } from '@/components/membership/UpgradeSheet'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { T, useT } from '@/i18n/T'
import { DetailsSection, PageTitle, PhotosSection, PublishedSection, useMissing, WantsSection } from './sections'
import { useAddItem } from './useAddItem'

/** Add a find on desktop and tablet (proposal B): one card, photos on the
 *  left, everything else on the right, and the button to finish pinned to the
 *  foot so it is never below the fold. */
export default function AddItemDesktop() {
  const a = useAddItem()
  const { t } = useT()
  const shell = useShellData()
  const missing = useMissing(a)

  return (
    <AppShell>
      <TopBarContext>
        <button type="button" onClick={a.cancel} aria-label={t('add.notNow')} className="-ml-2 grid size-10 place-items-center rounded-pill hover:bg-secondary">
          <Icon name="X" size={22} />
        </button>
        <PageTitle />
        <span className="whitespace-nowrap font-body text-body-sm text-muted-foreground">{t('add.onTable', { n: shell.liveFinds })}</span>
      </TopBarContext>

      <div className="flex h-full min-h-0 px-6 py-4 lg:px-8">
        <div className="flex min-h-0 w-full flex-col overflow-hidden rounded-card bg-card ring-1 ring-input">
          {a.published ? (
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto">
              <PublishedSection a={a} />
            </div>
          ) : (
            <>
              <div className="grid min-h-0 flex-1 grid-cols-[minmax(320px,440px)_1fr]">
                <section className="min-h-0 overflow-y-auto border-r border-input p-6">
                  <PhotosSection a={a} />
                </section>
                <section className="min-h-0 space-y-8 overflow-y-auto p-6">
                  <DetailsSection a={a} wide />
                  <WantsSection a={a} />
                </section>
              </div>
              <footer className="flex shrink-0 items-center gap-3 border-t border-input px-6 py-4">
                <p className="flex-1 font-body text-body-sm text-muted-foreground">
                  {a.publishError ? (
                    <T as="span" k="add.publishFailed" className="text-foreground" />
                  ) : missing ? (
                    <T as="span" k={missing} />
                  ) : (
                    <T as="span" k="add.onlyPhoto" />
                  )}
                </p>
                <Button variant="ghost" onClick={a.cancel}>
                  <T as="span" k="add.notNow" />
                </Button>
                <Button size="lg" onClick={a.publish} disabled={!a.canPublish || a.publishing}>
                  <Icon name="Store" size={18} />
                  {a.publishing ? t('common.loading') : t('add.publish')}
                </Button>
              </footer>
            </>
          )}
        </div>
      </div>

      <UpgradeSheet open={a.capped} onOpenChange={a.setCapped} moment="live_finds" />
    </AppShell>
  )
}
