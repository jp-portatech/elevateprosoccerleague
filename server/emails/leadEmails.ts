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
import type { InquiryType } from '../../src/landing/inquiryForms.js'
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
  /** Team inquiries from /register-a-team. */
  teamName: string
  /** Agreed to news and offers by email and text. */
  consent: boolean
  locale: Locale
  receivedAt: Date
  /** "contact-form", or the landing page path, e.g. "/register-a-team". */
  source: string
  /** Landing-page information request, or null for the homepage contact form. */
  inquiry: InquiryType | null
  /** UTM campaign tags from the landing page URL. */
  utm: Record<string, string>
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

/** "google / cpc / fall-teams" plus term and content when present. */
const campaign = (utm: Record<string, string>) =>
  [utm.utm_source, utm.utm_medium, utm.utm_campaign].filter(Boolean).join(' / ') +
  (utm.utm_term ? ` · term: ${utm.utm_term}` : '') +
  (utm.utm_content ? ` · content: ${utm.utm_content}` : '')

const PAGE_NAMES: Record<string, string> = {
  'contact-form': 'Homepage contact form',
  '/join-as-a-player': 'Join as a player page (/join-as-a-player)',
  '/register-a-team': 'Register a team page (/register-a-team)',
  '/es/join-as-a-player': 'Spanish Join as a player page (/es/join-as-a-player)',
  '/es/register-a-team': 'Spanish Register a team page (/es/register-a-team)',
}

// ---------- to the league inbox ----------

export function buildLeadNotification(lead: Lead): RenderedEmail {
  const spanish = lead.locale === 'es'
  const isTeam = lead.inquiry === 'team'
  const interest = leadOptionLabel('interest', lead.interest, 'en')
  const division = lead.ageGroup ? leadOptionLabel('ageGroup', lead.ageGroup, 'en').split(' — ')[0] : ''

  const title = lead.inquiry ? (isTeam ? 'New team inquiry' : 'New player inquiry') : 'New contact request'
  const subject = lead.inquiry
    ? `${title}: ${isTeam ? `${lead.teamName} — ` : ''}${lead.name} (${division})${spanish ? ' · Spanish' : ''}`
    : `New contact request: ${lead.name} — ${interest}${spanish ? ' · Spanish' : ''}`
  const intro = lead.inquiry
    ? isTeam
      ? `<strong>${esc(lead.name)}</strong> asked about registering <strong>${esc(lead.teamName)}</strong> in ${esc(division)}. They haven’t registered or paid yet. Reply to this email to follow up, or give them a call.`
      : `<strong>${esc(lead.name)}</strong> asked about registering a ${esc(division)} player individually. They haven’t registered or paid yet. Reply to this email to follow up, or give them a call.`
    : `<strong>${esc(lead.name)}</strong> isn’t ready to register yet and would like to hear from ${esc(league.shortName)}. Reply to this email to write back, or give them a call.`

  const details: Rows = lead.inquiry
    ? [
        [isTeam ? 'Coach/organizer' : 'Parent/guardian', lead.name],
        ['Team name', lead.teamName],
        ['Email', lead.email],
        ['Phone', lead.phone],
        [isTeam ? 'Team division' : 'Player division', division],
      ]
    : [
        ['Name', lead.name],
        ['Email', lead.email],
        ['Phone', lead.phone],
        ['Interested in', interest],
        ['Age group', lead.ageGroup ? leadOptionLabel('ageGroup', lead.ageGroup, 'en') : ''],
        ['Message', lead.message],
      ]
  const followUp: Rows = [
    [
      'News and offers',
      lead.inquiry
        ? 'Not asked on this form — reply to their request only'
        : lead.consent
          ? 'Yes — OK to send news and offers by email and text'
          : 'No — reply to their request only',
    ],
    ['Came from', PAGE_NAMES[lead.source] ?? lead.source],
    ['Campaign', campaign(lead.utm)],
    ['Site language', spanish ? 'Spanish — reply in Spanish' : 'English'],
    ['Received', receivedOn(lead.receivedAt, 'en')],
  ]

  const html = layout(
    'en',
    subject,
    `${lead.name} · ${lead.phone} · ${lead.email}`,
    `${heading(title)}
    ${p(intro)}
    ${detailsBox('Contact details', details)}
    ${detailsBox('Follow-up', followUp, ICE)}
    <p style="margin:16px 0 0;">${button(telHref(lead.phone), `Call ${lead.phone}`)}</p>`,
    `Sent to the ${league.shortName} league inbox from ${lead.inquiry ? 'a landing page' : 'the contact form'} at ${SITE}.`,
  )

  const text = [
    title,
    '',
    intro.replace(/<\/?strong>/g, ''),
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
    labels: {
      name: 'Name',
      team: 'Team',
      phone: 'Phone',
      email: 'Email',
      interest: 'Interested in',
      ageGroup: 'Age group',
      division: 'Division',
      message: 'Message',
    },
    readyTitle: 'Ready to register?',
    readyText: 'You can sign up a team or a player any time on our website.',
    register: 'Register now',
    signOff: 'See you on the field,',
    footer: `You’re receiving this email because you contacted us at ${SITE}.`,
    inquiry: {
      subject: `Your information request | ${league.name}`,
      preheader: 'We received your information request.',
      heading: 'Thanks for your interest!',
      player: [
        'Your information request has been received. We’ll follow up about individual registration and team placement.',
        'This is an information request. It doesn’t reserve a spot; registration and team placement are confirmed separately.',
      ],
      team: [
        'Your team information request has been received. We’ll follow up about registration, division eligibility and pricing.',
        'This is an information request. It doesn’t complete your team’s registration; your roster and team registration are completed separately.',
      ],
      footer: `You’re receiving this email because you asked for information at ${SITE}.`,
    },
  },
  es: {
    subject: `Gracias por comunicarte con ${league.name}`,
    preheader: 'Recibimos tu mensaje. Pronto alguien de ElevatePro se comunicará contigo.',
    heading: '¡Gracias por escribirnos!',
    greeting: (name: string) => `Hola, ${name}:`,
    intro: `Recibimos tu mensaje y pronto alguien de ${league.shortName} se comunicará contigo por teléfono o correo electrónico para responder tus preguntas.`,
    sentTitle: 'Lo que nos enviaste',
    labels: {
      name: 'Nombre',
      team: 'Equipo',
      phone: 'Teléfono',
      email: 'Correo electrónico',
      interest: 'Te interesa',
      ageGroup: 'División de edad',
      division: 'División',
      message: 'Mensaje',
    },
    readyTitle: '¿Listo para inscribirte?',
    readyText: 'Puedes inscribir a un equipo o a un jugador cuando quieras en nuestro sitio web.',
    register: 'Inscríbete ahora',
    signOff: '¡Nos vemos en la cancha!',
    footer: `Recibes este correo porque te comunicaste con nosotros en ${SITE}.`,
    inquiry: {
      subject: `Tu solicitud de información | ${league.name}`,
      preheader: 'Recibimos tu solicitud de información.',
      heading: '¡Gracias por tu interés!',
      player: [
        'Recibimos tu solicitud de información. Te daremos seguimiento sobre la inscripción individual y la asignación de equipo.',
        'Esta es una solicitud de información. No aparta un lugar; la inscripción y la asignación de equipo se confirman por separado.',
      ],
      team: [
        'Recibimos la solicitud de información de tu equipo. Te daremos seguimiento sobre la inscripción, la elegibilidad de división y los precios.',
        'Esta es una solicitud de información. No completa la inscripción de tu equipo; la lista de jugadores y la inscripción se completan por separado.',
      ],
      footer: `Recibes este correo porque pediste información en ${SITE}.`,
    },
  },
})

export function buildLeadAcknowledgement(lead: Lead): RenderedEmail {
  const t = ACK[lead.locale]
  const L = t.labels
  const greeting = t.greeting(firstName(lead.name))

  // Landing-page information requests: confirm receipt, say plainly it isn't a registration,
  // and keep the reader on their own path (no link to the other registration type).
  if (lead.inquiry) {
    const q = t.inquiry
    const [received, notRegistered] = lead.inquiry === 'team' ? q.team : q.player
    const division = lead.ageGroup ? leadOptionLabel('ageGroup', lead.ageGroup, lead.locale).split(' — ')[0] : ''
    const sent: Rows = [
      [L.name, lead.name],
      [L.team, lead.teamName],
      [L.email, lead.email],
      [L.phone, lead.phone],
      [L.division, division],
    ]
    const html = layout(
      lead.locale,
      q.subject,
      q.preheader,
      `${heading(q.heading)}
      ${p(esc(greeting))}
      ${p(esc(received))}
      ${p(`<strong style="color:${NAVY};">${esc(notRegistered)}</strong>`)}
      ${detailsBox(t.sentTitle, sent)}
      ${seasonDetailsHtml(lead.locale)}
      ${questionsHtml(lead.locale)}
      ${p(`${esc(t.signOff)}<br><strong style="color:${NAVY};">${esc(league.name)}</strong>`)}`,
      q.footer,
    )
    const text = [
      q.heading,
      '',
      greeting,
      '',
      received,
      '',
      notRegistered,
      '',
      t.sentTitle.toUpperCase(),
      ...textRows(sent),
      '',
      ...seasonDetailsText(lead.locale),
      '',
      questionsText(lead.locale),
      '',
      t.signOff,
      league.name,
    ].join('\n')
    return { subject: q.subject, html, text }
  }

  const sent: Rows = [
    [L.phone, lead.phone],
    [L.email, lead.email],
    [L.interest, leadOptionLabel('interest', lead.interest, lead.locale)],
    [L.ageGroup, lead.ageGroup ? leadOptionLabel('ageGroup', lead.ageGroup, lead.locale) : ''],
    [L.message, lead.message],
  ]
  const registerUrl = `${league.siteUrl}${pagePath('home', lead.locale)}#register`

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
