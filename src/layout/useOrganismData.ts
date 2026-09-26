import { useQuery, type UseQueryResult } from '@tanstack/react-query'

import { supabase } from '@/lib/supabase'
import type { DataPipeline, DataSource } from './organism'

/** The one place a declared data source becomes a fetch.
 *
 *  An organism never calls supabase itself. It declares `{ kind: 'rpc', fn:
 *  'get_streak' }` and this resolves it -- so moving an organism from a mock
 *  to a real backend is a one-line config change, and nothing about the
 *  component moves.
 *
 *  It also makes "which organisms are still faked" answerable by reading the
 *  registry rather than grepping for hard-coded arrays.
 */

async function resolve<T>(source: DataSource<T>): Promise<T> {
  switch (source.kind) {
    case 'static':
      return undefined as T

    case 'mock':
      return source.data

    case 'local':
      return await source.read()

    case 'rpc': {
      const { data, error } = await supabase.rpc(source.fn, source.args ?? {})
      // Every API result is checked. A silent catch-and-continue turns a
      // permission error into an empty state that looks like "no data yet".
      if (error) throw error
      return data as T
    }

    case 'table': {
      let q = supabase.from(source.from).select(source.select)
      for (const [k, v] of Object.entries(source.filter ?? {})) q = q.eq(k, v)
      const { data, error } = await q
      if (error) throw error
      /* An embedded join with a wrong FK constraint name returns [] rather
       * than an error -- the exact shape of the open /offers bug. A caller
       * cannot distinguish that from "genuinely nothing", so it is the
       * organism's empty state that must be honest, not this adapter's job to
       * guess. Verify selects against the live schema. */
      return data as T
    }
  }
}

export function useOrganismData<TRaw, TProps>(
  pipeline: DataPipeline<TRaw, TProps>,
  options?: { enabled?: boolean },
): UseQueryResult<TProps> {
  return useQuery({
    queryKey: pipeline.queryKey,
    queryFn: async () => pipeline.toProps(await resolve(pipeline.source)),
    staleTime: pipeline.staleTime ?? 60_000,
    // A static organism has nothing to fetch; a pipeline marked unavailable
    // has no backend to fetch from.
    enabled:
      (options?.enabled ?? true) &&
      pipeline.source.kind !== 'static' &&
      !pipeline.unavailable,
  })
}
