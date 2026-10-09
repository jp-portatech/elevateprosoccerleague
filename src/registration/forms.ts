// Shared by the browser and the Vercel functions in api/ (which re-validate every submission),
// so imports use `.js` extensions and nothing here may touch React or the DOM.
import { eligibilityLabel, eligibleDivisions, formatIsoDate } from '../config/derived.js'
import { league } from '../config/league.js'
import type { RegistrationKind } from './types.js'

export type FieldType = 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea'

export interface FieldDef {
  name: string
  label: string
  type: FieldType
  required: boolean
  /** Message shown when a required field is left empty. */
  requiredMessage?: string
  hint?: string
  autoComplete?: string
  options?: Array<{ value: string; label: string }>
  placeholderOption?: string
  maxLength?: number
  /** Share a row with the neighbouring half-width field on wider screens. */
  half?: boolean
}

export type FormValues = Record<string, string>
export type FormErrors = Record<string, string>

const divisionField = (hint: string, showEligibility: boolean): FieldDef => ({
  name: 'division',
  label: 'Division',
  type: 'select',
  required: true,
  requiredMessage: 'Select a division.',
  hint,
  options: league.divisions.map((d) => {
    const eligibility = showEligibility ? eligibilityLabel(d, 'short') : null
    return { value: d.id, label: eligibility ? `${d.id} — ${eligibility.replace('Born', 'born')}` : d.id }
  }),
  placeholderOption: 'Select a division',
})

export const formFields: Record<RegistrationKind, FieldDef[]> = {
  team: [
    divisionField('The age division your team will play in.', false),
    {
      name: 'teamName',
      label: 'Team name',
      type: 'text',
      required: true,
      requiredMessage: 'Enter your team name.',
      autoComplete: 'organization',
      maxLength: 100,
    },
    {
      name: 'coachName',
      label: 'Coach/manager name',
      type: 'text',
      required: true,
      requiredMessage: 'Enter the coach or manager’s name.',
      autoComplete: 'name',
      maxLength: 100,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      requiredMessage: 'Enter an email address.',
      autoComplete: 'email',
      maxLength: 254,
      half: true,
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'tel',
      required: true,
      requiredMessage: 'Enter a phone number.',
      hint: 'Include area code.',
      autoComplete: 'tel',
      maxLength: 30,
      half: true,
    },
    {
      name: 'clubName',
      label: 'Club or academy name',
      type: 'text',
      required: false,
      hint: 'If your team plays for a club or academy.',
      maxLength: 100,
    },
    {
      name: 'roster',
      label: 'Roster information',
      type: 'textarea',
      required: false,
      hint: 'Player names or anything else you’d like ElevatePro to know about your roster.',
      maxLength: 2000,
    },
  ],
  player: [
    divisionField('The age division you’d like your player to join.', true),
    {
      name: 'playerFirstName',
      label: 'Player first name',
      type: 'text',
      required: true,
      requiredMessage: 'Enter the player’s first name.',
      maxLength: 60,
      half: true,
    },
    {
      name: 'playerLastName',
      label: 'Player last name',
      type: 'text',
      required: true,
      requiredMessage: 'Enter the player’s last name.',
      maxLength: 60,
      half: true,
    },
    {
      name: 'dateOfBirth',
      label: 'Date of birth',
      type: 'date',
      required: true,
      requiredMessage: 'Enter the player’s date of birth.',
      hint: 'Used to confirm the player is eligible for the division.',
    },
    {
      name: 'guardianName',
      label: 'Parent/guardian name',
      type: 'text',
      required: true,
      requiredMessage: 'Enter the parent or guardian’s name.',
      autoComplete: 'name',
      maxLength: 100,
    },
    {
      name: 'guardianEmail',
      label: 'Parent/guardian email',
      type: 'email',
      required: true,
      requiredMessage: 'Enter the parent or guardian’s email address.',
      autoComplete: 'email',
      maxLength: 254,
      half: true,
    },
    {
      name: 'phone',
      label: 'Phone',
      type: 'tel',
      required: true,
      requiredMessage: 'Enter a phone number.',
      hint: 'Include area code.',
      autoComplete: 'tel',
      maxLength: 30,
      half: true,
    },
    {
      name: 'experience',
      label: 'Experience level',
      type: 'select',
      required: false,
      options: [
        { value: 'new', label: 'New to soccer' },
        { value: 'recreational', label: 'Recreational' },
        { value: 'competitive', label: 'Competitive or club' },
        { value: 'unsure', label: 'Not sure' },
      ],
      placeholderOption: 'Choose an option',
    },
  ],
}

export function fieldId(idPrefix: string, name: string) {
  return `${idPrefix}-${name}`
}

export function emptyValues(kind: RegistrationKind): FormValues {
  return Object.fromEntries(formFields[kind].map((f) => [f.name, '']))
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Today as YYYY-MM-DD in the visitor's local time zone. */
export function todayIso(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function isRealDate(iso: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return false
  const [y, m, d] = match.slice(1).map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

/** Returns an error message, or null when the value is acceptable. */
export function validateField(field: FieldDef, raw: string): string | null {
  const value = raw.trim()
  if (!value) {
    return field.required ? (field.requiredMessage ?? `Enter ${field.label.toLowerCase()}.`) : null
  }
  if (field.maxLength && value.length > field.maxLength) {
    return `${field.label} must be ${field.maxLength} characters or fewer.`
  }
  switch (field.type) {
    case 'email':
      return EMAIL_PATTERN.test(value)
        ? null
        : 'Enter an email address in the correct format, like name@example.com.'
    case 'tel': {
      const digits = value.replace(/\D/g, '').length
      return /^[\d\s()+.-]+$/.test(value) && digits >= 10 && digits <= 15
        ? null
        : 'Enter a phone number with area code, like 801 555 0100.'
    }
    case 'date':
      // Only checks that the date is real and in the past. Division eligibility is not
      // validated here because the league has not published birth-year cutoffs.
      if (!isRealDate(value) || value < '1900-01-01') return 'Enter a real date of birth.'
      if (value >= todayIso()) return 'Date of birth must be in the past.'
      return null
    case 'select':
      return field.options?.some((o) => o.value === value) ? null : `Select a valid ${field.label.toLowerCase()}.`
    default:
      return null
  }
}

/** Player is older than the selected division allows ("no older than" cutoff). */
function divisionAgeError(divisionId: string, dateOfBirth: string): string | null {
  const division = league.divisions.find((d) => d.id === divisionId)
  if (!division?.bornOnOrAfter || dateOfBirth >= division.bornOnOrAfter) return null
  const eligible = eligibleDivisions(dateOfBirth).map((d) => d.id)
  const cutoff = formatIsoDate(division.bornOnOrAfter)
  return eligible.length
    ? `${division.id} players must be born on or after ${cutoff}. Based on this date of birth, choose ${eligible.length > 1 ? `${eligible.slice(0, -1).join(', ')} or ${eligible.at(-1)}` : eligible[0]}.`
    : `This player is older than every division allows. ${division.id} players must be born on or after ${cutoff}.`
}

export function validateForm(kind: RegistrationKind, values: FormValues): FormErrors {
  const errors: FormErrors = {}
  for (const field of formFields[kind]) {
    const message = validateField(field, values[field.name] ?? '')
    if (message) errors[field.name] = message
  }
  if (kind === 'player' && !errors.division && !errors.dateOfBirth) {
    const ageError = divisionAgeError(values.division, values.dateOfBirth.trim())
    if (ageError) errors.dateOfBirth = ageError
  }
  return errors
}
