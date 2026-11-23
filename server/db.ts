/**
 * Postgres (Neon, added through Vercel → Storage) for the admin dashboard: paid registrations,
 * teams, contact-form leads, winter training survey responses, signed facility waivers and
 * ElevatePro player agreements. Stripe stays the record of payments; this is the working copy
 * the league organizes teams from.
 *
 * Tables are created on first use (CREATE … IF NOT EXISTS), so there's no migration step.
 * Needs DATABASE_URL (set by the Neon integration). Without it, everything here is skipped and
 * the site keeps working — registrations still email the league.
 */
import { neon } from '@neondatabase/serverless'

export type Row = Record<string, unknown>

export interface Db {
  query<T = Row>(text: string, params?: unknown[]): Promise<T[]>
  /** Runs the statements in order as one transaction: all of them apply, or none. */
  batch(statements: Array<[text: string, params?: unknown[]]>): Promise<void>
}

export interface DbEnv {
  DATABASE_URL?: string
  POSTGRES_URL?: string
}

let override: Db | null = null
let cached: { url: string; db: Db } | null = null

/** Tests swap in another Postgres (e.g. PGlite). */
export function setDbForTesting(db: Db | null) {
  override = db
  schemaReady = null
}

export function getDb(env: DbEnv): Db | null {
  if (override) return override
  const url = env.DATABASE_URL ?? env.POSTGRES_URL
  if (!url) return null
  if (cached?.url !== url) {
    const sql = neon(url)
    cached = {
      url,
      db: {
        query: async <T,>(text: string, params: unknown[] = []) => (await sql.query(text, params)) as T[],
        batch: async (statements) => {
          await sql.transaction((txn) => statements.map(([text, params = []]) => txn.query(text, params)))
        },
      },
    }
  }
  return cached.db
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS registrations (
    id text PRIMARY KEY,
    kind text NOT NULL,
    division text NOT NULL,
    locale text NOT NULL DEFAULT 'en',
    email text NOT NULL,
    phone text NOT NULL DEFAULT '',
    fields jsonb NOT NULL,
    amount_cents integer,
    currency text,
    paid_at timestamptz,
    payment_intent_id text,
    livemode boolean NOT NULL DEFAULT false,
    status text NOT NULL DEFAULT 'active',
    notes text NOT NULL DEFAULT '',
    team_id uuid,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS teams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    division text NOT NULL,
    name text NOT NULL,
    registration_id text UNIQUE,
    coach_name text NOT NULL DEFAULT '',
    coach_email text NOT NULL DEFAULT '',
    coach_phone text NOT NULL DEFAULT '',
    notified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id text UNIQUE,
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    interest text NOT NULL,
    age_group text NOT NULL DEFAULT '',
    message text NOT NULL DEFAULT '',
    consent boolean NOT NULL DEFAULT false,
    locale text NOT NULL DEFAULT 'en',
    status text NOT NULL DEFAULT 'new',
    notes text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS admin_login_failures (
    ip text NOT NULL,
    at timestamptz NOT NULL DEFAULT now()
  )`,
  // Added for the landing pages' information requests.
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS team_name text NOT NULL DEFAULT ''`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'contact-form'`,
  `ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm jsonb`,
  // Winter training survey (/winter-survey). `answers` holds every answer by question name
  // (src/winter-survey/surveyForm.ts); multiple-choice answers are JSON arrays.
  `CREATE TABLE IF NOT EXISTS winter_survey_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id text UNIQUE,
    player_name text NOT NULL,
    parent_name text NOT NULL,
    parent_email text NOT NULL,
    parent_phone text NOT NULL,
    date_of_birth text NOT NULL,
    answers jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  // Facility waivers signed online (/waiver). `fields` holds the form's answers; signatures are
  // { kind: 'drawn', image: PNG data URL } or { kind: 'typed', name }. `waiver_text` is the exact
  // wording signed, and the IP address and browser are kept as a record of the e-signature.
  `CREATE TABLE IF NOT EXISTS waivers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id text UNIQUE,
    waiver_version text NOT NULL,
    participant_name text NOT NULL,
    date_of_birth text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    fields jsonb NOT NULL,
    participant_signature jsonb NOT NULL,
    guardian_signature jsonb,
    esign_consent boolean NOT NULL,
    waiver_text text NOT NULL,
    signer_ip text NOT NULL DEFAULT '',
    user_agent text NOT NULL DEFAULT '',
    signed_at timestamptz NOT NULL DEFAULT now()
  )`,
  // ElevatePro's own player agreement, signed in the same visit as a facility waiver and kept as a
  // separate record. `signature_source` says whether the signer reused their waiver signature
  // ('waiver-guardian' / 'waiver-participant') or signed it separately ('separate').
  `CREATE TABLE IF NOT EXISTS player_agreements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    waiver_id uuid UNIQUE REFERENCES waivers (id),
    agreement_version text NOT NULL,
    player_name text NOT NULL,
    date_of_birth text NOT NULL,
    player_age integer,
    signer_role text NOT NULL,
    signer_name text NOT NULL,
    contact_phone text NOT NULL,
    emergency_contact text NOT NULL,
    emergency_phone text NOT NULL,
    media_permission text NOT NULL DEFAULT '',
    role_acknowledged boolean NOT NULL,
    signature jsonb NOT NULL,
    signature_source text NOT NULL,
    agreement_text text NOT NULL,
    signer_ip text NOT NULL DEFAULT '',
    user_agent text NOT NULL DEFAULT '',
    signed_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS registrations_division ON registrations (division, kind)`,
  `CREATE INDEX IF NOT EXISTS admin_login_failures_ip ON admin_login_failures (ip, at)`,
]

let schemaReady: Promise<void> | null = null

/** Creates the tables once per server instance. */
export function ensureSchema(db: Db): Promise<void> {
  schemaReady ??= (async () => {
    for (const statement of SCHEMA) await db.query(statement)
  })().catch((error) => {
    schemaReady = null
    throw error
  })
  return schemaReady
}

// ---------- writes from the public site ----------

export interface RegistrationRecord {
  id: string
  kind: 'team' | 'player'
  locale: string
  email: string
  fields: Record<string, string>
  amountCents: number | null
  currency: string
  paidAt: Date
  paymentIntentId: string | null
  livemode: boolean
}

/**
 * Saves a paid registration (idempotent: a repeat is ignored). A team registration also
 * creates its team, so it appears in the team builder.
 */
export async function saveRegistration(db: Db, reg: RegistrationRecord): Promise<void> {
  await ensureSchema(db)
  const f = reg.fields
  const statements: Array<[string, unknown[]]> = [
    [
      `INSERT INTO registrations
         (id, kind, division, locale, email, phone, fields, amount_cents, currency, paid_at, payment_intent_id, livemode)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO NOTHING`,
      [
        reg.id,
        reg.kind,
        f.division ?? '',
        reg.locale,
        reg.email,
        f.phone ?? '',
        JSON.stringify(f),
        reg.amountCents,
        reg.currency,
        reg.paidAt.toISOString(),
        reg.paymentIntentId,
        reg.livemode,
      ],
    ],
  ]
  if (reg.kind === 'team') {
    statements.push([
      `INSERT INTO teams (division, name, registration_id, coach_name, coach_email, coach_phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (registration_id) DO NOTHING`,
      [f.division ?? '', f.teamName || 'Team', reg.id, f.coachName ?? '', reg.email, f.phone ?? ''],
    ])
  }
  await db.batch(statements)
}

export interface LeadRecord {
  submissionId: string
  /** "contact-form", or the landing page path, e.g. "/register-a-team". */
  source: string
  teamName: string
  /** UTM campaign tags from the landing page URL. */
  utm: Record<string, string>
  name: string
  email: string
  phone: string
  interest: string
  ageGroup: string
  message: string
  consent: boolean
  locale: string
}

export async function saveLead(db: Db, lead: LeadRecord): Promise<void> {
  await ensureSchema(db)
  await db.query(
    `INSERT INTO leads (submission_id, name, email, phone, interest, age_group, message, consent, locale, team_name, source, utm)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (submission_id) DO NOTHING`,
    [
      lead.submissionId,
      lead.name,
      lead.email,
      lead.phone,
      lead.interest,
      lead.ageGroup,
      lead.message,
      lead.consent,
      lead.locale,
      lead.teamName,
      lead.source,
      Object.keys(lead.utm).length ? JSON.stringify(lead.utm) : null,
    ],
  )
}

export interface WinterSurveyRecord {
  submissionId: string
  /** Every answer, already cleaned and validated (src/winter-survey/surveyForm.ts). */
  answers: Record<string, string | string[]>
}

/** Saves one survey response. A repeat of the same submission is ignored. */
export async function saveWinterSurveyResponse(db: Db, response: WinterSurveyRecord): Promise<void> {
  await ensureSchema(db)
  const a = response.answers
  const str = (name: string) => (typeof a[name] === 'string' ? (a[name] as string) : '')
  await db.query(
    `INSERT INTO winter_survey_responses
       (submission_id, player_name, parent_name, parent_email, parent_phone, date_of_birth, answers)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (submission_id) DO NOTHING`,
    [
      response.submissionId,
      str('playerName'),
      str('parentName'),
      str('parentEmail'),
      str('parentPhone'),
      str('dateOfBirth'),
      JSON.stringify(a),
    ],
  )
}

export interface WaiverRecord {
  submissionId: string
  version: string
  /** The form's answers, already cleaned and validated (src/waiver/waiverForm.ts). */
  fields: Record<string, string>
  participantSignature: unknown
  guardianSignature: unknown | null
  esignConsent: boolean
  /** The exact waiver wording signed. */
  text: string
  signerIp: string
  userAgent: string
}

export interface AgreementRecord {
  version: string
  playerName: string
  dateOfBirth: string
  playerAge: number | null
  signerRole: 'guardian' | 'adult'
  signerName: string
  contactPhone: string
  emergencyContact: string
  emergencyPhone: string
  mediaPermission: '' | 'yes' | 'no'
  roleAcknowledged: boolean
  signature: unknown
  signatureSource: 'waiver-guardian' | 'waiver-participant' | 'separate'
  /** The exact agreement wording signed. */
  text: string
}

/**
 * Saves a signed facility waiver and, when given, the ElevatePro agreement signed with it, in one
 * transaction: both are saved, or neither. Returns the waiver's id and signing time. A repeat of
 * the same submission returns what was already saved.
 */
export async function saveWaiver(db: Db, w: WaiverRecord, agreement?: AgreementRecord): Promise<{ id: string; signedAt: Date }> {
  await ensureSchema(db)
  const waiverParams = [
    w.submissionId,
    w.version,
    w.fields.name ?? '',
    w.fields.dob ?? '',
    w.fields.email ?? '',
    w.fields.eveningPhone ?? '',
    JSON.stringify(w.fields),
    JSON.stringify(w.participantSignature),
    w.guardianSignature ? JSON.stringify(w.guardianSignature) : null,
    w.esignConsent,
    w.text,
    w.signerIp,
    w.userAgent,
  ]
  const statements: Array<[string, unknown[]]> = [
    [
      `INSERT INTO waivers (submission_id, waiver_version, participant_name, date_of_birth, email, phone, fields,
         participant_signature, guardian_signature, esign_consent, waiver_text, signer_ip, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (submission_id) DO NOTHING`,
      waiverParams,
    ],
  ]
  if (agreement) {
    // Linked to the waiver saved just above (or on an earlier try of the same submission).
    statements.push([
      `INSERT INTO player_agreements (waiver_id, agreement_version, player_name, date_of_birth, player_age, signer_role,
         signer_name, contact_phone, emergency_contact, emergency_phone, media_permission, role_acknowledged, signature,
         signature_source, agreement_text, signer_ip, user_agent, signed_at)
       SELECT id, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, signed_at
       FROM waivers WHERE submission_id = $1
       ON CONFLICT (waiver_id) DO NOTHING`,
      [
        w.submissionId,
        agreement.version,
        agreement.playerName,
        agreement.dateOfBirth,
        agreement.playerAge,
        agreement.signerRole,
        agreement.signerName,
        agreement.contactPhone,
        agreement.emergencyContact,
        agreement.emergencyPhone,
        agreement.mediaPermission,
        agreement.roleAcknowledged,
        JSON.stringify(agreement.signature),
        agreement.signatureSource,
        agreement.text,
        w.signerIp,
        w.userAgent,
      ],
    ])
  }
  await db.batch(statements)
  const [row] = await db.query<{ id: string; signed_at: unknown }>(`SELECT id, signed_at FROM waivers WHERE submission_id = $1`, [
    w.submissionId,
  ])
  return { id: String(row.id), signedAt: new Date(row.signed_at as string | Date) }
}
