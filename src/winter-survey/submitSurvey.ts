/** Browser side of the winter survey: POSTs to /api/winter-survey (server/winterSurvey.ts). */
import type { FormErrors } from '../registration/forms'
import type { SurveyValues } from './surveyForm'

export type SurveyResult =
  /** `confirmed`: the confirmation email went out to the parent. */
  | { status: 'sent'; confirmed: boolean }
  | { status: 'invalid'; errors: FormErrors }
  | { status: 'error'; reason: 'network' | 'send' | 'too-fast' }

export async function submitSurvey(
  values: SurveyValues,
  meta: { submissionId: string; elapsedMs: number; trap: string },
): Promise<SurveyResult> {
  let response: Response
  try {
    response = await fetch('/api/winter-survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        fields: values,
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
