import { useEffect, useRef, useState, type SubmitEvent } from 'react'
import { league } from '../config/league'
import { FormField } from '../registration/FormField'
import { fieldId, type FormErrors, type FormValues } from '../registration/forms'
import { inquiryFields, validateInquiry, type InquiryType } from './inquiryForms'
import { submitInquiry, type InquiryResult } from './submitInquiry'

const COPY: Record<
  InquiryType,
  { title: string; intro: string; submit: string; clarification: string; success: [string, string, string] }
> = {
  individual_player: {
    title: 'Let’s Find Your Child a Team',
    intro: 'Share a few details and we’ll help you understand individual registration, pricing and team placement.',
    submit: 'Request Player Information',
    clarification: 'This is an information request. Registration and team placement are confirmed separately.',
    success: [
      'Your information request has been received.',
      'We’ll follow up about individual registration and team placement.',
      'This does not reserve a spot.',
    ],
  },
  team: {
    title: 'Bring Your Team to ElevatePro',
    intro: 'Tell us about your team so we can help with division eligibility, registration and pricing.',
    submit: 'Request Team Information',
    clarification: 'This is an information request. Your roster and team registration are completed separately.',
    success: [
      'Your team information request has been received.',
      'We’ll follow up about registration, division eligibility and pricing.',
      'This does not complete team registration.',
    ],
  },
}

const FAILURES: Record<Extract<InquiryResult, { status: 'error' }>['reason'], { title: string; text: string }> = {
  network: { title: 'Your request wasn’t sent', text: 'We couldn’t reach our server. Check your connection and try again.' },
  server: { title: 'Your request wasn’t sent', text: 'Something went wrong on our side. Your details are still here, so you can try again.' },
  'not-connected': {
    title: 'Information requests are not connected yet',
    text: 'Your details weren’t sent. Please try again later.',
  },
  'too-fast': { title: 'Please check your details', text: 'Then send your request again.' },
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`

interface InquiryDialogProps {
  type: InquiryType
  open: boolean
  /** The CTA that opened the dialog; focus returns to it on close. */
  opener: HTMLElement | null
  onClose: () => void
  utm: Record<string, string>
}

/**
 * Native <dialog> opened with showModal(): the page behind becomes inert (no clicks, no focus),
 * Escape closes it, and clicking the backdrop does nothing. Tab wraps inside the dialog.
 */
export function InquiryDialog({ type, open, opener, onClose, utm }: InquiryDialogProps) {
  const copy = COPY[type]
  const fields = inquiryFields[type]
  const prefix = `inquiry-${type}`
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const successRef = useRef<HTMLParagraphElement>(null)
  const alertRef = useRef<HTMLDivElement>(null)
  const trapRef = useRef<HTMLInputElement>(null)
  const startedAt = useRef<number | null>(null)
  const submissionId = useRef<string | null>(null)

  const [values, setValues] = useState<FormValues>(() => Object.fromEntries(fields.map((f) => [f.name, ''])))
  const [errors, setErrors] = useState<FormErrors>({})
  const [attempted, setAttempted] = useState(false)
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<Extract<InquiryResult, { status: 'error' }>['reason'] | null>(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // Start on the heading: it names the dialog, and phones don't open the keyboard straight away.
      requestAnimationFrame(() => (sent ? successRef.current : titleRef.current)?.focus())
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open, sent])

  // Keep Tab and Shift+Tab inside the dialog.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null && !el.closest('[aria-hidden="true"]'),
      )
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || active === titleRef.current || active === successRef.current || active === dialog)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }
    dialog.addEventListener('keydown', onKeyDown)
    return () => dialog.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleClose = () => {
    onClose()
    if (opener?.isConnected) opener.focus()
  }

  const handleChange = (name: string, value: string) => {
    startedAt.current ??= Date.now()
    const next = { ...values, [name]: value }
    setValues(next)
    if (Object.keys(errors).length > 0) {
      const current = validateInquiry(type, next)
      setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([field]) => current[field])))
    }
    if (failure) setFailure(null)
  }

  const handleBlur = (name: string) => {
    if (!attempted) return
    const message = validateInquiry(type, values)[name]
    setErrors(({ [name]: _previous, ...rest }) => (message ? { ...rest, [name]: message } : rest))
  }

  const focusFirstError = (found: FormErrors) => {
    const first = fields.find((f) => found[f.name])
    if (!first) return
    requestAnimationFrame(() => {
      const control = document.getElementById(fieldId(prefix, first.name))
      // Bring the whole field (label and error) into view below the pinned header, then focus it.
      control?.closest('.field')?.scrollIntoView({ block: 'start' })
      control?.focus({ preventScroll: true })
    })
  }

  const send = async () => {
    if (pending) return
    const found = validateInquiry(type, values)
    setAttempted(true)
    setFailure(null)
    if (Object.keys(found).length > 0) {
      setErrors(found)
      focusFirstError(found)
      return
    }
    setErrors({})
    setPending(true)
    submissionId.current ??= newId() // the same id on retries, so a request is never recorded twice
    const result = await submitInquiry(type, values, {
      page: window.location.pathname.replace(/\.html$/, ''),
      utm,
      submissionId: submissionId.current,
      elapsedMs: startedAt.current === null ? 0 : Date.now() - startedAt.current,
      trap: trapRef.current?.value ?? '',
    })
    setPending(false)
    if (result.status === 'sent') {
      setSent(true)
      requestAnimationFrame(() => successRef.current?.focus())
    } else if (result.status === 'invalid') {
      setErrors(result.errors)
      focusFirstError(result.errors)
    } else {
      setFailure(result.reason)
      requestAnimationFrame(() => alertRef.current?.focus())
    }
  }

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    void send()
  }

  const titleId = `${prefix}-title`
  const introId = `${prefix}-intro`

  return (
    <dialog
      ref={dialogRef}
      className="inquiry"
      aria-labelledby={titleId}
      aria-describedby={introId}
      onClose={handleClose}
    >
      <div className="inquiry__head">
        <h2 className="inquiry__title" id={titleId} ref={titleRef} tabIndex={-1}>
          {copy.title}
        </h2>
        <button type="button" className="inquiry__close" onClick={() => dialogRef.current?.close()}>
          <span aria-hidden="true" className="inquiry__close-x" />
          <span className="visually-hidden">Close</span>
        </button>
      </div>

      {sent ? (
        <div className="inquiry__success" id={introId}>
          <p className="inquiry__success-title" ref={successRef} tabIndex={-1}>
            {copy.success[0]}
          </p>
          <p>{copy.success[1]}</p>
          <p className="inquiry__success-note">{copy.success[2]}</p>
          <button type="button" className="lp-btn lp-btn--block" onClick={() => dialogRef.current?.close()}>
            Close
          </button>
        </div>
      ) : (
        <form className="inquiry__form" noValidate onSubmit={submit} aria-busy={pending || undefined}>
          <p className="inquiry__intro" id={introId}>
            {copy.intro}
          </p>
          <p className="inquiry__required">All fields are required.</p>

          <div className="form-grid">
            {fields.map((field) => (
              <FormField
                key={field.name}
                field={field}
                idPrefix={prefix}
                value={values[field.name]}
                error={errors[field.name]}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            ))}
          </div>

          {/* Spam trap: hidden from people and screen readers; bots fill it in. */}
          <div className="inquiry__trap" aria-hidden="true">
            <label htmlFor={`${prefix}-leave-empty`}>Leave this empty</label>
            <input id={`${prefix}-leave-empty`} ref={trapRef} type="text" tabIndex={-1} autoComplete="off" />
          </div>

          {failure && (
            <div className="inquiry__alert" ref={alertRef} tabIndex={-1} role="alert">
              <p className="inquiry__alert-title">{FAILURES[failure].title}</p>
              <p>{FAILURES[failure].text}</p>
              {failure !== 'too-fast' && league.contact.email && (
                <p>
                  You can also reach {league.shortName} at {league.contact.email}
                  {league.contact.phones[0] ? ` or ${league.contact.phones[0]}` : ''}.
                </p>
              )}
              {failure !== 'too-fast' && (
                <button type="button" className="inquiry__retry" onClick={() => void send()} disabled={pending}>
                  Try again
                </button>
              )}
            </div>
          )}

          <button type="submit" className="lp-btn lp-btn--block" aria-disabled={pending || undefined}>
            {pending ? 'Sending…' : copy.submit}
          </button>
          <p className="inquiry__note">{copy.clarification}</p>

          <details className="inquiry__privacy">
            <summary>How we use your information</summary>
            <p>
              {league.shortName} uses these details only to follow up about this request. We don’t sell your
              information, and this form doesn’t sign you up for promotional emails. Our full privacy policy is at
              elevateprosoccer.com/privacy.
            </p>
          </details>
        </form>
      )}
    </dialog>
  )
}
