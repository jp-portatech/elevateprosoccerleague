/**
 * Emails for the facility waiver (server/waiver.ts):
 *   - buildWaiverNotification → the league inbox: who signed, with a link to print it from the admin dashboard.
 *   - buildWaiverCopy         → the email on the form: their copy of the waiver they signed, word for word.
 *
 * The waiver wording comes from src/waiver/waiverForm.ts. Signature drawings aren't emailed (most
 * email apps hide embedded images); the signed copy with signatures is printed from the dashboard.
 */
import { league } from '../../src/config/league.js'
import { ageOn } from '../../src/admin/model.js'
import { WAIVER_FIELDS, WAIVERS, type Paragraph, type Signature } from '../../src/waiver/waiverForm.js'
import { button, detailsBox, esc, FONT, ICE, layout, NAVY, p, sectionTitle, SITE, TEXT, textRows, type RenderedEmail, type Rows } from './layout.js'

const PROGRAM = 'Elevate Pro Winter Training'

export interface SignedWaiver {
  id: string
  version: string
  fields: Record<string, string>
  participantSignature: Signature
  guardianSignature: Signature | null
  signedAt: Date
}

const signedOn = (date: Date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: league.timeZone,
    timeZoneName: 'short',
  }).format(date)

const heading = (text: string) =>
  `<h1 style="margin:0 0 18px;font-family:'Arial Black', ${FONT};font-size:26px;line-height:1.15;text-transform:uppercase;color:${NAVY};">${esc(text)}</h1>`

const detailRows = (fields: Record<string, string>): Rows => WAIVER_FIELDS.map(({ field }) => [field.label.en, fields[field.name] ?? ''])

const signatureText = (sig: Signature | null, minor: boolean) =>
  sig ? (sig.kind === 'typed' ? `Signed electronically (typed: ${sig.name})` : 'Signed electronically (drawn)') : minor ? 'Not signed' : 'Not needed (participant 18 or older)'

const signatureRows = (w: SignedWaiver): Rows => {
  const age = ageOn(w.fields.dob ?? '', w.signedAt)
  return [
    ['Signature', signatureText(w.participantSignature, true)],
    ['Parent/Guardian Signature', signatureText(w.guardianSignature, age === null || age < 18)],
    ['Date', signedOn(w.signedAt)],
    ['Reference', w.id],
  ]
}

const paragraphHtml = (paragraph: Paragraph) =>
  paragraph.map((s) => (typeof s === 'string' ? esc(s) : `<strong style="color:${NAVY};">${esc(s.b)}</strong>`)).join('')

// ---------- to the league inbox ----------

export function buildWaiverNotification(w: SignedWaiver): RenderedEmail {
  const name = w.fields.name
  const age = ageOn(w.fields.dob ?? '', w.signedAt)
  const subject = `Waiver signed: ${name}`
  const intro = `The facility waiver for <strong>${esc(name)}</strong>${age !== null ? ` (age ${age})` : ''} was signed online. Open it in the admin dashboard to print it or save it as a PDF.`
  const html = layout(
    'en',
    subject,
    `${name} · signed ${signedOn(w.signedAt)}`,
    `${heading('Waiver signed')}
    ${p(intro)}
    ${detailsBox('Participant details', detailRows(w.fields))}
    ${detailsBox('Signatures', signatureRows(w), ICE)}
    <p style="margin:16px 0 0;">${button(`${league.siteUrl}/admin#waivers`, 'Open waivers')}</p>`,
    `Sent to the ${league.shortName} inbox from the facility waiver at ${SITE}/waiver.`,
  )
  const text = [
    subject,
    '',
    intro.replace(/<\/?strong>/g, ''),
    '',
    'PARTICIPANT DETAILS',
    ...textRows(detailRows(w.fields)),
    '',
    'SIGNATURES',
    ...textRows(signatureRows(w)),
    '',
    `Open waivers: ${league.siteUrl}/admin#waivers`,
  ].join('\n')
  return { subject, html, text }
}

// ---------- to the signer: their copy ----------

export function buildWaiverCopy(w: SignedWaiver): RenderedEmail {
  const waiver = WAIVERS[w.version]
  const name = w.fields.name
  const subject = `Your signed waiver for ${name} | ${PROGRAM}`
  const thanks = `Thank you! We received the signed facility waiver for ${name}. Keep this email as your copy of what you signed.`
  const html = layout(
    'en',
    subject,
    `Your copy of the facility waiver for ${name}.`,
    `${heading('Your signed waiver')}
    ${p(esc(thanks))}
    ${detailsBox('Participant details', detailRows(w.fields))}
    ${detailsBox('Signatures', signatureRows(w), ICE)}
    ${sectionTitle('The waiver you signed')}
    <div style="font-family:${FONT};font-size:14px;line-height:1.55;color:${TEXT};">
      <p style="margin:0 0 10px;font-weight:bold;color:${NAVY};">${esc(waiver.title)}</p>
      <p style="margin:0 0 10px;">${esc(waiver.intro)}</p>
      <ol style="margin:0 0 10px;padding-left:22px;">${waiver.items.map((item) => `<li style="margin:0 0 6px;">${paragraphHtml(item)}</li>`).join('')}</ol>
      <p style="margin:0 0 10px;"><strong style="color:${NAVY};">${esc(waiver.acknowledgement)}</strong></p>
      <p style="margin:0;"><strong style="color:${NAVY};">${esc(waiver.minorsHeading)}</strong><br>${paragraphHtml(waiver.minors)}</p>
    </div>
    ${p('Questions? Just reply to this email.', 'margin-top:20px;')}`,
    `You’re receiving this email because this address was entered on the facility waiver for ${PROGRAM} at ${SITE}.`,
  )
  const text = [
    thanks,
    '',
    'PARTICIPANT DETAILS',
    ...textRows(detailRows(w.fields)),
    '',
    'SIGNATURES',
    ...textRows(signatureRows(w)),
    '',
    'THE WAIVER YOU SIGNED',
    waiver.title,
    waiver.intro,
    ...waiver.items.map((item, i) => `${i + 1}. ${item.map((s) => (typeof s === 'string' ? s : s.b)).join('')}`),
    waiver.acknowledgement,
    waiver.minorsHeading,
    waiver.minors.map((s) => (typeof s === 'string' ? s : s.b)).join(''),
  ].join('\n')
  return { subject, html, text }
}
