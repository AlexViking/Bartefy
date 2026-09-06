import { Send } from 'lucide-react'

import { AppShell } from '@/components/shell/AppShell'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmBar } from '@/components/swap/ConfirmBar'
import { MessageBubble } from '@/components/swap/MessageBubble'
import { T, useT } from '@/i18n/T'
import { cn } from '@/lib/utils'
import { useMatchChat } from './useMatchChat'

/** The two finds this conversation is about, across the top.
 *
 *  Kept in view for the same reason the offer sheet shows both at one size:
 *  the thread exists to arrange one specific trade, and a conversation that
 *  has drifted for a week should not need scrolling back to remember what for.
 */
function SwapHeader({ c }: { c: ReturnType<typeof useMatchChat> }) {
  const { t } = useT()
  if (!c.ctx) return null

  const Find = ({ title, image, label }: { title: string; image?: string; label: string }) => (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      {image ? (
        <img src={image} alt="" className="size-10 shrink-0 rounded-card-sm object-cover" />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-card-sm bg-secondary">
          <Icon name="Package" size={16} className="text-muted-foreground" />
        </span>
      )}
      <span className="min-w-0">
        <span data-i18n={label} className="block font-body text-[11px] text-muted-foreground">
          {t(label)}
        </span>
        {/* A listing title is user data: no data-i18n. */}
        <span className="block truncate font-body text-sm text-foreground">{title}</span>
      </span>
    </div>
  )

  return (
    <div className="flex items-center gap-3 border-b border-border/[0.14] px-5 py-3">
      <Find title={c.ctx.myItemTitle} image={c.ctx.myItemImage} label="chat.yourFind" />
      <Icon name="ArrowRight" size={16} className="shrink-0 text-accent-foreground" />
      <Find title={c.ctx.theirItemTitle} image={c.ctx.theirItemImage} label="chat.theirFind" />
    </div>
  )
}

/** A barter thread.
 *
 *  One file, both platforms: a conversation is the same column of messages on
 *  a phone and a desktop, and the split-pane version of this belongs to the
 *  merged inbox rather than here.
 */
export default function MatchThread() {
  const c = useMatchChat()
  const { t } = useT()

  return (
    <AppShell>
      <div className="mx-auto flex h-full w-full max-w-[720px] flex-col">
        <div className="flex items-center gap-2 px-5 pt-4">
          <Button
            variant="ghost"
            size="icon"
            pill
            onClick={c.goBack}
            aria-label={t('common.back')}
          >
            <Icon name="ArrowLeft" size={20} />
          </Button>
          {/* Someone's name: user data, never stamped with a key. */}
          <span className="truncate font-display text-h3 text-foreground">
            {c.ctx?.otherName || t('swaps.someone')}
          </span>
        </div>

        <SwapHeader c={c} />

        {/* min-h-0 is load-bearing: a flex child defaults to min-height:auto,
            so without it this grows to the full message list instead of
            scrolling, and pushes the composer below the fold. */}
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-5 py-4">
          {c.loading ? (
            <T
              as="p"
              k="common.loading"
              className="self-center font-body text-sm text-muted-foreground"
            />
          ) : (
            <>
              <MessageBubble from="system">{t('barter.accepted')}</MessageBubble>
              {c.messages.map((m) => (
                <MessageBubble
                  key={m.client_msg_id || m.id}
                  from={m.sender_id === c.userId ? 'me' : 'them'}
                  time={new Date(m.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                >
                  {m.body}
                </MessageBubble>
              ))}
              <div ref={c.bottomRef} />
            </>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-border/[0.14] px-5 py-4">
          {c.errorKey && (
            <p
              data-i18n={c.errorKey}
              role="alert"
              className="font-body text-sm text-destructive"
            >
              {t(c.errorKey)}
            </p>
          )}

          {c.ctx && (
            <ConfirmBar
              mineConfirmed={c.ctx.mineConfirmed}
              theirsConfirmed={c.ctx.theirsConfirmed}
              status={c.ctx.status}
              cancelReason={c.ctx.cancelReason}
              busy={c.busy}
              onConfirm={c.confirm}
              onCancel={c.cancel}
            />
          )}

          {/* The composer disappears once the swap closes rather than sitting
              there disabled: a greyed-out box invites people to try typing
              into it and wonder why nothing happens. */}
          {c.canSend && (
            <div className="flex items-end gap-2">
              <Textarea
                value={c.input}
                onChange={(e) => c.setInput(e.target.value)}
                onKeyDown={(e) => {
                  // Enter sends, Shift+Enter breaks the line. On a phone the
                  // key is a newline anyway, so this only affects desktop.
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void c.send()
                  }
                }}
                rows={1}
                maxLength={2000}
                placeholder={t('chat.placeholder')}
                className={cn('max-h-32 min-h-hit flex-1 resize-none')}
              />
              <Button
                size="icon"
                pill
                disabled={!c.input.trim() || c.sending}
                onClick={c.send}
                aria-label={t('chat.send')}
              >
                <Send className="size-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
