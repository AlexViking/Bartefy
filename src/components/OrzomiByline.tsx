import { OrzomiMark } from '@/components/ui/orzomi'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** "A product of ORZOMI" — the parent-company credit.
 *
 *  One wording everywhere, deliberately. "Powered by" reads as a technical
 *  dependency, which is right for infrastructure and wrong for a consumer swap
 *  app; mixing variants across screens reads as several different
 *  relationships rather than one company.
 *
 *  A link to orzomi.com: the point of a parent-company credit is that someone
 *  can go and find out who the parent company is, and a credit nobody can
 *  follow is decoration. target=_blank keeps the sign-in page where it is, and
 *  rel="noopener noreferrer" is required with it -- without noopener the new
 *  tab gets a handle on this window.
 *
 *  NO GLOW. One was added on request and then removed on sight: behind a mark
 *  that is mostly empty frame, a soft radial reads as a rectangular smudge
 *  rather than a light, and it competed with the sign-up button it sits under.
 *  The asset itself is clean -- an inline SVG with no background layer and no
 *  baked shadow -- so nothing here needs mix-blend-mode or a re-export.
 *
 *  The whole block is muted by OPACITY rather than by picking a dimmer colour.
 *  That is what keeps one rule working on both themes: parchment and near
 *  black need opposite adjustments to a fixed grey, but the same 55% of the
 *  foreground sits back correctly on either.
 */
export function OrzomiByline({ className }: { className?: string }) {
  const { t } = useT()

  return (
    <a
      href="https://orzomi.com"
      target="_blank"
      rel="noopener noreferrer"
      data-i18n="brand.productOf"
      className={cn(
        /* items-center is the alignment fix: the mark is 34px and the text is
           ~15px, so without it the baseline pulled the line toward the bottom
           of the mark instead of centring on its axis. */
        'group inline-flex items-center justify-center gap-3 font-body text-sm tracking-[0.01em] text-foreground',
        'opacity-55 transition-opacity duration-med ease-brand hover:opacity-90',
        className,
      )}
    >
      {/* Sized by height: the mark is taller than it is wide, the opposite of
          the Bartefy wordmark. 34px is about twice the text height, which is
          what a frame with six letters inside it needs before those letters
          resolve — at 16px they were mush. */}
      <OrzomiMark className="h-[34px] w-auto shrink-0" />
      {t('brand.productOf')}
    </a>
  )
}
