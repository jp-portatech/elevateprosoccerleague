import { Icon, type IconName } from '../components/Icon'
import { divisionIds, divisionRange, gameDays } from '../config/derived'
import { league } from '../config/league'
import './QuickFacts.css'

const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']
const count = (n: number) => NUMBER_WORDS[n] ?? String(n)

const facts: Array<{ icon: IconName; value: string; label: string }> = [
  { icon: 'team', value: divisionRange, label: `${count(divisionIds.length)} age divisions` },
  { icon: 'calendar', value: gameDays, label: 'Weekly matches' },
  { icon: 'field', value: `${league.season.regularSeasonGames} games`, label: 'Regular season' },
  { icon: 'pin', value: league.venue.city, label: league.venue.name },
]

export function QuickFacts() {
  return (
    <section className="quick-facts section--white" aria-label="League at a glance">
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
