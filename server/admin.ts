/**
 * POST /api/admin — everything the admin dashboard (/admin) reads and changes, as small JSON
 * actions: { action: 'load' }, { action: 'assign', … }, …
 *
 * Sign-in: one shared password (ADMIN_PASSWORD in Vercel, 12+ characters). A correct password
 * sets a signed, HttpOnly session cookie for 7 days. Changing the password signs everyone out.
 * After 8 wrong passwords from one IP, sign-in from that IP pauses for 15 minutes.
 *
 * Needs DATABASE_URL (Neon). "Import from Stripe" needs STRIPE_SECRET_KEY; "Send team info"
 * needs RESEND_API_KEY.
 */
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { league } from '../src/config/league.js'
import { isLocale } from '../src/i18n/locale.js'
import {
  LEAD_STATUSES,
  type AdminData,
  type AdminLead,
  type AdminRegistration,
  type AdminSurveyResponse,
  type AdminTeam,
  type AdminAgreementDoc,
  type AdminAgreementSummary,
  type AdminWaiver,
  type AdminWaiverDoc,
} from '../src/admin/model.js'
import { cleanSignature, cleanWaiverFields } from '../src/waiver/waiverForm.js'
import { cleanSurvey } from '../src/winter-survey/surveyForm.js'
import { registrationFromMetadata } from './checkout.js'
import { ensureSchema, getDb, saveRegistration, type Db, type DbEnv, type Row } from './db.js'
import { sendBatch } from './email.js'
import { buildTeamCoachEmail, buildTeamFamilyEmail } from './emails/teamEmails.js'
import { stripeClient } from './stripe.js'

export interface AdminEnv extends DbEnv {
  ADMIN_PASSWORD?: string
  STRIPE_SECRET_KEY?: string
  RESEND_API_KEY?: string
}

const COOKIE = 'ep_admin'
const SESSION_MS = 7 * 24 * 60 * 60 * 1000
const MIN_PASSWORD_LENGTH = 12
const MAX_FAILURES = 8
const LOCKOUT_MINUTES = 15

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  })

// ---------- session cookie ----------

const sign = (password: string, payload: string) =>
  createHmac('sha256', createHmac('sha256', password).update('elevatepro-admin-session-v1').digest())
    .update(payload)
    .digest('base64url')

const sameText = (a: string, b: string) => {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

function newToken(password: string, now: number) {
  const payload = `v1.${now + SESSION_MS}`
  return `${payload}.${sign(password, payload)}`
}

function validToken(password: string, token: string | null, now: number) {
  const match = token && /^(v1\.(\d+))\.([A-Za-z0-9_-]+)$/.exec(token)
  if (!match) return false
  return Number(match[2]) > now && sameText(match[3], sign(password, match[1]))
}

function readCookie(request: Request, name: string): string | null {
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const [key, ...value] = part.trim().split('=')
    if (key === name) return value.join('=')
  }
  return null
}

const sessionCookie = (value: string, maxAgeSeconds: number) =>
  `${COOKIE}=${value}; Path=/api/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSeconds}`

const clientIp = (request: Request) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'

// ---------- reading ----------

const iso = (value: unknown) => (value instanceof Date ? value.toISOString() : value ? String(value) : null)
const text = (value: unknown) => (typeof value === 'string' ? value : '')
const parseFields = (value: unknown): Record<string, string> =>
  typeof value === 'string' ? JSON.parse(value) : ((value ?? {}) as Record<string, string>)

// Each waiver with the ElevatePro agreement signed alongside it (if any), without signature images.
const WAIVER_LIST_QUERY = `SELECT w.id, w.signed_at, w.waiver_version, w.participant_name, w.date_of_birth, w.email, w.phone,
    w.fields, w.guardian_signature IS NOT NULL AS guardian_signed,
    a.id AS agreement_id, a.signer_role, a.signer_name, a.emergency_contact, a.emergency_phone, a.media_permission
  FROM waivers w LEFT JOIN player_agreements a ON a.waiver_id = w.id
  ORDER BY w.signed_at DESC`
const parseJson = (value: unknown) => (typeof value === 'string' ? JSON.parse(value) : value)

const agreementSummary = (a: Row, id: unknown): AdminAgreementSummary => ({
  id: text(id),
  signerRole: a.signer_role === 'adult' ? 'adult' : 'guardian',
  signerName: text(a.signer_name),
  emergencyContact: text(a.emergency_contact),
  emergencyPhone: text(a.emergency_phone),
  mediaPermission: a.media_permission === 'yes' || a.media_permission === 'no' ? a.media_permission : '',
})

const waiverListItem = (w: Row): AdminWaiver => ({
  id: text(w.id),
  signedAt: iso(w.signed_at) ?? '',
  version: text(w.waiver_version),
  name: text(w.participant_name),
  dob: text(w.date_of_birth),
  email: text(w.email),
  phone: text(w.phone),
  fields: cleanWaiverFields(parseJson(w.fields)),
  guardianSigned: Boolean(w.guardian_signed),
  agreement: w.agreement_id ? agreementSummary(w, w.agreement_id) : null,
})

/** ElevatePro agreements with signatures and audit details, for printing, by waiver id (all when empty). */
async function agreementDocs(db: Db, waiverIds: string[]): Promise<AdminAgreementDoc[]> {
  const rows = waiverIds.length
    ? await db.query(`SELECT * FROM player_agreements WHERE waiver_id = ANY($1::uuid[]) ORDER BY signed_at DESC`, [waiverIds])
    : await db.query(`SELECT * FROM player_agreements ORDER BY signed_at DESC LIMIT 500`)
  return rows.map((a) => ({
    ...agreementSummary(a, a.id),
    waiverId: text(a.waiver_id),
    version: text(a.agreement_version),
    signedAt: iso(a.signed_at) ?? '',
    playerName: text(a.player_name),
    dob: text(a.date_of_birth),
    playerAge: a.player_age === null || a.player_age === undefined ? null : Number(a.player_age),
    contactPhone: text(a.contact_phone),
    roleAcknowledged: Boolean(a.role_acknowledged),
    signature: cleanSignature(parseJson(a.signature)) ?? { kind: 'typed', name: '' },
    signatureSource: text(a.signature_source),
    agreementText: text(a.agreement_text),
    signerIp: text(a.signer_ip),
    userAgent: text(a.user_agent),
  }))
}

/** Waivers with their signatures and audit details, for printing. All of them when `ids` is empty. */
async function waiverDocs(db: Db, ids: string[]): Promise<AdminWaiverDoc[]> {
  const rows = ids.length
    ? await db.query(`SELECT *, guardian_signature IS NOT NULL AS guardian_signed FROM waivers WHERE id = ANY($1::uuid[]) ORDER BY signed_at DESC`, [ids])
    : await db.query(`SELECT *, guardian_signature IS NOT NULL AS guardian_signed FROM waivers ORDER BY signed_at DESC LIMIT 500`)
  return rows.map((w) => ({
    ...waiverListItem(w),
    participantSignature: cleanSignature(parseJson(w.participant_signature)) ?? { kind: 'typed', name: '' },
    guardianSignature: cleanSignature(parseJson(w.guardian_signature)),
    waiverText: text(w.waiver_text),
    esignConsent: Boolean(w.esign_consent),
    signerIp: text(w.signer_ip),
    userAgent: text(w.user_agent),
  }))
}

async function loadData(db: Db): Promise<AdminData> {
  const [registrations, teams, leads, surveys, waivers] = await Promise.all([
    db.query(`SELECT * FROM registrations ORDER BY paid_at DESC NULLS LAST, created_at DESC`),
    db.query(`SELECT * FROM teams ORDER BY division, created_at`),
    db.query(`SELECT * FROM leads ORDER BY created_at DESC`),
    db.query(`SELECT * FROM winter_survey_responses ORDER BY created_at DESC`),
    // Without the signature images, which are only fetched for printing.
    db.query(WAIVER_LIST_QUERY),
  ])
  return {
    registrations: registrations.map(
      (r: Row): AdminRegistration => ({
        id: text(r.id),
        kind: r.kind === 'team' ? 'team' : 'player',
        division: text(r.division),
        locale: isLocale(r.locale) ? r.locale : 'en',
        email: text(r.email),
        phone: text(r.phone),
        fields: parseFields(r.fields),
        amountCents: r.amount_cents === null || r.amount_cents === undefined ? null : Number(r.amount_cents),
        currency: (r.currency as string | null) ?? null,
        paidAt: iso(r.paid_at),
        paymentIntentId: (r.payment_intent_id as string | null) ?? null,
        livemode: Boolean(r.livemode),
        status: r.status === 'withdrawn' ? 'withdrawn' : 'active',
        notes: text(r.notes),
        teamId: (r.team_id as string | null) ?? null,
      }),
    ),
    teams: teams.map(
      (t: Row): AdminTeam => ({
        id: text(t.id),
        division: text(t.division),
        name: text(t.name),
        registrationId: (t.registration_id as string | null) ?? null,
        coachName: text(t.coach_name),
        coachEmail: text(t.coach_email),
        coachPhone: text(t.coach_phone),
        notifiedAt: iso(t.notified_at),
        createdAt: iso(t.created_at) ?? '',
      }),
    ),
    leads: leads.map(
      (l: Row): AdminLead => ({
        id: text(l.id),
        name: text(l.name),
        email: text(l.email),
        phone: text(l.phone),
        interest: text(l.interest),
        ageGroup: text(l.age_group),
        message: text(l.message),
        consent: Boolean(l.consent),
        locale: isLocale(l.locale) ? l.locale : 'en',
        status: LEAD_STATUSES.some((s) => s.value === l.status) ? (l.status as AdminLead['status']) : 'new',
        notes: text(l.notes),
        createdAt: iso(l.created_at) ?? '',
        teamName: text(l.team_name),
        source: text(l.source) || 'contact-form',
        utm: (typeof l.utm === 'string' ? JSON.parse(l.utm) : (l.utm ?? {})) as Record<string, string>,
      }),
    ),
    surveys: surveys.map(
      (s: Row): AdminSurveyResponse => ({
        id: text(s.id),
        createdAt: iso(s.created_at) ?? '',
        playerName: text(s.player_name),
        parentName: text(s.parent_name),
        parentEmail: text(s.parent_email),
        parentPhone: text(s.parent_phone),
        dateOfBirth: text(s.date_of_birth),
        // Cleaned again so answers to questions since removed or renamed don't break the dashboard.
        answers: cleanSurvey(typeof s.answers === 'string' ? JSON.parse(s.answers) : s.answers),
      }),
    ),
    waivers: waivers.map(waiverListItem),
  }
}

// ---------- input checks ----------

const DIVISIONS = new Set<string>(league.divisions.map((d) => d.id))
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SESSION_ID = /^cs_(test|live)_[A-Za-z0-9]{10,}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const str = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

class BadRequest extends Error {}
const check = (ok: unknown, message: string) => {
  if (!ok) throw new BadRequest(message)
}

function teamInput(body: Record<string, unknown>) {
  const team = {
    name: str(body.name, 80),
    coachName: str(body.coachName, 100),
    coachEmail: str(body.coachEmail, 254),
    coachPhone: str(body.coachPhone, 30),
  }
  check(team.name, 'Enter a team name.')
  check(!team.coachEmail || EMAIL.test(team.coachEmail), 'Enter a valid coach email, or leave it empty.')
  return team
}

// ---------- actions ----------

async function importFromStripe(db: Db, env: AdminEnv) {
  check(env.STRIPE_SECRET_KEY, 'Stripe is not connected.')
  const stripe = stripeClient(env.STRIPE_SECRET_KEY!)
  const existing = new Set((await db.query<{ id: string }>(`SELECT id FROM registrations`)).map((r) => r.id))
  let imported = 0
  let skipped = 0
  for await (const session of stripe.checkout.sessions.list({ status: 'complete', limit: 100 })) {
    const registration = registrationFromMetadata(session.metadata)
    const email = session.customer_details?.email ?? session.customer_email
    if (!registration || session.payment_status !== 'paid' || !email) continue
    if (existing.has(session.id)) {
      skipped++
      continue
    }
    await saveRegistration(db, {
      id: session.id,
      kind: registration.kind,
      locale: registration.locale,
      email,
      fields: registration.fields,
      amountCents: session.amount_total,
      currency: session.currency ?? league.pricing.currency.toLowerCase(),
      paidAt: new Date(session.created * 1000),
      paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? null),
      livemode: session.livemode,
    })
    imported++
  }
  return { imported, skipped }
}

async function notifyTeam(db: Db, env: AdminEnv, teamId: string) {
  check(env.RESEND_API_KEY, 'Email is not connected.')
  const data = await loadData(db)
  const team = data.teams.find((t) => t.id === teamId)
  check(team, 'Team not found.')
  const players = data.registrations.filter((r) => r.teamId === teamId && r.kind === 'player' && r.status === 'active')
  check(players.length > 0, 'This team has no placed players to notify.')

  const emails = players.map((player) => ({
    ...buildTeamFamilyEmail(team!, player),
    to: player.email,
    replyTo: league.email.replyTo,
  }))
  if (team!.coachEmail) {
    emails.push({ ...buildTeamCoachEmail(team!, players), to: team!.coachEmail, replyTo: league.email.replyTo })
  }
  await sendBatch(env.RESEND_API_KEY!, league.email.from, emails, `team-${teamId}-${Date.now()}`)
  await db.query(`UPDATE teams SET notified_at = now() WHERE id = $1`, [teamId])
  return { families: players.length, coach: Boolean(team!.coachEmail) }
}

export async function handleAdmin(request: Request, env: AdminEnv): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'method-not-allowed' }, 405)

  const password = env.ADMIN_PASSWORD ?? ''
  if (!password) return json({ error: 'not-configured', missing: 'password' }, 503)
  if (password.length < MIN_PASSWORD_LENGTH) return json({ error: 'not-configured', missing: 'password-length' }, 503)
  const db = getDb(env)
  if (!db) return json({ error: 'not-configured', missing: 'database' }, 503)

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return json({ error: 'bad-request' }, 400)
  }

  try {
    await ensureSchema(db)
    const now = Date.now()
    const action = body.action

    if (action === 'login') {
      const ip = clientIp(request)
      const [{ count }] = await db.query<{ count: number }>(
        `SELECT count(*)::int AS count FROM admin_login_failures WHERE ip = $1 AND at > now() - make_interval(mins => $2)`,
        [ip, LOCKOUT_MINUTES],
      )
      if (count >= MAX_FAILURES) return json({ error: 'too-many-attempts', minutes: LOCKOUT_MINUTES }, 429)
      if (!sameText(str(body.password, 200), password)) {
        await db.query(`INSERT INTO admin_login_failures (ip) VALUES ($1)`, [ip])
        return json({ error: 'wrong-password' }, 401)
      }
      await db.query(`DELETE FROM admin_login_failures WHERE ip = $1 OR at < now() - interval '1 day'`, [ip])
      return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie(newToken(password, now), SESSION_MS / 1000) })
    }

    if (action === 'logout') return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie('', 0) })

    const authenticated = validToken(password, readCookie(request, COOKIE), now)
    if (action === 'session') return json({ authenticated })
    if (!authenticated) return json({ error: 'signed-out' }, 401)

    switch (action) {
      case 'load':
        return json(await loadData(db))

      case 'import':
        return json(await importFromStripe(db, env))

      case 'saveTeam': {
        const team = teamInput(body)
        const id = str(body.id, 40)
        if (id) {
          check(UUID.test(id), 'Team not found.')
          await db.query(
            `UPDATE teams SET name = $2, coach_name = $3, coach_email = $4, coach_phone = $5 WHERE id = $1`,
            [id, team.name, team.coachName, team.coachEmail, team.coachPhone],
          )
        } else {
          const division = str(body.division, 10)
          check(DIVISIONS.has(division), 'Choose a division.')
          await db.query(
            `INSERT INTO teams (id, division, name, coach_name, coach_email, coach_phone) VALUES ($1, $2, $3, $4, $5, $6)`,
            [randomUUID(), division, team.name, team.coachName, team.coachEmail, team.coachPhone],
          )
        }
        return json({ ok: true })
      }

      case 'deleteTeam': {
        const id = str(body.id, 40)
        check(UUID.test(id), 'Team not found.')
        const [team] = await db.query<{ registration_id: string | null }>(`SELECT registration_id FROM teams WHERE id = $1`, [id])
        check(team, 'Team not found.')
        check(!team.registration_id, 'Teams that registered and paid can’t be deleted. Move their added players instead.')
        // Its players go back to the pool.
        await db.batch([
          [`UPDATE registrations SET team_id = NULL WHERE team_id = $1`, [id]],
          [`DELETE FROM teams WHERE id = $1 AND registration_id IS NULL`, [id]],
        ])
        return json({ ok: true })
      }

      case 'assign': {
        const registrationId = str(body.registrationId, 200)
        const teamId = body.teamId === null ? null : str(body.teamId, 40)
        check(SESSION_ID.test(registrationId), 'Player not found.')
        check(teamId === null || UUID.test(teamId), 'Team not found.')
        const rows = await db.query(
          `UPDATE registrations r SET team_id = $2
           WHERE r.id = $1 AND r.kind = 'player'
             AND ($2::uuid IS NULL OR EXISTS (SELECT 1 FROM teams t WHERE t.id = $2::uuid AND t.division = r.division))
           RETURNING r.id`,
          [registrationId, teamId],
        )
        check(rows.length === 1, 'That player can’t join that team (different division?).')
        return json({ ok: true })
      }

      case 'createTeams': {
        const division = str(body.division, 10)
        check(DIVISIONS.has(division), 'Choose a division.')
        check(Array.isArray(body.teams) && body.teams.length > 0 && body.teams.length <= 40, 'Nothing to create.')
        const statements: Array<[string, unknown[]]> = []
        for (const raw of body.teams as Array<Record<string, unknown>>) {
          const name = str(raw.name, 80)
          const playerIds = Array.isArray(raw.playerIds) ? raw.playerIds.filter((id) => SESSION_ID.test(String(id))) : []
          check(name, 'Every team needs a name.')
          const id = randomUUID()
          statements.push([`INSERT INTO teams (id, division, name) VALUES ($1, $2, $3)`, [id, division, name]])
          if (playerIds.length) {
            statements.push([
              `UPDATE registrations SET team_id = $1 WHERE id = ANY($2::text[]) AND kind = 'player' AND division = $3`,
              [id, playerIds, division],
            ])
          }
        }
        await db.batch(statements)
        return json({ ok: true })
      }

      case 'updateRegistration': {
        const id = str(body.id, 200)
        check(SESSION_ID.test(id), 'Registration not found.')
        if (typeof body.notes === 'string') {
          await db.query(`UPDATE registrations SET notes = $2 WHERE id = $1`, [id, str(body.notes, 2000)])
        }
        if (body.status === 'active' || body.status === 'withdrawn') {
          // A withdrawn player leaves their team.
          await db.query(
            `UPDATE registrations SET status = $2, team_id = CASE WHEN $2 = 'withdrawn' THEN NULL ELSE team_id END WHERE id = $1`,
            [id, body.status],
          )
        }
        return json({ ok: true })
      }

      case 'updateLead': {
        const id = str(body.id, 40)
        check(UUID.test(id), 'Lead not found.')
        if (typeof body.notes === 'string') {
          await db.query(`UPDATE leads SET notes = $2 WHERE id = $1`, [id, str(body.notes, 2000)])
        }
        if (LEAD_STATUSES.some((s) => s.value === body.status)) {
          await db.query(`UPDATE leads SET status = $2 WHERE id = $1`, [id, body.status])
        }
        return json({ ok: true })
      }

      case 'notifyTeam':
        return json(await notifyTeam(db, env, str(body.teamId, 40)))

      case 'waiverDocs': {
        const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === 'string' && UUID.test(id)) : []
        return json({ waivers: await waiverDocs(db, ids) })
      }

      case 'agreementDocs': {
        const ids = Array.isArray(body.waiverIds) ? body.waiverIds.filter((id): id is string => typeof id === 'string' && UUID.test(id)) : []
        return json({ agreements: await agreementDocs(db, ids) })
      }

      default:
        return json({ error: 'bad-request' }, 400)
    }
  } catch (error) {
    if (error instanceof BadRequest) return json({ error: 'invalid', message: error.message }, 400)
    console.error('Admin action failed:', body.action, error)
    return json({ error: 'server-error' }, 500)
  }
}
