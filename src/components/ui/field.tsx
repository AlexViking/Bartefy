import * as React from 'react'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { LabelWithHint } from '@/components/guidance/InfoHint'
import { useT } from '@/i18n/T'
import { cn } from '@/lib/utils'

/** A labelled form control: label, optional ⓘ explanation, the control, and
 *  either a hint or an error underneath.
 *
 *  shadcn ships Input and Textarea as bare controls, which is correct — but
 *  Bartefy asks people to describe their belongings to strangers, so nearly
 *  every field wants a word of context beside it. This is where that lives,
 *  and it is why the ⓘ is a first-class prop rather than something each
 *  screen remembers to add.
 *
 *  label/hint/error/placeholder are all translation keys.
 */
interface FieldBase {
  /** Translation key for the visible label. */
  label?: string
  /** Translation key for the ⓘ explanation beside the label. */
  hint?: string
  /** Translation key for helper text under the control. */
  help?: string
  /** Already-resolved error message — validation produces real sentences. */
  error?: string
  /** Translation key for the placeholder. */
  placeholder?: string
  required?: boolean
  containerClassName?: string
}

export type FieldProps = FieldBase &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'placeholder'>

let uid = 0
const nextId = () => `field-${++uid}`

export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ label, hint, help, error, placeholder, required, containerClassName, className, id, ...props }, ref) => {
    const { t } = useT()
    const [fallbackId] = React.useState(nextId)
    const fieldId = id ?? fallbackId
    const describedBy = error ? `${fieldId}-error` : help ? `${fieldId}-help` : undefined

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && <LabelWithHint label={label} hint={hint} htmlFor={fieldId} required={required} />}
        <Input
          ref={ref}
          id={fieldId}
          placeholder={placeholder ? t(placeholder) : undefined}
          data-i18n={placeholder}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-required={required}
          className={cn(
            'min-h-hit rounded border-[1.5px] border-border/[0.14] bg-card px-3.5',
            'font-body text-base text-foreground placeholder:text-muted-foreground',
            error && 'border-destructive',
            className,
          )}
          {...props}
        />
        <FieldMessage id={fieldId} error={error} help={help} />
      </div>
    )
  },
)
Field.displayName = 'Field'

export type TextFieldProps = FieldBase &
  Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'placeholder'>

export const TextField = React.forwardRef<HTMLTextAreaElement, TextFieldProps>(
  ({ label, hint, help, error, placeholder, required, containerClassName, className, id, ...props }, ref) => {
    const { t } = useT()
    const [fallbackId] = React.useState(nextId)
    const fieldId = id ?? fallbackId
    const describedBy = error ? `${fieldId}-error` : help ? `${fieldId}-help` : undefined

    return (
      <div className={cn('flex flex-col gap-1.5', containerClassName)}>
        {label && <LabelWithHint label={label} hint={hint} htmlFor={fieldId} required={required} />}
        <Textarea
          ref={ref}
          id={fieldId}
          placeholder={placeholder ? t(placeholder) : undefined}
          data-i18n={placeholder}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-required={required}
          className={cn(
            'min-h-[104px] rounded border-[1.5px] border-border/[0.14] bg-card px-3.5 py-2.5',
            'font-body text-base text-foreground placeholder:text-muted-foreground',
            error && 'border-destructive',
            className,
          )}
          {...props}
        />
        <FieldMessage id={fieldId} error={error} help={help} />
      </div>
    )
  },
)
TextField.displayName = 'TextField'

/** Errors are stated plainly and never in red-on-red — the destructive token
 *  is text only, per the brand's no-red-buttons rule. */
function FieldMessage({ id, error, help }: { id: string; error?: string; help?: string }) {
  const { t } = useT()
  if (error) {
    return (
      <p id={`${id}-error`} role="alert" className="font-body text-sm text-destructive">
        {error}
      </p>
    )
  }
  if (help) {
    return (
      <p id={`${id}-help`} data-i18n={help} className="font-body text-sm text-muted-foreground">
        {t(help)}
      </p>
    )
  }
  return null
}
