import { useMemo, useState } from 'react'
import { league } from '../config/league'
import type { Act } from './AdminApp'
import { birthLabel, downloadCsv, money, shortDate } from './format'
import { experienceLabel, playerName, type AdminData, type AdminRegistration } from './model'

type Show = 'all' | 'waiting' | 'placed' | 'withdrawn'

export function PlayersView({ data, act, busy }: { data: AdminData; act: Act; busy: boolean }) {
  const [division, setDivision] = useState('all')
  const [show, setShow] = useState<Show>('all')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const teamName = useMemo(() => new Map(data.teams.map((t) => [t.id, t.name])), [data.teams])

  const players = data.registrations
    .filter((r) => r.kind === 'player')
    .filter((r) => division === 'all' || r.division === division)
    .filter((r) =>
      show === 'all'
        ? r.status === 'active'
        : show === 'withdrawn'
          ? r.status === 'withdrawn'
          : r.status === 'active' && (show === 'placed' ? Boolean(r.teamId) : !r.teamId),
    )
    .filter((r) => {
      const q = search.trim().toLowerCase()
      if (!q) return true
      const f = r.fields
      return [playerName(r), f.guardianName, r.email, r.phone, f.teammateRequest].some((v) => v?.toLowerCase().includes(q))
    })
    .sort((a, b) => a.division.localeCompare(b.division, 'en', { numeric: true }) || playerName(a).localeCompare(playerName(b)))

  const exportCsv = () =>
    downloadCsv(`elevatepro-players-${division}.csv`, [
      ['Player', 'Division', 'Date of birth', 'Parent/guardian', 'Email', 'Phone', 'Experience', 'Teammate request', 'Team', 'Language', 'Paid', 'Amount', 'Status', 'Test payment', 'Notes'],
      ...players.map((r) => [
        playerName(r),
        r.division,
        r.fields.dateOfBirth,
        r.fields.guardianName,
        r.email,
        r.phone,
        experienceLabel(r.fields.experience),
        r.fields.teammateRequest,
        r.teamId ? teamName.get(r.teamId) : '',
        r.locale === 'es' ? 'Spanish' : 'English',
        shortDate(r.paidAt),
        money(r.amountCents, r.currency),
        r.status,
        r.livemode ? '' : 'yes',
        r.notes,
      ]),
    ])

  return (
    <section className="admin-card">
      <div className="admin-card__head">
        <h2 className="admin-h2">Players ({players.length})</h2>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={exportCsv} disabled={!players.length}>
          Download CSV
        </button>
      </div>

      <div className="admin-filters">
        <label className="admin-field admin-field--inline">
          <span>Division</span>
          <select value={division} onChange={(e) => setDivision(e.target.value)}>
            <option value="all">All</option>
            {league.divisions.map((d) => (
              <option key={d.id}>{d.id}</option>
            ))}
          </select>
        </label>
        <label className="admin-field admin-field--inline">
          <span>Show</span>
          <select value={show} onChange={(e) => setShow(e.target.value as Show)}>
            <option value="all">All active</option>
            <option value="waiting">Waiting for a team</option>
            <option value="placed">Placed on a team</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </label>
        <label className="admin-field admin-field--inline admin-field--grow">
          <span>Search</span>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, parent, email, phone" />
        </label>
      </div>

      {players.length === 0 ? (
        <p className="admin-muted">No players match.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Player</th>
                <th scope="col">Div.</th>
                <th scope="col">Born</th>
                <th scope="col">Parent/guardian</th>
                <th scope="col">Experience</th>
                <th scope="col">Teammate request</th>
                <th scope="col">Team</th>
                <th scope="col">Paid</th>
                <th scope="col">
                  <span className="visually-hidden">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {players.map((r) => (
                <PlayerRow
                  key={r.id}
                  r={r}
                  team={r.teamId ? (teamName.get(r.teamId) ?? '') : ''}
                  open={open === r.id}
                  onToggle={() => setOpen(open === r.id ? null : r.id)}
                  act={act}
                  busy={busy}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function PlayerRow({
  r,
  team,
  open,
  onToggle,
  act,
  busy,
}: {
  r: AdminRegistration
  team: string
  open: boolean
  onToggle: () => void
  act: Act
  busy: boolean
}) {
  const [notes, setNotes] = useState(r.notes)
  const f = r.fields
  return (
    <>
      <tr className={r.status === 'withdrawn' ? 'admin-row--muted' : undefined}>
        <th scope="row">
          {playerName(r)}
          {r.locale === 'es' && <span className="admin-badge">ES</span>}
          {!r.livemode && <span className="admin-badge admin-badge--test">TEST</span>}
        </th>
        <td>{r.division}</td>
        <td>{birthLabel(f.dateOfBirth)}</td>
        <td>
          {f.guardianName}
          <br />
          <a href={`mailto:${r.email}`}>{r.email}</a>
          <br />
          <a href={`tel:${r.phone.replace(/[^\d+]/g, '')}`}>{r.phone}</a>
        </td>
        <td>{experienceLabel(f.experience) || '—'}</td>
        <td>{f.teammateRequest || '—'}</td>
        <td>{team || <span className="admin-warn">Waiting</span>}</td>
        <td>
          {shortDate(r.paidAt)}
          <br />
          <span className="admin-muted">{money(r.amountCents, r.currency)}</span>
        </td>
        <td>
          <button type="button" className="admin-link" aria-expanded={open} onClick={onToggle}>
            {open ? 'Close' : 'Details'}
            <span className="visually-hidden"> for {playerName(r)}</span>
          </button>
        </td>
      </tr>
      {open && (
        <tr className="admin-row-details">
          <td colSpan={9}>
            <div className="admin-details">
              <label className="admin-field admin-field--grow">
                <span>Notes (only admins see these)</span>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </label>
              <div className="admin-actions">
                <button type="button" className="admin-btn" disabled={busy || notes === r.notes} onClick={() => act('updateRegistration', { id: r.id, notes }, 'Notes saved.')}>
                  Save notes
                </button>
                {r.status === 'active' ? (
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(`Mark ${playerName(r)} as withdrawn? They'll be taken off their team. This doesn't refund the payment; do that in Stripe.`)) {
                        void act('updateRegistration', { id: r.id, status: 'withdrawn' }, `${playerName(r)} marked as withdrawn.`)
                      }
                    }}
                  >
                    Mark withdrawn
                  </button>
                ) : (
                  <button type="button" className="admin-btn admin-btn--ghost" disabled={busy} onClick={() => act('updateRegistration', { id: r.id, status: 'active' }, `${playerName(r)} restored.`)}>
                    Restore
                  </button>
                )}
              </div>
              <p className="admin-muted">
                Stripe payment: {r.paymentIntentId ?? r.id}
                {r.paymentIntentId && (
                  <>
                    {' · '}
                    <a href={`https://dashboard.stripe.com/${r.livemode ? '' : 'test/'}payments/${r.paymentIntentId}`} target="_blank" rel="noopener noreferrer">
                      Open in Stripe<span className="visually-hidden"> (opens in a new tab)</span>
                    </a>
                  </>
                )}
              </p>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
