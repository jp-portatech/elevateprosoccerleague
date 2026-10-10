/**
 * Stripe Checkout for league registrations. Runs only on the server (Vercel functions in
 * api/, or the Vite dev middleware locally) because it uses STRIPE_SECRET_KEY.
 *
 * Flow: the registration form POSTs its fields → we re-validate them with the same rules
 * the browser uses → create a Checkout Session priced from src/config/league.ts → return
 * its URL. The registration details travel with the payment as Stripe metadata, so each
 * paid registration (with its form answers) is visible in the Stripe Dashboard.
 *
 * Amounts always come from the config on the server, never from the request.
 */
import type Stripe from 'stripe'
import { startDateLabel } from '../src/config/derived.js'
import { league } from '../src/config/league.js'
import { formFields, validateForm, type FormValues } from '../src/registration/forms.js'
import type { RegistrationKind } from '../src/registration/types.js'
import { stripeClient } from './stripe.js'

export interface ServerEnv {
  STRIPE_SECRET_KEY?: string
}

export type CheckoutErrorCode = 'invalid-request' | 'invalid-fields' | 'not-configured' | 'stripe-error' | 'not-found'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

const fail = (error: CheckoutErrorCode, status: number, extra: Record<string, unknown> = {}) =>
  json({ error, ...extra }, status)

export const isKind = (value: unknown): value is RegistrationKind => value === 'team' || value === 'player'

/** Keeps only this form's known fields, as trimmed strings. */
function pickFields(kind: RegistrationKind, raw: unknown): FormValues {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return Object.fromEntries(
    formFields[kind].map((f) => [f.name, typeof source[f.name] === 'string' ? (source[f.name] as string).trim() : '']),
  )
}

const snakeCase = (name: string) => name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)

/** Stripe metadata: ≤ 50 keys, keys ≤ 40 chars, values ≤ 500 chars. Long text is split. */
export function toMetadata(kind: RegistrationKind, fields: FormValues): Record<string, string> {
  const metadata: Record<string, string> = { registration_type: kind, season_start: startDateLabel }
  for (const field of formFields[kind]) {
    const value = fields[field.name]
    if (!value) continue
    const display = field.options?.find((o) => o.value === value && field.name !== 'division')?.label ?? value
    const key = snakeCase(field.name)
    if (display.length <= 500) {
      metadata[key] = display
    } else {
      for (let i = 0; i * 500 < display.length; i++) metadata[`${key}_${i + 1}`] = display.slice(i * 500, (i + 1) * 500)
    }
  }
  return metadata
}

/** Reverses toMetadata: the registration's form answers (display values) from Stripe metadata. */
export function registrationFromMetadata(
  metadata: Record<string, string> | null | undefined,
): { kind: RegistrationKind; fields: FormValues } | null {
  const kind = metadata?.registration_type
  if (!metadata || !isKind(kind)) return null
  const fields: FormValues = {}
  for (const field of formFields[kind]) {
    const key = snakeCase(field.name)
    const chunks: string[] = [] // long values were split into key_1, key_2, …
    for (let i = 1; metadata[`${key}_${i}`] !== undefined; i++) chunks.push(metadata[`${key}_${i}`])
    fields[field.name] = metadata[key] ?? chunks.join('')
  }
  return { kind, fields }
}

/** Pure — builds the Checkout Session request for validated fields. */
export function buildCheckoutParams(
  kind: RegistrationKind,
  fields: FormValues,
  origin: string,
): Stripe.Checkout.SessionCreateParams {
  const price = league.pricing[kind]
  if (!price) throw new Error(`No ${kind} price configured`)
  const isTeam = kind === 'team'
  const subject = isTeam ? fields.teamName : `${fields.playerFirstName} ${fields.playerLastName}`
  const metadata = toMetadata(kind, fields)

  return {
    mode: 'payment',
    submit_type: 'pay',
    customer_email: isTeam ? fields.email : fields.guardianEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: league.pricing.currency.toLowerCase(),
          unit_amount: Math.round(price.amount * 100),
          product_data: {
            name: `${isTeam ? 'Team' : 'Individual player'} registration — ${fields.division}`,
            description: `${league.name} · ${subject} · Season starts ${startDateLabel}`,
          },
        },
      },
    ],
    metadata,
    payment_intent_data: {
      metadata,
      description: `${league.name} ${isTeam ? 'team' : 'player'} registration — ${fields.division} — ${subject}`,
    },
    success_url: `${origin}/?registration=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?registration=cancelled&type=${kind}`,
  }
}

/** POST /api/register — validates a registration and returns a Stripe Checkout URL. */
export async function createCheckout(request: Request, env: ServerEnv): Promise<Response> {
  if (request.method !== 'POST') return fail('invalid-request', 405)

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return fail('invalid-request', 400)
  }
  const kind = (body as { registrationType?: unknown } | null)?.registrationType
  if (!isKind(kind)) return fail('invalid-request', 400)

  const fields = pickFields(kind, (body as { fields?: unknown }).fields)
  const errors = validateForm(kind, fields)
  if (Object.keys(errors).length > 0) return fail('invalid-fields', 400, { fields: errors })

  if (!league.pricing[kind] || !env.STRIPE_SECRET_KEY) return fail('not-configured', 503)

  try {
    const stripe = stripeClient(env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.create(
      buildCheckoutParams(kind, fields, new URL(request.url).origin),
    )
    if (!session.url) throw new Error('Checkout session has no URL')
    return json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout session failed:', error)
    return fail('stripe-error', 502)
  }
}

const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{10,}$/

/** GET /api/registration-status?session_id=… — confirms payment after Stripe redirects back. */
export async function checkoutStatus(request: Request, env: ServerEnv): Promise<Response> {
  const sessionId = new URL(request.url).searchParams.get('session_id') ?? ''
  if (!SESSION_ID.test(sessionId)) return fail('invalid-request', 400)
  if (!env.STRIPE_SECRET_KEY) return fail('not-configured', 503)

  try {
    const stripe = stripeClient(env.STRIPE_SECRET_KEY)
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const meta = session.metadata ?? {}
    const kind = meta.registration_type
    return json({
      paid: session.payment_status === 'paid' || session.payment_status === 'no_payment_required',
      registrationType: isKind(kind) ? kind : null,
      division: meta.division ?? null,
      name: kind === 'team' ? (meta.team_name ?? null) : (meta.player_first_name ?? null),
      email: session.customer_details?.email ?? session.customer_email ?? null,
    })
  } catch (error) {
    console.error('Stripe session lookup failed:', error)
    return fail('not-found', 404)
  }
}
