import React from 'react'
import { useNavigate } from 'react-router'

type Tab = 'hunt' | 'matches' | 'add' | 'activity' | 'profile'

interface TabBarProps {
  active: Tab
}

// Hunt — search/compass icon
const HuntIcon = ({ stroke }: { stroke: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="6" />
    <path d="M20 20l-4.5-4.5" />
  </svg>
)

// Swaps — swap arrows icon
const SwapIcon = ({ stroke }: { stroke: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8h13M14 4l4 4-4 4M20 16H7M10 12l-4 4 4 4" />
  </svg>
)

// Add — plus icon (green pill)
const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

// Activity — bell icon
const ActivityIcon = ({ stroke }: { stroke: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)

// Profile — person icon
const ProfileIcon = ({ stroke }: { stroke: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
)

const tabColor = (on: boolean) => on ? '#F7F2E1' : 'rgba(247,242,225,0.55)'

export function TabBar({ active }: TabBarProps) {
  const navigate = useNavigate()

  const tabs: { id: Tab; icon: React.ReactNode; path: string; label: string; isAdd?: boolean }[] = [
    { id: 'hunt',     icon: <HuntIcon stroke={tabColor(active === 'hunt')} />,         path: '/hunt',     label: 'Hunt' },
    { id: 'matches',  icon: <SwapIcon stroke={tabColor(active === 'matches')} />,       path: '/matches',  label: 'Swaps' },
    { id: 'add',      icon: <PlusIcon />,                                                path: '/add',      label: '',      isAdd: true },
    { id: 'activity', icon: <ActivityIcon stroke={tabColor(active === 'activity')} />,  path: '/activity', label: 'Activity' },
    { id: 'profile',  icon: <ProfileIcon stroke={tabColor(active === 'profile')} />,    path: '/profile',  label: 'Profile' },
  ]

  return (
    <div style={{ padding: '6px 16px env(safe-area-inset-bottom, 8px)' }}>
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          background: 'var(--bartefy-green)',
          borderRadius: 'var(--radius-pill)',
          padding: '6px 8px',
        }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active

          // Green + pill for the add button
          if (tab.isAdd) {
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                aria-label="Add item"
                style={{
                  background: 'var(--parchment)',
                  border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  cursor: 'pointer',
                  width: '44px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--bartefy-green)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                }}
              >
                {tab.icon}
              </button>
            )
          }

          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              aria-label={tab.label}
              style={{
                background: isActive ? 'rgba(247, 242, 225, 0.16)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-pill)',
                cursor: 'pointer',
                minWidth: '44px',
                height: '44px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1px',
                color: 'var(--parchment)',
                transition: 'background 140ms cubic-bezier(0.22, 1, 0.36, 1)',
                padding: '4px 10px',
              }}
            >
              {tab.icon}
              <span style={{
                fontSize: '10px',
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                color: tabColor(isActive),
                lineHeight: 1,
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
