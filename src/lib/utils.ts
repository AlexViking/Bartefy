import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/** tailwind-merge, told about Bartefy's own text sizes.
 *
 *  Out of the box it knows only Tailwind's scale (text-sm, text-lg...), so it
 *  read `text-h3` or `text-label-md` as a text COLOUR -- and when a real colour
 *  followed (`text-foreground`), it dropped the size as the "conflicting"
 *  earlier colour. `cn('text-h3 text-foreground')` returned 'text-foreground'.
 *  No warning: the heading simply rendered at the inherited size. Every size
 *  in tailwind.config.ts `fontSize` has to be listed here.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display', 'h2', 'h3', 'body', 'caption',
            'headline-xl', 'headline-lg', 'headline-md', 'headline-sm',
            'body-lg', 'body-md', 'body-sm',
            'label-lg', 'label-md', 'label-sm',
            'ticker',
          ],
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
