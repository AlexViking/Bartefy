import { Check, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
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
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn('gap-1.5', className)} aria-label={t('nav.language')}>
          <Languages aria-hidden="true" />
          <span className="uppercase">{current}</span>
        </Button>
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
