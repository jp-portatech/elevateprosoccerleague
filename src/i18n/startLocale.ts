import { isLocale, localeFromPath, type Locale } from './locale'

const STORAGE_KEY = 'elevatepro:locale'

function savedLocale(): Locale | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return isLocale(value) ? value : null
  } catch {
    return null
  }
}

export function saveLocale(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Storage unavailable: the choice just isn't remembered for next time.
  }
}

/**
 * The language a page opens in (browser only). /es pages are always Spanish. English URLs open
 * in Spanish for visitors who chose Spanish before, so a family who switched once isn't sent back
 * to English by a shared link.
 */
export function startLocale(): Locale {
  return localeFromPath(window.location.pathname) === 'es' ? 'es' : (savedLocale() ?? 'en')
}
