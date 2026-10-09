import { createContext, useContext } from 'react'
import type { DivisionId } from '../config/league'
import type { FormValues } from './forms'
import type { RegistrationKind } from './types'

export type { RegistrationKind }

export interface RegistrationRequest {
  kind: RegistrationKind
  /** Pre-selects a division, e.g. when opened from a division card. */
  division?: DivisionId
  /** Form values to restore, e.g. after the visitor backs out of Stripe Checkout. */
  draft?: FormValues
  /** Shown at the top of the form when set. */
  notice?: 'checkout-cancelled'
  /** Increments on every open so repeat requests are distinguishable. */
  id: number
}

export interface RegistrationApi {
  openRegistration: (kind: RegistrationKind, division?: DivisionId) => void
}

export const RegistrationContext = createContext<RegistrationApi | null>(null)

export function useRegistration(): RegistrationApi {
  const api = useContext(RegistrationContext)
  if (!api) throw new Error('useRegistration must be used inside <RegistrationProvider>')
  return api
}
