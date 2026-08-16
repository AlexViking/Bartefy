import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Settings, Plus, Trash2, X } from 'lucide-react'
import { TabBar } from '../components/TabBar'
import { DesktopNav } from '../components/DesktopNav'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Sheet } from '../components/Sheet'
import { useAuthStore, PALETTES } from '../store/auth'
import { getProfile, updateProfile, getMyItems, signOut, deleteItem } from '../lib/api'

type ProfileData = {
  name: string
  home_city: string
  rating: number | null
  swap_count: number
  swap_radius_km: number
}

type ItemData = {
  id: string
  title: string
  images: string[]
}

export function Profile() {
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)
  const userId = session?.user?.id
  const palette = useAuthStore((s) => s.palette)
  const cardStyle = useAuthStore((s) => s.cardStyle)
  const pal = PALETTES[palette]

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [items, setItems] = useState<ItemData[]>([])
  const [radius, setRadius] = useState(15)
  const [loading, setLoading] = useState(true)
  const [manageMode, setManageMode] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ItemData | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!userId) return
    loadData()
  }, [userId])

  async function loadData() {
    if (!userId) return
    setLoading(true)
    try {
      const [{ data: prof }, { data: myItems }] = await Promise.all([
        getProfile(userId),
        getMyItems(userId),
      ])
      if (prof) {
        setProfile(prof as ProfileData)
        setRadius(prof.swap_radius_km ?? 15)
      }
      setItems((myItems ?? []) as ItemData[])
    } finally {
      setLoading(false)
    }
  }

  async function handleRadiusChange(value: number) {
    setRadius(value)
    if (!userId) return
    await updateProfile(userId, { swap_radius_km: value })
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  async function handleDeleteItem(item: ItemData) {
    setDeleting(true)
    try {
      const { error } = await deleteItem(item.id)
      if (error) { alert('Could not remove this item — try again'); return }
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      setSelectedItem(null)
      setManageMode(false)
    } finally {
      setDeleting(false)
    }
  }

  const swapCount = profile?.swap_count ?? 0
  const rating = profile?.rating ?? null
  const activeCount = items.length
  const initial = (profile?.name ?? 'U')[0]?.toUpperCase() ?? 'U'

  if (loading) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--surface-page)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface-page)', display: 'flex', flexDirection: 'column', paddingBottom: '80px' }}>
      <DesktopNav />
      {/* Header */}
      <header className="mobile-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '26px', lineHeight: 1.15, color: 'var(--ink)', margin: 0 }}>Profile</h1>
        <button
          onClick={() => navigate('/settings')}
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: '1.5px solid var(--border-subtle)',
            background: 'var(--surface-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, padding: 0,
          }}
        >
          <Settings size={19} color="var(--ink)" />
        </button>
      </header>

      <div style={{ padding: '8px 20px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Identity card in user's palette */}
        <div
          style={{
            background: pal.accent,
            borderRadius: cardStyle === 'rounded' ? '16px' : '4px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            transition: 'background 240ms, border-radius 240ms',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: pal.surf,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '22px',
              color: pal.accent,
              flexShrink: 0,
            }}
          >
            {initial}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '18px', color: pal.surf }}>{profile?.name ?? 'You'}</div>
            <div style={{ fontSize: '13px', color: pal.surf === '#33322B' ? 'rgba(51,50,43,0.55)' : 'rgba(247,242,225,0.6)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>
              {profile?.home_city ?? 'Somewhere'} · swapping since 2026
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          {[
            { label: 'Swaps done', value: String(swapCount) },
            { label: 'On the table', value: String(activeCount) },
            { label: 'Rating', value: rating != null ? `★ ${rating.toFixed(1)}` : '—' },
          ].map((stat) => (
            <Card key={stat.label} style={{ textAlign: 'center', padding: '12px 8px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '24px', color: 'var(--bartefy-green)' }}>{stat.value}</div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', marginTop: '2px' }}>{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Trusted swapper progress */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15.5px', color: 'var(--ink)' }}>Trusted Bartefyer</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '13px', color: 'var(--bartefy-green)', whiteSpace: 'nowrap' }}>{swapCount} / 15</div>
          </div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '8px' }}>{swapCount} / 15 swaps to unlock badge</div>
          <div style={{ height: '8px', background: 'var(--parchment-deep)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min((swapCount / 15) * 100, 100)}%`, background: 'var(--bartefy-green)', borderRadius: 'var(--radius-pill)', transition: 'width var(--dur-med)' }} />
          </div>
        </Card>

        {/* Hunt radius */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '15.5px', color: 'var(--ink)' }}>Hunt radius</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '14px', color: 'var(--bartefy-green)' }}>{radius} km</div>
          </div>
          <input
            type="range"
            min={1}
            max={50}
            value={radius}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--bartefy-green)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            <span>1 km</span>
            <span>50 km</span>
          </div>
        </Card>

        {/* Listings grid */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '16px', color: 'var(--ink)' }}>Your finds on the table</div>
            <button
              onClick={() => setManageMode((m) => !m)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: manageMode ? 'var(--terracotta)' : 'var(--bartefy-green)' }}
            >
              {manageMode ? 'Done' : 'Manage'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => manageMode ? setSelectedItem(item) : setSelectedItem(item)}
                style={{
                  position: 'relative',
                  width: '78px',
                  height: '78px',
                  borderRadius: '12px',
                  background: 'var(--parchment-deep)',
                  overflow: 'hidden',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {item.images?.[0] ? (
                  <img src={item.images[0]} alt={item.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'var(--parchment-deep)' }} />
                )}
                {manageMode && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Trash2 size={20} color="#fff" />
                  </div>
                )}
              </button>
            ))}
            <button
              onClick={() => navigate('/add')}
              style={{
                width: '78px',
                height: '78px',
                borderRadius: '12px',
                background: 'var(--parchment-deep)',
                border: '1.5px dashed var(--ink-faint)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ink-soft)',
              }}
            >
              <Plus size={22} />
            </button>
          </div>
        </div>

        <Button variant="ghost" size="md" fullWidth onClick={handleSignOut}>
          Sign out
        </Button>
      </div>

      <div className="mobile-tab-bar">
        <TabBar active="profile" />
      </div>

      {/* Item detail / delete sheet */}
      <Sheet open={!!selectedItem} onClose={() => setSelectedItem(null)}>
        {selectedItem && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Preview */}
            <div style={{ width: '100%', aspectRatio: '4/3', borderRadius: 'var(--radius-card)', overflow: 'hidden', background: 'var(--parchment-deep)' }}>
              {selectedItem.images?.[0]
                ? <img src={selectedItem.images[0]} alt={selectedItem.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No photo</div>
              }
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px', margin: 0 }}>
              {selectedItem.title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Button
                variant="ghost"
                size="md"
                fullWidth
                onClick={() => { setSelectedItem(null); navigate('/add') }}
              >
                Edit item
              </Button>
              <Button
                variant="danger"
                size="md"
                fullWidth
                disabled={deleting}
                onClick={() => handleDeleteItem(selectedItem)}
              >
                <Trash2 size={16} />
                {deleting ? 'Removing…' : 'Remove from table'}
              </Button>
              <button
                onClick={() => setSelectedItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: 'var(--text-muted)', padding: '8px' }}
              >
                <X size={14} style={{ marginRight: 4 }} /> Cancel
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  )
}
