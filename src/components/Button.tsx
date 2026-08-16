import React from 'react'

type Variant = 'primary' | 'ghost' | 'accent' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  pill?: boolean
  fullWidth?: boolean
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'var(--action-primary)',
    color: 'var(--text-on-green)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-body)',
    border: '1.5px solid var(--border-subtle)',
  },
  accent: {
    background: 'var(--action-accent)',
    color: 'var(--text-on-brass)',
  },
  danger: {
    background: 'transparent',
    color: 'var(--terracotta)',
    border: '1.5px solid rgba(201,124,94,0.4)',
  },
}

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: '7px 16px', fontSize: '14px', minHeight: '36px' },
  md: { padding: '12px 24px', fontSize: '16px', minHeight: '44px' },
  lg: { padding: '16px 32px', fontSize: '17px', minHeight: '52px' },
}

export function Button({
  variant = 'primary',
  size = 'md',
  pill = true,
  fullWidth = false,
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: pill ? 'var(--radius-pill)' : 'var(--radius-card)',
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        border: 'none',
        transition: `opacity var(--dur-fast) var(--ease-out)`,
        width: fullWidth ? '100%' : undefined,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
    >
      {children}
    </button>
  )
}
