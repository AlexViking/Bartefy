import { OrzomiMark } from '@/components/ui/orzomi'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** "A product of ORZOMI" — the parent-company line.
 *
 *  One wording everywhere, deliberately. "Powered by" reads as a technical
 *  dependency, which is right for infrastructure and wrong for a consumer swap
 *  app; mixing four variants across four screens reads as four different
 *  relationships rather than one company.
 *
 *  The mark is sized by height (h-4 = 16px) because it is taller than it is
 *  wide — the opposite of the Bartefy wordmark, which is sized by width.
 *  currentColor means the whole line, mark included, takes the muted
 *  foreground and is correct in both themes from one asset.
 *
 *  Not a link. ORZOMI has a site, but a footer credit that navigates people
 *  out of a half-finished sign-in is a leak, not a credit.
 */
export function OrzomiByline({ className }: { className?: string }) {
  const { t } = useT()

  return (
    <p
      data-i18n="brand.productOf"
      className={cn(
        'flex items-center justify-center gap-1.5 font-body text-caption text-muted-foreground/70',
        className,
      )}
    >
      {/* The copy is one string with the company name inside it, so a
          translation can put the name wherever its grammar needs it. The mark
          sits before the line rather than replacing the word. */}
      <OrzomiMark className="h-[26px] w-auto shrink-0" />
      {t('brand.productOf')}
    </p>
  )
}
