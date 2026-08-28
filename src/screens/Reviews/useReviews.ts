import { useNavigate, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import { getUserReviews } from '@/lib/api'
import { keys, STALE } from '@/lib/cache/queryClient'
import { supabase } from '@/lib/supabase'

export interface Review {
  id: string
  stars: number
  tags: string[]
  context: 'complete' | 'cancel'
  createdAt: string
  raterName: string
}

export interface ReviewsData {
  average: number | null
  total: number
  reviews: Review[]
}

/** What people said about one person. No layout in it.
 *
 *  The average and total come from the RPC rather than profiles.rating: they
 *  are computed from the same revealed set as the list, so the header cannot
 *  disagree with the rows under it.
 */
export function useReviews() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()

  const { data, isLoading, error } = useQuery({
    queryKey: keys.reviews(userId ?? ''),
    queryFn: async (): Promise<ReviewsData> => {
      const { data, error } = await getUserReviews(userId!)
      if (error) throw error
      const d = (data ?? {}) as Record<string, unknown>
      return {
        average: typeof d.average === 'number' ? d.average : null,
        total: typeof d.total === 'number' ? d.total : 0,
        reviews: Array.isArray(d.reviews) ? (d.reviews as Review[]) : [],
      }
    },
    enabled: !!userId,
    staleTime: STALE.counts,
  })

  // The name is not in the reviews payload — it is the subject's, not a
  // rater's — so it comes from the same public view the RPC reads.
  const { data: name } = useQuery({
    queryKey: keys.profile(userId ?? ''),
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles_public')
        .select('name')
        .eq('id', userId!)
        .maybeSingle()
      return String(data?.name ?? 'Swapper')
    },
    enabled: !!userId,
    staleTime: STALE.counts,
  })

  return {
    name: name ?? 'Swapper',
    average: data?.average ?? null,
    total: data?.total ?? 0,
    reviews: data?.reviews ?? [],
    isLoading,
    failed: !!error,
    goBack: () => navigate(-1),
  }
}
