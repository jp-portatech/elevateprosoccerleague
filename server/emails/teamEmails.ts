/**
 * "Send team info" emails from the admin dashboard (server/admin.ts):
 *   - buildTeamFamilyEmail  → each placed player's family, in the language they registered in
 *   - buildTeamCoachEmail   → the team's coach: the roster with parent contacts (English)
 *
 * Families never see other children's details; only the coach gets the roster.
 * All wording lives in this file — edit freely.
 */
import { formatIsoDate } from '../../src/config/derived.js'
import { league } from '../../src/config/league.js'
import { localized, type Locale } from '../../src/i18n/locale.js'
import { ageOn, experienceLabel, playerName, type AdminRegistration, type AdminTeam } from '../../src/admin/model.js'
import {
  detailsBox,
  esc,
  firstName,
  FONT,
  layout,
  NAVY,
  p,
  questionsHtml,
  questionsText,
  seasonDetailsHtml,
  seasonDetailsText,
  SITE,
  textRows,
  type RenderedEmail,
  type Rows,
} from './layout.js'

const heading = (text: string) =>
  `<h1 style="margin:0 0 18px;font-family:'Arial Black', ${FONT};font-size:28px;line-height:1.12;text-transform:uppercase;color:${NAVY};">${esc(text)}</h1>`

const FAMILY = localized({
  en: {
    subject: (player: string, team: string) => `${player} is on ${team} | ${league.name}`,
    preheader: (team: string) => `Your team for the ${league.shortName} season: ${team}.`,
    heading: 'Meet your team!',
    greeting: (name: string) => `Hi ${name},`,
    intro: (player: string, team: string, division: string) =>
      `<strong>${player}</strong> has been placed on <strong>${team}</strong> in the <strong>${division}</strong> division.`,
    coachTitle: 'Your coach',
    coach: 'Coach',
    phone: 'Phone',
    email: 'Email',
    noCoach: `${league.shortName} will share your coach’s details soon.`,
    signOff: 'See you on the field,',
    footer: `You’re receiving this email because you registered a player at ${SITE}.`,
  },
  es: {
    subject: (player: string, team: string) => `${player} ya tiene equipo: ${team} | ${league.name}`,
    preheader: (team: string) => `Tu equipo para la temporada de ${league.shortName}: ${team}.`,
    heading: '¡Conoce a tu equipo!',
    greeting: (name: string) => `Hola, ${name}:`,
    intro: (player: string, team: string, division: string) =>
      `<strong>${player}</strong> quedó en el equipo <strong>${team}</strong> de la división <strong>${division}</strong>.`,
    coachTitle: 'Tu entrenador',
    coach: 'Entrenador',
    phone: 'Teléfono',
    email: 'Correo electrónico',
    noCoach: `${league.shortName} te enviará pronto los datos del entrenador.`,
    signOff: '¡Nos vemos en la cancha!',
    footer: `Recibes este correo porque inscribiste a un jugador en ${SITE}.`,
  },
})

export function buildTeamFamilyEmail(team: AdminTeam, player: AdminRegistration): RenderedEmail {
  const locale: Locale = player.locale === 'es' ? 'es' : 'en'
  const t = FAMILY[locale]
  const name = player.fields.playerFirstName || playerName(player)
  const greeting = t.greeting(firstName(player.fields.guardianName || ''))
  const coach: Rows = [
    [t.coach, team.coachName],
    [t.phone, team.coachPhone],
    [t.email, team.coachEmail],
  ]
  const hasCoach = coach.some(([, value]) => value)
  const subject = t.subject(name, team.name)

  const html = layout(
    locale,
    subject,
    t.preheader(team.name),
    `${heading(t.heading)}
    ${p(esc(greeting))}
    ${p(t.intro(esc(name), esc(team.name), esc(team.division)))}
    ${hasCoach ? detailsBox(t.coachTitle, coach) : p(esc(t.noCoach))}
    ${seasonDetailsHtml(locale)}
    ${questionsHtml(locale)}
    ${p(`${esc(t.signOff)}<br><strong style="color:${NAVY};">${esc(league.name)}</strong>`)}`,
    t.footer,
  )

  const text = [
    t.heading,
    '',
    greeting,
    '',
    t.intro(name, team.name, team.division).replace(/<\/?strong>/g, ''),
    '',
    ...(hasCoach ? [t.coachTitle.toUpperCase(), ...textRows(coach)] : [t.noCoach]),
    '',
    ...seasonDetailsText(locale),
    '',
    questionsText(locale),
    '',
    t.signOff,
    league.name,
  ].join('\n')

  return { subject, html, text }
}

export function buildTeamCoachEmail(team: AdminTeam, players: AdminRegistration[]): RenderedEmail {
  const subject = `Your ${team.division} roster: ${team.name} (${players.length} player${players.length === 1 ? '' : 's'})`
  const greeting = team.coachName ? `Hi ${firstName(team.coachName)},` : 'Hi Coach,'
  const intro = team.registrationId
    ? `These players from the ${league.shortName} player pool have joined <strong>${esc(team.name)}</strong>. Their families have your contact details and may reach out.`
    : `Here’s your roster for <strong>${esc(team.name)}</strong> in the ${esc(team.division)} division. Families have your contact details and may reach out.`

  const rosterRows = (r: AdminRegistration): Rows => {
    const f = r.fields
    const age = f.dateOfBirth ? ageOn(f.dateOfBirth) : null
    return [
      ['Born', f.dateOfBirth ? `${formatIsoDate(f.dateOfBirth)}${age !== null ? ` (age ${age})` : ''}` : ''],
      ['Parent/guardian', f.guardianName ?? ''],
      ['Phone', r.phone],
      ['Email', r.email],
      ['Experience', experienceLabel(f.experience)],
      ['Language', r.locale === 'es' ? 'Spanish' : ''],
    ]
  }

  const html = layout(
    'en',
    subject,
    `${players.length} players on ${team.name}`,
    `${heading('Your roster')}
    ${p(esc(greeting))}
    ${p(intro)}
    ${players.map((r) => detailsBox(playerName(r), rosterRows(r))).join('\n')}
    ${seasonDetailsHtml('en')}
    ${questionsHtml('en')}
    ${p(`Thanks for coaching,<br><strong style="color:${NAVY};">${esc(league.name)}</strong>`)}`,
    `Sent from the ${league.shortName} admin dashboard. Please keep families’ details private.`,
  )

  const text = [
    'Your roster',
    '',
    greeting,
    '',
    intro.replace(/<\/?strong>/g, ''),
    '',
    ...players.flatMap((r) => [playerName(r).toUpperCase(), ...textRows(rosterRows(r)), '']),
    ...seasonDetailsText('en'),
    '',
    questionsText('en'),
  ].join('\n')

  return { subject, html, text }
}
