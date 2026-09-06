import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { UserAvatar } from '@/components/ui/user-avatar'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
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
}: {
  onMenu: () => void
  name: string
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
    <motion.header
      animate={{ height: scrolled ? 56 : 68 }}
      transition={spring.gentle}
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

      {/* Type, not the lockup: the illustrated mark is too detailed to read at
          this size, and it already sits in the sidebar. */}
      <motion.button
        type="button"
        onClick={() => navigate('/discover')}
        animate={{ fontSize: scrolled ? '1.05rem' : '1.25rem' }}
        transition={spring.gentle}
        className="font-display font-bold tracking-tight text-primary md:hidden"
      >
        bartefy
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

      <div className="ml-auto flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
        <UserAvatar
          name={name || 'Swapper'}
          size="md"
          className="cursor-pointer"
          onClick={() => navigate('/profile')}
        />
      </div>
    </motion.header>
  )
}
