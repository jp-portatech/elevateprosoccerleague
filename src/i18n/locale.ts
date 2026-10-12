/**
 * Site languages. Shared by the browser and the Vercel functions (registration validation,
 * Stripe Checkout, emails), so nothing here may touch React or the DOM.
 *
 * English lives at /, Spanish at /es (see es.html and es/privacy.html).
 */

export type Locale = 'en' | 'es'

export const LOCALES: readonly Locale[] = ['en', 'es']

export const isLocale = (value: unknown): value is Locale => value === 'en' || value === 'es'

/** The same text in every language. */
export type Localized<T = string> = Record<Locale, T>

/**
 * Pairs English with Spanish. TypeScript infers the shape from `en` only, so a missing or
 * extra key in `es` is a type error.
 */
export function localized<T>(copy: { en: T; es: NoInfer<T> }): Localized<T> {
  return copy
}

/** Locale tags for Intl dates and currency ("25 de octubre de 2026", "$350"). */
export const intlLocale: Localized = { en: 'en-US', es: 'es-US' }

/** Name of each language, written in that language. */
export const languageName: Localized = { en: 'English', es: 'Español' }

export type Page = 'home' | 'privacy'

const PATHS: Record<Page, Localized> = {
  home: { en: '/', es: '/es' },
  privacy: { en: '/privacy', es: '/es/privacy' },
}

/** Site path for a page in a language, e.g. pagePath('privacy', 'es') → "/es/privacy". */
export const pagePath = (page: Page, locale: Locale) => PATHS[page][locale]

/** Language of a site path: /es and /es/… are Spanish, everything else English. */
export const localeFromPath = (pathname: string): Locale => (/^\/es(\/|$)/.test(pathname) ? 'es' : 'en')
