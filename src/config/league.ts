/**
 * ElevatePro Soccer League — site configuration.
 *
 * Every league detail that can change (season date, prices, venue, contact details,
 * social links, registration) lives in this file. Components — and the Stripe checkout
 * function in api/ — read from here, so update values here rather than in section markup.
 *
 * `null` means "not confirmed yet". The site hides that detail, or shows a
 * "coming soon" note, instead of guessing.
 *
 * Imports in this file use `.js` extensions because the Vercel functions load it as
 * plain Node ESM (see tsconfig.api.json).
 */

export type DivisionId = 'U8' | 'U10' | 'U12' | 'U14'

export interface Division {
  id: DivisionId
  /**
   * Oldest allowed birth date ("no older than"), as YYYY-MM-DD. Players must be born on
   * or after this date. Null hides eligibility and skips the date-of-birth check.
   */
  bornOnOrAfter: string | null
}

export interface Price {
  /** Amount in whole currency units, e.g. 350 for $350. Also what Stripe charges. */
  amount: number
  /** Short qualifier shown after the amount, e.g. "per team". */
  unit: string
  /** Optional fine print shown under the price. */
  note?: string
}

export interface SocialLink {
  /** Network name, e.g. "Instagram". Used as the link text. */
  label: string
  /** Profile URL. Null shows the network as "coming soon" without a link. */
  url: string | null
  /** Optional visible handle, e.g. "@elevateprosoccer". */
  handle?: string
}

export interface LeagueConfig {
  name: string
  shortName: string
  /** Public site address, used for links and images in emails. No trailing slash. */
  siteUrl: string
  /** Time zone for dates in emails, e.g. payment time. */
  timeZone: string
  divisions: Division[]
  /** Shown under the divisions while any division's eligibility is still null. */
  eligibilityPendingNote: string
  season: {
    /** Singular weekday games are played on, e.g. "Sunday". */
    gameDay: string
    startMonth: string
    startDay: number
    startYear: number | null
    regularSeasonGames: number
    playoffTeams: number
  }
  venue: {
    name: string
    /** e.g. "1234 Example Rd". Null hides the address. */
    streetAddress: string | null
    city: string
    region: string
    /** Two-letter state code used in the postal address, e.g. "UT". */
    regionCode: string
    postalCode: string | null
    /** Maps link. Null hides the "Get directions" button. */
    directionsUrl: string | null
    /** Confirmed facility amenities. Empty hides the list. */
    amenities: string[]
    /**
     * Partnership label shown with the venue's logo in the header, venue section and footer.
     * Null hides the logo and label everywhere.
     */
    partnerLabel: string | null
  }
  awards: Array<{ id: 'champions' | 'runners-up' | 'mvp'; title: string; prize: string }>
  pricing: {
    /** ISO 4217 currency code, used for display and for Stripe. */
    currency: string
    /** Null shows "Pricing coming soon" and blocks online payment for that registration type. */
    team: Price | null
    player: Price | null
  }
  contact: {
    email: string | null
    /** Display format, e.g. "801-555-0100". */
    phones: string[]
  }
  social: SocialLink[]
  /**
   * Registration emails sent after a successful payment (server/webhook.ts → Resend).
   * The sender's domain must be verified in Resend — see README.md.
   */
  email: {
    /** Sender shown to families, e.g. "ElevatePro Soccer League <registration@example.com>". */
    from: string
    /** Where families' replies go. */
    replyTo: string
    /** Receives a copy of every paid registration with all form details. Empty sends none. */
    notify: string[]
  }
  registration: {
    /**
     * When true, submitting a registration form creates a Stripe Checkout session
     * (api/register.ts) and sends the visitor to pay. Turn this on only after
     * STRIPE_SECRET_KEY is set in Vercel — see README.md.
     *
     * When false, forms still validate but nothing is sent, and the site says so.
     */
    onlinePayments: boolean
  }
}

export const league: LeagueConfig = {
  name: 'ElevatePro Soccer League',
  shortName: 'ElevatePro',
  siteUrl: 'https://www.elevateprosoccer.com',
  timeZone: 'America/Denver',

  divisions: [
    { id: 'U8', bornOnOrAfter: '2018-08-01' },
    { id: 'U10', bornOnOrAfter: '2016-08-01' },
    { id: 'U12', bornOnOrAfter: '2014-08-01' },
    { id: 'U14', bornOnOrAfter: '2012-08-01' },
  ],
  eligibilityPendingNote: 'Birth-year eligibility for each division will be confirmed by ElevatePro.',

  season: {
    gameDay: 'Sunday',
    startMonth: 'October',
    startDay: 25,
    startYear: 2026,
    regularSeasonGames: 8,
    playoffTeams: 4,
  },

  venue: {
    name: 'Axe House Sports',
    streetAddress: '6345 Crimson View Drive',
    city: 'South Jordan',
    region: 'Utah',
    regionCode: 'UT',
    postalCode: '84009',
    directionsUrl:
      'https://www.google.com/maps/search/?api=1&query=Axe%20House%20Sports%2C%206345%20Crimson%20View%20Drive%2C%20South%20Jordan%2C%20UT%2084009',
    amenities: [
      '6,000 sq. ft. lower-level warehouse',
      'Indoor turf with a 10 mm shock pad, so it never feels like concrete',
      'Small-sided futsal field with futsal goals',
      'Access to 4 bathrooms',
      '2 water fountains with bottle fillers',
      'Heated indoor play all winter long',
    ],
    partnerLabel: 'Official venue partner',
  },

  awards: [
    { id: 'champions', title: 'Champions', prize: 'Trophy + medals' },
    { id: 'runners-up', title: 'Runners-up', prize: 'Medals' },
    { id: 'mvp', title: 'MVP', prize: 'Gift card' },
  ],

  pricing: {
    currency: 'USD',
    team: { amount: 350, unit: 'per team' },
    player: { amount: 50, unit: 'per player' },
  },

  contact: {
    email: 'elevateprosoccer@gmail.com',
    phones: ['801-688-0833', '801-970-3771'],
  },

  // Placeholders: add each profile URL when the accounts are ready.
  social: [
    { label: 'Instagram', url: null },
    { label: 'Facebook', url: null },
  ],

  email: {
    from: 'ElevatePro Soccer League <registration@elevateprosoccer.com>',
    replyTo: 'elevateprosoccer@gmail.com',
    notify: ['elevateprosoccer@gmail.com'],
  },

  registration: {
    onlinePayments: true,
  },
}
