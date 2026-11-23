/** Browser side of the waiver page: POSTs the facility waiver and ElevatePro's agreement to /api/waiver (server/waiver.ts). */
import type { FormErrors, FormValues } from '../registration/forms'
import type { AgreementInput } from './agreementForm'
import type { Signatures } from './waiverForm'

export type WaiverResult =
  /** `confirmed`: the copy of both signed documents was emailed to the address on the form. */
  | { status: 'sent'; confirmed: boolean }
  | { status: 'invalid'; errors: FormErrors }
  | { status: 'error'; reason: 'network' | 'send' | 'too-fast' }

export async function submitWaiver(
  values: FormValues,
  signatures: Signatures,
  agreement: AgreementInput,
  consent: boolean,
  meta: { submissionId: string; elapsedMs: number; trap: string },
): Promise<WaiverResult> {
  let response: Response
  try {
    response = await fetch('/api/waiver', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        fields: values,
        signatures,
        agreement,
        consent,
        submissionId: meta.submissionId,
        elapsedMs: meta.elapsedMs,
        leave_this_empty: meta.trap,
      }),
    })
  } catch {
    return { status: 'error', reason: 'network' }
  }
  const data = (await response.json().catch(() => null)) as {
    ok?: boolean
    confirmed?: boolean
    error?: string
    fields?: FormErrors
  } | null
  if (response.ok && data?.ok) return { status: 'sent', confirmed: data.confirmed === true }
  if (data?.error === 'invalid-fields' && data.fields) return { status: 'invalid', errors: data.fields }
  if (data?.error === 'too-fast') return { status: 'error', reason: 'too-fast' }
  return { status: 'error', reason: 'send' }
}
