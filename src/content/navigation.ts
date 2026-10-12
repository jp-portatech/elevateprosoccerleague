/** Primary navigation. Each href targets a section id on the homepage. */
export const navLinks = [
  { label: 'League', href: '#league' },
  { label: 'Divisions', href: '#divisions' },
  { label: 'Format', href: '#format' },
  { label: 'Venue', href: '#venue' },
  { label: 'FAQ', href: '#faq' },
] as const

/** The privacy policy page (privacy.html, served without the extension — see vercel.json). */
export const privacyPath = '/privacy'
