import { Picture } from '../components/Picture'
import { SectionHeading } from '../components/SectionHeading'
import { images } from '../content/images'
import { useLocale } from '../i18n/useLocale'
import { localized } from '../i18n/locale'
import './SundayExperience.css'

const shots = [
  { id: 'compete', image: images.galleryAction, sizes: '(min-width: 900px) 46vw, 100vw' },
  { id: 'learn', image: images.galleryCoaching, sizes: '(min-width: 900px) 30vw, 50vw' },
  { id: 'celebrate', image: images.galleryCelebration, sizes: '(min-width: 900px) 30vw, 50vw' },
] as const

const COPY = localized({
  en: {
    eyebrow: 'Sunday experience',
    title: 'This is what Sundays look like.',
    disclaimer: 'Illustrative images. They do not depict actual ElevatePro players, teams or events.',
    captions: { compete: 'Compete', learn: 'Learn', celebrate: 'Celebrate' },
  },
  es: {
    eyebrow: 'La experiencia del domingo',
    title: 'Así se viven los domingos.',
    disclaimer: 'Imágenes ilustrativas. No muestran jugadores, equipos ni eventos reales de ElevatePro.',
    captions: { compete: 'Compite', learn: 'Aprende', celebrate: 'Celebra' },
  },
})

export function SundayExperience() {
  const t = COPY[useLocale()]
  return (
    <section className="section section--pale experience" id="experience" aria-labelledby="experience-title">
      <div className="container">
        <div className="experience__head">
          <SectionHeading id="experience-title" eyebrow={t.eyebrow}>
            {t.title}
          </SectionHeading>
          <p className="experience__disclaimer fine-print">{t.disclaimer}</p>
        </div>

        <ul className="gallery">
          {shots.map((shot) => (
            <li className="gallery__item" key={shot.id}>
              <figure>
                <Picture image={shot.image} className="gallery__img" sizes={shot.sizes} />
                <figcaption className="gallery__caption">{t.captions[shot.id]}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
