import { Icon } from '../components/Icon'
import { SectionHeading } from '../components/SectionHeading'
import { eligibilityLabel, eligibilityPending } from '../config/derived'
import { league } from '../config/league'
import { useRegistration } from '../registration/context'
import './Divisions.css'

export function Divisions() {
  const { openRegistration } = useRegistration()

  return (
    <section className="section divisions" id="divisions" aria-labelledby="divisions-title">
      <div className="container divisions__grid">
        <div>
          <SectionHeading id="divisions-title" eyebrow="Age divisions">
            Find your division
          </SectionHeading>
          <p className="divisions__note fine-print">
            {eligibilityPending
              ? league.eligibilityPendingNote
              : 'Divisions are based on date of birth. Players must be born on or after the date shown.'}
          </p>
        </div>

        <ul className="division-list">
          {league.divisions.map((division) => (
            <li className="division" key={division.id}>
              <h3 className="division__name">{division.id}</h3>
              {division.bornOnOrAfter && (
                <p className="division__eligibility">{eligibilityLabel(division, 'short')}</p>
              )}
              <span className="division__rule" aria-hidden="true" />
              <div className="division__links">
                <button
                  type="button"
                  className="text-link"
                  aria-haspopup="dialog"
                  onClick={() => openRegistration('team', division.id)}
                >
                  Register a team<span className="visually-hidden"> in {division.id}</span>
                  <Icon name="arrow" />
                </button>
                <button
                  type="button"
                  className="text-link"
                  aria-haspopup="dialog"
                  onClick={() => openRegistration('player', division.id)}
                >
                  Register a player<span className="visually-hidden"> in {division.id}</span>
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
