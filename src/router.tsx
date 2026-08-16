import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router'
import { useAuthStore } from './store/auth'
import { Welcome } from './screens/Welcome'
import { DesignProfile } from './screens/DesignProfile'
import { Register } from './screens/Register'
import { Verify } from './screens/Verify'
import { Swipe } from './screens/Swipe'
import { AddItem } from './screens/AddItem'
import { Match } from './screens/Match'
import { Chat } from './screens/Chat'
import { Matches } from './screens/Matches'
import { Activity } from './screens/Activity'
import { Profile } from './screens/Profile'
import { Settings } from './screens/Settings'
import { Cancel } from './screens/Cancel'
import { Rate } from './screens/Rate'
import { Login } from './screens/Login'

function Protected({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((s) => s.session)
  const initialized = useAuthStore((s) => s.initialized)
  if (!initialized) return null
  if (!session) return <Navigate to="/" replace />
  return <>{children}</>
}

// After magic link redirect, Supabase sets the session — send user to /hunt
function HomeRoute() {
  const session = useAuthStore((s) => s.session)
  const initialized = useAuthStore((s) => s.initialized)
  const navigate = useNavigate()

  useEffect(() => {
    if (initialized && session) navigate('/hunt', { replace: true })
  }, [session, initialized, navigate])

  return <Welcome />
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/design" element={<DesignProfile />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/hunt" element={<Protected><Swipe /></Protected>} />
        <Route path="/add" element={<Protected><AddItem /></Protected>} />
        <Route path="/match/:matchId" element={<Protected><Match /></Protected>} />
        <Route path="/chat/:matchId" element={<Protected><Chat /></Protected>} />
        <Route path="/matches" element={<Protected><Matches /></Protected>} />
        <Route path="/activity" element={<Protected><Activity /></Protected>} />
        <Route path="/profile" element={<Protected><Profile /></Protected>} />
        <Route path="/settings" element={<Protected><Settings /></Protected>} />
        <Route path="/cancel/:matchId" element={<Protected><Cancel /></Protected>} />
        <Route path="/rate/:matchId" element={<Protected><Rate /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
