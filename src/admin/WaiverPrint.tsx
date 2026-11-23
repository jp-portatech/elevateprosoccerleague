import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { league } from '../config/league'
import { WAIVERS, type Signature } from '../waiver/waiverForm'
import { WaiverMinorsClause, WaiverTerms } from '../waiver/WaiverText'
import type { AdminWaiverDoc } from './model'
import './waiver-print.css'

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

/** "2014-03-15" → "03/15/2014", as written on paper forms. */
const usDate = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(5, 7)}/${iso.slice(8, 10)}/${iso.slice(0, 4)}` : iso)

/** The form's boxes in the facility's layout: [field, label, grid columns on a 12-column row]. */
const BOXES: Array<[name: string, label: string, columns: string]> = [
  ['name', 'Name', '1 / 8'],
  ['dob', 'DOB', '9 / 13'],
  ['birthPlace', 'Birth Place', '1 / 7'],
  ['height', 'Height', '7 / 10'],
  ['weight', 'Weight', '10 / 13'],
  ['email', 'Email', '1 / 8'],
  ['position', 'Position', '9 / 13'],
  ['eveningPhone', 'Evening Phone', '1 / 8'],
  ['teamName', 'Team name', '9 / 13'],
  ['address', 'Address', '1 / 8'],
  ['city', 'City', '1 / 7'],
  ['state', 'State', '7 / 10'],
  ['zip', 'Zip', '10 / 13'],
]

function SignatureMark({ signature, who }: { signature: Signature | null; who: string }) {
  if (!signature) return null
  if (signature.kind === 'drawn') return <img className="wdoc__sig-img" src={signature.image} alt={`${who} (drawn)`} />
  return (
    <span className="wdoc__sig-typed">
      {signature.name} <small>(typed)</small>
    </span>
  )
}

function WaiverSheet({ doc }: { doc: AdminWaiverDoc }) {
  const waiver = WAIVERS[doc.version]
  const signed = longDate(doc.signedAt)
  const value = (name: string) => (name === 'dob' ? usDate(doc.fields.dob) : doc.fields[name])

  return (
    <article className="wdoc" aria-label={`Waiver for ${doc.name}`}>
      <h2 className="wdoc__title">{waiver?.title ?? 'WAIVER'}</h2>
      <div className="wdoc__boxes">
        {BOXES.map(([name, label, columns]) => (
          <div className="wdoc__box" style={{ gridColumn: columns }} key={name}>
            <span className="wdoc__box-label">{label}</span>
            <span className="wdoc__box-value">{value(name)}</span>
          </div>
        ))}
      </div>

      {waiver ? (
        <>
          <h2 className="wdoc__title wdoc__title--second">{waiver.title}</h2>
          <div className="wdoc__terms">
            <WaiverTerms waiver={waiver} />
          </div>
        </>
      ) : (
        // A wording this dashboard doesn't know: print exactly what was stored when it was signed.
        <pre className="wdoc__plain">{doc.waiverText}</pre>
      )}

      <div className="wdoc__sign">
        <div className="wdoc__sign-cell">
          <div className="wdoc__sign-line">
            <SignatureMark signature={doc.participantSignature} who="Signature" />
          </div>
          <span>Signature</span>
        </div>
        <div className="wdoc__sign-cell">
          <div className="wdoc__sign-line">{signed}</div>
          <span>Date</span>
        </div>
      </div>

      {waiver && (
        <div className="wdoc__terms">
          <WaiverMinorsClause waiver={waiver} />
        </div>
      )}

      <div className="wdoc__sign">
        <div className="wdoc__sign-cell">
          <div className="wdoc__sign-line">
            <SignatureMark signature={doc.guardianSignature} who="Parent/Guardian Signature" />
          </div>
          <span>Parent/Guardian Signature</span>
        </div>
        <div className="wdoc__sign-cell">
          <div className="wdoc__sign-line">{doc.guardianSignature ? signed : ''}</div>
          <span>Date</span>
        </div>
      </div>

      {waiver && (
        <div className="wdoc__office">
          <p>{waiver.officeUse.heading}</p>
          <div className="wdoc__office-grid">
            <div className="wdoc__office-cell wdoc__office-cell--wide">
              <div className="wdoc__office-box" />
              <span>{waiver.officeUse.playerId}</span>
            </div>
            <div className="wdoc__office-cell wdoc__office-cell--wide">
              <div className="wdoc__office-box" />
              <span>{waiver.officeUse.reviewedBy}</span>
            </div>
            <div className="wdoc__office-cell">
              <div className="wdoc__office-box" />
              <span>{waiver.officeUse.date}</span>
            </div>
          </div>
        </div>
      )}

      <footer className="wdoc__audit">
        Signed electronically at {league.siteUrl.replace(/^https?:\/\//, '')}/waiver on {dateTime(doc.signedAt)}.{' '}
        {doc.esignConsent && 'The signer agreed to sign electronically. '}
        {doc.signerIp && `IP address ${doc.signerIp}. `}
        Reference {doc.id}.{doc.userAgent && ` Browser: ${doc.userAgent}`}
      </footer>
    </article>
  )
}

/**
 * Full-screen print view of one or more signed waivers, each laid out like the facility's paper
 * form. "Print or save as PDF" opens the browser's print dialog; only the waivers print.
 */
export function WaiverPrint({ docs, onClose }: { docs: AdminWaiverDoc[]; onClose: () => void }) {
  const backRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    backRef.current?.focus()
    // The dashboard behind stays put but can't be reached or read while the print view is open.
    const app = document.getElementById('root')
    document.body.classList.add('has-waiver-print')
    if (app) app.inert = true
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('has-waiver-print')
      if (app) app.inert = false
      window.removeEventListener('keydown', onKey)
      if (opener?.isConnected) opener.focus()
    }
  }, [onClose])

  return createPortal(
    <section className="waiver-print" aria-label={docs.length === 1 ? `Waiver for ${docs[0].name}` : `${docs.length} waivers`}>
      <div className="waiver-print__toolbar">
        <button type="button" className="admin-btn admin-btn--ghost" onClick={onClose} ref={backRef}>
          Back to waivers
        </button>
        <p>{docs.length === 1 ? docs[0].name : `${docs.length} waivers, one per page`}</p>
        <button type="button" className="admin-btn" onClick={() => window.print()}>
          Print or save as PDF
        </button>
      </div>
      <div className="waiver-print__pages">
        {docs.map((doc) => (
          <WaiverSheet doc={doc} key={doc.id} />
        ))}
      </div>
    </section>,
    document.body,
  )
}
