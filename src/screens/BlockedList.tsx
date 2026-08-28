import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, ShieldOff } from 'lucide-react'

import { AppShell } from '@/components/shell/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { UserAvatar } from '@/components/ui/user-avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { T, useT } from '@/i18n/T'
import { listBlocked, unblockUser } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface BlockedPerson {
  id: string
  /** Null when the profile has no name set — rendered as a fallback string. */
  name: string | null
  since: string
}

/** The list of people you have blocked, and the way back out of it.
 *
 *  Blocking is in ALWAYS_FREE, and so is undoing it — there is no tier check
 *  anywhere on this screen. One column on both platforms, like Settings: a
 *  list of rows reads the same everywhere.
 */
export function BlockedList() {
  const navigate = useNavigate()
  const { t, lang } = useT()
  const userId = useAuthStore((s) => s.session?.user?.id)

  const [people, setPeople] = useState<BlockedPerson[] | null>(null)
  const [pending, setPending] = useState<BlockedPerson | null>(null)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!userId) return
    let cancelled = false

    listBlocked(userId).then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        // Nothing to unblock is indistinguishable from a failed read on an
        // empty list, so a read error shows the empty state rather than a
        // wrong count. The row stays reachable; the person can come back.
        console.error('[blocked] list failed', error)
        setPeople([])
        return
      }
      setPeople(
        (data ?? []).map((row) => {
          // PostgREST returns an embedded one-to-one as an object; older
          // versions of the client type it as an array.
          const p = Array.isArray(row.profile) ? row.profile[0] : row.profile
          return {
            id: row.blocked as string,
            // `name` is nullable in profiles. The fallback is applied at
            // render, not here, so the effect need not depend on `t` —
            // useT() returns a fresh `t` every render, and depending on it
            // would refetch forever.
            name: p?.name ?? null,
            since: row.created_at as string,
          }
        }),
      )
    })

    return () => {
      cancelled = true
    }
  }, [userId])

  const confirmUnblock = useCallback(async () => {
    if (!userId || !pending) return
    setBusy(true)
    setFailed(false)

    const { error } = await unblockUser(userId, pending.id)
    setBusy(false)

    if (error) {
      console.error('[blocked] unblock failed', error)
      setFailed(true)
      return
    }

    setPeople((prev) => (prev ?? []).filter((p) => p.id !== pending.id))
    setPending(null)
  }, [userId, pending])

  const formatSince = (iso: string) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', year: 'numeric' }).format(d)
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[640px] px-5 pb-10 pt-4">
        <header className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label={t('common.back')}
            className="flex size-11 items-center justify-center rounded-pill text-foreground hover:bg-foreground/[0.06]"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>
          <T as="h1" k="settings.blockedTitle" className="font-display text-h2 text-foreground" />
        </header>

        <T
          as="p"
          k="settings.blockedBody"
          className="mb-6 px-1 font-body text-[15px] leading-relaxed text-muted-foreground"
        />

        {people === null ? (
          <T
            as="p"
            k="common.loading"
            className="py-10 text-center font-body text-sm text-muted-foreground"
          />
        ) : people.length === 0 ? (
          <EmptyState
            title="settings.blockedEmptyTitle"
            body="settings.blockedEmptyBody"
            art={<ShieldOff className="size-7 text-muted-foreground" aria-hidden="true" />}
          />
        ) : (
          <Card className="overflow-hidden rounded border-border/[0.14] bg-card">
            {people.map((p, i) => {
              const shown = p.name ?? t('profile.someone')
              return (
              <div key={p.id}>
                {i > 0 && <Separator />}
                <div className="flex min-h-hit items-center gap-3 px-4 py-3">
                  <UserAvatar name={shown} size="md" />
                  <div className="min-w-0 flex-1">
                    {/* User data, not a key — no data-i18n on this line. */}
                    <p className="truncate font-body text-base text-foreground">{shown}</p>
                    <p
                      data-i18n="settings.blockedSince"
                      className="mt-0.5 truncate font-body text-sm text-muted-foreground"
                    >
                      {t('settings.blockedSince', { when: formatSince(p.since) })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFailed(false)
                      setPending(p)
                    }}
                    data-i18n="settings.unblock"
                  >
                    {t('settings.unblock')}
                  </Button>
                </div>
              </div>
              )
            })}
          </Card>
        )}
      </div>

      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setPending(null)
            setFailed(false)
          }
        }}
      >
        <AlertDialogContent className="rounded-hero">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-h3">
              {t('settings.unblockTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="font-body text-muted-foreground">
              {t('settings.unblockBody')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {failed && (
            <T
              as="p"
              k="settings.unblockFailed"
              className="font-body text-sm text-destructive"
              role="alert"
            />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Keep the dialog mounted while the delete is in flight, so a
                // failure has somewhere to be shown.
                e.preventDefault()
                void confirmUnblock()
              }}
              disabled={busy}
            >
              {busy ? t('common.loading') : t('settings.unblock')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  )
}
