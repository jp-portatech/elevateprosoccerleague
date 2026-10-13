/**
 * Advertising landing pages:
 *   /join-as-a-player  — parents of children who don't have a team
 *   /register-a-team   — coaches and organizers bringing a whole team
 *
 * League facts the pages share with the rest of the site (start date, venue, divisions, prices,
 * number of games, playoff teams) come from league.ts — change them there.
 *
 * Offer terms here that the league hasn't approved are switched off (`confirmed: false`) and are
 * never shown. Switch one on only once the league has actually confirmed it, not because a mockup
 * shows it. Imports use `.js` because server/lead.ts reads this file too.
 */

export interface OfferTerm {
  text: string
  /** Shown on the page only when true. */
  confirmed: boolean
}

export interface Guarantee {
  /** Shown only when true AND `text` is set. Otherwise the page shows the "ask first" band. */
  confirmed: boolean
  title: string
  text: string
}

export const landing = {
  /** Game format, as supplied in the landing-page brief. */
  format: '5v5',
  /** The league publishes live scores and standings during the season (per the landing-page brief). */
  liveStandings: true,
  /**
   * "Bringing two teams? Ask about the discount." No amount is set, so none is shown or implied.
   * Set `details` (e.g. "Save $50 on your second team") only once the league confirms it.
   */
  twoTeamDiscount: { offered: true, details: null as string | null },

  player: {
    path: '/join-as-a-player',
    /** Shown in the player package only when confirmed. */
    proposed: [
      { text: '100% team placement guarantee', confirmed: false },
      { text: 'Balanced team with a dedicated coach', confirmed: false },
      { text: 'Jersey included', confirmed: false },
    ] satisfies OfferTerm[],
    guarantee: {
      confirmed: false,
      title: 'The First Game Guarantee',
      text: 'Sign up today to lock in your spot. If your child doesn’t absolutely love their very first game of the season, let us know before the second week and we will give you a 100% refund, no questions asked.',
    } satisfies Guarantee,
  },

  team: {
    path: '/register-a-team',
    proposed: [
      { text: 'Certified referees', confirmed: false },
      { text: 'Skill-matched divisions', confirmed: false },
      { text: 'Online roster management', confirmed: false },
    ] satisfies OfferTerm[],
    /**
     * No team refund policy has been approved. The individual-player guarantee must not be
     * applied to a whole team's fee; write a team policy here if the league adopts one.
     */
    guarantee: { confirmed: false, title: '', text: '' } satisfies Guarantee,
  },

  /**
   * Where the pages' information-request forms are sent. server/lead.ts emails the league inbox
   * (league.email.notify), sends the person a confirmation, and saves the request to the admin
   * dashboard and the Resend contact list. Needs RESEND_API_KEY in Vercel.
   */
  inquiryEndpoint: '/api/contact',
}
