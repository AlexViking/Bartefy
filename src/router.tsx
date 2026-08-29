import React, { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router'

import { useAuthStore } from './store/auth'
import { useOnboardingStore } from './store/onboarding'

import { Onboarding } from './screens/Onboarding'
import { Auth } from './screens/Auth'

// Screens not yet migrated to the platform split. Each moves into its own
// folder (Screen.mobile.tsx / Screen.desktop.tsx) as the rebuild reaches it.
import { Verify } from './screens/Verify'
import { AddItem } from './screens/AddItem'
import { Profile } from './screens/Profile'
import { Settings } from './screens/Settings'
import { BlockedList } from './screens/BlockedList'
import { Match } from './screens/Match'
import { Rate } from './screens/Rate'
import { Hunt } from './screens/Hunt'
import { Browse } from './screens/Browse'
import { SwapsInbox } from './screens/SwapsInbox'
import { ItemDetail } from './screens/ItemDetail'
import { Arrange } from './screens/Arrange'
import SwapThread from './screens/SwapThread'
import { Reviews } from './screens/Reviews'
import { Membership } from './screens/Membership'
import { ReportQueue } from './screens/admin/ReportQueue'

/** Signed in, and past onboarding. Someone who has signed in but never
 *  finished onboarding is sent there first — they have no city, so the feed
 *  would be empty and the app would look broken rather than new.
 */
function Protected({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((s) => s.session)
  const initialized = useAuthStore((s) => s.initialized)
  const onboarded = useOnboardingStore((s) => s.completed)

  if (!initialized) return null
  if (!session) return <Navigate to="/" replace />
  if (!onboarded) return <Navigate to="/welcome" replace />
  return <>{children}</>
}

/** The onboarding route itself: needs a session, but must not require the
 *  onboarding it is there to provide. */
function NeedsSession({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((s) => s.session)
  const initialized = useAuthStore((s) => s.initialized)
  if (!initialized) return null
  if (!session) return <Navigate to="/" replace />
  return <>{children}</>
}

function HomeRoute() {
  const session = useAuthStore((s) => s.session)
  const initialized = useAuthStore((s) => s.initialized)
  const onboarded = useOnboardingStore((s) => s.completed)
  const navigate = useNavigate()

  useEffect(() => {
    if (!initialized || !session) return
    navigate(onboarded ? '/hunt' : '/welcome', { replace: true })
  }, [session, initialized, onboarded, navigate])

  return <Auth />
}

const guard = (el: React.ReactNode) => <Protected>{el}</Protected>

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/welcome" element={<NeedsSession><Onboarding /></NeedsSession>} />
        <Route path="/verify" element={<Verify />} />
        {/* Login and Register collapsed into the one progressive Auth screen */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />

        {/* Four destinations, matching TabBar and TopNav exactly */}
        <Route path="/hunt" element={guard(<Hunt />)} />
        <Route path="/browse" element={guard(<Browse />)} />
        <Route path="/swaps" element={guard(<SwapsInbox />)} />
        <Route path="/profile" element={guard(<Profile />)} />

        <Route path="/item/:itemId" element={guard(<ItemDetail />)} />
        <Route path="/add" element={guard(<AddItem />)} />
        {/* Desktop renders the inbox here so the swap list stays beside the
            thread; mobile renders Chat full-screen. See SwapThread. */}
        <Route path="/swaps/:swapId" element={guard(<SwapThread />)} />
        <Route path="/swaps/:swapId/arrange" element={guard(<Arrange />)} />
        {/* Someone else's reviews. Reading them is ALWAYS_FREE. */}
        <Route path="/reviews/:userId" element={guard(<Reviews />)} />
        <Route path="/membership" element={guard(<Membership />)} />
        <Route path="/settings" element={guard(<Settings />)} />
        <Route path="/settings/blocked" element={guard(<BlockedList />)} />

        {/* Internal. The staff check lives inside ReportQueue, not just here. */}
        <Route path="/admin/reports" element={guard(<ReportQueue />)} />

        {/* Retired routes kept as redirects so old links and notifications work.
            Match is a sheet over Hunt; Cancel is the TroubleSheet; Rate is
            merged into ConfirmAndRateSheet. Activity was a tab inside Swaps
            that never got an implementation — it rendered the empty state
            unconditionally — so this now lands on the inbox itself rather than
            on a tab that is permanently blank. */}
        <Route path="/matches" element={<Navigate to="/swaps" replace />} />
        <Route path="/activity" element={<Navigate to="/swaps" replace />} />
        <Route path="/chat/:swapId" element={<RedirectSwap />} />
        <Route path="/cancel/:swapId" element={<RedirectSwap />} />
        {/* Deep-link fallbacks for push notifications that predate the sheets */}
        <Route path="/match/:matchId" element={guard(<Match />)} />
        <Route path="/rate/:matchId" element={guard(<Rate />)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function RedirectSwap() {
  const id = window.location.pathname.split('/')[2]
  return <Navigate to={'/swaps/' + id} replace />
}
