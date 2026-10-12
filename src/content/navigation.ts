import type { Localized } from '../i18n/locale'

/** Primary navigation. Each href targets a section id on the homepage. */
export const navLinks: Array<{ label: Localized; href: string }> = [
  { label: { en: 'League', es: 'Liga' }, href: '#league' },
  { label: { en: 'Divisions', es: 'Divisiones' }, href: '#divisions' },
  { label: { en: 'Format', es: 'Formato' }, href: '#format' },
  { label: { en: 'Venue', es: 'Sede' }, href: '#venue' },
  { label: { en: 'FAQ', es: 'Preguntas' }, href: '#faq' },
  { label: { en: 'Contact', es: 'Contacto' }, href: '#contact' },
]
