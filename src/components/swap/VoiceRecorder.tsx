import { useEffect, useRef, useState } from 'react'
import { Mic, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { T, useT } from '@/i18n/T'
import { cn } from '@/lib/utils'
import {
  MAX_DURATION_MS,
  canRecord,
  formatDuration,
  startRecording,
  type VoiceRecorder as Recorder,
} from '@/lib/voice'

/** Hold-free recording: tap to start, tap to send, or tap the bin to drop it.
 *
 *  Deliberately NOT press-and-hold. Hold-to-talk is a 60-second thumb cramp,
 *  it is unusable one-handed while walking, and it has no keyboard equivalent
 *  at all. Tap/tap works with a thumb, a mouse and a keyboard for free.
 */
export function VoiceRecorderButton({
  onRecorded,
  disabled = false,
  onRecordingChange,
}: {
  onRecorded: (blob: Blob, durationMs: number) => void
  disabled?: boolean
  /** Told when recording starts and stops, so the composer can hide the text
   *  box: a disabled Textarea sitting beside a running recorder invites
   *  people to type into it. */
  onRecordingChange?: (recording: boolean) => void
}) {
  const { t } = useT()
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [level, setLevel] = useState(0)
  const [denied, setDenied] = useState(false)
  const recorderRef = useRef<Recorder | null>(null)
  const rafRef = useRef<number | null>(null)
  const startedAt = useRef(0)

  // The button is not rendered at all where the browser cannot record. A mic
  // that opens a permission prompt and then fails is worse than no mic.
  const supported = canRecord()

  useEffect(() => {
    return () => {
      // Unmounting mid-recording must release the microphone, or the browser
      // keeps showing the recording indicator on a screen that is gone.
      recorderRef.current?.cancel()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Derived from the state rather than called at each of the three places
  // recording stops (send, discard, auto-stop) -- one of those would
  // eventually be missed and leave the composer hidden for good.
  useEffect(() => {
    onRecordingChange?.(recording)
  }, [recording, onRecordingChange])

  const tick = () => {
    const r = recorderRef.current
    if (!r) return
    setElapsed(performance.now() - startedAt.current)
    setLevel(r.level())
    rafRef.current = requestAnimationFrame(tick)
  }

  const stopTicking = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    setElapsed(0)
    setLevel(0)
  }

  const begin = async () => {
    setDenied(false)
    try {
      const r = await startRecording(() => {
        // Hit the 60s ceiling: send what there is rather than discarding it.
        void finish()
      })
      recorderRef.current = r
      startedAt.current = performance.now()
      setRecording(true)
      rafRef.current = requestAnimationFrame(tick)
    } catch (e) {
      // "You said no" and "it broke" are different messages. Anything else is
      // swallowed into the same denied state because the recovery is the
      // same: the mic is unavailable, carry on typing.
      setDenied(true)
      if ((e as Error)?.name !== 'NotAllowedError') {
        console.error('voice: could not start recording', e)
      }
    }
  }

  const finish = async () => {
    const r = recorderRef.current
    if (!r) return
    recorderRef.current = null
    setRecording(false)
    stopTicking()
    const rec = await r.stop()
    // null means cancelled, or under the half-second floor -- an accidental
    // tap, which is silently dropped rather than sent as a click.
    if (rec) onRecorded(rec.blob, rec.durationMs)
  }

  const drop = () => {
    recorderRef.current?.cancel()
    recorderRef.current = null
    setRecording(false)
    stopTicking()
  }

  if (!supported) return null

  if (!recording) {
    return (
      <div className="flex flex-col items-center">
        <Button
          variant="ghost"
          size="icon"
          pill
          disabled={disabled}
          onClick={begin}
          aria-label={t('chat.voiceRecord')}
        >
          <Mic className="size-5" />
        </Button>
        {denied && (
          <T as="span" k="chat.voiceDenied" className="sr-only" />
        )}
      </div>
    )
  }

  const nearLimit = elapsed > MAX_DURATION_MS - 10_000

  return (
    <div className="flex flex-1 items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        pill
        onClick={drop}
        aria-label={t('chat.voiceDiscard')}
      >
        <Trash2 className="size-5 text-destructive" />
      </Button>

      {/* The live level, so it is visibly listening. A recorder that does not
          move while you talk reads as broken even when it is recording. */}
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-pill bg-secondary px-3 py-2">
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-pill bg-destructive"
          style={{ opacity: 0.45 + level * 0.55 }}
        />
        <span
          className={cn(
            'font-body text-[13px] tabular-nums',
            // The last ten seconds say so, rather than cutting off without
            // warning at sixty.
            nearLimit ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {formatDuration(elapsed)}
        </span>
        <span
          aria-hidden
          className="h-1 flex-1 origin-left rounded-pill bg-foreground/15"
          style={{ transform: `scaleX(${Math.min(1, elapsed / MAX_DURATION_MS)})` }}
        />
      </div>

      <Button size="icon" pill onClick={finish} aria-label={t('chat.voiceSend')}>
        <Mic className="size-5" />
      </Button>
    </div>
  )
}
