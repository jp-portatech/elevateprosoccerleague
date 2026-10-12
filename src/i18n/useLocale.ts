import { createContext, useContext } from 'react'
import type { Locale, Page } from './locale'

export interface LocaleApi {
  locale: Locale
  page: Page
  setLocale: (next: Locale) => void
}

export const LocaleContext = createContext<LocaleApi | null>(null)

export function useLocaleApi(): LocaleApi {
  const api = useContext(LocaleContext)
  if (!api) throw new Error('useLocale must be used inside <LocaleProvider>')
  return api
}

/** The visitor's current language. */
export const useLocale = (): Locale => useLocaleApi().locale
