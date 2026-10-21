import { useRef, useState, type SubmitEvent } from 'react'
import { Icon } from '../components/Icon'
import { SectionHeading } from '../components/SectionHeading'
import { league } from '../config/league'
import { logo } from '../content/images'
import { StaticLocaleProvider } from '../i18n/LocaleProvider'
import { ContactLine } from '../registration/ContactLine'
import { FormField } from '../registration/FormField'
import { fieldId, type FormErrors } from '../registration/forms'
import { ChoiceField } from './ChoiceField'
import { submitSurvey, type SurveyResult } from './submitSurvey'
import {
  emptySurvey,
  isAsked,
  questionName,
  SURVEY_QUESTIONS,
  SURVEY_SECTIONS,
  validateSurvey,
  type SurveyValues,
} from './surveyForm'
import '../registration/registration.css'
import './winter-survey.css'

const ID_PREFIX = 'survey'
const YEAR = new Date().getFullYear()
/** Kept when a parent starts another player's survey. */
const PARENT_FIELDS = ['parentName', 'parentPhone', 'parentEmail']

const COPY = {
  skip: 'Skip to the survey',
  audience: 'Winter training',
  program: 'Elevate Pro Winter Training',
  title: 'Player survey',
  intro:
    'Hi Elevate Pro families! We’re building our indoor winter program (Monday–Friday, 8–10 pm) and want each player’s schedule to work around their club team, not against it. This survey takes about 5 minutes. Please complete one per player.',
  formLabel: 'Winter training player survey',
  required: 'All questions are required unless marked optional.',
  section: (n: number) => `Section ${n} of ${SURVEY_SECTIONS.length}`,
  problems: (n: number) => (n === 1 ? 'There is 1 problem' : `There are ${n} problems`),
  submit: 'Submit survey',
  sending: 'Sending…',
  notSent: 'Your answers weren’t sent',
  errors: {
    network: 'We couldn’t reach the server. Check your connection and try again.',
    send: 'Something went wrong on our end, so your answers weren’t saved. Please try again in a moment.',
    'too-fast': 'That was quick! Please check your answers and press Submit survey again.',
  } satisfies Record<Extract<SurveyResult, { status: 'error' }>['reason'], string>,
  contactUs: 'Or reach Elevate Pro',
  thanksTitle: 'Thank you!',
  thanksText: 'We’ll send group placements and the winter schedule soon.',
  confirmation: (email: string) => `A copy of your answers is on its way to ${email}.`,
  another: 'Submit for another player',
  legal: 'Privacy policy: elevateprosoccer.com/privacy',
}

const newSubmissionId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`

/** Unlisted survey for private training families (/winter-survey). One submission per player. */
export function WinterSurveyPage() {
  const [values, setValues] = useState<SurveyValues>(emptySurvey)
  const [errors, setErrors] = useState<FormErrors>({})
  const [attempted, setAttempted] = useState(false)
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<Extract<SurveyResult, { status: 'error' }>['reason'] | null>(null)
  const [sent, setSent] = useState<{ email: string; confirmed: boolean } | null>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const failureRef = useRef<HTMLDivElement>(null)
  const thanksRef = useRef<HTMLHeadingElement>(null)
  const trapRef = useRef<HTMLInputElement>(null)
  const startedAt = useRef<number | null>(null)
  const submissionId = useRef<string | null>(null)

  const handleChange = (name: string, value: string | string[]) => {
    startedAt.current ??= Date.now() // spam check: time from first answer to Submit
    const next = { ...values, [name]: value }
    setValues(next)
    if (Object.keys(errors).length > 0) {
      const current = validateSurvey(next)
      setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([field]) => current[field])))
    }
    if (failure) setFailure(null)
  }

  const handleBlur = (name: string) => {
    if (!attempted) return
    const message = validateSurvey(values)[name]
    setErrors(({ [name]: _previous, ...rest }) => (message ? { ...rest, [name]: message } : rest))
  }

  const showErrors = (found: FormErrors) => {
    setErrors(found)
    requestAnimationFrame(() => summaryRef.current?.focus())
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    const found = validateSurvey(values)
    setAttempted(true)
    setFailure(null)
    if (Object.keys(found).length > 0) return showErrors(found)
    setErrors({})

    setPending(true)
    submissionId.current ??= newSubmissionId() // same id on retries, so nothing is saved twice
    const result = await submitSurvey(values, {
      submissionId: submissionId.current,
      elapsedMs: startedAt.current === null ? 0 : Date.now() - startedAt.current,
      trap: trapRef.current?.value ?? '',
    })
    setPending(false)
    if (result.status === 'sent') {
      setSent({ email: values.parentEmail as string, confirmed: result.confirmed })
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

  /** A fresh survey for a brother or sister: the parent's contact details stay filled in. */
  const startAnother = () => {
    const fresh = emptySurvey()
    for (const name of PARENT_FIELDS) fresh[name] = values[name]
    setValues(fresh)
    setErrors({})
    setAttempted(false)
    setFailure(null)
    setSent(null)
    startedAt.current = null
    submissionId.current = null
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ block: 'start' })
      document.getElementById(fieldId(ID_PREFIX, 'playerName'))?.focus({ preventScroll: true })
    })
  }

  const errorQuestions = SURVEY_QUESTIONS.filter((q) => errors[questionName(q)])

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
                <p className="survey-thanks__text">{COPY.thanksText}</p>
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
                {errorQuestions.length > 0 && (
                  <div className="form-errors" ref={summaryRef} tabIndex={-1}>
                    <div role="alert">
                      <h2 className="form-errors__title">{COPY.problems(errorQuestions.length)}</h2>
                      <ul>
                        {errorQuestions.map((q) => {
                          const id = fieldId(ID_PREFIX, questionName(q))
                          return (
                            <li key={id}>
                              <a
                                href={`#${id}`}
                                onClick={(e) => {
                                  e.preventDefault()
                                  document.getElementById(id)?.focus()
                                }}
                              >
                                {errors[questionName(q)]}
                              </a>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>
                )}

                <p className="reg-form__required">{COPY.required}</p>

                {SURVEY_SECTIONS.map((section, i) => (
                  <section className="survey-section" key={section.id} aria-labelledby={`survey-${section.id}-title`}>
                    <SectionHeading
                      id={`survey-${section.id}-title`}
                      eyebrow={COPY.section(i + 1)}
                      className="survey-section__heading"
                    >
                      {section.title}
                    </SectionHeading>
                    <div className="form-grid">
                      {section.questions
                        .filter((q) => isAsked(q, values))
                        .map((q) =>
                          q.kind === 'input' ? (
                            <FormField
                              key={q.field.name}
                              field={q.field}
                              idPrefix={ID_PREFIX}
                              value={values[q.field.name] as string}
                              error={errors[q.field.name]}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          ) : (
                            <ChoiceField
                              key={q.name}
                              question={q}
                              idPrefix={ID_PREFIX}
                              value={values[q.name]}
                              error={errors[q.name]}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          ),
                        )}
                    </div>
                  </section>
                ))}

                {/* Spam trap: hidden from people and screen readers; bots fill it in. */}
                <div className="survey__trap" aria-hidden="true">
                  <label htmlFor="survey-leave-this-empty">Leave this empty</label>
                  <input id="survey-leave-this-empty" ref={trapRef} type="text" tabIndex={-1} autoComplete="off" />
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
