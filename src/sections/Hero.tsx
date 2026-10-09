import { Icon } from '../components/Icon'
import { RegisterButton } from '../components/RegisterButton'
import { divisionIds, divisionRange, gameDays, startDateLabel, venueLocation } from '../config/derived'
import { league } from '../config/league'
import { images } from '../content/images'
import './Hero.css'

const { hero, heroMobile } = images

export function Hero() {
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
            alt={hero.alt}
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
            <span className="hero__display">
              Youth indoor <span className="hero__accent">soccer league</span>
            </span>
          </h1>

          <p className="hero__lede">
            Competitive {league.season.gameDay} soccer for {divisionRange} players and teams in {league.venue.city}.
          </p>

          <div className="hero__meta">
            <p className="hero__divisions">
              {divisionIds.map((id) => (
                <span key={id}>{id}</span>
              ))}
            </p>
            <p className="hero__when">
              <span>{gameDays}</span>
              <span>Starts {startDateLabel}</span>
            </p>
          </div>

          <div className="btn-row btn-row--stack hero__actions">
            <RegisterButton kind="team" />
            <RegisterButton kind="player" />
          </div>

          <p className="hero__note">
            <strong>No team? No problem.</strong> Register your player individually and ElevatePro will assign them
            to a team.
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
