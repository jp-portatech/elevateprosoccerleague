import type { AccordionItem } from '../components/Accordion'
import {
  divisionSentence,
  eligibilityPending,
  eligibilityText,
  formatPrice,
  gameDays,
  onlinePayments,
  startDateLabel,
  venueAddress,
  venueLocation,
} from '../config/derived'
import { league } from '../config/league'
import type { Locale, Localized } from '../i18n/locale'
import { ContactLine } from '../registration/ContactLine'

const { season, venue, pricing, divisions } = league
const where = venueAddress ? `${venue.name}, ${venueAddress}` : venue.name

/** "trophy and medals" / "trofeo y medallas" */
const prize = (id: string, locale: Locale) =>
  league.awards
    .find((a) => a.id === id)
    ?.prize[locale].toLowerCase()
    .replace(' + ', locale === 'es' ? ' y ' : ' and ')

const divisionList = (locale: Locale) => (
  <ul className="faq-list">
    {divisions.map((d) => (
      <li key={d.id}>
        <strong>{d.id}</strong>: {eligibilityText(d, locale)}
      </li>
    ))}
  </ul>
)

const hasContact = Boolean(league.contact.email || league.contact.phones.length)

/**
 * FAQ answers are built only from confirmed league details in src/config/league.ts.
 * Don't add policies (refunds, roster limits, match times) until the league provides them.
 */
export const faqItems: Localized<AccordionItem[]> = {
  en: [
    {
      id: 'no-team',
      question: 'Can a player register without a team?',
      answer: (
        <p>
          Yes. Individual players are welcome. Register your player individually and ElevatePro will place them on a
          team in the appropriate age division, then share your team and season information.
        </p>
      ),
    },
    {
      id: 'divisions',
      question: 'Which divisions are available?',
      answer: eligibilityPending ? (
        <p>
          There are {divisions.length} age divisions: {divisionSentence.en}.
        </p>
      ) : (
        <>
          <p>There are {divisions.length} age divisions, based on date of birth:</p>
          {divisionList('en')}
        </>
      ),
    },
    {
      id: 'game-day',
      question: 'What days are games played?',
      answer: (
        <p>
          Games are played on {gameDays.en}. The season starts {startDateLabel.en}.
        </p>
      ),
    },
    {
      id: 'games',
      question: 'How many regular-season games are included?',
      answer: <p>The regular season includes {season.regularSeasonGames} games.</p>,
    },
    {
      id: 'playoffs',
      question: 'How do playoffs work?',
      answer: (
        <p>
          After the {season.regularSeasonGames}-game regular season, the top {season.playoffTeams} teams advance to
          the playoffs to decide the champion. Champions receive a {prize('champions', 'en')}, runners-up receive{' '}
          {prize('runners-up', 'en')}, and the MVP receives a {prize('mvp', 'en')}.
        </p>
      ),
    },
    ...(pricing.team && pricing.player
      ? [
          {
            id: 'cost',
            question: 'How much does it cost?',
            answer: (
              <p>
                Team registration is {formatPrice(pricing.team)} {pricing.team.unit.en}, and individual player
                registration is {formatPrice(pricing.player)} {pricing.player.unit.en}.
                {onlinePayments && ' You pay online by card when you register.'}
              </p>
            ),
          },
        ]
      : []),
    {
      id: 'location',
      question: 'Where are games played?',
      answer: <p>Games are played at {venueAddress ? where : `${venue.name} in ${venueLocation}`}.</p>,
    },
    ...(hasContact
      ? [{ id: 'contact', question: 'How can I contact ElevatePro?', answer: <ContactLine lead="Reach ElevatePro" /> }]
      : []),
  ],
  es: [
    {
      id: 'no-team',
      question: '¿Un jugador se puede inscribir sin equipo?',
      answer: (
        <p>
          Sí. Los jugadores individuales son bienvenidos. Inscribe a tu jugador de forma individual y ElevatePro le
          asignará un equipo de su división de edad. Después te enviaremos la información del equipo y de la
          temporada.
        </p>
      ),
    },
    {
      id: 'divisions',
      question: '¿Qué divisiones hay?',
      answer: eligibilityPending ? (
        <p>
          Hay {divisions.length} divisiones de edad: {divisionSentence.es}.
        </p>
      ) : (
        <>
          <p>Hay {divisions.length} divisiones de edad, según la fecha de nacimiento:</p>
          {divisionList('es')}
        </>
      ),
    },
    {
      id: 'game-day',
      question: '¿Qué días se juegan los partidos?',
      answer: (
        <p>
          Los partidos se juegan los {gameDays.es}. La temporada inicia el {startDateLabel.es}.
        </p>
      ),
    },
    {
      id: 'games',
      question: '¿Cuántos partidos de temporada regular incluye?',
      answer: <p>La temporada regular incluye {season.regularSeasonGames} partidos.</p>,
    },
    {
      id: 'playoffs',
      question: '¿Cómo funcionan los playoffs?',
      answer: (
        <p>
          Después de la temporada regular de {season.regularSeasonGames} partidos, los {season.playoffTeams} mejores
          equipos avanzan a los playoffs para definir al campeón. Los campeones reciben {prize('champions', 'es')}, los
          subcampeones reciben {prize('runners-up', 'es')} y el MVP recibe {prize('mvp', 'es')}.
        </p>
      ),
    },
    ...(pricing.team && pricing.player
      ? [
          {
            id: 'cost',
            question: '¿Cuánto cuesta?',
            answer: (
              <p>
                La inscripción de equipo cuesta {formatPrice(pricing.team, 'es')} {pricing.team.unit.es} y la
                inscripción individual cuesta {formatPrice(pricing.player, 'es')} {pricing.player.unit.es}.
                {onlinePayments && ' Pagas en línea con tarjeta al inscribirte.'}
              </p>
            ),
          },
        ]
      : []),
    {
      id: 'location',
      question: '¿Dónde se juegan los partidos?',
      answer: <p>Los partidos se juegan en {venueAddress ? where : `${venue.name}, en ${venueLocation}`}.</p>,
    },
    ...(hasContact
      ? [
          {
            id: 'contact',
            question: '¿Cómo me comunico con ElevatePro?',
            answer: <ContactLine lead="Comunícate con ElevatePro" />,
          },
        ]
      : []),
  ],
}
