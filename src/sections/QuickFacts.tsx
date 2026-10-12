import { Icon, type IconName } from '../components/Icon'
import { capitalize, divisionIds, divisionRange, gameDays } from '../config/derived'
import { league } from '../config/league'
import { useLocale } from '../i18n/useLocale'
import { localized, type Locale } from '../i18n/locale'
import './QuickFacts.css'

const NUMBER_WORDS = localized({
  en: ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'],
  // "división" is feminine: "Una división", "Cuatro divisiones"
  es: ['Cero', 'Una', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve', 'Diez'],
})
const count = (n: number, locale: Locale) => NUMBER_WORDS[locale][n] ?? String(n)
const divisionCount = divisionIds.length
const games = league.season.regularSeasonGames

const COPY = localized({
  en: {
    label: 'League at a glance',
    divisions: `${count(divisionCount, 'en')} age divisions`,
    gameDays: capitalize(gameDays.en),
    weekly: 'Weekly matches',
    games: `${games} games`,
    regularSeason: 'Regular season',
  },
  es: {
    label: 'La liga de un vistazo',
    divisions: `${count(divisionCount, 'es')} divisiones de edad`,
    gameDays: capitalize(gameDays.es),
    weekly: 'Partidos cada semana',
    games: `${games} partidos`,
    regularSeason: 'Temporada regular',
  },
})

export function QuickFacts() {
  const t = COPY[useLocale()]
  const facts: Array<{ icon: IconName; value: string; label: string }> = [
    { icon: 'team', value: divisionRange, label: t.divisions },
    { icon: 'calendar', value: t.gameDays, label: t.weekly },
    { icon: 'field', value: t.games, label: t.regularSeason },
    { icon: 'pin', value: league.venue.city, label: league.venue.name },
  ]

  return (
    <section className="quick-facts section--white" aria-label={t.label}>
      <div className="container">
        <ul className="facts">
          {facts.map((fact) => (
            <li className="fact" key={fact.icon}>
              <Icon name={fact.icon} className="fact__icon" />
              <span>
                <span className="fact__value">{fact.value}</span>
                <span className="fact__label">{fact.label}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
