import { league, type Division, type Price } from './league.js'

/** Display strings derived from the league config, so copy stays in sync with the data. */

const { divisions, season, venue } = league

export const divisionIds = divisions.map((d) => d.id)

/** "U8–U14" (word joiners keep it from breaking across lines) */
export const divisionRange = `${divisionIds[0]}⁠–⁠${divisionIds[divisionIds.length - 1]}`

/** "U8, U10, U12 and U14" */
export const divisionSentence = `${divisionIds.slice(0, -1).join(', ')} and ${divisionIds[divisionIds.length - 1]}`

/** "Sundays" */
export const gameDays = `${season.gameDay}s`

/** "October 25, 2026" (or "October 25" while the year is unconfirmed). */
export const startDateLabel =
  `${season.startMonth} ${season.startDay}` + (season.startYear ? `, ${season.startYear}` : '')

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** "Sunday, October 25, 2026" once the year is set, otherwise the short label. */
export const startDateFull = season.startYear
  ? new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(season.startYear, MONTHS.indexOf(season.startMonth), season.startDay, 12)),
    )
  : startDateLabel

/** "South Jordan, Utah" */
export const venueLocation = `${venue.city}, ${venue.region}`

/** Postal address as lines, e.g. ["6345 Crimson View Drive", "South Jordan, UT 84009"], or null. */
export const venueAddressLines = venue.streetAddress
  ? [venue.streetAddress, `${venue.city}, ${venue.regionCode}${venue.postalCode ? ` ${venue.postalCode}` : ''}`]
  : null

/** Postal address on one line, or null. */
export const venueAddress = venueAddressLines?.join(', ') ?? null

/** Formats a YYYY-MM-DD date without time-zone drift, e.g. "July 31, 2019". */
export function formatIsoDate(iso: string, month: 'long' | 'short' = 'long'): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', { month, day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  )
}

/** "Born on or after July 31, 2019", or null when eligibility isn't set. */
export function eligibilityLabel(division: Division, month: 'long' | 'short' = 'long'): string | null {
  return division.bornOnOrAfter ? `Born on or after ${formatIsoDate(division.bornOnOrAfter, month)}` : null
}

/** Divisions a player born on `dateOfBirth` (YYYY-MM-DD) is young enough to join. */
export function eligibleDivisions(dateOfBirth: string): Division[] {
  return divisions.filter((d) => d.bornOnOrAfter === null || dateOfBirth >= d.bornOnOrAfter)
}

export const eligibilityPending = divisions.some((d) => d.bornOnOrAfter === null)

export const PRICE_COMING_SOON = 'Pricing coming soon'

export function formatPrice(price: Price): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: league.pricing.currency,
    maximumFractionDigits: price.amount % 1 === 0 ? 0 : 2,
  }).format(price.amount)
}

export const onlinePayments = league.registration.onlinePayments

/** "tel:" href for a display phone number. */
export const telHref = (phone: string) => `tel:+1${phone.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '')}`
