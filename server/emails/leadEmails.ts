/**
 * Emails for the "Not ready to register?" contact form (server/lead.ts):
 *   - buildLeadNotification     → the league inbox, always English. Reply goes to the person.
 *   - buildLeadAcknowledgement  → the person, in the language they used on the site.
 *
 * All wording lives in this file — edit freely. Everything a visitor typed is HTML-escaped.
 */
import { telHref } from '../../src/config/derived.js'
import { league } from '../../src/config/league.js'
import { leadOptionLabel } from '../../src/contact/leadForm.js'
import { intlLocale, localized, pagePath, type Locale } from '../../src/i18n/locale.js'
import {
  button,
  detailsBox,
  esc,
  firstName,
  FONT,
  ICE,
  layout,
  NAVY,
  p,
  questionsHtml,
  questionsText,
  seasonDetailsHtml,
  seasonDetailsText,
  SITE,
  textRows,
  type RenderedEmail,
  type Rows,
} from './layout.js'

export interface Lead {
  name: string
  email: string
  phone: string
  /** "player" | "team" | "info" */
  interest: string
  /** A division id, "unsure", or "" */
  ageGroup: string
  message: string
  /** Agreed to news and offers by email and text. */
  consent: boolean
  locale: Locale
  receivedAt: Date
}

const receivedOn = (date: Date, locale: Locale) =>
  new Intl.DateTimeFormat(intlLocale[locale], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: league.timeZone,
    timeZoneName: 'short',
  }).format(date)

const heading = (text: string) =>
  `<h1 style="margin:0 0 18px;font-family:'Arial Black', ${FONT};font-size:26px;line-height:1.15;text-transform:uppercase;color:${NAVY};">${esc(text)}</h1>`

// ---------- to the league inbox ----------

export function buildLeadNotification(lead: Lead): RenderedEmail {
  const interest = leadOptionLabel('interest', lead.interest, 'en')
  const spanish = lead.locale === 'es'

  const details: Rows = [
    ['Name', lead.name],
    ['Email', lead.email],
    ['Phone', lead.phone],
    ['Interested in', interest],
    ['Age group', lead.ageGroup ? leadOptionLabel('ageGroup', lead.ageGroup, 'en') : ''],
    ['Message', lead.message],
  ]
  const followUp: Rows = [
    ['News and offers', lead.consent ? 'Yes — OK to send news and offers by email and text' : 'No — reply to their request only'],
    ['Site language', spanish ? 'Spanish — reply in Spanish' : 'English'],
    ['Received', receivedOn(lead.receivedAt, 'en')],
  ]

  const subject = `New contact request: ${lead.name} — ${interest}${spanish ? ' · Spanish' : ''}`

  const html = layout(
    'en',
    subject,
    `${lead.name} · ${lead.phone} · ${lead.email}`,
    `${heading('New contact request')}
    ${p(`<strong>${esc(lead.name)}</strong> isn’t ready to register yet and would like to hear from ${esc(league.shortName)}. Reply to this email to write back, or give them a call.`)}
    ${detailsBox('Contact details', details)}
    ${detailsBox('Follow-up', followUp, ICE)}
    <p style="margin:16px 0 0;">${button(telHref(lead.phone), `Call ${lead.phone}`)}</p>`,
    `Sent to the ${league.shortName} league inbox from the contact form at ${SITE}.`,
  )

  const text = [
    'New contact request',
    '',
    `${lead.name} isn’t ready to register yet and would like to hear from ${league.shortName}.`,
    '',
    'CONTACT DETAILS',
    ...textRows(details),
    '',
    'FOLLOW-UP',
    ...textRows(followUp),
  ].join('\n')

  return { subject, html, text }
}

// ---------- to the person, in their language ----------

const ACK = localized({
  en: {
    subject: `Thanks for contacting ${league.name}`,
    preheader: 'We got your message. Someone from ElevatePro will be in touch soon.',
    heading: 'Thanks for reaching out!',
    greeting: (name: string) => `Hi ${name},`,
    intro: `We got your message, and someone from ${league.shortName} will contact you soon by phone or email to answer your questions.`,
    sentTitle: 'What you sent us',
    labels: { phone: 'Phone', email: 'Email', interest: 'Interested in', ageGroup: 'Age group', message: 'Message' },
    readyTitle: 'Ready to register?',
    readyText: 'You can sign up a team or a player any time on our website.',
    register: 'Register now',
    signOff: 'See you on the field,',
    footer: `You’re receiving this email because you contacted us at ${SITE}.`,
  },
  es: {
    subject: `Gracias por comunicarte con ${league.name}`,
    preheader: 'Recibimos tu mensaje. Pronto alguien de ElevatePro se comunicará contigo.',
    heading: '¡Gracias por escribirnos!',
    greeting: (name: string) => `Hola, ${name}:`,
    intro: `Recibimos tu mensaje y pronto alguien de ${league.shortName} se comunicará contigo por teléfono o correo electrónico para responder tus preguntas.`,
    sentTitle: 'Lo que nos enviaste',
    labels: {
      phone: 'Teléfono',
      email: 'Correo electrónico',
      interest: 'Te interesa',
      ageGroup: 'División de edad',
      message: 'Mensaje',
    },
    readyTitle: '¿Listo para inscribirte?',
    readyText: 'Puedes inscribir a un equipo o a un jugador cuando quieras en nuestro sitio web.',
    register: 'Inscríbete ahora',
    signOff: '¡Nos vemos en la cancha!',
    footer: `Recibes este correo porque te comunicaste con nosotros en ${SITE}.`,
  },
})

export function buildLeadAcknowledgement(lead: Lead): RenderedEmail {
  const t = ACK[lead.locale]
  const L = t.labels
  const sent: Rows = [
    [L.phone, lead.phone],
    [L.email, lead.email],
    [L.interest, leadOptionLabel('interest', lead.interest, lead.locale)],
    [L.ageGroup, lead.ageGroup ? leadOptionLabel('ageGroup', lead.ageGroup, lead.locale) : ''],
    [L.message, lead.message],
  ]
  const registerUrl = `${league.siteUrl}${pagePath('home', lead.locale)}#register`
  const greeting = t.greeting(firstName(lead.name))

  const html = layout(
    lead.locale,
    t.subject,
    t.preheader,
    `${heading(t.heading)}
    ${p(esc(greeting))}
    ${p(esc(t.intro))}
    ${detailsBox(t.sentTitle, sent)}
    ${p(`<strong style="color:${NAVY};">${esc(t.readyTitle)}</strong> ${esc(t.readyText)}`, 'margin-top:24px;')}
    <p style="margin:0 0 8px;">${button(registerUrl, t.register)}</p>
    ${seasonDetailsHtml(lead.locale)}
    ${questionsHtml(lead.locale)}
    ${p(`${esc(t.signOff)}<br><strong style="color:${NAVY};">${esc(league.name)}</strong>`)}`,
    t.footer,
  )

  const text = [
    t.heading,
    '',
    greeting,
    '',
    t.intro,
    '',
    t.sentTitle.toUpperCase(),
    ...textRows(sent),
    '',
    `${t.readyTitle} ${t.readyText}`,
    registerUrl,
    '',
    ...seasonDetailsText(lead.locale),
    '',
    questionsText(lead.locale),
    '',
    t.signOff,
    league.name,
  ].join('\n')

  return { subject: t.subject, html, text }
}
