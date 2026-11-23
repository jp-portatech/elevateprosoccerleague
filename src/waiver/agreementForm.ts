// ElevatePro's player participation agreement, signed in the same visit as the facility waiver
// (/waiver, step 3). Shared by the page, the admin printout and server/waiver.ts, so imports use
// `.js` extensions and nothing here may touch React or the DOM.
//
// The wording is ElevatePro's own, copied word for word from ElevatePro-Player-Participation-and-Release.pdf
// (the 23 November 2026 draft). Online, the form fills in what the facility waiver already asked
// (player's name and age, contact phone, signature) and shows only the terms for the signer's role,
// as the document itself says ("Read the terms for your role"). The admin printout shows the whole
// document, filled in. To change the wording, add a new entry to AGREEMENTS and point
// CURRENT_AGREEMENT at it; signed agreements keep the version they signed.
import type { Localized } from '../i18n/locale.js'
import { phoneField, validateField, type FieldDef, type FormErrors, type FormValues } from '../registration/forms.js'
import { isMinor, signatureProblem, type Paragraph, type Signature, type Signatures } from './waiverForm.js'

export type SignerRole = 'guardian' | 'adult'

export interface AgreementSection {
  heading: string
  paragraphs: Paragraph[]
  /** Shown online only to these signers ("Read the terms for your role"). Printed for everyone. */
  roles?: SignerRole[]
  /** The adult release is printed in a shaded box, in bold. */
  callout?: string
}

export interface AgreementText {
  brand: string
  page1: {
    title: string
    /** Instructions for the paper form, printed only (the online form handles them). */
    paperIntro: string
    labels: { playerName: string; playerAge: string; emergencyContact: string; emergencyPhone: string }
    sections: AgreementSection[]
    media: { heading: string; paperNote: string; note: string; yes: string; no: string }
  }
  page2: {
    title: string
    paperIntro: string
    sections: AgreementSection[]
    signature: {
      heading: string
      paperInstruction: string
      agreement: string
      roles: Record<SignerRole, string>
      labels: { printedName: string; contactPhone: string; signature: string; date: string }
    }
  }
}

export const AGREEMENTS: Record<string, AgreementText> = {
  'elevatepro-2026-11-23': {
    brand: 'ELEVATEPRO SOCCER TRAINING',
    page1: {
      title: 'Player participation agreement',
      paperIntro:
        'Complete one copy for each player, whether they train alone or with teammates. The adult player or, for a player under 18, their parent or legal guardian signs on page 2. This applies even when someone else books or pays.',
      labels: {
        playerName: 'Player’s full name',
        playerAge: 'Player’s age',
        emergencyContact: 'Emergency contact name and relationship',
        emergencyPhone: 'Emergency contact phone',
      },
      sections: [
        {
          heading: 'Training covered by this agreement',
          paragraphs: [
            [
              'This agreement covers the named player’s participation in booked individual lessons, group lessons, clinics, and camps offered by ElevatePro Soccer Training LLC. Group size does not change this agreement. The indoor venue is Utah Soccer Arena, 1475 S 7th W, Salt Lake City, UT 84104. Any other venue will be identified in the booking. Complete the arena’s own waiver separately when required. Utah law governs these terms. If a court finds a provision unenforceable, the other terms continue to the extent permitted by law.',
            ],
          ],
        },
        {
          heading: 'Soccer risks and emergency care',
          paragraphs: [
            [
              'Sprinting, cutting, shooting, and competing for the ball can cause a player to fall or collide with another player, a goal, a wall, or equipment. Turf, footwear, and wet or uneven surfaces can affect footing. Injuries can include sprains, fractures, concussion, permanent disability, or death. Outdoor sessions can also expose players to heat, cold, or storms.',
            ],
            [
              'I will privately tell the coach about restrictions relevant to safe participation. I authorize staff to give first aid within their training, call 911, and contact the emergency contact above. If I cannot be reached or give instructions, I authorize licensed emergency personnel to evaluate, transport, and provide medically necessary emergency care to the player to the extent the law permits. I am responsible for charges legally owed by me.',
            ],
          ],
        },
        {
          heading: 'Cancellations and facility closures',
          paragraphs: [
            [
              'For a lesson, clinic, or date in a training block, email elevateprosocceracademy@gmail.com at least 24 hours before the start to move it or receive a session credit. A later cancellation or missed session uses that session. A group’s booked total stays the same if one teammate misses. For a camp, a written cancellation at least seven days before the first day earns a full refund. Later camp cancellations and missed days are nonrefundable, except as required by law.',
            ],
            [
              'ElevatePro may stop or cancel training if weather, field conditions, or a facility closure makes play unsafe. If ElevatePro cancels, the payer may choose a credit or a refund for the unused session or portion of the program.',
            ],
          ],
        },
      ],
      media: {
        heading: 'Optional photo and video permission',
        paperNote: 'Initial one choice. Leaving this blank means no permission. This choice has no effect on registration.',
        note: 'Leaving this blank means no permission. This choice has no effect on registration.',
        yes: 'Yes, ElevatePro may photograph or film the player during training and use those images on its website, social media, or advertising without payment. Separate permission is required to publish the player’s name. I may withdraw permission for new uses by emailing the address above.',
        no: 'No, I decline permission for promotional photography and filming of this player.',
      },
    },
    page2: {
      title: 'Player consent and signature',
      paperIntro:
        'Use this page for the player named on page 1. Read the terms for your role, then sign below. Keep a copy of both pages.',
      sections: [
        {
          heading: 'For a parent or legal guardian of a player under 18',
          roles: ['guardian'],
          paragraphs: [
            [
              'I have authority to give permission for this player. I understand the soccer risks described on page 1 and voluntarily allow my child to participate. My child retains their legal claims, including claims for injury caused by negligence. I or an adult I designate will remain on-site and reachable, and supervise my child before and after active instruction.',
            ],
          ],
        },
        {
          heading: 'Youth concussion and head injury policy',
          roles: ['guardian'],
          paragraphs: [
            [
              { b: 'Recognize and report.' },
              ' A concussion is a brain injury that can follow a blow to the head or body, even without loss of consciousness. Signs can include headache, dizziness, nausea, confusion, and difficulty balancing or remembering. Continuing to play can worsen symptoms, prolong recovery, or lead to another injury. Tell the coach immediately if a player feels unwell or takes a head impact.',
            ],
            [
              { b: 'Remove from play.' },
              ' If a coach suspects a concussion or traumatic head injury, the coach will immediately remove the player, notify the parent or guardian, and keep the player out for the rest of that day. Call 911 for a seizure, repeated vomiting, or increasing difficulty waking the player.',
            ],
            [
              { b: 'Return to training.' },
              ' The player must be evaluated by a Utah-licensed health care provider trained in concussion evaluation and management and authorized to do so within their scope of practice. Before return, ElevatePro must receive a written statement clearing the player and confirming the provider successfully completed continuing education in concussion evaluation and management within the preceding three years. The coach will follow the provider’s restrictions.',
            ],
          ],
        },
        {
          heading: 'Release for adult players age 18 and older only',
          roles: ['adult'],
          callout:
            'If I am the adult player, I accept the inherent risks of training and release ElevatePro Soccer Training LLC, Coach Jandir Porta, and the coaches, employees, and contractors acting for ElevatePro from my own claims arising from their ordinary negligence during the training described on page 1.',
          paragraphs: [
            [
              'In exchange for participation, this release covers my own claims for injury, death, or property damage to the extent Utah law allows. Examples include a failure to use reasonable care in setting up drills, selecting equipment, giving instructions, or supervising play. I retain claims for gross negligence, reckless or intentional misconduct, and any claim Utah law makes nonwaivable.',
            ],
          ],
        },
      ],
      signature: {
        heading: 'Signature for this player',
        paperInstruction: 'Mark one role, then sign.',
        agreement:
          'By signing, I agree to the booking terms and emergency authorization on page 1 and confirm my optional media choice, if marked.',
        roles: {
          adult: 'Adult player. I have read and understand the adult release above and sign it voluntarily.',
          guardian:
            'Parent or legal guardian. I give permission for my child to participate. I received a copy of the youth concussion and head injury policy above, have read and understood it, and agree to follow it.',
        },
        labels: {
          printedName: 'Printed name of signer',
          contactPhone: 'Contact phone',
          signature: 'Signature of adult player or parent or legal guardian',
          date: 'Date signed',
        },
      },
    },
  },
}

export const CURRENT_AGREEMENT = 'elevatepro-2026-11-23'

const plain = (p: Paragraph) => p.map((s) => (typeof s === 'string' ? s : s.b)).join('')

/** The whole agreement as plain text, as stored with each signature and emailed to the signer. */
export function agreementPlainText(version: string = CURRENT_AGREEMENT): string {
  const a = AGREEMENTS[version]
  if (!a) return ''
  const section = (s: AgreementSection) => [s.heading, ...(s.callout ? [s.callout] : []), ...s.paragraphs.map(plain)]
  return [
    a.brand,
    a.page1.title,
    ...a.page1.sections.flatMap(section),
    a.page1.media.heading,
    a.page1.media.yes,
    a.page1.media.no,
    a.page2.title,
    ...a.page2.sections.flatMap(section),
    a.page2.signature.heading,
    a.page2.signature.agreement,
    a.page2.signature.roles.adult,
    a.page2.signature.roles.guardian,
  ].join('\n\n')
}

// ---------- what the agreement asks that the facility waiver doesn't ----------

/** The page is English only; FieldDef carries both languages, so the Spanish slot repeats it. */
const en = (text: string): Localized => ({ en: text, es: text })

export const EMERGENCY_FIELDS: FieldDef[] = [
  {
    name: 'emergencyContact',
    label: en('Emergency contact name and relationship'),
    type: 'text',
    required: true,
    requiredMessage: en('Enter an emergency contact name and relationship.'),
    hint: en('Someone we can call if we can’t reach you. For example: Maria Lopez, aunt.'),
    maxLength: 120,
  },
  {
    ...phoneField,
    name: 'emergencyPhone',
    label: en('Emergency contact phone'),
    requiredMessage: en('Enter the emergency contact’s phone number.'),
    half: false,
  },
]

export const SIGNER_NAME_FIELD: FieldDef = {
  name: 'signerName',
  label: en('Printed name of signer'),
  type: 'text',
  required: true,
  requiredMessage: en('Enter your full name, as the parent or guardian signing.'),
  hint: en('Your full name, as the parent or legal guardian signing.'),
  autoComplete: 'name',
  maxLength: 100,
}

export type MediaPermission = '' | 'yes' | 'no'

export interface AgreementInput {
  emergencyContact: string
  emergencyPhone: string
  /** Blank means no permission. */
  mediaPermission: MediaPermission
  /** The parent or guardian's name; adult players sign under their own name. */
  signerName: string
  /** The signer ticked the statement for their role. */
  roleAcknowledged: boolean
  /** Sign with the signature already given on the facility waiver, or a separate one. */
  reuseSignature: boolean
  ownSignature: Signature | null
}

export const emptyAgreement = (): AgreementInput => ({
  emergencyContact: '',
  emergencyPhone: '',
  mediaPermission: '',
  signerName: '',
  roleAcknowledged: false,
  reuseSignature: true,
  ownSignature: null,
})

/** Under 18 → a parent or guardian signs; 18 and over → the player signs for themselves. */
export const signerRole = (dob: string): SignerRole => (isMinor(dob) ? 'guardian' : 'adult')

/** Which facility-waiver signature the agreement reuses for this signer. */
export const reusedSignatureRole = (role: SignerRole) => (role === 'guardian' ? 'guardian' : 'participant')

export function cleanAgreement(raw: unknown): AgreementInput {
  const s = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const own = s.ownSignature && typeof s.ownSignature === 'object' ? (s.ownSignature as Record<string, unknown>) : null
  return {
    emergencyContact: text(s.emergencyContact),
    emergencyPhone: text(s.emergencyPhone),
    mediaPermission: s.mediaPermission === 'yes' || s.mediaPermission === 'no' ? s.mediaPermission : '',
    signerName: text(s.signerName),
    roleAcknowledged: s.roleAcknowledged === true,
    reuseSignature: s.reuseSignature !== false,
    ownSignature:
      own?.kind === 'drawn' && typeof own.image === 'string'
        ? { kind: 'drawn', image: own.image }
        : own?.kind === 'typed' && typeof own.name === 'string'
          ? { kind: 'typed', name: own.name.trim().replace(/\s+/g, ' ') }
          : null,
  }
}

/** The signature that signs the agreement: the facility one reused, or the signer's own. */
export function agreementSignature(role: SignerRole, signatures: Signatures, a: AgreementInput): Signature | null {
  return a.reuseSignature ? signatures[reusedSignatureRole(role)] : a.ownSignature
}

/**
 * Same rules in the browser and on the server. `fields` are the facility waiver's answers (the
 * agreement reuses the name, birth date and evening phone). Error keys: emergencyContact,
 * emergencyPhone, roleAcknowledged, signerName, agreementSignature.
 */
export function validateAgreement(fields: FormValues, signatures: Signatures, a: AgreementInput): FormErrors {
  const errors: FormErrors = {}
  const values: FormValues = { emergencyContact: a.emergencyContact, emergencyPhone: a.emergencyPhone }
  for (const field of EMERGENCY_FIELDS) {
    const message = validateField(field, values[field.name], 'en')
    if (message) errors[field.name] = message
  }
  const role = signerRole(fields.dob ?? '')
  if (!a.roleAcknowledged) errors.roleAcknowledged = 'Check the box to confirm the statement for your role.'
  if (role === 'guardian') {
    const message = validateField(SIGNER_NAME_FIELD, a.signerName, 'en')
    if (message) errors.signerName = message
  }
  const signature = agreementSignature(role, signatures, a)
  if (a.reuseSignature && !signature) {
    errors.agreementSignature = `Sign the ${role === 'guardian' ? 'Parent/Guardian Signature' : 'Signature'} line in step 2 first, or sign here separately.`
  } else if (!signature) {
    errors.agreementSignature = 'Sign the ElevatePro agreement.'
  } else if (!a.reuseSignature) {
    const problem = signatureProblem(signature)
    if (problem) errors.agreementSignature = problem
  }
  return errors
}

export const AGREEMENT_ERROR_ORDER = ['emergencyContact', 'emergencyPhone', 'roleAcknowledged', 'signerName', 'agreementSignature']
