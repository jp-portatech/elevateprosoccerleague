import { useRef, useState, useSyncExternalStore, type SubmitEvent } from 'react'
import { Icon } from '../components/Icon'
import { SectionHeading } from '../components/SectionHeading'
import { league } from '../config/league'
import { logo } from '../content/images'
import { StaticLocaleProvider } from '../i18n/LocaleProvider'
import { ContactLine } from '../registration/ContactLine'
import { FormField } from '../registration/FormField'
import { fieldId, type FieldDef, type FormErrors, type FormValues } from '../registration/forms'
import { SignaturePad } from './SignaturePad'
import { submitWaiver, type WaiverResult } from './submitWaiver'
import {
  cleanSignature,
  CURRENT_WAIVER,
  emptyWaiver,
  isMinor,
  validateWaiver,
  WAIVER_ERROR_ORDER,
  WAIVER_FIELDS,
  WAIVERS,
  type Signature,
  type SignatureRole,
  type Signatures,
} from './waiverForm'
import { WaiverMinorsClause, WaiverTerms } from './WaiverText'
// The page frame (header, intro band, thank-you, footer) is shared with the winter survey.
import '../registration/registration.css'
import '../winter-survey/winter-survey.css'
import './waiver.css'

const ID_PREFIX = 'waiver'
const YEAR = new Date().getFullYear()
const WAIVER = WAIVERS[CURRENT_WAIVER]
/** Kept when a parent signs another waiver right after (a brother or sister). */
const FAMILY_FIELDS = ['email', 'eveningPhone', 'address', 'city', 'state', 'zip']
const SIGNATURE_IDS: Record<string, string> = {
  participantSignature: `${ID_PREFIX}-signature-participant`,
  guardianSignature: `${ID_PREFIX}-signature-guardian`,
  consent: fieldId(ID_PREFIX, 'consent'),
}

const CONSENT_FIELD: FieldDef = {
  name: 'consent',
  label: {
    en: 'I agree to sign this waiver electronically. My electronic signature counts the same as signing it on paper.',
    es: 'I agree to sign this waiver electronically. My electronic signature counts the same as signing it on paper.',
  },
  type: 'checkbox',
  required: true,
}

const COPY = {
  skip: 'Skip to the waiver',
  audience: 'Facility waiver',
  program: 'Elevate Pro Winter Training',
  title: 'Facility waiver',
  intro:
    'The facility requires this signed waiver for every player before their first session. Fill in the player’s details, read the waiver, and sign at the bottom. It takes about 3 minutes. Please complete one per player.',
  formLabel: 'USA Internacional waiver',
  required: 'All fields are required unless marked optional.',
  step: (n: number) => `Step ${n} of 2`,
  detailsTitle: 'Participant details',
  readTitle: 'Read and sign',
  date: 'Date',
  dateNote: 'Filled in automatically',
  guardianNotNeeded: 'Only needed for participants under 18.',
  problems: (n: number) => (n === 1 ? 'There is 1 problem' : `There are ${n} problems`),
  submit: 'Sign and submit waiver',
  sending: 'Sending…',
  notSent: 'Your waiver wasn’t sent',
  errors: {
    network: 'We couldn’t reach the server. Check your connection and try again.',
    send: 'Something went wrong on our end, so the waiver wasn’t saved. Please try again in a moment.',
    'too-fast': 'That was quick! Please check the form and press Sign and submit waiver again.',
  } satisfies Record<Extract<WaiverResult, { status: 'error' }>['reason'], string>,
  contactUs: 'Or reach Elevate Pro',
  thanksTitle: 'Thank you!',
  thanksText: (name: string) => `We received the signed waiver for ${name}.`,
  confirmation: (email: string) => `A copy is on its way to ${email}.`,
  another: 'Sign a waiver for another player',
  legal: 'Privacy policy: elevateprosoccer.com/privacy',
}

const newSubmissionId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`

const subscribeNever = () => () => {}
const todayLabel = () => new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date())

/** Signatures as the server will read them (typed names trimmed). */
const cleaned = (s: Signatures): Signatures => ({
  participant: cleanSignature(s.participant),
  guardian: cleanSignature(s.guardian),
})

/** Unlisted facility waiver (/waiver), signed online by parents. One per player. */
export function WaiverPage() {
  const [values, setValues] = useState<FormValues>(emptyWaiver)
  const [signatures, setSignatures] = useState<Signatures>({ participant: null, guardian: null })
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [attempted, setAttempted] = useState(false)
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<Extract<WaiverResult, { status: 'error' }>['reason'] | null>(null)
  const [sent, setSent] = useState<{ name: string; email: string; confirmed: boolean } | null>(null)
  const today = useSyncExternalStore(subscribeNever, todayLabel, () => '')
  const topRef = useRef<HTMLDivElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const failureRef = useRef<HTMLDivElement>(null)
  const thanksRef = useRef<HTMLHeadingElement>(null)
  const trapRef = useRef<HTMLInputElement>(null)
  const startedAt = useRef<number | null>(null)
  const submissionId = useRef<string | null>(null)

  const minor = isMinor(values.dob)
  const check = (v: FormValues, s: Signatures, c: boolean) => validateWaiver(v, cleaned(s), c)

  /** After a failed submit, errors clear as soon as they're fixed. */
  const recheck = (v: FormValues, s: Signatures, c: boolean) => {
    startedAt.current ??= Date.now() // spam check: time from first answer to Submit
    if (Object.keys(errors).length > 0) {
      const current = check(v, s, c)
      setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => current[key])))
    }
    if (failure) setFailure(null)
  }

  const handleChange = (name: string, value: string) => {
    if (name === 'consent') {
      const next = value === 'yes'
      setConsent(next)
      return recheck(values, signatures, next)
    }
    const next = { ...values, [name]: value }
    setValues(next)
    recheck(next, signatures, consent)
  }

  const handleSignature = (role: SignatureRole, value: Signature | null) => {
    const next = { ...signatures, [role]: value }
    setSignatures(next)
    recheck(values, next, consent)
  }

  const handleBlur = (name: string) => {
    if (!attempted) return
    const message = check(values, signatures, consent)[name]
    setErrors(({ [name]: _previous, ...rest }) => (message ? { ...rest, [name]: message } : rest))
  }

  const showErrors = (found: FormErrors) => {
    setErrors(found)
    requestAnimationFrame(() => summaryRef.current?.focus())
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    const found = check(values, signatures, consent)
    setAttempted(true)
    setFailure(null)
    if (Object.keys(found).length > 0) return showErrors(found)
    setErrors({})

    setPending(true)
    submissionId.current ??= newSubmissionId() // same id on retries, so nothing is saved twice
    const result = await submitWaiver(values, cleaned(signatures), consent, {
      submissionId: submissionId.current,
      elapsedMs: startedAt.current === null ? 0 : Date.now() - startedAt.current,
      trap: trapRef.current?.value ?? '',
    })
    setPending(false)
    if (result.status === 'sent') {
      setSent({ name: values.name, email: values.email, confirmed: result.confirmed })
      requestAnimationFrame(() => {
        topRef.current?.scrollIntoView({ block: 'start' })
        thanksRef.current?.focus({ preventScroll: true })
      })
    } else if (result.status === 'invalid') {
      showErrors(result.errors)
    } else {
      setFailure(result.reason)
      requestAnimationFrame(() => failureRef.current?.focus())
    }
  }

  /** A fresh waiver for a brother or sister: contact details and address stay filled in. */
  const startAnother = () => {
    const fresh = emptyWaiver()
    for (const name of FAMILY_FIELDS) fresh[name] = values[name]
    setValues(fresh)
    setSignatures({ participant: null, guardian: null })
    setConsent(false)
    setErrors({})
    setAttempted(false)
    setFailure(null)
    setSent(null)
    startedAt.current = null
    submissionId.current = null
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ block: 'start' })
      document.getElementById(fieldId(ID_PREFIX, 'name'))?.focus({ preventScroll: true })
    })
  }

  const errorKeys = WAIVER_ERROR_ORDER.filter((key) => errors[key])
  const targetId = (key: string) => SIGNATURE_IDS[key] ?? fieldId(ID_PREFIX, key)

  const dateLine = (signed: boolean) => (
    <div className="waiver-date">
      <p className="field__label">{COPY.date}</p>
      <p className="waiver-date__value">{signed ? today : '—'}</p>
      <p className="field__hint">{COPY.dateNote}</p>
    </div>
  )

  return (
    <StaticLocaleProvider locale="en">
      <div className="survey-page">
        <a className="skip-link" href="#main">
          {COPY.skip}
        </a>
        <header className="survey-header">
          <div className="container survey-header__inner">
            <img
              className="survey-header__logo"
              src={logo.src}
              srcSet={logo.srcSet}
              sizes="(min-width: 768px) 56px, 44px"
              width={256}
              height={256}
              alt={logo.alt}
            />
            <p className="survey-header__audience">{COPY.audience}</p>
          </div>
        </header>

        <main id="main" tabIndex={-1}>
          <div className="survey-hero">
            <div className="container survey__container">
              <p className="eyebrow">{COPY.program}</p>
              <h1 className="survey-hero__title">{COPY.title}</h1>
              <p className="survey-hero__intro">{COPY.intro}</p>
            </div>
          </div>

          <div className="container survey__container survey__body" ref={topRef}>
            {sent ? (
              <div className="survey-thanks" aria-live="polite">
                <Icon name="check" className="survey-thanks__icon" />
                <h2 className="survey-thanks__title" ref={thanksRef} tabIndex={-1}>
                  {COPY.thanksTitle}
                </h2>
                <p className="survey-thanks__text">{COPY.thanksText(sent.name)}</p>
                {sent.confirmed && <p>{COPY.confirmation(sent.email)}</p>}
                <button type="button" className="btn btn--primary" onClick={startAnother}>
                  {COPY.another}
                  <Icon name="arrow" className="btn__arrow" />
                </button>
              </div>
            ) : (
              <form
                className="survey-form"
                noValidate
                onSubmit={handleSubmit}
                aria-label={COPY.formLabel}
                aria-busy={pending || undefined}
              >
                {errorKeys.length > 0 && (
                  <div className="form-errors" ref={summaryRef} tabIndex={-1}>
                    <div role="alert">
                      <h2 className="form-errors__title">{COPY.problems(errorKeys.length)}</h2>
                      <ul>
                        {errorKeys.map((key) => (
                          <li key={key}>
                            <a
                              href={`#${targetId(key)}`}
                              onClick={(e) => {
                                e.preventDefault()
                                const target = document.getElementById(targetId(key))
                                target?.scrollIntoView({ block: 'center' })
                                target?.focus({ preventScroll: true })
                              }}
                            >
                              {errors[key]}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <p className="reg-form__required">{COPY.required}</p>

                <section className="survey-section" aria-labelledby="waiver-details-title">
                  <SectionHeading id="waiver-details-title" eyebrow={COPY.step(1)} className="survey-section__heading">
                    {COPY.detailsTitle}
                  </SectionHeading>
                  <div className="waiver-fields">
                    {WAIVER_FIELDS.map(({ field, span }) => (
                      <div className={`waiver-fields__item waiver-fields__item--${span}`} key={field.name}>
                        <FormField
                          field={field}
                          idPrefix={ID_PREFIX}
                          value={values[field.name]}
                          error={errors[field.name]}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <section className="survey-section" aria-labelledby="waiver-sign-title">
                  <SectionHeading id="waiver-sign-title" eyebrow={COPY.step(2)} className="survey-section__heading">
                    {COPY.readTitle}
                  </SectionHeading>

                  <div className="waiver-terms">
                    <h3 className="waiver-terms__title">{WAIVER.title}</h3>
                    <WaiverTerms waiver={WAIVER} />
                  </div>

                  <div className="waiver-sign">
                    <SignaturePad
                      id={SIGNATURE_IDS.participantSignature}
                      label="Signature"
                      required
                      value={signatures.participant}
                      error={errors.participantSignature}
                      onChange={(v) => handleSignature('participant', v)}
                    />
                    {dateLine(Boolean(signatures.participant))}
                  </div>

                  <div className="waiver-terms">
                    <WaiverMinorsClause waiver={WAIVER} />
                  </div>

                  <div className="waiver-sign">
                    <SignaturePad
                      id={SIGNATURE_IDS.guardianSignature}
                      label="Parent/Guardian Signature"
                      note={minor ? undefined : COPY.guardianNotNeeded}
                      required={minor}
                      value={signatures.guardian}
                      error={errors.guardianSignature}
                      onChange={(v) => handleSignature('guardian', v)}
                    />
                    {dateLine(Boolean(signatures.guardian))}
                  </div>

                  <div className="waiver-consent">
                    <FormField
                      field={CONSENT_FIELD}
                      idPrefix={ID_PREFIX}
                      value={consent ? 'yes' : ''}
                      error={errors.consent}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </div>
                </section>

                {/* Spam trap: hidden from people and screen readers; bots fill it in. */}
                <div className="survey__trap" aria-hidden="true">
                  <label htmlFor="waiver-leave-this-empty">Leave this empty</label>
                  <input id="waiver-leave-this-empty" ref={trapRef} type="text" tabIndex={-1} autoComplete="off" />
                </div>

                {failure && (
                  <div className="reg-outcome reg-outcome--warning" ref={failureRef} tabIndex={-1} role="alert">
                    <p className="reg-outcome__title">{COPY.notSent}</p>
                    <p>{COPY.errors[failure]}</p>
                    {failure !== 'too-fast' && <ContactLine lead={COPY.contactUs} />}
                  </div>
                )}

                <div className="reg-form__actions">
                  <button type="submit" className="btn btn--primary" aria-disabled={pending || undefined}>
                    {pending ? COPY.sending : COPY.submit}
                    {!pending && <Icon name="arrow" className="btn__arrow" />}
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>

        <footer className="survey-footer">
          <div className="container survey-footer__inner">
            <img className="survey-footer__logo" src={logo.src} srcSet={logo.srcSet} sizes="40px" width={256} height={256} alt="" loading="lazy" />
            <p>
              © {YEAR} {league.name} · {league.venue.city}, {league.venue.region}
            </p>
            <p className="survey-footer__legal">{COPY.legal}</p>
          </div>
        </footer>
      </div>
    </StaticLocaleProvider>
  )
}
