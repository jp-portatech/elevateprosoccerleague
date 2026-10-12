/**
 * Registration emails sent after Stripe confirms payment:
 *   - buildWelcomeEmail          → the parent/guardian or coach who registered
 *   - buildLeagueNotification    → the league inbox (league.email.notify), with every form answer
 *
 * All wording lives in this file — edit freely. League facts (dates, venue, contact) come
 * from src/config/league.ts. Layout is table-based with inline styles so it renders in
 * Gmail, Outlook and Apple Mail. Everything a visitor typed is HTML-escaped.
 */
import {
  formatIsoDate,
  gameDays,
  startDateFull,
  telHref,
  venueAddressLines,
  venueLocation,
} from '../../src/config/derived.js'
import { league } from '../../src/config/league.js'
import { privacyPath } from '../../src/content/navigation.js'
import { formFields, type FormValues } from '../../src/registration/forms.js'
import type { RegistrationKind } from '../../src/registration/types.js'

export interface PaidRegistration {
  kind: RegistrationKind
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

const money = (reg: PaidRegistration) =>
  reg.amountTotal === null
    ? '—'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency: reg.currency.toUpperCase() }).format(
        reg.amountTotal / 100,
      )

const paidOn = (date: Date) =>
  new Intl.DateTimeFormat('en-US', {
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
const PRIVACY_URL = `${league.siteUrl}${privacyPath}`

function layout(title: string, preheader: string, bodyHtml: string, footerNote: string) {
  const logo = `${league.siteUrl}/email/logo.png`
  return `<!doctype html>
<html lang="en">
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
        ${esc(league.name)} · <a href="${esc(league.siteUrl)}" style="color:#ffffff;">${esc(SITE)}</a> · <a href="${esc(PRIVACY_URL)}" style="color:#ffffff;">Privacy policy</a><br>
        ${esc(footerNote)}
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ---------- shared season details ----------

const seasonRows: Rows = [
  ['Season starts', startDateFull],
  ['Game day', gameDays],
  [
    'Format',
    `${league.season.regularSeasonGames} regular-season games · top ${league.season.playoffTeams} teams advance to the playoffs`,
  ],
  ['Venue', [league.venue.name, ...(venueAddressLines ?? [venueLocation])].join('\n')],
]

function seasonDetailsHtml() {
  return `${detailsBox('Season details', seasonRows, ICE)}${
    league.venue.directionsUrl ? `<p style="margin:12px 0 0;">${button(league.venue.directionsUrl, 'Get directions')}</p>` : ''
  }`
}

function contactHtml() {
  const phoneLinks = phones.map((ph) => `<a href="${telHref(ph)}" style="color:${STEEL};">${esc(ph)}</a>`)
  const call = phoneLinks.length ? `, or call ${phoneLinks.join(' or ')}` : ''
  return p(`<strong style="color:${NAVY};">Questions?</strong> Just reply to this email${call}.`, 'margin-top:28px;')
}

function contactText() {
  return `Questions? Just reply to this email${phones.length ? `, or call ${phones.join(' or ')}` : ''}.`
}

// ---------- welcome email (to the family / coach) ----------

export function buildWelcomeEmail(reg: PaidRegistration): RenderedEmail {
  const f = reg.fields
  const amount = money(reg)
  const isTeam = reg.kind === 'team'
  const name = subjectName(reg)
  const greetingName = firstName(isTeam ? f.coachName : f.guardianName)
  const player = f.playerFirstName

  const intro = isTeam
    ? `Thanks for registering <strong>${esc(name)}</strong> with ${esc(league.name)}. We received your payment of <strong>${esc(amount)}</strong>, and your team is registered in the <strong>${esc(f.division)}</strong> division.`
    : `Thanks for registering <strong>${esc(player)}</strong> with ${esc(league.name)}. We received your payment of <strong>${esc(amount)}</strong>, and ${esc(player)}’s registration in the <strong>${esc(f.division)}</strong> division is complete.`

  const summary: Rows = isTeam
    ? [
        ['Team', name],
        ['Division', f.division],
        ['Coach/manager', f.coachName],
        ['Club/academy', f.clubName],
        ['Phone', f.phone],
        ['Amount paid', amount],
        ['Paid on', paidOn(reg.paidAt)],
        ['Reference', reference(reg)],
      ]
    : [
        ['Player', name],
        ['Division', f.division],
        ['Date of birth', f.dateOfBirth ? formatIsoDate(f.dateOfBirth) : ''],
        ['Parent/guardian', f.guardianName],
        ['Phone', f.phone],
        ['Amount paid', amount],
        ['Paid on', paidOn(reg.paidAt)],
        ['Reference', reference(reg)],
      ]

  const nextSteps: Array<[string, string]> = isTeam
    ? [
        ['Season information', `${league.shortName} will send your schedule and season details.`],
        ['Play', `Compete on ${gameDays} at ${league.venue.name}, starting ${startDateFull}.`],
      ]
    : [
        ['We build the team', `${league.shortName} places registered players onto a roster in their age division.`],
        ['Meet your team', 'You’ll receive your team and season information.'],
        ['Play', `Compete on ${gameDays} at ${league.venue.name}, starting ${startDateFull}.`],
      ]

  const subject = `You’re registered: ${name}, ${f.division} | ${league.name}`
  const preheader = `Payment received. The season starts ${startDateFull} at ${league.venue.name}.`

  const html = layout(
    subject,
    preheader,
    `<h1 style="margin:0 0 18px;font-family:'Arial Black', ${FONT};font-size:30px;line-height:1.1;text-transform:uppercase;color:${NAVY};">You’re registered!</h1>
    ${p(`Hi ${esc(greetingName)},`)}
    ${p(intro)}
    ${detailsBox('Registration summary', summary)}
    ${sectionTitle('What happens next')}
    ${steps(nextSteps)}
    ${seasonDetailsHtml()}
    ${contactHtml()}
    ${p(`See you on the field,<br><strong style="color:${NAVY};">${esc(league.name)}</strong>`)}`,
    `You’re receiving this email because you registered at ${SITE}.`,
  )

  const text = [
    'You’re registered!',
    '',
    `Hi ${greetingName},`,
    '',
    isTeam
      ? `Thanks for registering ${name} with ${league.name}. We received your payment of ${amount}, and your team is registered in the ${f.division} division.`
      : `Thanks for registering ${player} with ${league.name}. We received your payment of ${amount}, and ${player}’s registration in the ${f.division} division is complete.`,
    '',
    'REGISTRATION SUMMARY',
    ...textRows(summary),
    '',
    'WHAT HAPPENS NEXT',
    ...nextSteps.map(([title, body], i) => `${i + 1}. ${title}: ${body}`),
    '',
    'SEASON DETAILS',
    ...textRows(seasonRows),
    ...(league.venue.directionsUrl ? [`Directions: ${league.venue.directionsUrl}`] : []),
    '',
    contactText(),
    '',
    'See you on the field,',
    league.name,
    league.siteUrl,
    '',
    `Privacy policy: ${PRIVACY_URL}`,
  ].join('\n')

  return { subject, html, text }
}

// ---------- league notification (to the league inbox) ----------

export function buildLeagueNotification(reg: PaidRegistration): RenderedEmail {
  const name = subjectName(reg)
  const amount = money(reg)
  const kindLabel = reg.kind === 'team' ? 'team' : 'player'
  const dashboardUrl = reg.paymentIntentId
    ? `https://dashboard.stripe.com/${reg.livemode ? '' : 'test/'}payments/${reg.paymentIntentId}`
    : null

  const answers: Rows = formFields[reg.kind].map((field) => {
    const value = reg.fields[field.name] ?? ''
    if (field.type === 'date' && value) return [field.label, formatIsoDate(value)]
    if (field.name !== 'division') return [field.label, field.options?.find((o) => o.value === value)?.label ?? value]
    return [field.label, value]
  })
  const payment: Rows = [
    ['Amount paid', amount],
    ['Paid on', paidOn(reg.paidAt)],
    ['Checkout email', reg.email],
    ['Mode', reg.livemode ? 'Live' : 'Test (sandbox) — no real money'],
    ['Stripe payment', reg.paymentIntentId ?? reg.sessionId],
  ]

  const subject = `${reg.livemode ? '' : '[TEST] '}New ${kindLabel} registration: ${name} (${reg.fields.division}), ${amount} paid`

  const html = layout(
    subject,
    `${name} · ${reg.fields.division} · ${amount}`,
    `<h1 style="margin:0 0 18px;font-family:'Arial Black', ${FONT};font-size:24px;line-height:1.15;text-transform:uppercase;color:${NAVY};">New ${esc(kindLabel)} registration</h1>
    ${p(`<strong>${esc(name)}</strong> registered for <strong>${esc(reg.fields.division)}</strong> and paid <strong>${esc(amount)}</strong>. Reply to this email to contact them directly.`)}
    ${detailsBox('Form answers', answers)}
    ${detailsBox('Payment', payment, ICE)}
    ${dashboardUrl ? `<p style="margin:16px 0 0;">${button(dashboardUrl, 'Open in Stripe')}</p>` : ''}`,
    `Sent to the ${league.shortName} league inbox for every paid registration.`,
  )

  const text = [
    `New ${kindLabel} registration`,
    '',
    `${name} registered for ${reg.fields.division} and paid ${amount}.`,
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
