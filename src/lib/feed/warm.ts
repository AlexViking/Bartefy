/** Decode the next few cards' photos before they reach the top of the stack.
 *
 *  The deck fetches ten items in one request, so the DATA for card two is
 *  already in memory while card one is on screen -- but the photo is not. An
 *  <img> only starts fetching when it mounts, which is the moment the card
 *  becomes the top one, so every swipe was followed by a network round trip
 *  and a blank (terracotta) rectangle until it landed.
 *
 *  decode() is the part that matters. A loaded-but-undecoded image still costs
 *  a frame on the main thread when it first paints, which on a mid-range phone
 *  is exactly the stutter you feel mid-swipe.
 *
 *  This warms plain URLs rather than the Photo objects in lib/images.ts: those
 *  address the R2 variant worker, which does not exist yet (the feed returns
 *  whole URLs). When the worker lands, swap warmUrl for warmPhoto and delete
 *  this file.
 */

/** Already warmed, or in flight. The browser cache makes a repeat request
 *  cheap but not free, and re-decoding is not free at all. */
const seen = new Set<string>()

function warmUrl(url: string): Promise<void> {
  if (seen.has(url)) return Promise.resolve()
  seen.add(url)
  const img = new Image()
  img.src = url
  // decode() rejects on an aborted or broken image. That is not an error worth
  // surfacing: the <img> in the card renders its own fallback, and a photo
  // that fails to warm simply loads the slow way.
  return img.decode().catch(() => {})
}

/** Warm the first photo of each of the next `count` cards, nearest first.
 *
 *  Sequential rather than parallel: on a phone, ten concurrent image requests
 *  compete with the swipe animation for both bandwidth and main-thread time,
 *  which is the opposite of the point. The next card is what matters most, so
 *  it is warmed first and alone.
 */
export function warmAhead(urls: (string | undefined)[], count = 3): () => void {
  let cancelled = false

  const run = async () => {
    for (const url of urls.slice(0, count)) {
      if (cancelled) return
      if (url) await warmUrl(url)
    }
  }

  // Idle so warming never competes with the drag it exists to protect. The
  // 200ms fallback is for Safari, which still has no requestIdleCallback.
  const id =
    'requestIdleCallback' in window
      ? requestIdleCallback(run, { timeout: 500 })
      : setTimeout(run, 200)

  return () => {
    cancelled = true
    if ('cancelIdleCallback' in window) cancelIdleCallback(id as number)
    else clearTimeout(id as ReturnType<typeof setTimeout>)
  }
}
