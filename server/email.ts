/**
 * Sends email through Resend (https://resend.com). This is the only module that talks to
 * the email provider — swap the fetch call here to use a different service.
 */

export interface OutgoingEmail {
  to: string | string[]
  subject: string
  html: string
  text: string
  replyTo?: string | string[]
  /**
   * Same key → Resend sends at most once (keys are remembered for 24 hours). Protects
   * against duplicate emails when Stripe retries a webhook.
   */
  idempotencyKey: string
}

export async function sendEmail(apiKey: string, from: string, email: OutgoingEmail): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': email.idempotencyKey.slice(0, 256),
    },
    body: JSON.stringify({
      from,
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      ...(email.replyTo && { reply_to: email.replyTo }),
    }),
  })
  if (!response.ok) {
    throw new Error(`Resend responded ${response.status}: ${(await response.text()).slice(0, 300)}`)
  }
}
