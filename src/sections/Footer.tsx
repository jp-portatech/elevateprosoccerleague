import { PartnerLogo } from '../components/PartnerLogo'
import { capitalize, divisionRange, gameDays, telHref, venueAddress, venueLocation } from '../config/derived'
import { league } from '../config/league'
import { logo } from '../content/images'
import { navLinks } from '../content/navigation'
import { useLocale } from '../i18n/useLocale'
import { localized, pagePath } from '../i18n/locale'
import './Footer.css'

const COPYRIGHT_YEAR = new Date().getFullYear()

const COPY = localized({
  en: {
    tagline: 'Youth indoor soccer',
    nav: 'Footer',
    explore: 'Explore',
    registration: 'Registration',
    contact: 'Contact',
    newTab: ' (opens in a new tab)',
    comingSoon: 'coming soon',
    privacy: 'Privacy policy',
    photos: 'Photos on this site are illustrative and do not show actual league players, awards or facilities.',
    top: 'Back to top',
  },
  es: {
    tagline: 'Fútbol juvenil indoor',
    nav: 'Pie de página',
    explore: 'Explorar',
    registration: 'Inscripción',
    contact: 'Contacto',
    newTab: ' (se abre en una pestaña nueva)',
    comingSoon: 'próximamente',
    privacy: 'Política de privacidad',
    photos: 'Las fotos de este sitio son ilustrativas y no muestran jugadores, premios ni instalaciones reales de la liga.',
    top: 'Volver arriba',
  },
})

/** `home` prefixes the section links, so pages other than the homepage pass the homepage path. */
export function Footer({ home = '' }: { home?: string }) {
  const locale = useLocale()
  const t = COPY[locale]
  const { email, phones } = league.contact
  const hasContact = Boolean(email || phones.length || league.social.length)

  return (
    <footer className="site-footer section--navy on-dark">
      <div className="container">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <img
              className="site-footer__logo"
              src={logo.src}
              srcSet={logo.srcSet}
              sizes="88px"
              width={256}
              height={256}
              alt={logo.alt}
              loading="lazy"
            />
            <div>
              <p className="site-footer__name">{league.name}</p>
              <p className="site-footer__tagline">
                {t.tagline} · {divisionRange} · {capitalize(gameDays[locale])}
                <br />
                {league.venue.name}, {venueAddress ?? venueLocation}
              </p>
              {league.venue.partnerLabel && (
                <a className="site-footer__partner" href={`${home}#venue`}>
                  <PartnerLogo className="site-footer__partner-logo" sizes="39px" lazy />
                  <span>
                    <span className="site-footer__partner-label">{league.venue.partnerLabel[locale]}</span>{' '}
                    <span className="site-footer__partner-name">{league.venue.name}</span>
                  </span>
                </a>
              )}
            </div>
          </div>

          <nav className="site-footer__nav" aria-label={t.nav}>
            <p className="site-footer__heading">{t.explore}</p>
            <ul>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={home + link.href}>{link.label[locale]}</a>
                </li>
              ))}
              <li>
                <a href={`${home}#register`}>{t.registration}</a>
              </li>
            </ul>
          </nav>

          {/* Only rendered once contact details or social links are set in src/config/league.ts */}
          {hasContact && (
            <div className="site-footer__contact">
              <p className="site-footer__heading">{t.contact}</p>
              <ul>
                {email && (
                  <li>
                    <a href={`mailto:${email}`}>{email}</a>
                  </li>
                )}
                {phones.map((phone) => (
                  <li key={phone}>
                    <a href={telHref(phone)}>{phone}</a>
                  </li>
                ))}
                {league.social.map((s) => (
                  <li key={s.label}>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.handle ? `${s.label} ${s.handle}` : s.label}
                        <span className="visually-hidden">{t.newTab}</span>
                      </a>
                    ) : (
                      <span className="site-footer__pending">
                        {s.label} <small>{t.comingSoon}</small>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="site-footer__bottom">
          <p>
            © {COPYRIGHT_YEAR} {league.name}
            <span aria-hidden="true"> · </span>
            <a href={pagePath('privacy', locale)} className="site-footer__legal">
              {t.privacy}
            </a>
          </p>
          <p>{t.photos}</p>
          <a href="#top" className="site-footer__top-link">
            {t.top}
          </a>
        </div>
      </div>
    </footer>
  )
}
