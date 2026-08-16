import React from 'react'

interface TagProps {
  children: React.ReactNode
  selected?: boolean
  onSelect?: () => void
  onRemove?: () => void
}

export function Tag({ children, selected, onSelect, onRemove }: TagProps) {
  return (
    <button
      onClick={onSelect}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '7px 16px',
        borderRadius: 'var(--radius-pill)',
        background: selected ? 'var(--bartefy-green)' : '#fff',
        color: selected ? 'var(--parchment)' : 'var(--ink)',
        border: selected ? '1.5px solid var(--bartefy-green)' : '1.5px solid var(--border-subtle)',
        fontFamily: 'var(--font-body)',
        fontWeight: 500,
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'background var(--dur-fast) var(--ease-out)',
        minHeight: '36px',
        lineHeight: 1.2,
      }}
    >
      {children}
      {onRemove && (
        <span
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          style={{ marginLeft: '2px', opacity: 0.7, fontSize: '16px', lineHeight: 1 }}
        >
          ×
        </span>
      )}
    </button>
  )
}
