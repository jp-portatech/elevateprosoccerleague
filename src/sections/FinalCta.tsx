import { Picture } from '../components/Picture'
import { RegisterButton } from '../components/RegisterButton'
import { images } from '../content/images'
import './FinalCta.css'

export function FinalCta() {
  return (
    <section className="final-cta on-dark" aria-labelledby="final-cta-title">
      <div className="final-cta__media">
        <Picture image={images.cta} className="final-cta__img" sizes="100vw" alt="" />
      </div>
      <div className="container final-cta__inner">
        <div className="final-cta__copy">
          <h2 className="h2 final-cta__title" id="final-cta-title">
            There’s a place for every player.
          </h2>
          <p className="final-cta__text">Bring your team or join individually.</p>
          <div className="btn-row btn-row--stack final-cta__actions">
            <RegisterButton kind="team" variant="ice" />
            <RegisterButton kind="player" variant="light" />
          </div>
        </div>
      </div>
    </section>
  )
}
