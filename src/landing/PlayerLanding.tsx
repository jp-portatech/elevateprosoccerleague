import { Icon, type IconName } from '../components/Icon'
import { Picture } from '../components/Picture'
import { capitalize, formatPrice } from '../config/derived'
import { landing } from '../config/landing'
import { league } from '../config/league'
import { images } from '../content/images'
import { localized, type Locale } from '../i18n/locale'
import { InquiryButton, LandingShell } from './LandingShell'
import { divisionsLine, divisionsSentence, numberWord, startWithWeekday } from './shared'

const { season, venue, pricing } = league
const games = season.regularSeasonGames
const ICONS = { facts: ['team', 'trophy', 'calendar', 'check'], benefits: ['growth', 'team', 'calendar'] } satisfies Record<
  string,
  IconName[]
>

const price = (locale: Locale) => (pricing.player ? `${formatPrice(pricing.player, locale)} ${pricing.player.unit[locale]}` : null)

const COPY = localized({
  en: {
    cta: "Secure Your Child's Spot",
    audience: 'Individual players',
    eyebrow: 'No team? No problem.',
    title: 'Get Your Child Active, Making Friends, and Playing Indoor Soccer This Season—Even If They Don’t Have a Team.',
    lede: `A ${season.gameDay.en} soccer season built around play, new teammates and less work for parents.`,
    starts: `Starts ${startWithWeekday('en')}`,
    factsLabel: 'Season at a glance',
    facts: [
      [landing.format, 'Play'],
      [String(games), 'Guaranteed games'],
      [capitalize(season.gameDay.en), 'Games'],
      ['Age-verified', 'Players'],
    ],
    benefitsTitle: 'One child. A whole new team.',
    benefits: [
      ['Learn the fundamentals', 'More opportunities to play and practice.'],
      ['Meet new teammates', 'Make friends through a shared game.'],
      ['We handle the details', `Team formation and a consistent ${season.gameDay.en} schedule.`],
    ],
    packageEyebrow: 'Individual player registration',
    packageTitle: 'Your player’s season, made simple.',
    packageItems: [
      'Individual players welcome',
      'Team assignment within their age division',
      `${capitalize(season.gameDay.en)} indoor soccer`,
      `${numberWord(games, 'en')} guaranteed games`,
    ],
    priceLabel: 'Individual player registration:',
    priceFallback: 'Request individual player pricing.',
    stepsTitle: 'How it works',
    step: (n: number) => `Step ${n}: `,
    steps: ['Sign up your player', 'Meet their team', `Play on ${season.gameDays.en}`],
    beforeEyebrow: 'Before you register',
    guaranteeEyebrow: 'Our guarantee',
    askTitle: 'Hear the details before you decide.',
    askText: 'Ask about individual pricing, team placement and the season before registering.',
    faqTitle: 'Common questions',
    faq: [
      ['Does my child need a team?', 'No. Individual players are welcome and can be assigned to a team.'],
      ['Which divisions are available?', `${divisionsSentence('en')}.`],
      ['Where do games happen?', `${venue.name}, ${venue.city}, ${venue.region}.`],
    ],
    finalTitle: 'Their next team starts here.',
  },
  es: {
    cta: 'Asegura el lugar de tu hijo',
    audience: 'Jugadores individuales',
    eyebrow: '¿No tienes equipo? No hay problema.',
    title: 'Tu hijo o hija puede estar activo, hacer amigos y jugar fútbol indoor esta temporada, aunque no tenga equipo.',
    lede: `Una temporada de fútbol los ${season.gameDays.es} pensada para jugar, conocer nuevos compañeros y darles menos trabajo a los papás.`,
    starts: `Inicia el ${startWithWeekday('es')}`,
    factsLabel: 'La temporada de un vistazo',
    facts: [
      [landing.format, 'Juego'],
      [String(games), 'Partidos garantizados'],
      [capitalize(season.gameDays.es), 'Día de juego'],
      ['Edad verificada', 'Jugadores'],
    ],
    benefitsTitle: 'Un jugador. Todo un equipo nuevo.',
    benefits: [
      ['Aprende los fundamentos', 'Más oportunidades para jugar y practicar.'],
      ['Conoce nuevos compañeros', 'Haz amigos a través del juego.'],
      ['Nosotros nos encargamos', `Formamos los equipos y mantenemos un horario fijo los ${season.gameDays.es}.`],
    ],
    packageEyebrow: 'Inscripción individual',
    packageTitle: 'La temporada de tu jugador, sin complicaciones.',
    packageItems: [
      'Jugadores individuales bienvenidos',
      'Asignación a un equipo de su división de edad',
      `Fútbol indoor los ${season.gameDays.es}`,
      `${numberWord(games, 'es')} partidos garantizados`,
    ],
    priceLabel: 'Inscripción individual:',
    priceFallback: 'Pregunta por el precio de la inscripción individual.',
    stepsTitle: 'Cómo funciona',
    step: (n: number) => `Paso ${n}: `,
    steps: ['Inscribe a tu jugador', 'Conoce a su equipo', `A jugar los ${season.gameDays.es}`],
    beforeEyebrow: 'Antes de inscribirte',
    guaranteeEyebrow: 'Nuestra garantía',
    askTitle: 'Conoce los detalles antes de decidir.',
    askText: 'Pregunta por el precio individual, la asignación de equipo y la temporada antes de inscribirte.',
    faqTitle: 'Preguntas frecuentes',
    faq: [
      ['¿Mi hijo necesita un equipo?', 'No. Los jugadores individuales son bienvenidos y se les puede asignar un equipo.'],
      ['¿Qué divisiones hay?', `${divisionsSentence('es')}.`],
      ['¿Dónde se juegan los partidos?', `${venue.name}, ${venue.city}, ${venue.region}.`],
    ],
    finalTitle: 'Su próximo equipo empieza aquí.',
  },
})

export function PlayerLanding({ locale }: { locale: Locale }) {
  const t = COPY[locale]
  const guarantee = landing.player.guarantee.confirmed && landing.player.guarantee.text[locale] ? landing.player.guarantee : null
  // Confirmed baseline, plus any proposed extras the league has switched on in config/landing.ts.
  const packageItems = [
    ...t.packageItems,
    ...landing.player.proposed.filter((term) => term.confirmed).map((term) => term.text[locale]),
  ]
  const playerPrice = price(locale)

  return (
    <LandingShell locale={locale} type="individual_player" ctaLabel={t.cta} audience={t.audience} theme="light">
      {/* 1. Hero */}
      <section className="lp-hero lp-hero--light" aria-labelledby="hero-title">
        <div className="container lp-hero__inner">
          <div className="lp-hero__copy">
            <p className="lp-eyebrow">{t.eyebrow}</p>
            <h1 className="lp-hero__title" id="hero-title">
              {t.title}
            </h1>
            <p className="lp-hero__lede">{t.lede}</p>
            <InquiryButton className="lp-hero__cta" />
            <p className="lp-hero__details">
              <span>{divisionsLine}</span>
              <span>{t.starts}</span>
            </p>
          </div>
        </div>
        <div className="lp-hero__media">
          <Picture image={images.hero} className="lp-hero__img lp-hero__img--action" sizes="(min-width: 960px) 58vw, 100vw" priority />
        </div>
      </section>

      {/* 2. Facts */}
      <section className="lp-facts" aria-label={t.factsLabel}>
        <ul className="container lp-facts__list">
          {t.facts.map(([value, label], i) => (
            <li className="lp-fact" key={label}>
              <Icon name={ICONS.facts[i]} className="lp-fact__icon" />
              <span>
                <span className="lp-fact__value">{value}</span>
                <span className="lp-fact__label">{label}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* 3. Benefits */}
      <section className="lp-section lp-section--pale" aria-labelledby="benefits-title">
        <div className="container">
          <h2 className="lp-h2 lp-h2--center" id="benefits-title">
            {t.benefitsTitle}
          </h2>
          <ul className="lp-benefits">
            {t.benefits.map(([title, text], i) => (
              <li className="lp-benefit" key={title}>
                <span className="lp-benefit__icon lp-benefit__icon--circle">
                  <Icon name={ICONS.benefits[i]} />
                </span>
                <div>
                  <h3 className="lp-benefit__title">{title}</h3>
                  <p>{text}</p>
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
          <p className="lp-eyebrow lp-eyebrow--ice">{t.packageEyebrow}</p>
          <h2 className="lp-h2 lp-h2--light" id="package-title">
            {t.packageTitle}
          </h2>
          <ul className="lp-checks lp-checks--light">
            {packageItems.map((item) => (
              <li key={item}>
                <span className="lp-checks__mark" aria-hidden="true">
                  <Icon name="check" />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="lp-package__price">
            {playerPrice ? (
              <>
                {t.priceLabel} <strong>{playerPrice}</strong>
              </>
            ) : (
              t.priceFallback
            )}
          </p>
        </div>
      </section>

      {/* 5. How it works */}
      <section className="lp-steps-band" aria-labelledby="steps-title">
        <div className="container lp-steps-band__inner">
          <h2 className="visually-hidden" id="steps-title">
            {t.stepsTitle}
          </h2>
          <ol className="lp-steps">
            {t.steps.map((step, i) => (
              <li className="lp-step" key={step}>
                <span className="lp-step__num" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="lp-step__text">
                  <span className="visually-hidden">{t.step(i + 1)}</span>
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
          <h2 className="visually-hidden" id="faq-title">
            {t.faqTitle}
          </h2>
          <dl className="lp-faq__list">
            {t.faq.map(([question, answer]) => (
              <div className="lp-faq__item" key={question}>
                <dt>{question}</dt>
                <dd>{answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 8. Final CTA */}
      <section className="lp-final lp-final--light" aria-labelledby="final-title">
        <div className="container lp-final__inner">
          <h2 className="lp-h2" id="final-title">
            {t.finalTitle}
          </h2>
          <InquiryButton />
        </div>
      </section>
    </LandingShell>
  )
}
