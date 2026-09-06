import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import { AppShell } from '@/components/shell/AppShell'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { T, useT } from '@/i18n/T'
import { getProfile } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { keys } from '@/lib/cache/queryClient'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

/** Invite friends.
 *
 *  The reward lands on the invitee's first completed trade, never at signup.
 *  That is the whole anti-abuse design: a signup is free to fake and a
 *  finished trade with a real person is not, so paying at signup would make
 *  accounts worth farming. The screen says so, because a person who does not
 *  know when they get paid assumes they were cheated.
 */
export default function Invite() {
  const { t } = useT()
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.session?.user?.id)
  const [copied, setCopied] = useState(false)

  const { data: profile } = useQuery({
    queryKey: keys.profile(userId ?? ''),
    queryFn: async () => {
      const { data, error } = await getProfile(userId!)
      if (error) throw error
      return data as Record<string, unknown>
    },
    enabled: !!userId,
  })

  /** Who arrived on my code, and how far they have got. Counts only -- a
   *  referral screen that named the people who joined would turn an invite
   *  code into a way to find out who someone knows. */
  const { data: invites } = useQuery({
    queryKey: ['invites', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, completed_trades')
        .eq('referred_by', userId!)
      if (error) throw error
      const rows = data ?? []
      return {
        joined: rows.length,
        traded: rows.filter((r) => Number(r.completed_trades ?? 0) > 0).length,
      }
    },
    enabled: !!userId,
  })

  const code = profile?.referral_code ? String(profile.referral_code) : ''
  const link = code ? `https://bartefy.com/signup?invite=${code}` : ''

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard is blocked outside a secure context and in some in-app
      // browsers. The code is selectable either way, so this is a
      // convenience failing, not the feature failing.
    }
  }

  const share = async () => {
    // The native sheet where it exists -- it is how people actually send a
    // link on a phone. Falls back to copying.
    if (navigator.share) {
      try {
        await navigator.share({ title: t('invite.shareTitle'), text: t('invite.shareText'), url: link })
        return
      } catch {
        // A cancelled share sheet throws. Not an error worth showing.
        return
      }
    }
    void copy(link)
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[560px] px-4 py-5">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="ghost" size="icon" pill onClick={() => navigate('/profile')} aria-label={t('common.back')}>
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <T as="h1" k="invite.title" className="font-display text-h2 text-foreground" />
        </div>

        <div className="rounded-card border-[1.5px] border-accent/50 bg-accent/[0.12] p-5 text-center">
          <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-pill bg-accent/30">
            <Icon name="Sparkles" size={26} className="text-accent-foreground" />
          </span>
          <T as="p" k="invite.pitch" className="mx-auto max-w-[34ch] font-body text-body text-foreground" />

          {code && (
            <>
              <T
                as="span"
                k="invite.yourCode"
                className="mt-4 block font-display text-caption uppercase tracking-[0.18em] text-muted-foreground"
              />
              <div className="mt-1.5 flex items-center justify-center gap-2">
                {/* data-selectable: global.css turns selection off app-wide,
                    and a code you cannot select is a code you cannot share. */}
                <code
                  data-selectable
                  className="rounded-card-sm bg-card px-3 py-2 font-display text-h3 font-bold tracking-wider text-foreground"
                >
                  {code}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  pill
                  onClick={() => copy(code)}
                  aria-label={t('invite.copy')}
                >
                  <Icon name={copied ? 'Check' : 'Package'} size={18} />
                </Button>
              </div>

              <Button fullWidth size="lg" className="mt-4" onClick={share} data-i18n="invite.share">
                {t('invite.share')}
              </Button>
            </>
          )}
        </div>

        {/* What the invites have actually done. Counts only: naming who joined
            would turn an invite code into a way to find out who someone knows. */}
        <section className="mt-5">
          <T
            as="h2"
            k="invite.yourInvites"
            className="mb-2 font-display text-caption uppercase tracking-[0.18em] text-muted-foreground"
          />
          <div className="flex gap-3">
            <Stat n={invites?.joined ?? 0} label="invite.joined" />
            <Stat n={invites?.traded ?? 0} label="invite.traded" />
          </div>
          <T
            as="p"
            k="invite.whenPaid"
            className="mt-3 font-body text-sm text-muted-foreground"
          />
        </section>
      </div>
    </AppShell>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  const { t } = useT()
  return (
    <div className={cn('flex-1 rounded-card border-[1.5px] border-border/[0.14] bg-card p-4 text-center')}>
      <span className="block font-display text-h2 font-bold tabular-nums text-foreground">{n}</span>
      <span data-i18n={label} className="block font-body text-sm text-muted-foreground">
        {t(label)}
      </span>
    </div>
  )
}
