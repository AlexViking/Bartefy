import { AppShell } from '@/components/shell/AppShell'
import { Button } from '@/components/ui/button'
import { FlowSteps } from '@/components/guidance/FlowSteps'
import { UpgradeSheet } from '@/components/membership/UpgradeSheet'
import { T, useT } from '@/i18n/T'
import { DetailsSection, PhotosSection, WantsSection } from './sections'
import { useAddItem } from './useAddItem'

/** Listing a find, phone shape: one step at a time. Camera first, typing last
 *  — a wizard keeps a long form from looking like homework on a small screen.
 */
export default function AddItemMobile() {
  const a = useAddItem()
  const { t } = useT()

  return (
    <AppShell hideNav>
      <div className="flex min-h-dvh flex-col">
        <header className="flex flex-col gap-3 px-5 pb-3 pt-4">
          <FlowSteps steps={[...a.steps]} current={a.step} />
        </header>

        <main className="flex-1 space-y-4 overflow-y-auto px-5 pb-6">
          {a.stepId === 'photos' && (
            <>
              <T as="h1" k="add.photoStepTitle" className="font-display text-h2 leading-tight text-foreground" />
              <PhotosSection a={a} columns={3} />
            </>
          )}
          {a.stepId === 'details' && (
            <>
              <T as="h1" k="add.titleLabel" className="font-display text-h2 leading-tight text-foreground" />
              <DetailsSection a={a} />
            </>
          )}
          {a.stepId === 'wants' && (
            <>
              <T as="h1" k="add.wantsStepTitle" className="font-display text-h2 leading-tight text-foreground" />
              <WantsSection a={a} />
            </>
          )}
        </main>

        <footer className="flex flex-col gap-2 border-t border-border/[0.14] bg-card px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-4">
          {a.publishError && (
            <T
              as="p"
              k="add.publishFailed"
              className="text-center font-body text-sm text-destructive"
              role="alert"
            />
          )}
          {/* Say why the button is dead. A disabled control with no reason is
              a dead end — the person cannot tell what is missing. */}
          {!a.canAdvance && !a.uploading && (
            <T
              as="p"
              k={a.stepId === 'details' ? 'add.needDetails' : 'add.needPhoto'}
              className="text-center font-body text-sm text-muted-foreground"
            />
          )}
          {a.isLast ? (
            <Button
              size="lg"
              fullWidth
              onClick={a.publish}
              disabled={!a.canPublish || a.publishing}
              data-i18n="add.publish"
            >
              {a.publishing ? t('common.loading') : t('add.publish')}
            </Button>
          ) : (
            <Button
              size="lg"
              fullWidth
              disabled={!a.canAdvance}
              onClick={a.next}
              data-i18n="common.continue"
            >
              {t('common.continue')}
            </Button>
          )}
          <Button
            variant="ghost"
            fullWidth
            onClick={a.isFirst ? a.cancel : a.back}
            data-i18n={a.isFirst ? 'add.notNow' : 'common.back'}
          >
            {a.isFirst ? t('add.notNow') : t('common.back')}
          </Button>
        </footer>
      </div>

      <UpgradeSheet open={a.capped} onOpenChange={a.setCapped} moment="live_finds" />
    </AppShell>
  )
}
