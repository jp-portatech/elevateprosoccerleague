import { useEffect, useRef, useState } from 'react'
import { useLocale } from '../i18n/useLocale'
import { localized } from '../i18n/locale'
import { useRegistration, type RegistrationKind } from '../registration/context'
import { Icon } from './Icon'

const COPY = localized({
  en: {
    button: 'Register',
    prompt: 'How would you like to join?',
    choices: {
      team: { title: 'Register a team', detail: 'Bring your complete team' },
      player: { title: 'Register a player', detail: 'No team? We’ll place your player' },
    },
  },
  es: {
    button: 'Inscríbete',
    prompt: '¿Cómo quieres unirte?',
    choices: {
      team: { title: 'Inscribir equipo', detail: 'Trae a tu equipo completo' },
      player: { title: 'Inscribir jugador', detail: '¿Sin equipo? Te asignamos uno' },
    },
  },
})

const CHOICES: Array<{ kind: RegistrationKind; icon: 'team' | 'player' }> = [
  { kind: 'team', icon: 'team' },
  { kind: 'player', icon: 'player' },
]

/** Header "Register" disclosure: lets visitors choose team or individual player registration. */
export function RegisterMenu() {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { openRegistration } = useRegistration()
  const t = COPY[useLocale()]

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const choose = (kind: RegistrationKind) => {
    // Park focus on the toggle so the dialog returns focus somewhere that still exists.
    buttonRef.current?.focus()
    setOpen(false)
    openRegistration(kind)
  }

  return (
    <div
      className="register-menu"
      ref={wrapperRef}
      onBlur={(e) => {
        if (open && !wrapperRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className="btn btn--primary btn--sm register-menu__toggle"
        aria-expanded={open}
        aria-controls="register-menu-panel"
        onClick={() => setOpen((o) => !o)}
      >
        {t.button}
        <Icon name="arrow" className="register-menu__chevron" />
      </button>
      <div className="register-menu__panel" id="register-menu-panel" hidden={!open} tabIndex={-1}>
        <p className="register-menu__label">{t.prompt}</p>
        <ul className="register-menu__list">
          {CHOICES.map((choice) => (
            <li key={choice.kind}>
              <button
                type="button"
                className="register-menu__option"
                aria-haspopup="dialog"
                onClick={() => choose(choice.kind)}
              >
                <Icon name={choice.icon} className="register-menu__icon" />
                <span>
                  <span className="register-menu__title">{t.choices[choice.kind].title}</span>
                  <span className="register-menu__detail">{t.choices[choice.kind].detail}</span>
                </span>
                <Icon name="arrow" className="register-menu__arrow" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
