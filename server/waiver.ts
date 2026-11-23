/**
 * POST /api/waiver — the unlisted facility waiver (/waiver), signed online by a parent, one per
 * player. Same pattern as /api/winter-survey:
 *
 *  1. Validates the form and signatures with the same rules the browser uses (src/waiver/waiverForm.ts).
 *  2. Saves the signed waiver to the database (table waivers) with the exact wording signed, the
 *     signing time, and the signer's IP address and browser as a record of the e-signature. This
 *     step must work: the admin dashboard is where waivers are printed from, so if saving fails the
 *     parent is told and can try again.
 *  3. Emails the league inbox, and sends the address on the form a copy of what they signed.
 *     Failures here are logged, not shown.
 *
 * Spam: the same hidden "leave_this_empty" field, minimum fill time and one-time submission id as
 * the other forms.
 *
 * Needs DATABASE_URL; RESEND_API_KEY for the emails.
 */
import { league } from '../src/config/league.js'
import { cleanSignature, cleanWaiverFields, CURRENT_WAIVER, validateWaiver, waiverPlainText, type Signature } from '../src/waiver/waiverForm.js'
import { getDb, saveWaiver, type DbEnv } from './db.js'
import { sendEmail } from './email.js'
import { buildWaiverCopy, buildWaiverNotification, type SignedWaiver } from './emails/waiverEmails.js'

export interface WaiverEnv extends DbEnv {
  RESEND_API_KEY?: string
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

/** A dozen fields and a signature: nobody honest finishes in under 5 seconds. */
const MIN_FILL_MS = 5000
const SUBMISSION_ID = /^[A-Za-z0-9-]{8,64}$/

const clientIp = (request: Request) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || ''

export async function handleWaiver(request: Request, env: WaiverEnv): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'invalid-request' }, 405)

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return json({ error: 'invalid-request' }, 400)
  }

  // Bots fill in the hidden field: accept quietly so they don't retry, but save and send nothing.
  if (typeof body.leave_this_empty === 'string' && body.leave_this_empty.trim()) return json({ ok: true })
  if (typeof body.elapsedMs !== 'number' || body.elapsedMs < MIN_FILL_MS) return json({ error: 'too-fast' }, 400)

  const fields = cleanWaiverFields(body.fields)
  const raw = body.signatures && typeof body.signatures === 'object' ? (body.signatures as Record<string, unknown>) : {}
  const signatures = { participant: cleanSignature(raw.participant), guardian: cleanSignature(raw.guardian) }
  const consent = body.consent === true
  const errors = validateWaiver(fields, signatures, consent)
  if (Object.keys(errors).length > 0) return json({ error: 'invalid-fields', fields: errors }, 400)

  const db = getDb(env)
  if (!db) return json({ error: 'not-configured' }, 503)

  const submissionId =
    typeof body.submissionId === 'string' && SUBMISSION_ID.test(body.submissionId) ? body.submissionId : crypto.randomUUID()
  let saved: { id: string; signedAt: Date }
  try {
    saved = await saveWaiver(db, {
      submissionId,
      version: CURRENT_WAIVER,
      fields,
      participantSignature: signatures.participant,
      guardianSignature: signatures.guardian,
      esignConsent: consent,
      text: waiverPlainText(CURRENT_WAIVER),
      signerIp: clientIp(request),
      userAgent: (request.headers.get('user-agent') ?? '').slice(0, 300),
    })
  } catch (error) {
    console.error('Saving the waiver to the database failed:', error)
    return json({ error: 'send-failed' }, 500)
  }

  let confirmed = false
  if (env.RESEND_API_KEY) {
    const signed: SignedWaiver = {
      id: saved.id,
      version: CURRENT_WAIVER,
      fields,
      participantSignature: signatures.participant as Signature,
      guardianSignature: signatures.guardian,
      signedAt: saved.signedAt,
    }
    const [notified, copy] = await Promise.allSettled([
      league.email.notify.length
        ? sendEmail(env.RESEND_API_KEY, league.email.from, {
            ...buildWaiverNotification(signed),
            to: league.email.notify,
            replyTo: fields.email,
            idempotencyKey: `waiver-${saved.id}`,
          })
        : null,
      sendEmail(env.RESEND_API_KEY, league.email.from, {
        ...buildWaiverCopy(signed),
        to: fields.email,
        replyTo: league.email.replyTo,
        idempotencyKey: `waiver-copy-${saved.id}`,
      }),
    ])
    if (notified.status === 'rejected') console.error('Waiver email to the league failed:', notified.reason)
    if (copy.status === 'rejected') console.error('Waiver copy to the signer failed:', copy.reason)
    confirmed = copy.status === 'fulfilled'
  }

  return json({ ok: true, confirmed })
}
