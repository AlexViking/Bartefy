import React from 'react'

interface CardProps {
  children: React.ReactNode
  style?: React.CSSProperties
  onClick?: () => void
}

export function Card({ children, style, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-card-lg)',
        boxShadow: 'var(--shadow-card)',
        padding: 'var(--space-4)',
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
