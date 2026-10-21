import { fieldId } from '../registration/forms'
import type { ChoiceQuestion } from './surveyForm'

interface ChoiceFieldProps {
  question: ChoiceQuestion
  idPrefix: string
  value: string | string[]
  error?: string
  onChange: (name: string, value: string | string[]) => void
  onBlur: (name: string) => void
}

/**
 * A single-choice (radio buttons) or multiple-choice (checkboxes) question, in the same look as
 * FormField: a fieldset whose legend is the question, with hint and error underneath. The first
 * option carries the field id, so the error summary's link lands on it.
 */
export function ChoiceField({ question: q, idPrefix, value, error, onChange, onBlur }: ChoiceFieldProps) {
  const id = fieldId(idPrefix, q.name)
  const hintId = q.hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const countId = q.maxChoices ? `${id}-count` : undefined
  const picked = Array.isArray(value) ? value : value ? [value] : []
  const full = q.maxChoices !== undefined && picked.length >= q.maxChoices

  const toggle = (option: string, checked: boolean) => {
    if (!q.multiple) return onChange(q.name, option)
    const next = checked ? [...picked, option] : picked.filter((v) => v !== option)
    onChange(
      q.name,
      q.options.filter((o) => next.includes(o.value)).map((o) => o.value),
    )
  }

  return (
    <fieldset
      className={['field', 'choice', q.compact && 'choice--compact', error && 'field--error'].filter(Boolean).join(' ')}
      aria-describedby={[hintId, errorId, countId].filter(Boolean).join(' ') || undefined}
    >
      <legend className="field__label">
        {q.label}
        {!q.required && <span className="field__optional"> (optional)</span>}
      </legend>
      {q.hint && (
        <p className="field__hint" id={hintId}>
          {q.hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={errorId}>
          <span className="visually-hidden">Error: </span>
          {error}
        </p>
      )}
      <div className="choice__options">
        {q.options.map((option, i) => {
          const optionId = i === 0 ? id : `${id}-${i}`
          const checked = picked.includes(option.value)
          return (
            <label className="choice__option" htmlFor={optionId} key={option.value}>
              <input
                id={optionId}
                type={q.multiple ? 'checkbox' : 'radio'}
                name={q.name}
                value={option.value}
                checked={checked}
                // At the limit, the rest wait until one is unticked.
                disabled={q.multiple && full && !checked}
                aria-invalid={error ? true : undefined}
                onChange={(e) => toggle(option.value, e.target.checked)}
                // Checked once focus leaves the whole question, not when moving between its options.
                onBlur={(e) => {
                  if (!e.currentTarget.closest('fieldset')?.contains(e.relatedTarget as Node | null)) onBlur(q.name)
                }}
              />
              <span>{option.label}</span>
            </label>
          )
        })}
      </div>
      {q.maxChoices && (
        <p className="field__hint choice__count" id={countId} aria-live="polite">
          {picked.length} of {q.maxChoices} picked
        </p>
      )}
    </fieldset>
  )
}
