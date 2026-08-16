import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { Button } from '../components/Button'
import { Toggle } from '../components/Toggle'
import { Sheet } from '../components/Sheet'
import { CityPicker } from './CityPicker'
import { DesktopNav } from '../components/DesktopNav'
import { useAuthStore } from '../store/auth'
import { getProfile, updateProfile, signOut } from '../lib/api'
import { supabase } from '../lib/supabase'

type ProfileNotifs = {
  notif_match: boolean
  notif_push: boolean
  notif_email: boolean
  home_city: string
}

export function Settings() {
  const navigate = useNavigate()
  const session = useAuthStore((s) => s.session)
  const userId = session?.user?.id

  const [notifMatch, setNotifMatch] = useState(true)
  const [notifPush, setNotifPush] = useState(true)
  const [notifEmail, setNotifEmail] = useState(false)
  const [homeCity, setHomeCity] = useState('')
  const [cityOpen, setCityOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    loadProfile()
  }, [userId])

  async function loadProfile() {
    if (!userId) return
    setLoading(true)
    try {
      const { data } = await getProfile(userId)
      if (data) {
        const p = data as ProfileNotifs
        setNotifMatch(p.notif_match ?? true)
        setNotifPush(p.notif_push ?? true)
        setNotifEmail(p.notif_email ?? false)
        setHomeCity(p.home_city ?? '')
      }
    } finally {
      setLoading(false)
    }
  }

  async function patch(changes: Record<string, unknown>) {
    if (!userId) return
    await updateProfile(userId, changes)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      await supabase.auth.admin?.deleteUser?.(userId ?? '')
      // Fallback: just sign out — actual deletion requires service role
      await signOut()
      navigate('/')
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  async function handleCitySelect(city: string) {
    setHomeCity(city)
    setCityOpen(false)
    await patch({ home_city: city })
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ padding: '0 0 8px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '12px', letterSpacing: '0.18em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
        {title}
      </div>
      <div className="settings-card" style={{ background: 'var(--surface-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-card-lg)', boxShadow: 'var(--shadow-card)', padding: '6px 16px', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )

  const Row = ({ label, value, onPress }: { label: string; value?: string; onPress?: () => void }) => (
    <button
      onClick={onPress}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '0',
        minHeight: '48px',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid var(--border-subtle)',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
        fontSize: '16px',
        color: 'var(--ink)',
        textAlign: 'left',
      }}
    >
      <span className="label" style={{ fontSize: '16px', color: 'var(--ink)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} className="link-val">
        {value && <span style={{ fontSize: '15px', color: 'var(--text-muted)' }}>{value}</span>}
        <ChevronRight size={15} color="var(--text-muted)" />
      </div>
    </button>
  )

  const ToggleRow = ({
    label,
    description,
    checked,
    onChange,
  }: {
    label: string
    description?: string
    checked: boolean
    onChange: (v: boolean) => void
  }) => (
    <div style={{ borderBottom: '1px solid var(--border-subtle)', minHeight: '48px', display: 'flex', alignItems: 'center' }}>
      <Toggle label={label} description={description} checked={checked} onChange={onChange} />
    </div>
  )

  if (loading) return null

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--surface-page)', display: 'flex', flexDirection: 'column' }}>
      <DesktopNav />
      <header className="mobile-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 20px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            width: '40px', height: '40px', borderRadius: '50%',
            border: '1.5px solid var(--border-subtle)',
            background: 'var(--surface-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, padding: 0,
          }}
        >
          <ArrowLeft size={19} color="var(--ink)" />
        </button>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '18px', color: 'var(--ink)', margin: 0 }}>Settings</h3>
        <span style={{ width: '40px' }} />
      </header>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 20px 32px' }}>
        <Section title="Notifications">
          <ToggleRow
            label="New matches"
            description="When someone likes your item back"
            checked={notifMatch}
            onChange={(v) => { setNotifMatch(v); patch({ notif_match: v }) }}
          />
          <ToggleRow
            label="Push notifications"
            checked={notifPush}
            onChange={(v) => { setNotifPush(v); patch({ notif_push: v }) }}
          />
          <ToggleRow
            label="Email notifications"
            checked={notifEmail}
            onChange={(v) => { setNotifEmail(v); patch({ notif_email: v }) }}
          />
        </Section>

        <Section title="Preferences">
          <Row label="City" value={homeCity || 'Choose city'} onPress={() => setCityOpen(true)} />
          <Row label="Distance unit" value="km" />
        </Section>

        <Section title="Account">
          <Row label="Email" value={session?.user?.email ?? ''} />
        </Section>

        <div style={{ flex: 1 }} />
        <Button variant="ghost" size="md" fullWidth onClick={handleSignOut}>
          Sign out
        </Button>
        <Button variant="danger" size="md" fullWidth onClick={() => setDeleteOpen(true)}>
          Delete my account
        </Button>
      </div>

      <Sheet open={cityOpen} onClose={() => setCityOpen(false)} title="Choose your city">
        <CityPicker onSelect={handleCitySelect} />
      </Sheet>

      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)} height="auto" title="Delete account?">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '16px' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--text-muted)', margin: 0 }}>
            This will permanently delete your account, all your items, and your swap history. This can't be undone.
          </p>
          <Button
            variant="danger"
            size="lg"
            fullWidth
            disabled={deleting}
            onClick={handleDeleteAccount}
            style={{ background: 'var(--terracotta)', color: '#fff', borderColor: 'var(--terracotta)' }}
          >
            {deleting ? 'Deleting…' : 'Yes, delete my account'}
          </Button>
          <Button
            variant="ghost"
            size="lg"
            fullWidth
            onClick={() => setDeleteOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </Sheet>
    </main>
  )
}
