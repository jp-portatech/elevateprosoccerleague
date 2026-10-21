// Winter training survey (/winter-survey): every question, its options and its rules. Shared by
// the page and server/winterSurvey.ts (which re-validates every response), so imports use `.js`
// extensions and nothing here may touch React or the DOM. Edit wording and options here.
import type { Localized } from '../i18n/locale.js'
import { phoneField, todayIso, validateField, type FieldDef, type FormErrors } from '../registration/forms.js'

/** The page is English only; FieldDef carries both languages, so the Spanish slot repeats it. */
const en = (text: string): Localized => ({ en: text, es: text })

export interface Option {
  value: string
  label: string
}

/** A single-choice (radio buttons) or multiple-choice (checkboxes) question. */
export interface ChoiceQuestion {
  kind: 'choice'
  name: string
  label: string
  /** Column heading in the admin dashboard and the CSV. Defaults to the label. */
  short?: string
  hint?: string
  required: boolean
  requiredMessage?: string
  multiple: boolean
  options: Option[]
  /** Multiple choice: the most answers allowed. */
  maxChoices?: number
  /** Short options (days of the week) laid out side by side. */
  compact?: boolean
}

/** A typed answer, shown with the site's FormField. */
export interface InputQuestion {
  kind: 'input'
  field: FieldDef
  short?: string
  /** Asked only when another question has this answer, e.g. "Other". */
  showWhen?: { name: string; value: string }
}

export type Question = ChoiceQuestion | InputQuestion

export interface SurveySection {
  id: string
  title: string
  questions: Question[]
}

/** Answers by question name. Multiple-choice answers are arrays of option values. */
export type SurveyValues = Record<string, string | string[]>

// ---------- options ----------

const options = (...pairs: Array<[value: string, label: string]>): Option[] =>
  pairs.map(([value, label]) => ({ value, label }))

const WEEKDAYS = options(['mon', 'Mon'], ['tue', 'Tue'], ['wed', 'Wed'], ['thu', 'Thu'], ['fri', 'Fri'])
const WEEK = [...WEEKDAYS, ...options(['sat', 'Sat'], ['sun', 'Sun'])]
const YES_MAYBE_NO = options(['yes', 'Yes'], ['maybe', 'Maybe'], ['no', 'No'])

const text = (name: string, label: string, required: boolean, extra: Partial<FieldDef> = {}): FieldDef => ({
  name,
  label: en(label),
  type: 'text',
  required,
  maxLength: 120,
  ...extra,
})

const longText = (name: string, label: string): FieldDef => ({
  name,
  label: en(label),
  type: 'textarea',
  required: false,
  maxLength: 1000,
})

// ---------- questions ----------

export const SURVEY_SECTIONS: SurveySection[] = [
  {
    id: 'basics',
    title: 'Player basics',
    questions: [
      {
        kind: 'input',
        short: 'Player',
        field: text('playerName', 'Player’s full name', true, {
          requiredMessage: en('Enter the player’s full name.'),
          maxLength: 100,
        }),
      },
      {
        kind: 'input',
        short: 'Parent/guardian',
        field: text('parentName', 'Parent/guardian name', true, {
          requiredMessage: en('Enter the parent or guardian’s name.'),
          autoComplete: 'name',
          maxLength: 100,
        }),
      },
      {
        kind: 'input',
        short: 'Phone',
        field: { ...phoneField, name: 'parentPhone', label: en('Parent/guardian phone') },
      },
      {
        kind: 'input',
        short: 'Email',
        field: {
          name: 'parentEmail',
          label: en('Parent/guardian email'),
          type: 'email',
          required: true,
          requiredMessage: en('Enter an email address.'),
          hint: en('We’ll email you a copy of your answers.'),
          autoComplete: 'email',
          maxLength: 254,
          half: true,
        },
      },
      {
        kind: 'input',
        short: 'Date of birth',
        field: {
          name: 'dateOfBirth',
          label: en('Player’s date of birth'),
          type: 'date',
          required: true,
          requiredMessage: en('Enter the player’s date of birth.'),
        },
      },
      {
        kind: 'choice',
        name: 'primaryPosition',
        label: 'Primary position',
        required: true,
        requiredMessage: 'Choose a primary position.',
        multiple: false,
        options: options(
          ['goalkeeper', 'Goalkeeper'],
          ['defender', 'Defender'],
          ['midfielder', 'Midfielder'],
          ['forward', 'Forward'],
          ['unsure', 'Not sure yet'],
        ),
      },
      { kind: 'input', short: 'Secondary position', field: text('secondaryPosition', 'Secondary position', false) },
      {
        kind: 'choice',
        name: 'dominantFoot',
        label: 'Dominant foot',
        required: false,
        multiple: false,
        compact: true,
        options: options(['right', 'Right'], ['left', 'Left'], ['both', 'Both']),
      },
      {
        kind: 'input',
        short: 'Years playing',
        field: {
          name: 'yearsPlaying',
          label: en('Years playing organized soccer'),
          type: 'number',
          required: false,
          min: 0,
          max: 15,
        },
      },
    ],
  },
  {
    id: 'club',
    title: 'Club team commitments',
    questions: [
      {
        kind: 'input',
        short: 'Club and team',
        field: text('clubTeam', 'Club name and team name', false, { hint: en('Leave blank if not on a team') }),
      },
      {
        kind: 'choice',
        name: 'teamLevel',
        label: 'Team level',
        required: false,
        multiple: false,
        options: options(
          ['rec', 'Rec'],
          ['competitive', 'Competitive'],
          ['premier', 'Premier'],
          ['elite', 'ECNL, MLS Next or similar'],
          ['school', 'School'],
          ['other', 'Other'],
          ['none', 'Not on a team'],
        ),
      },
      {
        kind: 'choice',
        name: 'teamPracticeDays',
        label: 'Which days does the team practice this winter?',
        short: 'Team practice days',
        hint: 'Choose all that apply.',
        required: false,
        multiple: true,
        compact: true,
        options: WEEK,
      },
      {
        kind: 'input',
        short: 'Other sports',
        field: longText(
          'otherSports',
          'Does your player play any other sports this winter? If so, which sport and which days?',
        ),
      },
    ],
  },
  {
    id: 'availability',
    title: 'Elevate Pro availability',
    questions: [
      {
        kind: 'choice',
        name: 'availableNights',
        label: 'Which nights can your player attend?',
        short: 'Available nights',
        hint: 'Sessions run 8–10 pm. Choose every night that works.',
        required: true,
        requiredMessage: 'Choose at least one night your player can attend.',
        multiple: true,
        compact: true,
        options: WEEKDAYS,
      },
      {
        kind: 'choice',
        name: 'preferredTime',
        label: 'Which time works best?',
        short: 'Best time',
        required: true,
        requiredMessage: 'Choose the time that works best.',
        multiple: false,
        compact: true,
        // "Neither" flags players the 8–10 pm slots don't work for.
        options: options(['8-9pm', '8–9 pm'], ['9-10pm', '9–10 pm'], ['either', 'Either'], ['neither', 'Neither']),
      },
      {
        kind: 'choice',
        name: 'sessionsPerWeek',
        label: 'How many sessions per week would you like?',
        short: 'Sessions per week',
        required: true,
        requiredMessage: 'Choose how many sessions per week you’d like.',
        multiple: false,
        compact: true,
        options: options(['1', '1'], ['2', '2'], ['3', '3'], ['4+', '4+']),
      },
      {
        kind: 'choice',
        name: 'fridayOpenPlay',
        label: 'Interested in Friday open play?',
        short: 'Friday open play',
        required: false,
        multiple: false,
        compact: true,
        options: YES_MAYBE_NO,
      },
      {
        kind: 'choice',
        name: 'privateLessons',
        label: 'Interested in private or semi-private lessons?',
        short: 'Private lessons',
        required: false,
        multiple: false,
        compact: true,
        options: YES_MAYBE_NO,
      },
      {
        kind: 'input',
        short: 'Away',
        field: longText('awayWeeks', 'Any weeks your player will be away (holidays, travel)?'),
      },
    ],
  },
  {
    id: 'goals',
    title: 'Goals and focus areas',
    questions: [
      {
        kind: 'choice',
        name: 'mainGoal',
        label: 'Main goal this winter',
        short: 'Main goal',
        required: true,
        requiredMessage: 'Choose the main goal for this winter.',
        multiple: false,
        options: options(
          ['fun', 'Have fun and stay active'],
          ['skills', 'Improve skills'],
          ['higher-team', 'Make a higher-level team'],
          ['tryouts', 'Prepare for tryouts'],
          ['other', 'Other'],
        ),
      },
      {
        kind: 'input',
        short: 'Other goal',
        showWhen: { name: 'mainGoal', value: 'other' },
        field: text('mainGoalOther', 'What’s the goal?', true, { requiredMessage: en('Tell us the main goal.') }),
      },
      {
        kind: 'choice',
        name: 'focusAreas',
        label: 'Pick up to 3 areas to work on',
        short: 'Focus areas',
        required: false,
        multiple: true,
        maxChoices: 3,
        options: options(
          ['ball-control', 'Ball control'],
          ['dribbling', 'Dribbling and 1v1'],
          ['passing', 'Passing'],
          ['shooting', 'Shooting and finishing'],
          ['weak-foot', 'Weak foot'],
          ['speed', 'Speed and agility'],
          ['strength', 'Strength'],
          ['defending', 'Defending'],
          ['goalkeeping', 'Goalkeeping'],
          ['confidence', 'Confidence'],
        ),
      },
      {
        kind: 'input',
        short: 'Club coach says',
        field: longText('coachFeedback', 'What does your club coach say your player needs to improve?'),
      },
      {
        kind: 'input',
        short: 'From the player',
        field: longText(
          'playerVoice',
          'For the player: what’s your favorite thing about soccer, and what do you want to get better at?',
        ),
      },
      {
        kind: 'choice',
        name: 'trainingPreference',
        label: 'How does your player prefer to train?',
        short: 'Prefers to train',
        required: false,
        multiple: false,
        options: options(
          ['own-age', 'With players their own age'],
          ['older', 'With older or stronger players'],
          ['any', 'Doesn’t matter'],
        ),
      },
    ],
  },
]

// ---------- helpers ----------

export const SURVEY_QUESTIONS: Question[] = SURVEY_SECTIONS.flatMap((s) => s.questions)

export const questionName = (q: Question) => (q.kind === 'input' ? q.field.name : q.name)
export const questionLabel = (q: Question) => (q.kind === 'input' ? q.field.label.en : q.label)
export const questionShort = (q: Question) => q.short ?? questionLabel(q)

/** Whether a question is asked, given the answers so far ("Other" follow-ups). */
export const isAsked = (q: Question, values: SurveyValues) =>
  q.kind === 'choice' || !q.showWhen || values[q.showWhen.name] === q.showWhen.value

export function emptySurvey(): SurveyValues {
  return Object.fromEntries(SURVEY_QUESTIONS.map((q) => [questionName(q), q.kind === 'choice' && q.multiple ? [] : '']))
}

const asList = (value: string | string[] | undefined) => (Array.isArray(value) ? value : value ? [value] : [])

/**
 * Keeps only this survey's questions, as trimmed text or as known option values (in the
 * order they're listed). Anything else in `raw` is dropped.
 */
export function cleanSurvey(raw: unknown): SurveyValues {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const values = emptySurvey()
  for (const q of SURVEY_QUESTIONS) {
    const name = questionName(q)
    const value = source[name]
    if (q.kind === 'input') {
      values[name] = typeof value === 'string' ? value.trim() : ''
    } else if (q.multiple) {
      const picked = Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
      values[name] = q.options.filter((o) => picked.includes(o.value)).map((o) => o.value)
    } else {
      values[name] = typeof value === 'string' ? value : ''
    }
  }
  // An "Other" answer only counts while "Other" is chosen.
  for (const q of SURVEY_QUESTIONS) if (!isAsked(q, values)) values[questionName(q)] = ''
  return values
}

/** The date `years` ago today, as YYYY-MM-DD. */
function yearsAgo(years: number): string {
  const today = todayIso()
  return `${Number(today.slice(0, 4)) - years}${today.slice(4)}`
}

/** Same rules in the browser and on the server. Messages are keyed by question name. */
export function validateSurvey(values: SurveyValues): FormErrors {
  const errors: FormErrors = {}
  for (const q of SURVEY_QUESTIONS) {
    if (!isAsked(q, values)) continue
    const name = questionName(q)
    if (q.kind === 'input') {
      const value = values[name]
      const message = validateField(q.field, typeof value === 'string' ? value : '', 'en')
      if (message) errors[name] = message
      continue
    }
    const picked = asList(values[name])
    if (picked.some((v) => !q.options.some((o) => o.value === v)) || (!q.multiple && picked.length > 1)) {
      errors[name] = `Choose from the options for “${q.label}”.`
    } else if (q.required && picked.length === 0) {
      errors[name] = q.requiredMessage ?? `Answer “${q.label}”.`
    } else if (q.maxChoices && picked.length > q.maxChoices) {
      errors[name] = `Pick up to ${q.maxChoices}.`
    }
  }
  // Catches a parent's own birth date or a typo in the year.
  const dob = values.dateOfBirth
  if (!errors.dateOfBirth && typeof dob === 'string' && (dob < yearsAgo(25) || dob > yearsAgo(3))) {
    errors.dateOfBirth = 'Check the player’s date of birth.'
  }
  return errors
}

/** The label of one option, e.g. optionLabel('teamLevel', 'elite') → "ECNL, MLS Next or similar". */
export function optionLabel(name: string, value: string): string {
  const q = SURVEY_QUESTIONS.find((x) => x.kind === 'choice' && x.name === name) as ChoiceQuestion | undefined
  return q?.options.find((o) => o.value === value)?.label ?? value
}

/** A readable answer: option labels joined with commas, typed text as is, '' when unanswered. */
export function answerText(q: Question, values: SurveyValues): string {
  const value = values[questionName(q)]
  if (q.kind === 'input') return typeof value === 'string' ? value : ''
  return asList(value)
    .map((v) => optionLabel(q.name, v))
    .join(', ')
}

/** Every question that was asked, with its answer, grouped by section. */
export function surveyAnswers(values: SurveyValues) {
  return SURVEY_SECTIONS.map((section) => ({
    title: section.title,
    rows: section.questions
      .filter((q) => isAsked(q, values))
      .map((q) => ({ question: q, label: questionLabel(q), answer: answerText(q, values) })),
  }))
}
