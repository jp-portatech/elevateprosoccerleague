import { useRef, useState, type SubmitEvent } from 'react'
import { Icon } from '../components/Icon'
import { RegisterButton } from '../components/RegisterButton'
import { SectionHeading } from '../components/SectionHeading'
import { leadFields, validateLead } from '../contact/leadForm'
import { submitLead, type LeadResult } from '../contact/submitLead'
import { localized } from '../i18n/locale'
import { useLocale } from '../i18n/useLocale'
import { ContactLine } from '../registration/ContactLine'
import { FormField } from '../registration/FormField'
import { fieldId, type FormErrors, type FormValues } from '../registration/forms'
import '../registration/registration.css'
import './Contact.css'

const COPY = localized({
  en: {
    eyebrow: 'Contact us',
    title: 'Not ready to register yet?',
    intro:
      'Leave your details and ElevatePro will reach out to answer your questions and help you find the right fit for your player or team.',
    points: ['Ask about divisions, teams and the season', 'Get a call or email from ElevatePro', 'No commitment and no payment'],
    direct: 'Prefer to reach us directly? Contact ElevatePro',
    formLabel: 'Contact ElevatePro',
    required: 'All fields are required unless marked optional.',
    problems: (n: number) => (n === 1 ? 'There is a problem with this form' : `There are ${n} problems with this form`),
    send: 'Send',
    sending: 'Sending…',
    errors: {
      network: 'We couldn’t send your message. Check your connection and try again.',
      send: 'We couldn’t send your message right now. Please try again, or contact us directly.',
      'too-fast': 'Please check your details and press Send again.',
    },
    notSent: 'Message not sent',
    contactUs: 'Contact ElevatePro',
    thanks: (name: string) => `Thanks, ${name}! We’ll be in touch soon.`,
    confirmation: (email: string) =>
      `We sent a confirmation to ${email}. ElevatePro will contact you by phone or email.`,
    readyNow: 'Ready to join now?',
  },
  es: {
    eyebrow: 'Contáctanos',
    title: '¿Todavía no estás listo para inscribirte?',
    intro:
      'Déjanos tus datos y ElevatePro se comunicará contigo para responder tus preguntas y ayudarte a encontrar la mejor opción para tu jugador o tu equipo.',
    points: [
      'Pregunta por las divisiones, los equipos y la temporada',
      'Recibe una llamada o un correo de ElevatePro',
      'Sin compromiso y sin pago',
    ],
    direct: '¿Prefieres comunicarte directamente? Comunícate con ElevatePro',
    formLabel: 'Comunícate con ElevatePro',
    required: 'Todos los campos son obligatorios, salvo los marcados como opcionales.',
    problems: (n: number) => (n === 1 ? 'Hay un problema en este formulario' : `Hay ${n} problemas en este formulario`),
    send: 'Enviar',
    sending: 'Enviando…',
    errors: {
      network: 'No pudimos enviar tu mensaje. Revisa tu conexión e inténtalo de nuevo.',
      send: 'No pudimos enviar tu mensaje en este momento. Inténtalo de nuevo o comunícate con nosotros directamente.',
      'too-fast': 'Revisa tus datos y presiona Enviar de nuevo.',
    },
    notSent: 'El mensaje no se envió',
    contactUs: 'Comunícate con ElevatePro',
    thanks: (name: string) => `¡Gracias, ${name}! Pronto nos comunicaremos contigo.`,
    confirmation: (email: string) =>
      `Te enviamos una confirmación a ${email}. ElevatePro se comunicará contigo por teléfono o correo electrónico.`,
    readyNow: '¿Listo para unirte ahora?',
  },
})

const ID_PREFIX = 'lead'
const empty = (): FormValues => Object.fromEntries(leadFields.map((f) => [f.name, '']))
const newSubmissionId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`

/** "Not ready to register?" — collects contact details so the league can follow up. */
export function Contact() {
  const locale = useLocale()
  const t = COPY[locale]
  const [values, setValues] = useState<FormValues>(empty)
  const [errors, setErrors] = useState<FormErrors>({})
  const [attempted, setAttempted] = useState(false)
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<Extract<LeadResult, { status: 'error' }>['reason'] | null>(null)
  const [sentTo, setSentTo] = useState<{ name: string; email: string } | null>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const failureRef = useRef<HTMLDivElement>(null)
  const thanksRef = useRef<HTMLHeadingElement>(null)
  const trapRef = useRef<HTMLInputElement>(null)
  const startedAt = useRef<number | null>(null)
  const submissionId = useRef<string | null>(null)

  // Show existing error messages in the new language after a language switch.
  const [errorsLocale, setErrorsLocale] = useState(locale)
  if (errorsLocale !== locale) {
    setErrorsLocale(locale)
    const current = validateLead(values, locale)
    setErrors((prev) => Object.fromEntries(Object.keys(prev).flatMap((f) => (current[f] ? [[f, current[f]]] : []))))
  }

  const handleChange = (name: string, value: string) => {
    startedAt.current ??= Date.now() // spam check: time from first input to Send
    const next = { ...values, [name]: value }
    setValues(next)
    if (Object.keys(errors).length > 0) {
      const current = validateLead(next, locale)
      setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([field]) => current[field])))
    }
    if (failure) setFailure(null)
  }

  const handleBlur = (name: string) => {
    if (!attempted) return
    const message = validateLead(values, locale)[name]
    setErrors(({ [name]: _previous, ...rest }) => (message ? { ...rest, [name]: message } : rest))
  }

  const showErrors = (found: FormErrors) => {
    setErrors(found)
    requestAnimationFrame(() => summaryRef.current?.focus())
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    const found = validateLead(values, locale)
    setAttempted(true)
    setFailure(null)
    if (Object.keys(found).length > 0) return showErrors(found)
    setErrors({})

    setPending(true)
    submissionId.current ??= newSubmissionId() // same id on retries, so nothing is sent twice
    const result = await submitLead(values, locale, {
      submissionId: submissionId.current,
      elapsedMs: startedAt.current === null ? 0 : Date.now() - startedAt.current,
      trap: trapRef.current?.value ?? '',
    })
    setPending(false)
    if (result.status === 'sent') {
      setSentTo({ name: values.name.split(/\s+/)[0], email: values.email })
      requestAnimationFrame(() => thanksRef.current?.focus())
    } else if (result.status === 'invalid') {
      showErrors(result.errors)
    } else {
      setFailure(result.reason)
      requestAnimationFrame(() => failureRef.current?.focus())
    }
  }

  const errorFields = leadFields.filter((f) => errors[f.name])

  return (
    <section className="section section--navy on-dark contact" id="contact" aria-labelledby="contact-title">
      <div className="container contact__grid">
        <div className="contact__intro">
          <SectionHeading id="contact-title" eyebrow={t.eyebrow}>
            {t.title}
          </SectionHeading>
          <p className="section-intro">{t.intro}</p>
          <ul className="checklist contact__points">
            {t.points.map((point) => (
              <li key={point}>
                <Icon name="check" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="contact__direct">
            <ContactLine lead={t.direct} />
          </div>
        </div>

        <div className="contact__card">
          {sentTo ? (
            <div className="contact__thanks" aria-live="polite">
              <h3 className="contact__thanks-title" ref={thanksRef} tabIndex={-1}>
                {t.thanks(sentTo.name)}
              </h3>
              <p>{t.confirmation(sentTo.email)}</p>
              <p className="contact__ready">{t.readyNow}</p>
              <div className="btn-row btn-row--stack">
                <RegisterButton kind="team" />
                <RegisterButton kind="player" />
              </div>
            </div>
          ) : (
            <form
              className="contact__form"
              noValidate
              onSubmit={handleSubmit}
              aria-label={t.formLabel}
              aria-busy={pending || undefined}
            >
              {errorFields.length > 0 && (
                <div className="form-errors" ref={summaryRef} tabIndex={-1}>
                  <div role="alert">
                    <h3 className="form-errors__title">{t.problems(errorFields.length)}</h3>
                    <ul>
                      {errorFields.map((f) => (
                        <li key={f.name}>
                          <a
                            href={`#${fieldId(ID_PREFIX, f.name)}`}
                            onClick={(e) => {
                              e.preventDefault()
                              document.getElementById(fieldId(ID_PREFIX, f.name))?.focus()
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
                {leadFields.map((field) => (
                  <FormField
                    key={field.name}
                    field={field}
                    idPrefix={ID_PREFIX}
                    value={values[field.name]}
                    error={errors[field.name]}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                ))}
              </div>

              {/* Spam trap: hidden from people and screen readers; bots fill it in. */}
              <div className="contact__trap" aria-hidden="true">
                <label htmlFor="lead-leave-this-empty">Leave this empty</label>
                <input id="lead-leave-this-empty" ref={trapRef} type="text" tabIndex={-1} autoComplete="off" />
              </div>

              {failure && (
                <div className="reg-outcome reg-outcome--warning" ref={failureRef} tabIndex={-1} role="alert">
                  <p className="reg-outcome__title">{t.notSent}</p>
                  <p>{t.errors[failure]}</p>
                  {failure !== 'too-fast' && <ContactLine lead={t.contactUs} />}
                </div>
              )}

              <div className="reg-form__actions">
                <button type="submit" className="btn btn--primary" aria-disabled={pending || undefined}>
                  {pending ? t.sending : t.send}
                  {!pending && <Icon name="arrow" className="btn__arrow" />}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
