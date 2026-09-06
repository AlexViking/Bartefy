import { Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageBubble } from '@/components/swap/MessageBubble'
import { NextStep } from '@/components/guidance/NextStep'
import { T, useT } from '@/i18n/T'
import type { useChat } from './useChat'

/** The thread body and composer, shared by both platform layouts. Only the
 *  frame around them differs: full screen on a phone, one pane of a split on
 *  a desktop.
 */
export function Thread({ c }: { c: ReturnType<typeof useChat> }) {
  const { t } = useT()

  return (
    <>
      {/* min-h-0 is load-bearing. A flex child defaults to min-height:auto, so
          without it this box refuses to shrink below the height of the whole
          message list — it grows instead of scrolling, and pushes the composer
          below the fold on any conversation long enough to need it. Both
          callers wrap this in a flex column, so it belongs here rather than in
          each of them. */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-5 py-4">
        {c.loading ? (
          <T as="p" k="common.loading" className="self-center font-body text-sm text-muted-foreground" />
        ) : (
          <>
            <MessageBubble from="system">{t('chat.systemMatched')}</MessageBubble>
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
            {c.ctx?.status === 'agreed' && (
              <MessageBubble from="system">{t('chat.systemAgreed')}</MessageBubble>
            )}
          </>
        )}

        {/* When the pair have agreed but not arranged, the thread says what
            the next move is rather than leaving them to work it out. */}
        {c.ctx?.status === 'agreed' && (
          <NextStep
            id={`arrange-${c.swapId}`}
            body="stuck.arrangeNext"
            action="chat.arrange"
            onAction={c.goArrange}
            className="mt-2"
          />
        )}

        <div ref={c.bottomRef} />
      </div>

      <div className="flex shrink-0 items-end gap-2 border-t border-border/[0.14] bg-card px-4 py-3">
        <Textarea
          value={c.input}
          onChange={(e) => c.setInput(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter is a newline. On a phone the on-screen
            // keyboard's return key inserts a newline instead.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void c.send()
            }
          }}
          placeholder={t('chat.placeholder')}
          data-i18n="chat.placeholder"
          rows={1}
          className="max-h-32 min-h-hit resize-none rounded border-[1.5px] border-border/[0.14] bg-background font-body text-base"
        />
        <Button
          size="icon"
          pill
          onClick={() => void c.send()}
          disabled={!c.input.trim() || c.sending}
          aria-label={t('chat.send')}
        >
          <Send aria-hidden="true" className="size-5" />
        </Button>
      </div>
    </>
  )
}
