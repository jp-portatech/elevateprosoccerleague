/** Browser side of the contact form: POSTs to /api/contact (server/lead.ts). */
import type { Locale } from '../i18n/locale'
import type { FormErrors, FormValues } from '../registration/forms'

export type LeadResult =
  | { status: 'sent' }
  | { status: 'invalid'; errors: FormErrors }
  | { status: 'error'; reason: 'network' | 'send' | 'too-fast' }

export async function submitLead(
  values: FormValues,
  locale: Locale,
  meta: { submissionId: string; elapsedMs: number; trap: string },
): Promise<LeadResult> {
  let response: Response
  try {
    response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        locale,
        fields: values,
        submissionId: meta.submissionId,
        elapsedMs: meta.elapsedMs,
        leave_this_empty: meta.trap,
      }),
    })
  } catch {
    return { status: 'error', reason: 'network' }
  }
  const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; fields?: FormErrors } | null
  if (response.ok && data?.ok) return { status: 'sent' }
  if (data?.error === 'invalid-fields' && data.fields) return { status: 'invalid', errors: data.fields }
  if (data?.error === 'too-fast') return { status: 'error', reason: 'too-fast' }
  return { status: 'error', reason: 'send' }
}
