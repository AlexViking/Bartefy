import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Button } from '../components/Button'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/auth'

type SwapData = {
  itemATitle: string
  itemBTitle: string
  itemAImage: string | null
  itemBImage: string | null
  otherName: string
}

export function Match() {
  const navigate = useNavigate()
  const { matchId } = useParams<{ matchId: string }>()
  const session = useAuthStore((s) => s.session)
  const userId = session?.user?.id

  const [swapData, setSwapData] = useState<SwapData | null>(null)

  useEffect(() => {
    if (!matchId || !userId) return
    loadSwap()
  }, [matchId, userId])

  async function loadSwap() {
    if (!matchId || !userId) return
    const { data } = await supabase
      .from('swaps')
      .select('*, item_a:item_a_id(*), item_b:item_b_id(*), profile_a:user_a_id(name), profile_b:user_b_id(name)')
      .eq('id', matchId)
      .maybeSingle()

    if (data) {
      const isUserA = data.user_a_id === userId
      const otherProfile = isUserA ? data.profile_b : data.profile_a
      setSwapData({
        itemATitle: data.item_a?.title ?? 'Your item',
        itemBTitle: data.item_b?.title ?? 'Their item',
        itemAImage: data.item_a?.images?.[0] ?? null,
        itemBImage: data.item_b?.images?.[0] ?? null,
        otherName: (otherProfile as { name?: string } | null)?.name ?? 'Finder',
      })
    }
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        background: '#E2ECE7',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 28px 28px',
        gap: '20px',
        textAlign: 'center',
      }}
    >
      {/* Kicker */}
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '12px',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--bartefy-green)',
        }}
      >
        It's a bartefy!
      </div>

      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '34px', lineHeight: 1.15, color: 'var(--ink)', margin: 0 }}>
        You &amp; {swapData?.otherName ?? 'Finder'} both said yes
      </h1>

      {/* Item photos side by side */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
        <div
          style={{
            width: '132px',
            height: '132px',
            borderRadius: '18px',
            background: swapData?.itemAImage ? 'transparent' : 'var(--denim)',
            transform: 'rotate(-6deg)',
            boxShadow: 'var(--shadow-float)',
            border: '3px solid #FBF8EE',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {swapData?.itemAImage && (
            <img src={swapData.itemAImage} alt={swapData.itemATitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'var(--brass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            margin: '0 -14px',
            boxShadow: 'var(--shadow-float)',
            flexShrink: 0,
          }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h13M14 4l4 4-4 4M20 16H7M10 12l-4 4 4 4"/></svg>
        </div>
        <div
          style={{
            width: '132px',
            height: '132px',
            borderRadius: '18px',
            background: swapData?.itemBImage ? 'transparent' : 'var(--terracotta)',
            transform: 'rotate(6deg)',
            boxShadow: 'var(--shadow-float)',
            border: '3px solid #FBF8EE',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          {swapData?.itemBImage && (
            <img src={swapData.itemBImage} alt={swapData.itemBTitle} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', lineHeight: 1.55, color: 'var(--text-muted)', maxWidth: '300px', margin: 0 }}>
        Say hi and sort out where to meet. Keep it friendly — that's the Bartefy way.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '10px' }}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => navigate(`/chat/${matchId}`)}
        >
          Say hi to {swapData?.otherName ?? 'Finder'}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          fullWidth
          onClick={() => navigate('/hunt')}
        >
          Keep hunting
        </Button>
      </div>
    </main>
  )
}
