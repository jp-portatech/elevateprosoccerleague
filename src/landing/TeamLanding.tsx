import { Icon, type IconName } from '../components/Icon'
import { Picture } from '../components/Picture'
import { capitalize, divisionRange, formatPrice } from '../config/derived'
import { landing } from '../config/landing'
import { league } from '../config/league'
import { images } from '../content/images'
import { localized, type Locale } from '../i18n/locale'
import { reveal } from '../motion/reveal'
import { InquiryButton, LandingShell } from './LandingShell'
import { divisionsLine, numberWord, startMonthDay } from './shared'

const { season, venue, pricing } = league
const games = season.regularSeasonGames
const playoffTeams = season.playoffTeams
const discountOn = landing.twoTeamDiscount.offered
const live = landing.liveStandings

const COPY = localized({
  en: {
    cta: 'Hold a Spot for My Team',
    audience: 'Team registration',
    eyebrow: 'Keep your squad together',
    title: (
      <>
        Bring Your Whole Team Indoor: <span className="lp-nowrap">Fast-Paced</span> Winter Soccer for Cohesive Teams.
      </>
    ),
    lede: 'Keep playing together. Build team chemistry. Bring your roster into a full indoor season.',
    when: `${capitalize(season.gameDays.en)} · Starts ${startMonthDay('en')}`,
    factsLabel: 'Season at a glance',
    facts: ['Format', 'Guaranteed games', 'Playoffs', 'Per team'],
    benefitsTitle: 'Same squad. More game time.',
    stay: ['Stay together', 'Keep your outdoor team connected.'],
    race: ['Follow the race', 'Live scores and standings all season.'],
    awards: ['Play for something', 'Trophies, medals and Best Player awards by age group.'],
    askPricing: 'Ask about team pricing',
    discount: 'Bringing two teams? Ask about the discount.',
    offerTitle: 'Built for coaches.',
    offer: ['Full-team registration', `Age divisions (${divisionRange})`, `${numberWord(games, 'en')} guaranteed games`],
    liveItem: 'Live scores and standings',
    seasonTitle: 'From roster to playoff race.',
    step: (n: number) => `Step ${n}: `,
    progression: [
      ['Choose division', divisionsLine],
      ['Register team', 'Sign up your full roster.'],
      [`Play ${games} games`, 'Fast-paced indoor action.'],
      [`Top ${playoffTeams} reach playoffs`, 'Compete for titles and awards.'],
    ],
    beforeEyebrow: 'Before you register',
    guaranteeEyebrow: 'Our guarantee',
    askTitle: 'Get your team’s questions answered.',
    askText: `Ask about division eligibility, roster requirements${discountOn ? ' and the two-team discount' : ''} before registering.`,
    faqTitle: 'Common questions',
    faqStay: ['Can our team stay together?', 'Register your full roster as a team.'],
    faqCost: 'What does it cost?',
    costFallback: 'Ask about team pricing.',
    costDiscount: ' Ask about the two-team discount.',
    faqSeason: [
      'How does the season work?',
      `${numberWord(games, 'en')} guaranteed games. The top ${numberWord(playoffTeams, 'en').toLowerCase()} teams make the playoffs.`,
    ],
    finalTitle: 'Bring your team. Build your season.',
  },
  es: {
    cta: 'Aparta un lugar para mi equipo',
    audience: 'Inscripción de equipos',
    eyebrow: 'Mantén unido a tu equipo',
    title: <>Trae a todo tu equipo a jugar indoor: fútbol rápido de invierno para equipos unidos.</>,
    lede: 'Sigan jugando juntos, fortalezcan la química del equipo y vivan una temporada indoor completa.',
    when: `${capitalize(season.gameDays.es)} · Inicia el ${startMonthDay('es')}`,
    factsLabel: 'La temporada de un vistazo',
    facts: ['Formato', 'Partidos garantizados', 'Playoffs', 'Por equipo'],
    benefitsTitle: 'El mismo equipo. Más tiempo de juego.',
    stay: ['Sigan juntos', 'Mantén unido a tu equipo de la temporada al aire libre.'],
    race: ['Sigue la competencia', 'Resultados y tabla de posiciones en vivo toda la temporada.'],
    awards: ['Jueguen por algo', 'Trofeos, medallas y premios al Mejor Jugador por división.'],
    askPricing: 'Pregunta por el precio por equipo',
    discount: '¿Traes dos equipos? Pregunta por el descuento.',
    offerTitle: 'Hecho para entrenadores.',
    offer: [
      'Inscripción de equipo completo',
      `Divisiones por edad (${divisionRange})`,
      `${numberWord(games, 'es')} partidos garantizados`,
    ],
    liveItem: 'Resultados y tabla de posiciones en vivo',
    seasonTitle: 'De la inscripción a los playoffs.',
    step: (n: number) => `Paso ${n}: `,
    progression: [
      ['Elige la división', divisionsLine],
      ['Inscribe a tu equipo', 'Registra a tu plantel completo.'],
      [`Juega ${games} partidos`, 'Acción indoor a ritmo rápido.'],
      [`Los ${playoffTeams} mejores van a playoffs`, 'Compite por títulos y premios.'],
    ],
    beforeEyebrow: 'Antes de inscribirte',
    guaranteeEyebrow: 'Nuestra garantía',
    askTitle: 'Resuelve las dudas de tu equipo.',
    askText: `Pregunta por la elegibilidad de división, los requisitos del plantel${discountOn ? ' y el descuento por dos equipos' : ''} antes de inscribirte.`,
    faqTitle: 'Preguntas frecuentes',
    faqStay: ['¿Nuestro equipo puede seguir junto?', 'Inscribe a tu plantel completo como equipo.'],
    faqCost: '¿Cuánto cuesta?',
    costFallback: 'Pregunta por el precio por equipo.',
    costDiscount: ' Pregunta por el descuento por dos equipos.',
    faqSeason: [
      '¿Cómo funciona la temporada?',
      `${numberWord(games, 'es')} partidos garantizados. Los ${numberWord(playoffTeams, 'es').toLowerCase()} mejores equipos pasan a los playoffs.`,
    ],
    finalTitle: 'Trae a tu equipo. Arma tu temporada.',
  },
})

const FACT_ICONS: IconName[] = ['player', 'field', 'trophy', 'team']
const PROGRESSION_ICONS: IconName[] = ['calendar', 'team', 'field', 'trophy']

export function TeamLanding({ locale }: { locale: Locale }) {
  const t = COPY[locale]
  const teamPrice = pricing.team ? formatPrice(pricing.team, locale) : null
  const facts = [landing.format, String(games), `Top ${playoffTeams} →`, ...(teamPrice ? [teamPrice] : [])]
  const benefits: Array<{ icon: IconName; title: string; text: string }> = [
    { icon: 'team', title: t.stay[0], text: t.stay[1] },
    ...(live ? [{ icon: 'growth' as const, title: t.race[0], text: t.race[1] }] : []),
    { icon: 'trophy', title: t.awards[0], text: t.awards[1] },
  ]
  // Confirmed baseline, plus any proposed extras the league has switched on in config/landing.ts.
  const offer = [
    ...t.offer,
    ...(live ? [t.liveItem] : []),
    ...landing.team.proposed.filter((term) => term.confirmed).map((term) => term.text[locale]),
  ]
  const discount = discountOn ? (landing.twoTeamDiscount.details?.[locale] ?? t.discount) : null
  const guarantee = landing.team.guarantee.confirmed && landing.team.guarantee.text[locale] ? landing.team.guarantee : null

  return (
    <LandingShell locale={locale} type="team" ctaLabel={t.cta} audience={t.audience} theme="navy">
      {/* 1. Hero */}
      <section className="lp-hero lp-hero--navy" aria-labelledby="hero-title">
        <div className="container lp-hero__inner">
          <div className="lp-hero__copy">
            <p className="lp-eyebrow lp-eyebrow--ice">{t.eyebrow}</p>
            <h1 className="lp-hero__title" id="hero-title">
              {t.title}
            </h1>
            <p className="lp-hero__lede">{t.lede}</p>
            <InquiryButton className="lp-hero__cta" />
            <p className="lp-hero__details">
              <span>{divisionsLine}</span>
              <span>{t.when}</span>
            </p>
          </div>
        </div>
        <div className="lp-hero__media">
          <Picture image={images.team} className="lp-hero__img lp-hero__img--huddle" sizes="(min-width: 960px) 58vw, 100vw" priority />
        </div>
      </section>

      {/* 2. Facts */}
      <section className="lp-facts" aria-label={t.factsLabel}>
        <ul className="container lp-facts__list">
          {facts.map((value, i) => (
            <li className="lp-fact" key={t.facts[i]}>
              <Icon name={FACT_ICONS[i]} className="lp-fact__icon" />
              <span>
                <span className="lp-fact__value">{value}</span>
                <span className="lp-fact__label">{t.facts[i]}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 3. Benefits */}
      <section className="lp-section" aria-labelledby="benefits-title">
        <div className="container">
          <h2 className="lp-h2 lp-h2--center" id="benefits-title">
            {t.benefitsTitle}
          </h2>
          <ul className="lp-benefits" {...reveal('stagger')}>
            {benefits.map((b) => (
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
                <p className="lp-offer__unit">{pricing.team!.unit[locale]}</p>
              </>
            ) : (
              <p className="lp-offer__unit">{t.askPricing}</p>
            )}
            {discount && <p className="lp-offer__note">{discount}</p>}
          </div>
          <div className="lp-offer__body">
            <h2 className="lp-h2" id="offer-title">
              {t.offerTitle}
            </h2>
            <ul className="lp-checks">
              {offer.map((item) => (
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
            {t.seasonTitle}
          </h2>
          <ol className="lp-progress">
            {t.progression.map(([title, text], i) => (
              <li className="lp-progress__step" key={title}>
                <div className="lp-progress__marks" aria-hidden="true">
                  <span className="lp-step__num">{i + 1}</span>
                  <Icon name={PROGRESSION_ICONS[i]} className="lp-progress__icon" />
                </div>
                <h3 className="lp-progress__title">
                  <span className="visually-hidden">{t.step(i + 1)}</span>
                  {title}
                </h3>
                <p>{text}</p>
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
              <p className="lp-eyebrow lp-eyebrow--ice">{guarantee ? t.guaranteeEyebrow : t.beforeEyebrow}</p>
              <h2 className="lp-band__title" id="band-title">
                {guarantee ? guarantee.title[locale] : t.askTitle}
              </h2>
            </div>
          </div>
          <p className="lp-band__text">{guarantee ? guarantee.text[locale] : t.askText}</p>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="lp-faq" aria-labelledby="faq-title">
        <div className="container">
          <h2 className="lp-h2 lp-h2--center lp-h2--small" id="faq-title">
            {t.faqTitle}
          </h2>
          <dl className="lp-faq__list">
            <div className="lp-faq__item">
              <dt>{t.faqStay[0]}</dt>
              <dd>{t.faqStay[1]}</dd>
            </div>
            <div className="lp-faq__item">
              <dt>{t.faqCost}</dt>
              <dd>
                {teamPrice ? `${teamPrice} ${pricing.team!.unit[locale]}.` : t.costFallback}
                {discountOn && t.costDiscount}
              </dd>
            </div>
            <div className="lp-faq__item">
              <dt>{t.faqSeason[0]}</dt>
              <dd>{t.faqSeason[1]}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* 8. Final CTA */}
      <section className="lp-final lp-final--navy" aria-labelledby="final-title">
        <div className="container lp-final__inner">
          <h2 className="lp-h2 lp-h2--light" id="final-title">
            {t.finalTitle}
          </h2>
          <InquiryButton />
        </div>
      </section>
    </LandingShell>
  )
}
