import { league } from '../config/league'
import type { Act } from './AdminApp'
import { money } from './format'
import type { AdminData } from './model'

export function Overview({ data, act, busy }: { data: AdminData; act: Act; busy: boolean }) {
  const active = data.registrations.filter((r) => r.status === 'active')
  const collected = active.reduce((sum, r) => sum + (r.amountCents ?? 0), 0)
  const newLeads = data.leads.filter((l) => l.status === 'new').length

  return (
    <div className="admin-stack">
      <section className="admin-stats" aria-label="Totals">
        <Stat value={active.filter((r) => r.kind === 'team').length} label="Teams registered" />
        <Stat value={active.filter((r) => r.kind === 'player').length} label="Individual players" />
        <Stat value={money(collected)} label="Collected" />
        <Stat value={newLeads} label="New leads" href="#leads" />
      </section>

      <section className="admin-card">
        <h2 className="admin-h2">By age group</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Division</th>
                <th scope="col">Registered teams</th>
                <th scope="col">Individual players</th>
                <th scope="col">Placed on a team</th>
                <th scope="col">Waiting for a team</th>
                <th scope="col">League teams</th>
              </tr>
            </thead>
            <tbody>
              {league.divisions.map((d) => {
                const players = active.filter((r) => r.kind === 'player' && r.division === d.id)
                const waiting = players.filter((r) => !r.teamId).length
                return (
                  <tr key={d.id}>
                    <th scope="row">{d.id}</th>
                    <td>{active.filter((r) => r.kind === 'team' && r.division === d.id).length}</td>
                    <td>{players.length}</td>
                    <td>{players.length - waiting}</td>
                    <td>{waiting > 0 ? <strong className="admin-warn">{waiting}</strong> : 0}</td>
                    <td>{data.teams.filter((t) => t.division === d.id && !t.registrationId).length}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-card">
        <h2 className="admin-h2">Import from Stripe</h2>
        <p className="admin-muted">
          Adds paid registrations from Stripe that aren’t here yet, such as ones made before the dashboard existed. Safe
          to run anytime; nothing is added twice.
        </p>
        <button
          type="button"
          className="admin-btn"
          disabled={busy}
          onClick={() =>
            act('import', {}, (reply) => {
              const added = Number(reply.imported ?? 0)
              return `Imported ${added} new registration${added === 1 ? '' : 's'} from Stripe (${Number(reply.skipped ?? 0)} were already here).`
            })
          }
        >
          Import from Stripe
        </button>
      </section>
    </div>
  )
}

function Stat({ value, label, href }: { value: number | string; label: string; href?: string }) {
  const body = (
    <>
      <span className="admin-stat__value">{value}</span>
      <span className="admin-stat__label">{label}</span>
    </>
  )
  return href ? (
    <a className="admin-stat" href={href}>
      {body}
    </a>
  ) : (
    <div className="admin-stat">{body}</div>
  )
}
