import React from 'react'

interface AvatarProps {
  initials?: string
  src?: string
  size?: number
  color?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export function Avatar({ initials = '?', src, size = 40, color = 'var(--denim)', style, onClick }: AvatarProps) {
  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: src ? 'transparent' : color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        ...style,
      }}
    >
      {src ? (
        <img src={src} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ color: '#fff', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.4 }}>
          {initials}
        </span>
      )}
    </div>
  )
}
