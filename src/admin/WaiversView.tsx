import { useCallback, useState } from 'react'
import { WAIVER_FIELDS } from '../waiver/waiverForm'
import { AdminError, adminCall } from './api'
import { birthLabel, downloadCsv } from './format'
import type { AdminData, AdminWaiver, AdminWaiverDoc } from './model'
import { WaiverPrint } from './WaiverPrint'

const signedLabel = (iso: string) =>
  iso
    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(
        new Date(iso),
      )
    : '—'

/** Facility waivers signed online at /waiver, newest first. */
export function WaiversView({ data }: { data: AdminData }) {
  const [docs, setDocs] = useState<AdminWaiverDoc[] | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const waivers = data.waivers
  const close = useCallback(() => setDocs(null), [])

  /** Fetches the signatures (left out of the list to keep the dashboard quick) and opens the print view. */
  const open = async (ids: string[], key: string) => {
    // Buttons stay enabled while loading (a disabled button drops keyboard focus, which the
    // print view hands back when it closes); repeat clicks are just ignored.
    if (loading) return
    setLoading(key)
    setProblem(null)
    try {
      const reply = await adminCall<{ waivers: AdminWaiverDoc[] }>('waiverDocs', { ids })
      setDocs(reply.waivers)
    } catch (error) {
      setProblem(error instanceof AdminError ? error.message : 'Couldn’t open the waiver. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const exportCsv = () =>
    downloadCsv('elevate-pro-waivers.csv', [
      ['Signed', ...WAIVER_FIELDS.map(({ field }) => field.label.en), 'Parent/guardian signed', 'Reference'],
      ...waivers.map((w) => [
        signedLabel(w.signedAt),
        ...WAIVER_FIELDS.map(({ field }) => w.fields[field.name]),
        w.guardianSigned ? 'Yes' : 'No',
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
            onClick={() => open([], 'all')}
            disabled={!waivers.length}
            aria-busy={loading === 'all' || undefined}
          >
            {loading === 'all' ? 'Opening…' : 'Print all'}
          </button>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={exportCsv} disabled={!waivers.length}>
            Download CSV
          </button>
        </div>
      </div>
      <p className="admin-muted">
        Facility waivers signed online at <strong>/waiver</strong>, one per player. Open one to print it or save it as a
        PDF, laid out like the facility’s paper form with the signatures.
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
                <th scope="col">Parent/guardian signed</th>
                <th scope="col">Evening phone</th>
                <th scope="col">Email</th>
                <th scope="col">Signed</th>
                <th scope="col">
                  <span className="visually-hidden">Print</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {waivers.map((w: AdminWaiver) => (
                <tr key={w.id}>
                  <th scope="row">{w.name}</th>
                  <td>{birthLabel(w.dob)}</td>
                  <td>{w.guardianSigned ? 'Yes' : 'No (18 or older)'}</td>
                  <td>
                    <a className="admin-phone" href={`tel:${w.phone.replace(/[^\d+]/g, '')}`}>
                      {w.phone}
                    </a>
                  </td>
                  <td>
                    <a className="admin-email" href={`mailto:${w.email}`}>
                      {w.email}
                    </a>
                  </td>
                  <td>{signedLabel(w.signedAt)}</td>
                  <td>
                    <button type="button" className="admin-link" onClick={() => open([w.id], w.id)} aria-busy={loading === w.id || undefined}>
                      {loading === w.id ? 'Opening…' : 'View / print'}
                      <span className="visually-hidden"> waiver for {w.name}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {docs && <WaiverPrint docs={docs} onClose={close} />}
    </section>
  )
}
