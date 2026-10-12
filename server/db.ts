/**
 * Postgres (Neon, added through Vercel → Storage) for the admin dashboard: paid registrations,
 * teams and contact-form leads. Stripe stays the record of payments; this is the working copy
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
    `INSERT INTO leads (submission_id, name, email, phone, interest, age_group, message, consent, locale)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (submission_id) DO NOTHING`,
    [lead.submissionId, lead.name, lead.email, lead.phone, lead.interest, lead.ageGroup, lead.message, lead.consent, lead.locale],
  )
}
