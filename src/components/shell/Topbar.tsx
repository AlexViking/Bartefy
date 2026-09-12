import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { UserAvatar } from '@/components/ui/user-avatar'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Wordmark } from '@/components/Wordmark'
import { ThemeToggle } from './ThemeToggle'
import { useT } from '@/i18n/T'
import { ADD_DESTINATION } from '@/navigation/destinations'
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** The bar across the top: brand, and the personal controls.
 *
 *  There is no search. Bartefy does not have a find-by-keyword feature and is
 *  not getting one -- what you can do is look at what is nearby, one card at a
 *  time, which is Discover. A search box that filtered nothing was promising a
 *  capability the product does not have.
 *
 *  It condenses on scroll: the height and the wordmark shrink and a hairline
 *  appears. Small, but it gives the page a sense of depth rather than a header
 *  that simply sits there.
 */
export function Topbar({
  onMenu,
  name,
  waiting = 0,
}: {
  /** Absent on tablet, where there is no rail width to toggle. The button is
   *  `md:hidden` anyway, so it never renders at that width. */
  onMenu?: () => void
  name: string
  /** Offers plus unread threads. Drives the dot on the bell. */
  waiting?: number
}) {
  const { t } = useT()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  /** The shell is the viewport now and <main> is what scrolls, so listening on
   *  window would never fire and the bar would sit at full height forever.
   *  Falls back to window for any layout that still scrolls the document. */
  useEffect(() => {
    const scroller = document.querySelector('main')
    const target: HTMLElement | Window = scroller ?? window
    const read = () =>
      setScrolled((scroller ? scroller.scrollTop : window.scrollY) > 8)
    read()
    target.addEventListener('scroll', read, { passive: true })
    return () => target.removeEventListener('scroll', read)
  }, [])

  return (
    // Height is a CSS transition, not a spring on a layout property: a spring
    // here re-lays out everything below the header on every frame of the
    // scroll, which is the other half of the jitter.
    <header
      style={{ height: scrolled ? 56 : 68, transition: 'height 240ms var(--ease-out)' }}
      className={cn(
        'sticky top-0 z-40 flex w-full items-center gap-3 px-4',
        'bg-background/85 backdrop-blur-md transition-shadow duration-200',
        // The rule is permanent, matching the rail's own right border, so the
        // bar reads as chrome rather than as content floating above content.
        // It used to appear only once scrolled, which left the topbar and the
        // first thing under it sharing an edge with nothing between them.
        'border-b border-border/[0.14]',
        // Scrolling adds depth rather than the line itself.
        scrolled && 'shadow-card',
      )}
    >
      {/* The rail is desktop-only, so the phone needs its own way in. */}
      <Button
        variant="ghost"
        size="icon"
        pill
        onClick={onMenu}
        className="md:hidden"
        aria-label={t('nav.menu')}
      >
        <Icon name="Menu" size={20} />
      </Button>

      {/* The real lockup, not type.
       *
       *  It is also scaled with transform rather than animated fontSize. A
       *  spring on fontSize re-lays out the text on every frame, which is what
       *  made the wordmark visibly jitter while scrolling -- transform is
       *  composited and never touches layout. */}
      <motion.button
        type="button"
        onClick={() => navigate('/discover')}
        initial={false}
        animate={{ scale: scrolled ? 0.86 : 1 }}
        transition={spring.gentle}
        style={{ transformOrigin: 'left center' }}
        aria-label={t('brand.name')}
        // Shown at every width now. It used to be md:hidden because the rail
        // carried the lockup -- but the rail collapses to 68px and the logo
        // went with it, so the app lost its name entirely at the width where
        // the topbar had 1400px of nothing in it. The brand belongs on the bar
        // that is always the same height, not on the one that folds away.
        className="shrink-0"
      >
        <Wordmark className="w-[124px]" />
      </motion.button>


      {/* Which build you are looking at, on every screen rather than buried in
          Settings. During a pilot the first question about any report is "which
          version?", and asking someone to go and find it is a question they
          often cannot answer.

          It is a label, not a control: no tap target, muted, and it sits before
          the controls so it never competes with the bell or the avatar. The
          full stamp with the commit stays in Settings -- this is the number a
          person can read out, not the diagnostic. */}
      <span
        // A version string is not translatable copy, so no data-i18n: it is
        // the same seven characters in every language.
        className="ml-auto select-none pr-1 font-body text-caption tabular-nums text-muted-foreground/60"
        title={`${__APP_VERSION__} · ${__APP_COMMIT__}`}
      >
        v{__APP_VERSION__}
      </span>

      {/* Only what belongs on a 390px bar: the bell, and the avatar on
          desktop where there is room. Language, theme and signing out moved
          into the menu -- six controls beside a search box overflowed the
          screen, and the avatar was cut in half at the right edge. */}
      <div className="flex items-center gap-0.5">
        {/* Listing a find, on the bar at desktop widths.
        
            It lived only at the foot of the rail, which put the app's primary
            creative action in the furthest corner of the screen from where
            anyone is looking -- and reduced it to a bare '+' the moment the
            rail collapsed. Brass, because it is the one action on this bar
            that makes something rather than navigating somewhere.

            md:flex: on a phone the tab bar already carries the brass Add, and
            two of them on one screen is one too many. */}
        <button
          type="button"
          onClick={() => navigate(ADD_DESTINATION.path)}
          className={cn(
            'mr-2 hidden h-10 items-center gap-2 rounded-pill bg-accent px-4 md:flex',
            'font-display text-[15px] font-semibold text-accent-foreground shadow-card',
            'transition-colors duration-fast ease-brand hover:bg-[var(--brass-hover)]',
            'focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45',
          )}
        >
          <Icon name="Plus" size={18} strokeWidth={2.4} />
          <span data-i18n="nav.add">{t('nav.add')}</span>
        </button>

        {/* The bell, which had no way in until now: the screen existed and
            nothing linked to it. The dot appears only when something is
            waiting -- a permanent badge trains people to ignore it. */}
        <button
          type="button"
          onClick={() => navigate('/notifications')}
          aria-label={t('notif.title')}
          className="relative flex size-11 items-center justify-center rounded-pill text-muted-foreground transition-colors duration-fast ease-brand hover:bg-foreground/[0.06] hover:text-primary"
        >
          <Icon name="Bell" size={20} />
          {waiting > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-2 top-2 size-2 rounded-pill bg-accent ring-2 ring-background"
            />
          )}
        </button>
        {/* Language then theme, in that order, then the avatar last -- the
            account control belongs at the end of the row, nearest the edge.
            On a phone these are in the menu behind the burger. */}
        <span className="hidden md:flex md:items-center md:gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </span>
        {/* Brass, matching the notification dot: the two account-coloured
            things on the bar read as a set. Profile is no longer a nav row,
            so this is now the way to it. */}
        <UserAvatar
          name={name}
          size="md"
          tone="accent"
          aria-label={t('nav.profile')}
          className="hidden cursor-pointer md:block"
          onClick={() => navigate('/profile')}
        />
      </div>
    </header>
  )
}
