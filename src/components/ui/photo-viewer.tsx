import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { Icon } from '@/components/ui/icon'
import { useT } from '@/i18n/T'
import { spring, tween } from '@/lib/motion'
import { cn } from '@/lib/utils'

/** Full-screen photo view.
 *
 *  A listing photo is the only thing anyone has to judge a find by, and a
 *  400px card is not enough to see whether the chip in the rim is a chip or a
 *  reflection. This is the difference between a swap and a wasted trip.
 *
 *  Escape and the arrow keys work because it is the one place in the app that
 *  is genuinely modal: nothing else is on screen to compete for them.
 */
export function PhotoViewer({
  open,
  photos,
  index,
  onIndexChange,
  onClose,
  title,
}: {
  open: boolean
  photos: string[]
  index: number
  onIndexChange: (i: number) => void
  onClose: () => void
  /** For the alt text. A listing title, so it is user data. */
  title: string
}) {
  const { t } = useT()
  const many = photos.length > 1

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (!many) return
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + photos.length) % photos.length)
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % photos.length)
    }
    window.addEventListener('keydown', onKey)
    // The page behind must not scroll while this is over it.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, index, photos.length, many, onIndexChange, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={tween.fast}
          role="dialog"
          aria-modal="true"
          aria-label={t('item.viewPhotos')}
          className="fixed inset-0 z-[60] flex flex-col bg-[#0B0B0A]/95 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between p-4">
            <span className="font-body text-sm text-[#F2EEE0]/70">
              {many ? `${index + 1} / ${photos.length}` : ''}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="grid size-11 place-items-center rounded-pill text-[#F2EEE0] transition-colors hover:bg-white/10"
            >
              <Icon name="X" size={22} />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.img
                key={index}
                src={photos[index]}
                alt={t('a11y.photoOf', { title })}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={spring.gentle}
                className="max-h-full max-w-full object-contain"
              />
            </AnimatePresence>

            {many && (
              <>
                <button
                  type="button"
                  onClick={() => onIndexChange((index - 1 + photos.length) % photos.length)}
                  aria-label={t('common.previous')}
                  className="absolute left-2 grid size-12 place-items-center rounded-pill bg-black/40 text-[#F2EEE0] transition-colors hover:bg-black/60"
                >
                  <Icon name="ChevronLeft" size={24} />
                </button>
                <button
                  type="button"
                  onClick={() => onIndexChange((index + 1) % photos.length)}
                  aria-label={t('common.next')}
                  className="absolute right-2 grid size-12 place-items-center rounded-pill bg-black/40 text-[#F2EEE0] transition-colors hover:bg-black/60"
                >
                  <Icon name="ChevronRight" size={24} />
                </button>
              </>
            )}
          </div>

          {many && (
            <div className="flex justify-center gap-2 overflow-x-auto p-4">
              {photos.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => onIndexChange(i)}
                  aria-label={t('item.photoN', { n: i + 1 })}
                  aria-current={i === index ? 'true' : undefined}
                  className={cn(
                    'size-14 shrink-0 overflow-hidden rounded-card-sm border-2 transition-colors',
                    i === index ? 'border-accent' : 'border-transparent opacity-60',
                  )}
                >
                  <img src={src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
