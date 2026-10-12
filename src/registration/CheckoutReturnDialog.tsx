import { useEffect, useRef, useState } from 'react'
import { gameDays, startDateLabel } from '../config/derived'
import { league } from '../config/league'
import { useLocale } from '../i18n/useLocale'
import { localized } from '../i18n/locale'
import { ContactLine } from './ContactLine'
import { clearDrafts, fetchCheckoutStatus, type CheckoutStatus } from './submitRegistration'
import type { RegistrationKind } from './types'

interface CheckoutReturnDialogProps {
  sessionId: string
  onClose: () => void
  onRetry: (kind: RegistrationKind) => void
}

const { venue } = league

const COPY = localized({
  en: {
    confirming: 'Confirming your payment…',
    moment: 'This only takes a moment.',
    registered: 'You’re registered!',
    yourTeam: 'your team',
    yourPlayer: 'your player',
    paidFor: (who: string, division: string | null) =>
      `Payment received for ${who}${division ? ` in the ${division} division` : ''}.`,
    placement: ' ElevatePro will place your player on a team and send your team and season information.',
    emailOnWay: (email: string) => `A confirmation email with your registration details is on its way to ${email}.`,
    season: `The season starts ${startDateLabel.en}, with games on ${gameDays.en} at ${venue.name}.`,
    questions: 'Questions? Contact ElevatePro',
    unpaidTitle: 'Payment not completed',
    unpaidText: 'Checkout didn’t finish, so you haven’t been charged and the registration isn’t complete yet.',
    unknownTitle: 'We couldn’t confirm your payment',
    unknownText: 'If you completed checkout, Stripe will email you a receipt and your registration is recorded with it.',
    noReceipt: 'Didn’t get a receipt? Contact ElevatePro',
    retry: 'Return to registration',
    done: 'Done',
    close: 'Close',
  },
  es: {
    confirming: 'Confirmando tu pago…',
    moment: 'Solo tomará un momento.',
    registered: '¡Inscripción completa!',
    yourTeam: 'tu equipo',
    yourPlayer: 'tu jugador',
    paidFor: (who: string, division: string | null) =>
      `Recibimos el pago de ${who}${division ? ` en la división ${division}` : ''}.`,
    placement: ' ElevatePro le asignará un equipo a tu jugador y te enviará la información del equipo y de la temporada.',
    emailOnWay: (email: string) => `Te enviamos un correo de confirmación con los datos de tu inscripción a ${email}.`,
    season: `La temporada inicia el ${startDateLabel.es}, con partidos los ${gameDays.es} en ${venue.name}.`,
    questions: '¿Preguntas? Comunícate con ElevatePro',
    unpaidTitle: 'El pago no se completó',
    unpaidText: 'El pago no terminó, así que no se te hizo ningún cargo y la inscripción aún no está completa.',
    unknownTitle: 'No pudimos confirmar tu pago',
    unknownText: 'Si completaste el pago, Stripe te enviará un recibo por correo y tu inscripción queda registrada con él.',
    noReceipt: '¿No te llegó el recibo? Comunícate con ElevatePro',
    retry: 'Volver a la inscripción',
    done: 'Listo',
    close: 'Cerrar',
  },
})

/** Shown after Stripe redirects back with ?registration=success — confirms payment server-side. */
export function CheckoutReturnDialog({ sessionId, onClose, onRetry }: CheckoutReturnDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [status, setStatus] = useState<CheckoutStatus | null>(null)
  const t = COPY[useLocale()]

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

  let title = t.confirming
  let body = <p>{t.moment}</p>
  if (status?.state === 'paid') {
    const who = status.name ?? (status.registrationType === 'team' ? t.yourTeam : t.yourPlayer)
    title = t.registered
    body = (
      <>
        <p>
          {t.paidFor(who, status.division)}
          {status.registrationType === 'player' && t.placement}
        </p>
        {status.email && <p>{t.emailOnWay(status.email)}</p>}
        <p>{t.season}</p>
        <ContactLine lead={t.questions} />
      </>
    )
  } else if (status?.state === 'unpaid') {
    title = t.unpaidTitle
    body = <p>{t.unpaidText}</p>
  } else if (status?.state === 'unknown') {
    title = t.unknownTitle
    body = (
      <>
        <p>{t.unknownText}</p>
        <ContactLine lead={t.noReceipt} />
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
        <button type="button" className="dialog__close" aria-label={t.close} onClick={close}>
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
              {t.retry}
            </button>
          )}
          <button type="button" className={retryKind ? 'btn btn--secondary' : 'btn btn--primary'} onClick={close}>
            {status?.state === 'paid' ? t.done : t.close}
          </button>
        </div>
      </div>
    </dialog>
  )
}
