import { useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'

import { AppShell } from '@/components/shell/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Chip } from '@/components/ui/tone-badge'
import { ResponsiveSheet } from '@/components/ui/responsive-sheet'
import { T, useT } from '@/i18n/T'
import { BROWSE_CATEGORIES, useBrowse } from './useBrowse'
import { ResultGrid } from './ResultGrid'

/** Browse, phone shape: search on top, a two-column grid below, filters in a
 *  sheet. Swiping is discovery; this is how someone looks for a thing.
 */
export default function BrowseMobile() {
  const b = useBrowse()
  const { t } = useT()
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[720px] px-4 py-5">
        <T as="h1" k="browse.title" className="mb-3 font-display text-h2 text-foreground" />

        <div className="mb-4 flex items-end gap-2">
          <Field
            placeholder="browse.searchPlaceholder"
            value={b.query}
            onChange={(e) => b.setQuery(e.target.value)}
            containerClassName="flex-1"
            aria-label={t('common.search')}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFiltersOpen(true)}
            aria-label={t('browse.filters')}
          >
            <SlidersHorizontal aria-hidden="true" />
          </Button>
        </div>

        {b.isLoading ? (
          <T as="p" k="common.loading" className="py-10 text-center font-body text-sm text-muted-foreground" />
        ) : b.results.length === 0 ? (
          <EmptyState
            title="browse.emptyTitle"
            body="browse.emptyBody"
            actionLabel="browse.clearFilters"
            onAction={b.clearFilters}
            secondaryLabel="hunt.browseInstead"
            onSecondary={b.widen}
            art={<Search className="size-7 text-muted-foreground" aria-hidden="true" />}
          />
        ) : (
          <>
            <p className="mb-3 font-body text-sm text-muted-foreground">
              {t('browse.resultCount', { count: b.results.length })}
            </p>
            <ResultGrid results={b.results} onOpen={b.openItem} columns={2} />
            <div className="mt-6 flex justify-center">
              <Button variant="ghost" data-i18n="browse.saveSearch">
                {t('browse.saveSearch')}
              </Button>
            </div>
          </>
        )}
      </div>

      <ResponsiveSheet open={filtersOpen} onOpenChange={setFiltersOpen} title="browse.filters">
        <div className="flex flex-wrap gap-2 py-2">
          {BROWSE_CATEGORIES.map((c) => (
            <Chip key={c.id} icon={c.icon} active={b.cats.includes(c.id)} onClick={() => b.toggleCat(c.id)}>
              {t(c.label)}
            </Chip>
          ))}
        </div>
        <Button fullWidth size="lg" className="mt-4" onClick={() => setFiltersOpen(false)}>
          {t('common.done')}
        </Button>
      </ResponsiveSheet>
    </AppShell>
  )
}
