import { useEffect, useRef, useState } from 'react'
import { logo } from '../content/images'
import { navLinks } from '../content/navigation'
import { RegisterButton } from './RegisterButton'
import { RegisterMenu } from './RegisterMenu'
import './Header.css'

const DESKTOP_NAV = '(min-width: 1024px)'

export function Header() {
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

        <nav className="primary-nav" aria-label="Main">
          <ul>
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

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
          <span className="menu-toggle__label">Menu</span>
        </button>
      </div>

      <div className="mobile-menu" id="mobile-menu" hidden={!menuOpen}>
        <div className="container">
          <nav aria-label="Main">
            <ul className="mobile-menu__links">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} onClick={closeMenu}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mobile-menu__actions">
            <p className="eyebrow">Register</p>
            <RegisterButton kind="team" onBeforeOpen={closeMenuForDialog} />
            <RegisterButton kind="player" onBeforeOpen={closeMenuForDialog} />
          </div>
        </div>
      </div>
    </header>
  )
}
