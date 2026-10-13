/**
 * Search-engine data (schema.org JSON-LD) for the homepages, added to the built HTML by
 * src/prerender.tsx. It tells Google who runs the league, what the site is called, and when and
 * where the season starts, which can show up in its event listings and richer results.
 * Everything comes from config/league.ts, so it stays in step with the page.
 */
import { divisionRange, venueLocation } from '../config/derived'
import { league } from '../config/league'
import { localized, pagePath, type Locale } from '../i18n/locale'

const { siteUrl, venue, season, pricing, contact } = league
const ORGANIZATION_ID = `${siteUrl}/#organization`
const year = season.startDate.slice(0, 4)
// divisionRange has invisible word joiners for line breaking; search engines get plain text.
const ages = divisionRange.replaceAll('\u2060', '')

const COPY = localized({
  en: {
    season: `${league.name} ${year} youth indoor season`,
    description: `Competitive ${season.gameDay.en} indoor soccer for ${ages} kids and teams at ${venue.name} in ${venueLocation}. ${season.regularSeasonGames} regular-season games, then playoffs for the top ${season.playoffTeams} teams.`,
    team: 'Team registration',
    player: 'Individual player registration',
  },
  es: {
    season: `Temporada ${year} de fútbol juvenil indoor de ${league.name}`,
    description: `Fútbol indoor competitivo los ${season.gameDays.es} para niños y equipos ${ages} en ${venue.name}, ${venueLocation}. ${season.regularSeasonGames} partidos de temporada regular y luego playoffs para los ${season.playoffTeams} mejores equipos.`,
    team: 'Inscripción de equipo',
    player: 'Inscripción individual',
  },
})

/** Phone numbers are stored as "801-555-0100"; search engines want the country code. */
const international = (phone: string) => `+1-${phone}`

export function structuredData(locale: Locale) {
  const t = COPY[locale]
  const pageUrl = `${siteUrl}${pagePath('home', locale)}`
  const social = league.social.flatMap((s) => (s.url ? [s.url] : []))
  const offers = (['team', 'player'] as const).flatMap((kind) => {
    const price = pricing[kind]
    if (!price) return []
    return [
      {
        '@type': 'Offer',
        name: t[kind],
        price: String(price.amount),
        priceCurrency: pricing.currency,
        url: `${pageUrl}#register`,
        ...(league.registration.onlinePayments && { availability: 'https://schema.org/InStock' }),
      },
    ]
  })

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SportsOrganization',
        '@id': ORGANIZATION_ID,
        name: league.name,
        alternateName: league.shortName,
        url: `${siteUrl}/`,
        logo: `${siteUrl}/email/logo.png`,
        sport: 'Soccer',
        ...(contact.email && { email: contact.email }),
        ...(contact.phones.length > 0 && { telephone: contact.phones.map(international) }),
        areaServed: [venue.city, ...venue.nearbyCities].map((city) => ({
          '@type': 'City',
          name: `${city}, ${venue.region}`,
        })),
        ...(social.length > 0 && { sameAs: social }),
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: league.name,
        alternateName: league.shortName,
        inLanguage: ['en', 'es'],
        publisher: { '@id': ORGANIZATION_ID },
      },
      {
        '@type': 'SportsEvent',
        '@id': `${siteUrl}/#season-${season.startDate}`,
        name: t.season,
        description: t.description,
        sport: 'Soccer',
        startDate: season.startDate,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        inLanguage: locale,
        url: pageUrl,
        image: [`${siteUrl}/og-image.jpg`],
        location: {
          '@type': 'Place',
          name: venue.name,
          address: {
            '@type': 'PostalAddress',
            ...(venue.streetAddress && { streetAddress: venue.streetAddress }),
            addressLocality: venue.city,
            addressRegion: venue.regionCode,
            ...(venue.postalCode && { postalCode: venue.postalCode }),
            addressCountry: 'US',
          },
        },
        organizer: { '@id': ORGANIZATION_ID },
        ...(offers.length > 0 && { offers }),
      },
    ],
  }
}
