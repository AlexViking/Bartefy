import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Icon } from '@/components/ui/icon'
import { SUPPORTED_LANGUAGES, loadLanguage } from '@/i18n'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** Language is a first-class control, not buried in Settings — Bartefy is a
 *  local, neighbourhood app and the person next to you may not read English.
 *  Packs load on demand, so switching downloads only what it needs.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation()
  const { t } = useT()
  const current = i18n.language?.split('-')[0] ?? 'en'

  return (
    <DropdownMenu>
      {/* A globe, sized and shaped exactly like the bell and the theme toggle
          beside it. It used to be a wide bordered pill carrying "EN", which
          made one control in a row of round icons look like a form field. The
          current language is in the menu, ticked. */}
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t('nav.language')}
          className={cn(
            'flex size-11 items-center justify-center rounded-pill text-muted-foreground',
            'transition-colors duration-fast ease-brand hover:bg-foreground/[0.06] hover:text-primary',
            className,
          )}
        >
          <Icon name="Globe" size={20} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onSelect={() => void loadLanguage(lang.code)}
            className="flex items-center justify-between gap-3 font-body"
          >
            <span>{lang.nativeLabel}</span>
            {current === lang.code && <Check className="size-4 text-primary" aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
