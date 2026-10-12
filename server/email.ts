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

export interface NewContact {
  email: string
  firstName: string
  lastName: string
  /**
   * True when the person didn't agree to news and offers: they're kept on the list but
   * Resend leaves them out of Broadcasts.
   */
  unsubscribed: boolean
}

/**
 * Adds someone to the Resend contact list, in `segmentId` when one is set. Needs an API key
 * with Full access (a Sending access key gets a 401 restricted_api_key error).
 *
 * If they're already on the list, their name is updated and they're re-subscribed when they
 * just opted in again. An earlier opt-out is never undone without a new opt-in.
 */
export async function saveContact(apiKey: string, contact: NewContact, segmentId?: string): Promise<void> {
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
  const names = { first_name: contact.firstName, last_name: contact.lastName }

  const created = await fetch('https://api.resend.com/contacts', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: contact.email,
      ...names,
      unsubscribed: contact.unsubscribed,
      ...(segmentId && { segments: [{ id: segmentId }] }),
    }),
  })
  if (created.ok) return
  const detail = (await created.text()).slice(0, 300)

  if (created.status === 409 || /already exists/i.test(detail)) {
    const updated = await fetch(`https://api.resend.com/contacts/${encodeURIComponent(contact.email)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ ...names, ...(!contact.unsubscribed && { unsubscribed: false }) }),
    })
    if (updated.ok) return
    throw new Error(`Resend contact update responded ${updated.status}: ${(await updated.text()).slice(0, 300)}`)
  }
  throw new Error(`Resend contact create responded ${created.status}: ${detail}`)
}
