import type { AgreementSection, SignerRole } from './agreementForm'
import { Segments } from './WaiverText'

/**
 * Sections of ElevatePro's agreement. With `role`, only the sections for that signer appear
 * (the parent page); without it, every section (the printed record).
 */
export function AgreementSections({ sections, role }: { sections: AgreementSection[]; role?: SignerRole }) {
  return (
    <>
      {sections
        .filter((s) => !role || !s.roles || s.roles.includes(role))
        .map((s) => (
          <section className="agreement-section" key={s.heading}>
            <h4 className="agreement-section__heading">{s.heading}</h4>
            {s.callout && (
              <p className="agreement-section__callout">
                <strong>{s.callout}</strong>
              </p>
            )}
            {s.paragraphs.map((p, i) => (
              <p key={i}>
                <Segments paragraph={p} />
              </p>
            ))}
          </section>
        ))}
    </>
  )
}
