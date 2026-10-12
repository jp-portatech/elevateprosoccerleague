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
import {
  capitalize,
  formatIsoDate,
  gameDays,
  startDateFull,
  telHref,
  venueAddressLines,
  venueLocation,
} from '../../src/config/derived.js'
import { league } from '../../src/config/league.js'
import { intlLocale, languageName, localized, pagePath, type Locale } from '../../src/i18n/locale.js'
import { formFields, type FormValues } from '../../src/registration/forms.js'
import type { RegistrationKind } from '../../src/registration/types.js'

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

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

// ---------- helpers ----------

const NAVY = '#001E48'
const ICE = '#8FB7DF'
const PALE = '#E8F3FC'
const STEEL = '#3567A6'
const TEXT = '#33445F'
const FONT = "Arial, Helvetica, sans-serif"

const esc = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const firstName = (full: string) => full.trim().split(/\s+/)[0] || full

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

const phones = league.contact.phones

// ---------- HTML building blocks ----------

const p = (html: string, extra = '') => `<p style="margin:0 0 16px;${extra}">${html}</p>`

const sectionTitle = (title: string) =>
  `<p style="margin:28px 0 12px;font-family:${FONT};font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${STEEL};">${esc(title)}</p>`

/** Label/value rows. Values are raw text: escaped here, with line breaks kept. */
type Rows = Array<[label: string, value: string]>

const textRows = (rows: Rows) => rows.filter(([, v]) => v).map(([label, v]) => `${label}: ${v.replace(/\n/g, ', ')}`)

function detailsBox(title: string, rows: Rows, accent = NAVY) {
  const body = rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) => `<tr>
        <td style="padding:5px 14px 5px 0;width:38%;vertical-align:top;font-family:${FONT};font-size:14px;color:${STEEL};">${esc(label)}</td>
        <td style="padding:5px 0;vertical-align:top;font-family:${FONT};font-size:15px;font-weight:bold;color:${NAVY};">${esc(value).replace(/\n/g, '<br>')}</td>
      </tr>`,
    )
    .join('')
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 8px;background:${PALE};border-left:4px solid ${accent};">
    <tr><td style="padding:16px 20px;">
      <p style="margin:0 0 8px;font-family:${FONT};font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${STEEL};">${esc(title)}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${body}</table>
    </td></tr>
  </table>`
}

function steps(items: Array<[string, string]>) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items
    .map(
      ([title, text], i) => `<tr>
        <td style="width:44px;padding:0 0 14px;vertical-align:top;">
          <div style="width:32px;height:32px;line-height:32px;border-radius:16px;background:${NAVY};color:#ffffff;text-align:center;font-family:${FONT};font-size:15px;font-weight:bold;">${i + 1}</div>
        </td>
        <td style="padding:4px 0 14px;vertical-align:top;font-family:${FONT};font-size:15px;line-height:1.5;color:${TEXT};">
          <strong style="color:${NAVY};text-transform:uppercase;letter-spacing:1px;font-size:14px;">${esc(title)}</strong><br>${esc(text)}
        </td>
      </tr>`,
    )
    .join('')}</table>`
}

const button = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;margin-top:6px;padding:12px 22px;background:${NAVY};color:#ffffff;font-family:${FONT};font-size:14px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;text-decoration:none;">${esc(label)}</a>`

const SITE = league.siteUrl.replace(/^https?:\/\/(www\.)?/, '')

const LAYOUT = localized({
  en: { privacy: 'Privacy policy' },
  es: { privacy: 'Política de privacidad' },
})

function layout(locale: Locale, title: string, preheader: string, bodyHtml: string, footerNote: string) {
  const logo = `${league.siteUrl}/email/logo.png`
  const home = `${league.siteUrl}${pagePath('home', locale)}`
  const privacy = `${league.siteUrl}${pagePath('privacy', locale)}`
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:${PALE};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PALE};">
  <tr><td align="center" style="padding:24px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;">
      <tr><td style="background:${NAVY};padding:18px 28px;border-bottom:4px solid ${ICE};">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td><img src="${logo}" width="60" height="60" alt="${esc(league.name)}" style="display:block;border:0;"></td>
          <td style="padding-left:14px;font-family:${FONT};font-size:18px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#ffffff;line-height:1.2;">
            ${esc(league.shortName)}<br><span style="font-size:11px;letter-spacing:3px;color:${ICE};">Soccer League</span>
          </td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:32px 28px 12px;font-family:${FONT};font-size:16px;line-height:1.6;color:${TEXT};">
        ${bodyHtml}
      </td></tr>
      <tr><td style="padding:20px 28px;background:${NAVY};font-family:${FONT};font-size:12px;line-height:1.6;color:#D6E4F3;">
        ${esc(league.name)} · <a href="${esc(home)}" style="color:#ffffff;">${esc(SITE)}</a> · <a href="${esc(privacy)}" style="color:#ffffff;">${LAYOUT[locale].privacy}</a><br>
        ${esc(footerNote)}
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ---------- welcome email (to the family / coach), in their language ----------

const { regularSeasonGames, playoffTeams } = league.season
const venueLines = [league.venue.name, ...(venueAddressLines ?? [venueLocation])].join('\n')
const phoneList = (or: string) => phones.join(` ${or} `)

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
    seasonTitle: 'Season details',
    seasonRows: [
      ['Season starts', startDateFull.en],
      ['Game day', capitalize(gameDays.en)],
      ['Format', `${regularSeasonGames} regular-season games · top ${playoffTeams} teams advance to the playoffs`],
      ['Venue', venueLines],
    ] as Rows,
    directions: 'Get directions',
    directionsText: 'Directions',
    questions: 'Questions?',
    replyHtml: (phoneLinks: string) => ` Just reply to this email${phoneLinks ? `, or call ${phoneLinks}` : ''}.`,
    replyText: `Questions? Just reply to this email${phones.length ? `, or call ${phoneList('or')}` : ''}.`,
    or: 'or',
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
    seasonTitle: 'Datos de la temporada',
    seasonRows: [
      ['Inicio de la temporada', startDateFull.es],
      ['Día de juego', capitalize(gameDays.es)],
      [
        'Formato',
        `${regularSeasonGames} partidos de temporada regular · los ${playoffTeams} mejores equipos avanzan a los playoffs`,
      ],
      ['Sede', venueLines],
    ],
    directions: 'Cómo llegar',
    directionsText: 'Cómo llegar',
    questions: '¿Preguntas?',
    replyHtml: (phoneLinks: string) => ` Solo responde a este correo${phoneLinks ? ` o llama al ${phoneLinks}` : ''}.`,
    replyText: `¿Preguntas? Solo responde a este correo${phones.length ? ` o llama al ${phoneList('o al')}` : ''}.`,
    or: 'o al',
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
  const phoneLinks = phones.map((ph) => `<a href="${telHref(ph)}" style="color:${STEEL};">${esc(ph)}</a>`).join(` ${t.or} `)
  const directionsUrl = league.venue.directionsUrl

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
    ${detailsBox(t.seasonTitle, t.seasonRows, ICE)}
    ${directionsUrl ? `<p style="margin:12px 0 0;">${button(directionsUrl, t.directions)}</p>` : ''}
    ${p(`<strong style="color:${NAVY};">${esc(t.questions)}</strong>${t.replyHtml(phoneLinks)}`, 'margin-top:28px;')}
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
    t.seasonTitle.toUpperCase(),
    ...textRows(t.seasonRows),
    ...(directionsUrl ? [`${t.directionsText}: ${directionsUrl}`] : []),
    '',
    t.replyText,
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
