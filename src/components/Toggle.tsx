

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        cursor: 'pointer',
        minHeight: 'var(--hit-min)',
      }}
    >
      {(label || description) && (
        <div>
          {label && <div style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'var(--ink)' }}>{label}</div>}
          {description && <div style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'var(--text-muted)' }}>{description}</div>}
        </div>
      )}
      <div
        style={{
          position: 'relative',
          width: '52px',
          height: '30px',
          borderRadius: 'var(--radius-pill)',
          background: checked ? 'var(--bartefy-green)' : 'var(--parchment-deep)',
          transition: 'background var(--dur-fast) var(--ease-out)',
          flexShrink: 0,
          border: 'none',
          cursor: 'pointer',
        }}
        onClick={() => onChange(!checked)}
      >
        <div
          style={{
            position: 'absolute',
            top: '3px',
            left: checked ? '25px' : '3px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 2px rgba(51,50,43,0.05), 0 6px 18px rgba(51,50,43,0.06)',
            transition: 'left var(--dur-fast) var(--ease-out)',
          }}
        />
      </div>
    </label>
  )
}
