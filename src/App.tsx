import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRouter } from './router'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/auth'
import './styles/global.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
})

function AuthListener() {
  const setSession = useAuthStore((s) => s.setSession)
  const setInitialized = useAuthStore((s) => s.setInitialized)

  useEffect(() => {
    // Pick up any existing session (e.g. after magic link redirect or localStorage injection)
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setInitialized()
    })

    // Keep session in sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [setSession, setInitialized])

  return null
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthListener />
      <AppRouter />
    </QueryClientProvider>
  )
}

export default App
