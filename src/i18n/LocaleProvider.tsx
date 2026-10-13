import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { league } from '../config/league'
import { isLocale, localeFromPath, pagePath, type Locale, type Page } from './locale'
import { PAGE_META } from './pageMeta'
import { LocaleContext, type LocaleApi } from './useLocale'

const STORAGE_KEY = 'elevatepro:locale'

function savedLocale(): Locale | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return isLocale(value) ? value : null
  } catch {
    return null
  }
}

function saveLocale(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Storage unavailable: the choice just isn't remembered for next time.
  }
}

/**
 * /es pages are always Spanish. English URLs open in Spanish for visitors who chose
 * Spanish before, so a family who switched once isn't sent back to English by a shared link.
 */
function initialLocale(): Locale {
  const fromPath = localeFromPath(window.location.pathname)
  return fromPath === 'es' ? 'es' : (savedLocale() ?? 'en')
}

/**
 * Current language for a page. Switching re-renders in place (no reload, scroll and form
 * state kept), updates <html lang>, the title and description, and swaps the URL between
 * the English and Spanish address so a refresh or a shared link keeps the language.
 */
export function LocaleProvider({ page, children }: { page: Page; children: ReactNode }) {
  const [locale, setLocaleState] = useState(initialLocale)

  useEffect(() => {
    const meta = PAGE_META[page][locale]
    const path = pagePath(page, locale)
    document.documentElement.lang = locale
    document.title = meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', `${league.siteUrl}${path}`)
    if (window.location.pathname !== path) {
      history.replaceState(history.state, '', path + window.location.search + window.location.hash)
    }
  }, [locale, page])

  const api = useMemo<LocaleApi>(
    () => ({
      locale,
      page,
      setLocale: (next) => {
        saveLocale(next)
        setLocaleState(next)
      },
    }),
    [locale, page],
  )

  return <LocaleContext.Provider value={api}>{children}</LocaleContext.Provider>
}

/**
 * A fixed language for pages that don't switch languages (the landing pages). Unlike
 * LocaleProvider it never changes the URL, title or saved preference.
 */
export function StaticLocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const api = useMemo<LocaleApi>(() => ({ locale, page: 'home', setLocale: () => {} }), [locale])
  return <LocaleContext.Provider value={api}>{children}</LocaleContext.Provider>
}
