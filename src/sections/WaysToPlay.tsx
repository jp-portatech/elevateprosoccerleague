import { Picture } from '../components/Picture'
import { RegisterButton } from '../components/RegisterButton'
import { SectionHeading } from '../components/SectionHeading'
import { images } from '../content/images'
import { useLocale } from '../i18n/useLocale'
import { localized } from '../i18n/locale'
import { reveal } from '../motion/reveal'
import './WaysToPlay.css'

const COPY = localized({
  en: {
    eyebrow: 'Join the league',
    title: 'Two ways to play',
    teamTitle: 'Bring your team',
    teamText:
      'Already have a club, academy, neighborhood or independent team? Register your complete team for the ElevatePro season.',
    playerTitle: 'Join as a player',
    playerText: 'No team? No problem. Register individually and we’ll place you with a team in your age division.',
  },
  es: {
    eyebrow: 'Únete a la liga',
    title: 'Dos formas de jugar',
    teamTitle: 'Trae a tu equipo',
    teamText:
      '¿Ya tienes un equipo de club, de academia, del barrio o independiente? Inscribe a tu equipo completo en la temporada de ElevatePro.',
    playerTitle: 'Únete como jugador',
    playerText:
      '¿No tienes equipo? No hay problema. Inscríbete de forma individual y te asignaremos un equipo de tu división de edad.',
  },
})

export function WaysToPlay() {
  const t = COPY[useLocale()]
  return (
    <section className="section ways" aria-labelledby="ways-title">
      <div className="container">
        <SectionHeading id="ways-title" eyebrow={t.eyebrow} reveal>
          {t.title}
        </SectionHeading>

        <div className="ways__grid" {...reveal('stagger')}>
          <article className="way way--team on-dark" aria-labelledby="way-team-title">
            <div className="way__media">
              <Picture
                image={images.team}
                className="way__img"
                sizes="(min-width: 1100px) 260px, (min-width: 640px) 40vw, 100vw"
              />
            </div>
            <div className="way__body">
              <h3 className="h3-display" id="way-team-title">
                {t.teamTitle}
              </h3>
              <p>{t.teamText}</p>
              <RegisterButton kind="team" variant="light" />
            </div>
          </article>

          <article className="way way--player" aria-labelledby="way-player-title">
            <div className="way__media">
              <Picture
                image={images.player}
                className="way__img"
                sizes="(min-width: 1100px) 260px, (min-width: 640px) 40vw, 100vw"
              />
            </div>
            <div className="way__body">
              <h3 className="h3-display" id="way-player-title">
                {t.playerTitle}
              </h3>
              <p>{t.playerText}</p>
              <RegisterButton kind="player" />
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
