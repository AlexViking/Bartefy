import { Search } from 'lucide-react'

import { AppShell } from '@/components/shell/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Chip } from '@/components/ui/tone-badge'
import { Separator } from '@/components/ui/separator'
import { InfoHint } from '@/components/guidance/InfoHint'
import { T, useT } from '@/i18n/T'
import { BROWSE_CATEGORIES, useBrowse } from './useBrowse'
import { ResultGrid } from './ResultGrid'

/** Browse, desktop shape: a persistent filter rail beside a four-column grid.
 *  Filters stay visible, so narrowing a search is one click rather than
 *  open-sheet, tap, close-sheet.
 */
export default function BrowseDesktop() {
  const b = useBrowse()
  const { t } = useT()

  return (
    <AppShell>
      <div className="grid h-[calc(100dvh-68px)] grid-cols-[260px_1fr]">
        <aside className="flex flex-col gap-4 overflow-y-auto border-r border-border/[0.14] bg-card p-5">
          <div className="flex items-center gap-1.5">
            <T
              as="span"
              k="browse.filters"
              className="font-display text-caption uppercase tracking-[0.18em] text-muted-foreground"
            />
            <InfoHint k="help.whyWants" side="right" />
          </div>

          <div className="flex flex-wrap gap-2">
            {BROWSE_CATEGORIES.map((c) => (
              <Chip key={c} active={b.cats.includes(c)} onClick={() => b.toggleCat(c)}>
                {c}
              </Chip>
            ))}
          </div>

          <Separator />

          <p className="font-body text-sm text-muted-foreground">
            {t('browse.radius', { radius: b.radiusKm })}
          </p>
          <Button variant="ghost" size="sm" onClick={b.widen} data-i18n="hunt.widen">
            {t('hunt.widen', { radius: b.radiusKm * 2 })}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={b.clearFilters}
            className="mt-auto"
            data-i18n="browse.clearFilters"
          >
            {t('browse.clearFilters')}
          </Button>
        </aside>

        <section className="overflow-y-auto p-6">
          <div className="mb-5 flex items-end gap-3">
            <T as="h1" k="browse.title" className="font-display text-h2 text-foreground" />
            <Field
              placeholder="browse.searchPlaceholder"
              value={b.query}
              onChange={(e) => b.setQuery(e.target.value)}
              containerClassName="ml-auto w-[360px]"
              aria-label={t('common.search')}
            />
          </div>

          {b.isLoading ? (
            <T as="p" k="common.loading" className="py-10 text-center font-body text-sm text-muted-foreground" />
          ) : b.results.length === 0 ? (
            <EmptyState
              title="browse.emptyTitle"
              body="browse.emptyBody"
              actionLabel="browse.clearFilters"
              onAction={b.clearFilters}
              art={<Search className="size-7 text-muted-foreground" aria-hidden="true" />}
            />
          ) : (
            <>
              <p className="mb-4 font-body text-sm text-muted-foreground">
                {t('browse.resultCount', { count: b.results.length })}
              </p>
              <ResultGrid results={b.results} onOpen={b.openItem} columns={4} />
              <div className="mt-8 flex justify-center">
                <Button variant="ghost" data-i18n="browse.saveSearch">
                  {t('browse.saveSearch')}
                </Button>
              </div>
            </>
          )}
        </section>
      </div>
    </AppShell>
  )
}
