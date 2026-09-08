import { QueryClientProvider } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { queryClient } from '@/lib/cache/queryClient'
import { idbPersister } from '@/lib/cache/idbPersister'
import { AppRouter } from './router'
import { useRealtime } from '@/lib/realtime'
import { startOutbox, type Job } from '@/lib/outbox'
import { claimDailyVisit } from '@/lib/points'
import { useAuthStore } from '@/store/auth'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'
import { PlatformProvider } from '@/lib/platform'
import { ThemeProvider } from '@/lib/theme'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

/** Cache restores before the first paint, so a cold start opens on the last
 *  known feed, threads and profile rather than an empty screen.
 */
export function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      /** buster is the build. Anything persisted by a different build is
       *  discarded on load instead of being restored.
       *
       *  Without it the cache outlives deploys, and a shipped fix does not
       *  reach anyone still holding the old data for up to maxAge. That is not
       *  theoretical: the Offers badge and the Offers list used to share a
       *  query key, so the cache stored a NUMBER where the screen expects an
       *  array. Separating the keys fixed new sessions, but every returning
       *  browser restored the number from IndexedDB and `rows.map` threw a
       *  blank page on a build that no longer contained the bug.
       *
       *  Keyed on the commit rather than the version so it also busts between
       *  releases -- two builds of 3.0.1 can still disagree about a shape. */
      persistOptions={{
        persister: idbPersister,
        maxAge: 24 * 60 * 60_000,
        buster: __APP_COMMIT__,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <PlatformProvider>
            <TooltipProvider delayDuration={200}>
              <Live />
              <AppRouter />
              <Toaster />
            </TooltipProvider>
          </PlatformProvider>
        </ThemeProvider>
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

  /** Today's visit. Fires once the session lands and once per user per day:
   *  the RPC is idempotent on a stored date, so a refresh or a second tab
   *  cannot pay twice and this does not need its own guard. Failure is
   *  deliberately silent -- a missed streak point must never block the app,
   *  and tomorrow's claim will still see the right streak. */
  useEffect(() => {
    if (!userId) return
    claimDailyVisit()
      .then(({ data }) => {
        const row = Array.isArray(data) ? data[0] : data
        // Only disturb the cache when something was actually awarded.
        if (row && !row.already_claimed && row.awarded > 0) {
          queryClient.invalidateQueries({ queryKey: ['points'] })
        }
      })
      .catch(() => {})
  }, [userId])

  useEffect(() => {
    return startOutbox(async (jobs: Job[]) => {
      const { data, error } = await supabase.functions.invoke('sync', { body: { jobs } })
      if (error) throw error
      return (data?.acked ?? []) as string[]
    })
  }, [])

  return null
}
