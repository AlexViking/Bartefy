import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router'

import { PersonCard } from '@/components/PersonCard'
import { AppShell } from '@/components/shell/AppShell'
import { BlockSheet } from '@/components/swap/BlockSheet'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { T, useT } from '@/i18n/T'
import { supabase } from '@/lib/supabase'

/** /u/:userId -- someone else, as the person card and nothing more (V6).
 *  Replaces PublicProfile, which listed "Their finds": a desk to browse, which
 *  the random deck rules out (Alex, 2026-09-28). Block stays -- always free. */
export default function Person() {
  const { userId = '' } = useParams<{ userId: string }>()
  const { t } = useT()
  const navigate = useNavigate()
  const [blockOpen, setBlockOpen] = React.useState(false)

  const { data: p, isLoading, error } = useQuery({
    queryKey: ['person', userId],
    queryFn: async () => {
      const { data, error: e } = await supabase.from('profiles_public').select('id, name, home_city, completed_trades').eq('id', userId).maybeSingle()
      if (e) throw e
      return data as { id: string; name: string | null; home_city: string | null; completed_trades: number | null } | null
    },
    enabled: !!userId,
  })

  return (
    <AppShell>
      <div className="mx-auto flex w-full max-w-[420px] flex-col gap-4 px-4 py-6">
        <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 self-start font-body text-label-lg text-muted-foreground hover:text-foreground">
          <Icon name="ArrowLeft" size={18} />
          <T as="span" k="common.back" />
        </button>
        {isLoading ? (
          <T as="p" k="common.loading" className="font-body text-body-sm text-muted-foreground" />
        ) : error || !p ? (
          <T as="p" k="person.missing" className="font-body text-body-md text-muted-foreground" />
        ) : (
          <PersonCard name={p.name ?? ''} city={p.home_city} swaps={p.completed_trades ?? 0}>
            <Button variant="ghost" size="sm" className="mt-5" onClick={() => setBlockOpen(true)}>
              <Icon name="ShieldAlert" size={16} />
              {t('desk.block', { name: (p.name ?? '').split(' ')[0] || t('desk.someone') })}
            </Button>
          </PersonCard>
        )}
      </div>
      {p && blockOpen && (
        <BlockSheet open onOpenChange={setBlockOpen} userId={p.id} userName={p.name ?? ''} onBlocked={() => navigate('/discover')} />
      )}
    </AppShell>
  )
}
