import { OwnerRow } from '@/components/swap/OwnerRow'
import { WantsRow } from '@/components/swap/WantsRow'
import { T, useT } from '@/i18n/T'
import type { useItemDetail } from './useItemDetail'

type Ready = Extract<ReturnType<typeof useItemDetail>, { ready: true }>

/** Everything written about the find: the line of facts, the title, the story,
 *  the owner, and what they are hoping for. Shared by both layouts.
 */
export function Facts({ d }: { d: Ready }) {
  const { t } = useT()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground">
          {/* categoryLabel() and conditionAt() return translation KEYS, not
              copy. Rendering them raw put "CATEGORY.TOOLSDIY · CONDITION.LIKENEW"
              in front of users — uppercased by the tracking style above, which
              is what made it look deliberate. The city is user data and is not
              translated. */}
          {t(d.item.category)} {'·'} {d.owner.distanceLabel} {'·'} {t(d.item.condition)}
        </span>
        <h1 className="font-display text-h2 leading-tight text-foreground">{d.item.title}</h1>
        <p className="font-body text-base text-muted-foreground" style={{ textWrap: 'pretty' }}>
          {d.item.description}
        </p>
      </div>

      <div className="rounded-sm border border-border/[0.14] bg-popover p-3">
        <OwnerRow person={d.owner} action={t('item.viewProfile')} onAction={d.goOwner} />
      </div>

      <WantsRow wants={d.item.wants} note={d.item.wantsNote} matchCount={0} />

      {d.item.reserved && (
        <T
          as="p"
          k="item.reservedNote"
          className="rounded-sm bg-secondary p-3 font-body text-sm text-muted-foreground"
        />
      )}
    </div>
  )
}
