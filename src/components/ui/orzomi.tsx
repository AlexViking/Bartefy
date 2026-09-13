import { cn } from '@/lib/utils'

/** The ORZOMI mark — Bartefy's parent company.
 *
 *  The official asset, inline rather than an <img>. Two reasons it is not the
 *  PNG that was supplied first: that file's alpha channel is a lie (all 90,000
 *  pixels opaque over a baked-in #ECE8DF ground, so it paints a bright square
 *  on the dark theme), and an inline SVG inherits `currentColor`, so one file
 *  is correct in both themes with no swap logic to forget.
 *
 *  The path is the vendor artwork unmodified. Do not redraw it: a hand-traced
 *  reconstruction was tried first and had the letters half again too large,
 *  with the Z colliding into the O.
 *
 *  Taller than it is wide (~0.63:1), so size it by HEIGHT — the opposite of
 *  the Bartefy wordmark, which is sized by width.
 */
export function OrzomiMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="64 94 476 754"
      fill="none"
      aria-hidden="true"
      className={cn(className)}
    >
      <path fill="currentColor" fillRule="evenodd" d="M540 94v754h-476v-754zm-454 22v710h432v-710z M306.6 298.8c0-49.62-40.18-89.8-89.8-89.8-49.62 0-89.8 40.18-89.8 89.8 0 49.62 40.18 89.8 89.8 89.8 49.62 0 89.8-40.18 89.8-89.8zm-20.32 0c0 38.34-31.14 69.48-69.48 69.48-38.35 0-69.48-31.14-69.48-69.48 0-38.35 31.13-69.48 69.48-69.48 38.34 0 69.48 31.13 69.48 69.48z M339 243h54.51c24.05 0 37.68 13.5 37.68 35.1 0 14.39-8.82 26.09-24.05 30.59l28.86 45h-22.45l-27.25-42.3h-28.86v42.3h-18.44zm18.44 49.49h32.87c13.62 0 21.64-5.4 21.64-15.3 0-9.9-8.02-15.3-21.64-15.3h-32.87z M172.03 416h88.94v16.15l-63.67 75.09h66.7v17.76h-95v-16.15l63.67-75.09h-60.64z M477.8 470.8c0-49.62-40.18-89.8-89.8-89.8-49.62 0-89.8 40.18-89.8 89.8 0 49.62 40.18 89.8 89.8 89.8 49.62 0 89.8-40.18 89.8-89.8zm-20.32 0c0 38.34-31.14 69.48-69.48 69.48-38.34 0-69.48-31.14-69.48-69.48 0-38.35 31.14-69.48 69.48-69.48 38.34 0 69.48 31.13 69.48 69.48z M154 591h18.58l44.42 70.4 43.42-70.4h19.58v110.4h-22.35v-72l-34.5 59.6h-12.3l-34.5-59.6v72h-22.35z M399 591v111h-23v-111z" />
    </svg>
  )
}
