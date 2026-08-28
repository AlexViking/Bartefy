import { ArrowLeft, MoreVertical } from 'lucide-react'
import { useState } from 'react'

import { AppShell } from '@/components/shell/AppShell'
import { Button } from '@/components/ui/button'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { UserAvatar } from '@/components/ui/user-avatar'
import { SwapPair } from '@/components/swap/SwapPair'
import { useT } from '@/i18n/T'
import { Thread } from './Thread'
import { useChat } from './useChat'

/** Chat, phone shape: the thread fills the screen. The tab bar is hidden —
 *  a conversation is a place you are in, not a tab you are on — so the back
 *  arrow is the only way out and is always visible.
 */
export default function ChatMobile() {
  const c = useChat()
  const { t } = useT()
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <AppShell hideNav>
      <div className="flex h-dvh flex-col">
        <header className="flex items-center gap-2 border-b border-border/[0.14] bg-card px-3 py-2">
          <button
            type="button"
            onClick={c.goBack}
            aria-label={t('common.back')}
            className="flex size-11 shrink-0 items-center justify-center rounded-pill text-foreground hover:bg-foreground/[0.06]"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <UserAvatar name={c.ctx?.otherName ?? 'Swapper'} size="sm" />
          <span className="min-w-0 flex-1 truncate font-display text-[15px] font-semibold text-foreground">
            {c.ctx?.otherName ?? ''}
          </span>
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            aria-label={t('common.moreInfo')}
            className="flex size-11 shrink-0 items-center justify-center rounded-pill text-muted-foreground hover:bg-foreground/[0.06]"
          >
            <MoreVertical className="size-5" aria-hidden="true" />
          </button>
        </header>

        <Thread c={c} />
      </div>

      <ResponsiveSheet
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title="swaps.title"
        footer={
          <>
            {c.ctx?.status !== 'agreed' && (
              <Button size="lg" fullWidth onClick={() => void c.agree()}>
                {t('chat.confirmSwap')}
              </Button>
            )}
            <Button size="lg" variant="ghost" fullWidth onClick={c.goArrange}>
              {t('chat.arrange')}
            </Button>
            <Button variant="ghost" fullWidth className="text-destructive">
              {t('chat.trouble')}
            </Button>
          </>
        }
      >
        {c.ctx && (
          <SwapPair
            mine={{ id: 'a', title: c.ctx.itemATitle, photoUrl: c.ctx.itemAImages[0] }}
            theirs={{ id: 'b', title: c.ctx.itemBTitle, photoUrl: c.ctx.itemBImages[0] }}
          />
        )}
      </ResponsiveSheet>
    </AppShell>
  )
}
