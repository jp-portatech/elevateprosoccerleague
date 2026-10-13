import { useSyncExternalStore, type ChangeEvent } from 'react'
import { useLocale } from '../i18n/useLocale'
import { fieldId, todayIso, type FieldDef } from './forms'

interface FormFieldProps {
  field: FieldDef
  idPrefix: string
  value: string
  error?: string
  onChange: (name: string, value: string) => void
  onBlur: (name: string) => void
}

const subscribeNever = () => () => {}

export function FormField({ field, idPrefix, value, error, onChange, onBlur }: FormFieldProps) {
  const locale = useLocale()
  // Pages are pre-rendered at build time, so today's date (the latest birth date) is filled in
  // from the visitor's clock once the page runs in the browser.
  const today = useSyncExternalStore(subscribeNever, todayIso, () => undefined)
  const es = locale === 'es'
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

  if (field.type === 'checkbox') {
    // The label is a full sentence after the box, e.g. "Yes, send me news and offers".
    return (
      <div className={['field', 'field--checkbox', error && 'field--error'].filter(Boolean).join(' ')}>
        <div className="field__check">
          <input
            id={id}
            name={field.name}
            type="checkbox"
            className="field__checkbox"
            checked={value === 'yes'}
            required={field.required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            onChange={(e) => onChange(field.name, e.target.checked ? 'yes' : '')}
            onBlur={() => onBlur(field.name)}
          />
          <label className="field__check-label" htmlFor={id}>
            {field.label[locale]}
          </label>
        </div>
        {field.hint && (
          <p className="field__hint" id={hintId}>
            {field.hint[locale]}
          </p>
        )}
        {error && (
          <p className="field__error" id={errorId}>
            <span className="visually-hidden">Error: </span>
            {error}
          </p>
        )}
      </div>
    )
  }

  let control
  if (field.type === 'select') {
    control = (
      <select {...shared}>
        <option value="">{field.placeholderOption?.[locale] ?? (es ? 'Selecciona una opción' : 'Select an option')}</option>
        {field.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label[locale]}
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
        max={field.type === 'date' ? today : undefined}
        spellCheck={field.type === 'email' ? false : undefined}
      />
    )
  }

  return (
    <div className={['field', field.half && 'field--half', error && 'field--error'].filter(Boolean).join(' ')}>
      <label className="field__label" htmlFor={id}>
        {field.label[locale]}
        {!field.required && <span className="field__optional"> ({es ? 'opcional' : 'optional'})</span>}
      </label>
      {field.hint && (
        <p className="field__hint" id={hintId}>
          {field.hint[locale]}
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
