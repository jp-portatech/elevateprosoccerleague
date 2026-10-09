import type { ReactNode } from 'react'
import type { DivisionId } from '../config/league'
import { useRegistration, type RegistrationKind } from '../registration/context'
import { Icon } from './Icon'

type Variant = 'primary' | 'secondary' | 'light' | 'ice'

interface RegisterButtonProps {
  kind: RegistrationKind
  /** Defaults: team → navy solid, player → white with navy border. */
  variant?: Variant
  division?: DivisionId
  size?: 'sm'
  className?: string
  children?: ReactNode
  /** Runs before the dialog opens, e.g. to close a menu and park focus. */
  onBeforeOpen?: () => void
}

const REGISTER_LABEL: Record<RegistrationKind, string> = {
  team: 'Register a team',
  player: 'Register a player',
}

/** Every team/player CTA on the site opens the same registration dialog through this button. */
export function RegisterButton({ kind, variant, division, size, className, children, onBeforeOpen }: RegisterButtonProps) {
  const { openRegistration } = useRegistration()
  const resolved = variant ?? (kind === 'team' ? 'primary' : 'secondary')
  const classes = ['btn', `btn--${resolved}`, size && `btn--${size}`, className].filter(Boolean).join(' ')
  return (
    <button
      type="button"
      className={classes}
      aria-haspopup="dialog"
      onClick={() => {
        onBeforeOpen?.()
        openRegistration(kind, division)
      }}
    >
      {children ?? REGISTER_LABEL[kind]}
      <Icon name="arrow" className="btn__arrow" />
    </button>
  )
}
