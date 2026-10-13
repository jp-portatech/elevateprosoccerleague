import { Icon, type IconName } from '../components/Icon'
import { Picture } from '../components/Picture'
import { divisionRange, formatPrice } from '../config/derived'
import { landing } from '../config/landing'
import { league } from '../config/league'
import { images } from '../content/images'
import { InquiryButton, LandingShell } from './LandingShell'
import { divisionsLine, numberWord, startMonthDay } from './shared'

const { season, venue, pricing } = league
const games = season.regularSeasonGames
const playoffTeams = season.playoffTeams
const teamPrice = pricing.team ? formatPrice(pricing.team) : null

const FACTS: Array<{ icon: IconName; value: string; label: string }> = [
  { icon: 'player', value: landing.format, label: 'Format' },
  { icon: 'field', value: String(games), label: 'Guaranteed games' },
  { icon: 'trophy', value: `Top ${playoffTeams} →`, label: 'Playoffs' },
  ...(teamPrice ? [{ icon: 'team' as const, value: teamPrice, label: 'Per team' }] : []),
]

const BENEFITS: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: 'team', title: 'Stay together', text: 'Keep your outdoor team connected.' },
  ...(landing.liveStandings
    ? [{ icon: 'growth' as const, title: 'Follow the race', text: 'Live scores and standings all season.' }]
    : []),
  { icon: 'trophy', title: 'Play for something', text: 'Trophies, medals and Best Player awards by age group.' },
]

// Confirmed baseline, plus any proposed extras the league has switched on in config/landing.ts.
const OFFER = [
  'Full-team registration',
  `Age divisions (${divisionRange})`,
  `${numberWord(games)} guaranteed games`,
  ...(landing.liveStandings ? ['Live scores and standings'] : []),
  ...landing.team.proposed.filter((term) => term.confirmed).map((term) => term.text),
]

const PROGRESSION: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: 'calendar', title: 'Choose division', text: divisionsLine },
  { icon: 'team', title: 'Register team', text: 'Sign up your full roster.' },
  { icon: 'field', title: `Play ${games} games`, text: 'Fast-paced indoor action.' },
  { icon: 'trophy', title: `Top ${playoffTeams} reach playoffs`, text: 'Compete for titles and awards.' },
]

const discount = landing.twoTeamDiscount.offered
  ? (landing.twoTeamDiscount.details ?? 'Bringing two teams? Ask about the discount.')
  : null
const guarantee = landing.team.guarantee.confirmed && landing.team.guarantee.text ? landing.team.guarantee : null

export function TeamLanding() {
  return (
    <LandingShell type="team" ctaLabel="Register Your Roster Today" audience="Team registration" theme="navy">
      {/* 1. Hero */}
      <section className="lp-hero lp-hero--navy" aria-labelledby="hero-title">
        <div className="container lp-hero__inner">
          <div className="lp-hero__copy">
            <p className="lp-eyebrow lp-eyebrow--ice">Keep your squad together</p>
            <h1 className="lp-hero__title" id="hero-title">
              Bring Your Whole Team Indoor: <span className="lp-nowrap">Fast-Paced</span> Winter Soccer for Cohesive Teams.
            </h1>
            <p className="lp-hero__lede">
              Keep playing together. Build team chemistry. Bring your roster into a full indoor season.
            </p>
            <InquiryButton className="lp-hero__cta" />
            <p className="lp-hero__details">
              <span>{divisionsLine}</span>
              <span>
                {season.gameDays.en.charAt(0).toUpperCase() + season.gameDays.en.slice(1)} · Starts {startMonthDay}
              </span>
            </p>
          </div>
        </div>
        <div className="lp-hero__media">
          <Picture image={images.team} className="lp-hero__img lp-hero__img--huddle" sizes="(min-width: 960px) 58vw, 100vw" priority />
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
      <section className="lp-section" aria-labelledby="benefits-title">
        <div className="container">
          <h2 className="lp-h2 lp-h2--center" id="benefits-title">
            Same squad. More game time.
          </h2>
          <ul className="lp-benefits">
            {BENEFITS.map((b) => (
              <li className="lp-benefit" key={b.title}>
                <span className="lp-benefit__icon">
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

      {/* 4. Team offer */}
      <section className="lp-offer" aria-labelledby="offer-title">
        <div className="container lp-offer__grid">
          <div className="lp-offer__price">
            {teamPrice ? (
              <>
                <p className="lp-offer__amount">{teamPrice}</p>
                <p className="lp-offer__unit">{pricing.team!.unit.en}</p>
              </>
            ) : (
              <p className="lp-offer__unit">Ask about team pricing</p>
            )}
            {discount && <p className="lp-offer__note">{discount}</p>}
          </div>
          <div className="lp-offer__body">
            <h2 className="lp-h2" id="offer-title">
              Built for coaches.
            </h2>
            <ul className="lp-checks">
              {OFFER.map((item) => (
                <li key={item}>
                  <span className="lp-checks__mark" aria-hidden="true">
                    <Icon name="check" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="lp-offer__cta">
            <InquiryButton />
          </div>
        </div>
      </section>

      {/* 5. Season progression */}
      <section className="lp-section" aria-labelledby="season-title">
        <div className="container">
          <h2 className="lp-h2 lp-h2--center" id="season-title">
            From roster to playoff race.
          </h2>
          <ol className="lp-progress">
            {PROGRESSION.map((step, i) => (
              <li className="lp-progress__step" key={step.title}>
                <div className="lp-progress__marks" aria-hidden="true">
                  <span className="lp-step__num">{i + 1}</span>
                  <Icon name={step.icon} className="lp-progress__icon" />
                </div>
                <h3 className="lp-progress__title">
                  <span className="visually-hidden">Step {i + 1}: </span>
                  {step.title}
                </h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
          <p className="lp-location">
            <Icon name="pin" />
            <span>
              <strong>{venue.name}</strong> · {venue.city}, {venue.region}
            </span>
          </p>
        </div>
      </section>

      {/* 6. Guarantee (only with an approved team policy) or "ask first" */}
      <section className="lp-band" aria-labelledby="band-title">
        <div className="container lp-band__inner">
          <div className="lp-band__lead">
            <span className="lp-band__icon" aria-hidden="true">
              <Icon name="check" />
            </span>
            <div>
              <p className="lp-eyebrow lp-eyebrow--ice">{guarantee ? 'Our guarantee' : 'Before you register'}</p>
              <h2 className="lp-band__title" id="band-title">
                {guarantee ? guarantee.title : 'Get your team’s questions answered.'}
              </h2>
            </div>
          </div>
          <p className="lp-band__text">
            {guarantee
              ? guarantee.text
              : `Ask about division eligibility, roster requirements${landing.twoTeamDiscount.offered ? ' and the two-team discount' : ''} before registering.`}
          </p>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="lp-faq" aria-labelledby="faq-title">
        <div className="container">
          <h2 className="lp-h2 lp-h2--center lp-h2--small" id="faq-title">
            Common questions
          </h2>
          <dl className="lp-faq__list">
            <div className="lp-faq__item">
              <dt>Can our team stay together?</dt>
              <dd>Register your full roster as a team.</dd>
            </div>
            <div className="lp-faq__item">
              <dt>What does it cost?</dt>
              <dd>
                {teamPrice ? `${teamPrice} ${pricing.team!.unit.en}.` : 'Ask about team pricing.'}
                {landing.twoTeamDiscount.offered && ' Ask about the two-team discount.'}
              </dd>
            </div>
            <div className="lp-faq__item">
              <dt>How does the season work?</dt>
              <dd>
                {numberWord(games)} guaranteed games. The top {numberWord(playoffTeams).toLowerCase()} teams make the playoffs.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* 8. Final CTA */}
      <section className="lp-final lp-final--navy" aria-labelledby="final-title">
        <div className="container lp-final__inner">
          <h2 className="lp-h2 lp-h2--light" id="final-title">
            Bring your team. Build your season.
          </h2>
          <InquiryButton />
        </div>
      </section>
    </LandingShell>
  )
}
