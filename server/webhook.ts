/**
 * POST /api/stripe-webhook — Stripe calls this when a Checkout payment completes.
 * Sends the welcome email to the family/coach and a copy to the league inbox.
 *
 * Reliability:
 *  - The Stripe signature is verified, so nobody else can trigger emails.
 *  - On any email failure we return 500 and Stripe retries (for up to 3 days). Resend
 *    idempotency keys stop a retry from re-sending an email that already went out.
 *  - After both emails send, the Checkout Session is tagged `welcome_email_sent` so a
 *    late retry is skipped entirely.
 *
 * Also saves the registration to the admin dashboard's database (server/db.ts) when
 * DATABASE_URL is set. That happens first and can't be skipped by the "already emailed" check,
 * so a retry also repairs a failed save.
 *
 * Needs STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET and RESEND_API_KEY.
 */
import type Stripe from 'stripe'
import { league } from '../src/config/league.js'
import { registrationFromMetadata } from './checkout.js'
import { getDb, saveRegistration, type DbEnv } from './db.js'
import { sendEmail } from './email.js'
import { buildLeagueNotification, buildWelcomeEmail, type PaidRegistration } from './emails/registrationEmails.js'
import { stripeClient } from './stripe.js'

export interface WebhookEnv extends DbEnv {
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
  RESEND_API_KEY?: string
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const HANDLED_EVENTS = new Set(['checkout.session.completed', 'checkout.session.async_payment_succeeded'])

export async function handleStripeWebhook(request: Request, env: WebhookEnv): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'method-not-allowed' }, 405)
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) return json({ error: 'not-configured' }, 503)

  const signature = request.headers.get('stripe-signature')
  if (!signature) return json({ error: 'missing-signature' }, 400)

  const stripe = stripeClient(env.STRIPE_SECRET_KEY)
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return json({ error: 'invalid-signature' }, 400)
  }

  if (!HANDLED_EVENTS.has(event.type)) return json({ received: true, ignored: event.type })

  const session = event.data.object as Stripe.Checkout.Session
  const registration = registrationFromMetadata(session.metadata)
  // Not one of our registrations, not paid yet (async methods confirm later), or already emailed.
  if (!registration) return json({ received: true, ignored: 'not-a-registration' })
  if (session.payment_status !== 'paid') return json({ received: true, ignored: 'unpaid' })

  const email = session.customer_details?.email ?? session.customer_email
  if (!email) return json({ received: true, ignored: 'no-email' })
  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? null)

  const db = getDb(env)
  if (db) {
    try {
      await saveRegistration(db, {
        id: session.id,
        kind: registration.kind,
        locale: registration.locale,
        email,
        fields: registration.fields,
        amountCents: session.amount_total,
        currency: session.currency ?? league.pricing.currency.toLowerCase(),
        paidAt: new Date(event.created * 1000),
        paymentIntentId,
        livemode: event.livemode,
      })
    } catch (error) {
      // 500 makes Stripe retry; the save is idempotent and emails are guarded below.
      console.error('Saving registration to the database failed for', session.id, error)
      return json({ error: 'database-failed' }, 500)
    }
  }

  if (session.metadata?.welcome_email_sent) return json({ received: true, ignored: 'already-emailed' })

  if (!env.RESEND_API_KEY) {
    // 500 makes Stripe retry, so these emails still go out once email is configured.
    console.error('RESEND_API_KEY is not set; registration email not sent for', session.id)
    return json({ error: 'email-not-configured' }, 500)
  }

  const paid: PaidRegistration = {
    ...registration,
    email,
    amountTotal: session.amount_total,
    currency: session.currency ?? league.pricing.currency,
    paidAt: new Date(event.created * 1000),
    sessionId: session.id,
    paymentIntentId,
    livemode: event.livemode,
  }

  const welcome = buildWelcomeEmail(paid)
  const sends = [
    sendEmail(env.RESEND_API_KEY, league.email.from, {
      ...welcome,
      to: email,
      replyTo: league.email.replyTo,
      idempotencyKey: `welcome-${session.id}`,
    }),
  ]
  if (league.email.notify.length > 0) {
    sends.push(
      sendEmail(env.RESEND_API_KEY, league.email.from, {
        ...buildLeagueNotification(paid),
        to: league.email.notify,
        replyTo: email,
        idempotencyKey: `league-${session.id}`,
      }),
    )
  }

  const results = await Promise.allSettled(sends)
  const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
  if (failures.length > 0) {
    for (const f of failures) console.error('Registration email failed for', session.id, f.reason)
    return json({ error: 'email-failed' }, 500)
  }

  try {
    await stripe.checkout.sessions.update(session.id, {
      metadata: { welcome_email_sent: new Date().toISOString() },
    })
  } catch (error) {
    // Emails already went out; idempotency keys still guard short-term retries.
    console.error('Could not tag session as emailed:', session.id, error)
  }

  return json({ received: true, emailed: true })
}
