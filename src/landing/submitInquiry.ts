/**
 * THE submission adapter for the landing pages' information requests — the only place the
 * pages talk to a server. It POSTs to landing.inquiryEndpoint (/api/contact → server/lead.ts),
 * which validates again, emails the league inbox, confirms to the person, and saves the request
 * to the admin dashboard and the Resend contact list.
 *
 * Success is reported only when the server confirms receipt. Nothing here logs, stores or puts
 * contact details in a URL.
 */
import { landing } from '../config/landing'
import type { Locale } from '../i18n/locale'
import type { FormErrors, FormValues } from '../registration/forms'
import type { InquiryType } from './inquiryForms'

export type InquiryResult =
  | { status: 'sent' }
  | { status: 'invalid'; errors: FormErrors }
  | { status: 'error'; reason: 'network' | 'server' | 'not-connected' | 'too-fast' }

export async function submitInquiry(
  inquiry: InquiryType,
  values: FormValues,
  meta: { locale: Locale; page: string; utm: Record<string, string>; submissionId: string; elapsedMs: number; trap: string },
): Promise<InquiryResult> {
  let response: Response
  try {
    response = await fetch(landing.inquiryEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        inquiry,
        locale: meta.locale,
        page: meta.page,
        utm: meta.utm,
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
  if (response.ok && data?.ok === true) return { status: 'sent' }
  if (data?.error === 'invalid-fields' && data.fields) return { status: 'invalid', errors: data.fields }
  if (data?.error === 'not-configured') return { status: 'error', reason: 'not-connected' }
  if (data?.error === 'too-fast') return { status: 'error', reason: 'too-fast' }
  return { status: 'error', reason: 'server' }
}

/** UTM campaign tags from the address the visitor arrived on. Read once; never stored. */
export function readUtm(search: string): Record<string, string> {
  const params = new URLSearchParams(search)
  const utm: Record<string, string> = {}
  for (const [key, value] of params) {
    if (key.startsWith('utm_') && value.trim()) utm[key] = value.trim().slice(0, 150)
  }
  return utm
}
