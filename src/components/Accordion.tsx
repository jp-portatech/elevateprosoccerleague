import { useId, useState, type ReactNode } from 'react'

export interface AccordionItem {
  id: string
  question: string
  answer: ReactNode
}

/** WAI-ARIA accordion: heading > button[aria-expanded] controlling a labelled region. */
export function Accordion({ items, headingLevel = 3 }: { items: AccordionItem[]; headingLevel?: 3 | 4 }) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set())
  const baseId = useId()
  const Heading = `h${headingLevel}` as const

  const toggle = (id: string) =>
    setOpenIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="accordion">
      {items.map((item) => {
        const expanded = openIds.has(item.id)
        const buttonId = `${baseId}-${item.id}-button`
        const panelId = `${baseId}-${item.id}-panel`
        return (
          <div className="accordion__item" key={item.id}>
            <Heading className="accordion__heading">
              <button
                type="button"
                className="accordion__trigger"
                id={buttonId}
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
              >
                <span>{item.question}</span>
                <span className="accordion__icon" aria-hidden="true" />
              </button>
            </Heading>
            {/* Closed answers are visibility: hidden (Faq.css), so they're out of the tab order and
                hidden from screen readers like `hidden`, but can animate open and closed. */}
            <section
              className="accordion__panel"
              id={panelId}
              aria-labelledby={buttonId}
              data-state={expanded ? 'open' : 'closed'}
            >
              <div className="accordion__clip">
                <div className="accordion__content">{item.answer}</div>
              </div>
            </section>
          </div>
        )
      })}
    </div>
  )
}
