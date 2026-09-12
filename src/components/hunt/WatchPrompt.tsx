import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { T, useT } from '@/i18n/T'
import { saveSearch } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

/** "Tell me when one turns up."
 *
 *  The tier sheet's wishlist trigger, fired where it belongs: an empty deck.
 *  That is the moment someone has run out of things to look at and still
 *  wants something -- the one time asking "what are you after?" is a service
 *  rather than an interruption.
 *
 *  Deliberately below the empty state's own actions rather than inside them.
 *  Widening the radius gets you cards NOW; this is for when that has not
 *  worked either, and a third primary button would compete with the two that
 *  do something immediately.
 */
export function WatchPrompt() {
  const { t } = useT()
  const userId = useAuthStore((s) => s.session?.user?.id)
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  if (!userId || done) {
    return done ? (
      <T
        as="p"
        k="wishlist.saved"
        className="mt-6 text-center font-body text-sm text-muted-foreground"
      />
    ) : null
  }

  const submit = async () => {
    const q = query.trim()
    if (!q || busy) return
    setBusy(true)
    // Categories are left empty on purpose: this is a free-text wish, and the
    // trigger treats an empty category list as "anything". Asking someone to
    // pick a taxonomy here would turn one sentence into a form.
    const { error } = await saveSearch({
      userId,
      query: q,
      categories: [],
      // Omitted rather than null: the column is nullable and the trigger uses
      // home city as the radius until real distance exists.
      radiusKm: undefined,
      cadence: 'instant',
    })
    setBusy(false)
    if (error) {
      toast.error(t('common.errorGeneric'))
      return
    }
    setDone(true)
  }

  return (
    <div className="mx-auto mt-6 w-full max-w-[340px] rounded-card border border-border/[0.14] bg-card p-4">
      <T as="p" k="wishlist.saveTitle" className="font-display text-sm font-semibold text-foreground" />
      <T as="p" k="wishlist.saveBody" className="mt-0.5 font-body text-xs text-muted-foreground" />
      <div className="mt-3 flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={t('wishlist.placeholder')}
          maxLength={60}
          className="flex-1"
        />
        <Button size="sm" disabled={!query.trim() || busy} onClick={submit} data-i18n="wishlist.saveAction">
          {t('wishlist.saveAction')}
        </Button>
      </div>
    </div>
  )
}
