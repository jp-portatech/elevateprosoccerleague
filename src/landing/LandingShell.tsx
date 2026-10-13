import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Icon } from '../components/Icon'
import { league } from '../config/league'
import { logo } from '../content/images'
import { StaticLocaleProvider } from '../i18n/LocaleProvider'
import { localized, type Locale } from '../i18n/locale'
import { InquiryContext, useInquiry, type InquiryApi } from './inquiryContext'
import { InquiryDialog } from './InquiryDialog'
import type { InquiryType } from './inquiryForms'
import { readUtm } from './submitInquiry'
import '../registration/registration.css'
import './landing.css'

const YEAR = new Date().getFullYear()

const COPY = localized({
  en: {
    skip: 'Skip to main content',
    legal: 'Photos are illustrative and don’t show actual league players or facilities. Privacy policy: elevateprosoccer.com/privacy',
  },
  es: {
    skip: 'Saltar al contenido principal',
    legal:
      'Las fotos son ilustrativas y no muestran jugadores ni instalaciones reales de la liga. Política de privacidad: elevateprosoccer.com/es/privacy',
  },
})

/**
 * Layout for the advertising landing pages: an unlinked logo, the page, and a minimal footer.
 * No site navigation and no links to other pages, so each page keeps to one action. Every CTA
 * on the page opens the same information-request dialog.
 */
export function LandingShell({
  locale,
  type,
  ctaLabel,
  audience,
  theme,
  children,
}: {
  locale: Locale
  type: InquiryType
  ctaLabel: string
  /** Small label beside the logo, e.g. "Individual players". */
  audience: string
  theme: 'light' | 'navy'
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [opener, setOpener] = useState<HTMLElement | null>(null)
  // Campaign tags from the arrival URL, sent with the request (never stored in the browser).
  const [utm] = useState(() => readUtm(window.location.search))

  const openDialog = useCallback((from: HTMLElement) => {
    setOpener(from)
    setOpen(true)
  }, [])
  const api = useMemo<InquiryApi>(() => ({ label: ctaLabel, open: openDialog }), [ctaLabel, openDialog])

  return (
    <StaticLocaleProvider locale={locale}>
      <InquiryContext.Provider value={api}>
        <div className={`lp lp--${theme}`}>
          <a className="skip-link" href="#main">
            {COPY[locale].skip}
          </a>
          <header className="lp-header">
            <div className="container lp-header__inner">
              <img
                className="lp-header__logo"
                src={logo.src}
                srcSet={logo.srcSet}
                sizes="(min-width: 768px) 56px, 44px"
                width={256}
                height={256}
                alt={logo.alt}
              />
              <p className="lp-header__audience">{audience}</p>
            </div>
          </header>

          <main id="main" tabIndex={-1}>
            {children}
          </main>

          <footer className="lp-footer">
            <div className="container lp-footer__inner">
              <img className="lp-footer__logo" src={logo.src} srcSet={logo.srcSet} sizes="40px" width={256} height={256} alt="" loading="lazy" />
              <p>
                © {YEAR} {league.name} · {league.venue.city}, {league.venue.region}
              </p>
              <p className="lp-footer__legal">{COPY[locale].legal}</p>
            </div>
          </footer>
        </div>
        <InquiryDialog type={type} open={open} opener={opener} onClose={() => setOpen(false)} utm={utm} />
      </InquiryContext.Provider>
    </StaticLocaleProvider>
  )
}

/** The page's call to action. All of them open the same dialog. */
export function InquiryButton({ className }: { className?: string }) {
  const { label, open } = useInquiry()
  return (
    <button
      type="button"
      className={['lp-btn', className].filter(Boolean).join(' ')}
      aria-haspopup="dialog"
      onClick={(event) => open(event.currentTarget)}
    >
      {label}
      <Icon name="arrow" className="lp-btn__arrow" />
    </button>
  )
}
