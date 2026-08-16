import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  multiline?: false
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  multiline: true
  rows?: number
}

type Props = InputProps | TextareaProps

export function Input(props: Props) {
  const { label, multiline, ...rest } = props as InputProps & { multiline?: boolean }

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 16px',
    minHeight: '44px',
    background: '#fff',
    border: '1.5px solid var(--border-subtle)',
    borderRadius: 'var(--radius-card-sm)',
    color: 'var(--text-body)',
    fontFamily: 'var(--font-body)',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
    resize: multiline ? 'none' : undefined,
    boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          style={{ ...fieldStyle, height: '84px', width: '100%', ...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>).style }}
        />
      ) : (
        <input
          {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
          style={{ ...fieldStyle, ...(rest as React.InputHTMLAttributes<HTMLInputElement>).style }}
        />
      )}
    </div>
  )
}
