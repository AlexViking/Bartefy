import { ConfirmAndRateSheet } from '@/components/swap/ConfirmAndRateSheet'
import { TroubleSheet } from '@/components/swap/TroubleSheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ToneBadge } from '@/components/ui/tone-badge'
import { OwnerRow } from '@/components/swap/OwnerRow'
import { SwapPair } from '@/components/swap/SwapPair'
import { InfoHint } from '@/components/guidance/InfoHint'
import { T, useT } from '@/i18n/T'
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

  return (
    <>
      <div className="grid h-full grid-cols-[1fr_340px]">
        <section className="flex min-h-0 min-w-0 flex-col border-r border-border/[0.14]">
          <header className="flex items-center gap-3 border-b border-border/[0.14] bg-card px-5 py-3">
            <OwnerRow
              person={{
                id: c.ctx?.otherId ?? '',
                name: c.ctx?.otherName ?? 'Swapper',
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

        <aside className="flex flex-col gap-4 overflow-y-auto bg-card p-5">
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
