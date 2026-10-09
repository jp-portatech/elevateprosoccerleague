import { Picture } from '../components/Picture'
import { SectionHeading } from '../components/SectionHeading'
import { images } from '../content/images'
import './SundayExperience.css'

const shots = [
  { image: images.galleryAction, caption: 'Compete', sizes: '(min-width: 900px) 46vw, 100vw' },
  { image: images.galleryCoaching, caption: 'Learn', sizes: '(min-width: 900px) 30vw, 50vw' },
  { image: images.galleryCelebration, caption: 'Celebrate', sizes: '(min-width: 900px) 30vw, 50vw' },
]

export function SundayExperience() {
  return (
    <section className="section section--pale experience" id="experience" aria-labelledby="experience-title">
      <div className="container">
        <div className="experience__head">
          <SectionHeading id="experience-title" eyebrow="Sunday experience">
            This is what Sundays look like.
          </SectionHeading>
          <p className="experience__disclaimer fine-print">
            Illustrative images. They do not depict actual ElevatePro players, teams or events.
          </p>
        </div>

        <ul className="gallery">
          {shots.map((shot) => (
            <li className="gallery__item" key={shot.caption}>
              <figure>
                <Picture image={shot.image} className="gallery__img" sizes={shot.sizes} />
                <figcaption className="gallery__caption">{shot.caption}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
