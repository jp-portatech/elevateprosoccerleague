import { Picture } from '../components/Picture'
import { RegisterButton } from '../components/RegisterButton'
import { SectionHeading } from '../components/SectionHeading'
import { images } from '../content/images'
import './WaysToPlay.css'

export function WaysToPlay() {
  return (
    <section className="section ways" aria-labelledby="ways-title">
      <div className="container">
        <SectionHeading id="ways-title" eyebrow="Join the league">
          Two ways to play
        </SectionHeading>

        <div className="ways__grid">
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
                Bring your team
              </h3>
              <p>
                Already have a club, academy, neighborhood or independent team? Register your complete team for the
                ElevatePro season.
              </p>
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
                Join as a player
              </h3>
              <p>No team? No problem. Register individually and we’ll place you with a team in your age division.</p>
              <RegisterButton kind="player" />
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
