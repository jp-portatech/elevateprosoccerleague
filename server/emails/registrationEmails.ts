/**
 * Registration emails sent after Stripe confirms payment:
 *   - buildWelcomeEmail          → the parent/guardian or coach who registered
 *   - buildLeagueNotification    → the league inbox (league.email.notify), with every form answer
 *
 * All wording lives in this file — edit freely. The welcome email is written in English and
 * Spanish (WELCOME below) and goes out in the language the family registered in; the league
 * copy is always English. League facts (dates, venue, contact) come from src/config/league.ts. Layout is table-based with inline styles so it renders in
 * Gmail, Outlook and Apple Mail. Everything a visitor typed is HTML-escaped.
 */
import { formatIsoDate, gameDays, startDateFull } from '../../src/config/derived.js'
import { league } from '../../src/config/league.js'
import { intlLocale, languageName, localized, pagePath, type Locale } from '../../src/i18n/locale.js'
import { formFields, type FormValues } from '../../src/registration/forms.js'
import type { RegistrationKind } from '../../src/registration/types.js'
import {
  button,
  detailsBox,
  esc,
  firstName,
  FONT,
  ICE,
  layout,
  LAYOUT,
  NAVY,
  p,
  questionsHtml,
  questionsText,
  seasonDetailsHtml,
  seasonDetailsText,
  sectionTitle,
  SITE,
  steps,
  textRows,
  type RenderedEmail,
  type Rows,
} from './layout.js'

export interface PaidRegistration {
  kind: RegistrationKind
  /** Language the family registered in. */
  locale: Locale
  fields: FormValues
  /** Email the family used at checkout. */
  email: string
  /** Total paid, in the currency's smallest unit (cents). */
  amountTotal: number | null
  currency: string
  paidAt: Date
  sessionId: string
  paymentIntentId: string | null
  livemode: boolean
}

// ---------- registration helpers ----------

const money = (reg: PaidRegistration, locale: Locale = 'en') =>
  reg.amountTotal === null
    ? '—'
    : new Intl.NumberFormat(intlLocale[locale], { style: 'currency', currency: reg.currency.toUpperCase() }).format(
        reg.amountTotal / 100,
      )

const paidOn = (date: Date, locale: Locale = 'en') =>
  new Intl.DateTimeFormat(intlLocale[locale], {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: league.timeZone,
    timeZoneName: 'short',
  }).format(date)

/** Short, friendly payment reference, e.g. "7G8H2K1L". */
const reference = (reg: PaidRegistration) => (reg.paymentIntentId ?? reg.sessionId).slice(-8).toUpperCase()

const subjectName = (reg: PaidRegistration) =>
  reg.kind === 'team' ? reg.fields.teamName : `${reg.fields.playerFirstName} ${reg.fields.playerLastName}`.trim()


// ---------- welcome email (to the family / coach), in their language ----------

/** Wraps key facts: <strong> in the HTML email, nothing in the plain-text one. */
type Emphasis = (text: string) => string
const strong: Emphasis = (text) => `<strong>${text}</strong>`
const plain: Emphasis = (text) => text

// League name is our own constant, so it goes into the HTML unescaped.
const WELCOME = localized({
  en: {
    heading: 'You’re registered!',
    subject: (name: string, division: string) => `You’re registered: ${name}, ${division} | ${league.name}`,
    preheader: `Payment received. The season starts ${startDateFull.en} at ${league.venue.name}.`,
    greeting: (name: string) => `Hi ${name},`,
    introTeam: (team: string, amount: string, division: string, b: Emphasis) =>
      `Thanks for registering ${b(team)} with ${league.name}. We received your payment of ${b(amount)}, and your team is registered in the ${b(division)} division.`,
    introPlayer: (player: string, amount: string, division: string, b: Emphasis) =>
      `Thanks for registering ${b(player)} with ${league.name}. We received your payment of ${b(amount)}, and ${player}’s registration in the ${b(division)} division is complete.`,
    summaryTitle: 'Registration summary',
    labels: {
      team: 'Team',
      player: 'Player',
      division: 'Division',
      coach: 'Coach/manager',
      club: 'Club/academy',
      dateOfBirth: 'Date of birth',
      guardian: 'Parent/guardian',
      phone: 'Phone',
      amount: 'Amount paid',
      paidOn: 'Paid on',
      reference: 'Reference',
    },
    nextTitle: 'What happens next',
    nextTeam: [
      ['Season information', `${league.shortName} will send your schedule and season details.`],
    ] as Array<[string, string]>,
    nextPlayer: [
      ['We build the team', `${league.shortName} places registered players onto a roster in their age division.`],
      ['Meet your team', 'You’ll receive your team and season information.'],
    ] as Array<[string, string]>,
    play: ['Play', `Compete on ${gameDays.en} at ${league.venue.name}, starting ${startDateFull.en}.`] as [string, string],
    signOff: 'See you on the field,',
    footer: `You’re receiving this email because you registered at ${SITE}.`,
  },
  es: {
    heading: '¡Inscripción completa!',
    subject: (name: string, division: string) => `Inscripción completa: ${name}, ${division} | ${league.name}`,
    preheader: `Recibimos tu pago. La temporada inicia el ${startDateFull.es} en ${league.venue.name}.`,
    greeting: (name: string) => `Hola, ${name}:`,
    introTeam: (team: string, amount: string, division: string, b: Emphasis) =>
      `Gracias por inscribir a ${b(team)} en ${league.name}. Recibimos tu pago de ${b(amount)} y tu equipo quedó inscrito en la división ${b(division)}.`,
    introPlayer: (player: string, amount: string, division: string, b: Emphasis) =>
      `Gracias por inscribir a ${b(player)} en ${league.name}. Recibimos tu pago de ${b(amount)} y la inscripción de ${player} en la división ${b(division)} está completa.`,
    summaryTitle: 'Resumen de la inscripción',
    labels: {
      team: 'Equipo',
      player: 'Jugador',
      division: 'División',
      coach: 'Entrenador o encargado',
      club: 'Club o academia',
      dateOfBirth: 'Fecha de nacimiento',
      guardian: 'Padre, madre o tutor',
      phone: 'Teléfono',
      amount: 'Monto pagado',
      paidOn: 'Fecha de pago',
      reference: 'Referencia',
    },
    nextTitle: 'Próximos pasos',
    nextTeam: [
      ['Información de la temporada', `${league.shortName} te enviará el calendario y los detalles de la temporada.`],
    ],
    nextPlayer: [
      ['Formamos el equipo', `${league.shortName} asigna a los jugadores inscritos a un equipo de su división de edad.`],
      ['Conoce a tu equipo', 'Recibirás la información de tu equipo y de la temporada.'],
    ],
    play: ['A jugar', `Compite los ${gameDays.es} en ${league.venue.name}, a partir del ${startDateFull.es}.`],
    signOff: '¡Nos vemos en la cancha!',
    footer: `Recibes este correo porque hiciste una inscripción en ${SITE}.`,
  },
})

export function buildWelcomeEmail(reg: PaidRegistration): RenderedEmail {
  const t = WELCOME[reg.locale]
  const f = reg.fields
  const amount = money(reg, reg.locale)
  const isTeam = reg.kind === 'team'
  const name = subjectName(reg)
  const greetingName = firstName(isTeam ? f.coachName : f.guardianName)
  const player = f.playerFirstName
  const L = t.labels

  // HTML gets escaped values; the plain-text version gets them as typed.
  const intro = isTeam
    ? t.introTeam(esc(name), esc(amount), esc(f.division), strong)
    : t.introPlayer(esc(player), esc(amount), esc(f.division), strong)
  const introText = isTeam
    ? t.introTeam(name, amount, f.division, plain)
    : t.introPlayer(player, amount, f.division, plain)

  const paid: Rows = [
    [L.amount, amount],
    [L.paidOn, paidOn(reg.paidAt, reg.locale)],
    [L.reference, reference(reg)],
  ]
  const summary: Rows = isTeam
    ? [[L.team, name], [L.division, f.division], [L.coach, f.coachName], [L.club, f.clubName], [L.phone, f.phone], ...paid]
    : [
        [L.player, name],
        [L.division, f.division],
        [L.dateOfBirth, f.dateOfBirth ? formatIsoDate(f.dateOfBirth, reg.locale) : ''],
        [L.guardian, f.guardianName],
        [L.phone, f.phone],
        ...paid,
      ]

  const nextSteps = [...(isTeam ? t.nextTeam : t.nextPlayer), t.play]
  const subject = t.subject(name, f.division)

  const html = layout(
    reg.locale,
    subject,
    t.preheader,
    `<h1 style="margin:0 0 18px;font-family:'Arial Black', ${FONT};font-size:30px;line-height:1.1;text-transform:uppercase;color:${NAVY};">${esc(t.heading)}</h1>
    ${p(esc(t.greeting(greetingName)))}
    ${p(intro)}
    ${detailsBox(t.summaryTitle, summary)}
    ${sectionTitle(t.nextTitle)}
    ${steps(nextSteps)}
    ${seasonDetailsHtml(reg.locale)}
    ${questionsHtml(reg.locale)}
    ${p(`${esc(t.signOff)}<br><strong style="color:${NAVY};">${esc(league.name)}</strong>`)}`,
    t.footer,
  )

  const text = [
    t.heading,
    '',
    t.greeting(greetingName),
    '',
    introText,
    '',
    t.summaryTitle.toUpperCase(),
    ...textRows(summary),
    '',
    t.nextTitle.toUpperCase(),
    ...nextSteps.map(([title, body], i) => `${i + 1}. ${title}: ${body}`),
    '',
    ...seasonDetailsText(reg.locale),
    '',
    questionsText(reg.locale),
    '',
    t.signOff,
    league.name,
    `${league.siteUrl}${pagePath('home', reg.locale)}`,
    '',
    `${LAYOUT[reg.locale].privacy}: ${league.siteUrl}${pagePath('privacy', reg.locale)}`,
  ].join('\n')

  return { subject, html, text }
}

// ---------- league notification (to the league inbox, always English) ----------

export function buildLeagueNotification(reg: PaidRegistration): RenderedEmail {
  const name = subjectName(reg)
  const amount = money(reg)
  const kindLabel = reg.kind === 'team' ? 'team' : 'player'
  const dashboardUrl = reg.paymentIntentId
    ? `https://dashboard.stripe.com/${reg.livemode ? '' : 'test/'}payments/${reg.paymentIntentId}`
    : null

  const answers: Rows = formFields[reg.kind].map((field) => {
    const value = reg.fields[field.name] ?? ''
    const label = field.label.en
    if (field.type === 'date' && value) return [label, formatIsoDate(value)]
    if (field.name !== 'division') return [label, field.options?.find((o) => o.value === value)?.label.en ?? value]
    return [label, value]
  })
  const payment: Rows = [
    ['Amount paid', amount],
    ['Paid on', paidOn(reg.paidAt)],
    ['Checkout email', reg.email],
    ['Site language', reg.locale === 'en' ? 'English' : `${languageName[reg.locale]} (Spanish)`],
    ['Mode', reg.livemode ? 'Live' : 'Test (sandbox) — no real money'],
    ['Stripe payment', reg.paymentIntentId ?? reg.sessionId],
  ]
  const spanish = reg.locale === 'es'

  const subject = `${reg.livemode ? '' : '[TEST] '}New ${kindLabel} registration: ${name} (${reg.fields.division}), ${amount} paid${spanish ? ' · Spanish' : ''}`

  const html = layout(
    'en',
    subject,
    `${name} · ${reg.fields.division} · ${amount}`,
    `<h1 style="margin:0 0 18px;font-family:'Arial Black', ${FONT};font-size:24px;line-height:1.15;text-transform:uppercase;color:${NAVY};">New ${esc(kindLabel)} registration</h1>
    ${p(`<strong>${esc(name)}</strong> registered for <strong>${esc(reg.fields.division)}</strong> and paid <strong>${esc(amount)}</strong>.${spanish ? ' They registered on the Spanish site and received their welcome email in Spanish.' : ''} Reply to this email to contact them directly.`)}
    ${detailsBox('Form answers', answers)}
    ${detailsBox('Payment', payment, ICE)}
    ${dashboardUrl ? `<p style="margin:16px 0 0;">${button(dashboardUrl, 'Open in Stripe')}</p>` : ''}`,
    `Sent to the ${league.shortName} league inbox for every paid registration.`,
  )

  const text = [
    `New ${kindLabel} registration`,
    '',
    `${name} registered for ${reg.fields.division} and paid ${amount}.${spanish ? ' They registered on the Spanish site.' : ''}`,
    '',
    'FORM ANSWERS',
    ...answers.filter(([, v]) => v).map(([label, value]) => `${label}: ${value}`),
    '',
    'PAYMENT',
    ...textRows(payment),
    ...(dashboardUrl ? ['', dashboardUrl] : []),
  ].join('\n')

  return { subject, html, text }
}
