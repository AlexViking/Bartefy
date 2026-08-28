import { MapPin } from 'lucide-react'

import { Chip } from '@/components/ui/tone-badge'
import { CITY_OPTIONS } from '@/screens/Onboarding/useOnboarding'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** One city picker, used by onboarding and by Settings. The list is the set of
 *  cities we have meeting spots seeded for — offering a city with nowhere safe
 *  to meet would be a promise we cannot keep.
 */
export function CityPicker({
  value,
  onSelect,
  className,
}: {
  value?: string
  onSelect: (city: string) => void
  className?: string
}) {
  const { t } = useT()
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <MapPin className="size-4" aria-hidden="true" />
        <span data-i18n="onboarding.cityTitle" className="font-body text-sm">
          {t('onboarding.cityTitle')}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {CITY_OPTIONS.map((c) => (
          <Chip key={c} active={value === c} onClick={() => onSelect(c)}>
            {c}
          </Chip>
        ))}
      </div>
    </div>
  )
}
