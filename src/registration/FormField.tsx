import type { ChangeEvent } from 'react'
import { fieldId, todayIso, type FieldDef } from './forms'

interface FormFieldProps {
  field: FieldDef
  idPrefix: string
  value: string
  error?: string
  onChange: (name: string, value: string) => void
  onBlur: (name: string) => void
}

export function FormField({ field, idPrefix, value, error, onChange, onBlur }: FormFieldProps) {
  const id = fieldId(idPrefix, field.name)
  const hintId = field.hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  const shared = {
    id,
    name: field.name,
    value,
    required: field.required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    autoComplete: field.autoComplete ?? 'off',
    className: 'field__control',
    onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      onChange(field.name, e.target.value),
    onBlur: () => onBlur(field.name),
  }

  let control
  if (field.type === 'select') {
    control = (
      <select {...shared}>
        <option value="">{field.placeholderOption ?? 'Select an option'}</option>
        {field.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    )
  } else if (field.type === 'textarea') {
    control = <textarea {...shared} rows={4} maxLength={field.maxLength} />
  } else {
    control = (
      <input
        {...shared}
        type={field.type}
        maxLength={field.maxLength}
        max={field.type === 'date' ? todayIso() : undefined}
        spellCheck={field.type === 'email' ? false : undefined}
      />
    )
  }

  return (
    <div className={['field', field.half && 'field--half', error && 'field--error'].filter(Boolean).join(' ')}>
      <label className="field__label" htmlFor={id}>
        {field.label}
        {!field.required && <span className="field__optional"> (optional)</span>}
      </label>
      {field.hint && (
        <p className="field__hint" id={hintId}>
          {field.hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={errorId}>
          <span className="visually-hidden">Error: </span>
          {error}
        </p>
      )}
      {control}
    </div>
  )
}
