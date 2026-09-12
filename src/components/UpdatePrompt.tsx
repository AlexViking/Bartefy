import { useRegisterSW } from 'virtual:pwa-register/react'
import { motion, AnimatePresence } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { T, useT } from '@/i18n/T'
import { spring } from '@/lib/motion'

/** "A new version is ready."
 *
 *  registerType is 'autoUpdate', which installs a new service worker in the
 *  background -- but the PAGE keeps running the code it loaded with until
 *  something reloads it. On a phone nobody reloads a PWA; they switch apps and
 *  come back, and the tab can live for weeks. So a shipped fix reached people
 *  whenever they happened to cold-start the app, which for some is never.
 *
 *  This is the in-app answer rather than a push, because push is not available
 *  (the FCM legacy endpoint is dead) and because a version notice does not
 *  belong in a notification tray anyway: it is only actionable while the app
 *  is open, which is exactly when this appears.
 *
 *  Deliberately dismissible and never automatic. Reloading out from under
 *  someone mid-swipe -- or mid-message -- would lose what they were doing, and
 *  an update is never urgent enough to justify that.
 */
export function UpdatePrompt() {
  const { t } = useT()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError(error) {
      // A service worker that fails to register is not worth a dialog -- the
      // app works without it -- but it IS worth a line, because otherwise the
      // update prompt silently never appears and nobody knows why.
      console.error('[bartefy] service worker registration failed', error)
    },
  })

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={spring.gentle}
          role="status"
          /* Above the tab bar on a phone, clear of the home indicator. z-50
             puts it over the shell but under sheets and dialogs, which are
             modal and must not be covered by a notice. */
          className="fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom))] z-50 flex items-center gap-3 rounded-card border border-border/[0.14] bg-card p-3 shadow-float md:inset-x-auto md:right-5 md:bottom-5 md:max-w-[380px]"
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <T as="span" k="update.title" className="font-display text-sm font-semibold text-foreground" />
            <T as="span" k="update.body" className="font-body text-xs text-muted-foreground" />
          </span>
          <Button
            size="sm"
            onClick={() => updateServiceWorker(true)}
            data-i18n="update.reload"
          >
            {t('update.reload')}
          </Button>
          <button
            type="button"
            onClick={() => setNeedRefresh(false)}
            aria-label={t('common.dismiss')}
            className="shrink-0 rounded-pill p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
