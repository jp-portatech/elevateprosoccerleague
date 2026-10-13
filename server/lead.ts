/**
 * POST /api/contact — every "talk to us" form:
 *   - the "Not ready to register?" form on the homepage (default)
 *   - the information requests on the landing pages: { inquiry: 'individual_player' | 'team' }
 *     from /join-as-a-player and /register-a-team (and their Spanish versions under /es), with
 *     any UTM campaign tags from the page URL.
 *     These ask no marketing consent, so the person is saved as unsubscribed from promotions.
 *
 *  1. Validates the form with the same rules the browser uses.
 *  2. Emails the details to the league inbox (league.email.notify). This is the step that
 *     must work: if it fails, the visitor is told and nothing is lost silently.
 *  3. Sends the person a thank-you email in their language, and saves them to the Resend
 *     contact list (RESEND_LEADS_SEGMENT_ID optional). Failures here are logged, not shown.
 *
 * Spam: a hidden "leave_this_empty" field that only bots fill in, and a minimum time between
 * the first keystroke and Send.
 *
 * The lead is also saved to the admin dashboard's database when DATABASE_URL is set.
 *
 * Needs RESEND_API_KEY. Saving contacts needs that key to have Full access in Resend.
 */
import { league } from '../src/config/league.js'
import { leadFields, validateLead } from '../src/contact/leadForm.js'
import { isLocale, type Locale } from '../src/i18n/locale.js'
import { cleanUtm, inquiryFields, inquirySource, isInquiryType, validateInquiry } from '../src/landing/inquiryForms.js'
import type { FieldDef } from '../src/registration/forms.js'
import type { FormValues } from '../src/registration/forms.js'
import { getDb, saveLead, type DbEnv } from './db.js'
import { saveContact, sendEmail } from './email.js'
import { buildLeadAcknowledgement, buildLeadNotification, type Lead } from './emails/leadEmails.js'

export interface LeadEnv extends DbEnv {
  RESEND_API_KEY?: string
  /** Resend segment that new leads are added to, e.g. "Website leads". Optional. */
  RESEND_LEADS_SEGMENT_ID?: string
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

/** People need at least this long to fill in the form; bots post instantly. */
const MIN_FILL_MS = 1500
const SUBMISSION_ID = /^[A-Za-z0-9-]{8,64}$/

const pickFields = (fields: FieldDef[], raw: unknown): FormValues => {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return Object.fromEntries(
    fields.map((f) => [f.name, typeof source[f.name] === 'string' ? (source[f.name] as string).trim() : '']),
  )
}

export async function handleLead(request: Request, env: LeadEnv): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'invalid-request' }, 405)

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return json({ error: 'invalid-request' }, 400)
  }
  const locale: Locale = isLocale(body.locale) ? body.locale : 'en'

  // Bots fill in the hidden field: accept quietly so they don't retry, but send nothing.
  if (typeof body.leave_this_empty === 'string' && body.leave_this_empty.trim()) return json({ ok: true })
  if (typeof body.elapsedMs !== 'number' || body.elapsedMs < MIN_FILL_MS) return json({ error: 'too-fast' }, 400)

  const inquiry = isInquiryType(body.inquiry) ? body.inquiry : null
  const values = pickFields(inquiry ? inquiryFields[inquiry] : leadFields, body.fields)
  const errors = inquiry ? validateInquiry(inquiry, values, locale) : validateLead(values, locale)
  if (Object.keys(errors).length > 0) return json({ error: 'invalid-fields', fields: errors }, 400)

  if (!env.RESEND_API_KEY || league.email.notify.length === 0) return json({ error: 'not-configured' }, 503)

  const id = typeof body.submissionId === 'string' && SUBMISSION_ID.test(body.submissionId) ? body.submissionId : crypto.randomUUID()
  const lead: Lead = inquiry
    ? {
        name: values.name,
        email: values.email,
        phone: values.phone,
        interest: inquiry === 'team' ? 'team' : 'player',
        ageGroup: values.division,
        message: '',
        teamName: values.teamName ?? '',
        consent: false,
        locale,
        receivedAt: new Date(),
        source: inquirySource(inquiry, body.page),
        inquiry,
        utm: cleanUtm(body.utm),
      }
    : {
        name: values.name,
        email: values.email,
        phone: values.phone,
        interest: values.interest,
        ageGroup: values.ageGroup,
        message: values.message,
        teamName: '',
        consent: values.updates === 'yes',
        locale,
        receivedAt: new Date(),
        source: 'contact-form',
        inquiry: null,
        utm: cleanUtm(body.utm),
      }

  try {
    await sendEmail(env.RESEND_API_KEY, league.email.from, {
      ...buildLeadNotification(lead),
      to: league.email.notify,
      replyTo: lead.email,
      idempotencyKey: `lead-${id}`,
    })
  } catch (error) {
    console.error('Contact form email to the league failed:', error)
    return json({ error: 'send-failed' }, 502)
  }

  const [nameFirst, ...nameRest] = lead.name.split(/\s+/)
  const db = getDb(env)
  const [ack, contact, saved] = await Promise.allSettled([
    sendEmail(env.RESEND_API_KEY, league.email.from, {
      ...buildLeadAcknowledgement(lead),
      to: lead.email,
      replyTo: league.email.replyTo,
      idempotencyKey: `lead-ack-${id}`,
    }),
    saveContact(
      env.RESEND_API_KEY,
      { email: lead.email, firstName: nameFirst, lastName: nameRest.join(' '), unsubscribed: !lead.consent },
      env.RESEND_LEADS_SEGMENT_ID,
    ),
    db
      ? saveLead(db, {
          submissionId: id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          interest: lead.interest,
          ageGroup: lead.ageGroup,
          message: lead.message,
          consent: lead.consent,
          locale,
          teamName: lead.teamName,
          source: lead.source,
          utm: lead.utm,
        })
      : null,
  ])
  if (ack.status === 'rejected') console.error('Contact form thank-you email failed:', ack.reason)
  if (contact.status === 'rejected') {
    console.error('Saving the lead to Resend contacts failed (the API key needs Full access):', contact.reason)
  }
  if (saved.status === 'rejected') console.error('Saving the lead to the database failed:', saved.reason)

  return json({ ok: true })
}
