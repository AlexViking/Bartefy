import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Icon, type IconName } from '@/components/ui/icon'
import { UserAvatar } from '@/components/ui/user-avatar'
import { OrzomiByline } from '@/components/OrzomiByline'
import { SUPPORTED_LANGUAGES, loadLanguage } from '@/i18n'
import { T, useT } from '@/i18n/T'
import { TIER_PRICES } from '@/lib/points'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'
import { STAFF_DESTINATIONS } from '@/navigation/destinations'
import { ShellSheet, useSignOut } from './ShellSheet'
import { cap, type ShellData } from './useShellData'

const TIER_TONE = {
  hunter: 'text-muted-foreground',
  collector: 'text-foreground',
  curator: 'text-primary',
} as const

/** Who you are: the display name, else the email. A name is user data, so it
 *  never carries a translation key. */
function who(data: ShellData) {
  return data.name || data.email
}

/** The account button in the desktop/tablet top bar. Compact (tablet) is the
 *  avatar alone; desktop adds the name and tier. */
export function AccountMenu({ data, compact }: { data: ShellData; compact: boolean }) {
  const { t } = useT()
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const { theme, toggle } = useTheme()
  const signOut = useSignOut()
  const current = i18n.language?.split('-')[0] ?? 'en'

  const row = 'flex h-11 items-center gap-3 px-4 font-body text-body-md'
  const go = (to: string) => navigate(to)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('nav.profile')}
          className="group flex h-11 items-center gap-2 rounded-pill pl-1 pr-2 outline-none transition-colors duration-fast ease-brand hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring/50 data-[state=open]:bg-secondary"
        >
          <UserAvatar name={who(data)} src={data.avatar} size="sm" tone="accent" />
          {!compact && (
            <span className="flex flex-col text-left leading-tight">
              {/* User data: no key. */}
              <span className="max-w-[160px] truncate font-body text-label-md text-foreground">{who(data)}</span>
              <T as="span" k={`shell.tier_${data.tier}`} className={cn('font-body text-label-sm', TIER_TONE[data.tier])} />
            </span>
          )}
          <Icon
            name="ChevronDown"
            size={18}
            className="text-muted-foreground transition-transform duration-fast ease-brand group-data-[state=open]:rotate-180"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={8} className="w-64 overflow-hidden rounded-card p-0">
        <div className="flex items-center gap-3 border-b border-input px-4 py-3">
          <UserAvatar name={who(data)} src={data.avatar} size="md" tone="accent" />
          <span className="min-w-0">
            <span className="block truncate font-body text-label-lg text-foreground">{who(data)}</span>
            <span className={cn('block font-body text-label-sm', TIER_TONE[data.tier])}>
              {t('shell.tierLine', { tier: t(`shell.tier_${data.tier}`) })}
            </span>
          </span>
        </div>

        <div className="py-1">
          <MenuRow icon="User" k="nav.profile" onSelect={() => go('/profile')} className={row} />
          <MenuRow icon="Settings" k="nav.settings" onSelect={() => go('/settings')} className={row} />
          {data.isStaff &&
            STAFF_DESTINATIONS.map((d) => (
              <MenuRow key={d.id} icon={d.icon} k={d.label} onSelect={() => go(d.path)} className={row} staff />
            ))}
          <DropdownMenuSeparator className="my-1 bg-input" />

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className={cn(row, 'rounded-none')}>
              <Icon name="Languages" size={20} className="text-muted-foreground" />
              <T as="span" k="nav.language" className="flex-1" />
              <span className="rounded-pill bg-secondary px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.05em]">
                {current}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-[180px]">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onSelect={() => void loadLanguage(lang.code)}
                  className="flex items-center justify-between gap-3 font-body"
                >
                  {/* A language's own name is not translated. */}
                  <span>{lang.nativeLabel}</span>
                  {lang.code === current && <Icon name="Check" size={16} className="text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuItem
            onSelect={(e) => {
              // Keep the menu open: the page repaints behind it, which is the
              // point of the control.
              e.preventDefault()
              toggle()
            }}
            className={cn(row, 'rounded-none')}
          >
            <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={20} className="text-muted-foreground" />
            <T as="span" k={theme === 'dark' ? 'theme.switchToLight' : 'theme.switchToDark'} />
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1 bg-input" />
          <MenuRow icon="LogOut" k="shell.signOut" onSelect={() => void signOut()} className={row} />
        </div>

        <div className="flex flex-col gap-2 border-t border-input bg-background px-4 py-3">
          <OrzomiByline className="self-start text-[12px]" />
          {/* A version string is the same in every language: no key. */}
          <span className="font-body text-[11px] text-muted-foreground">
            Bartefy v{__APP_VERSION__} · {__APP_COMMIT__}
          </span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MenuRow({
  icon,
  k,
  onSelect,
  className,
  staff = false,
}: {
  icon: IconName
  k: string
  onSelect: () => void
  className: string
  staff?: boolean
}) {
  return (
    <DropdownMenuItem onSelect={onSelect} className={cn(className, 'rounded-none')}>
      <Icon name={icon} size={20} className="text-muted-foreground" />
      <T as="span" k={k} className="flex-1" />
      {staff && (
        <T as="span" k="shell.staffOnly" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" />
      )}
    </DropdownMenuItem>
  )
}

/** The phone's "You" tab: everything about you, nothing about where to go --
 *  the same list as the desktop account menu, plus the two destinations that
 *  have no tab of their own (Points & Tiers, Admirers). */
export function YouSheet({
  data,
  open,
  onOpenChange,
}: {
  data: ShellData
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useT()
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const { theme, toggle } = useTheme()
  const signOut = useSignOut()
  const [langOpen, setLangOpen] = useState(false)
  const current = i18n.language?.split('-')[0] ?? 'en'
  const toGo = Math.max(0, TIER_PRICES.collector - data.points)

  const go = (to: string) => {
    onOpenChange(false)
    navigate(to)
  }
  const row = 'flex h-14 w-full items-center gap-3 px-5 text-left font-body text-[15px] text-foreground active:bg-background'
  const chev = <Icon name="ChevronRight" size={20} className="text-muted-foreground" />

  return (
    <ShellSheet open={open} onOpenChange={onOpenChange} title="shell.tab_you">
      <button type="button" onClick={() => go('/profile')} className="flex w-full items-center gap-3 px-5 py-3 text-left">
        <UserAvatar name={who(data)} src={data.avatar} size="lg" tone="accent" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-body text-[16px] font-bold leading-6 text-foreground">{who(data)}</span>
          <span className="block font-body text-body-sm text-muted-foreground">
            {t('shell.tierLine', { tier: t(`shell.tier_${data.tier}`) })} · {t('shell.viewProfile')}
          </span>
        </span>
        {chev}
      </button>

      <button
        type="button"
        onClick={() => go('/points')}
        className="mx-4 my-2 flex w-[calc(100%-2rem)] items-center gap-3 rounded-card bg-background px-4 py-3 text-left"
      >
        <Icon name="Coins" size={24} className="text-foreground" />
        <span className="flex-1">
          <span className="block font-body text-[16px] font-bold leading-6 text-foreground">
            {data.points} {t('shell.pts')}
          </span>
          <span className="block font-body text-body-sm text-muted-foreground">
            {toGo > 0 ? t('shell.pointsLine', { n: toGo }) : t('shell.nav_points')}
          </span>
        </span>
        {chev}
      </button>

      <div className="mx-5 my-1 h-px bg-input" />
      <button type="button" onClick={() => go('/admirers')} className={row}>
        <Icon name="Heart" size={22} className="text-muted-foreground" />
        <T as="span" k="shell.nav_admirers" className="flex-1" />
        {data.admirers > 0 && (
          <span className="grid h-5 min-w-[22px] place-items-center rounded-pill bg-coral px-1.5 text-[11px] font-bold leading-none text-ink">
            {cap(data.admirers)}
          </span>
        )}
        {chev}
      </button>
      <button type="button" onClick={() => go('/profile')} className={row}>
        <Icon name="User" size={22} className="text-muted-foreground" />
        <T as="span" k="nav.profile" className="flex-1" />
        {chev}
      </button>
      <button type="button" onClick={() => go('/settings')} className={row}>
        <Icon name="Settings" size={22} className="text-muted-foreground" />
        <T as="span" k="nav.settings" className="flex-1" />
        {chev}
      </button>
      {data.isStaff &&
        STAFF_DESTINATIONS.map((d) => (
          <button key={d.id} type="button" onClick={() => go(d.path)} className={row}>
            <Icon name={d.icon} size={22} className="text-muted-foreground" />
            <T as="span" k={d.label} className="flex-1" />
            <T as="span" k="shell.staffOnly" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground" />
            {chev}
          </button>
        ))}

      <button type="button" onClick={() => setLangOpen((v) => !v)} aria-expanded={langOpen} className={row}>
        <Icon name="Languages" size={22} className="text-muted-foreground" />
        <T as="span" k="nav.language" className="flex-1" />
        <span className="rounded-pill bg-secondary px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.05em]">
          {current}
        </span>
      </button>
      {langOpen && (
        <div role="menu" className="mx-4 mb-2 rounded-card border border-input py-1">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              role="menuitemradio"
              aria-checked={lang.code === current}
              onClick={() => void loadLanguage(lang.code)}
              className="flex h-11 w-full items-center gap-3 px-3 text-left font-body text-[15px] text-foreground"
            >
              <span className="w-7 text-[11px] font-bold uppercase tracking-[0.05em] text-muted-foreground">{lang.code}</span>
              <span className="flex-1">{lang.nativeLabel}</span>
              {lang.code === current && <Icon name="Check" size={18} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
      <button type="button" onClick={toggle} className={row}>
        <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={22} className="text-muted-foreground" />
        <T as="span" k={theme === 'dark' ? 'theme.switchToLight' : 'theme.switchToDark'} className="flex-1" />
      </button>

      <div className="mx-5 my-1 h-px bg-input" />
      <button type="button" onClick={() => void signOut()} className={row}>
        <Icon name="LogOut" size={22} className="text-muted-foreground" />
        <T as="span" k="shell.signOut" className="flex-1" />
      </button>
      <div className="flex flex-col gap-2 px-5 pb-5 pt-2">
        <OrzomiByline className="self-start text-[12px]" />
        <span className="font-body text-[11px] text-muted-foreground">
          Bartefy v{__APP_VERSION__} · {__APP_COMMIT__}
        </span>
      </div>
    </ShellSheet>
  )
}
