/**
 * Emails for the waiver page (server/waiver.ts), which signs two documents per player: the
 * facility's waiver and ElevatePro's player agreement.
 *   - buildWaiverNotification → the league inbox: who signed, the agreement's answers, and a link to
 *     print from the admin dashboard.
 *   - buildWaiverCopy         → the email on the form: their copy of both documents, word for word
 *     (the agreement asks signers to keep a copy).
 *
 * Wording comes from src/waiver/waiverForm.ts and agreementForm.ts. Signature drawings aren't
 * emailed (most email apps hide embedded images); the signed copies are printed from the dashboard.
 */
import { league } from '../../src/config/league.js'
import { ageOn } from '../../src/admin/model.js'
import { AGREEMENTS, type AgreementSection } from '../../src/waiver/agreementForm.js'
import { WAIVER_FIELDS, WAIVERS, type Paragraph, type Signature } from '../../src/waiver/waiverForm.js'
import type { AgreementRecord } from '../db.js'
import { button, detailsBox, esc, FONT, ICE, layout, NAVY, p, sectionTitle, SITE, TEXT, textRows, type RenderedEmail, type Rows } from './layout.js'

const PROGRAM = 'Elevate Pro Winter Training'

export interface SignedWaiver {
  id: string
  version: string
  fields: Record<string, string>
  participantSignature: Signature
  guardianSignature: Signature | null
  signedAt: Date
  /** ElevatePro's agreement, signed in the same submission. */
  agreement: AgreementRecord | null
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

const MEDIA: Record<string, string> = {
  yes: 'Yes — photos and video allowed (name needs separate permission)',
  no: 'No — declined',
  '': 'Left blank — no permission',
}

const agreementRows = (a: AgreementRecord): Rows => [
  ['Signed by', `${a.signerName} (${a.signerRole === 'guardian' ? 'parent or legal guardian' : 'adult player'})`],
  ['Contact phone', a.contactPhone],
  ['Emergency contact', a.emergencyContact],
  ['Emergency phone', a.emergencyPhone],
  ['Photo and video', MEDIA[a.mediaPermission]],
]

const paragraphHtml = (paragraph: Paragraph) =>
  paragraph.map((s) => (typeof s === 'string' ? esc(s) : `<strong style="color:${NAVY};">${esc(s.b)}</strong>`)).join('')
const paragraphText = (paragraph: Paragraph) => paragraph.map((s) => (typeof s === 'string' ? s : s.b)).join('')

const sectionsHtml = (sections: AgreementSection[]) =>
  sections
    .map(
      (s) => `<p style="margin:12px 0 6px;font-weight:bold;color:${NAVY};">${esc(s.heading)}</p>
      ${s.callout ? `<p style="margin:0 0 8px;padding:8px 10px;background:#e8f3fc;"><strong style="color:${NAVY};">${esc(s.callout)}</strong></p>` : ''}
      ${s.paragraphs.map((p) => `<p style="margin:0 0 8px;">${paragraphHtml(p)}</p>`).join('')}`,
    )
    .join('')
const sectionsText = (sections: AgreementSection[]) =>
  sections.flatMap((s) => ['', s.heading.toUpperCase(), ...(s.callout ? [s.callout] : []), ...s.paragraphs.map(paragraphText)])

// ---------- to the league inbox ----------

export function buildWaiverNotification(w: SignedWaiver): RenderedEmail {
  const name = w.fields.name
  const age = ageOn(w.fields.dob ?? '', w.signedAt)
  const both = Boolean(w.agreement)
  const subject = `${both ? 'Waivers' : 'Waiver'} signed: ${name}`
  const intro = both
    ? `The facility waiver and ElevatePro agreement for <strong>${esc(name)}</strong>${age !== null ? ` (age ${age})` : ''} were signed online. Open them in the admin dashboard to print the facility waiver for the owner and keep the agreement on file.`
    : `The facility waiver for <strong>${esc(name)}</strong>${age !== null ? ` (age ${age})` : ''} was signed online. Open it in the admin dashboard to print it or save it as a PDF.`
  const html = layout(
    'en',
    subject,
    `${name} · signed ${signedOn(w.signedAt)}`,
    `${heading(both ? 'Waivers signed' : 'Waiver signed')}
    ${p(intro)}
    ${detailsBox('Participant details', detailRows(w.fields))}
    ${detailsBox('Facility waiver signatures', signatureRows(w), ICE)}
    ${w.agreement ? detailsBox('ElevatePro agreement', agreementRows(w.agreement)) : ''}
    <p style="margin:16px 0 0;">${button(`${league.siteUrl}/admin#waivers`, 'Open waivers')}</p>`,
    `Sent to the ${league.shortName} inbox from the waiver page at ${SITE}/waiver.`,
  )
  const text = [
    subject,
    '',
    intro.replace(/<\/?strong>/g, ''),
    '',
    'PARTICIPANT DETAILS',
    ...textRows(detailRows(w.fields)),
    '',
    'FACILITY WAIVER SIGNATURES',
    ...textRows(signatureRows(w)),
    ...(w.agreement ? ['', 'ELEVATEPRO AGREEMENT', ...textRows(agreementRows(w.agreement))] : []),
    '',
    `Open waivers: ${league.siteUrl}/admin#waivers`,
  ].join('\n')
  return { subject, html, text }
}

// ---------- to the signer: their copy of both ----------

export function buildWaiverCopy(w: SignedWaiver): RenderedEmail {
  const waiver = WAIVERS[w.version]
  const a = w.agreement
  const agreement = a ? AGREEMENTS[a.version] : null
  const name = w.fields.name
  const subject = `Your signed waivers for ${name} | ${PROGRAM}`
  const thanks = `Thank you! We received the signed facility waiver${a ? ' and ElevatePro player agreement' : ''} for ${name}. Keep this email as your copy of what you signed.`

  const agreementHtml =
    a && agreement
      ? `${sectionTitle('ElevatePro player agreement')}
    ${detailsBox('Your answers', [...agreementRows(a), ['Your statement', agreement.page2.signature.roles[a.signerRole]], ['Signed', signedOn(w.signedAt)]], ICE)}
    <div style="font-family:${FONT};font-size:14px;line-height:1.55;color:${TEXT};">
      <p style="margin:0 0 4px;font-weight:bold;color:${NAVY};">${esc(agreement.brand)} · ${esc(agreement.page1.title)}</p>
      ${sectionsHtml(agreement.page1.sections)}
      <p style="margin:12px 0 6px;font-weight:bold;color:${NAVY};">${esc(agreement.page1.media.heading)}</p>
      <p style="margin:0 0 8px;">${esc(agreement.page1.media.yes)}</p>
      <p style="margin:0 0 8px;">${esc(agreement.page1.media.no)}</p>
      <p style="margin:16px 0 4px;font-weight:bold;color:${NAVY};">${esc(agreement.page2.title)}</p>
      ${sectionsHtml(agreement.page2.sections)}
      <p style="margin:12px 0 6px;font-weight:bold;color:${NAVY};">${esc(agreement.page2.signature.heading)}</p>
      <p style="margin:0 0 8px;">${esc(agreement.page2.signature.agreement)}</p>
    </div>`
      : ''

  const html = layout(
    'en',
    subject,
    `Your copy of what you signed for ${name}.`,
    `${heading('Your signed waivers')}
    ${p(esc(thanks))}
    ${detailsBox('Participant details', detailRows(w.fields))}
    ${sectionTitle('Facility waiver')}
    ${detailsBox('Signatures', signatureRows(w), ICE)}
    <div style="font-family:${FONT};font-size:14px;line-height:1.55;color:${TEXT};">
      <p style="margin:0 0 10px;font-weight:bold;color:${NAVY};">${esc(waiver.title)}</p>
      <p style="margin:0 0 10px;">${esc(waiver.intro)}</p>
      <ol style="margin:0 0 10px;padding-left:22px;">${waiver.items.map((item) => `<li style="margin:0 0 6px;">${paragraphHtml(item)}</li>`).join('')}</ol>
      <p style="margin:0 0 10px;"><strong style="color:${NAVY};">${esc(waiver.acknowledgement)}</strong></p>
      <p style="margin:0;"><strong style="color:${NAVY};">${esc(waiver.minorsHeading)}</strong><br>${paragraphHtml(waiver.minors)}</p>
    </div>
    ${agreementHtml}
    ${p('Questions? Just reply to this email.', 'margin-top:20px;')}`,
    `You’re receiving this email because this address was entered on the ${PROGRAM} waiver page at ${SITE}.`,
  )

  const text = [
    thanks,
    '',
    'PARTICIPANT DETAILS',
    ...textRows(detailRows(w.fields)),
    '',
    'FACILITY WAIVER',
    ...textRows(signatureRows(w)),
    '',
    waiver.title,
    waiver.intro,
    ...waiver.items.map((item, i) => `${i + 1}. ${paragraphText(item)}`),
    waiver.acknowledgement,
    waiver.minorsHeading,
    paragraphText(waiver.minors),
    ...(a && agreement
      ? [
          '',
          'ELEVATEPRO PLAYER AGREEMENT',
          ...textRows([...agreementRows(a), ['Your statement', agreement.page2.signature.roles[a.signerRole]], ['Signed', signedOn(w.signedAt)]]),
          ...sectionsText(agreement.page1.sections),
          '',
          agreement.page1.media.heading.toUpperCase(),
          agreement.page1.media.yes,
          agreement.page1.media.no,
          ...sectionsText(agreement.page2.sections),
          '',
          agreement.page2.signature.heading.toUpperCase(),
          agreement.page2.signature.agreement,
        ]
      : []),
  ].join('\n')

  return { subject, html, text }
}
