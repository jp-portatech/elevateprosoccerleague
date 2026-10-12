import { useRef, useState, type SubmitEvent } from 'react'
import { formatPrice, onlinePayments } from '../config/derived'
import { league } from '../config/league'
import { privacyPath } from '../content/navigation'
import { ContactLine } from './ContactLine'
import type { RegistrationKind, RegistrationRequest } from './context'
import { FormField } from './FormField'
import { emptyValues, fieldId, formFields, validateForm, type FormErrors, type FormValues } from './forms'
import { submitRegistration, type SubmitResult } from './submitRegistration'

interface RegistrationFormProps {
  kind: RegistrationKind
  request: RegistrationRequest | null
  hidden: boolean
  onSwitch: (kind: RegistrationKind) => void
}

type Outcome = Extract<SubmitResult, { status: 'not-connected' | 'error' }>

export function RegistrationForm({ kind, request, hidden, onSwitch }: RegistrationFormProps) {
  const fields = formFields[kind]
  const idPrefix = `reg-${kind}`
  const price = league.pricing[kind]
  const [values, setValues] = useState<FormValues>(() => emptyValues(kind))
  const [errors, setErrors] = useState<FormErrors>({})
  const [attempted, setAttempted] = useState(false)
  const [pending, setPending] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [notice, setNotice] = useState<RegistrationRequest['notice']>()
  const summaryRef = useRef<HTMLDivElement>(null)
  const outcomeRef = useRef<HTMLDivElement>(null)

  // Each time the dialog opens for this form: apply a requested division or restored
  // draft, and drop stale messages (adjusting state during render, per React docs).
  const [handledRequestId, setHandledRequestId] = useState<number | null>(null)
  if (request && request.kind === kind && request.id !== handledRequestId) {
    setHandledRequestId(request.id)
    setValues((v) => ({
      ...(request.draft ? { ...emptyValues(kind), ...request.draft } : v),
      ...(request.division && { division: request.division }),
    }))
    setNotice(request.notice)
    setOutcome(null)
    setPending(false)
  }

  const handleChange = (name: string, value: string) => {
    const next = { ...values, [name]: value }
    setValues(next)
    // Clear errors as soon as they're fixed (including the division/date-of-birth pairing);
    // new errors wait for blur or submit.
    if (Object.keys(errors).length > 0) {
      const current = validateForm(kind, next)
      setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([field]) => current[field])))
    }
    if (outcome) setOutcome(null)
  }

  const handleBlur = (name: string) => {
    if (!attempted) return
    const message = validateForm(kind, values)[name]
    setErrors(({ [name]: _previous, ...rest }) => (message ? { ...rest, [name]: message } : rest))
  }

  const showErrors = (found: FormErrors) => {
    setErrors(found)
    requestAnimationFrame(() => summaryRef.current?.focus())
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    const found = validateForm(kind, values)
    setAttempted(true)
    setOutcome(null)
    setNotice(undefined)
    if (Object.keys(found).length > 0) return showErrors(found)
    setErrors({})

    setPending(true)
    const result = await submitRegistration(kind, values)
    if (result.status === 'redirecting') return // stay "pending" while the browser leaves for Stripe
    setPending(false)
    if (result.status === 'invalid') return showErrors(result.errors)
    setOutcome(result)
    requestAnimationFrame(() => outcomeRef.current?.focus())
  }

  const noun = kind === 'team' ? 'team' : 'player'
  const errorFields = fields.filter((f) => errors[f.name])
  const priceLabel = price ? `${formatPrice(price)} ${price.unit}` : null

  return (
    <form className="reg-form" hidden={hidden} noValidate onSubmit={handleSubmit} aria-busy={pending || undefined}>
      {notice === 'checkout-cancelled' && (
        <div className="reg-notice">
          <p className="reg-notice__title">Checkout cancelled — you haven’t been charged</p>
          <p>Your details are still here. Continue to payment when you’re ready.</p>
        </div>
      )}

      {!onlinePayments && (
        <div className="reg-notice">
          <p className="reg-notice__title">Online registration isn’t open yet</p>
          <p>You can fill in this form to check your details, but submitting it won’t send anything to ElevatePro.</p>
          <ContactLine lead="To register now, contact ElevatePro" />
        </div>
      )}

      {kind === 'player' && (
        <div className="reg-callout">
          <p className="reg-callout__title">How team placement works</p>
          <p>
            ElevatePro assigns each individually registered player to a team in the appropriate age division.
            Once your player is placed, you’ll receive your team and season information.
          </p>
        </div>
      )}

      {errorFields.length > 0 && (
        <div className="form-errors" ref={summaryRef} tabIndex={-1}>
          <div role="alert">
            <h3 className="form-errors__title">
              {errorFields.length === 1 ? 'There is a problem' : `There are ${errorFields.length} problems`} with
              this form
            </h3>
            <ul>
              {errorFields.map((f) => (
                <li key={f.name}>
                  <a
                    href={`#${fieldId(idPrefix, f.name)}`}
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById(fieldId(idPrefix, f.name))?.focus()
                    }}
                  >
                    {errors[f.name]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <p className="reg-form__required">All fields are required unless marked optional.</p>

      <div className="form-grid">
        {fields.map((field) => (
          <FormField
            key={field.name}
            field={field}
            idPrefix={idPrefix}
            value={values[field.name]}
            error={errors[field.name]}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        ))}
      </div>

      {outcome && (
        <div className="reg-outcome reg-outcome--warning" ref={outcomeRef} tabIndex={-1} role="alert">
          <p className="reg-outcome__title">Registration not sent</p>
          {outcome.status === 'not-connected' ? (
            <p>
              Your details look complete, but online registration isn’t open yet, so nothing has been sent to
              ElevatePro and no spot has been reserved.
            </p>
          ) : (
            <p>
              {outcome.message} You haven’t been charged and your registration hasn’t been sent. Please try again.
            </p>
          )}
          <ContactLine lead="If this keeps happening, contact ElevatePro" />
        </div>
      )}

      {onlinePayments && priceLabel && (
        <div className="reg-payment">
          <p className="reg-payment__label">Registration fee</p>
          <p className="reg-payment__amount">{priceLabel}</p>
        </div>
      )}

      <div className="reg-form__actions">
        <button type="submit" className="btn btn--primary" aria-disabled={pending || undefined}>
          {onlinePayments
            ? pending
              ? 'Opening secure checkout…'
              : 'Continue to payment'
            : pending
              ? 'Checking…'
              : `Submit ${noun} registration`}
        </button>
        <p className="fine-print">
          {onlinePayments
            ? 'You’ll pay by card on Stripe’s secure checkout. Your registration is complete once payment goes through.'
            : 'No payment is collected on this form.'}
        </p>
      </div>

      <p className="fine-print reg-form__privacy">
        See how we use and protect your information in our{' '}
        <a href={privacyPath} target="_blank" rel="noopener">
          privacy policy<span className="visually-hidden"> (opens in a new tab)</span>
        </a>
        .
      </p>

      <p className="reg-form__switch">
        {kind === 'team' ? 'Registering one player without a team?' : 'Registering a whole team?'}{' '}
        <button type="button" className="text-link" onClick={() => onSwitch(kind === 'team' ? 'player' : 'team')}>
          {kind === 'team' ? 'Register a player instead' : 'Register a team instead'}
        </button>
      </p>
    </form>
  )
}
