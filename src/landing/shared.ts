import { divisionIds, formatIsoDate } from '../config/derived'
import { league } from '../config/league'

const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve']

/** "Eight" for 8, numerals above twelve. */
export const numberWord = (n: number) => NUMBER_WORDS[n] ?? String(n)

/** "U8 • U10 • U12 • U14" */
export const divisionsLine = divisionIds.join(' • ')

/** "Sunday, October 25" (no year on the landing pages) */
export const startWithWeekday = formatIsoDate(league.season.startDate, 'en', { weekday: 'long', month: 'long', day: 'numeric' })

/** "October 25" */
export const startMonthDay = formatIsoDate(league.season.startDate, 'en', { month: 'long', day: 'numeric' })
