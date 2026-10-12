import { useState } from 'react'
import { league } from '../config/league'
import type { Act } from './AdminApp'
import { birthLabel } from './format'
import {
  experienceKey,
  playerName,
  suggestTeams,
  type AdminData,
  type AdminRegistration,
  type AdminTeam,
  type PoolPlayer,
} from './model'

/** Typical indoor roster size, used only for the default number of suggested teams. */
const DEFAULT_ROSTER = 8

const MIX_LABELS: Array<[key: string, label: string]> = [
  ['competitive', 'competitive'],
  ['recreational', 'recreational'],
  ['new', 'new'],
  ['', 'not given'],
]

/** "2 competitive · 3 recreational · 1 new" */
function experienceMix(players: AdminRegistration[]) {
  const counts = new Map<string, number>()
  for (const p of players) {
    const key = experienceKey(p.fields.experience)
    const bucket = key === 'unsure' ? '' : key
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1)
  }
  return MIX_LABELS.filter(([key]) => counts.get(key))
    .map(([key, label]) => `${counts.get(key)} ${label}`)
    .join(' · ')
}

const toPool = (r: AdminRegistration): PoolPlayer => ({
  id: r.id,
  firstName: r.fields.playerFirstName ?? '',
  lastName: r.fields.playerLastName ?? '',
  dateOfBirth: r.fields.dateOfBirth ?? '',
  experience: r.fields.experience ?? '',
  teammateRequest: r.fields.teammateRequest ?? '',
})

export function TeamBuilder({ data, act, busy }: { data: AdminData; act: Act; busy: boolean }) {
  const active = data.registrations.filter((r) => r.status === 'active' && r.kind === 'player')
  const registrationById = new Map(data.registrations.map((r) => [r.id, r]))
  const waitingIn = (division: string) => active.filter((r) => r.division === division && !r.teamId)
  const [division, setDivision] = useState(
    () => league.divisions.find((d) => waitingIn(d.id).length > 0)?.id ?? league.divisions[0].id,
  )
  const [preview, setPreview] = useState<{ division: string; teams: Array<{ name: string; playerIds: string[] }> } | null>(null)

  const waiting = waitingIn(division)
  const teams = data.teams.filter(
    (t) => t.division === division && (!t.registrationId || registrationById.get(t.registrationId)?.status === 'active'),
  )
  const membersOf = (team: AdminTeam) => active.filter((r) => r.teamId === team.id)
  const leagueTeamCount = teams.filter((t) => !t.registrationId).length
  const [teamCount, setTeamCount] = useState('')
  const suggestedCount = Math.max(1, Math.round(waiting.length / DEFAULT_ROSTER))
  const count = Number(teamCount) || suggestedCount

  const move = (player: AdminRegistration, teamId: string) => {
    const target = teams.find((t) => t.id === teamId)
    void act('assign', { registrationId: player.id, teamId: teamId || null }, `${playerName(player)} moved to ${target ? target.name : 'the waiting pool'}.`)
  }

  const moveSelect = (player: AdminRegistration) => (
    <select
      className="admin-move"
      value={player.teamId ?? ''}
      disabled={busy}
      aria-label={`Team for ${playerName(player)}`}
      onChange={(e) => move(player, e.target.value)}
    >
      <option value="">Waiting</option>
      {teams.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  )

  const playerItem = (player: AdminRegistration) => (
    <li className="admin-player" key={player.id}>
      <div>
        <span>
          <strong>{playerName(player)}</strong>
          {player.locale === 'es' && <span className="admin-badge">ES</span>}
          {!player.livemode && <span className="admin-badge admin-badge--test">TEST</span>}
        </span>
        <span className="admin-player__meta">
          {birthLabel(player.fields.dateOfBirth)}
          {experienceKey(player.fields.experience) && ` · ${experienceKey(player.fields.experience)}`}
        </span>
        {player.fields.teammateRequest && (
          <span className="admin-player__request">Wants to play with: {player.fields.teammateRequest}</span>
        )}
      </div>
      {moveSelect(player)}
    </li>
  )

  const makePreview = () => {
    const groups = suggestTeams(waiting.map(toPool), count)
    setPreview({
      division,
      teams: groups.map((playerIds, i) => ({ name: `${division} Team ${leagueTeamCount + i + 1}`, playerIds })),
    })
  }

  return (
    <div className="admin-stack">
      <nav className="admin-segments" aria-label="Division">
        {league.divisions.map((d) => {
          const n = waitingIn(d.id).length
          return (
            <button
              type="button"
              key={d.id}
              aria-pressed={division === d.id}
              onClick={() => {
                setDivision(d.id)
                setPreview(null)
                setTeamCount('')
              }}
            >
              {d.id}
              <span className="admin-segments__count">{n} waiting</span>
            </button>
          )
        })}
      </nav>

      <section className="admin-card" aria-labelledby="suggest-title">
        <h2 className="admin-h2" id="suggest-title">
          Suggest {division} teams
        </h2>
        {waiting.length === 0 ? (
          <p className="admin-muted">Every {division} player is on a team.</p>
        ) : (
          <>
            <p className="admin-muted">
              Splits the {waiting.length} waiting player{waiting.length === 1 ? '' : 's'} into new teams of even size,
              spreading experience and age and keeping teammate requests together. Nothing is saved until you create the
              teams, and you can move players afterwards.
            </p>
            <div className="admin-filters">
              <label className="admin-field admin-field--inline">
                <span>Number of new teams</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, waiting.length)}
                  value={teamCount}
                  placeholder={String(suggestedCount)}
                  onChange={(e) => setTeamCount(e.target.value)}
                />
              </label>
              <button type="button" className="admin-btn" onClick={makePreview} disabled={busy}>
                Preview teams
              </button>
            </div>
          </>
        )}

        {preview && preview.division === division && (
          <div className="admin-preview">
            <div className="admin-team-grid">
              {preview.teams.map((team, i) => {
                const members = team.playerIds.map((id) => registrationById.get(id)!).filter(Boolean)
                return (
                  <article className="admin-team admin-team--preview" key={team.name}>
                    <label className="admin-field">
                      <span>Team name</span>
                      <input
                        value={team.name}
                        onChange={(e) =>
                          setPreview({
                            ...preview,
                            teams: preview.teams.map((t, j) => (j === i ? { ...t, name: e.target.value } : t)),
                          })
                        }
                      />
                    </label>
                    <p className="admin-muted">
                      {members.length} players · {experienceMix(members)}
                    </p>
                    <ul className="admin-list">
                      {members.map((m) => (
                        <li key={m.id}>
                          {playerName(m)}
                          {m.fields.teammateRequest && <span className="admin-muted"> · asked for {m.fields.teammateRequest}</span>}
                        </li>
                      ))}
                    </ul>
                  </article>
                )
              })}
            </div>
            <div className="admin-actions">
              <button
                type="button"
                className="admin-btn"
                disabled={busy || preview.teams.some((t) => !t.name.trim())}
                onClick={async () => {
                  const reply = await act('createTeams', preview, `Created ${preview.teams.length} ${division} team${preview.teams.length === 1 ? '' : 's'}.`)
                  if (reply) setPreview(null)
                }}
              >
                Create {preview.teams.length} team{preview.teams.length === 1 ? '' : 's'}
              </button>
              <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setPreview(null)}>
                Discard
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="admin-builder">
        <section className="admin-card" aria-labelledby="pool-title">
          <h2 className="admin-h2" id="pool-title">
            Waiting for a team ({waiting.length})
          </h2>
          {waiting.length === 0 ? <p className="admin-muted">Nobody waiting.</p> : <ul className="admin-players">{waiting.map(playerItem)}</ul>}
        </section>

        <section className="admin-stack" aria-label={`${division} teams`}>
          {teams.length === 0 && (
            <div className="admin-card">
              <p className="admin-muted">No {division} teams yet. Suggest teams above, or create one on the Teams tab.</p>
            </div>
          )}
          {teams.map((team) => {
            const members = membersOf(team)
            return (
              <article className="admin-card" key={team.id} aria-label={team.name}>
                <header className="admin-team__head">
                  <h3 className="admin-team__name">{team.name}</h3>
                  <span className={`admin-badge${team.registrationId ? ' admin-badge--blue' : ''}`}>
                    {team.registrationId ? 'Registered team' : 'League team'}
                  </span>
                </header>
                <p className="admin-muted">
                  {members.length} {team.registrationId ? 'added from the pool' : `player${members.length === 1 ? '' : 's'}`}
                  {members.length > 0 && ` · ${experienceMix(members)}`}
                </p>
                {members.length > 0 && <ul className="admin-players">{members.map(playerItem)}</ul>}
              </article>
            )
          })}
        </section>
      </div>
    </div>
  )
}
