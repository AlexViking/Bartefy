import { cn } from '@/lib/utils'

/** SWAP / PASS stamps - the game layer. Appear past 40% of a drag.
 *  The only rotated elements in the product.
 */
export function Stamp({ kind, visible }: { kind: 'swap' | 'pass'; visible: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-lg border-4 px-3.5 py-1 font-display text-4xl font-bold transition-opacity duration-med ease-brand',
        kind === 'swap' ? 'border-primary text-primary -rotate-[10deg]' : 'border-[#A05340] text-[#A05340] rotate-[10deg]',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      {kind === 'swap' ? 'SWAP' : 'PASS'}
    </div>
  )
}
