import { Icon, type IconName } from '../components/Icon'
import { Picture } from '../components/Picture'
import { formatPrice } from '../config/derived'
import { landing } from '../config/landing'
import { league } from '../config/league'
import { images } from '../content/images'
import { InquiryButton, LandingShell } from './LandingShell'
import { divisionsLine, numberWord, startWithWeekday } from './shared'

const { season, venue, pricing } = league
const games = season.regularSeasonGames
const gameDay = season.gameDay.en

const FACTS: Array<{ icon: IconName; value: string; label: string }> = [
  { icon: 'team', value: landing.format, label: 'Play' },
  { icon: 'trophy', value: String(games), label: 'Guaranteed games' },
  { icon: 'calendar', value: gameDay, label: 'Games' },
  { icon: 'check', value: 'Age-verified', label: 'Players' },
]

const BENEFITS: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: 'growth', title: 'Learn the fundamentals', text: 'More opportunities to play and practice.' },
  { icon: 'team', title: 'Meet new teammates', text: 'Make friends through a shared game.' },
  { icon: 'calendar', title: 'We handle the details', text: `Team formation and a consistent ${gameDay} schedule.` },
]

// Confirmed baseline, plus any proposed extras the league has switched on in config/landing.ts.
const PACKAGE = [
  'Individual players welcome',
  'Team assignment within their age division',
  `${gameDay} indoor soccer`,
  `${numberWord(games)} guaranteed games`,
  ...landing.player.proposed.filter((term) => term.confirmed).map((term) => term.text),
]

const STEPS = ['Sign up your player', 'Meet their team', `Play on ${gameDay}s`]

const guarantee = landing.player.guarantee.confirmed && landing.player.guarantee.text ? landing.player.guarantee : null

export function PlayerLanding() {
  return (
    <LandingShell type="individual_player" ctaLabel="Secure Your Child's Spot Now" audience="Individual players" theme="light">
      {/* 1. Hero */}
      <section className="lp-hero lp-hero--light" aria-labelledby="hero-title">
        <div className="container lp-hero__inner">
          <div className="lp-hero__copy">
            <p className="lp-eyebrow">No team? No problem.</p>
            <h1 className="lp-hero__title" id="hero-title">
              Get Your Child Active, Making Friends, and Playing Indoor Soccer This Season—Even If They Don’t Have a
              Team.
            </h1>
            <p className="lp-hero__lede">A {gameDay} soccer season built around play, new teammates and less work for parents.</p>
            <InquiryButton className="lp-hero__cta" />
            <p className="lp-hero__details">
              <span>{divisionsLine}</span>
              <span>Starts {startWithWeekday}</span>
            </p>
          </div>
        </div>
        <div className="lp-hero__media">
          <Picture image={images.hero} className="lp-hero__img lp-hero__img--action" sizes="(min-width: 960px) 58vw, 100vw" priority />
        </div>
      </section>

      {/* 2. Facts */}
      <section className="lp-facts" aria-label="Season at a glance">
        <ul className="container lp-facts__list">
          {FACTS.map((fact) => (
            <li className="lp-fact" key={fact.label}>
              <Icon name={fact.icon} className="lp-fact__icon" />
              <span>
                <span className="lp-fact__value">{fact.value}</span>
                <span className="lp-fact__label">{fact.label}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 3. Benefits */}
      <section className="lp-section lp-section--pale" aria-labelledby="benefits-title">
        <div className="container">
          <h2 className="lp-h2 lp-h2--center" id="benefits-title">
            One child. A whole new team.
          </h2>
          <ul className="lp-benefits">
            {BENEFITS.map((b) => (
              <li className="lp-benefit" key={b.title}>
                <span className="lp-benefit__icon lp-benefit__icon--circle">
                  <Icon name={b.icon} />
                </span>
                <div>
                  <h3 className="lp-benefit__title">{b.title}</h3>
                  <p>{b.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 4. Player package */}
      <section className="lp-package" aria-labelledby="package-title">
        <div className="lp-package__media">
          <Picture image={images.galleryCoaching} className="lp-package__img" sizes="(min-width: 960px) 52vw, 100vw" />
        </div>
        <div className="lp-package__panel">
          <p className="lp-eyebrow lp-eyebrow--ice">Individual player registration</p>
          <h2 className="lp-h2 lp-h2--light" id="package-title">
            Your player’s season, made simple.
          </h2>
          <ul className="lp-checks lp-checks--light">
            {PACKAGE.map((item) => (
              <li key={item}>
                <span className="lp-checks__mark" aria-hidden="true">
                  <Icon name="check" />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="lp-package__price">
            {pricing.player ? (
              <>
                Individual player registration: <strong>{formatPrice(pricing.player)} {pricing.player.unit.en}</strong>
              </>
            ) : (
              'Request individual player pricing.'
            )}
          </p>
        </div>
      </section>

      {/* 5. How it works */}
      <section className="lp-steps-band" aria-labelledby="steps-title">
        <div className="container lp-steps-band__inner">
          <h2 className="visually-hidden" id="steps-title">
            How it works
          </h2>
          <ol className="lp-steps">
            {STEPS.map((step, i) => (
              <li className="lp-step" key={step}>
                <span className="lp-step__num" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="lp-step__text">
                  <span className="visually-hidden">Step {i + 1}: </span>
                  {step}
                </span>
              </li>
            ))}
          </ol>
          <div className="lp-steps-band__cta">
            <InquiryButton />
          </div>
        </div>
      </section>

      {/* 6. Guarantee (only when approved) or "ask first" */}
      <section className="lp-band" aria-labelledby="band-title">
        <div className="container lp-band__inner">
          <div className="lp-band__lead">
            <span className="lp-band__icon" aria-hidden="true">
              <Icon name="check" />
            </span>
            <div>
              <p className="lp-eyebrow lp-eyebrow--ice">{guarantee ? 'Our guarantee' : 'Before you register'}</p>
              <h2 className="lp-band__title" id="band-title">
                {guarantee ? guarantee.title : 'Hear the details before you decide.'}
              </h2>
            </div>
          </div>
          <p className="lp-band__text">
            {guarantee ? guarantee.text : 'Ask about individual pricing, team placement and the season before registering.'}
          </p>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="lp-faq" aria-labelledby="faq-title">
        <div className="container">
          <h2 className="visually-hidden" id="faq-title">
            Common questions
          </h2>
          <dl className="lp-faq__list">
            <div className="lp-faq__item">
              <dt>Does my child need a team?</dt>
              <dd>No. Individual players are welcome and can be assigned to a team.</dd>
            </div>
            <div className="lp-faq__item">
              <dt>Which divisions are available?</dt>
              <dd>{league.divisions.map((d) => d.id).join(', ').replace(/, ([^,]*)$/, ' and $1')}.</dd>
            </div>
            <div className="lp-faq__item">
              <dt>Where do games happen?</dt>
              <dd>
                {venue.name}, {venue.city}, {venue.region}.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* 8. Final CTA */}
      <section className="lp-final lp-final--light" aria-labelledby="final-title">
        <div className="container lp-final__inner">
          <h2 className="lp-h2" id="final-title">
            Their next team starts here.
          </h2>
          <InquiryButton />
        </div>
      </section>
    </LandingShell>
  )
}
