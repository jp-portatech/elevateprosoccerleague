/** Calls POST /api/admin (server/admin.ts). */

export class AdminError extends Error {
  readonly code: string
  readonly detail: Record<string, unknown>

  constructor(code: string, message: string, detail: Record<string, unknown> = {}) {
    super(message)
    this.code = code
    this.detail = detail
  }
}

const MESSAGES: Record<string, string> = {
  'wrong-password': 'That password isn’t right.',
  'too-many-attempts': 'Too many wrong passwords. Try again in 15 minutes.',
  'signed-out': 'Your session ended. Please sign in again.',
  'server-error': 'Something went wrong on the server. Please try again.',
  network: 'Couldn’t reach the server. Check your connection and try again.',
}

export async function adminCall<T = { ok: true }>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action, ...payload }),
    })
  } catch {
    throw new AdminError('network', MESSAGES.network)
  }
  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>
  if (!response.ok) {
    const code = typeof data.error === 'string' ? data.error : 'server-error'
    const message = typeof data.message === 'string' ? data.message : (MESSAGES[code] ?? MESSAGES['server-error'])
    throw new AdminError(code, message, data)
  }
  return data as T
}
