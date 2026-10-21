/**
 * POST /api/winter-survey — the unlisted winter training survey (/winter-survey), one response
 * per player. Same pattern as /api/contact (server/lead.ts):
 *
 *  1. Validates the answers with the same rules the browser uses (src/winter-survey/surveyForm.ts).
 *  2. Saves the response to the admin dashboard's database (table winter_survey_responses) and
 *     emails every answer to the league inbox (league.email.notify). At least one of the two must
 *     work: if both fail, the parent is told and can try again, so nothing is lost silently.
 *  3. Sends the parent a short confirmation. A failure there is logged, not shown.
 *
 * Survey respondents are NOT added to the Resend contact list or the leads segment.
 *
 * Spam: the same hidden "leave_this_empty" field and minimum fill time as the contact form, and a
 * one-time submission id so a retry is never saved or emailed twice.
 *
 * Needs DATABASE_URL and/or RESEND_API_KEY (both, normally).
 */
import { league } from '../src/config/league.js'
import { cleanSurvey, validateSurvey } from '../src/winter-survey/surveyForm.js'
import { getDb, saveWinterSurveyResponse, type DbEnv } from './db.js'
import { sendEmail } from './email.js'
import { buildSurveyConfirmation, buildSurveyNotification, type SurveyResponse } from './emails/winterSurveyEmails.js'

export interface WinterSurveyEnv extends DbEnv {
  RESEND_API_KEY?: string
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

/** The survey has 20+ questions; nobody honest answers them in under 5 seconds. */
const MIN_FILL_MS = 5000
const SUBMISSION_ID = /^[A-Za-z0-9-]{8,64}$/

export async function handleWinterSurvey(request: Request, env: WinterSurveyEnv): Promise<Response> {
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

  const answers = cleanSurvey(body.fields)
  const errors = validateSurvey(answers)
  if (Object.keys(errors).length > 0) return json({ error: 'invalid-fields', fields: errors }, 400)

  const db = getDb(env)
  const emailKey = league.email.notify.length > 0 ? env.RESEND_API_KEY : undefined
  if (!db && !emailKey) return json({ error: 'not-configured' }, 503)

  const id = typeof body.submissionId === 'string' && SUBMISSION_ID.test(body.submissionId) ? body.submissionId : crypto.randomUUID()
  const response: SurveyResponse = { answers, receivedAt: new Date() }
  const parentEmail = answers.parentEmail as string

  const [saved, notified] = await Promise.allSettled([
    db ? saveWinterSurveyResponse(db, { submissionId: id, answers }) : null,
    emailKey
      ? sendEmail(emailKey, league.email.from, {
          ...buildSurveyNotification(response),
          to: league.email.notify,
          replyTo: parentEmail,
          idempotencyKey: `winter-survey-${id}`,
        })
      : null,
  ])
  if (saved.status === 'rejected') console.error('Saving the winter survey to the database failed:', saved.reason)
  if (notified.status === 'rejected') console.error('Winter survey email to the league failed:', notified.reason)
  const recorded = (db && saved.status === 'fulfilled') || (emailKey && notified.status === 'fulfilled')
  if (!recorded) return json({ error: 'send-failed' }, 502)

  let confirmed = false
  if (env.RESEND_API_KEY) {
    try {
      await sendEmail(env.RESEND_API_KEY, league.email.from, {
        ...buildSurveyConfirmation(response),
        to: parentEmail,
        replyTo: league.email.replyTo,
        idempotencyKey: `winter-survey-ack-${id}`,
      })
      confirmed = true
    } catch (error) {
      console.error('Winter survey confirmation email failed:', error)
    }
  }

  return json({ ok: true, confirmed })
}
