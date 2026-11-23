import { useRef, useState, useSyncExternalStore, type SubmitEvent } from 'react'
import { ageOn } from '../admin/model'
import { Icon } from '../components/Icon'
import { SectionHeading } from '../components/SectionHeading'
import { league } from '../config/league'
import { logo } from '../content/images'
import { StaticLocaleProvider } from '../i18n/LocaleProvider'
import { ContactLine } from '../registration/ContactLine'
import { FormField } from '../registration/FormField'
import { fieldId, type FieldDef, type FormErrors, type FormValues } from '../registration/forms'
import { ChoiceField } from '../winter-survey/ChoiceField'
import type { ChoiceQuestion } from '../winter-survey/surveyForm'
import {
  AGREEMENT_ERROR_ORDER,
  AGREEMENTS,
  CURRENT_AGREEMENT,
  EMERGENCY_FIELDS,
  emptyAgreement,
  reusedSignatureRole,
  SIGNER_NAME_FIELD,
  signerRole,
  validateAgreement,
  type AgreementInput,
  type MediaPermission,
  type SignerRole,
} from './agreementForm'
import { AgreementSections } from './AgreementText'
import { SignaturePad } from './SignaturePad'
import { submitWaiver, type WaiverResult } from './submitWaiver'
import {
  cleanSignature,
  CURRENT_WAIVER,
  emptyWaiver,
  validateWaiver,
  WAIVER_FIELD_NAMES,
  WAIVER_FIELDS,
  WAIVERS,
  type Signature,
  type SignatureRole,
  type Signatures,
} from './waiverForm'
import { WaiverMinorsClause, WaiverTerms } from './WaiverText'
// The page frame (header, intro band, thank-you, footer) and the choice buttons are shared with
// the winter survey.
import '../registration/registration.css'
import '../winter-survey/winter-survey.css'
import './waiver.css'

const ID_PREFIX = 'waiver'
const YEAR = new Date().getFullYear()
const WAIVER = WAIVERS[CURRENT_WAIVER]
const AGREEMENT = AGREEMENTS[CURRENT_AGREEMENT]
/** Kept when a parent signs for another player right after (a brother or sister). */
const FAMILY_FIELDS = ['email', 'eveningPhone', 'address', 'city', 'state', 'zip']
const TARGET_IDS: Record<string, string> = {
  participantSignature: `${ID_PREFIX}-signature-participant`,
  guardianSignature: `${ID_PREFIX}-signature-guardian`,
  agreementSignature: `${ID_PREFIX}-signature-agreement`,
}
const ERROR_ORDER = [
  ...WAIVER_FIELD_NAMES,
  'emergencyContact',
  'emergencyPhone',
  'participantSignature',
  'guardianSignature',
  ...AGREEMENT_ERROR_ORDER.filter((k) => !k.startsWith('emergency')),
  'consent',
]

const en = (text: string) => ({ en: text, es: text })
const checkbox = (name: string, label: string): FieldDef => ({ name, label: en(label), type: 'checkbox', required: true })
const CONSENT_FIELD = checkbox(
  'consent',
  'I agree to sign these documents electronically. My electronic signature counts the same as signing them on paper.',
)
const ROLE_FIELDS: Record<SignerRole, FieldDef> = {
  guardian: checkbox('roleAcknowledged', AGREEMENT.page2.signature.roles.guardian),
  adult: checkbox('roleAcknowledged', AGREEMENT.page2.signature.roles.adult),
}
const MEDIA_QUESTION: ChoiceQuestion = {
  kind: 'choice',
  name: 'mediaPermission',
  label: AGREEMENT.page1.media.heading,
  hint: AGREEMENT.page1.media.note,
  required: false,
  multiple: false,
  options: [
    { value: 'yes', label: AGREEMENT.page1.media.yes },
    { value: 'no', label: AGREEMENT.page1.media.no },
  ],
}

const COPY = {
  skip: 'Skip to the form',
  audience: 'Player waivers',
  program: 'Elevate Pro Winter Training',
  title: 'Player waivers',
  intro:
    'Two documents, one form: the facility’s waiver and ElevatePro’s player agreement. Fill in the player’s details once, read, and sign. It takes about 5 minutes. Please complete one per player, before their first session.',
  formLabel: 'Facility waiver and ElevatePro player agreement',
  required: 'All fields are required unless marked optional.',
  step: (n: number) => `Step ${n} of 3`,
  detailsTitle: 'Player details',
  emergencyTitle: 'Emergency contact',
  emergencyNote: 'For ElevatePro’s agreement in step 3.',
  waiverTitle: 'Facility waiver',
  agreementTitle: 'ElevatePro agreement',
  agreementFor: (name: string, age: number | null) =>
    `For ${name || 'the player in step 1'}${age !== null ? `, age ${age}` : ''}. The player’s details and contact phone come from step 1.`,
  page: (n: number) => `Page ${n}`,
  contactPhone: (phone: string) => `${AGREEMENT.page2.signature.labels.contactPhone}: ${phone || 'from step 1'}`,
  signWith: (line: string) => `Signed with your ${line} from step 2:`,
  signFirst: (line: string) => `Sign the ${line} line in step 2 and it will sign this agreement too.`,
  signSeparately: 'Sign separately instead',
  useStep2: 'Use my signature from step 2 instead',
  date: 'Date',
  dateNote: 'Filled in automatically',
  guardianNotNeeded: 'Only needed for participants under 18.',
  problems: (n: number) => (n === 1 ? 'There is 1 problem' : `There are ${n} problems`),
  submit: 'Sign and submit',
  sending: 'Sending…',
  notSent: 'Your waivers weren’t sent',
  errors: {
    network: 'We couldn’t reach the server. Check your connection and try again.',
    send: 'Something went wrong on our end, so nothing was saved. Please try again in a moment.',
    'too-fast': 'That was quick! Please check the form and press Sign and submit again.',
  } satisfies Record<Extract<WaiverResult, { status: 'error' }>['reason'], string>,
  contactUs: 'Or reach Elevate Pro',
  thanksTitle: 'Thank you!',
  thanksText: (name: string) => `We received the signed facility waiver and ElevatePro agreement for ${name}.`,
  confirmation: (email: string) => `A copy of both is on its way to ${email}.`,
  another: 'Sign for another player',
  legal: 'Privacy policy: elevateprosoccer.com/privacy',
}

const SIGNATURE_LINE: Record<SignerRole, string> = { guardian: 'Parent/Guardian Signature', adult: 'Signature' }

const newSubmissionId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`

const subscribeNever = () => () => {}
const todayLabel = () => new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date())

/** Signatures as the server will read them (typed names trimmed). */
const cleaned = (s: Signatures): Signatures => ({
  participant: cleanSignature(s.participant),
  guardian: cleanSignature(s.guardian),
})
const cleanedAgreement = (a: AgreementInput): AgreementInput => ({ ...a, ownSignature: cleanSignature(a.ownSignature) })

function SignaturePreview({ signature }: { signature: Signature }) {
  return signature.kind === 'drawn' ? (
    <img className="agreement-reuse__image" src={signature.image} alt="Your signature" />
  ) : (
    <span className="agreement-reuse__typed">{signature.name}</span>
  )
}

/** Unlisted waiver page (/waiver): the facility's waiver and ElevatePro's agreement, one per player. */
export function WaiverPage() {
  const [values, setValues] = useState<FormValues>(emptyWaiver)
  const [signatures, setSignatures] = useState<Signatures>({ participant: null, guardian: null })
  const [agreement, setAgreement] = useState<AgreementInput>(emptyAgreement)
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

  const role = signerRole(values.dob)
  const minor = role === 'guardian'
  const reused = signatures[reusedSignatureRole(role)]
  const age = /^\d{4}-\d{2}-\d{2}$/.test(values.dob) ? ageOn(values.dob) : null

  const check = (v: FormValues, s: Signatures, a: AgreementInput, c: boolean): FormErrors => ({
    ...validateWaiver(v, cleaned(s), c),
    ...validateAgreement(v, cleaned(s), cleanedAgreement(a)),
  })

  /** After a failed submit, errors clear as soon as they're fixed. */
  const recheck = (v: FormValues, s: Signatures, a: AgreementInput, c: boolean) => {
    startedAt.current ??= Date.now() // spam check: time from first answer to Submit
    if (Object.keys(errors).length > 0) {
      const current = check(v, s, a, c)
      setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([key]) => current[key])))
    }
    if (failure) setFailure(null)
  }

  const updateAgreement = (patch: Partial<AgreementInput>) => {
    const next = { ...agreement, ...patch }
    setAgreement(next)
    recheck(values, signatures, next, consent)
  }

  const handleChange = (name: string, value: string) => {
    if (name === 'consent') {
      setConsent(value === 'yes')
      return recheck(values, signatures, agreement, value === 'yes')
    }
    if (name === 'roleAcknowledged') return updateAgreement({ roleAcknowledged: value === 'yes' })
    if (name === 'emergencyContact' || name === 'emergencyPhone' || name === 'signerName') return updateAgreement({ [name]: value })
    const next = { ...values, [name]: value }
    setValues(next)
    // A new birth date can change who signs the agreement, and so the statement they confirm.
    if (name === 'dob' && signerRole(value) !== role) {
      const nextAgreement = { ...agreement, roleAcknowledged: false }
      setAgreement(nextAgreement)
      return recheck(next, signatures, nextAgreement, consent)
    }
    recheck(next, signatures, agreement, consent)
  }

  const handleSignature = (who: SignatureRole, value: Signature | null) => {
    const next = { ...signatures, [who]: value }
    setSignatures(next)
    recheck(values, next, agreement, consent)
  }

  const handleBlur = (name: string) => {
    if (!attempted) return
    const message = check(values, signatures, agreement, consent)[name]
    setErrors(({ [name]: _previous, ...rest }) => (message ? { ...rest, [name]: message } : rest))
  }

  const showErrors = (found: FormErrors) => {
    setErrors(found)
    requestAnimationFrame(() => summaryRef.current?.focus())
  }

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return
    const found = check(values, signatures, agreement, consent)
    setAttempted(true)
    setFailure(null)
    if (Object.keys(found).length > 0) return showErrors(found)
    setErrors({})

    setPending(true)
    submissionId.current ??= newSubmissionId() // same id on retries, so nothing is saved twice
    const result = await submitWaiver(values, cleaned(signatures), cleanedAgreement(agreement), consent, {
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

  /** A fresh form for a brother or sister: the family's contact details, address and emergency contact stay. */
  const startAnother = () => {
    const fresh = emptyWaiver()
    for (const name of FAMILY_FIELDS) fresh[name] = values[name]
    setValues(fresh)
    setSignatures({ participant: null, guardian: null })
    setAgreement({
      ...emptyAgreement(),
      emergencyContact: agreement.emergencyContact,
      emergencyPhone: agreement.emergencyPhone,
      signerName: agreement.signerName,
    })
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

  const errorKeys = ERROR_ORDER.filter((key) => errors[key])
  const targetId = (key: string) => TARGET_IDS[key] ?? fieldId(ID_PREFIX, key)
  const agreementValues: FormValues = {
    emergencyContact: agreement.emergencyContact,
    emergencyPhone: agreement.emergencyPhone,
    signerName: agreement.signerName,
  }

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

                {/* ---------- Step 1: details, asked once for both documents ---------- */}
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
                  <h3 className="waiver-subheading">{COPY.emergencyTitle}</h3>
                  <p className="field__hint waiver-subheading__note">{COPY.emergencyNote}</p>
                  <div className="waiver-fields">
                    {EMERGENCY_FIELDS.map((field) => (
                      <div className="waiver-fields__item waiver-fields__item--3" key={field.name}>
                        <FormField
                          field={field}
                          idPrefix={ID_PREFIX}
                          value={agreementValues[field.name]}
                          error={errors[field.name]}
                          onChange={handleChange}
                          onBlur={handleBlur}
                        />
                      </div>
                    ))}
                  </div>
                </section>

                {/* ---------- Step 2: the facility's waiver (unchanged) ---------- */}
                <section className="survey-section" aria-labelledby="waiver-sign-title">
                  <SectionHeading id="waiver-sign-title" eyebrow={COPY.step(2)} className="survey-section__heading">
                    {COPY.waiverTitle}
                  </SectionHeading>

                  <div className="waiver-terms">
                    <h3 className="waiver-terms__title">{WAIVER.title}</h3>
                    <WaiverTerms waiver={WAIVER} />
                  </div>

                  <div className="waiver-sign">
                    <SignaturePad
                      id={TARGET_IDS.participantSignature}
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
                      id={TARGET_IDS.guardianSignature}
                      label="Parent/Guardian Signature"
                      note={minor ? undefined : COPY.guardianNotNeeded}
                      required={minor}
                      value={signatures.guardian}
                      error={errors.guardianSignature}
                      onChange={(v) => handleSignature('guardian', v)}
                    />
                    {dateLine(Boolean(signatures.guardian))}
                  </div>
                </section>

                {/* ---------- Step 3: ElevatePro's agreement, only what the waiver didn't ask ---------- */}
                <section className="survey-section" aria-labelledby="waiver-agreement-title">
                  <SectionHeading id="waiver-agreement-title" eyebrow={COPY.step(3)} className="survey-section__heading">
                    {COPY.agreementTitle}
                  </SectionHeading>

                  <div className="waiver-terms agreement-terms">
                    <p className="agreement-terms__brand">{AGREEMENT.brand}</p>
                    <h3 className="waiver-terms__title">{AGREEMENT.page1.title}</h3>
                    <p className="agreement-terms__for">{COPY.agreementFor(values.name, age)}</p>
                    <p className="agreement-terms__page">{COPY.page(1)}</p>
                    <AgreementSections sections={AGREEMENT.page1.sections} role={role} />
                  </div>

                  <div className="agreement-media">
                    <ChoiceField
                      question={MEDIA_QUESTION}
                      idPrefix={ID_PREFIX}
                      value={agreement.mediaPermission}
                      onChange={(_, v) => updateAgreement({ mediaPermission: v as MediaPermission })}
                      onBlur={() => {}}
                    />
                  </div>

                  <div className="waiver-terms agreement-terms">
                    <h3 className="waiver-terms__title">{AGREEMENT.page2.title}</h3>
                    <p className="agreement-terms__page">{COPY.page(2)}</p>
                    <AgreementSections sections={AGREEMENT.page2.sections} role={role} />
                  </div>

                  <div className="agreement-sign">
                    <h4 className="agreement-section__heading">{AGREEMENT.page2.signature.heading}</h4>
                    <p>{AGREEMENT.page2.signature.agreement}</p>
                    <FormField
                      field={ROLE_FIELDS[role]}
                      idPrefix={ID_PREFIX}
                      value={agreement.roleAcknowledged ? 'yes' : ''}
                      error={errors.roleAcknowledged}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    {minor && (
                      <FormField
                        field={SIGNER_NAME_FIELD}
                        idPrefix={ID_PREFIX}
                        value={agreement.signerName}
                        error={errors.signerName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      />
                    )}
                    <p className="agreement-sign__phone">{COPY.contactPhone(values.eveningPhone)}</p>

                    <div className="waiver-sign">
                      {agreement.reuseSignature ? (
                        <div
                          className={['agreement-reuse', errors.agreementSignature && 'agreement-reuse--error'].filter(Boolean).join(' ')}
                          id={TARGET_IDS.agreementSignature}
                          tabIndex={-1}
                        >
                          <p className="field__label">{AGREEMENT.page2.signature.labels.signature}</p>
                          {errors.agreementSignature && (
                            <p className="field__error">
                              <span className="visually-hidden">Error: </span>
                              {errors.agreementSignature}
                            </p>
                          )}
                          {reused ? (
                            <>
                              <p className="field__hint">{COPY.signWith(SIGNATURE_LINE[role])}</p>
                              <div className="agreement-reuse__box">
                                <SignaturePreview signature={reused} />
                              </div>
                            </>
                          ) : (
                            <p className="agreement-reuse__box agreement-reuse__box--empty">{COPY.signFirst(SIGNATURE_LINE[role])}</p>
                          )}
                          <button type="button" className="signature__action" onClick={() => updateAgreement({ reuseSignature: false, ownSignature: null })}>
                            {COPY.signSeparately}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <SignaturePad
                            id={TARGET_IDS.agreementSignature}
                            label={AGREEMENT.page2.signature.labels.signature}
                            required
                            value={agreement.ownSignature}
                            error={errors.agreementSignature}
                            onChange={(v) => updateAgreement({ ownSignature: v })}
                          />
                          <button type="button" className="signature__action" onClick={() => updateAgreement({ reuseSignature: true, ownSignature: null })}>
                            {COPY.useStep2}
                          </button>
                        </div>
                      )}
                      {dateLine(Boolean(agreement.reuseSignature ? reused : agreement.ownSignature))}
                    </div>
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
