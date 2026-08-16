import { useNavigate, useLocation } from 'react-router'
import { MapPin, ChevronDown } from 'lucide-react'
import { Avatar } from './Avatar'
import { useAuthStore } from '../store/auth'
import logoUrl from '../assets/bartefy-logo-lockup.png'

export function DesktopNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = useAuthStore((s) => s.session)
  const initial = (session?.user?.email?.[0] ?? 'M').toUpperCase()

  const navLink = (path: string, label: string) => {
    const isActive = location.pathname === path
    return (
      <button
        key={path}
        onClick={() => navigate(path)}
        style={{
          background: 'none',
          border: 'none',
          borderBottom: isActive ? '2.5px solid var(--bartefy-green)' : '2.5px solid transparent',
          cursor: 'pointer',
          fontFamily: 'var(--font-display)',
          fontWeight: 600,
          fontSize: '16px',
          color: isActive ? 'var(--bartefy-green)' : 'var(--ink)',
          paddingBottom: '3px',
          textDecoration: 'none',
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <>
    {/* Spacer to offset fixed nav — hidden on mobile via same class */}
    <div className="desktop-nav" style={{ display: 'none', height: 68, flexShrink: 0 }} />
    <header
      style={{
        display: 'none',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 28px',
        background: 'var(--cream)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
      }}
      className="desktop-nav"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
        <img
          src={logoUrl}
          alt="Bartefy"
          style={{ height: '52px', cursor: 'pointer' }}
          onClick={() => navigate('/hunt')}
        />
        <nav style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          {navLink('/hunt', 'Hunt')}
          {navLink('/matches', 'Swaps')}
          {navLink('/activity', 'Activity')}
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Location chip */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: '1.5px solid var(--border-subtle)',
            background: 'var(--surface-card)',
            borderRadius: 'var(--radius-pill)',
            padding: '7px 14px',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'var(--ink)',
            cursor: 'pointer',
          }}
        >
          <MapPin size={15} color="var(--bartefy-green)" />
          Berlin · 5 km
          <ChevronDown size={13} color="var(--ink-soft)" />
        </button>

        {/* Add button */}
        <button
          onClick={() => navigate('/add')}
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '15px',
            padding: '10px 22px',
            minHeight: '44px',
            borderRadius: 'var(--radius-pill)',
            border: 'none',
            background: 'var(--bartefy-green)',
            color: 'var(--parchment)',
            cursor: 'pointer',
          }}
        >
          + Add a treasure
        </button>

        {/* Avatar */}
        <Avatar
          initials={initial}
          color="var(--denim)"
          size={40}
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/profile')}
        />
      </div>
    </header>
    </>
  )
}
