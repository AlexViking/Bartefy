/** Recording a voice note, and the format mess underneath it.
 *
 *  The same shape as lib/images.ts: the bytes are prepared entirely in the
 *  browser and PUT straight to R2. The server never touches them.
 *
 *  WHY THE FORMAT IS NEGOTIATED RATHER THAN CHOSEN
 *
 *  There is no single container every browser records. Chrome and Firefox do
 *  WebM/Opus. iOS Safari does not -- it records MP4/AAC and, asked for
 *  'audio/webm', MediaRecorder either throws on construction or silently
 *  hands back a different type. That is the same class of bug as
 *  canvas.toBlob quietly returning PNG (see lib/images.ts): the request is
 *  ignored, nothing errors, and the file is wrong.
 *
 *  So: ask isTypeSupported in preference order, and then trust the blob's OWN
 *  type for the extension and the upload's Content-Type, never the type we
 *  asked for.
 */

/** 60 seconds. The R2 bucket is metered and a thread accumulates forever,
 *  where a listing's photos are capped at three and replaced on edit. At
 *  ~24kbps Opus that is about 180KB worst case -- comparable to one photo,
 *  which is the budget this has to sit inside. Enforced again in SQL by
 *  migration 042: here it is convenient, there it is true. */
export const MAX_DURATION_MS = 60_000

/** Below this a recording is an accidental tap, and plays as a click. Matches
 *  the floor in 042. */
export const MIN_DURATION_MS = 500

/** Opus first -- it is half the size of AAC at speech quality. The last entry
 *  is the bare container with no codec hint, which is what iOS accepts. */
const PREFERRED = [
  'audio/webm;codecs=opus',
  'audio/ogg;codecs=opus',
  'audio/mp4;codecs=mp4a.40.2',
  'audio/mp4',
  'audio/webm',
]

/** ~24kbps mono: speech-grade, and the reason a 60s note stays small. */
const BITS_PER_SECOND = 24_000

/** The first container this browser will actually record, or null if it will
 *  record none -- which is a real outcome, not a theoretical one, and the
 *  caller must hide the button rather than fail on press. */
export function pickMimeType(): string | null {
  if (typeof MediaRecorder === 'undefined') return null
  for (const type of PREFERRED) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return null
}

/** Whether this browser can record at all. Checked before the mic button is
 *  rendered: a button that cannot work should not be on screen. */
export const canRecord = () =>
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices?.getUserMedia &&
  pickMimeType() !== null

/** File extension for a blob, from the blob's own type.
 *
 *  Reading blob.type rather than the requested type is the whole point: on
 *  iOS they differ, and a .webm name on MP4 bytes is a file that downloads
 *  and will not play.
 */
export function extensionFor(mime: string): string {
  const base = mime.split(';')[0].trim().toLowerCase()
  switch (base) {
    case 'audio/webm':
      return 'webm'
    case 'audio/ogg':
      return 'ogg'
    case 'audio/mp4':
    case 'audio/x-m4a':
      return 'm4a'
    case 'audio/mpeg':
      return 'mp3'
    case 'audio/wav':
    case 'audio/x-wav':
      return 'wav'
    default:
      // Deliberately not a guess. An unknown container is better stored under
      // a name that says so than under one that lies about the codec.
      return 'bin'
  }
}

export interface Recording {
  blob: Blob
  /** The blob's real type, for the PUT's Content-Type. */
  mime: string
  durationMs: number
}

export interface VoiceRecorder {
  /** Resolves with the recording, or null if it was cancelled or came in
   *  under MIN_DURATION_MS. */
  stop: () => Promise<Recording | null>
  /** Drop it: stops the tracks and resolves stop() with null. */
  cancel: () => void
  /** Live input level, 0-1, for the waveform while recording. */
  level: () => number
}

/**
 *  Start recording. Throws if the mic is refused -- the caller distinguishes
 *  NotAllowedError (denied) from the rest, because "you said no" and
 *  "something broke" are different messages.
 *
 *  Auto-stops at MAX_DURATION_MS so a note left running cannot exceed what
 *  the database will accept.
 */
export async function startRecording(
  onAutoStop?: () => void,
): Promise<VoiceRecorder> {
  const mime = pickMimeType()
  if (!mime) throw new Error('unsupported')

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      // Speech, in a flea market, on a phone. These are the three that matter
      // and they are all hints -- a browser may ignore any of them.
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  })

  const recorder = new MediaRecorder(stream, {
    mimeType: mime,
    audioBitsPerSecond: BITS_PER_SECOND,
  })

  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const startedAt = performance.now()
  let cancelled = false
  let settled = false

  // Live level for the waveform. A separate AudioContext on the same stream:
  // MediaRecorder gives no amplitude, and a recorder with no visible response
  // to your voice looks broken even when it is working.
  let audioCtx: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let levelData: Uint8Array | null = null
  try {
    audioCtx = new AudioContext()
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 256
    audioCtx.createMediaStreamSource(stream).connect(analyser)
    levelData = new Uint8Array(analyser.frequencyBinCount)
  } catch {
    // Metering is a nicety. Losing it must never lose the recording.
    audioCtx = null
  }

  const cleanup = () => {
    stream.getTracks().forEach((t) => t.stop())
    void audioCtx?.close().catch(() => {})
  }

  const done = new Promise<Recording | null>((resolve) => {
    recorder.onstop = () => {
      const durationMs = Math.round(performance.now() - startedAt)
      cleanup()
      if (cancelled || chunks.length === 0 || durationMs < MIN_DURATION_MS) {
        return resolve(null)
      }
      // The blob's OWN type, not `mime`. See the note at the top.
      const blob = new Blob(chunks, { type: chunks[0].type || mime })
      resolve({
        blob,
        mime: blob.type || mime,
        durationMs: Math.min(durationMs, MAX_DURATION_MS),
      })
    }
  })

  // timeslice: without it a recording interrupted by a tab switch or a crash
  // has produced no chunks at all.
  recorder.start(250)

  const timer = setTimeout(() => {
    if (recorder.state === 'recording') {
      recorder.stop()
      onAutoStop?.()
    }
  }, MAX_DURATION_MS)

  const finish = () => {
    if (settled) return
    settled = true
    clearTimeout(timer)
    if (recorder.state !== 'inactive') recorder.stop()
    else cleanup()
  }

  return {
    stop: () => {
      finish()
      return done
    },
    cancel: () => {
      cancelled = true
      finish()
    },
    level: () => {
      if (!analyser || !levelData) return 0
      analyser.getByteFrequencyData(levelData)
      let sum = 0
      for (let i = 0; i < levelData.length; i++) sum += levelData[i]
      return Math.min(1, sum / levelData.length / 128)
    },
  }
}

/** mm:ss for a duration in milliseconds. Used by both the recorder's timer
 *  and the player's remaining time, so they can never format differently. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
