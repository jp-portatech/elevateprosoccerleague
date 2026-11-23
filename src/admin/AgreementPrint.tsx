import type { ReactNode } from 'react'
import { league } from '../config/league'
import { logo } from '../content/images'
import { AGREEMENTS, type SignerRole } from '../waiver/agreementForm'
import { AgreementSections } from '../waiver/AgreementText'
import type { AdminAgreementDoc } from './model'
import { PrintOverlay } from './WaiverPrint'

const longDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: league.timeZone }).format(new Date(iso))

const dateTime = (iso: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: league.timeZone,
    timeZoneName: 'short',
  }).format(new Date(iso))

const SOURCE: Record<string, string> = {
  'waiver-guardian': 'Signed with the Parent/Guardian Signature given on the facility waiver in the same session.',
  'waiver-participant': 'Signed with the Signature given on the facility waiver in the same session.',
  separate: 'Signed separately from the facility waiver.',
}

/** A filled-in line from the paper form: the answer on the line, the label under it. */
function Line({ value, label, children }: { value?: string; label: string; children?: ReactNode }) {
  return (
    <div className="adoc__line">
      <div className="adoc__line-value">{children ?? value}</div>
      <span className="adoc__line-label">{label}</span>
    </div>
  )
}

const Mark = ({ on }: { on: boolean }) => <span className="adoc__mark">{on ? '✓' : ''}</span>

function Brand({ name }: { name: string }) {
  return (
    <header className="adoc__brand">
      <img src={logo.src} srcSet={logo.srcSet} sizes="40px" width={40} height={40} alt="" />
      <span>{name}</span>
    </header>
  )
}

function AgreementSheet({ doc }: { doc: AdminAgreementDoc }) {
  const a = AGREEMENTS[doc.version]
  if (!a) {
    // A wording this dashboard doesn't know: print exactly what was stored when it was signed.
    return (
      <article className="wdoc adoc" aria-label={`ElevatePro agreement for ${doc.playerName}`}>
        <pre className="wdoc__plain">{doc.agreementText}</pre>
      </article>
    )
  }
  const sig = a.page2.signature
  const roleLine = (role: SignerRole) => (
    <p className="adoc__mark-line" key={role}>
      <Mark on={doc.signerRole === role} /> {sig.roles[role]}
    </p>
  )

  return (
    <article className="wdoc adoc" aria-label={`ElevatePro agreement for ${doc.playerName}`}>
      <div className="adoc__page">
        <Brand name={a.brand} />
        <h2 className="adoc__title">{a.page1.title}</h2>
        <p>{a.page1.paperIntro}</p>
        <div className="adoc__lines">
          <Line value={doc.playerName} label={a.page1.labels.playerName} />
          <Line value={doc.playerAge === null ? '' : String(doc.playerAge)} label={a.page1.labels.playerAge} />
          <Line value={doc.emergencyContact} label={a.page1.labels.emergencyContact} />
          <Line value={doc.emergencyPhone} label={a.page1.labels.emergencyPhone} />
        </div>
        <AgreementSections sections={a.page1.sections} />
        <section className="agreement-section">
          <h4 className="agreement-section__heading">{a.page1.media.heading}</h4>
          <p className="adoc__note">{a.page1.media.paperNote}</p>
          <p className="adoc__mark-line">
            <Mark on={doc.mediaPermission === 'yes'} /> {a.page1.media.yes}
          </p>
          <p className="adoc__mark-line">
            <Mark on={doc.mediaPermission === 'no'} /> {a.page1.media.no}
          </p>
        </section>
      </div>

      <div className="adoc__page adoc__page--next">
        <Brand name={a.brand} />
        <h2 className="adoc__title">{a.page2.title}</h2>
        <p>{a.page2.paperIntro}</p>
        <AgreementSections sections={a.page2.sections} />
        <section className="agreement-section">
          <h4 className="agreement-section__heading">{sig.heading}</h4>
          <p>
            {sig.paperInstruction} {sig.agreement}
          </p>
          {roleLine('adult')}
          {roleLine('guardian')}
        </section>
        <div className="adoc__lines adoc__lines--sign">
          <Line value={doc.signerName} label={sig.labels.printedName} />
          <Line value={doc.contactPhone} label={sig.labels.contactPhone} />
          <Line label={sig.labels.signature}>
            {doc.signature.kind === 'drawn' ? (
              <img className="wdoc__sig-img" src={doc.signature.image} alt={`Signature of ${doc.signerName}`} />
            ) : (
              <span className="wdoc__sig-typed">
                {doc.signature.name} <small>(typed)</small>
              </span>
            )}
          </Line>
          <Line value={longDate(doc.signedAt)} label={sig.labels.date} />
        </div>
        <footer className="wdoc__audit">
          Signed electronically at {league.siteUrl.replace(/^https?:\/\//, '')}/waiver on {dateTime(doc.signedAt)}.{' '}
          {SOURCE[doc.signatureSource] ?? ''} {doc.signerIp && `IP address ${doc.signerIp}. `}
          Reference {doc.id}.{doc.userAgent && ` Browser: ${doc.userAgent}`}
        </footer>
      </div>
    </article>
  )
}

/** ElevatePro's player agreements, each laid out like ElevatePro's two-page form (for your records). */
export function AgreementPrint({ docs, onClose }: { docs: AdminAgreementDoc[]; onClose: () => void }) {
  return (
    <PrintOverlay
      label={docs.length === 1 ? `ElevatePro agreement for ${docs[0].playerName}` : `${docs.length} ElevatePro agreements`}
      summary={docs.length === 1 ? `ElevatePro agreement · ${docs[0].playerName}` : `${docs.length} ElevatePro agreements`}
      onClose={onClose}
    >
      {docs.map((doc) => (
        <AgreementSheet doc={doc} key={doc.id} />
      ))}
    </PrintOverlay>
  )
}
