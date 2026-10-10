import { useEffect, useRef, useState } from 'react'
import { gameDays, startDateLabel } from '../config/derived'
import { league } from '../config/league'
import { ContactLine } from './ContactLine'
import { clearDrafts, fetchCheckoutStatus, type CheckoutStatus } from './submitRegistration'
import type { RegistrationKind } from './types'

interface CheckoutReturnDialogProps {
  sessionId: string
  onClose: () => void
  onRetry: (kind: RegistrationKind) => void
}

/** Shown after Stripe redirects back with ?registration=success — confirms payment server-side. */
export function CheckoutReturnDialog({ sessionId, onClose, onRetry }: CheckoutReturnDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [status, setStatus] = useState<CheckoutStatus | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    titleRef.current?.focus()
    let active = true
    fetchCheckoutStatus(sessionId).then((result) => {
      if (!active) return
      setStatus(result)
      if (result.state === 'paid') clearDrafts()
      requestAnimationFrame(() => titleRef.current?.focus())
    })
    return () => {
      active = false
    }
  }, [sessionId])

  const close = () => dialogRef.current?.close()

  let title = 'Confirming your payment…'
  let body = <p>This only takes a moment.</p>
  if (status?.state === 'paid') {
    const who = status.name ?? (status.registrationType === 'team' ? 'your team' : 'your player')
    title = 'You’re registered!'
    body = (
      <>
        <p>
          Payment received for {who}
          {status.division && <> in the {status.division} division</>}.
          {status.registrationType === 'player' &&
            ' ElevatePro will place your player on a team and send your team and season information.'}
        </p>
        {status.email && <p>A confirmation email with your registration details is on its way to {status.email}.</p>}
        <p>
          The season starts {startDateLabel}, with games on {gameDays} at {league.venue.name}.
        </p>
        <ContactLine lead="Questions? Contact ElevatePro" />
      </>
    )
  } else if (status?.state === 'unpaid') {
    title = 'Payment not completed'
    body = (
      <p>Checkout didn’t finish, so you haven’t been charged and the registration isn’t complete yet.</p>
    )
  } else if (status?.state === 'unknown') {
    title = 'We couldn’t confirm your payment'
    body = (
      <>
        <p>If you completed checkout, Stripe will email you a receipt and your registration is recorded with it.</p>
        <ContactLine lead="Didn’t get a receipt? Contact ElevatePro" />
      </>
    )
  }

  const retryKind = status?.state === 'unpaid' ? status.registrationType : null

  return (
    <dialog
      ref={dialogRef}
      className="dialog dialog--compact"
      aria-labelledby="checkout-return-title"
      aria-busy={status === null || undefined}
      onClose={onClose}
    >
      <div className="dialog__header on-dark">
        <div>
          <p className="dialog__eyebrow">{league.name}</p>
          <h2 className="dialog__title" id="checkout-return-title" ref={titleRef} tabIndex={-1}>
            {title}
          </h2>
        </div>
        <button type="button" className="dialog__close" aria-label="Close" onClick={close}>
          <span aria-hidden="true" />
        </button>
      </div>
      <div className="dialog__body checkout-return" aria-live="polite">
        {body}
        <div className="btn-row">
          {retryKind && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                close()
                onRetry(retryKind)
              }}
            >
              Return to registration
            </button>
          )}
          <button type="button" className={retryKind ? 'btn btn--secondary' : 'btn btn--primary'} onClick={close}>
            {status?.state === 'paid' ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </dialog>
  )
}
