import { Accordion } from '../components/Accordion'
import { SectionHeading } from '../components/SectionHeading'
import { faqItems } from '../content/faq'
import { useLocale } from '../i18n/useLocale'
import { localized } from '../i18n/locale'
import './Faq.css'

const COPY = localized({
  en: { eyebrow: 'FAQ', title: 'Frequently asked questions' },
  es: { eyebrow: 'Preguntas', title: 'Preguntas frecuentes' },
})

export function Faq() {
  const locale = useLocale()
  const t = COPY[locale]
  return (
    <section className="section section--pale faq" id="faq" aria-labelledby="faq-title">
      <div className="container faq__grid">
        <SectionHeading id="faq-title" eyebrow={t.eyebrow}>
          {t.title}
        </SectionHeading>
        <Accordion items={faqItems[locale]} />
      </div>
    </section>
  )
}
