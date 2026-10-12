import { divisionRange, gameDays, telHref, venueAddress, venueLocation } from '../config/derived'
import { league } from '../config/league'
import { logo } from '../content/images'
import { navLinks, privacyPath } from '../content/navigation'
import './Footer.css'

const COPYRIGHT_YEAR = new Date().getFullYear()

/** `home` prefixes the section links, so pages other than the homepage pass "/". */
export function Footer({ home = '' }: { home?: string }) {
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
                Youth indoor soccer · {divisionRange} · {gameDays}
                <br />
                {league.venue.name}, {venueAddress ?? venueLocation}
              </p>
            </div>
          </div>

          <nav className="site-footer__nav" aria-label="Footer">
            <p className="site-footer__heading">Explore</p>
            <ul>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={home + link.href}>{link.label}</a>
                </li>
              ))}
              <li>
                <a href={`${home}#register`}>Registration</a>
              </li>
            </ul>
          </nav>

          {/* Only rendered once contact details or social links are set in src/config/league.ts */}
          {hasContact && (
            <div className="site-footer__contact">
              <p className="site-footer__heading">Contact</p>
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
                        <span className="visually-hidden"> (opens in a new tab)</span>
                      </a>
                    ) : (
                      <span className="site-footer__pending">
                        {s.label} <small>coming soon</small>
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
            <a href={privacyPath} className="site-footer__legal">
              Privacy policy
            </a>
          </p>
          <p>Photos on this site are illustrative and do not show actual league players, awards or facilities.</p>
          <a href="#top" className="site-footer__top-link">
            Back to top
          </a>
        </div>
      </div>
    </footer>
  )
}
