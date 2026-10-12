import { useRef, useState, type SubmitEvent } from 'react'
import { onlinePayments, priceWithUnit } from '../config/derived'
import { league } from '../config/league'
import { useLocale } from '../i18n/useLocale'
import { localized, pagePath } from '../i18n/locale'
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

const COPY = localized({
  en: {
    cancelledTitle: 'Checkout cancelled — you haven’t been charged',
    cancelledText: 'Your details are still here. Continue to payment when you’re ready.',
    closedTitle: 'Online registration isn’t open yet',
    closedText: 'You can fill in this form to check your details, but submitting it won’t send anything to ElevatePro.',
    closedContact: 'To register now, contact ElevatePro',
    placementTitle: 'How team placement works',
    placementText:
      'ElevatePro assigns each individually registered player to a team in the appropriate age division. Once your player is placed, you’ll receive your team and season information.',
    problems: (n: number) => (n === 1 ? 'There is a problem with this form' : `There are ${n} problems with this form`),
    required: 'All fields are required unless marked optional.',
    notSentTitle: 'Registration not sent',
    notConnected:
      'Your details look complete, but online registration isn’t open yet, so nothing has been sent to ElevatePro and no spot has been reserved.',
    errors: {
      network: 'We couldn’t reach the registration service. Check your connection.',
      'not-configured': 'Online payment isn’t switched on yet.',
      checkout: 'We couldn’t start the secure checkout.',
    },
    notCharged: 'You haven’t been charged and your registration hasn’t been sent. Please try again.',
    keepsHappening: 'If this keeps happening, contact ElevatePro',
    fee: 'Registration fee',
    opening: 'Opening secure checkout…',
    continue: 'Continue to payment',
    checking: 'Checking…',
    submit: (noun: string) => `Submit ${noun} registration`,
    team: 'team',
    player: 'player',
    payNote: 'You’ll pay by card on Stripe’s secure checkout. Your registration is complete once payment goes through.',
    noPayment: 'No payment is collected on this form.',
    privacyLead: 'See how we use and protect your information in our',
    privacyLink: 'privacy policy',
    newTab: ' (opens in a new tab)',
    switchToPlayer: ['Registering one player without a team?', 'Register a player instead'],
    switchToTeam: ['Registering a whole team?', 'Register a team instead'],
  },
  es: {
    cancelledTitle: 'Pago cancelado: no se te hizo ningún cargo',
    cancelledText: 'Tus datos siguen aquí. Continúa al pago cuando estés listo.',
    closedTitle: 'La inscripción en línea aún no está abierta',
    closedText: 'Puedes llenar este formulario para revisar tus datos, pero enviarlo no le mandará nada a ElevatePro.',
    closedContact: 'Para inscribirte ahora, comunícate con ElevatePro',
    placementTitle: 'Cómo se asignan los equipos',
    placementText:
      'ElevatePro asigna a cada jugador inscrito de forma individual a un equipo de su división de edad. Cuando tu jugador tenga equipo, recibirás la información del equipo y de la temporada.',
    problems: (n: number) => (n === 1 ? 'Hay un problema en este formulario' : `Hay ${n} problemas en este formulario`),
    required: 'Todos los campos son obligatorios, salvo los marcados como opcionales.',
    notSentTitle: 'La inscripción no se envió',
    notConnected:
      'Tus datos están completos, pero la inscripción en línea aún no está abierta, así que no se envió nada a ElevatePro ni se apartó ningún lugar.',
    errors: {
      network: 'No pudimos conectar con el servicio de inscripción. Revisa tu conexión.',
      'not-configured': 'El pago en línea aún no está activado.',
      checkout: 'No pudimos abrir el pago seguro.',
    },
    notCharged: 'No se te hizo ningún cargo y tu inscripción no se envió. Inténtalo de nuevo.',
    keepsHappening: 'Si esto sigue pasando, comunícate con ElevatePro',
    fee: 'Cuota de inscripción',
    opening: 'Abriendo el pago seguro…',
    continue: 'Continuar al pago',
    checking: 'Revisando…',
    submit: () => 'Enviar inscripción',
    team: 'equipo',
    player: 'jugador',
    payNote: 'Pagarás con tarjeta en la página de pago seguro de Stripe. Tu inscripción queda completa cuando se procese el pago.',
    noPayment: 'Este formulario no cobra ningún pago.',
    privacyLead: 'Consulta cómo usamos y protegemos tu información en nuestra',
    privacyLink: 'política de privacidad',
    newTab: ' (se abre en una pestaña nueva)',
    switchToPlayer: ['¿Vas a inscribir a un jugador sin equipo?', 'Cambiar a inscripción individual'],
    switchToTeam: ['¿Vas a inscribir a un equipo completo?', 'Cambiar a inscripción de equipo'],
  },
})

export function RegistrationForm({ kind, request, hidden, onSwitch }: RegistrationFormProps) {
  const fields = formFields[kind]
  const idPrefix = `reg-${kind}`
  const price = league.pricing[kind]
  const locale = useLocale()
  const t = COPY[locale]
  const [values, setValues] = useState<FormValues>(() => emptyValues(kind))
  const [errors, setErrors] = useState<FormErrors>({})
  const [attempted, setAttempted] = useState(false)
  const [pending, setPending] = useState(false)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [notice, setNotice] = useState<RegistrationRequest['notice']>()
  const summaryRef = useRef<HTMLDivElement>(null)
  // Show existing error messages in the new language after a language switch.
  const [errorsLocale, setErrorsLocale] = useState(locale)
  if (errorsLocale !== locale) {
    setErrorsLocale(locale)
    const current = validateForm(kind, values, locale)
    setErrors((prev) => Object.fromEntries(Object.keys(prev).flatMap((f) => (current[f] ? [[f, current[f]]] : []))))
  }
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
      const current = validateForm(kind, next, locale)
      setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([field]) => current[field])))
    }
    if (outcome) setOutcome(null)
  }

  const handleBlur = (name: string) => {
    if (!attempted) return
    const message = validateForm(kind, values, locale)[name]
    setErrors(({ [name]: _previous, ...rest }) => (message ? { ...rest, [name]: message } : rest))
  }

  const showErrors = (found: FormErrors) => {
    setErrors(found)
    requestAnimationFrame(() => summaryRef.current?.focus())
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    const found = validateForm(kind, values, locale)
    setAttempted(true)
    setOutcome(null)
    setNotice(undefined)
    if (Object.keys(found).length > 0) return showErrors(found)
    setErrors({})

    setPending(true)
    const result = await submitRegistration(kind, values, locale)
    if (result.status === 'redirecting') return // stay "pending" while the browser leaves for Stripe
    setPending(false)
    if (result.status === 'invalid') return showErrors(result.errors)
    setOutcome(result)
    requestAnimationFrame(() => outcomeRef.current?.focus())
  }

  const noun = kind === 'team' ? t.team : t.player
  const errorFields = fields.filter((f) => errors[f.name])
  const priceLabel = price ? priceWithUnit(price, locale) : null
  const [switchQuestion, switchAction] = kind === 'team' ? t.switchToPlayer : t.switchToTeam

  return (
    <form className="reg-form" hidden={hidden} noValidate onSubmit={handleSubmit} aria-busy={pending || undefined}>
      {notice === 'checkout-cancelled' && (
        <div className="reg-notice">
          <p className="reg-notice__title">{t.cancelledTitle}</p>
          <p>{t.cancelledText}</p>
        </div>
      )}

      {!onlinePayments && (
        <div className="reg-notice">
          <p className="reg-notice__title">{t.closedTitle}</p>
          <p>{t.closedText}</p>
          <ContactLine lead={t.closedContact} />
        </div>
      )}

      {kind === 'player' && (
        <div className="reg-callout">
          <p className="reg-callout__title">{t.placementTitle}</p>
          <p>{t.placementText}</p>
        </div>
      )}

      {errorFields.length > 0 && (
        <div className="form-errors" ref={summaryRef} tabIndex={-1}>
          <div role="alert">
            <h3 className="form-errors__title">{t.problems(errorFields.length)}</h3>
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

      <p className="reg-form__required">{t.required}</p>

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
          <p className="reg-outcome__title">{t.notSentTitle}</p>
          {outcome.status === 'not-connected' ? (
            <p>{t.notConnected}</p>
          ) : (
            <p>
              {t.errors[outcome.reason]} {t.notCharged}
            </p>
          )}
          <ContactLine lead={t.keepsHappening} />
        </div>
      )}

      {onlinePayments && priceLabel && (
        <div className="reg-payment">
          <p className="reg-payment__label">{t.fee}</p>
          <p className="reg-payment__amount">{priceLabel}</p>
        </div>
      )}

      <div className="reg-form__actions">
        <button type="submit" className="btn btn--primary" aria-disabled={pending || undefined}>
          {onlinePayments ? (pending ? t.opening : t.continue) : pending ? t.checking : t.submit(noun)}
        </button>
        <p className="fine-print">
          {onlinePayments ? t.payNote : t.noPayment}
        </p>
      </div>

      <p className="fine-print reg-form__privacy">
        {t.privacyLead}{' '}
        <a href={pagePath('privacy', locale)} target="_blank" rel="noopener">
          {t.privacyLink}
          <span className="visually-hidden">{t.newTab}</span>
        </a>
        .
      </p>

      <p className="reg-form__switch">
        {switchQuestion}{' '}
        <button type="button" className="text-link" onClick={() => onSwitch(kind === 'team' ? 'player' : 'team')}>
          {switchAction}
        </button>
      </p>
    </form>
  )
}
