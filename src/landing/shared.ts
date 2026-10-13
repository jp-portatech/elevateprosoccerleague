import { divisionIds, formatIsoDate } from '../config/derived'
import { league } from '../config/league'
import type { Locale, Localized } from '../i18n/locale'

const NUMBER_WORDS: Localized<string[]> = {
  en: ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'],
  es: ['Cero', 'Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis', 'Siete', 'Ocho', 'Nueve', 'Diez', 'Once', 'Doce'],
}

/** "Eight" / "Ocho" for 8; numerals above twelve. */
export const numberWord = (n: number, locale: Locale) => NUMBER_WORDS[locale][n] ?? String(n)

/** "U8 • U10 • U12 • U14" */
export const divisionsLine = divisionIds.join(' • ')

/** "U8, U10, U12 and U14" / "U8, U10, U12 y U14" */
export const divisionsSentence = (locale: Locale) =>
  `${divisionIds.slice(0, -1).join(', ')} ${locale === 'es' ? 'y' : 'and'} ${divisionIds[divisionIds.length - 1]}`

const start = league.season.startDate

/** "Sunday, October 25" / "domingo 25 de octubre" (no year on the landing pages) */
export const startWithWeekday = (locale: Locale) =>
  formatIsoDate(start, locale, { weekday: 'long', month: 'long', day: 'numeric' }).replace(locale === 'es' ? ',' : /$^/, '')

/** "October 25" / "25 de octubre" */
export const startMonthDay = (locale: Locale) => formatIsoDate(start, locale, { month: 'long', day: 'numeric' })
