import * as React from 'react'
import { cn } from '@/lib/utils'

const field =
  'w-full min-h-hit rounded-sm border-[1.5px] border-border/[0.14] bg-card px-4 py-[11px] font-body text-base ' +
  'text-foreground outline-none transition-[border-color,box-shadow] duration-fast ease-brand ' +
  'placeholder:text-muted-foreground focus:border-primary focus:ring-[3px] focus:ring-ring/45 ' +
  'disabled:opacity-45 aria-[invalid=true]:border-destructive'

interface FieldShellProps {
  label?: string
  hint?: string
  error?: string
  children: React.ReactNode
}

function FieldShell({ label, hint, error, children }: FieldShellProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="font-display text-sm font-semibold text-foreground">{label}</span>}
      {children}
      {error ? (
        <span className="font-body text-sm text-destructive">{error}</span>
      ) : hint ? (
        <span className="font-body text-sm text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  )
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, ...props }, ref) => (
    <FieldShell label={label} hint={hint} error={error}>
      <input ref={ref} aria-invalid={!!error} className={cn(field, className)} {...props} />
    </FieldShell>
  ),
)
Input.displayName = 'Input'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, rows = 3, ...props }, ref) => (
    <FieldShell label={label} hint={hint} error={error}>
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={!!error}
        className={cn(field, 'resize-none leading-relaxed', className)}
        {...props}
      />
    </FieldShell>
  ),
)
Textarea.displayName = 'Textarea'
