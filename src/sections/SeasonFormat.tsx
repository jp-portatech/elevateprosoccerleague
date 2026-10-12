import { Icon, type IconName } from '../components/Icon'
import { SectionHeading } from '../components/SectionHeading'
import { league } from '../config/league'
import { useLocale } from '../i18n/useLocale'
import { localized } from '../i18n/locale'
import './SeasonFormat.css'

const { regularSeasonGames, playoffTeams } = league.season
const championPrize = league.awards.find((a) => a.id === 'champions')?.prize

const ICONS: IconName[] = ['field', 'team', 'bracket', 'trophy']

const COPY = localized({
  en: {
    eyebrow: 'Season format',
    title: 'One season. Every game matters.',
    intro: `${regularSeasonGames} regular-season games. The top ${playoffTeams} teams advance to the playoffs to decide the champion.`,
    stagesLabel: 'Season progression',
    stages: [
      { value: String(regularSeasonGames), label: 'Regular-season games' },
      { value: `Top ${playoffTeams}`, label: 'Teams advance' },
      { value: 'Playoffs', label: 'Decide the champion' },
      { value: 'Champion', label: championPrize?.en },
    ],
  },
  es: {
    eyebrow: 'Formato de la temporada',
    title: 'Una temporada. Cada partido cuenta.',
    intro: `${regularSeasonGames} partidos de temporada regular. Los ${playoffTeams} mejores equipos avanzan a los playoffs para definir al campeón.`,
    stagesLabel: 'Etapas de la temporada',
    stages: [
      { value: String(regularSeasonGames), label: 'Partidos de temporada regular' },
      { value: `Top ${playoffTeams}`, label: 'Equipos que avanzan' },
      { value: 'Playoffs', label: 'Definen al campeón' },
      { value: 'Campeón', label: championPrize?.es },
    ],
  },
})

export function SeasonFormat() {
  const t = COPY[useLocale()]
  return (
    <section className="section section--white format" id="format" aria-labelledby="format-title">
      <div className="container format__grid">
        <div>
          <SectionHeading id="format-title" eyebrow={t.eyebrow}>
            {t.title}
          </SectionHeading>
          <p className="section-intro">{t.intro}</p>
        </div>

        <ol className="stages" aria-label={t.stagesLabel}>
          {t.stages.map((stage, i) => (
            <li className="stage" key={ICONS[i]}>
              <div className="stage__card">
                <Icon name={ICONS[i]} className="stage__icon" />
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
