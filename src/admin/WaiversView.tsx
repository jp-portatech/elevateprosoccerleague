import { useCallback, useState } from 'react'
import { WAIVER_FIELDS } from '../waiver/waiverForm'
import { AgreementPrint } from './AgreementPrint'
import { AdminError, adminCall } from './api'
import { birthLabel, downloadCsv } from './format'
import type { AdminAgreementDoc, AdminData, AdminWaiver, AdminWaiverDoc } from './model'
import { WaiverPrint } from './WaiverPrint'

const signedLabel = (iso: string) =>
  iso
    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(
        new Date(iso),
      )
    : '—'

const PHOTOS = { yes: 'Yes', no: 'No', '': 'No (left blank)' } as const
const photosLabel = (w: AdminWaiver) => (w.agreement ? PHOTOS[w.agreement.mediaPermission] : '—')

type Printing = { kind: 'waivers'; docs: AdminWaiverDoc[] } | { kind: 'agreements'; docs: AdminAgreementDoc[] }

/**
 * Signed waivers from /waiver, newest first. Each player has two separate documents: the facility
 * waiver (printed for the facility owner, in the facility's format) and ElevatePro's player
 * agreement (kept for your records).
 */
export function WaiversView({ data }: { data: AdminData }) {
  const [printing, setPrinting] = useState<Printing | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const waivers = data.waivers
  const signedAgreements = waivers.filter((w) => w.agreement).length
  const close = useCallback(() => setPrinting(null), [])

  /** Fetches the signatures (left out of the list to keep the dashboard quick) and opens the print view. */
  const open = async (kind: Printing['kind'], ids: string[], key: string) => {
    // Buttons stay enabled while loading (a disabled button drops keyboard focus, which the
    // print view hands back when it closes); repeat clicks are just ignored.
    if (loading) return
    setLoading(key)
    setProblem(null)
    try {
      if (kind === 'waivers') {
        const reply = await adminCall<{ waivers: AdminWaiverDoc[] }>('waiverDocs', { ids })
        setPrinting({ kind, docs: reply.waivers })
      } else {
        const reply = await adminCall<{ agreements: AdminAgreementDoc[] }>('agreementDocs', { waiverIds: ids })
        setPrinting({ kind, docs: reply.agreements })
      }
    } catch (error) {
      setProblem(error instanceof AdminError ? error.message : 'Couldn’t open it. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const exportCsv = () =>
    downloadCsv('elevate-pro-waivers.csv', [
      [
        'Signed',
        ...WAIVER_FIELDS.map(({ field }) => field.label.en),
        'Parent/guardian signed facility waiver',
        'ElevatePro agreement signed by',
        'Signer role',
        'Emergency contact',
        'Emergency phone',
        'Photo and video permission',
        'Reference',
      ],
      ...waivers.map((w) => [
        signedLabel(w.signedAt),
        ...WAIVER_FIELDS.map(({ field }) => w.fields[field.name]),
        w.guardianSigned ? 'Yes' : 'No',
        w.agreement?.signerName ?? 'Not signed',
        w.agreement ? (w.agreement.signerRole === 'guardian' ? 'Parent or legal guardian' : 'Adult player') : '',
        w.agreement?.emergencyContact,
        w.agreement?.emergencyPhone,
        w.agreement ? PHOTOS[w.agreement.mediaPermission] : '',
        w.id,
      ]),
    ])

  return (
    <section className="admin-card">
      <div className="admin-card__head">
        <h2 className="admin-h2">Waivers ({waivers.length})</h2>
        <div className="admin-actions">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => open('waivers', [], 'all-waivers')}
            disabled={!waivers.length}
            aria-busy={loading === 'all-waivers' || undefined}
          >
            {loading === 'all-waivers' ? 'Opening…' : 'Print all facility waivers'}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={() => open('agreements', [], 'all-agreements')}
            disabled={!signedAgreements}
            aria-busy={loading === 'all-agreements' || undefined}
          >
            {loading === 'all-agreements' ? 'Opening…' : 'Print all ElevatePro agreements'}
          </button>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={exportCsv} disabled={!waivers.length}>
            Download CSV
          </button>
        </div>
      </div>
      <p className="admin-muted">
        Signed online at <strong>/waiver</strong>, one per player, as two separate documents: the{' '}
        <strong>facility waiver</strong> to print for the facility owner (in the facility’s format), and{' '}
        <strong>ElevatePro’s player agreement</strong> for your records. Open either to print it or save it as a PDF.
      </p>
      {problem && (
        <p className="admin-error" role="alert">
          {problem}
        </p>
      )}

      {waivers.length === 0 ? (
        <p className="admin-muted">No signed waivers yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Participant</th>
                <th scope="col">DOB</th>
                <th scope="col">Evening phone</th>
                <th scope="col">Emergency contact</th>
                <th scope="col">Photos OK</th>
                <th scope="col">Signed</th>
                <th scope="col">Facility waiver</th>
                <th scope="col">ElevatePro agreement</th>
              </tr>
            </thead>
            <tbody>
              {waivers.map((w) => (
                <tr key={w.id}>
                  <th scope="row">{w.name}</th>
                  <td>{birthLabel(w.dob)}</td>
                  <td>
                    <a className="admin-phone" href={`tel:${w.phone.replace(/[^\d+]/g, '')}`}>
                      {w.phone}
                    </a>
                  </td>
                  <td>
                    {w.agreement ? (
                      <>
                        {w.agreement.emergencyContact}
                        <br />
                        <a className="admin-phone" href={`tel:${w.agreement.emergencyPhone.replace(/[^\d+]/g, '')}`}>
                          {w.agreement.emergencyPhone}
                        </a>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{photosLabel(w)}</td>
                  <td>{signedLabel(w.signedAt)}</td>
                  <td>
                    <button
                      type="button"
                      className="admin-link"
                      onClick={() => open('waivers', [w.id], `w-${w.id}`)}
                      aria-busy={loading === `w-${w.id}` || undefined}
                    >
                      {loading === `w-${w.id}` ? 'Opening…' : 'Print for facility'}
                      <span className="visually-hidden"> (facility waiver for {w.name})</span>
                    </button>
                  </td>
                  <td>
                    {w.agreement ? (
                      <button
                        type="button"
                        className="admin-link"
                        onClick={() => open('agreements', [w.id], `a-${w.id}`)}
                        aria-busy={loading === `a-${w.id}` || undefined}
                      >
                        {loading === `a-${w.id}` ? 'Opening…' : 'View / print'}
                        <span className="visually-hidden"> (ElevatePro agreement for {w.name})</span>
                      </button>
                    ) : (
                      <span className="admin-muted">Not signed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {printing?.kind === 'waivers' && <WaiverPrint docs={printing.docs} onClose={close} />}
      {printing?.kind === 'agreements' && <AgreementPrint docs={printing.docs} onClose={close} />}
    </section>
  )
}
