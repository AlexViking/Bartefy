import { useNavigate } from 'react-router'

import { ConfirmAndRateSheet } from '@/components/swap/ConfirmAndRateSheet'
import { TroubleSheet } from '@/components/swap/TroubleSheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ToneBadge } from '@/components/ui/tone-badge'
import { OwnerRow } from '@/components/swap/OwnerRow'
import { SwapPair } from '@/components/swap/SwapPair'
import { InfoHint } from '@/components/guidance/InfoHint'
import { Icon } from '@/components/ui/icon'
import { T, useT } from '@/i18n/T'
import { useTwoPane } from '@/lib/platform'
import { cn } from '@/lib/utils'
import { Thread } from './Thread'
import { useChat } from './useChat'

/** The thread and the swap it is about, with no shell around it.
 *
 *  Chat.desktop mounts this as a whole page; SwapsInbox.desktop mounts the
 *  same component in its right-hand pane, so opening a conversation keeps the
 *  swap list in place instead of navigating away from it. One component, so
 *  the two can never drift.
 */
export function ChatPane() {
  const c = useChat()
  const { t } = useT()
  const navigate = useNavigate()

  /** On a portrait tablet this pane IS the screen -- the swap list is not
   *  beside it -- so it needs its own way back, exactly as the phone's Chat
   *  does. With both panes visible the list is right there and a back button
   *  would be noise. */
  const twoPane = useTwoPane()

  return (
    <>
      <div
        className={cn(
          'grid h-full',
          // Side by side where there is room. In portrait the rail costs 340px
          // of 768, leaving the conversation narrower than a phone -- so it
          // moves BELOW the thread rather than away. It carries the agree and
          // arrange actions, and a chat you cannot act from is a dead end.
          twoPane
            ? 'grid-cols-[1fr_340px]'
            : 'grid-cols-1 grid-rows-[minmax(0,1fr)_auto] overflow-y-auto',
        )}
      >
        <section
          className={cn(
            'flex min-h-0 min-w-0 flex-col',
            twoPane && 'border-r border-border/[0.14]',
          )}
        >
          <header className="flex items-center gap-3 border-b border-border/[0.14] bg-card px-5 py-3">
            {!twoPane && (
              <Button
                variant="ghost"
                size="icon"
                pill
                onClick={() => navigate('/matches')}
                aria-label={t('common.back')}
              >
                <Icon name="ArrowLeft" size={20} />
              </Button>
            )}
            <OwnerRow
              person={{
                id: c.ctx?.otherId ?? '',
                name: c.ctx?.otherName || t('swaps.someone'),
                swapCount: 0,
                verified: false,
              }}
              className="flex-1"
            />
            {c.ctx?.status === 'agreed' && (
              <ToneBadge tone="green" data-i18n="swaps.statusAgreed">
                {t('swaps.statusAgreed')}
              </ToneBadge>
            )}
          </header>

          <Thread c={c} />
        </section>

        <aside
          className={cn(
            'flex flex-col gap-4 bg-card p-5',
            twoPane ? 'overflow-y-auto' : 'border-t border-border/[0.14]',
          )}
        >
          <div className="flex items-center gap-1.5">
            <T
              as="span"
              k="swaps.title"
              className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground"
            />
            <InfoHint k="help.whatIsBartefy" side="left" />
          </div>

          {c.ctx && (
            <SwapPair
              mine={{ id: 'a', title: c.ctx.itemATitle, photoUrl: c.ctx.itemAImages[0] }}
              theirs={{ id: 'b', title: c.ctx.itemBTitle, photoUrl: c.ctx.itemBImages[0] }}
            />
          )}

          <Separator />

          <div className="flex flex-col gap-2">
            {c.ctx?.status !== 'agreed' && (
              <Button
                fullWidth
                onClick={() => void c.agree()}
                disabled={c.agreeing}
                data-i18n="chat.confirmSwap"
              >
                {c.agreeing ? t('common.loading') : t('chat.confirmSwap')}
              </Button>
            )}
            {c.agreeError && (
              <T
                as="p"
                k="chat.confirmFailed"
                className="font-body text-sm text-destructive"
                role="alert"
              />
            )}
            <Button variant="ghost" fullWidth onClick={c.goArrange} data-i18n="chat.arrange">
              {t('chat.arrange')}
            </Button>
            {/* Confirming a handover and rating are both ALWAYS_FREE, so this
                is offered as soon as the swap is agreed. */}
            {c.ctx?.status === 'agreed' && (
              <Button
                variant="ghost"
                fullWidth
                onClick={() => c.setConfirmOpen(true)}
                data-i18n="chat.markDone"
              >
                {t('chat.markDone')}
              </Button>
            )}
          </div>

          <div className="mt-auto space-y-2">
            <T
              as="p"
              k="arrange.safetyBody"
              className="font-body text-sm leading-relaxed text-muted-foreground"
            />
            <Button
              variant="ghost"
              fullWidth
              className="text-destructive"
              onClick={c.openTrouble}
              data-i18n="chat.trouble"
            >
              {t('chat.trouble')}
            </Button>
          </div>
        </aside>
      </div>

      <ConfirmAndRateSheet
        open={c.confirmOpen}
        onOpenChange={c.setConfirmOpen}
        mine={{ id: 'a', title: c.ctx?.itemATitle ?? '', photoUrl: c.ctx?.itemAImages[0] }}
        theirs={{ id: 'b', title: c.ctx?.itemBTitle ?? '', photoUrl: c.ctx?.itemBImages[0] }}
        otherName={c.ctx?.otherName ?? ''}
        theyConfirmed={false}
        onConfirm={() => void c.confirmHandover()}
        onRate={(stars, tags) => void c.rate(stars, tags)}
        onTrouble={() => {
          c.setConfirmOpen(false)
          c.openTrouble()
        }}
      />

      <TroubleSheet
        open={c.troubleOpen}
        onOpenChange={c.setTroubleOpen}
        otherName={c.ctx?.otherName ?? ''}
        onSubmit={(reason, note, block) => void c.submitTrouble(reason, note, block)}
      />
    </>
  )
}
