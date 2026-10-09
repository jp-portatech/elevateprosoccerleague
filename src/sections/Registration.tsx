import { Icon } from '../components/Icon'
import { RegisterButton } from '../components/RegisterButton'
import { SectionHeading } from '../components/SectionHeading'
import { PRICE_COMING_SOON, divisionRange, formatPrice, gameDays, onlinePayments } from '../config/derived'
import { league, type Price } from '../config/league'
import type { RegistrationKind } from '../registration/context'
import './Registration.css'

const { season, venue, pricing } = league

// Inclusions use only confirmed league facts from src/config/league.ts.
const sharedInclusions = [
  `${season.regularSeasonGames} regular-season games`,
  `${gameDays} at ${venue.name}`,
  `Top ${season.playoffTeams} teams advance to the playoffs`,
  'Champion, runner-up and MVP awards',
]

const plans: Array<{
  kind: RegistrationKind
  icon: 'team' | 'player'
  title: string
  summary: string
  price: Price | null
  includes: string[]
}> = [
  {
    kind: 'team',
    icon: 'team',
    title: 'Team registration',
    summary: 'Register your complete team for the season.',
    price: pricing.team,
    includes: [`Team entry in your age division (${divisionRange})`, ...sharedInclusions],
  },
  {
    kind: 'player',
    icon: 'player',
    title: 'Individual player registration',
    summary: 'Sign up as an individual player and ElevatePro will place you on a team.',
    price: pricing.player,
    includes: [
      'Placement on a team in your age division',
      'Team and season information once placed',
      ...sharedInclusions,
    ],
  },
]

function PriceTag({ price }: { price: Price | null }) {
  if (!price) return <p className="plan__price plan__price--pending">{PRICE_COMING_SOON}</p>
  return (
    <div className="plan__price">
      <p>
        <span className="plan__amount">{formatPrice(price)}</span> <span className="plan__unit">{price.unit}</span>
      </p>
      {price.note && <p className="fine-print">{price.note}</p>}
      {onlinePayments && <p className="fine-print plan__pay-note">Paid securely online by card when you register.</p>}
    </div>
  )
}

export function Registration() {
  return (
    <section className="section section--white pricing section--rule" id="register" aria-labelledby="register-title">
      <div className="container">
        <div className="pricing__head">
          <SectionHeading id="register-title" eyebrow="Pricing & registration">
            Registration
          </SectionHeading>
          <p className="section-intro">Choose how you want to join the league.</p>
        </div>

        <div className="plans">
          {plans.map((plan) => (
            <article className={`plan plan--${plan.kind}`} key={plan.kind} aria-labelledby={`plan-${plan.kind}`}>
              <div className="plan__head">
                <Icon name={plan.icon} className="plan__icon" />
                <div>
                  <h3 className="h3-display plan__title" id={`plan-${plan.kind}`}>
                    {plan.title}
                  </h3>
                  <p className="plan__summary">{plan.summary}</p>
                </div>
              </div>

              <PriceTag price={plan.price} />

              <div>
                <h4 className="plan__includes">What’s included</h4>
                <ul className="checklist">
                  {plan.includes.map((item) => (
                    <li key={item}>
                      <Icon name="check" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <RegisterButton kind={plan.kind} variant={plan.kind === 'team' ? 'primary' : 'secondary'} className="plan__cta" />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
