import { OrzomiMark } from '@/components/ui/orzomi'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** "A product of ORZOMI" — the parent-company credit.
 *
 *  One wording everywhere, deliberately. "Powered by" reads as a technical
 *  dependency, which is right for infrastructure and wrong for a consumer swap
 *  app; mixing four variants across screens reads as several different
 *  relationships rather than one company.
 *
 *  A LINK, to orzomi.com. The first version was not, on the reasoning that it
 *  would leak people out of a half-finished sign-in -- which mistook the
 *  purpose: the whole point of a parent-company credit is that someone can go
 *  and find out who the parent company is. A credit nobody can follow is
 *  decoration. target=_blank keeps the sign-in page where it is, and
 *  rel=noreferrer is required with it -- without noopener the new tab gets a
 *  handle on this window.
 *
 *  currentColor throughout means the mark takes the link's colour and is
 *  correct in both themes from one asset, hover included.
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
        /* text-sm, not text-caption: at caption size on a muted colour this
           read as a disclaimer rather than a credit. Full muted-foreground
           with no /70 for the same reason -- it was faint enough to look like
           an accident. Hover goes to full foreground so it is discoverably a
           link, and the underline offset keeps the rule off the letterforms. */
        'group inline-flex items-center justify-center gap-2 rounded-pill font-body text-sm text-muted-foreground',
        'transition-colors duration-fast ease-brand hover:text-foreground',
        'underline-offset-4 hover:underline',
        className,
      )}
    >
      {/* The mark, lit from behind.
          34px: the mark is a frame with six letters inside it, so it needs
          roughly twice the height of the text beside it before those letters
          resolve -- at 16px they were mush, and at 26px they were legible but
          the whole credit still read as fine print.

          The glow is a blurred brass radial BEHIND the mark, not a CSS
          drop-shadow on it: a shadow follows the glyph outline, so on a mark
          that is mostly empty frame it traces six thin letters and reads as a
          blur rather than a light. A soft ellipse behind the whole box lifts
          it off the background the way a backlight would. Brass rather than
          white -- it is the accent that already means "this matters" in
          Bartefy, and a white bloom on parchment is invisible. */}
      <span className="relative inline-flex shrink-0 items-center justify-center">
        {/* z-0 on the glow and z-10 on the mark, NOT -z-10 on the glow: a
            negative index puts it behind the parent's own background, which
            on a painted surface means behind the page. It rendered nothing at
            all. Both layers positive, ordered against each other. */}
        {/* The glow has to change colour per theme, not just opacity.
            Brass (#E9BE8C) on the dark ground reads as a warm backlight; on
            parchment (#F8F3E3) it is nearly the same tone as the page and
            vanished completely. So: brass on dark, green on light, each
            picked to sit AGAINST its own background rather than beside it.
            Driven by the [data-theme=dark] attribute the theme provider sets,
            which is the same switch the rest of the palette uses. */}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute left-1/2 top-1/2 z-0 h-[190%] w-[150%] -translate-x-1/2 -translate-y-1/2',
            'rounded-[50%] blur-md opacity-90 transition-opacity duration-med ease-brand group-hover:opacity-100',
            'bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.34)_0%,hsl(var(--primary)/0.16)_45%,transparent_72%)]',
            '[html[data-theme=dark]_&]:bg-[radial-gradient(ellipse_at_center,hsl(var(--accent)/0.55)_0%,hsl(var(--accent)/0.28)_45%,transparent_72%)]',
          )}
        />
        <OrzomiMark className="relative z-10 h-[34px] w-auto" />
      </span>
      {t('brand.productOf')}
    </a>
  )
}
