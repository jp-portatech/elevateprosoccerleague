import { Icon } from '../components/Icon'
import { SectionHeading } from '../components/SectionHeading'
import { eligibilityLabel, eligibilityPending } from '../config/derived'
import { league } from '../config/league'
import { useLocale } from '../i18n/useLocale'
import { localized } from '../i18n/locale'
import { useRegistration } from '../registration/context'
import './Divisions.css'

const COPY = localized({
  en: {
    eyebrow: 'Age divisions',
    title: 'Find your division',
    note: 'Divisions are based on date of birth. Players must be born on or after the date shown.',
    team: 'Register a team',
    player: 'Register a player',
    in: (division: string) => ` in ${division}`,
  },
  es: {
    eyebrow: 'Divisiones por edad',
    title: 'Encuentra tu división',
    note: 'Las divisiones se basan en la fecha de nacimiento. Los jugadores deben haber nacido en la fecha indicada o después.',
    team: 'Inscribir equipo',
    player: 'Inscribir jugador',
    in: (division: string) => ` en ${division}`,
  },
})

export function Divisions() {
  const { openRegistration } = useRegistration()
  const locale = useLocale()
  const t = COPY[locale]

  return (
    <section className="section divisions" id="divisions" aria-labelledby="divisions-title">
      <div className="container divisions__grid">
        <div>
          <SectionHeading id="divisions-title" eyebrow={t.eyebrow}>
            {t.title}
          </SectionHeading>
          <p className="divisions__note fine-print">
            {eligibilityPending ? league.eligibilityPendingNote[locale] : t.note}
          </p>
        </div>

        <ul className="division-list">
          {league.divisions.map((division) => (
            <li className="division" key={division.id}>
              <h3 className="division__name">{division.id}</h3>
              {division.bornOnOrAfter && (
                <p className="division__eligibility">{eligibilityLabel(division, locale, true)}</p>
              )}
              <span className="division__rule" aria-hidden="true" />
              <div className="division__links">
                <button
                  type="button"
                  className="text-link"
                  aria-haspopup="dialog"
                  onClick={() => openRegistration('team', division.id)}
                >
                  {t.team}
                  <span className="visually-hidden">{t.in(division.id)}</span>
                  <Icon name="arrow" />
                </button>
                <button
                  type="button"
                  className="text-link"
                  aria-haspopup="dialog"
                  onClick={() => openRegistration('player', division.id)}
                >
                  {t.player}
                  <span className="visually-hidden">{t.in(division.id)}</span>
                  <Icon name="arrow" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
