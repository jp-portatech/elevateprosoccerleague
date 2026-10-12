// Shared by the browser and the Vercel functions in api/ (which re-validate every submission),
// so imports use `.js` extensions and nothing here may touch React or the DOM.
import { eligibilityText, eligibleDivisions, formatIsoDate } from '../config/derived.js'
import { league } from '../config/league.js'
import { intlLocale, localized, type Locale, type Localized } from '../i18n/locale.js'
import type { RegistrationKind } from './types.js'

export type FieldType = 'text' | 'email' | 'tel' | 'date' | 'select' | 'textarea' | 'checkbox'

export interface FieldDef {
  name: string
  label: Localized
  type: FieldType
  required: boolean
  /** Message shown when a required field is left empty. */
  requiredMessage?: Localized
  hint?: Localized
  autoComplete?: string
  options?: Array<{ value: string; label: Localized }>
  placeholderOption?: Localized
  maxLength?: number
  /** Share a row with the neighbouring half-width field on wider screens. */
  half?: boolean
}

export type FormValues = Record<string, string>
export type FormErrors = Record<string, string>

/** One option per division, e.g. "U10 — born on or after Aug 1, 2016" when `showEligibility`. */
export const divisionOptions = (showEligibility: boolean): NonNullable<FieldDef['options']> =>
  league.divisions.map((d) => {
    const label = (locale: Locale) => {
      const eligibility = showEligibility ? eligibilityText(d, locale, true) : null
      return eligibility ? `${d.id} — ${eligibility}` : d.id
    }
    return { value: d.id, label: { en: label('en'), es: label('es') } }
  })

const divisionField = (hint: Localized, showEligibility: boolean): FieldDef => ({
  name: 'division',
  label: { en: 'Division', es: 'División' },
  type: 'select',
  required: true,
  requiredMessage: { en: 'Select a division.', es: 'Selecciona una división.' },
  hint,
  options: divisionOptions(showEligibility),
  placeholderOption: { en: 'Select a division', es: 'Selecciona una división' },
})

export const phoneField: FieldDef = {
  name: 'phone',
  label: { en: 'Phone', es: 'Teléfono' },
  type: 'tel',
  required: true,
  requiredMessage: { en: 'Enter a phone number.', es: 'Escribe un número de teléfono.' },
  hint: { en: 'Include area code.', es: 'Incluye el código de área.' },
  autoComplete: 'tel',
  maxLength: 30,
  half: true,
}

export const formFields: Record<RegistrationKind, FieldDef[]> = {
  team: [
    divisionField(
      { en: 'The age division your team will play in.', es: 'La división de edad en la que jugará tu equipo.' },
      false,
    ),
    {
      name: 'teamName',
      label: { en: 'Team name', es: 'Nombre del equipo' },
      type: 'text',
      required: true,
      requiredMessage: { en: 'Enter your team name.', es: 'Escribe el nombre de tu equipo.' },
      autoComplete: 'organization',
      maxLength: 100,
    },
    {
      name: 'coachName',
      label: { en: 'Coach/manager name', es: 'Nombre del entrenador o encargado' },
      type: 'text',
      required: true,
      requiredMessage: {
        en: 'Enter the coach or manager’s name.',
        es: 'Escribe el nombre del entrenador o encargado.',
      },
      autoComplete: 'name',
      maxLength: 100,
    },
    {
      name: 'email',
      label: { en: 'Email', es: 'Correo electrónico' },
      type: 'email',
      required: true,
      requiredMessage: { en: 'Enter an email address.', es: 'Escribe un correo electrónico.' },
      autoComplete: 'email',
      maxLength: 254,
      half: true,
    },
    phoneField,
    {
      name: 'clubName',
      label: { en: 'Club or academy name', es: 'Nombre del club o academia' },
      type: 'text',
      required: false,
      hint: { en: 'If your team plays for a club or academy.', es: 'Si tu equipo juega para un club o academia.' },
      maxLength: 100,
    },
    {
      name: 'roster',
      label: { en: 'Roster information', es: 'Lista de jugadores' },
      type: 'textarea',
      required: false,
      hint: {
        en: 'Player names or anything else you’d like ElevatePro to know about your roster.',
        es: 'Nombres de los jugadores o cualquier otro dato de tu equipo que quieras que ElevatePro sepa.',
      },
      maxLength: 2000,
    },
  ],
  player: [
    divisionField(
      {
        en: 'The age division you’d like your player to join.',
        es: 'La división de edad en la que quieres que juegue tu jugador.',
      },
      true,
    ),
    {
      name: 'playerFirstName',
      label: { en: 'Player first name', es: 'Nombre del jugador' },
      type: 'text',
      required: true,
      requiredMessage: { en: 'Enter the player’s first name.', es: 'Escribe el nombre del jugador.' },
      maxLength: 60,
      half: true,
    },
    {
      name: 'playerLastName',
      label: { en: 'Player last name', es: 'Apellido del jugador' },
      type: 'text',
      required: true,
      requiredMessage: { en: 'Enter the player’s last name.', es: 'Escribe el apellido del jugador.' },
      maxLength: 60,
      half: true,
    },
    {
      name: 'dateOfBirth',
      label: { en: 'Date of birth', es: 'Fecha de nacimiento' },
      type: 'date',
      required: true,
      requiredMessage: {
        en: 'Enter the player’s date of birth.',
        es: 'Escribe la fecha de nacimiento del jugador.',
      },
      hint: {
        en: 'Used to confirm the player is eligible for the division.',
        es: 'Sirve para confirmar que el jugador puede jugar en la división.',
      },
    },
    {
      name: 'guardianName',
      label: { en: 'Parent/guardian name', es: 'Nombre del padre, madre o tutor' },
      type: 'text',
      required: true,
      requiredMessage: {
        en: 'Enter the parent or guardian’s name.',
        es: 'Escribe el nombre del padre, madre o tutor.',
      },
      autoComplete: 'name',
      maxLength: 100,
    },
    {
      name: 'guardianEmail',
      label: { en: 'Parent/guardian email', es: 'Correo del padre, madre o tutor' },
      type: 'email',
      required: true,
      requiredMessage: {
        en: 'Enter the parent or guardian’s email address.',
        es: 'Escribe el correo electrónico del padre, madre o tutor.',
      },
      autoComplete: 'email',
      maxLength: 254,
      half: true,
    },
    phoneField,
    {
      name: 'experience',
      label: { en: 'Experience level', es: 'Nivel de experiencia' },
      type: 'select',
      required: false,
      options: [
        { value: 'new', label: { en: 'New to soccer', es: 'Nuevo en el fútbol' } },
        { value: 'recreational', label: { en: 'Recreational', es: 'Recreativo' } },
        { value: 'competitive', label: { en: 'Competitive or club', es: 'Competitivo o de club' } },
        { value: 'unsure', label: { en: 'Not sure', es: 'No estoy seguro' } },
      ],
      placeholderOption: { en: 'Choose an option', es: 'Elige una opción' },
    },
  ],
}

const MESSAGES = localized({
  en: {
    required: (label: string) => `Enter ${label.toLowerCase()}.`,
    tooLong: (label: string, max: number) => `${label} must be ${max} characters or fewer.`,
    email: 'Enter an email address in the correct format, like name@example.com.',
    phone: 'Enter a phone number with area code, like 801 555 0100.',
    realDate: 'Enter a real date of birth.',
    pastDate: 'Date of birth must be in the past.',
    select: (label: string) => `Select a valid ${label.toLowerCase()}.`,
    tooOldFor: (division: string, cutoff: string, choices: string) =>
      `${division} players must be born on or after ${cutoff}. Based on this date of birth, choose ${choices}.`,
    tooOldForAll: (division: string, cutoff: string) =>
      `This player is older than every division allows. ${division} players must be born on or after ${cutoff}.`,
  },
  es: {
    required: (label: string) => `Completa este campo: ${label.toLowerCase()}.`,
    tooLong: (label: string, max: number) => `${label}: máximo ${max} caracteres.`,
    email: 'Escribe un correo electrónico válido, por ejemplo nombre@ejemplo.com.',
    phone: 'Escribe un número de teléfono con código de área, por ejemplo 801 555 0100.',
    realDate: 'Escribe una fecha de nacimiento válida.',
    pastDate: 'La fecha de nacimiento debe ser una fecha pasada.',
    select: (label: string) => `Selecciona una opción válida en: ${label.toLowerCase()}.`,
    tooOldFor: (division: string, cutoff: string, choices: string) =>
      `Los jugadores de ${division} deben haber nacido a partir del ${cutoff}. Según esta fecha de nacimiento, elige ${choices}.`,
    tooOldForAll: (division: string, cutoff: string) =>
      `Este jugador supera la edad de todas las divisiones. Los jugadores de ${division} deben haber nacido a partir del ${cutoff}.`,
  },
})

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

/** Returns an error message in the visitor's language, or null when the value is acceptable. */
export function validateField(field: FieldDef, raw: string, locale: Locale = 'en'): string | null {
  const t = MESSAGES[locale]
  const label = field.label[locale]
  const value = raw.trim()
  if (!value) {
    return field.required ? (field.requiredMessage?.[locale] ?? t.required(label)) : null
  }
  if (field.maxLength && value.length > field.maxLength) return t.tooLong(label, field.maxLength)
  switch (field.type) {
    case 'email':
      return EMAIL_PATTERN.test(value) ? null : t.email
    case 'tel': {
      const digits = value.replace(/\D/g, '').length
      return /^[\d\s()+.-]+$/.test(value) && digits >= 10 && digits <= 15 ? null : t.phone
    }
    case 'date':
      // Checks the date is real and in the past; division eligibility is checked in validateForm.
      if (!isRealDate(value) || value < '1900-01-01') return t.realDate
      if (value >= todayIso()) return t.pastDate
      return null
    case 'select':
      return field.options?.some((o) => o.value === value) ? null : t.select(label)
    case 'checkbox':
      return value === 'yes' ? null : t.select(label)
    default:
      return null
  }
}

/** Player is older than the selected division allows ("no older than" cutoff). */
function divisionAgeError(divisionId: string, dateOfBirth: string, locale: Locale): string | null {
  const division = league.divisions.find((d) => d.id === divisionId)
  if (!division?.bornOnOrAfter || dateOfBirth >= division.bornOnOrAfter) return null
  const eligible = eligibleDivisions(dateOfBirth).map((d) => d.id)
  const cutoff = formatIsoDate(division.bornOnOrAfter, locale)
  const t = MESSAGES[locale]
  return eligible.length
    ? t.tooOldFor(division.id, cutoff, new Intl.ListFormat(intlLocale[locale], { type: 'disjunction' }).format(eligible))
    : t.tooOldForAll(division.id, cutoff)
}

export function validateForm(kind: RegistrationKind, values: FormValues, locale: Locale = 'en'): FormErrors {
  const errors: FormErrors = {}
  for (const field of formFields[kind]) {
    const message = validateField(field, values[field.name] ?? '', locale)
    if (message) errors[field.name] = message
  }
  if (kind === 'player' && !errors.division && !errors.dateOfBirth) {
    const ageError = divisionAgeError(values.division, values.dateOfBirth.trim(), locale)
    if (ageError) errors.dateOfBirth = ageError
  }
  return errors
}
