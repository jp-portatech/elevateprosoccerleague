import { Icon, type IconName } from '../components/Icon'
import { SectionHeading } from '../components/SectionHeading'
import './WhyElevatePro.css'

const benefits: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: 'trophy', title: 'Competitive', text: 'Matches that challenge players and build experience.' },
  { icon: 'growth', title: 'Player development', text: 'More touches, decisions and game experience.' },
  {
    icon: 'calendar',
    title: 'Organized experience',
    text: 'Clear scheduling, divisions and communication for coaches and families.',
  },
]

export function WhyElevatePro() {
  return (
    <section className="section section--pale why" id="league" aria-labelledby="why-title">
      <div className="container why__grid">
        <SectionHeading id="why-title" eyebrow="Why ElevatePro">
          More than just weekend games.
        </SectionHeading>

        <ul className="benefits">
          {benefits.map((b) => (
            <li className="benefit" key={b.title}>
              <Icon name={b.icon} className="benefit__icon" />
              <h3 className="label benefit__title">{b.title}</h3>
              <p>{b.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
