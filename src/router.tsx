import React, { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'

import { ErrorBoundary } from './components/ErrorBoundary'
import { ShellLayout } from './components/shell/AppShell'
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
import Invite from './screens/Invite'
import Rewards from './screens/Rewards'
import PublicProfile from './screens/PublicProfile'
import Notifications from './screens/Notifications'
import Swaps from './screens/Swaps/Swaps'
import { ItemDetail } from './screens/ItemDetail'
import { Arrange } from './screens/Arrange'
import { Membership } from './screens/Membership'
import { ReportQueue } from './screens/admin/ReportQueue'
import { Analytics } from './screens/admin/Analytics'

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

/** The auth screen, plus the redirect that must follow a successful sign-in.
 *
 *  This wrapper exists because the redirect used to live only on `/`. A
 *  session created at `/login` or `/signup` therefore landed nowhere: the
 *  verification SUCCEEDED, onAuthStateChange stored the session, and the
 *  person went on staring at the code form. Editing the URL to `/` was the
 *  only way out, which is exactly how the bug was reported.
 *
 *  Every route that renders Auth now renders this instead, so there is no
 *  route where a signed-in person can be stranded on a sign-in form.
 */
function AuthRoute() {
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

export function AppRouter() {
  return (
    <BrowserRouter>
      <RoutedBoundary>
      <Routes>
        <Route path="/" element={<AuthRoute />} />
        <Route path="/welcome" element={<NeedsSession><Onboarding /></NeedsSession>} />
        {/* The code is typed on the Auth screen itself now, so there is no
            second page to send anyone to. Kept as a redirect for old push
            notifications and bookmarks. */}
        <Route path="/verify" element={<Navigate to="/" replace />} />
        {/* Sign-in and sign-up are separate screens again. One Auth component
            serves both: the route decides the mode, because the difference is
            an invite field and which Supabase flag gets set, not a layout. */}
        <Route path="/login" element={<AuthRoute />} />
        <Route path="/signup" element={<AuthRoute />} />
        {/* /register predates the split and is still in old links. */}
        <Route path="/register" element={<Navigate to="/signup" replace />} />

        {/* Every signed-in screen, inside the V6 frame. The frame is a layout
            route, so it mounts once and survives navigation -- only the
            Outlet changes. Protected wraps the layout, which checks the
            session once for all of them. */}
        <Route element={<Protected><ShellLayout /></Protected>}>
          <Route path="/discover" element={<Hunt />} />
          <Route path="/items" element={<MyItems />} />
          {/* One route, optional id: picking a row must not remount the
              screen (the list would lose its scroll and folds). */}
          <Route path="/matches/:swapId?" element={<Swaps />} />
          {/* Offers live in Swaps & offers now (V6). */}
          <Route path="/offers" element={<Navigate to="/matches" replace />} />
          <Route path="/invite" element={<Invite />} />
          <Route path="/points" element={<Rewards />} />
          <Route path="/u/:userId" element={<PublicProfile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/item/:itemId" element={<ItemDetail />} />
          <Route path="/add" element={<AddItem />} />
          <Route path="/matches/:swapId/arrange" element={<Arrange />} />
          {/* Someone else's reviews. Reading them is ALWAYS_FREE. */}
          <Route path="/membership" element={<Membership />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/blocked" element={<BlockedList />} />

          {/* Internal. The staff check lives inside ReportQueue, not just here. */}
          <Route path="/admin/reports" element={<ReportQueue />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          {/* Admirers is V6 step 5. Until it exists, My finds. */}
          <Route path="/admirers" element={<Navigate to="/items" replace />} />
        </Route>

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
        <Route path="/match/:matchId" element={<Protected><Match /></Protected>} />

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
