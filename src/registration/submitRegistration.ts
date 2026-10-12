/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  REGISTRATION SUBMISSION — the browser's single integration point.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * With `league.registration.onlinePayments` on, submitting a form POSTs it to
 * /api/register (server/checkout.ts), which re-validates it and returns a Stripe
 * Checkout URL. We then hand the visitor to Stripe to pay. Stripe sends them back to
 * /?registration=success&session_id=… or /?registration=cancelled&type=… .
 *
 * With it off, nothing is sent and the form tells the visitor so.
 */
import { onlinePayments } from '../config/derived'
import type { Locale } from '../i18n/locale'
import type { FormErrors, FormValues } from './forms'
import type { RegistrationKind } from './types'

const CHECKOUT_ENDPOINT = '/api/register'
const STATUS_ENDPOINT = '/api/registration-status'

export type SubmitResult =
  | { status: 'not-connected' }
  | { status: 'redirecting' }
  | { status: 'invalid'; errors: FormErrors }
  | { status: 'error'; reason: 'network' | 'not-configured' | 'checkout' }

/** `locale` makes the server answer (and Stripe Checkout show) in the visitor's language. */
export async function submitRegistration(kind: RegistrationKind, values: FormValues, locale: Locale): Promise<SubmitResult> {
  if (!onlinePayments) return { status: 'not-connected' }

  let response: Response
  try {
    response = await fetch(CHECKOUT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ registrationType: kind, locale, fields: values }),
    })
  } catch {
    return { status: 'error', reason: 'network' }
  }

  const data = (await response.json().catch(() => null)) as { url?: string; error?: string; fields?: FormErrors } | null
  if (response.ok && data?.url) {
    saveDraft(kind, values)
    window.location.assign(data.url)
    return { status: 'redirecting' }
  }
  if (data?.error === 'invalid-fields' && data.fields) return { status: 'invalid', errors: data.fields }
  if (data?.error === 'not-configured') return { status: 'error', reason: 'not-configured' }
  return { status: 'error', reason: 'checkout' }
}

// ---- Draft kept in this tab while the visitor is on Stripe, so "Back" restores the form ----

const draftKey = (kind: RegistrationKind) => `elevatepro:registration-draft:${kind}`

function saveDraft(kind: RegistrationKind, values: FormValues) {
  try {
    sessionStorage.setItem(draftKey(kind), JSON.stringify(values))
  } catch {
    // Storage unavailable (private mode, blocked): the form just starts empty on return.
  }
}

export function readDraft(kind: RegistrationKind): FormValues | undefined {
  try {
    const raw = sessionStorage.getItem(draftKey(kind))
    return raw ? (JSON.parse(raw) as FormValues) : undefined
  } catch {
    return undefined
  }
}

/** Called once payment is confirmed. */
export function clearDrafts() {
  try {
    sessionStorage.removeItem(draftKey('team'))
    sessionStorage.removeItem(draftKey('player'))
  } catch {
    // Nothing to clear.
  }
}

// ---- Payment confirmation after Stripe redirects back ----

export type CheckoutStatus =
  | { state: 'paid'; registrationType: RegistrationKind | null; division: string | null; name: string | null; email: string | null }
  | { state: 'unpaid'; registrationType: RegistrationKind | null }
  | { state: 'unknown' }

export async function fetchCheckoutStatus(sessionId: string): Promise<CheckoutStatus> {
  try {
    const response = await fetch(`${STATUS_ENDPOINT}?session_id=${encodeURIComponent(sessionId)}`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return { state: 'unknown' }
    const data = await response.json()
    return data.paid ? { state: 'paid', ...data } : { state: 'unpaid', registrationType: data.registrationType ?? null }
  } catch {
    return { state: 'unknown' }
  }
}
