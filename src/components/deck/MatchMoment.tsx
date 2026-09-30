import * as React from 'react'
import { createPortal } from 'react-dom'

import { Icon } from '@/components/ui/icon'
import { T, useT } from '@/i18n/T'
import { EARN_RATES } from '@/lib/points'
import type { MatchInfo } from '@/screens/Hunt/useHunt'

const CONFETTI = ['bg-coral', 'bg-sun', 'bg-sky', 'bg-lilac', 'bg-mint', 'bg-white']
const SWAP_PTS = EARN_RATES.find((r) => r.reason === 'swap_completed')?.points ?? 0

/** "It's a bartefy!" -- the match moment (Alex, 2026-09-29: "fireworks or
 *  something fun").
 *
 *  Both finds fly in and meet, a burst of confetti, one line about what
 *  happens next, and the one thing to do: say hello. Motion is transform and
 *  opacity only (never a layout property), and a reduced-motion device gets
 *  the still version -- the global rule in global.css collapses it.
 *
 *  Opens wherever a match is made; step 3 wires Discover's mirror match.
 */
export function MatchMoment({
  match,
  onHello,
  onClose,
}: {
  match: MatchInfo | null
  onHello: (matchId: string) => void
  onClose: () => void
}) {
  const { t } = useT()
  const root = React.useRef<HTMLDivElement>(null)

  // Focus moves into the dialog (for screen readers and Esc) without a
  // keyboard ring on the button -- autoFocus drew one on every match.
  React.useEffect(() => {
    if (match) root.current?.focus()
  }, [match])

  React.useEffect(() => {
    if (!match) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [match, onClose])

  // Confetti positions are fixed per mount, not per render.
  const bits = React.useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        tone: CONFETTI[i % CONFETTI.length],
        x: Math.round(Math.cos((i / 28) * Math.PI * 2) * (180 + (i % 5) * 36)),
        y: Math.round(Math.sin((i / 28) * Math.PI * 2) * (120 + (i % 4) * 30)) - 40,
        r: (i * 47) % 360,
        d: 60 + (i % 6) * 40,
      })),
    [],
  )

  if (!match) return null
  const first = match.owner.split(' ')[0] || match.owner

  const photo = (src: string | undefined, side: 'l' | 'r') => (
    <span
      className="block size-40 overflow-hidden rounded-2xl bg-paper p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.35)] sm:size-44"
      style={{ animation: `match-in-${side} 520ms cubic-bezier(0.2,1.2,0.4,1) both` }}
    >
      {src ? <img alt="" className="size-full rounded-xl object-cover" src={src} /> : <span className="block size-full rounded-xl bg-stone" />}
    </span>
  )

  return createPortal(
    <div
      ref={root}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-title"
      className="fixed inset-0 z-[90] flex flex-col outline-none items-center justify-center overflow-hidden bg-forest/95 px-6 text-center text-white"
      style={{ animation: 'fade-in 200ms cubic-bezier(0.2,0,0,1) both' }}
    >
      <style>{`
@keyframes match-in-l{from{transform:translateX(-60vw) rotate(-30deg);opacity:0}to{transform:translateX(18px) rotate(-8deg);opacity:1}}
@keyframes match-in-r{from{transform:translateX(60vw) rotate(30deg);opacity:0}to{transform:translateX(-18px) rotate(7deg);opacity:1}}
@keyframes match-bit{0%{transform:translate(0,0) rotate(0);opacity:0}15%{opacity:1}100%{transform:translate(var(--x),var(--y)) rotate(var(--r));opacity:0}}
@keyframes match-pop{0%{transform:scale(0)}60%{transform:scale(1.18)}100%{transform:scale(1)}}
`}</style>

      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[38%]">
        {bits.map((b, i) => (
          <span
            key={i}
            className={`absolute block h-2.5 w-1.5 rounded-sm ${b.tone}`}
            style={
              {
                '--x': `${b.x}px`,
                '--y': `${b.y}px`,
                '--r': `${b.r}deg`,
                animation: `match-bit 1100ms cubic-bezier(0.2,0,0,1) ${320 + b.d}ms both`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <T as="p" k="match.kicker" className="mb-5 text-[12px] font-bold uppercase tracking-[0.2em] text-sun" />
      <div className="relative mb-8 flex items-center">
        {photo(match.mine.photo, 'l')}
        {photo(match.theirs.photo, 'r')}
        <span
          className="absolute left-1/2 top-1/2 -ml-8 -mt-8 grid size-16 place-items-center rounded-pill bg-coral text-ink ring-4 ring-forest"
          style={{ animation: 'match-pop 420ms cubic-bezier(0.2,1.3,0.4,1) 420ms both' }}
        >
          <Icon name="Handshake" size={30} />
        </span>
      </div>

      <h2 id="match-title" className="font-display text-[44px] font-bold leading-[48px]">
        {t('match.title')}
      </h2>
      <p className="mt-3 max-w-[440px] font-body text-body-lg text-white/90">
        {/* A name is user data. */}
        {t('match.body', { name: match.owner })}
      </p>

      <button
        type="button"
        onClick={() => onHello(match.matchId)}
        className="mt-8 flex h-12 w-full max-w-[440px] items-center justify-center gap-2 rounded-card bg-white font-body text-[15px] font-bold text-ink shadow-md outline-none hover:bg-paper focus-visible:ring-4 focus-visible:ring-sun"
      >
        <Icon name="MessageSquareText" size={20} />
        {t('match.hello', { name: first })}
      </button>
      <button type="button" onClick={onClose} className="mt-4 h-11 px-4 font-body text-[15px] text-white/90 hover:text-white">
        <T as="span" k="match.keepHunting" />
      </button>

      {SWAP_PTS > 0 && (
        <p className="mt-6 inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-1.5 text-[13px] text-white/90">
          <Icon name="Coins" size={16} className="text-sun" />
          {t('match.points', { n: SWAP_PTS })}
        </p>
      )}
    </div>,
    document.body,
  )
}
