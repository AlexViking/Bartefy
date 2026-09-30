import { AppShell } from '@/components/shell/AppShell'
import { UpgradeSheet } from '@/components/membership/UpgradeSheet'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { T, useT } from '@/i18n/T'
import { cn } from '@/lib/utils'
import { DetailsSection, PhotosSection, PublishedSection, useMissing, WantsSection } from './sections'
import { useAddItem } from './useAddItem'

/** Add a find on a phone (proposal B): three short steps -- the photo, what
 *  it is, what you would like -- with the one button pinned to the bottom.
 *  The frame's top bar stays; the tab bar steps aside (AppShell), because the
 *  bottom belongs to Next. */
export default function AddItemMobile() {
  const a = useAddItem()
  const { t } = useT()
  const missing = useMissing(a)

  if (a.published) {
    return (
      <AppShell>
        <PublishedSection a={a} />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-center gap-3 px-4 pb-2 pt-3">
          <button
            type="button"
            onClick={a.goBack}
            aria-label={a.isFirst ? t('add.notNow') : t('common.back')}
            className="-ml-2 grid size-10 place-items-center rounded-pill hover:bg-secondary"
          >
            <Icon name={a.isFirst ? 'X' : 'ArrowLeft'} size={22} />
          </button>
          <T as="h1" k="add.title" className="flex-1 font-display text-headline-sm text-foreground" />
          <div className="flex gap-1.5" aria-label={t('common.stepOf', { current: a.step + 1, total: a.steps.length })}>
            {a.steps.map((s, i) => (
              <span key={s.id} className={cn('h-1.5 w-8 rounded-pill', i <= a.step ? 'bg-primary' : 'bg-secondary')} />
            ))}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-2">
          {a.stepId === 'photos' && <PhotosSection a={a} />}
          {a.stepId === 'details' && <DetailsSection a={a} wide={false} />}
          {a.stepId === 'wants' && <WantsSection a={a} />}
        </div>

        <footer className="flex shrink-0 items-center gap-3 border-t border-input bg-card px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
          <p className="min-w-0 flex-1 font-body text-[13px] leading-4 text-muted-foreground">
            {a.publishError ? <T as="span" k="add.publishFailed" className="text-foreground" /> : !a.canAdvance && missing ? <T as="span" k={missing} /> : null}
          </p>
          {a.isLast ? (
            <Button size="lg" onClick={a.publish} disabled={!a.canPublish || a.publishing}>
              {a.publishing ? t('common.loading') : t('add.publish')}
            </Button>
          ) : (
            <Button size="lg" onClick={a.next} disabled={!a.canAdvance}>
              <T as="span" k="common.next" />
              <Icon name="ArrowRight" size={18} />
            </Button>
          )}
        </footer>
      </div>

      <UpgradeSheet open={a.capped} onOpenChange={a.setCapped} moment="live_finds" />
    </AppShell>
  )
}
