import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  color?: string
  bg?: string
  style?: React.CSSProperties
}

export function Badge({ children, color = 'var(--ink)', bg = 'var(--parchment-deep)', style }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '5px 12px',
        borderRadius: 'var(--radius-pill)',
        background: bg,
        color,
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: '12px',
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  )
}
