import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import { AppShell } from '@/components/shell/AppShell'
import { BlockSheet } from '@/components/swap/BlockSheet'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { UserAvatar } from '@/components/ui/user-avatar'
import { T, useT } from '@/i18n/T'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'

type Row = Record<string, unknown>

/** What somebody else sees.
 *
 *  Deliberately not the same screen as Profile with a flag flipped. The
 *  wireframe is explicit that no points balance appears here: others see the
 *  trust score, never someone's spendable wallet. Building it as one screen
 *  with conditionals is how a balance ends up rendered for the wrong person
 *  after a refactor nobody re-checked.
 *
 *  Reads profiles_public, which exposes exactly the safe columns. The base
 *  table stays owner-only, so this cannot leak a referral code or a home
 *  location even if this file asked for one.
 */
export default function PublicProfile() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { t } = useT()
  const me = useAuthStore((s) => s.session?.user?.id)
  const [blockOpen, setBlockOpen] = useState(false)

  const { data: person, isLoading } = useQuery({
    queryKey: ['publicProfile', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles_public')
        .select('id, name, home_city, completed_trades')
        .eq('id', userId!)
        .maybeSingle()
      if (error) throw error
      // Shaped here rather than cast: the row comes back as unknown columns,
      // and every use downstream then has to re-narrow it.
      const r = data as Row | null
      return r
        ? {
            id: String(r.id ?? ''),
            name: r.name ? String(r.name) : '',
            homeCity: r.home_city ? String(r.home_city) : '',
            trades: Number(r.completed_trades ?? 0),
          }
        : null
    },
    enabled: !!userId,
  })

  /** Their finds. Only active ones: a traded or removed listing is not
   *  something anyone can act on, and showing it invites an offer that will
   *  be refused. */
  const { data: items = [] } = useQuery({
    queryKey: ['publicProfile', 'items', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items')
        .select('id, title, images, category, condition')
        .eq('user_id', userId!)
        .eq('status', 'active')
        .eq('moderation_status', 'ok')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as Row[]
    },
    enabled: !!userId,
  })

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center p-8">
          <T as="p" k="common.loading" className="font-body text-sm text-muted-foreground" />
        </div>
      </AppShell>
    )
  }

  const name = person?.name || t('swaps.someone')
  const trades = person?.trades ?? 0
  const isMe = me === userId

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[720px] px-4 py-5">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="ghost" size="icon" pill onClick={() => navigate(-1)} aria-label={t('common.back')}>
            <Icon name="ArrowLeft" size={20} />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <UserAvatar name={name} size="lg" />
          <div className="min-w-0">
            {/* A person's name and city: user data, never stamped with a key. */}
            <h1 className="truncate font-display text-h2 text-foreground">{name}</h1>
            {person?.homeCity && (
              <p className="flex items-center gap-1.5 font-body text-sm text-muted-foreground">
                <Icon name="MapPin" size={14} aria-hidden="true" />
                {person.homeCity}
              </p>
            )}
          </div>
        </div>

        {/* The trust score, and nothing beside it. No points balance here --
            what somebody can spend is their business. */}
        <div className="mt-4 inline-flex items-center gap-2 rounded-pill bg-secondary px-3.5 py-1.5">
          <Icon name="Check" size={15} className="text-primary" />
          <span
            data-i18n={trades > 0 ? 'barter.trustScore' : 'barter.trustScoreNone'}
            className="font-body text-sm text-foreground"
          >
            {trades > 0 ? t('barter.trustScore', { count: trades }) : t('barter.trustScoreNone')}
          </span>
        </div>

        <T
          as="h2"
          k="publicProfile.theirFinds"
          className="mb-2 mt-6 font-display text-caption uppercase tracking-[0.18em] text-muted-foreground"
        />

        {items.length === 0 ? (
          <T as="p" k="publicProfile.noFinds" className="font-body text-body text-muted-foreground" />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((it) => {
              const images = Array.isArray(it.images) ? (it.images as string[]) : []
              return (
                <li key={String(it.id)}>
                  <button
                    type="button"
                    onClick={() => navigate('/item/' + it.id)}
                    className="w-full overflow-hidden rounded-card border-[1.5px] border-border/[0.14] bg-card text-left transition-colors hover:border-primary/40"
                  >
                    {images[0] ? (
                      <img src={images[0]} alt="" className="aspect-square w-full object-cover" />
                    ) : (
                      <span className="flex aspect-square w-full items-center justify-center bg-secondary">
                        <Icon name="Package" size={22} className="text-muted-foreground" />
                      </span>
                    )}
                    <span className="block truncate p-2.5 font-body text-sm text-foreground">
                      {String(it.title ?? '')}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {/* Report and block are always free and never gated. They sit at the
            bottom because they are the exit, not the point of the screen. */}
        {!isMe && (
          <div className="mt-8 flex flex-wrap gap-2 border-t border-border/[0.14] pt-4">
            <Button variant="ghost" onClick={() => setBlockOpen(true)} data-i18n="block.action">
              {t('block.action')}
            </Button>
          </div>
        )}
      </div>

      <BlockSheet
        open={blockOpen}
        onOpenChange={setBlockOpen}
        userId={userId ?? ''}
        userName={name}
        onBlocked={() => navigate('/discover')}
      />
    </AppShell>
  )
}
