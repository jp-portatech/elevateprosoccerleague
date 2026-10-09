import { Icon, type IconName } from '../components/Icon'
import { Picture } from '../components/Picture'
import { SectionHeading } from '../components/SectionHeading'
import { league } from '../config/league'
import { images } from '../content/images'
import './Awards.css'

const AWARD_ICONS: Record<(typeof league.awards)[number]['id'], IconName> = {
  champions: 'trophy',
  'runners-up': 'medal',
  mvp: 'star',
}

export function Awards() {
  return (
    <section className="awards on-dark" id="awards" aria-labelledby="awards-title">
      <div className="awards__media">
        <Picture image={images.awards} className="awards__img" sizes="(min-width: 900px) 62vw, 100vw" />
      </div>

      <div className="container awards__inner">
        <SectionHeading id="awards-title" eyebrow="Awards">
          Play for something.
        </SectionHeading>

        <ul className="award-list">
          {league.awards.map((award) => (
            <li className="award" key={award.id}>
              <Icon name={AWARD_ICONS[award.id]} className="award__icon" />
              <h3 className="label award__title">{award.title}</h3>
              <p className="award__prize">{award.prize}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
