import { Icon, type IconName } from '../components/Icon'
import { SectionHeading } from '../components/SectionHeading'
import { league } from '../config/league'
import './SeasonFormat.css'

const { regularSeasonGames, playoffTeams } = league.season
const championPrize = league.awards.find((a) => a.id === 'champions')?.prize

const stages: Array<{ icon: IconName; value: string; label: string | undefined }> = [
  { icon: 'field', value: String(regularSeasonGames), label: 'Regular-season games' },
  { icon: 'team', value: `Top ${playoffTeams}`, label: 'Teams advance' },
  { icon: 'bracket', value: 'Playoffs', label: 'Decide the champion' },
  { icon: 'trophy', value: 'Champion', label: championPrize },
]

export function SeasonFormat() {
  return (
    <section className="section section--white format" id="format" aria-labelledby="format-title">
      <div className="container format__grid">
        <div>
          <SectionHeading id="format-title" eyebrow="Season format">
            One season. Every game matters.
          </SectionHeading>
          <p className="section-intro">
            {regularSeasonGames} regular-season games. The top {playoffTeams} teams advance to the playoffs to decide
            the champion.
          </p>
        </div>

        <ol className="stages" aria-label="Season progression">
          {stages.map((stage) => (
            <li className="stage" key={stage.value}>
              <div className="stage__card">
                <Icon name={stage.icon} className="stage__icon" />
                <div>
                  <p className="stage__value">{stage.value}</p>
                  {stage.label && <p className="stage__label">{stage.label}</p>}
                </div>
              </div>
              <Icon name="arrow" className="stage__arrow" />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
