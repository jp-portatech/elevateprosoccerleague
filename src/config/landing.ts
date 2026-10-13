/**
 * Advertising landing pages:
 *   /join-as-a-player  — parents of children who don't have a team
 *   /register-a-team   — coaches and organizers bringing a whole team
 *
 * League facts the pages share with the rest of the site (start date, venue, divisions, prices,
 * number of games, playoff teams) come from league.ts — change them there.
 *
 * Each page also has a Spanish version for Spanish-language ads: /es/join-as-a-player and
 * /es/register-a-team. Text below is written in both languages.
 *
 * Offer terms here that the league hasn't approved are switched off (`confirmed: false`) and are
 * never shown. Switch one on only once the league has actually confirmed it, not because a mockup
 * shows it. Imports use `.js` because server/lead.ts reads this file too.
 */
import type { Localized } from '../i18n/locale.js'

export interface OfferTerm {
  text: Localized
  /** Shown on the page only when true. */
  confirmed: boolean
}

export interface Guarantee {
  /** Shown only when true AND `text` is set. Otherwise the page shows the "ask first" band. */
  confirmed: boolean
  title: Localized
  text: Localized
}

export const landing = {
  /** Game format, as supplied in the landing-page brief. */
  format: '5v5',
  /** The league publishes live scores and standings during the season (per the landing-page brief). */
  liveStandings: true,
  /**
   * "Bringing two teams? Ask about the discount." No amount is set, so none is shown or implied.
   * Set `details` (e.g. { en: 'Save $50 on your second team', es: '…' }) only once the league confirms it.
   */
  twoTeamDiscount: { offered: true, details: null as Localized | null },

  player: {
    path: { en: '/join-as-a-player', es: '/es/join-as-a-player' } satisfies Localized,
    /** Shown in the player package only when confirmed. */
    proposed: [
      { text: { en: '100% team placement guarantee', es: 'Garantía de asignación de equipo al 100%' }, confirmed: false },
      {
        text: { en: 'Balanced team with a dedicated coach', es: 'Equipo equilibrado con entrenador dedicado' },
        confirmed: false,
      },
      { text: { en: 'Jersey included', es: 'Uniforme incluido' }, confirmed: false },
    ] satisfies OfferTerm[],
    guarantee: {
      confirmed: false,
      title: { en: 'The First Game Guarantee', es: 'La garantía del primer partido' },
      text: {
        en: 'Sign up today to lock in your spot. If your child doesn’t absolutely love their very first game of the season, let us know before the second week and we will give you a 100% refund, no questions asked.',
        es: 'Inscríbete hoy para asegurar tu lugar. Si a tu hijo no le encanta su primer partido de la temporada, avísanos antes de la segunda semana y te devolvemos el 100% de tu dinero, sin preguntas.',
      },
    } satisfies Guarantee,
  },

  team: {
    path: { en: '/register-a-team', es: '/es/register-a-team' } satisfies Localized,
    proposed: [
      { text: { en: 'Certified referees', es: 'Árbitros certificados' }, confirmed: false },
      { text: { en: 'Skill-matched divisions', es: 'Divisiones según el nivel de juego' }, confirmed: false },
      { text: { en: 'Online roster management', es: 'Manejo del plantel en línea' }, confirmed: false },
    ] satisfies OfferTerm[],
    /**
     * No team refund policy has been approved. The individual-player guarantee must not be
     * applied to a whole team's fee; write a team policy here if the league adopts one.
     */
    guarantee: { confirmed: false, title: { en: '', es: '' }, text: { en: '', es: '' } } satisfies Guarantee,
  },

  /**
   * Where the pages' information-request forms are sent. server/lead.ts emails the league inbox
   * (league.email.notify), sends the person a confirmation, and saves the request to the admin
   * dashboard and the Resend contact list. Needs RESEND_API_KEY in Vercel.
   */
  inquiryEndpoint: '/api/contact',
}
