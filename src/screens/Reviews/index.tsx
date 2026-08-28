import { ArrowLeft } from 'lucide-react'

import { AppShell } from '@/components/shell/AppShell'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ToneBadge } from '@/components/ui/tone-badge'
import { Separator } from '@/components/ui/separator'
import { Stars } from '@/components/ui/stars'
import { UserAvatar } from '@/components/ui/user-avatar'
import { T, useT } from '@/i18n/T'
import { useReviews, type Review } from './useReviews'

/** The tag vocabulary ConfirmAndRateSheet collects, read back out. Kept in the
 *  same order so a review reads consistently wherever it appears. */
const TAG_LABEL: Record<string, string> = {
  punctual: 'confirm.tagPunctual',
  as_described: 'confirm.tagAsDescribed',
  friendly: 'confirm.tagFriendly',
  would_again: 'confirm.tagWouldAgain',
}

/** What people said about one person.
 *
 *  Reading reviews is ALWAYS_FREE — deciding whether to meet a stranger to
 *  trade objects is a safety call, never a membership feature. There is no
 *  tier check on this screen.
 *
 *  One column on both platforms, like Settings and BlockedList: a list of
 *  rows reads the same everywhere, so this is not platform-split.
 */
export function Reviews() {
  const r = useReviews()
  const { t, lang } = useT()

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-[680px] px-5 py-6">
        <div className="mb-5 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            pill
            onClick={r.goBack}
            aria-label={t('common.back')}
          >
            <ArrowLeft size={20} />
          </Button>
          <T as="h1" k="reviews.title" className="font-display text-h2 text-foreground" />
        </div>

        <Card className="mb-5 flex items-center gap-3.5 p-5">
          <UserAvatar name={r.name} size="lg" />
          <div className="min-w-0 flex-1">
            {/* User data, not copy: no data-i18n on this line. */}
            <div className="truncate font-display text-[17px] font-semibold text-foreground">
              {r.name}
            </div>
            {r.average !== null ? (
              <div className="mt-1 flex items-center gap-2">
                <Stars value={r.average} size={16} />
                <span className="font-body text-sm text-muted-foreground">
                  {r.average.toFixed(1)} {'·'} {t('reviews.count', { count: r.total })}
                </span>
              </div>
            ) : (
              <T
                as="div"
                k="reviews.noneYet"
                className="mt-1 font-body text-sm text-muted-foreground"
              />
            )}
          </div>
        </Card>

        {r.isLoading && <T as="p" k="common.loading" className="font-body text-muted-foreground" />}

        {r.failed && (
          <T as="p" k="reviews.failed" className="font-body text-destructive" role="alert" />
        )}

        {!r.isLoading && !r.failed && r.reviews.length === 0 && (
          <EmptyState title="reviews.emptyTitle" body="reviews.emptyBody" />
        )}

        <div className="flex flex-col gap-3">
          {r.reviews.map((review) => (
            <ReviewCard key={review.id} review={review} lang={lang} />
          ))}
        </div>
      </div>
    </AppShell>
  )
}

function ReviewCard({ review, lang }: { review: Review; lang: string }) {
  const { t } = useT()
  const when = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString(lang, { year: 'numeric', month: 'short' })
    : ''

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <UserAvatar name={review.raterName} size="sm" />
          {/* A person's name is data, so it carries no data-i18n. */}
          <span className="font-display text-[15px] font-semibold text-foreground">
            {review.raterName}
          </span>
        </div>
        <Stars value={review.stars} size={15} />
      </div>

      {review.tags.length > 0 && (
        <>
          <Separator className="my-3" />
          <div className="flex flex-wrap gap-1.5">
            {review.tags.map((tag) => (
              // A tag is informational, not a control: ToneBadge, not Chip.
              <ToneBadge key={tag} tone="quiet" data-i18n={TAG_LABEL[tag]}>
                {TAG_LABEL[tag] ? t(TAG_LABEL[tag]) : tag}
              </ToneBadge>
            ))}
          </div>
        </>
      )}

      <div className="mt-3 flex items-center gap-2 font-body text-caption text-muted-foreground">
        {/* A cancelled swap's rating is worth reading, but it must not be
            mistaken for a completed one. */}
        {review.context === 'cancel' && (
          <T as="span" k="reviews.fromCancelled" className="text-muted-foreground" />
        )}
        {when && <span>{when}</span>}
      </div>
    </Card>
  )
}
