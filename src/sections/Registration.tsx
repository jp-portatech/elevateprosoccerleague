import { Icon } from '../components/Icon'
import { RegisterButton } from '../components/RegisterButton'
import { SectionHeading } from '../components/SectionHeading'
import { PRICE_COMING_SOON, capitalize, divisionRange, formatPrice, gameDays, onlinePayments } from '../config/derived'
import { league, type Price } from '../config/league'
import { useLocale } from '../i18n/useLocale'
import { localized, type Locale } from '../i18n/locale'
import type { RegistrationKind } from '../registration/context'
import { reveal } from '../motion/reveal'
import './Registration.css'

const { season, venue, pricing } = league

// Inclusions use only confirmed league facts from src/config/league.ts.
const COPY = localized({
  en: {
    eyebrow: 'Pricing & registration',
    title: 'Registration',
    intro: 'Choose how you want to join the league.',
    included: 'What’s included',
    payNote: 'Paid securely online by card when you register.',
    shared: [
      `${season.regularSeasonGames} regular-season games`,
      `${capitalize(gameDays.en)} at ${venue.name}`,
      `Top ${season.playoffTeams} teams advance to the playoffs`,
      'Champion, runner-up and MVP awards',
    ],
    plans: {
      team: {
        title: 'Team registration',
        summary: 'Register your complete team for the season.',
        includes: [`Team entry in your age division (${divisionRange})`],
      },
      player: {
        title: 'Individual player registration',
        summary: 'Sign up as an individual player and ElevatePro will place you on a team.',
        includes: ['Placement on a team in your age division', 'Team and season information once placed'],
      },
    },
  },
  es: {
    eyebrow: 'Precios e inscripción',
    title: 'Inscripción',
    intro: 'Elige cómo quieres unirte a la liga.',
    included: 'Qué incluye',
    payNote: 'Pago seguro en línea con tarjeta al inscribirte.',
    shared: [
      `${season.regularSeasonGames} partidos de temporada regular`,
      `${capitalize(gameDays.es)} en ${venue.name}`,
      `Los ${season.playoffTeams} mejores equipos avanzan a los playoffs`,
      'Premios para campeón, subcampeón y MVP',
    ],
    plans: {
      team: {
        title: 'Inscripción de equipo',
        summary: 'Inscribe a tu equipo completo para la temporada.',
        includes: [`Inscripción del equipo en su división de edad (${divisionRange})`],
      },
      player: {
        title: 'Inscripción individual',
        summary: 'Inscríbete como jugador individual y ElevatePro te asignará un equipo.',
        includes: ['Asignación a un equipo de tu división de edad', 'Información del equipo y de la temporada al ser asignado'],
      },
    },
  },
})

const PLANS: Array<{ kind: RegistrationKind; icon: 'team' | 'player'; price: Price | null }> = [
  { kind: 'team', icon: 'team', price: pricing.team },
  { kind: 'player', icon: 'player', price: pricing.player },
]

function PriceTag({ price, locale }: { price: Price | null; locale: Locale }) {
  if (!price) return <p className="plan__price plan__price--pending">{PRICE_COMING_SOON[locale]}</p>
  return (
    <div className="plan__price">
      <p>
        <span className="plan__amount">{formatPrice(price, locale)}</span>{' '}
        <span className="plan__unit">{price.unit[locale]}</span>
      </p>
      {price.note && <p className="fine-print">{price.note[locale]}</p>}
      {onlinePayments && <p className="fine-print plan__pay-note">{COPY[locale].payNote}</p>}
    </div>
  )
}

export function Registration() {
  const locale = useLocale()
  const t = COPY[locale]
  return (
    <section className="section section--white pricing section--rule" id="register" aria-labelledby="register-title">
      <div className="container">
        <div className="pricing__head" {...reveal()}>
          <SectionHeading id="register-title" eyebrow={t.eyebrow}>
            {t.title}
          </SectionHeading>
          <p className="section-intro">{t.intro}</p>
        </div>

        <div className="plans" {...reveal('stagger')}>
          {PLANS.map((plan) => {
            const copy = t.plans[plan.kind]
            return (
              <article className={`plan plan--${plan.kind}`} key={plan.kind} aria-labelledby={`plan-${plan.kind}`}>
                <div className="plan__head">
                  <Icon name={plan.icon} className="plan__icon" />
                  <div>
                    <h3 className="h3-display plan__title" id={`plan-${plan.kind}`}>
                      {copy.title}
                    </h3>
                    <p className="plan__summary">{copy.summary}</p>
                  </div>
                </div>

                <PriceTag price={plan.price} locale={locale} />

                <div>
                  <h4 className="plan__includes">{t.included}</h4>
                  <ul className="checklist">
                    {[...copy.includes, ...t.shared].map((item) => (
                      <li key={item}>
                        <Icon name="check" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <RegisterButton
                  kind={plan.kind}
                  variant={plan.kind === 'team' ? 'primary' : 'secondary'}
                  className="plan__cta"
                />
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
