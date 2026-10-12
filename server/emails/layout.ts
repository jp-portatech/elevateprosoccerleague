/**
 * Shared look of every email the site sends: colors, the branded header and footer, and
 * building blocks (paragraphs, detail boxes, numbered steps, buttons). Table-based with inline
 * styles so it renders in Gmail, Outlook and Apple Mail. Values passed to these helpers are
 * HTML-escaped unless a parameter says it takes HTML.
 */
import {
  capitalize,
  gameDays,
  startDateFull,
  telHref,
  venueAddressLines,
  venueLocation,
} from '../../src/config/derived.js'
import { league } from '../../src/config/league.js'
import { localized, pagePath, type Locale } from '../../src/i18n/locale.js'

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export const NAVY = '#001E48'
export const ICE = '#8FB7DF'
export const PALE = '#E8F3FC'
export const STEEL = '#3567A6'
export const TEXT = '#33445F'
export const FONT = "Arial, Helvetica, sans-serif"

export const esc = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export const firstName = (full: string) => full.trim().split(/\s+/)[0] || full

export const phones = league.contact.phones

// ---------- HTML building blocks ----------

export const p = (html: string, extra = '') => `<p style="margin:0 0 16px;${extra}">${html}</p>`

export const sectionTitle = (title: string) =>
  `<p style="margin:28px 0 12px;font-family:${FONT};font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${STEEL};">${esc(title)}</p>`

/** Label/value rows. Values are raw text: escaped here, with line breaks kept. */
export type Rows = Array<[label: string, value: string]>

export const textRows = (rows: Rows) => rows.filter(([, v]) => v).map(([label, v]) => `${label}: ${v.replace(/\n/g, ', ')}`)

export function detailsBox(title: string, rows: Rows, accent = NAVY) {
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

export function steps(items: Array<[string, string]>) {
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

export const button = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;margin-top:6px;padding:12px 22px;background:${NAVY};color:#ffffff;font-family:${FONT};font-size:14px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;text-decoration:none;">${esc(label)}</a>`

export const SITE = league.siteUrl.replace(/^https?:\/\/(www\.)?/, '')

export const LAYOUT = localized({
  en: { privacy: 'Privacy policy' },
  es: { privacy: 'Política de privacidad' },
})

export function layout(locale: Locale, title: string, preheader: string, bodyHtml: string, footerNote: string) {
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

// ---------- shared sections: season details and "Questions?" ----------

const { regularSeasonGames, playoffTeams } = league.season
const venueLines = [league.venue.name, ...(venueAddressLines ?? [venueLocation])].join('\n')

const SEASON = localized({
  en: {
    title: 'Season details',
    rows: [
      ['Season starts', startDateFull.en],
      ['Game day', capitalize(gameDays.en)],
      ['Format', `${regularSeasonGames} regular-season games · top ${playoffTeams} teams advance to the playoffs`],
      ['Venue', venueLines],
    ] as Rows,
    directions: 'Get directions',
    directionsText: 'Directions',
    questions: 'Questions?',
    reply: 'Just reply to this email',
    call: 'or call',
    or: 'or',
  },
  es: {
    title: 'Datos de la temporada',
    rows: [
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
    reply: 'Solo responde a este correo',
    call: 'o llama al',
    or: 'o al',
  },
})

/** Season start, game day, format and venue, plus a "Get directions" button. */
export function seasonDetailsHtml(locale: Locale) {
  const t = SEASON[locale]
  const directions = league.venue.directionsUrl
  return `${detailsBox(t.title, t.rows, ICE)}${
    directions ? `<p style="margin:12px 0 0;">${button(directions, t.directions)}</p>` : ''
  }`
}

export function seasonDetailsText(locale: Locale): string[] {
  const t = SEASON[locale]
  const directions = league.venue.directionsUrl
  return [t.title.toUpperCase(), ...textRows(t.rows), ...(directions ? [`${t.directionsText}: ${directions}`] : [])]
}

/** "Questions? Just reply to this email, or call 801-… or 801-…." */
export function questionsHtml(locale: Locale) {
  const t = SEASON[locale]
  const calls = phones.map((ph) => `<a href="${telHref(ph)}" style="color:${STEEL};">${esc(ph)}</a>`).join(` ${t.or} `)
  const sep = locale === 'es' ? ' ' : ', '
  return p(
    `<strong style="color:${NAVY};">${esc(t.questions)}</strong> ${t.reply}${calls ? `${sep}${t.call} ${calls}` : ''}.`,
    'margin-top:28px;',
  )
}

export function questionsText(locale: Locale): string {
  const t = SEASON[locale]
  const sep = locale === 'es' ? ' ' : ', '
  return `${t.questions} ${t.reply}${phones.length ? `${sep}${t.call} ${phones.join(` ${t.or} `)}` : ''}.`
}
