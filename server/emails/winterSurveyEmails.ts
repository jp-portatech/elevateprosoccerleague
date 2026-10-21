/**
 * Emails for the winter training survey (server/winterSurvey.ts):
 *   - buildSurveyNotification  → the league inbox: every answer, grouped by section. Reply goes to the parent.
 *   - buildSurveyConfirmation  → the parent: a short thank-you with the availability they gave.
 *
 * Question wording comes from src/winter-survey/surveyForm.ts. Everything a parent typed is
 * HTML-escaped by the layout helpers.
 */
import { telHref } from '../../src/config/derived.js'
import { league } from '../../src/config/league.js'
import { ageOn } from '../../src/admin/model.js'
import { answerText, SURVEY_QUESTIONS, surveyAnswers, type SurveyValues } from '../../src/winter-survey/surveyForm.js'
import { button, detailsBox, esc, firstName, FONT, ICE, layout, NAVY, p, SITE, textRows, type RenderedEmail, type Rows } from './layout.js'

const PROGRAM = 'Elevate Pro Winter Training'

export interface SurveyResponse {
  answers: SurveyValues
  receivedAt: Date
}

const str = (answers: SurveyValues, name: string) => (typeof answers[name] === 'string' ? (answers[name] as string) : '')
const answer = (answers: SurveyValues, name: string) => {
  const q = SURVEY_QUESTIONS.find((x) => (x.kind === 'input' ? x.field.name : x.name) === name)
  return q ? answerText(q, answers) : ''
}

const receivedOn = (date: Date) =>
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

// ---------- to the league inbox ----------

export function buildSurveyNotification(response: SurveyResponse): RenderedEmail {
  const a = response.answers
  const player = str(a, 'playerName')
  const parent = str(a, 'parentName')
  const phone = str(a, 'parentPhone')
  const age = ageOn(str(a, 'dateOfBirth'), response.receivedAt)
  const subject = `Winter survey: ${player}`
  const intro = `<strong>${esc(parent)}</strong> completed the winter training survey for <strong>${esc(player)}</strong>${age !== null ? ` (age ${age})` : ''}. Reply to this email to reach them, or give them a call.`

  // Every question asked, with "—" for the optional ones left blank, so nothing looks missing.
  const sections = surveyAnswers(a).map((s) => ({
    title: s.title,
    rows: s.rows.map((r): [string, string] => [r.label, r.answer || '—']),
  }))
  const received: Rows = [['Received', receivedOn(response.receivedAt)]]

  const html = layout(
    'en',
    subject,
    `${player} · ${answer(a, 'availableNights')} · ${answer(a, 'sessionsPerWeek')} per week`,
    `${heading('Winter survey')}
    ${p(intro)}
    ${sections.map((s, i) => detailsBox(s.title, s.rows, i % 2 ? ICE : NAVY)).join('\n')}
    ${detailsBox('Received', received, ICE)}
    <p style="margin:16px 0 0;">${button(telHref(phone), `Call ${phone}`)}</p>`,
    `Sent to the ${league.shortName} inbox from the ${PROGRAM} survey at ${SITE}/winter-survey.`,
  )

  const text = [
    `Winter survey: ${player}`,
    '',
    intro.replace(/<\/?strong>/g, ''),
    ...sections.flatMap((s) => ['', s.title.toUpperCase(), ...textRows(s.rows)]),
    '',
    ...textRows(received),
  ].join('\n')

  return { subject, html, text }
}

// ---------- to the parent ----------

export function buildSurveyConfirmation(response: SurveyResponse): RenderedEmail {
  const a = response.answers
  const player = str(a, 'playerName')
  const subject = `Thanks for your winter survey | ${PROGRAM}`
  const greeting = `Hi ${firstName(str(a, 'parentName'))},`
  const thanks = `Thanks for completing the ${PROGRAM} survey for ${player}. We’ll send group placements and the winter schedule soon.`
  const rows: Rows = [
    ['Player', player],
    ['Nights', answer(a, 'availableNights')],
    ['Best time', answer(a, 'preferredTime')],
    ['Sessions per week', answer(a, 'sessionsPerWeek')],
  ]
  const change = 'Need to change something, or have another player? Just reply to this email.'

  const html = layout(
    'en',
    subject,
    'We got your answers. Group placements and the winter schedule are coming soon.',
    `${heading('Thanks for your survey!')}
    ${p(esc(greeting))}
    ${p(esc(thanks))}
    ${detailsBox('Your availability', rows)}
    ${p(esc(change), 'margin-top:16px;')}
    ${p(`See you on the field,<br><strong style="color:${NAVY};">${esc(PROGRAM)}</strong>`)}`,
    `You’re receiving this email because you completed the ${PROGRAM} survey at ${SITE}.`,
  )

  const text = [greeting, '', thanks, '', 'YOUR AVAILABILITY', ...textRows(rows), '', change, '', 'See you on the field,', PROGRAM].join(
    '\n',
  )

  return { subject, html, text }
}
