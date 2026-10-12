import { useState, type SubmitEvent } from 'react'
import { league } from '../config/league'
import type { Act } from './AdminApp'
import { downloadCsv, shortDate } from './format'
import { playerName, type AdminData, type AdminRegistration, type AdminTeam } from './model'

export function TeamsView({ data, act, busy }: { data: AdminData; act: Act; busy: boolean }) {
  const [creating, setCreating] = useState<string | null>(null)
  const active = data.registrations.filter((r) => r.status === 'active')
  const registrationById = new Map(data.registrations.map((r) => [r.id, r]))
  // Hide teams whose registration is filtered out (e.g. test payments) or withdrawn.
  const teams = data.teams.filter((t) => !t.registrationId || registrationById.get(t.registrationId)?.status === 'active')
  const playersOf = (team: AdminTeam) => active.filter((r) => r.kind === 'player' && r.teamId === team.id)

  const exportCsv = () =>
    downloadCsv('elevatepro-rosters.csv', [
      ['Division', 'Team', 'Type', 'Coach', 'Coach email', 'Coach phone', 'Player', 'Date of birth', 'Parent/guardian', 'Email', 'Phone'],
      ...teams.flatMap((t) => {
        const base = [t.division, t.name, t.registrationId ? 'Registered team' : 'League team', t.coachName, t.coachEmail, t.coachPhone]
        const players = playersOf(t)
        return players.length
          ? players.map((r) => [...base, playerName(r), r.fields.dateOfBirth, r.fields.guardianName, r.email, r.phone])
          : [base]
      }),
    ])

  return (
    <div className="admin-stack">
      <div className="admin-card admin-card--flat admin-card__head">
        <p className="admin-muted">
          Registered teams signed up and paid as a team. League teams are the ones you form from individual players.
        </p>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={exportCsv} disabled={!teams.length}>
          Download rosters CSV
        </button>
      </div>

      {league.divisions.map((d) => {
        const divisionTeams = teams.filter((t) => t.division === d.id)
        return (
          <section className="admin-card" key={d.id} aria-labelledby={`teams-${d.id}`}>
            <div className="admin-card__head">
              <h2 className="admin-h2" id={`teams-${d.id}`}>
                {d.id} <span className="admin-muted">({divisionTeams.length} teams)</span>
              </h2>
              <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setCreating(creating === d.id ? null : d.id)} aria-expanded={creating === d.id}>
                New team
              </button>
            </div>
            {creating === d.id && (
              <TeamForm
                busy={busy}
                submitLabel="Create team"
                onCancel={() => setCreating(null)}
                onSubmit={async (team) => {
                  if (await act('saveTeam', { division: d.id, ...team }, `Team “${team.name}” created.`)) setCreating(null)
                }}
              />
            )}
            {divisionTeams.length === 0 ? (
              <p className="admin-muted">No teams yet.</p>
            ) : (
              <div className="admin-team-grid">
                {divisionTeams.map((team) => (
                  <TeamCard
                    key={team.id}
                    team={team}
                    registration={team.registrationId ? registrationById.get(team.registrationId) : undefined}
                    players={playersOf(team)}
                    act={act}
                    busy={busy}
                  />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}

interface TeamFields {
  name: string
  coachName: string
  coachEmail: string
  coachPhone: string
}

function TeamForm({
  initial = { name: '', coachName: '', coachEmail: '', coachPhone: '' },
  submitLabel,
  busy,
  onSubmit,
  onCancel,
}: {
  initial?: TeamFields
  submitLabel: string
  busy: boolean
  onSubmit: (team: TeamFields) => void
  onCancel: () => void
}) {
  const [team, setTeam] = useState(initial)
  const field = (key: keyof TeamFields, label: string, type = 'text') => (
    <label className="admin-field">
      <span>{label}</span>
      <input type={type} value={team[key]} onChange={(e) => setTeam({ ...team, [key]: e.target.value })} required={key === 'name'} />
    </label>
  )
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit(team)
  }
  return (
    <form className="admin-form admin-form--grid" onSubmit={submit}>
      {field('name', 'Team name')}
      {field('coachName', 'Coach name')}
      {field('coachEmail', 'Coach email', 'email')}
      {field('coachPhone', 'Coach phone', 'tel')}
      <div className="admin-actions">
        <button type="submit" className="admin-btn" disabled={busy}>
          {submitLabel}
        </button>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function TeamCard({
  team,
  registration,
  players,
  act,
  busy,
}: {
  team: AdminTeam
  registration?: AdminRegistration
  players: AdminRegistration[]
  act: Act
  busy: boolean
}) {
  const [editing, setEditing] = useState(false)
  const registered = Boolean(team.registrationId)

  const notify = () => {
    const who = `${players.length} famil${players.length === 1 ? 'y' : 'ies'}${team.coachEmail ? ` and coach ${team.coachName || team.coachEmail}` : ''}`
    const again = team.notifiedAt ? `\n\nThis team was already notified on ${shortDate(team.notifiedAt)}. They'll get the email again.` : ''
    const noCoach = team.coachEmail ? '' : '\n\nThere is no coach email, so families will be told coach details are coming soon.'
    if (window.confirm(`Email ${who} about “${team.name}”?${noCoach}${again}`)) {
      void act('notifyTeam', { teamId: team.id }, (reply) => `Team info sent to ${String(reply.families)} famil${reply.families === 1 ? 'y' : 'ies'}${reply.coach ? ' and the coach' : ''}.`)
    }
  }

  return (
    <article className="admin-team" aria-label={team.name}>
      <header className="admin-team__head">
        <h3 className="admin-team__name">{team.name}</h3>
        <span className={`admin-badge${registered ? ' admin-badge--blue' : ''}`}>{registered ? 'Registered team' : 'League team'}</span>
      </header>

      {editing ? (
        <TeamForm
          initial={{ name: team.name, coachName: team.coachName, coachEmail: team.coachEmail, coachPhone: team.coachPhone }}
          submitLabel="Save"
          busy={busy}
          onCancel={() => setEditing(false)}
          onSubmit={async (fields) => {
            if (await act('saveTeam', { id: team.id, ...fields }, 'Team saved.')) setEditing(false)
          }}
        />
      ) : (
        <dl className="admin-team__facts">
          <dt>Coach</dt>
          <dd>
            {team.coachName || <span className="admin-muted">Not set</span>}
            {team.coachPhone && (
              <>
                {' · '}
                <a href={`tel:${team.coachPhone.replace(/[^\d+]/g, '')}`}>{team.coachPhone}</a>
              </>
            )}
            {team.coachEmail && (
              <>
                {' · '}
                <a href={`mailto:${team.coachEmail}`}>{team.coachEmail}</a>
              </>
            )}
          </dd>
          {registration?.fields.roster && (
            <>
              <dt>Roster from registration</dt>
              <dd className="admin-pre">{registration.fields.roster}</dd>
            </>
          )}
          {registration?.fields.clubName && (
            <>
              <dt>Club</dt>
              <dd>{registration.fields.clubName}</dd>
            </>
          )}
          <dt>{registered ? 'Added from the player pool' : 'Players'}</dt>
          <dd>
            {players.length === 0 ? (
              <span className="admin-muted">None yet. Use the Team builder.</span>
            ) : (
              <ul className="admin-list">
                {players.map((p) => (
                  <li key={p.id}>
                    {playerName(p)} <span className="admin-muted">· {p.fields.guardianName}</span>
                  </li>
                ))}
              </ul>
            )}
          </dd>
          <dt>Team info email</dt>
          <dd>{team.notifiedAt ? `Sent ${shortDate(team.notifiedAt)}` : <span className="admin-muted">Not sent</span>}</dd>
        </dl>
      )}

      {!editing && (
        <div className="admin-actions">
          <button type="button" className="admin-btn" disabled={busy || players.length === 0} onClick={notify}>
            Send team info
          </button>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setEditing(true)}>
            Edit
          </button>
          {!registered && (
            <button
              type="button"
              className="admin-btn admin-btn--ghost admin-btn--danger-text"
              disabled={busy}
              onClick={() => {
                if (window.confirm(`Delete “${team.name}”? Its ${players.length} player(s) go back to the waiting pool.`)) {
                  void act('deleteTeam', { id: team.id }, `Team “${team.name}” deleted.`)
                }
              }}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </article>
  )
}
