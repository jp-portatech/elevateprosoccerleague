import { Picture } from '../components/Picture'
import { RegisterButton } from '../components/RegisterButton'
import { SectionHeading } from '../components/SectionHeading'
import { gameDays } from '../config/derived'
import { league } from '../config/league'
import { images } from '../content/images'
import { useLocale } from '../i18n/useLocale'
import { localized } from '../i18n/locale'
import './PlayerPlacement.css'

const COPY = localized({
  en: {
    eyebrow: 'Individual players',
    title: 'No team? You can still play.',
    intro:
      'Individual players are welcome. Register your child and ElevatePro will place them on a team in the appropriate age division.',
    stepsLabel: 'How individual placement works',
    step: (n: number) => `Step ${n}: `,
    steps: [
      { title: 'Register', text: 'Submit your player’s information.' },
      { title: 'We build the team', text: 'ElevatePro places registered players onto a roster.' },
      { title: 'Meet your team', text: 'Receive your team and season information.' },
      { title: 'Play', text: `Compete on ${gameDays.en} at ${league.venue.name}.` },
    ],
  },
  es: {
    eyebrow: 'Jugadores individuales',
    title: '¿Sin equipo? Igual puedes jugar.',
    intro:
      'Los jugadores individuales son bienvenidos. Inscribe a tu hijo o hija y ElevatePro le asignará un equipo de su división de edad.',
    stepsLabel: 'Cómo funciona la asignación individual',
    step: (n: number) => `Paso ${n}: `,
    steps: [
      { title: 'Inscríbete', text: 'Envía la información de tu jugador.' },
      { title: 'Formamos el equipo', text: 'ElevatePro asigna a los jugadores inscritos a un equipo.' },
      { title: 'Conoce a tu equipo', text: 'Recibe la información de tu equipo y de la temporada.' },
      { title: 'A jugar', text: `Compite los ${gameDays.es} en ${league.venue.name}.` },
    ],
  },
})

export function PlayerPlacement() {
  const t = COPY[useLocale()]
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
          <SectionHeading id="placement-title" eyebrow={t.eyebrow}>
            {t.title}
          </SectionHeading>
          <p className="section-intro">{t.intro}</p>

          <ol className="steps" aria-label={t.stepsLabel}>
            {t.steps.map((step, i) => (
              <li className="step" key={i}>
                <span className="step__num" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="label step__title">
                  <span className="visually-hidden">{t.step(i + 1)}</span>
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
