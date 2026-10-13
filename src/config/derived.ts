import { intlLocale, type Locale, type Localized } from '../i18n/locale.js'
import { league, type Division, type Price } from './league.js'

/** Display strings derived from the league config, so copy stays in sync with the data. */

const { divisions, season, venue } = league

export const divisionIds = divisions.map((d) => d.id)

/** "U8–U14" (word joiners keep it from breaking across lines) */
export const divisionRange = `${divisionIds[0]}⁠–⁠${divisionIds[divisionIds.length - 1]}`

const listOf = (items: string[], and: string) => `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`

/** "West Jordan, Riverton, Herriman, Draper and Sandy" / "… y Sandy", or null when none are set. */
export const nearbyCitiesList: Localized | null =
  venue.nearbyCities.length > 1
    ? { en: listOf(venue.nearbyCities, 'and'), es: listOf(venue.nearbyCities, 'y') }
    : venue.nearbyCities.length === 1
      ? { en: venue.nearbyCities[0], es: venue.nearbyCities[0] }
      : null

/** "U8, U10, U12 and U14" / "U8, U10, U12 y U14" */
export const divisionSentence: Localized = { en: listOf(divisionIds, 'and'), es: listOf(divisionIds, 'y') }

/** "Sundays" / "domingos" */
export const gameDays: Localized = season.gameDays

/** First letter uppercase, e.g. "domingos" → "Domingos" for labels. */
export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** Formats a YYYY-MM-DD date without time-zone drift, e.g. "July 31, 2019" / "31 de julio de 2019". */
export function formatIsoDate(
  iso: string,
  locale: Locale = 'en',
  options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' },
): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat(intlLocale[locale], { ...options, timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d, 12)),
  )
}

const bothLocales = (format: (locale: Locale) => string): Localized => ({ en: format('en'), es: format('es') })

/** "October 25, 2026" / "25 de octubre de 2026" */
export const startDateLabel = bothLocales((locale) => formatIsoDate(season.startDate, locale))

/** "Sunday, October 25, 2026" / "domingo, 25 de octubre de 2026" */
export const startDateFull = bothLocales((locale) =>
  formatIsoDate(season.startDate, locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
)

/** "South Jordan, Utah" */
export const venueLocation = `${venue.city}, ${venue.region}`

/** Postal address as lines, e.g. ["6345 Crimson View Drive", "South Jordan, UT 84009"], or null. */
export const venueAddressLines = venue.streetAddress
  ? [venue.streetAddress, `${venue.city}, ${venue.regionCode}${venue.postalCode ? ` ${venue.postalCode}` : ''}`]
  : null

/** Postal address on one line, or null. */
export const venueAddress = venueAddressLines?.join(', ') ?? null

/**
 * Mid-sentence eligibility, e.g. "born on or after August 1, 2016" /
 * "nacidos a partir del 1 de agosto de 2016". Null when eligibility isn't set.
 * `short` abbreviates the English month ("Aug 1, 2016"); Spanish always spells it out.
 */
export function eligibilityText(division: Division, locale: Locale, short = false): string | null {
  if (!division.bornOnOrAfter) return null
  if (locale === 'es') return `nacidos a partir del ${formatIsoDate(division.bornOnOrAfter, 'es')}`
  const month = short ? 'short' : 'long'
  return `born on or after ${formatIsoDate(division.bornOnOrAfter, 'en', { month, day: 'numeric', year: 'numeric' })}`
}

/** Eligibility as a label, e.g. "Born on or after Aug 1, 2016". */
export function eligibilityLabel(division: Division, locale: Locale, short = false): string | null {
  const text = eligibilityText(division, locale, short)
  return text && capitalize(text)
}

/** Divisions a player born on `dateOfBirth` (YYYY-MM-DD) is young enough to join. */
export function eligibleDivisions(dateOfBirth: string): Division[] {
  return divisions.filter((d) => d.bornOnOrAfter === null || dateOfBirth >= d.bornOnOrAfter)
}

export const eligibilityPending = divisions.some((d) => d.bornOnOrAfter === null)

export const PRICE_COMING_SOON: Localized = { en: 'Pricing coming soon', es: 'Precios próximamente' }

export function formatPrice(price: Price, locale: Locale = 'en'): string {
  return new Intl.NumberFormat(intlLocale[locale], {
    style: 'currency',
    currency: league.pricing.currency,
    maximumFractionDigits: price.amount % 1 === 0 ? 0 : 2,
  }).format(price.amount)
}

/** "$350 per team" / "$350 por equipo" */
export const priceWithUnit = (price: Price, locale: Locale) => `${formatPrice(price, locale)} ${price.unit[locale]}`

export const onlinePayments = league.registration.onlinePayments

/** "tel:" href for a display phone number. */
export const telHref = (phone: string) => `tel:+1${phone.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '')}`
