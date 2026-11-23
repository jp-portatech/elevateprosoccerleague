import type { Paragraph, WaiverText } from './waiverForm'

/** A paragraph of waiver text, with the facility's bold phrases in bold. */
export function Segments({ paragraph }: { paragraph: Paragraph }) {
  return (
    <>
      {paragraph.map((segment, i) => (typeof segment === 'string' ? segment : <strong key={i}>{segment.b}</strong>))}
    </>
  )
}

/** The release itself: the opening line, the four numbered terms and the bold acknowledgement. */
export function WaiverTerms({ waiver }: { waiver: WaiverText }) {
  return (
    <>
      <p>{waiver.intro}</p>
      <ol className="waiver-terms__list">
        {waiver.items.map((item, i) => (
          <li key={i}>
            <Segments paragraph={item} />
          </li>
        ))}
      </ol>
      <p className="waiver-terms__ack">
        <strong>{waiver.acknowledgement}</strong>
      </p>
    </>
  )
}

/** The parent/guardian clause for participants under 18. */
export function WaiverMinorsClause({ waiver }: { waiver: WaiverText }) {
  return (
    <p className="waiver-terms__minors">
      <strong>{waiver.minorsHeading}</strong>
      <br />
      <Segments paragraph={waiver.minors} />
    </p>
  )
}
