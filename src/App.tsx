import { QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient } from '@/lib/cache/queryClient'
import { idbPersister } from '@/lib/cache/idbPersister'
import { AppRouter } from './router'
import { useRealtime } from '@/lib/realtime'
import { startOutbox, type Job } from '@/lib/outbox'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'

/** Cache restores before the first paint, so a cold start opens on the last
 *  known feed, threads and profile rather than an empty screen.
 */
export function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: idbPersister, maxAge: 24 * 60 * 60_000 }}
    >
      <QueryClientProvider client={queryClient}>
        <Live />
        <AppRouter />
      </QueryClientProvider>
    </PersistQueryClientProvider>
  )
}

function Live() {
  const userId = useAuthStore((s) => s.session?.user?.id)
  const setSession = useAuthStore((s) => s.setSession)
  const setInitialized = useAuthStore((s) => s.setInitialized)
  useRealtime(userId)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setInitialized()
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session),
    )
    return () => subscription.unsubscribe()
  }, [setSession, setInitialized])

  useEffect(() => {
    return startOutbox(async (jobs: Job[]) => {
      const { data, error } = await supabase.functions.invoke('sync', { body: { jobs } })
      if (error) throw error
      return (data?.acked ?? []) as string[]
    })
  }, [])

  return null
}
