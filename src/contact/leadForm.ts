// The "Not ready to register?" contact form. Shared by the browser and api/contact.ts (which
// re-validates every submission), so imports use `.js` extensions and nothing here may touch
// React or the DOM.
import type { Locale } from '../i18n/locale.js'
import {
  divisionOptions,
  phoneField,
  validateField,
  type FieldDef,
  type FormErrors,
  type FormValues,
} from '../registration/forms.js'

export const leadFields: FieldDef[] = [
  {
    name: 'name',
    label: { en: 'Your name', es: 'Tu nombre' },
    type: 'text',
    required: true,
    requiredMessage: { en: 'Enter your name.', es: 'Escribe tu nombre.' },
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
    name: 'interest',
    label: { en: 'I’m interested in', es: 'Me interesa' },
    type: 'select',
    required: true,
    requiredMessage: { en: 'Choose what you’re interested in.', es: 'Elige qué te interesa.' },
    options: [
      { value: 'player', label: { en: 'Registering a player', es: 'Inscribir a un jugador' } },
      { value: 'team', label: { en: 'Registering a team', es: 'Inscribir a un equipo' } },
      { value: 'info', label: { en: 'Just learning more', es: 'Solo quiero más información' } },
    ],
    placeholderOption: { en: 'Choose one', es: 'Elige una opción' },
    half: true,
  },
  {
    name: 'ageGroup',
    label: { en: 'Player’s age group', es: 'División de edad del jugador' },
    type: 'select',
    required: false,
    options: [...divisionOptions(true), { value: 'unsure', label: { en: 'Not sure', es: 'No estoy seguro' } }],
    placeholderOption: { en: 'Choose an age group', es: 'Elige una división' },
    half: true,
  },
  {
    name: 'message',
    label: { en: 'Questions or comments', es: 'Preguntas o comentarios' },
    type: 'textarea',
    required: false,
    hint: { en: 'Anything you’d like to ask or tell us.', es: 'Lo que quieras preguntarnos o contarnos.' },
    maxLength: 1000,
  },
  {
    name: 'updates',
    label: {
      en: 'Yes, ElevatePro can send me news and offers by email and text message.',
      es: 'Sí, ElevatePro puede enviarme noticias y ofertas por correo electrónico y mensaje de texto.',
    },
    type: 'checkbox',
    required: false,
    hint: {
      en: 'Optional. Message and data rates may apply. You can opt out at any time.',
      es: 'Opcional. Pueden aplicarse tarifas de mensajes y datos. Puedes darte de baja en cualquier momento.',
    },
  },
]

export function validateLead(values: FormValues, locale: Locale = 'en'): FormErrors {
  const errors: FormErrors = {}
  for (const field of leadFields) {
    const message = validateField(field, values[field.name] ?? '', locale)
    if (message) errors[field.name] = message
  }
  return errors
}

/** Display label of a select answer, e.g. interest "team" → "Registering a team". */
export function leadOptionLabel(name: string, value: string, locale: Locale): string {
  return leadFields.find((f) => f.name === name)?.options?.find((o) => o.value === value)?.label[locale] ?? value
}
