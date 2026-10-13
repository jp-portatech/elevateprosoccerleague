import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { DivisionId } from '../config/league'
import { CheckoutReturnDialog } from './CheckoutReturnDialog'
import { RegistrationContext, type RegistrationKind, type RegistrationRequest } from './context'
import { RegistrationDialog } from './RegistrationDialog'
import { readDraft } from './submitRegistration'

const isKind = (value: string | null): value is RegistrationKind => value === 'team' || value === 'player'

/** Reads a Stripe return (?registration=…) from the current URL. */
function readCheckoutReturn() {
  // None while pre-rendering at build time; src/main.tsx draws the page fresh after a Stripe return.
  if (typeof window === 'undefined') return { sessionId: null, cancelledKind: null }
  const params = new URLSearchParams(window.location.search)
  const outcome = params.get('registration')
  const type = params.get('type')
  return {
    sessionId: outcome === 'success' ? params.get('session_id') : null,
    cancelledKind: outcome === 'cancelled' && isKind(type) ? type : null,
  }
}

/**
 * Owns the registration dialog and the post-checkout confirmation. Every
 * "Register a team" / "Register a player" control calls `openRegistration`.
 *
 * URLs it understands:
 *   /#register-team, /#register-player          open the matching form
 *   /?registration=success&session_id=…           Stripe return: confirm payment
 *   /?registration=cancelled&type=team|player     Stripe "back": reopen the form with its draft
 */
export function RegistrationProvider({ children }: { children: ReactNode }) {
  const [stripeReturn] = useState(readCheckoutReturn)
  const [checkoutSessionId, setCheckoutSessionId] = useState(stripeReturn.sessionId)
  // Backing out of Stripe Checkout reopens the form with the visitor's details restored.
  const [request, setRequest] = useState<RegistrationRequest | null>(() =>
    stripeReturn.cancelledKind
      ? { kind: stripeReturn.cancelledKind, draft: readDraft(stripeReturn.cancelledKind), notice: 'checkout-cancelled', id: 1 }
      : null,
  )
  const [open, setOpen] = useState(stripeReturn.cancelledKind !== null)

  const openWith = useCallback((next: Omit<RegistrationRequest, 'id'>) => {
    setRequest((prev) => ({ ...next, id: (prev?.id ?? 0) + 1 }))
    setOpen(true)
  }, [])

  const openRegistration = useCallback(
    (kind: RegistrationKind, division?: DivisionId) => openWith({ kind, division }),
    [openWith],
  )

  const reopenWithDraft = useCallback(
    (kind: RegistrationKind) => openWith({ kind, draft: readDraft(kind) }),
    [openWith],
  )

  // Drop the ?registration=… query once it has been read, so a refresh doesn't repeat it.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('registration')) {
      history.replaceState(null, '', window.location.pathname + window.location.hash)
    }
  }, [])

  // Deep links
  useEffect(() => {
    const openFromHash = () => {
      const match = /^#register-(team|player)$/.exec(window.location.hash)
      if (!match) return
      history.replaceState(null, '', window.location.pathname + window.location.search)
      openRegistration(match[1] as RegistrationKind)
    }
    openFromHash()
    window.addEventListener('hashchange', openFromHash)
    return () => window.removeEventListener('hashchange', openFromHash)
  }, [openRegistration])

  const api = useMemo(() => ({ openRegistration }), [openRegistration])

  return (
    <RegistrationContext.Provider value={api}>
      {children}
      <RegistrationDialog
        request={request}
        open={open}
        onClose={() => setOpen(false)}
        onSwitch={openRegistration}
      />
      {checkoutSessionId && (
        <CheckoutReturnDialog
          sessionId={checkoutSessionId}
          onClose={() => setCheckoutSessionId(null)}
          onRetry={reopenWithDraft}
        />
      )}
    </RegistrationContext.Provider>
  )
}
