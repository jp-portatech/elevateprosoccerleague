import type { AccordionItem } from '../components/Accordion'
import {
  divisionSentence,
  eligibilityLabel,
  eligibilityPending,
  formatPrice,
  gameDays,
  onlinePayments,
  startDateLabel,
  venueAddress,
  venueLocation,
} from '../config/derived'
import { league } from '../config/league'
import { ContactLine } from '../registration/ContactLine'

const { season, venue, pricing } = league
const prize = (id: string) =>
  league.awards
    .find((a) => a.id === id)
    ?.prize.toLowerCase()
    .replace(' + ', ' and ')

/**
 * FAQ answers are built only from confirmed league details in src/config/league.ts.
 * Don't add policies (refunds, roster limits, match times) until the league provides them.
 */
export const faqItems: AccordionItem[] = [
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
        There are {league.divisions.length} age divisions: {divisionSentence}.
      </p>
    ) : (
      <>
        <p>There are {league.divisions.length} age divisions, based on date of birth:</p>
        <ul className="faq-list">
          {league.divisions.map((d) => (
            <li key={d.id}>
              <strong>{d.id}</strong>: {eligibilityLabel(d)?.replace('Born', 'born')}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: 'game-day',
    question: 'What days are games played?',
    answer: (
      <p>
        Games are played on {gameDays}. The season starts {startDateLabel}.
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
        After the {season.regularSeasonGames}-game regular season, the top {season.playoffTeams} teams advance to the
        playoffs to decide the champion. Champions receive a {prize('champions')}, runners-up receive{' '}
        {prize('runners-up')}, and the MVP receives a {prize('mvp')}.
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
              Team registration is {formatPrice(pricing.team)} {pricing.team.unit}, and individual player
              registration is {formatPrice(pricing.player)} {pricing.player.unit}.
              {onlinePayments && ' You pay online by card when you register.'}
            </p>
          ),
        },
      ]
    : []),
  {
    id: 'location',
    question: 'Where are games played?',
    answer: (
      <p>
        Games are played at {venue.name}
        {venueAddress ? <>, {venueAddress}</> : <> in {venueLocation}</>}.
      </p>
    ),
  },
  ...(league.contact.email || league.contact.phones.length
    ? [
        {
          id: 'contact',
          question: 'How can I contact ElevatePro?',
          answer: <ContactLine lead="Reach ElevatePro" />,
        },
      ]
    : []),
]
