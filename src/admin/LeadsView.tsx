import { useState } from 'react'
import { leadOptionLabel } from '../contact/leadForm'
import type { Act } from './AdminApp'
import { downloadCsv, shortDate } from './format'
import { LEAD_STATUSES, leadSourceLabel, type AdminData, type AdminLead, type LeadStatus } from './model'

const interestLabel = (lead: AdminLead) => leadOptionLabel('interest', lead.interest, 'en')
const ageGroupLabel = (lead: AdminLead) => (lead.ageGroup ? leadOptionLabel('ageGroup', lead.ageGroup, 'en').split(' — ')[0] : '—')
const campaignLabel = (lead: AdminLead) => [lead.utm.utm_source, lead.utm.utm_medium, lead.utm.utm_campaign].filter(Boolean).join(' / ')

export function LeadsView({ data, act, busy }: { data: AdminData; act: Act; busy: boolean }) {
  const [status, setStatus] = useState<LeadStatus | 'all'>('all')
  const [open, setOpen] = useState<string | null>(null)
  const leads = data.leads.filter((l) => status === 'all' || l.status === status)

  const exportCsv = () =>
    downloadCsv('elevatepro-leads.csv', [
      ['Received', 'Name', 'Team name', 'Email', 'Phone', 'Interested in', 'Age group', 'Message', 'News and offers', 'Came from', 'Campaign', 'Term', 'Content', 'Language', 'Status', 'Notes'],
      ...leads.map((l) => [
        shortDate(l.createdAt),
        l.name,
        l.teamName,
        l.email,
        l.phone,
        interestLabel(l),
        ageGroupLabel(l),
        l.message,
        l.consent ? 'yes' : 'no',
        leadSourceLabel(l.source),
        campaignLabel(l),
        l.utm.utm_term,
        l.utm.utm_content,
        l.locale === 'es' ? 'Spanish' : 'English',
        LEAD_STATUSES.find((s) => s.value === l.status)?.label,
        l.notes,
      ]),
    ])

  return (
    <section className="admin-card">
      <div className="admin-card__head">
        <h2 className="admin-h2">Leads ({leads.length})</h2>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={exportCsv} disabled={!leads.length}>
          Download CSV
        </button>
      </div>
      <p className="admin-muted">
        From the homepage “Not ready to register?” form and the information requests on the Join as a player and
        Register a team pages. Only people with <strong>News and offers: Yes</strong> agreed to promotional emails and
        texts; reply to everyone else one-to-one.
      </p>
      <div className="admin-filters">
        <label className="admin-field admin-field--inline">
          <span>Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as LeadStatus | 'all')}>
            <option value="all">All</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {leads.length === 0 ? (
        <p className="admin-muted">No leads yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Contact</th>
                <th scope="col">Interested in</th>
                <th scope="col">Age group</th>
                <th scope="col">Came from</th>
                <th scope="col">News and offers</th>
                <th scope="col">Received</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visually-hidden">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <LeadRow key={lead.id} lead={lead} open={open === lead.id} onToggle={() => setOpen(open === lead.id ? null : lead.id)} act={act} busy={busy} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function LeadRow({ lead, open, onToggle, act, busy }: { lead: AdminLead; open: boolean; onToggle: () => void; act: Act; busy: boolean }) {
  const [notes, setNotes] = useState(lead.notes)
  return (
    <>
      <tr>
        <th scope="row">
          {lead.name}
          {lead.locale === 'es' && <span className="admin-badge">ES</span>}
          {lead.teamName && <span className="admin-muted"> · {lead.teamName}</span>}
        </th>
        <td>
          <a href={`mailto:${lead.email}`}>{lead.email}</a>
          <br />
          <a href={`tel:${lead.phone.replace(/[^\d+]/g, '')}`}>{lead.phone}</a>
        </td>
        <td>{interestLabel(lead)}</td>
        <td>{ageGroupLabel(lead)}</td>
        <td>
          {leadSourceLabel(lead.source)}
          {campaignLabel(lead) && (
            <>
              <br />
              <span className="admin-muted">{campaignLabel(lead)}</span>
            </>
          )}
        </td>
        <td>{lead.consent ? <strong>Yes</strong> : 'No'}</td>
        <td>{shortDate(lead.createdAt)}</td>
        <td>
          <select
            value={lead.status}
            disabled={busy}
            aria-label={`Status for ${lead.name}`}
            onChange={(e) => act('updateLead', { id: lead.id, status: e.target.value }, `${lead.name}: status updated.`)}
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </td>
        <td>
          <button type="button" className="admin-link" aria-expanded={open} onClick={onToggle}>
            {open ? 'Close' : 'Details'}
            <span className="visually-hidden"> for {lead.name}</span>
          </button>
        </td>
      </tr>
      {open && (
        <tr className="admin-row-details">
          <td colSpan={9}>
            <div className="admin-details">
              <p>
                <strong>Message:</strong> {lead.message || <span className="admin-muted">None</span>}
              </p>
              <label className="admin-field admin-field--grow">
                <span>Notes (only admins see these)</span>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </label>
              <div className="admin-actions">
                <button type="button" className="admin-btn" disabled={busy || notes === lead.notes} onClick={() => act('updateLead', { id: lead.id, notes }, 'Notes saved.')}>
                  Save notes
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
