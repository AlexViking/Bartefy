import * as React from 'react'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Icon } from '@/components/ui/icon'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { UserAvatar } from '@/components/ui/user-avatar'
import { BlockSheet } from '@/components/swap/BlockSheet'
import { VoiceNote } from '@/components/swap/VoiceNote'
import { FindDetailsSheet } from '@/components/FindDetails'
import { VoiceRecorderButton } from '@/components/swap/VoiceRecorder'
import { T, useT } from '@/i18n/T'
import { cn } from '@/lib/utils'
import { useMatchChat } from '@/screens/Chat/useMatchChat'
import type { SwapItem } from './useSwapsDesk'

const day = (iso: string | null | undefined, locale: string) =>
  iso ? new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' }) : ''

/** An agreed swap: its conversation, with the swap itself in the header.
 *
 *  Header: the pair (tap to see both finds large), who, the two confirm
 *  ticks, and the ONE thing to do now -- confirm, or wait. Call it off,
 *  arranging the handover and blocking sit behind ⋮.
 *
 *  Archive (Alex, 2026-09-29): a done swap is read-only. The history stays,
 *  the composer becomes a closed note -- disabled, never deleted, because the
 *  thread is what settles a dispute later.
 */
export function ChatPane({ s, onBack }: { s: SwapItem; onBack?: () => void }) {
  const { t, lang: locale } = useT()
  const navigate = useNavigate()
  const c = useMatchChat(s.id)
  const [photos, setPhotos] = React.useState(false)
  const [details, setDetails] = React.useState<{ find: SwapItem['mine']; label: string; mine: boolean } | null>(null)
  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [cancelOpen, setCancelOpen] = React.useState(false)
  const [blockOpen, setBlockOpen] = React.useState(false)
  const [recording, setRecording] = React.useState(false)

  // The list's row is the fallback until the thread's own context loads.
  const status = c.ctx?.status ?? s.status
  const mineOk = c.ctx?.mineConfirmed ?? s.mineConfirmed
  const themOk = c.ctx?.theirsConfirmed ?? s.theirsConfirmed
  const first = s.who.name.split(' ')[0] || s.who.name || t('desk.someone')
  const active = status === 'active'

  const tick = (name: string, ok: boolean) => (
    <span className={cn('inline-flex items-center gap-1 font-body text-[12px]', ok ? 'text-primary' : 'text-muted-foreground')}>
      <Icon name={ok ? 'CircleCheck' : 'Clock'} size={14} />
      {name}
    </span>
  )

  const action =
    status === 'completed' ? (
      <span className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-pill bg-mint px-3 font-body text-label-md text-forest">
        <Icon name="CircleCheck" size={16} />
        {t('desk.swappedOn', { date: day(s.completedAt, locale) })}
      </span>
    ) : status === 'cancelled' ? (
      <span className="inline-flex h-9 items-center whitespace-nowrap rounded-pill bg-secondary px-3 font-body text-label-md text-muted-foreground">
        <T as="span" k="desk.calledOff" />
      </span>
    ) : mineOk ? (
      <span className="whitespace-nowrap font-body text-label-md text-muted-foreground">{t('desk.waitingForName', { name: first })}</span>
    ) : (
      <Button onClick={() => setConfirmOpen(true)} disabled={c.busy} className="w-full whitespace-nowrap">
        <Icon name="CircleCheck" size={18} />
        {themOk ? t('desk.confirmHave', { title: s.theirs.title }) : t('barter.confirmAction')}
      </Button>
    )

  const bubble = (mine: boolean) =>
    cn(
      'max-w-[75%] rounded-card px-3.5 py-2 font-body text-body-md',
      mine ? 'self-end rounded-tr-none bg-primary text-primary-foreground' : 'self-start rounded-tl-none bg-stone text-ink',
    )
  const sys = (text: string) => (
    <p className="my-1 self-center rounded-pill bg-background px-3 py-1 text-center font-body text-[12px] text-muted-foreground">{text}</p>
  )

  return (
    <article className="flex h-full flex-col">
      <header className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-input px-4 py-3">
        {onBack && (
          <button type="button" onClick={onBack} aria-label={t('desk.back')} className="-ml-2 grid size-10 shrink-0 place-items-center rounded-pill hover:bg-secondary">
            <Icon name="ArrowLeft" size={22} />
          </button>
        )}
        <button
          type="button"
          onClick={() => setPhotos((v) => !v)}
          aria-expanded={photos}
          title={t('desk.seeSwap')}
          className="flex shrink-0 items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {s.mine.photo ? <img alt="" className="size-11 rounded-lg object-cover" src={s.mine.photo} /> : <span className="size-11 rounded-lg bg-secondary" />}
          <Icon name="ArrowLeftRight" size={16} className="mx-1 text-muted-foreground" />
          {s.theirs.photo ? <img alt="" className="size-11 rounded-lg object-cover" src={s.theirs.photo} /> : <span className="size-11 rounded-lg bg-secondary" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-center gap-2">
            <UserAvatar name={s.who.name || '?'} size="sm" className="size-6 text-[10px]" />
            <span className="shrink-0 whitespace-nowrap font-body text-label-lg text-foreground">{s.who.name || t('desk.someone')}</span>
            <span className="min-w-0 truncate font-body text-[12px] text-muted-foreground">
              · {t('desk.pairLine', { mine: s.mine.title, theirs: s.theirs.title })}
            </span>
          </p>
          <p className="mt-1 flex items-center gap-3">
            {status === 'completed' ? (
              <span className="font-body text-[12px] text-muted-foreground">{t('desk.bothConfirmed', { date: day(s.completedAt, locale) })}</span>
            ) : (
              <>
                {tick(t('desk.you'), mineOk)}
                {tick(first, themOk)}
              </>
            )}
          </p>
        </div>
        <div className={cn('shrink-0', !onBack ? '' : 'order-last w-full')}>{action}</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label={t('desk.more')} className="grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-secondary">
              <Icon name="EllipsisVertical" size={20} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            {active && (
              <DropdownMenuItem onSelect={() => navigate(`/matches/${s.id}/arrange`)} className="h-10 gap-3">
                <Icon name="MapPin" size={18} className="text-muted-foreground" />
                <T as="span" k="chat.arrange" />
              </DropdownMenuItem>
            )}
            {active && (
              <DropdownMenuItem onSelect={() => setCancelOpen(true)} className="h-10 gap-3">
                <Icon name="X" size={18} className="text-muted-foreground" />
                <T as="span" k="barter.cancelAction" />
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => setBlockOpen(true)} className="h-10 gap-3">
              <Icon name="ShieldAlert" size={18} className="text-muted-foreground" />
              {t('desk.block', { name: first })}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {photos && (
        <div className="shrink-0 border-b border-input bg-background/40 px-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              [t('desk.youGive'), 'text-primary', s.mine],
              [t('desk.youGet'), 'text-foreground', s.theirs],
            ].map(([label, tone, f]) => {
              const find = f as SwapItem['mine']
              return (
                <figure key={String(label)} className="flex min-w-0 flex-col gap-1.5">
                  <p className={cn('font-body text-label-sm uppercase', String(tone))}>{String(label)}</p>
                  {/* Opens the whole find: every photo, condition, wants, story. */}
                  <button
                    type="button"
                    onClick={() => setDetails({ find, label: String(label), mine: find === s.mine })}
                    className="group flex flex-col gap-1.5 rounded-card text-left outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    {find.photo ? (
                      <img alt="" className="aspect-[4/3] max-h-[max(140px,calc(50dvh-200px))] w-full rounded-card object-cover transition group-hover:brightness-95" src={find.photo} />
                    ) : (
                      <span className="block aspect-[4/3] w-full rounded-card bg-secondary" />
                    )}
                    <figcaption className="font-body text-label-lg text-foreground">{find.title}</figcaption>
                    <span className="inline-flex items-center gap-1 font-body text-label-md text-primary group-hover:underline">
                      <T as="span" k="findDetails.open" />
                      <Icon name="ArrowRight" size={14} />
                    </span>
                  </button>
                </figure>
              )
            })}
          </div>
          <p className="mt-3 flex items-start gap-2 font-body text-body-sm text-muted-foreground">
            <Icon name="Info" size={18} className="shrink-0" />
            {status === 'completed' ? t('desk.photosArchive', { date: day(s.completedAt, locale) }) : t('desk.photosNote')}
          </p>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-5 py-4">
        {c.loading ? (
          <T as="p" k="common.loading" className="self-center font-body text-body-sm text-muted-foreground" />
        ) : (
          <>
            {sys(t('desk.agreedOn', { date: day(s.createdAt, locale) }))}
            {c.messages.map((m) => {
              const mine = m.sender_id === c.userId
              return m.kind === 'audio' && m.audio_url ? (
                <div key={m.client_msg_id || m.id} className={cn(bubble(mine), 'px-3 py-2')}>
                  <VoiceNote src={m.audio_url} durationMs={m.duration_ms ?? 0} mine={mine} seed={m.client_msg_id || m.id} pending={m.pending} />
                </div>
              ) : (
                // A message is user data: no key.
                <p key={m.client_msg_id || m.id} data-selectable className={cn(bubble(mine), 'whitespace-pre-wrap break-words')}>
                  {m.body}
                </p>
              )
            })}
            {status === 'active' && themOk && !mineOk && sys(t('desk.theyConfirmed', { name: first }))}
            {status === 'active' && mineOk && !themOk && sys(t('desk.youConfirmed', { name: first }))}
            {status === 'completed' && sys(t('desk.doneLine', { date: day(s.completedAt, locale) }))}
            {status === 'cancelled' && sys(t('desk.calledOffLine'))}
            <div ref={c.bottomRef} />
          </>
        )}
      </div>

      {c.errorKey && (
        <p role="alert" className="mx-4 mb-2 rounded-card bg-coral px-3 py-2 font-body text-body-sm text-ink">{t(c.errorKey)}</p>
      )}

      {c.canSend ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void c.send()
          }}
          className="flex shrink-0 items-center gap-2 border-t border-input px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3"
        >
          {!recording && (
            <input
              value={c.input}
              onChange={(e) => c.setInput(e.target.value)}
              autoComplete="off"
              placeholder={t('desk.messagePlaceholder', { name: first })}
              aria-label={t('desk.messagePlaceholder', { name: first })}
              className="h-11 min-w-0 flex-1 rounded-pill border-0 bg-background px-4 font-body text-body-md text-foreground outline-none focus:ring-2 focus:ring-ring/40"
            />
          )}
          <VoiceRecorderButton onRecorded={(b, ms) => void c.sendVoice(b, ms)} disabled={c.sending} onRecordingChange={setRecording} />
          {!recording && (
            <button
              type="submit"
              aria-label={t('desk.send')}
              disabled={!c.input.trim() || c.sending}
              className="grid size-11 shrink-0 place-items-center rounded-pill bg-primary text-primary-foreground transition-[filter] hover:brightness-90 disabled:opacity-50"
            >
              <Icon name="ArrowRight" size={20} />
            </button>
          )}
        </form>
      ) : (
        <p className="flex shrink-0 items-center justify-center gap-2 border-t border-input px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 font-body text-body-sm text-muted-foreground">
          <Icon name="Lock" size={16} />
          {status === 'completed' ? t('desk.chatClosed') : t('desk.chatClosedOff')}
        </p>
      )}

      <FindDetailsSheet
        open={!!details}
        onOpenChange={(o) => !o && setDetails(null)}
        itemId={details?.find.id}
        owner={first}
        mine={details?.mine}
        label={details?.label ?? ''}
      />

      {/* Confirming is not undoable: it trades both finds and closes the
          thread. That earns a second tap. */}
      <ResponsiveSheet
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="barter.confirmTitle"
        description="barter.confirmBody"
        footer={
          <div className="flex w-full flex-col gap-2">
            <Button
              fullWidth
              size="lg"
              disabled={c.busy}
              onClick={() => {
                setConfirmOpen(false)
                void c.confirm()
              }}
            >
              <T as="span" k="barter.confirmAction" />
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setConfirmOpen(false)}>
              <T as="span" k="common.notYet" />
            </Button>
          </div>
        }
      >
        <span className="sr-only">{t('barter.confirmBody')}</span>
      </ResponsiveSheet>

      <ResponsiveSheet
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="barter.cancelAction"
        description="barter.cancelConfirmBody"
        footer={
          <div className="flex w-full flex-col gap-2">
            <Button
              fullWidth
              size="lg"
              disabled={c.busy}
              onClick={() => {
                setCancelOpen(false)
                void c.cancel()
              }}
            >
              <T as="span" k="barter.cancelAction" />
            </Button>
            <Button variant="ghost" fullWidth onClick={() => setCancelOpen(false)}>
              <T as="span" k="common.notYet" />
            </Button>
          </div>
        }
      >
        <span className="sr-only">{t('barter.cancelConfirmBody')}</span>
      </ResponsiveSheet>

      {blockOpen && (
        <BlockSheet
          open
          onOpenChange={setBlockOpen}
          userId={s.who.id}
          userName={s.who.name}
          onBlocked={() => {
            setBlockOpen(false)
            onBack?.()
          }}
        />
      )}
    </article>
  )
}
