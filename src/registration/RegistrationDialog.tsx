import { useEffect, useRef } from 'react'
import { useLocale } from '../i18n/useLocale'
import { localized } from '../i18n/locale'
import type { RegistrationKind, RegistrationRequest } from './context'
import { RegistrationForm } from './RegistrationForm'
import './registration.css'

interface RegistrationDialogProps {
  request: RegistrationRequest | null
  open: boolean
  onClose: () => void
  onSwitch: (kind: RegistrationKind) => void
}

const COPY = localized({
  en: {
    close: 'Close registration',
    team: {
      title: 'Register a team',
      intro: 'Register your complete club, academy, neighborhood or independent team for the ElevatePro season.',
    },
    player: {
      title: 'Register a player',
      intro: 'No team? No problem. Register your player individually and ElevatePro will place them on a team.',
    },
  },
  es: {
    close: 'Cerrar inscripción',
    team: {
      title: 'Inscribir un equipo',
      intro:
        'Inscribe a tu equipo completo, ya sea de club, de academia, del barrio o independiente, en la temporada de ElevatePro.',
    },
    player: {
      title: 'Inscribir a un jugador',
      intro:
        '¿No tienes equipo? No hay problema. Inscribe a tu jugador de forma individual y ElevatePro le asignará un equipo.',
    },
  },
})

/**
 * Native <dialog> opened with showModal(): the browser traps focus, makes the page
 * behind it inert and closes it on Escape. We move focus to the title on open and
 * return it to the triggering control on close.
 */
export function RegistrationDialog({ request, open, onClose, onSwitch }: RegistrationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const kind = request?.kind ?? 'team'
  const t = COPY[useLocale()]

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      if (!dialog.open) {
        returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
        dialog.showModal()
      }
      bodyRef.current?.scrollTo({ top: 0 })
      titleRef.current?.focus()
    } else if (dialog.open) {
      dialog.close()
    }
  }, [open, request])

  const handleClose = () => {
    onClose()
    const target = returnFocusRef.current
    if (target?.isConnected) target.focus()
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog motion-dialog"
      aria-labelledby="registration-title"
      aria-describedby="registration-intro"
      onClose={handleClose}
    >
      <div className="dialog__header on-dark">
        <div>
          <p className="dialog__eyebrow">ElevatePro Soccer League</p>
          <h2 className="dialog__title" id="registration-title" ref={titleRef} tabIndex={-1}>
            {t[kind].title}
          </h2>
        </div>
        <button
          type="button"
          className="dialog__close"
          aria-label={t.close}
          onClick={() => dialogRef.current?.close()}
        >
          <span aria-hidden="true" />
        </button>
      </div>
      <div className="dialog__body" ref={bodyRef}>
        <p className="dialog__intro" id="registration-intro">
          {t[kind].intro}
        </p>
        {(['team', 'player'] as const).map((k) => (
          <RegistrationForm
            key={k}
            kind={k}
            request={request}
            hidden={kind !== k}
            onSwitch={onSwitch}
          />
        ))}
      </div>
    </dialog>
  )
}
