import React, { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'

import { ErrorBoundary } from './components/ErrorBoundary'
import { useAuthStore } from './store/auth'
import { useOnboardingStore } from './store/onboarding'

import { Onboarding } from './screens/Onboarding'
import { Auth } from './screens/Auth'

// Screens not yet migrated to the platform split. Each moves into its own
// folder (Screen.mobile.tsx / Screen.desktop.tsx) as the rebuild reaches it.
import { AddItem } from './screens/AddItem'
import { Profile } from './screens/Profile'
import { Settings } from './screens/Settings'
import { BlockedList } from './screens/BlockedList'
import { Match } from './screens/Match'
import { Hunt } from './screens/Hunt'
import MyItems from './screens/MyItems'
import { SwapsInbox } from './screens/SwapsInbox'
import Offers from './screens/Offers/Offers'
import Invite from './screens/Invite'
import Rewards from './screens/Rewards'
import PublicProfile from './screens/PublicProfile'
import Notifications from './screens/Notifications'
import MatchThread from './screens/Chat/MatchThread'
import { ItemDetail } from './screens/ItemDetail'
import { Arrange } from './screens/Arrange'
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
    navigate(onboarded ? '/discover' : '/welcome', { replace: true })
  }, [session, initialized, onboarded, navigate])

  return <Auth />
}

const guard = (el: React.ReactNode) => <Protected>{el}</Protected>

export function AppRouter() {
  return (
    <BrowserRouter>
      <RoutedBoundary>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/welcome" element={<NeedsSession><Onboarding /></NeedsSession>} />
        {/* The code is typed on the Auth screen itself now, so there is no
            second page to send anyone to. Kept as a redirect for old push
            notifications and bookmarks. */}
        <Route path="/verify" element={<Navigate to="/" replace />} />
        {/* Sign-in and sign-up are separate screens again. One Auth component
            serves both: the route decides the mode, because the difference is
            an invite field and which Supabase flag gets set, not a layout. */}
        <Route path="/login" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />
        {/* /register predates the split and is still in old links. */}
        <Route path="/register" element={<Navigate to="/signup" replace />} />

        {/* Four destinations, matching TabBar and TopNav exactly */}
        <Route path="/discover" element={guard(<Hunt />)} />
        <Route path="/items" element={guard(<MyItems />)} />
        <Route path="/matches" element={guard(<SwapsInbox />)} />
        <Route path="/offers" element={guard(<Offers />)} />
        <Route path="/invite" element={guard(<Invite />)} />
        <Route path="/points" element={guard(<Rewards />)} />
        <Route path="/u/:userId" element={guard(<PublicProfile />)} />
        <Route path="/notifications" element={guard(<Notifications />)} />
        <Route path="/profile" element={guard(<Profile />)} />

        <Route path="/item/:itemId" element={guard(<ItemDetail />)} />
        <Route path="/add" element={guard(<AddItem />)} />
        {/* Desktop renders the inbox here so the swap list stays beside the
            thread; mobile renders Chat full-screen. See SwapThread. */}
        <Route path="/matches/:swapId" element={guard(<MatchThread />)} />
        <Route path="/matches/:swapId/arrange" element={guard(<Arrange />)} />
        {/* Someone else's reviews. Reading them is ALWAYS_FREE. */}
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
        {/* Old paths kept as redirects: they are in push notifications,
            bookmarks and anything already shared. A renamed nav must not
            break a link somebody was sent last week. */}
        <Route path="/hunt" element={<Navigate to="/discover" replace />} />
        {/* Browse is gone: it was a grid behind a search box and a filter
            rail, and the app has neither any more. Old links land on the deck,
            which is where looking at other people's finds happens now. */}
        <Route path="/browse" element={<Navigate to="/discover" replace />} />
        <Route path="/swaps" element={<Navigate to="/matches" replace />} />
        <Route path="/swaps/:swapId" element={<RedirectSwap />} />
        <Route path="/activity" element={<Navigate to="/matches" replace />} />
        <Route path="/chat/:swapId" element={<RedirectSwap />} />
        <Route path="/cancel/:swapId" element={<RedirectSwap />} />
        {/* Deep-link fallbacks for push notifications that predate the sheets */}
        <Route path="/match/:matchId" element={guard(<Match />)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </RoutedBoundary>
    </BrowserRouter>
  )
}

/** One boundary around the routed tree, keyed on the path.
 *
 *  Inside BrowserRouter so it can read the location: keying on the pathname
 *  means navigating away from a screen that threw clears the error, instead of
 *  stranding someone on a fallback with no way out. Outside Routes so it
 *  survives the swap between them.
 *
 *  This is the difference between one broken screen and a blank app. Both times
 *  Offers went black, everything else was fine -- there was simply nothing left
 *  mounted to show it.
 */
function RoutedBoundary({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  return (
    <ErrorBoundary resetKey={pathname} label={pathname}>
      {children}
    </ErrorBoundary>
  )
}

/** Old thread links -- /swaps/:id, /chat/:id, /cancel/:id -- onto the current
 *  path. Reading the id positionally works because all three have it second.
 *  Must NOT target /swaps/: that path now redirects here, and pointing back at
 *  it is an infinite loop. */
function RedirectSwap() {
  const id = window.location.pathname.split('/')[2]
  return <Navigate to={'/matches/' + id} replace />
}
