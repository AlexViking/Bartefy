import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { T, useT } from '@/i18n/T'

/** Catches a render error and shows a card instead of a blank page.
 *
 *  React unmounts the WHOLE tree when a render throws and nothing catches it,
 *  so without a boundary one bad value anywhere blanks the entire app. That is
 *  not hypothetical here: the Offers screen went black twice -- once from a
 *  query key collision, once from a persisted cache entry written by an older
 *  build -- and both times the app showed nothing at all rather than one broken
 *  screen. A boundary would have contained either to its own card.
 *
 *  Deliberately a class: `componentDidCatch` has no hook equivalent, and this
 *  is the one place in the codebase that has to be one.
 */
type Props = {
  children: React.ReactNode
  /** Remounts the subtree when it changes -- pass the route key, so navigating
   *  away from a broken screen clears the error instead of stranding the person
   *  on it. */
  resetKey?: string
  /** Names the failing area in the log. Not shown to anyone. */
  label?: string
}

type State = { error: Error | null }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // The only record that this happened. There is no error reporting service
    // wired up yet, so this console line is what someone reads out of a device
    // log when a tester says "the screen went blank". Keep the component stack:
    // the message alone rarely says which screen threw.
    console.error(
      `[bartefy] render error${this.props.label ? ` in ${this.props.label}` : ''}:`,
      error,
      info.componentStack,
    )
  }

  componentDidUpdate(prev: Props) {
    // A new route means a new screen; whatever threw is no longer mounted.
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    if (!this.state.error) return this.props.children
    return <ErrorCard onRetry={() => this.setState({ error: null })} />
  }
}

/** The fallback. A function component so it can use the translator -- the
 *  class above cannot, and this copy has to obey the i18n invariant like
 *  everything else the user reads. */
function ErrorCard({ onRetry }: { onRetry: () => void }) {
  const { t } = useT()
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-pill bg-accent/20">
        <Icon name="ShieldAlert" size={26} className="text-accent-foreground" />
      </span>
      <T as="h2" k="error.screenTitle" className="font-display text-h3 text-foreground" />
      <T
        as="p"
        k="error.screenBody"
        className="max-w-[42ch] font-body text-body leading-relaxed text-muted-foreground"
      />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={onRetry} data-i18n="error.retry">
          {t('error.retry')}
        </Button>
        {/* A plain link, not navigate(): if the router itself is what threw,
            a client-side navigation would throw again on the way out. */}
        <Button variant="ghost" asChild data-i18n="error.goHome">
          <a href="/discover">{t('error.goHome')}</a>
        </Button>
      </div>
    </div>
  )
}
