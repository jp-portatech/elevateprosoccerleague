import type { MouseEvent } from 'react'
import { useLocaleApi } from '../i18n/useLocale'
import { LOCALES, languageName, pagePath, type Locale } from '../i18n/locale'

/**
 * EN | ES switch. Each option is a real link to that language's address (works without
 * JavaScript, opens in a new tab with a modifier key); a plain click switches in place.
 */
export function LanguageToggle() {
  const { locale, page, setLocale } = useLocaleApi()

  const choose = (event: MouseEvent<HTMLAnchorElement>, next: Locale) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    setLocale(next)
  }

  return (
    <nav className="lang-toggle" aria-label={locale === 'es' ? 'Idioma' : 'Language'}>
      {LOCALES.map((option) => (
        <a
          key={option}
          className="lang-toggle__option"
          href={pagePath(page, option)}
          hrefLang={option}
          lang={option}
          aria-current={option === locale ? 'true' : undefined}
          onClick={(e) => choose(e, option)}
        >
          <span aria-hidden="true">{option.toUpperCase()}</span>
          <span className="visually-hidden">{languageName[option]}</span>
        </a>
      ))}
    </nav>
  )
}
