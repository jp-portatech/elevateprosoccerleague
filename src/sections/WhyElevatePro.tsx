import { Icon, type IconName } from '../components/Icon'
import { SectionHeading } from '../components/SectionHeading'
import { useLocale } from '../i18n/useLocale'
import { localized } from '../i18n/locale'
import './WhyElevatePro.css'

const ICONS: IconName[] = ['trophy', 'growth', 'calendar']

const COPY = localized({
  en: {
    eyebrow: 'Why ElevatePro',
    title: 'More than just weekend games.',
    benefits: [
      { title: 'Competitive', text: 'Matches that challenge players and build experience.' },
      { title: 'Player development', text: 'More touches, decisions and game experience.' },
      {
        title: 'Organized experience',
        text: 'Clear scheduling, divisions and communication for coaches and families.',
      },
    ],
  },
  es: {
    eyebrow: '¿Por qué ElevatePro?',
    title: 'Más que partidos de fin de semana.',
    benefits: [
      { title: 'Competitivo', text: 'Partidos que retan a los jugadores y les dan experiencia.' },
      { title: 'Desarrollo del jugador', text: 'Más toques, más decisiones y más experiencia de juego.' },
      {
        title: 'Experiencia organizada',
        text: 'Calendario, divisiones y comunicación claros para entrenadores y familias.',
      },
    ],
  },
})

export function WhyElevatePro() {
  const t = COPY[useLocale()]
  return (
    <section className="section section--pale why" id="league" aria-labelledby="why-title">
      <div className="container why__grid">
        <SectionHeading id="why-title" eyebrow={t.eyebrow}>
          {t.title}
        </SectionHeading>

        <ul className="benefits">
          {t.benefits.map((b, i) => (
            <li className="benefit" key={ICONS[i]}>
              <Icon name={ICONS[i]} className="benefit__icon" />
              <h3 className="label benefit__title">{b.title}</h3>
              <p>{b.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
