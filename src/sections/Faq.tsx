import { Accordion } from '../components/Accordion'
import { SectionHeading } from '../components/SectionHeading'
import { faqItems } from '../content/faq'
import './Faq.css'

export function Faq() {
  return (
    <section className="section section--pale faq" id="faq" aria-labelledby="faq-title">
      <div className="container faq__grid">
        <SectionHeading id="faq-title" eyebrow="FAQ">
          Frequently asked questions
        </SectionHeading>
        <Accordion items={faqItems} />
      </div>
    </section>
  )
}
