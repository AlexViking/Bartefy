import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'

import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'
import { formatDuration } from '@/lib/voice'

/** How many bars the waveform draws. Fixed, not derived from the duration: a
 *  4-second note and a 40-second one should be the same object at different
 *  speeds, not two differently shaped widgets in the same thread. */
const BARS = 27

/** A deterministic waveform from the message id.
 *
 *  Decoding the real audio to draw a true waveform means fetching and
 *  decoding every note in the thread on mount -- on a metered connection, for
 *  messages nobody may play. A shape seeded by the id is stable across
 *  renders and reloads (the same note always looks the same), which is the
 *  property that actually matters here; it just does not claim to be the
 *  audio. It reads as a voice note, which is what it is for.
 */
function bars(seed: string): number[] {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  const out: number[] = []
  for (let i = 0; i < BARS; i++) {
    h = (h * 1103515245 + 12345) | 0
    // 0.25-1.0: never a flat line, never a full-height block.
    out.push(0.25 + (Math.abs(h) % 1000) / 1000 * 0.75)
  }
  return out
}

/** A voice note in a thread: play/pause, a waveform that fills as it plays,
 *  and the time remaining.
 *
 *  One <audio> per bubble, created on demand. preload="none" so a thread of
 *  twenty notes costs no bandwidth until one is actually played -- the bucket
 *  is metered and most notes are never replayed.
 */
export function VoiceNote({
  src,
  durationMs,
  mine,
  seed,
  pending = false,
}: {
  src: string
  durationMs: number
  /** Mine tints the controls for the primary bubble, theirs for the card. */
  mine: boolean
  /** Stable id for the waveform shape -- the message's client_msg_id. */
  seed: string
  /** Still uploading: playable from the local blob, but not yet sent. */
  pending?: boolean
}) {
  const { t } = useT()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const shape = bars(seed)
  // Duration from the row, not from the element: a WebM recorded by
  // MediaRecorder has no duration in its header, so audio.duration is
  // Infinity until it has fully played through at least once. The database
  // knows the real number because the recorder measured it.
  const total = durationMs
  const progress = total > 0 ? Math.min(1, elapsed / total) : 0

  // Stop and rewind when the source changes -- the optimistic bubble swaps
  // its blob: URL for the real one the moment the upload lands.
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    el.pause()
    setPlaying(false)
    setElapsed(0)
  }, [src])

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onTime = () => setElapsed(el.currentTime * 1000)
    const onEnd = () => {
      setPlaying(false)
      setElapsed(0)
      el.currentTime = 0
    }
    el.addEventListener('timeupdate', onTime)
    el.addEventListener('ended', onEnd)
    return () => {
      el.removeEventListener('timeupdate', onTime)
      el.removeEventListener('ended', onEnd)
    }
  }, [])

  const toggle = () => {
    const el = audioRef.current
    if (!el) return
    if (playing) {
      el.pause()
      setPlaying(false)
      return
    }
    // Pause every other note first: two people talking at once in one thread
    // is never what was wanted.
    document.querySelectorAll('audio').forEach((a) => {
      if (a !== el) a.pause()
    })
    void el.play().then(
      () => setPlaying(true),
      // Autoplay policy, a dead URL, a codec this browser cannot decode.
      // Leave the button in its resting state rather than a lying "playing".
      () => setPlaying(false),
    )
  }

  const remaining = Math.max(0, total - elapsed)

  return (
    // The whole row dims while the bytes are still going up, not just the
    // button: at button-only opacity the bubble was indistinguishable from a
    // sent one, so a failed upload looked like a delivered message.
    <div className={cn('flex items-center gap-2.5', pending && 'opacity-55')}>
      <audio ref={audioRef} src={src} preload="none" />

      <button
        type="button"
        onClick={toggle}
        aria-label={t(playing ? 'chat.voicePause' : 'chat.voicePlay')}
        className={cn(
          'grid size-9 shrink-0 place-items-center rounded-pill transition-opacity duration-fast ease-brand',
          mine
            ? 'bg-primary-foreground/20 text-primary-foreground'
            : 'bg-primary text-primary-foreground',
        )}
      >
        {playing ? (
          <Pause className="size-4" aria-hidden="true" />
        ) : (
          <Play className="size-4 translate-x-px" aria-hidden="true" />
        )}
      </button>

      {/* Decorative: the time beside it is the accessible version, and a
          screen reader announcing 27 bars would be noise. */}
      <div aria-hidden className="flex h-7 flex-1 items-center gap-[2px]">
        {shape.map((v, i) => (
          <span
            key={i}
            style={{ height: `${Math.round(v * 100)}%` }}
            className={cn(
              'w-[3px] shrink-0 rounded-pill transition-colors duration-fast',
              // (i+1)/BARS, not i/BARS: at progress 0 the first bar would
              // otherwise satisfy 0 <= 0 and paint as played before anything
              // has been heard.
              progress > 0 && (i + 1) / BARS <= progress
                ? mine
                  ? 'bg-primary-foreground'
                  : 'bg-primary'
                : mine
                  ? 'bg-primary-foreground/35'
                  : 'bg-foreground/20',
            )}
          />
        ))}
      </div>

      {/* Counts down while playing, shows the length at rest -- the two
          questions people actually have ("how long is this?" then "how much
          is left?"). Tabular so it does not jitter as the digits change. */}
      <span
        className={cn(
          'shrink-0 font-body text-[11px] tabular-nums',
          mine ? 'text-primary-foreground/80' : 'text-muted-foreground',
        )}
      >
        {formatDuration(playing || elapsed > 0 ? remaining : total)}
      </span>
    </div>
  )
}
