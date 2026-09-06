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
import { spring } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** The bar across the top: brand, search, and the personal controls.
 *
 *  Search lives here rather than inside a screen. It was previously reachable
 *  only from Browse, which meant "Browse" was really two features -- a grid and
 *  a search box -- sharing one nav slot and one confusing name.
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
  onMenu: () => void
  name: string
  /** Offers plus unread threads. Drives the dot on the bell. */
  waiting?: number
}) {
  const { t } = useT()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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
        scrolled ? 'border-b border-border/[0.14]' : 'border-b border-transparent',
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
        animate={{ scale: scrolled ? 0.86 : 1 }}
        transition={spring.gentle}
        style={{ transformOrigin: 'left center' }}
        aria-label={t('brand.name')}
        className="shrink-0 md:hidden"
      >
        <Wordmark className="w-[124px]" />
      </motion.button>

      <button
        type="button"
        onClick={() => navigate('/items?focus=1')}
        className={cn(
          'group ml-2 hidden max-w-[420px] flex-1 items-center gap-2 rounded-pill border-[1.5px] border-border/[0.14] bg-card px-4 py-2 md:flex',
          'text-left font-body text-sm text-muted-foreground',
          'transition-colors duration-fast hover:border-primary/40',
        )}
      >
        <Icon name="Search" size={16} />
        <span data-i18n="nav.search" className="flex-1 truncate">
          {t('nav.search')}
        </span>
      </button>

      {/* Only what belongs on a 390px bar: the bell, and the avatar on
          desktop where there is room. Language, theme and signing out moved
          into the menu -- six controls beside a search box overflowed the
          screen, and the avatar was cut in half at the right edge. */}
      <div className="ml-auto flex items-center gap-0.5">
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
        {/* The rail carries these on desktop; on a phone they are in the
            menu behind the burger, which is what the burger is for. */}
        <span className="hidden md:flex md:items-center md:gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </span>
        <UserAvatar
          name={name || 'Swapper'}
          size="md"
          className="hidden cursor-pointer md:block"
          onClick={() => navigate('/profile')}
        />
      </div>
    </header>
  )
}
