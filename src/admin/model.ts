// Admin dashboard data shapes and team-building logic. Shared by the dashboard (browser) and
// server/admin.ts, so imports use `.js` extensions and nothing here may touch React or the DOM.
import type { Locale } from '../i18n/locale.js'
import { formFields } from '../registration/forms.js'

export interface AdminRegistration {
  /** Stripe Checkout Session id */
  id: string
  kind: 'team' | 'player'
  division: string
  locale: Locale
  email: string
  phone: string
  /** Every form answer, as submitted (see src/registration/forms.ts for the names). */
  fields: Record<string, string>
  amountCents: number | null
  currency: string | null
  paidAt: string | null
  paymentIntentId: string | null
  livemode: boolean
  status: 'active' | 'withdrawn'
  notes: string
  /** Players: the team they're placed on. */
  teamId: string | null
}

export interface AdminTeam {
  id: string
  division: string
  name: string
  /** Set for teams that registered (and paid) as a team; null for teams the league formed. */
  registrationId: string | null
  coachName: string
  coachEmail: string
  coachPhone: string
  notifiedAt: string | null
  createdAt: string
}

export type LeadStatus = 'new' | 'contacted' | 'registered' | 'not-interested'

export interface AdminLead {
  id: string
  name: string
  email: string
  phone: string
  interest: string
  ageGroup: string
  message: string
  consent: boolean
  locale: Locale
  status: LeadStatus
  notes: string
  createdAt: string
  /** Team inquiries from /register-a-team. */
  teamName: string
  /** "contact-form", or the landing page path, e.g. "/register-a-team". */
  source: string
  /** UTM campaign tags from the landing page URL. */
  utm: Record<string, string>
}

/** Short label for where a lead came from. */
export const leadSourceLabel = (source: string) =>
  ({
    'contact-form': 'Contact form',
    '/join-as-a-player': 'Join as a player page',
    '/register-a-team': 'Register a team page',
    '/es/join-as-a-player': 'Join as a player page (Spanish)',
    '/es/register-a-team': 'Register a team page (Spanish)',
  })[source] ?? source

export interface AdminData {
  registrations: AdminRegistration[]
  teams: AdminTeam[]
  leads: AdminLead[]
}

export const LEAD_STATUSES: Array<{ value: LeadStatus; label: string }> = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'registered', label: 'Registered' },
  { value: 'not-interested', label: 'Not interested' },
]

export const playerName = (r: AdminRegistration) =>
  `${r.fields.playerFirstName ?? ''} ${r.fields.playerLastName ?? ''}`.trim() || '(no name)'

/** Whole years old on `on` (default today) for a YYYY-MM-DD birth date. */
export function ageOn(dateOfBirth: string, on: Date = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth)
  if (!match) return null
  const [y, m, d] = match.slice(1).map(Number)
  let age = on.getFullYear() - y
  if (on.getMonth() + 1 < m || (on.getMonth() + 1 === m && on.getDate() < d)) age -= 1
  return age
}

const EXPERIENCE_OPTIONS = formFields.player.find((f) => f.name === 'experience')?.options ?? []

/**
 * Experience key ("new", "recreational", "competitive", "unsure" or ""). Registrations store the
 * English label ("Competitive or club"), so both forms are accepted.
 */
export function experienceKey(value: string | undefined): string {
  const v = (value ?? '').trim().toLowerCase()
  return EXPERIENCE_OPTIONS.find((o) => o.value === v || o.label.en.toLowerCase() === v)?.value ?? ''
}

/** "Competitive or club" for display, from either form. */
export const experienceLabel = (value: string | undefined) =>
  EXPERIENCE_OPTIONS.find((o) => o.value === experienceKey(value))?.label.en ?? ''

// ---------- suggesting teams ----------

export interface PoolPlayer {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  /** "new" | "recreational" | "competitive" | "unsure" | "" */
  experience: string
  teammateRequest: string
}

/** Rough strength used only to spread experience evenly. */
const SKILL: Record<string, number> = { competitive: 3, recreational: 2, unsure: 1.5, new: 1 }
const skill = (p: PoolPlayer) => SKILL[experienceKey(p.experience)] ?? 1.5

const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const hasWords = (haystack: string, words: string) => words !== '' && ` ${haystack} `.includes(` ${words} `)

/**
 * Players who asked to play together, as groups of ids. A request matches a pool player by full
 * name, or by first name alone when only one player in the pool has that first name.
 */
export function teammateGroups(players: PoolPlayer[]): string[][] {
  const parent = new Map(players.map((p) => [p.id, p.id]))
  const find = (id: string): string => {
    const up = parent.get(id)!
    if (up === id) return id
    const root = find(up)
    parent.set(id, root)
    return root
  }
  const union = (a: string, b: string) => parent.set(find(a), find(b))

  const firstNameCount = new Map<string, number>()
  for (const p of players) {
    const first = normalize(p.firstName)
    firstNameCount.set(first, (firstNameCount.get(first) ?? 0) + 1)
  }

  for (const asker of players) {
    const request = normalize(asker.teammateRequest)
    if (!request) continue
    for (const other of players) {
      if (other.id === asker.id) continue
      const first = normalize(other.firstName)
      const full = normalize(`${other.firstName} ${other.lastName}`)
      if (hasWords(request, full) || (firstNameCount.get(first) === 1 && hasWords(request, first))) {
        union(asker.id, other.id)
      }
    }
  }

  const groups = new Map<string, string[]>()
  for (const p of players) {
    const root = find(p.id)
    groups.set(root, [...(groups.get(root) ?? []), p.id])
  }
  return [...groups.values()]
}

/**
 * Splits a pool into `teamCount` teams of near-equal size, spreading experience and age evenly
 * and keeping teammate requests together. Returns player ids per team.
 */
export function suggestTeams(players: PoolPlayer[], teamCount: number): string[][] {
  const count = Math.max(1, Math.floor(teamCount))
  const byId = new Map(players.map((p) => [p.id, p]))
  const units = teammateGroups(players).map((ids) => {
    const members = ids.map((id) => byId.get(id)!)
    return {
      ids,
      skill: members.reduce((sum, p) => sum + skill(p), 0),
      // oldest birth date first, so ages spread too
      dob: members.map((p) => p.dateOfBirth).sort()[0] ?? '',
    }
  })
  // Biggest groups first (hardest to fit), then strongest, then oldest.
  units.sort((a, b) => b.ids.length - a.ids.length || b.skill / b.ids.length - a.skill / a.ids.length || a.dob.localeCompare(b.dob))

  const teams = Array.from({ length: count }, () => ({ ids: [] as string[], skill: 0 }))
  for (const unit of units) {
    const target = teams.reduce((best, team) =>
      team.ids.length < best.ids.length || (team.ids.length === best.ids.length && team.skill < best.skill) ? team : best,
    )
    target.ids.push(...unit.ids)
    target.skill += unit.skill
  }
  return teams.map((t) => t.ids)
}
