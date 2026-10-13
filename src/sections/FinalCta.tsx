import { Picture } from '../components/Picture'
import { RegisterButton } from '../components/RegisterButton'
import { images } from '../content/images'
import { useLocale } from '../i18n/useLocale'
import { localized } from '../i18n/locale'
import { reveal } from '../motion/reveal'
import './FinalCta.css'

const COPY = localized({
  en: { title: 'There’s a place for every player.', text: 'Bring your team or join individually.' },
  es: { title: 'Hay un lugar para cada jugador.', text: 'Trae a tu equipo o únete de forma individual.' },
})

export function FinalCta() {
  const t = COPY[useLocale()]
  return (
    <section className="final-cta on-dark" aria-labelledby="final-cta-title">
      <div className="final-cta__media">
        <Picture image={images.cta} className="final-cta__img" sizes="100vw" alt="" />
      </div>
      <div className="container final-cta__inner">
        <div className="final-cta__copy" {...reveal()}>
          <h2 className="h2 final-cta__title" id="final-cta-title">
            {t.title}
          </h2>
          <p className="final-cta__text">{t.text}</p>
          <div className="btn-row btn-row--stack final-cta__actions">
            <RegisterButton kind="team" variant="ice" />
            <RegisterButton kind="player" variant="light" />
          </div>
        </div>
      </div>
    </section>
  )
}
