

interface RadioOption {
  value: string
  label: string
  description?: string
}

interface RadioProps {
  options: RadioOption[]
  value: string
  onChange: (value: string) => void
  name: string
}

export function Radio({ options, value, onChange, name }: RadioProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {options.map((opt) => (
        <label
          key={opt.value}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 0',
            cursor: 'pointer',
            minHeight: 'var(--hit-min)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: `2px solid ${value === opt.value ? 'var(--bartefy-green)' : 'var(--ink-faint)'}`,
              background: value === opt.value ? 'var(--bartefy-green)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            onClick={() => onChange(opt.value)}
          >
            {value === opt.value && (
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#fff' }} />
            )}
          </div>
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
          />
          <div>
            <div style={{ fontSize: '16px', color: 'var(--ink)' }}>{opt.label}</div>
            {opt.description && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{opt.description}</div>}
          </div>
        </label>
      ))}
    </div>
  )
}
