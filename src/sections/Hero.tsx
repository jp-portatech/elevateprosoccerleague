import { Icon } from '../components/Icon'
import { RegisterButton } from '../components/RegisterButton'
import { capitalize, divisionIds, divisionRange, gameDays, startDateLabel, venueLocation } from '../config/derived'
import { league } from '../config/league'
import { images } from '../content/images'
import { useLocale } from '../i18n/useLocale'
import { localized } from '../i18n/locale'
import './Hero.css'

const { hero, heroMobile } = images

const COPY = localized({
  en: {
    display: (
      <>
        Youth indoor <span className="hero__accent">soccer league</span>
      </>
    ),
    lede: `Competitive ${league.season.gameDay.en} soccer for ${divisionRange} kids and teams in ${venueLocation}.`,
    when: capitalize(gameDays.en),
    starts: `Starts ${startDateLabel.en}`,
    noteLead: 'No team? No problem.',
    note: 'Register your player individually and ElevatePro will assign them to a team.',
  },
  es: {
    display: (
      <>
        Liga juvenil de <span className="hero__accent">fútbol indoor</span>
      </>
    ),
    lede: `Fútbol competitivo los ${gameDays.es} para niños y equipos ${divisionRange} en ${venueLocation}.`,
    when: capitalize(gameDays.es),
    starts: `Inicia el ${startDateLabel.es}`,
    noteLead: '¿No tienes equipo? No hay problema.',
    note: 'Inscribe a tu jugador de forma individual y ElevatePro le asignará un equipo.',
  },
})

export function Hero() {
  const locale = useLocale()
  const t = COPY[locale]
  return (
    <section className="hero" aria-labelledby="hero-title">
      {/* Art direction: landscape photo from 600px up (text over its bright left side at 900px+),
          portrait photo above the copy on phones. */}
      <div className="hero__media">
        <picture>
          <source
            media="(min-width: 600px)"
            type="image/webp"
            srcSet={hero.webp}
            sizes="100vw"
            width={hero.width}
            height={hero.height}
          />
          <source
            media="(min-width: 600px)"
            type="image/jpeg"
            srcSet={hero.jpg}
            sizes="100vw"
            width={hero.width}
            height={hero.height}
          />
          <source type="image/webp" srcSet={heroMobile.webp} sizes="100vw" />
          <img
            className="hero__img"
            src={heroMobile.src}
            srcSet={heroMobile.jpg}
            sizes="100vw"
            width={heroMobile.width}
            height={heroMobile.height}
            alt={hero.alt[locale]}
            loading="eager"
            fetchPriority="high"
          />
        </picture>
      </div>

      <div className="container hero__inner">
        <div className="hero__copy">
          <h1 className="hero__title" id="hero-title">
            <span className="hero__eyebrow">Elevate Pro Soccer League</span>
            <span className="visually-hidden">: </span>
            <span className="hero__display">{t.display}</span>
          </h1>

          <p className="hero__lede">{t.lede}</p>

          <div className="hero__meta">
            <p className="hero__divisions">
              {divisionIds.map((id) => (
                <span key={id}>{id}</span>
              ))}
            </p>
            <p className="hero__when">
              <span>{t.when}</span>
              <span>{t.starts}</span>
            </p>
          </div>

          <div className="btn-row btn-row--stack hero__actions">
            <RegisterButton kind="team" />
            <RegisterButton kind="player" />
          </div>

          <p className="hero__note">
            <strong>{t.noteLead}</strong> {t.note}
          </p>

          <p className="hero__location">
            <Icon name="pin" />
            <span>
              {league.venue.name} · {venueLocation}
            </span>
          </p>
        </div>
      </div>
    </section>
  )
}
