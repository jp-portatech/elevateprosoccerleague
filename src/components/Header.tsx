import { useEffect, useRef, useState } from 'react'
import { league } from '../config/league'
import { logo } from '../content/images'
import { navLinks } from '../content/navigation'
import { useLocale } from '../i18n/useLocale'
import { localized } from '../i18n/locale'
import { LanguageToggle } from './LanguageToggle'
import { PartnerLogo } from './PartnerLogo'
import { RegisterButton } from './RegisterButton'
import { RegisterMenu } from './RegisterMenu'
import './Header.css'

const DESKTOP_NAV = '(min-width: 1024px)'
const { venue } = league

const COPY = localized({
  en: { nav: 'Main', menu: 'Menu', register: 'Register' },
  es: { nav: 'Principal', menu: 'Menú', register: 'Inscripción' },
})

export function Header() {
  const locale = useLocale()
  const t = COPY[locale]
  const [menuOpen, setMenuOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        toggleRef.current?.focus()
      }
    }
    const desktop = window.matchMedia(DESKTOP_NAV)
    const onResize = () => desktop.matches && setMenuOpen(false)
    document.addEventListener('keydown', onKeyDown)
    desktop.addEventListener('change', onResize)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      desktop.removeEventListener('change', onResize)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)
  const closeMenuForDialog = () => {
    toggleRef.current?.focus()
    setMenuOpen(false)
  }

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <div className="site-header__brands">
          <a className="brand" href="#top">
            <img
              className="brand__logo"
              src={logo.src}
              srcSet={logo.srcSet}
              sizes="(min-width: 1024px) 60px, 48px"
              width={256}
              height={256}
              alt={logo.alt}
            />
            <span className="brand__text" aria-hidden="true">
              ElevatePro
              <span className="brand__sub">Soccer League</span>
            </span>
          </a>

          {venue.partnerLabel && (
            <a className="partner" href="#venue">
              <PartnerLogo className="partner__logo" sizes="(min-width: 1024px) 37px, 31px" />
              <span className="visually-hidden">
                {venue.partnerLabel[locale]}: {venue.name}
              </span>
            </a>
          )}
        </div>

        <nav className="primary-nav" aria-label={t.nav}>
          <ul>
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label[locale]}</a>
              </li>
            ))}
          </ul>
        </nav>

        <LanguageToggle />

        <RegisterMenu />

        <button
          ref={toggleRef}
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className="menu-toggle__bars" aria-hidden="true">
            <span />
          </span>
          <span className="menu-toggle__label">{t.menu}</span>
        </button>
      </div>

      <div className="mobile-menu" id="mobile-menu" hidden={!menuOpen}>
        <div className="container">
          <nav aria-label={t.nav}>
            <ul className="mobile-menu__links">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} onClick={closeMenu}>
                    {link.label[locale]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mobile-menu__actions">
            <p className="eyebrow">{t.register}</p>
            <RegisterButton kind="team" onBeforeOpen={closeMenuForDialog} />
            <RegisterButton kind="player" onBeforeOpen={closeMenuForDialog} />
          </div>
        </div>
      </div>
    </header>
  )
}
