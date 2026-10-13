// Information-request forms on the landing pages. Shared by the browser and server/lead.ts
// (which re-validates every submission), so imports use `.js` extensions and nothing here may
// touch React or the DOM.
import { landing } from '../config/landing.js'
import type { Locale, Localized } from '../i18n/locale.js'
import { divisionOptions, phoneField, validateField, type FieldDef, type FormErrors, type FormValues } from '../registration/forms.js'

export type InquiryType = 'individual_player' | 'team'

export const isInquiryType = (value: unknown): value is InquiryType => value === 'individual_player' || value === 'team'

/** The landing pages each inquiry type comes from, in English and Spanish. */
export const INQUIRY_PAGES: Record<InquiryType, Localized> = {
  individual_player: landing.player.path,
  team: landing.team.path,
}

/** The page a request came from: the reported path if it's that type's page, else its English page. */
export function inquirySource(type: InquiryType, reportedPath: unknown): string {
  const pages = Object.values(INQUIRY_PAGES[type])
  return typeof reportedPath === 'string' && pages.includes(reportedPath) ? reportedPath : INQUIRY_PAGES[type].en
}

const emailField: FieldDef = {
  name: 'email',
  label: { en: 'Email address', es: 'Correo electrónico' },
  type: 'email',
  required: true,
  requiredMessage: { en: 'Enter an email address.', es: 'Escribe un correo electrónico.' },
  autoComplete: 'email',
  maxLength: 254,
}

const phone: FieldDef = { ...phoneField, label: { en: 'Phone number', es: 'Número de teléfono' }, half: false }

const division = (label: FieldDef['label']): FieldDef => ({
  name: 'division',
  label,
  type: 'select',
  required: true,
  requiredMessage: { en: 'Select an age division.', es: 'Selecciona una división de edad.' },
  options: divisionOptions(false),
  placeholderOption: { en: 'Select a division', es: 'Selecciona una división' },
})

/** Contact details only: no child's name, birth date, medical or payment details at this stage. */
export const inquiryFields: Record<InquiryType, FieldDef[]> = {
  individual_player: [
    {
      name: 'name',
      label: { en: 'Parent/guardian name', es: 'Nombre del padre, madre o tutor' },
      type: 'text',
      required: true,
      requiredMessage: { en: 'Enter your name.', es: 'Escribe tu nombre.' },
      autoComplete: 'name',
      maxLength: 100,
    },
    emailField,
    phone,
    division({ en: 'Player age division', es: 'División de edad del jugador' }),
  ],
  team: [
    {
      name: 'name',
      label: { en: 'Coach/organizer name', es: 'Nombre del entrenador u organizador' },
      type: 'text',
      required: true,
      requiredMessage: { en: 'Enter your name.', es: 'Escribe tu nombre.' },
      autoComplete: 'name',
      maxLength: 100,
    },
    {
      name: 'teamName',
      label: { en: 'Team name', es: 'Nombre del equipo' },
      type: 'text',
      required: true,
      requiredMessage: { en: 'Enter your team name.', es: 'Escribe el nombre de tu equipo.' },
      autoComplete: 'organization',
      maxLength: 100,
    },
    emailField,
    phone,
    division({ en: 'Team age division', es: 'División de edad del equipo' }),
  ],
}

export function validateInquiry(type: InquiryType, values: FormValues, locale: Locale = 'en'): FormErrors {
  const errors: FormErrors = {}
  for (const field of inquiryFields[type]) {
    const message = validateField(field, values[field.name] ?? '', locale)
    if (message) errors[field.name] = message
  }
  return errors
}

// ---------- campaign tags ----------

export const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const

/** Keeps only the standard UTM tags, as short plain strings. Never contact details. */
export function cleanUtm(raw: unknown): Record<string, string> {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const utm: Record<string, string> = {}
  for (const key of UTM_KEYS) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) utm[key] = value.trim().slice(0, 150)
  }
  return utm
}
