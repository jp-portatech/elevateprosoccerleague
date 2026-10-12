import '../components/Header.css'
import { Icon } from '../components/Icon'
import { league } from '../config/league'
import { logo } from '../content/images'
import { ContactLine } from '../registration/ContactLine'
import { Footer } from '../sections/Footer'
import './PrivacyPage.css'

/** Change this whenever the policy below changes. */
const LAST_UPDATED = { iso: '2026-10-12', label: 'October 12, 2026' }

const atAGlance = [
  'We collect only what we need to register you and run the league.',
  'Card details go straight to Stripe. We never see your full card number.',
  'This website doesn’t use cookies, analytics or advertising trackers.',
  'We don’t sell your information or use it for advertising.',
  'You can ask us to see, correct or delete your details at any time.',
]

/**
 * Plain-language privacy policy at /privacy (privacy.html). It describes what the site
 * actually does — the registration fields in src/registration/forms.ts, Stripe Checkout,
 * Resend emails, the league inbox and the checkout draft in sessionStorage — so update it
 * whenever any of those change.
 */
export function PrivacyPage() {
  const { shortName } = league

  return (
    <div id="top">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <header className="site-header">
        <div className="container site-header__inner">
          <a className="brand" href="/">
            <img
              className="brand__logo"
              src={logo.src}
              srcSet={logo.srcSet}
              sizes="(min-width: 1024px) 60px, 48px"
              width={256}
              height={256}
              alt={`${logo.alt} home`}
            />
            <span className="brand__text" aria-hidden="true">
              ElevatePro
              <span className="brand__sub">Soccer League</span>
            </span>
          </a>
          <a className="btn btn--secondary btn--sm" href="/">
            Back to home
          </a>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <div className="privacy-hero section--pale">
          <div className="container privacy__container">
            <p className="eyebrow">{league.name}</p>
            <h1 className="h2">Privacy policy</h1>
            <p className="privacy-hero__updated">
              Last updated <time dateTime={LAST_UPDATED.iso}>{LAST_UPDATED.label}</time>
            </p>
            <p className="lede">
              This page explains what information {shortName} collects when you register a team or player on this
              website, how we use it, and who helps us handle it.
            </p>
          </div>
        </div>

        <div className="privacy-body">
          <div className="container privacy__container">
            <section className="privacy-summary" aria-labelledby="privacy-summary-title">
              <h2 className="privacy-summary__title" id="privacy-summary-title">
                At a glance
              </h2>
              <ul className="checklist">
                {atAGlance.map((point) => (
                  <li key={point}>
                    <Icon name="check" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="privacy-section" aria-labelledby="collect">
              <h2 id="collect">Information we collect</h2>
              <p>We ask only for what we need to register players and teams and run the season.</p>
              <ul>
                <li>
                  <strong>Team registrations:</strong> the division, team name, the coach or manager’s name, email
                  address and phone number and, if you add them, a club or academy name and roster information such as
                  player names.
                </li>
                <li>
                  <strong>Player registrations:</strong> the division, the player’s name and date of birth, a parent
                  or guardian’s name and email address, a phone number and, if you choose, the player’s experience
                  level.
                </li>
                <li>
                  <strong>Payments:</strong> you pay on Stripe’s secure checkout page, and your card details go
                  directly to Stripe. We see that you paid, the amount, the name and email address entered at checkout,
                  and limited card details such as the card type and last four digits — never the full card number.
                </li>
                <li>
                  <strong>When you contact us:</strong> anything you choose to share by email or phone.
                </li>
              </ul>
            </section>

            <section className="privacy-section" aria-labelledby="use">
              <h2 id="use">How we use it</h2>
              <ul>
                <li>To confirm each player is eligible for their division.</li>
                <li>To place individually registered players on teams and organize divisions and schedules.</li>
                <li>To process registration fees and keep financial records.</li>
                <li>To send your registration confirmation, schedule and season information, and other messages about the league.</li>
                <li>To answer your questions.</li>
              </ul>
              <p>We don’t sell your information, and we don’t use it for advertising.</p>
            </section>

            <section className="privacy-section" aria-labelledby="share">
              <h2 id="share">Who we share it with</h2>
              <p>
                We share registration information only with the services that help us run registration, and only what
                each one needs:
              </p>
              <ul>
                <li>
                  <strong>Stripe</strong> processes payments and stores the registration details attached to each
                  payment.
                </li>
                <li>
                  <strong>Resend</strong> delivers our registration confirmation emails.
                </li>
                <li>
                  <strong>Vercel</strong> hosts this website and the registration form.
                </li>
                <li>
                  <strong>Google</strong> provides the league’s Gmail inbox, which receives a copy of each
                  registration.
                </li>
              </ul>
              <p>
                Each follows its own privacy policy and security practices. When we place a player on a team, we may
                share the player’s name and a parent or guardian’s contact details with that team’s coach so they can
                reach you about games. We may also share information when the law requires it.
              </p>
            </section>

            <section className="privacy-section" aria-labelledby="children">
              <h2 id="children">Children’s information</h2>
              <p>
                Our players are children, so registrations are completed by a parent or guardian, or by a team’s coach
                or manager. We ask for a player’s date of birth only to confirm their division. We don’t knowingly
                collect information directly from children under 13. If you think a child has sent us information,
                contact us and we’ll delete it.
              </p>
            </section>

            <section className="privacy-section" aria-labelledby="cookies">
              <h2 id="cookies">Cookies and tracking</h2>
              <p>This website doesn’t use cookies, analytics, advertising trackers or social media pixels.</p>
              <p>
                When you continue to payment, your browser keeps a temporary copy of the registration form, so your
                details can be filled back in if you leave checkout without paying. That copy stays on your device, is
                deleted once your payment is confirmed, and is cleared when you close the browser tab.
              </p>
              <p>
                Our website host, Vercel, automatically records basic technical information, such as IP addresses and
                browser type, to keep the site running and secure. Stripe’s checkout page uses its own cookies to
                prevent fraud. Links to other websites, such as directions in Google Maps, are covered by those sites’
                own privacy policies.
              </p>
            </section>

            <section className="privacy-section" aria-labelledby="retention">
              <h2 id="retention">How long we keep it</h2>
              <p>
                We keep registration details for as long as we need them to run the season and keep accurate financial
                records. Stripe also keeps its own payment records, as financial regulations require.
              </p>
            </section>

            <section className="privacy-section" aria-labelledby="choices">
              <h2 id="choices">Your choices</h2>
              <p>
                You can ask us to see, correct or delete the information we hold about you or your child. We may need
                to keep some payment records for accounting and tax purposes, even after deleting the rest.
              </p>
            </section>

            <section className="privacy-section" aria-labelledby="security">
              <h2 id="security">Keeping it safe</h2>
              <p>
                This website uses an encrypted (HTTPS) connection, and card payments are handled entirely by Stripe, a
                PCI-certified payment provider. Registration records are kept in the league’s Stripe account and email
                inbox, which only league organizers can access. No system is perfectly secure, but we take reasonable
                care to protect your information.
              </p>
            </section>

            <section className="privacy-section" aria-labelledby="changes">
              <h2 id="changes">Changes to this policy</h2>
              <p>If we change how we handle your information, we’ll update this page and the date at the top.</p>
            </section>

            <section className="privacy-section privacy-contact" aria-labelledby="contact">
              <h2 id="contact">Contact us</h2>
              <ContactLine lead={`Questions, or want to see, correct or delete your details? Contact ${shortName}`} />
            </section>
          </div>
        </div>
      </main>

      <Footer home="/" />
    </div>
  )
}
