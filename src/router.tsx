import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router'
import { useAuthStore } from './store/auth'
import { DesignProfile } from './screens/DesignProfile'
import { Verify } from './screens/Verify'
import { AddItem } from './screens/AddItem'
import { Chat } from './screens/Chat'
import { Profile } from './screens/Profile'
import { Settings } from './screens/Settings'
import { Match } from './screens/Match'
import { Rate } from './screens/Rate'
// New in this pass
import { Hunt } from './screens/Hunt'
import { Browse } from './screens/Browse'
import { SwapsInbox } from './screens/SwapsInbox'
import { ItemDetail } from './screens/ItemDetail'
import { Arrange } from './screens/Arrange'
import { Membership } from './screens/Membership'
import { Auth } from './screens/Auth'
import { ReportQueue } from './screens/admin/ReportQueue'

function Protected({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((s) => s.session)
  const initialized = useAuthStore((s) => s.initialized)
  if (!initialized) return null
  if (!session) return <Navigate to="/" replace />
  return <>{children}</>
}

function HomeRoute() {
  const session = useAuthStore((s) => s.session)
  const initialized = useAuthStore((s) => s.initialized)
  const navigate = useNavigate()
  useEffect(() => {
    if (initialized && session) navigate('/hunt', { replace: true })
  }, [session, initialized, navigate])
  return <Auth />
}

const guard = (el: React.ReactNode) => <Protected>{el}</Protected>

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/design" element={<DesignProfile />} />
        <Route path="/verify" element={<Verify />} />
        {/* Login and Register collapsed into the one progressive Auth screen */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Navigate to="/" replace />} />

        {/* Four destinations, matching TabBar and DesktopNav exactly */}
        <Route path="/hunt" element={guard(<Hunt />)} />
        <Route path="/browse" element={guard(<Browse />)} />
        <Route path="/swaps" element={guard(<SwapsInbox />)} />
        <Route path="/profile" element={guard(<Profile />)} />

        <Route path="/item/:itemId" element={guard(<ItemDetail />)} />
        <Route path="/add" element={guard(<AddItem />)} />
        <Route path="/swaps/:swapId" element={guard(<Chat />)} />
        <Route path="/swaps/:swapId/arrange" element={guard(<Arrange />)} />
        <Route path="/membership" element={guard(<Membership />)} />
        <Route path="/settings" element={guard(<Settings />)} />

        {/* Internal. Put a staff check inside ReportQueue, not just here. */}
        <Route path="/admin/reports" element={guard(<ReportQueue />)} />

        {/* Retired routes kept as redirects so old links and notifications work.
            Activity is a tab inside Swaps; Match is a sheet over Hunt; Cancel is
            the TroubleSheet; Rate is merged into ConfirmAndRateSheet. */}
        <Route path="/matches" element={<Navigate to="/swaps" replace />} />
        <Route path="/activity" element={<Navigate to="/swaps?tab=activity" replace />} />
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
