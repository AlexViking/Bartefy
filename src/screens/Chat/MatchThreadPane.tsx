import { useState } from 'react'
import { Send } from 'lucide-react'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Textarea } from '@/components/ui/textarea'
import { ConfirmBar } from '@/components/swap/ConfirmBar'
import { MessageBubble } from '@/components/swap/MessageBubble'
import { VoiceNote } from '@/components/swap/VoiceNote'
import { VoiceRecorderButton } from '@/components/swap/VoiceRecorder'
import { T, useT } from '@/i18n/T'
import { useTwoPane } from '@/lib/platform'
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
  const navigate = useNavigate()
  if (!c.ctx) return null

  /* A link to the listing, not a decoration. 40px showed one photo at stamp
     size with no way to see the other two, and "is that a chip in the rim or a
     reflection?" is exactly the question this screen exists to answer before
     someone travels. 56px, and the whole thing opens the find. */
  const Find = ({
    title,
    image,
    label,
    publicId,
  }: {
    title: string
    image?: string
    label: string
    publicId?: string
  }) => {
    const inner = (
      <>
        {image ? (
          <img
            src={image}
            alt=""
            className="size-14 shrink-0 rounded-card-sm object-cover"
          />
        ) : (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-card-sm bg-secondary">
            <Icon name="Package" size={20} className="text-muted-foreground" />
          </span>
        )}
        <span className="min-w-0">
          <span data-i18n={label} className="block font-body text-[11px] text-muted-foreground">
            {t(label)}
          </span>
          {/* A listing title is user data: no data-i18n. */}
          <span className="block truncate font-body text-sm text-foreground">{title}</span>
        </span>
      </>
    )

    /* No publicId means the row was not readable -- render it flat rather than
       as a link that 404s. Before 038 that was the normal case for the other
       person's find, because reserving it put it outside every read policy. */
    if (!publicId) return <div className="flex min-w-0 items-center gap-2">{inner}</div>

    return (
      <button
        type="button"
        onClick={() => navigate('/item/' + publicId)}
        className="flex min-w-0 items-center gap-2 rounded-card-sm text-left transition-opacity duration-fast ease-brand hover:opacity-80"
      >
        {inner}
      </button>
    )
  }

  return (
    /* The pair is one group, centred, not two halves pushed to opposite edges.
       Flexing each Find to fill half the row put 400px of empty parchment
       between the arrow and the finds on a wide pane, so the two items read as
       unrelated columns rather than one trade. */
    <div className="flex items-center justify-center gap-3 border-b border-border/[0.14] px-5 py-3">
      <Find
        title={c.ctx.myItemTitle}
        image={c.ctx.myItemImage}
        publicId={c.ctx.myItemPublicId}
        label="chat.yourFind"
      />
      <Icon name="ArrowRight" size={16} className="shrink-0 text-accent-foreground" />
      <Find
        title={c.ctx.theirItemTitle}
        image={c.ctx.theirItemImage}
        publicId={c.ctx.theirItemPublicId}
        label="chat.theirFind"
      />
    </div>
  )
}

/** A barter thread, with no shell and no page width around it.
 *
 *  This is the whole conversation as a column that fills whatever box it is
 *  given: the inbox's right-hand pane on desktop, and the full screen on a
 *  phone via MatchThread. One component so the two can never drift -- the
 *  split that existed before had the pane reading the dead V3 `swaps` tables
 *  while the phone read the live `barter_matches` ones, so desktop showed an
 *  empty thread for a conversation the phone rendered fine.
 */
export function MatchThreadPane() {
  const c = useMatchChat()
  const { t } = useT()
  const navigate = useNavigate()

  /** With both panes visible the swap list is already on the left, so a back
   *  button here would only undo the selection the user just made. On a phone
   *  -- and a portrait tablet -- this pane IS the screen, so it needs one. */
  const twoPane = useTwoPane()

  /** Recording takes the whole composer row: the text box and send button are
   *  unmounted rather than disabled while the mic runs. */
  const [recording, setRecording] = useState(false)

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-4">
        {!twoPane && (
          <Button
            variant="ghost"
            size="icon"
            pill
            onClick={c.goBack}
            aria-label={t('common.back')}
          >
            <Icon name="ArrowLeft" size={20} />
          </Button>
        )}
        {/* Someone's name: user data, never stamped with a key. */}
        <span className="min-w-0 flex-1 truncate font-display text-h3 text-foreground">
          {c.ctx?.otherName || t('swaps.someone')}
        </span>
        {/* Their trust score sits in the title bar, per the wireframe. The
            question "who am I about to meet?" is at its sharpest here, in
            the conversation where a meeting is being arranged. */}
        {c.ctx && c.ctx.otherTrades > 0 && (
          <span
            data-i18n="barter.trustScore"
            className="shrink-0 rounded-pill bg-secondary px-2.5 py-1 font-body text-xs text-muted-foreground"
          >
            {t('barter.trustScore', { count: c.ctx.otherTrades })}
          </span>
        )}
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
            {c.messages.map((m) => {
              const mine = m.sender_id === c.userId
              return (
                <MessageBubble
                  key={m.client_msg_id || m.id}
                  from={mine ? 'me' : 'them'}
                  wide={m.kind === 'audio'}
                  time={new Date(m.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                >
                  {m.kind === 'audio' && m.audio_url ? (
                    <VoiceNote
                      src={m.audio_url}
                      durationMs={m.duration_ms ?? 0}
                      mine={mine}
                      seed={m.client_msg_id || m.id}
                      pending={m.pending}
                    />
                  ) : (
                    m.body
                  )}
                </MessageBubble>
              )
            })}
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
        {/* Arrange has been routed at /matches/:id/arrange since the V4 rebuild
            but nothing ever linked to it, so the guided meet-up step was
            unreachable from the one screen it belongs to. Ghost, and above the
            composer: proposing a place is a step in the conversation, not a
            louder alternative to confirming the swap. */}
        {c.canSend && (
          <Button
            variant="ghost"
            size="sm"
            className="self-start"
            onClick={() => c.matchId && navigate(`/matches/${c.matchId}/arrange`)}
          >
            <Icon name="MapPin" size={16} />
            <T as="span" k="chat.arrange" />
          </Button>
        )}

        {c.canSend && (
          <div className="flex items-end gap-2">
            {/* Recording takes over the whole row rather than sitting beside a
                text box nobody can type in while it runs. The recorder
                renders nothing at all where the browser cannot record. */}
            <VoiceRecorderButton
              onRecorded={c.sendVoice}
              disabled={c.sending}
              onRecordingChange={setRecording}
            />
            {!recording && (
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
            )}
            {!recording && (
            <Button
              size="icon"
              pill
              disabled={!c.input.trim() || c.sending}
              onClick={c.send}
              aria-label={t('chat.send')}
            >
              <Send className="size-5" />
            </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
