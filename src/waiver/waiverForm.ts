// Facility waiver (/waiver): the USA Internacional waiver, its fields and its signatures. Shared by
// the page, the admin printout and server/waiver.ts (which re-validates every submission), so
// imports use `.js` extensions and nothing here may touch React or the DOM.
//
// The waiver wording is the facility's, copied word for word from their form (registration_LCA.pdf),
// including its spelling. Don't edit it. If the facility sends a new version, add it as a new entry
// in WAIVERS with a new key and point CURRENT_WAIVER at it: signed waivers keep the version they
// signed, so old ones still print with their own wording.
import type { Localized } from '../i18n/locale.js'
import { phoneField, todayIso, validateField, type FieldDef, type FormErrors, type FormValues } from '../registration/forms.js'

/** A run of waiver text; `{ b }` is printed bold, as on the facility's form. */
export type Segment = string | { b: string }
export type Paragraph = Segment[]

export interface WaiverText {
  title: string
  intro: string
  items: Paragraph[]
  acknowledgement: string
  minorsHeading: string
  minors: Paragraph
  officeUse: { heading: string; playerId: string; reviewedBy: string; date: string }
}

export const WAIVERS: Record<string, WaiverText> = {
  'usa-internacional-1': {
    title: 'USA INTERNACIONAL WAIVER',
    intro:
      'In consideration of being allowed to participate in any way in any program, related events and activities, I the undersigned, acknowledge, appreciate, and agree that:',
    items: [
      [
        'The risk of injury from the activities involved in this facility is significant, including the potencial for permanent paralysis and death.',
      ],
      [
        { b: 'I KNOWINGLY AND FREELY ASSUME ALL SUCH RISKS' },
        ', both known and unknown, ',
        { b: 'EVEN IF FROM THE NEGLIGENCE OF RELEASEES' },
        ' or other, and assume full responsibility for my participation.',
      ],
      [
        'I willingly agree to comply with terms and condition for participation. If I observe any unusual significant hazard during my presence or participation, I will remove myself from participation and bring such to the attention of the nearest official immediately.',
      ],
      [
        'I, for myself and on behalf of my heirs, assigns, personal representatives and next of kin, ',
        { b: 'HEREBY RELEASE, INDEMNIFY, AND HOLD HARMLESS' },
        ' Soccer at USA INTERNACIONAL, its officers, officials, agents, and/or employees, other participants, sponsors, advertisers, and, if applicable, owners and leasers of the premises, from any and all claims, demands, losses, and liability arising out of or related to any ',
        { b: 'INJURY, DISABILITY, OR DEATH' },
        ' I may suffer, or loss or damage to person or property, ',
        { b: 'WHETHER ARISING FROM THE NEGLIGENCE OF THE RELEASEES OR OTHERWISE' },
        ', to the fullest extent permitted by law.',
      ],
    ],
    acknowledgement:
      'I have read this release of liability and assumption of risk agreement, fully understand its terms, I understand that I have given up substantial rights by signing it, and sign it freely and voluntarily without any inducement.',
    minorsHeading: 'FOR PARENTS/GUARDIANS OF PARTICIPANTS UNDER AGE 18 AT TIME OF REGISTRATION:',
    minors: [
      'This is the certify that I, as parent/guardian with legal responsibility for this participant, do consent and agree to his/her release as provided above of all the Releasees, and, for myself, my heirs, assigns, and next of kin, I release and agree to indemnify and hold harmless to Releasees from any and all liability incidents to my minor child’s involvement or participation in these programs/activities as provided above, ',
      { b: 'EVEN IF ARISING FROM THE NEGLIGENCE OF THE RELEASEES' },
      ', to the fullest extent permitted by law.',
    ],
    officeUse: {
      heading: 'Do not complete – For use by LCA',
      playerId: 'Player ID #',
      reviewedBy: 'Reviewed/Approved by',
      date: 'Date',
    },
  },
}

export const CURRENT_WAIVER = 'usa-internacional-1'

const plain = (p: Paragraph) => p.map((s) => (typeof s === 'string' ? s : s.b)).join('')

/** The full waiver as plain text, as stored with each signature and emailed to the signer. */
export function waiverPlainText(version: string = CURRENT_WAIVER): string {
  const w = WAIVERS[version]
  if (!w) return ''
  return [
    w.title,
    '',
    w.intro,
    ...w.items.map((item, i) => `${i + 1}. ${plain(item)}`),
    '',
    w.acknowledgement,
    '',
    w.minorsHeading,
    plain(w.minors),
  ].join('\n')
}

// ---------- the form's fields (top of the facility's form) ----------

/** The page is English only; FieldDef carries both languages, so the Spanish slot repeats it. */
const en = (text: string): Localized => ({ en: text, es: text })

export interface WaiverField {
  field: FieldDef
  /** Width on wider screens, in sixths of the row (laid out like the paper form). */
  span: 2 | 3 | 4 | 6
}

const text = (name: string, label: string, extra: Partial<FieldDef> = {}): FieldDef => ({
  name,
  label: en(label),
  type: 'text',
  required: true,
  requiredMessage: en(`Enter the ${label.toLowerCase()}.`),
  maxLength: 100,
  ...extra,
})

export const WAIVER_FIELDS: WaiverField[] = [
  { span: 4, field: text('name', 'Name', { hint: en('The participant’s full name.'), requiredMessage: en('Enter the participant’s full name.') }) },
  {
    span: 2,
    field: {
      name: 'dob',
      label: en('DOB'),
      type: 'date',
      required: true,
      requiredMessage: en('Enter the participant’s date of birth.'),
      hint: en('Date of birth.'),
    },
  },
  { span: 2, field: text('birthPlace', 'Birth Place', { hint: en('City and country.') }) },
  { span: 2, field: text('height', 'Height', { hint: en('For example 4 ft 6 in.'), maxLength: 20 }) },
  { span: 2, field: text('weight', 'Weight', { hint: en('For example 80 lb.'), maxLength: 20 }) },
  {
    span: 3,
    field: {
      name: 'email',
      label: en('Email'),
      type: 'email',
      required: true,
      requiredMessage: en('Enter an email address.'),
      hint: en('We’ll email you a copy of the signed waiver.'),
      autoComplete: 'email',
      maxLength: 254,
    },
  },
  { span: 3, field: text('position', 'Position', { hint: en('For example midfielder, or “not sure”.') }) },
  {
    span: 3,
    field: { ...phoneField, name: 'eveningPhone', label: en('Evening Phone'), requiredMessage: en('Enter an evening phone number.'), half: false },
  },
  {
    span: 3,
    field: text('teamName', 'Team name', { required: false, hint: en('Leave blank if not on a team.') }),
  },
  { span: 6, field: text('address', 'Address', { autoComplete: 'street-address', maxLength: 150 }) },
  { span: 2, field: text('city', 'City', { autoComplete: 'address-level2', maxLength: 60 }) },
  { span: 2, field: text('state', 'State', { autoComplete: 'address-level1', maxLength: 30 }) },
  {
    span: 2,
    field: text('zip', 'Zip', { autoComplete: 'postal-code', maxLength: 10, requiredMessage: en('Enter the zip code.') }),
  },
]

export const WAIVER_FIELD_NAMES = WAIVER_FIELDS.map((f) => f.field.name)

// ---------- signatures ----------

/** Drawn with a finger, stylus or mouse (a PNG), or typed as the signer's full name. */
export type Signature = { kind: 'drawn'; image: string } | { kind: 'typed'; name: string }
export type SignatureRole = 'participant' | 'guardian'
export type Signatures = Record<SignatureRole, Signature | null>

/** Drawn signatures are small PNGs; anything far larger isn't a signature. */
const MAX_IMAGE_CHARS = 400_000

export function cleanSignature(raw: unknown): Signature | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (s.kind === 'drawn' && typeof s.image === 'string') return { kind: 'drawn', image: s.image }
  if (s.kind === 'typed' && typeof s.name === 'string') return { kind: 'typed', name: s.name.trim().replace(/\s+/g, ' ') }
  return null
}

export function signatureProblem(sig: Signature): string | null {
  if (sig.kind === 'typed') return sig.name.length >= 2 && sig.name.length <= 100 ? null : 'Type your full name to sign.'
  return /^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(sig.image) && sig.image.length <= MAX_IMAGE_CHARS
    ? null
    : 'Sign again: the signature didn’t save.'
}

// ---------- validation ----------

/** Under 18 on `onIso` (YYYY-MM-DD). Unknown birth dates count as under 18, the safe side. */
export function isMinor(dob: string, onIso: string = todayIso()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return true
  return `${Number(onIso.slice(0, 4)) - 18}${onIso.slice(4)}` < dob
}

export function emptyWaiver(): FormValues {
  return Object.fromEntries(WAIVER_FIELD_NAMES.map((name) => [name, '']))
}

/** Keeps only this form's fields, as trimmed text. */
export function cleanWaiverFields(raw: unknown): FormValues {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return Object.fromEntries(
    WAIVER_FIELD_NAMES.map((name) => [name, typeof source[name] === 'string' ? (source[name] as string).trim() : '']),
  )
}

/**
 * Same rules in the browser and on the server. Error keys are the field names, plus
 * `participantSignature`, `guardianSignature` and `consent`.
 */
export function validateWaiver(values: FormValues, signatures: Signatures, consent: boolean): FormErrors {
  const errors: FormErrors = {}
  for (const { field } of WAIVER_FIELDS) {
    const message = validateField(field, values[field.name] ?? '', 'en')
    if (message) errors[field.name] = message
  }
  if (!errors.zip && values.zip && !/^\d{5}(-\d{4})?$/.test(values.zip)) errors.zip = 'Enter a 5-digit zip code.'

  const participant = signatures.participant
  if (!participant) errors.participantSignature = 'Sign the waiver.'
  else {
    const problem = signatureProblem(participant)
    if (problem) errors.participantSignature = problem
  }

  const guardian = signatures.guardian
  if (guardian) {
    const problem = signatureProblem(guardian)
    if (problem) errors.guardianSignature = problem
  } else if (isMinor(values.dob ?? '')) {
    errors.guardianSignature = 'A parent or guardian must sign for participants under 18.'
  }

  if (!consent) errors.consent = 'Agree to sign electronically.'
  return errors
}

/** The order errors are listed in, matching the page. */
export const WAIVER_ERROR_ORDER = [...WAIVER_FIELD_NAMES, 'participantSignature', 'guardianSignature', 'consent']
