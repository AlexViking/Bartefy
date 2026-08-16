import React, { useEffect } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  height?: string
  title?: string
}

export function Sheet({ open, onClose, children, height = '76%', title }: SheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 100,
        }}
      />
      {/* Sheet / dialog */}
      <div
        style={{
          position: 'fixed',
          zIndex: 101,
          bottom: 0,
          left: 0,
          right: 0,
          height,
          background: 'var(--surface-card)',
          borderRadius: 'var(--radius-hero) var(--radius-hero) 0 0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        className="sheet"
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--ink-faint)' }} />
        </div>
        {title && (
          <div style={{ padding: '8px 24px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '20px' }}>{title}</h2>
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 32px' }}>
          {children}
        </div>
      </div>
    </>
  )
}
