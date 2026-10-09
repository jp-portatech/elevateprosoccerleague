import { Picture } from '../components/Picture'
import { RegisterButton } from '../components/RegisterButton'
import { SectionHeading } from '../components/SectionHeading'
import { gameDays } from '../config/derived'
import { league } from '../config/league'
import { images } from '../content/images'
import './PlayerPlacement.css'

const steps = [
  { title: 'Register', text: 'Submit your player’s information.' },
  { title: 'We build the team', text: 'ElevatePro places registered players onto a roster.' },
  { title: 'Meet your team', text: 'Receive your team and season information.' },
  { title: 'Play', text: `Compete on ${gameDays} at ${league.venue.name}.` },
]

export function PlayerPlacement() {
  return (
    <section className="section section--pale placement" id="individual-players" aria-labelledby="placement-title">
      <div className="container placement__grid">
        <div className="placement__media">
          <Picture
            image={images.player}
            className="placement__img"
            sizes="(min-width: 960px) 34vw, (min-width: 640px) 90vw, 100vw"
          />
        </div>

        <div className="placement__content">
          <SectionHeading id="placement-title" eyebrow="Individual players">
            No team? You can still play.
          </SectionHeading>
          <p className="section-intro">
            Individual players are welcome. Register your child and ElevatePro will place them on a team in the
            appropriate age division.
          </p>

          <ol className="steps" aria-label="How individual placement works">
            {steps.map((step, i) => (
              <li className="step" key={step.title}>
                <span className="step__num" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="label step__title">
                  <span className="visually-hidden">Step {i + 1}: </span>
                  {step.title}
                </h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>

          <RegisterButton kind="player" variant="primary" className="placement__cta" />
        </div>
      </div>
    </section>
  )
}
