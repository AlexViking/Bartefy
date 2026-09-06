import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import { Icon } from '@/components/ui/icon'
import { useT } from '@/i18n/T'
import { getIncomingOffers } from '@/lib/barter'
import { useAuthStore } from '@/store/auth'
import { cn } from '@/lib/utils'

/** The way into the offers inbox, from the top of Swaps.
 *
 *  Offers are not a fifth tab bar destination. There are four, plus the brass
 *  Add, and a fifth would crowd the phone bar for something that is empty most
 *  of the time. But an offer is a decision waiting on you -- unlike a swap,
 *  which is a conversation already under way -- so it earns its own screen
 *  rather than a tab inside this one.
 *
 *  It only renders when something is waiting. A permanent row saying "0 offers"
 *  is furniture; a row that appears when someone wants your bike is news.
 */
export function OffersLink({ className }: { className?: string }) {
  const navigate = useNavigate()
  const { t } = useT()
  const userId = useAuthStore((s) => s.session?.user?.id)

  const { data: count = 0 } = useQuery({
    queryKey: ['barter', 'offers', 'incoming', userId ?? ''],
    queryFn: async () => {
      const { data, error } = await getIncomingOffers(userId!)
      if (error) throw error
      return (data ?? []).length
    },
    enabled: !!userId,
  })

  if (count === 0) return null

  return (
    <button
      type="button"
      onClick={() => navigate('/offers')}
      className={cn(
        'flex w-full items-center gap-3 rounded-card border-[1.5px] border-accent/50 bg-accent/[0.12] p-3',
        'text-left transition-colors duration-fast ease-brand hover:bg-accent/20',
        className,
      )}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-accent/30">
        <Icon name="Sparkles" size={18} className="text-accent-foreground" />
      </span>
      <span className="min-w-0 flex-1">
        <span data-i18n="barter.inboxLink" className="block font-display text-[15px] font-semibold text-foreground">
          {t('barter.inboxLink')}
        </span>
        <span data-i18n="barter.inboxCount" className="block font-body text-sm text-muted-foreground">
          {t('barter.inboxCount', { count })}
        </span>
      </span>
      <Icon name="ChevronRight" size={18} className="shrink-0 text-muted-foreground" />
    </button>
  )
}
