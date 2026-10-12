import { useCallback, useEffect, useMemo, useState, type ReactNode, type SubmitEvent } from 'react'
import { league } from '../config/league'
import { logo } from '../content/images'
import { AdminError, adminCall } from './api'
import { LeadsView } from './LeadsView'
import type { AdminData } from './model'
import { Overview } from './Overview'
import { PlayersView } from './PlayersView'
import { TeamBuilder } from './TeamBuilder'
import { TeamsView } from './TeamsView'
import './admin.css'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'players', label: 'Players' },
  { id: 'teams', label: 'Teams' },
  { id: 'builder', label: 'Team builder' },
  { id: 'leads', label: 'Leads' },
] as const
type TabId = (typeof TABS)[number]['id']

const tabFromHash = (): TabId => {
  const id = window.location.hash.slice(1)
  return TABS.some((t) => t.id === id) ? (id as TabId) : 'overview'
}

type Phase = { name: 'checking' } | { name: 'setup'; missing: string } | { name: 'login' } | { name: 'ready' }

/**
 * Runs a dashboard action, reloads the data and reports the outcome. Resolves to the server's
 * reply on success, or null on failure. `done` is the success message (or builds it from the reply).
 */
export type Act = (
  action: string,
  payload?: Record<string, unknown>,
  done?: string | ((reply: Record<string, unknown>) => string),
) => Promise<Record<string, unknown> | null>

export function AdminApp() {
  const [phase, setPhase] = useState<Phase>({ name: 'checking' })
  const [data, setData] = useState<AdminData | null>(null)
  const [tab, setTab] = useState<TabId>(tabFromHash)
  const [status, setStatus] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [showTest, setShowTest] = useState<boolean | null>(null)

  const handleError = useCallback((error: unknown) => {
    if (error instanceof AdminError && error.code === 'signed-out') setPhase({ name: 'login' })
    else if (error instanceof AdminError && error.code === 'not-configured')
      setPhase({ name: 'setup', missing: String(error.detail.missing ?? '') })
    else setStatus({ kind: 'error', text: error instanceof Error ? error.message : 'Something went wrong.' })
  }, [])

  const load = useCallback(async () => {
    try {
      setData(await adminCall<AdminData>('load'))
      setPhase({ name: 'ready' })
    } catch (error) {
      handleError(error)
    }
  }, [handleError])

  useEffect(() => {
    adminCall<{ authenticated: boolean }>('session')
      .then((session) => (session.authenticated ? load() : setPhase({ name: 'login' })))
      .catch(handleError)
  }, [load, handleError])

  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const act: Act = useCallback(
    async (action, payload = {}, done) => {
      setBusy(true)
      setStatus(null)
      try {
        const reply = await adminCall<Record<string, unknown>>(action, payload)
        await load()
        if (done) setStatus({ kind: 'ok', text: typeof done === 'function' ? done(reply) : done })
        return reply
      } catch (error) {
        handleError(error)
        return null
      } finally {
        setBusy(false)
      }
    },
    [load, handleError],
  )

  // Test-mode (sandbox) payments are shown until the first live payment arrives.
  const hasLive = Boolean(data?.registrations.some((r) => r.livemode))
  const includeTest = showTest ?? !hasLive
  const visible = useMemo<AdminData | null>(
    () => data && { ...data, registrations: data.registrations.filter((r) => includeTest || r.livemode) },
    [data, includeTest],
  )

  if (phase.name === 'checking') return <Shell><p className="admin-muted">Loading…</p></Shell>
  if (phase.name === 'setup') return <Setup missing={phase.missing} />
  if (phase.name === 'login') return <Login onSignedIn={load} />

  return (
    <div className="admin">
      <header className="admin-header">
        <div className="admin-header__inner">
          <a className="admin-brand" href="/">
            <img src={logo.src} srcSet={logo.srcSet} sizes="40px" width={40} height={40} alt="" />
            <span>
              {league.shortName} <strong>Admin</strong>
            </span>
          </a>
          <nav className="admin-tabs" aria-label="Dashboard">
            {TABS.map((t) => (
              <a key={t.id} href={`#${t.id}`} aria-current={tab === t.id ? 'page' : undefined}>
                {t.label}
              </a>
            ))}
          </nav>
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={async () => {
              await adminCall('logout').catch(() => null)
              setData(null)
              setPhase({ name: 'login' })
            }}
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="admin-main" aria-busy={busy || undefined}>
        <h1 className="visually-hidden">{TABS.find((t) => t.id === tab)?.label}</h1>
        <div className="admin-toolbar">
          <label className="admin-check">
            <input type="checkbox" checked={includeTest} onChange={(e) => setShowTest(e.target.checked)} />
            Include test payments
          </label>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={load} disabled={busy}>
            Refresh
          </button>
          <p className={`admin-status${status ? ` admin-status--${status.kind}` : ''}`} aria-live="polite">
            {busy ? 'Saving…' : status?.text}
          </p>
        </div>

        {visible && tab === 'overview' && <Overview data={visible} act={act} busy={busy} />}
        {visible && tab === 'players' && <PlayersView data={visible} act={act} busy={busy} />}
        {visible && tab === 'teams' && <TeamsView data={visible} act={act} busy={busy} />}
        {visible && tab === 'builder' && <TeamBuilder data={visible} act={act} busy={busy} />}
        {visible && tab === 'leads' && <LeadsView data={visible} act={act} busy={busy} />}
      </main>
    </div>
  )
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="admin-center">
      <div className="admin-card admin-card--narrow">
        <img className="admin-center__logo" src={logo.src} srcSet={logo.srcSet} sizes="72px" width={72} height={72} alt="" />
        {children}
      </div>
    </main>
  )
}

function Login({ onSignedIn }: { onSignedIn: () => Promise<void> }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!password || pending) return
    setPending(true)
    setError('')
    try {
      await adminCall('login', { password })
      await onSignedIn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Couldn’t sign in.')
      setPending(false)
    }
  }

  return (
    <Shell>
      <h1 className="admin-title">{league.shortName} admin</h1>
      <form className="admin-form" onSubmit={submit}>
        <label className="admin-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'login-error' : undefined}
            required
          />
        </label>
        {error && (
          <p className="admin-error" id="login-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="admin-btn" disabled={pending}>
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </Shell>
  )
}

function Setup({ missing }: { missing: string }) {
  return (
    <Shell>
      <h1 className="admin-title">Almost ready</h1>
      {missing === 'database' ? (
        <p>
          The dashboard’s database isn’t connected yet. In Vercel, open the project → <strong>Storage</strong> →{' '}
          <strong>Create Database</strong> → <strong>Neon</strong>, connect it to this project, then redeploy.
        </p>
      ) : missing === 'password-length' ? (
        <p>
          <code>ADMIN_PASSWORD</code> is set, but it’s shorter than 12 characters. In Vercel →{' '}
          <strong>Settings → Environment Variables</strong>, edit it to something longer, then redeploy.
        </p>
      ) : (
        <p>
          The admin password isn’t set. In Vercel → <strong>Settings → Environment Variables</strong>, add{' '}
          <code>ADMIN_PASSWORD</code> (at least 12 characters), then redeploy.
        </p>
      )}
    </Shell>
  )
}
