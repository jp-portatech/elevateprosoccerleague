import { useState } from 'react'
import { answerText, optionLabel, questionShort, SURVEY_QUESTIONS, surveyAnswers } from '../winter-survey/surveyForm'
import { downloadCsv, shortDate } from './format'
import { ageOn, type AdminData, type AdminSurveyResponse } from './model'

const age = (r: AdminSurveyResponse) => ageOn(r.dateOfBirth)
const listOf = (value: string | string[] | undefined, name: string) =>
  (Array.isArray(value) ? value : value ? [value] : []).map((v) => optionLabel(name, v)).join(', ')

/** Winter training survey responses (/winter-survey), newest first. */
export function WinterSurveyView({ data }: { data: AdminData }) {
  const [open, setOpen] = useState<string | null>(null)
  const responses = data.surveys

  // One row per response, one column per question, in survey order.
  const exportCsv = () =>
    downloadCsv('elevate-pro-winter-survey.csv', [
      ['Received', 'Age', ...SURVEY_QUESTIONS.map(questionShort)],
      ...responses.map((r) => [shortDate(r.createdAt), age(r), ...SURVEY_QUESTIONS.map((q) => answerText(q, r.answers))]),
    ])

  return (
    <section className="admin-card">
      <div className="admin-card__head">
        <h2 className="admin-h2">Winter survey ({responses.length})</h2>
        <button type="button" className="admin-btn admin-btn--ghost" onClick={exportCsv} disabled={!responses.length}>
          Download CSV
        </button>
      </div>
      <p className="admin-muted">
        Answers from the unlisted winter training survey at <strong>/winter-survey</strong>, one per player. Open a row
        to see every answer.
      </p>

      {responses.length === 0 ? (
        <p className="admin-muted">No responses yet.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Player</th>
                <th scope="col">Age</th>
                <th scope="col">Team level</th>
                <th scope="col">Available nights</th>
                <th scope="col">Sessions per week</th>
                <th scope="col">Received</th>
                <th scope="col">
                  <span className="visually-hidden">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <SurveyRow key={r.id} response={r} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function SurveyRow({ response: r, open, onToggle }: { response: AdminSurveyResponse; open: boolean; onToggle: () => void }) {
  return (
    <>
      <tr>
        <th scope="row">{r.playerName}</th>
        <td>{age(r) ?? '—'}</td>
        <td>{listOf(r.answers.teamLevel, 'teamLevel') || '—'}</td>
        <td>{listOf(r.answers.availableNights, 'availableNights') || '—'}</td>
        <td>{listOf(r.answers.sessionsPerWeek, 'sessionsPerWeek') || '—'}</td>
        <td>{shortDate(r.createdAt)}</td>
        <td>
          <button type="button" className="admin-link" aria-expanded={open} onClick={onToggle}>
            {open ? 'Close' : 'Details'}
            <span className="visually-hidden"> for {r.playerName}</span>
          </button>
        </td>
      </tr>
      {open && (
        <tr className="admin-row-details">
          <td colSpan={7}>
            <div className="admin-details">
              <p>
                <strong>{r.parentName}</strong> ·{' '}
                <a className="admin-phone" href={`tel:${r.parentPhone.replace(/[^\d+]/g, '')}`}>
                  {r.parentPhone}
                </a>{' '}
                ·{' '}
                <a className="admin-email" href={`mailto:${r.parentEmail}`}>
                  {r.parentEmail}
                </a>
              </p>
              {surveyAnswers(r.answers).map((section) => (
                <div key={section.title}>
                  <h3 className="admin-answers__title">{section.title}</h3>
                  <dl className="admin-answers">
                    {section.rows.map((row) => (
                      <div key={row.label}>
                        <dt>{row.label}</dt>
                        <dd>{row.answer || <span className="admin-muted">—</span>}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
