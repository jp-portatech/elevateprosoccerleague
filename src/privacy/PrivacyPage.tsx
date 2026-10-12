import type { ReactNode } from 'react'
import '../components/Header.css'
import { Icon } from '../components/Icon'
import { LanguageToggle } from '../components/LanguageToggle'
import { formatIsoDate } from '../config/derived'
import { league } from '../config/league'
import { logo } from '../content/images'
import { LocaleProvider } from '../i18n/LocaleProvider'
import { useLocale } from '../i18n/useLocale'
import { localized, pagePath } from '../i18n/locale'
import { ContactLine } from '../registration/ContactLine'
import { Footer } from '../sections/Footer'
import './PrivacyPage.css'

/** Change this whenever the policy below changes (in both languages). */
const LAST_UPDATED = '2026-10-12'

const { shortName } = league

interface PolicySection {
  id: string
  title: string
  body: ReactNode
}

/**
 * Plain-language privacy policy at /privacy and /es/privacy. It describes what the site
 * actually does — the registration fields in src/registration/forms.ts, Stripe Checkout,
 * Resend emails and contact list, the league inbox, the contact form (src/contact/leadForm.ts),
 * the checkout draft in sessionStorage and the remembered language in localStorage — so update it whenever any of those change.
 */
const COPY = localized<{
  skip: string
  home: string
  logoAlt: string
  title: string
  updated: string
  intro: string
  glanceTitle: string
  glance: string[]
  sections: PolicySection[]
  contactTitle: string
  contactLead: string
}>({
  en: {
    skip: 'Skip to main content',
    home: 'Home',
    logoAlt: `${logo.alt} home`,
    title: 'Privacy policy',
    updated: 'Last updated',
    intro: `This page explains what information ${shortName} collects when you register a team or player, or contact us, on this website, how we use it, and who helps us handle it.`,
    glanceTitle: 'At a glance',
    glance: [
      'We collect only what we need to register you, follow up with you and run the league.',
      'Card details go straight to Stripe. We never see your full card number.',
      'This website doesn’t use cookies, analytics or advertising trackers.',
      'We don’t sell your information, and we only send news and offers if you say yes.',
      'You can ask us to see, correct or delete your details at any time.',
    ],
    sections: [
      {
        id: 'collect',
        title: 'Information we collect',
        body: (
          <>
            <p>We ask only for what we need to register players and teams and run the season.</p>
            <ul>
              <li>
                <strong>Team registrations:</strong> the division, team name, the coach or manager’s name, email
                address and phone number and, if you add them, a club or academy name and roster information such as
                player names.
              </li>
              <li>
                <strong>Player registrations:</strong> the division, the player’s name and date of birth, a parent or
                guardian’s name and email address, a phone number and, if you choose, the player’s experience level and a
                teammate request.
              </li>
              <li>
                <strong>Payments:</strong> you pay on Stripe’s secure checkout page, and your card details go directly
                to Stripe. We see that you paid, the amount, the name and email address entered at checkout, and
                limited card details such as the card type and last four digits — never the full card number.
              </li>
              <li>
                <strong>Contact requests:</strong> if you use the “Not ready to register?” form, your name, email
                address, phone number and what you’re interested in and, if you add them, your player’s age group and a
                message.
              </li>
              <li>
                <strong>When you contact us:</strong> anything you choose to share by email or phone.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: 'use',
        title: 'How we use it',
        body: (
          <>
            <ul>
              <li>To confirm each player is eligible for their division.</li>
              <li>To place individually registered players on teams and organize divisions and schedules.</li>
              <li>To process registration fees and keep financial records.</li>
              <li>
                To send your registration confirmation, schedule and season information, and other messages about the
                league.
              </li>
              <li>To answer your questions and contact requests, and follow up with you about joining the league.</li>
              <li>
                If you say yes on the contact form, to send you news and offers by email and text message. You can opt
                out at any time.
              </li>
            </ul>
            <p>We don’t sell your information or share it with advertisers.</p>
          </>
        ),
      },
      {
        id: 'share',
        title: 'Who we share it with',
        body: (
          <>
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
                <strong>Resend</strong> delivers our emails and keeps our contact list.
              </li>
              <li>
                <strong>Vercel</strong> hosts this website and the registration form.
              </li>
              <li>
                <strong>Neon</strong> stores registrations and contact requests in a secure database for the
                league’s organizers.
              </li>
              <li>
                <strong>Google</strong> provides the league’s Gmail inbox, which receives a copy of each registration.
              </li>
            </ul>
            <p>
              Each follows its own privacy policy and security practices. When we place a player on a team, we may
              share the player’s name and a parent or guardian’s contact details with that team’s coach so they can
              reach you about games. We may also share information when the law requires it.
            </p>
          </>
        ),
      },
      {
        id: 'children',
        title: 'Children’s information',
        body: (
          <p>
            Our players are children, so registrations are completed by a parent or guardian, or by a team’s coach or
            manager. We ask for a player’s date of birth only to confirm their division. We don’t knowingly collect
            information directly from children under 13. If you think a child has sent us information, contact us and
            we’ll delete it.
          </p>
        ),
      },
      {
        id: 'cookies',
        title: 'Cookies and tracking',
        body: (
          <>
            <p>This website doesn’t use cookies, analytics, advertising trackers or social media pixels.</p>
            <p>
              When you continue to payment, your browser keeps a temporary copy of the registration form, so your
              details can be filled back in if you leave checkout without paying. That copy stays on your device, is
              deleted once your payment is confirmed, and is cleared when you close the browser tab.
            </p>
            <p>
              If you switch between English and Spanish, your browser remembers your choice so the site opens in that
              language next time. That setting stays on your device and contains nothing else.
            </p>
            <p>
              Our website host, Vercel, automatically records basic technical information, such as IP addresses and
              browser type, to keep the site running and secure. Stripe’s checkout page uses its own cookies to
              prevent fraud. Links to other websites, such as directions in Google Maps, are covered by those sites’
              own privacy policies.
            </p>
          </>
        ),
      },
      {
        id: 'retention',
        title: 'How long we keep it',
        body: (
          <p>
            We keep registration details for as long as we need them to run the season and keep accurate financial
            records. Stripe also keeps its own payment records, as financial regulations require. We keep contact
            requests for as long as we need them to follow up, and keep you on our contact list until you ask us to
            remove you.
          </p>
        ),
      },
      {
        id: 'choices',
        title: 'Your choices',
        body: (
          <p>
            You can ask us to see, correct or delete the information we hold about you or your child. We may need to
            keep some payment records for accounting and tax purposes, even after deleting the rest. You can stop news
            and offers at any time with the unsubscribe link in our emails, or by contacting us.
          </p>
        ),
      },
      {
        id: 'security',
        title: 'Keeping it safe',
        body: (
          <p>
            This website uses an encrypted (HTTPS) connection, and card payments are handled entirely by Stripe, a
            PCI-certified payment provider. Registration records are kept in the league’s Stripe account, database and
            email inbox, which only league organizers can access. No system is perfectly secure, but we take reasonable care
            to protect your information.
          </p>
        ),
      },
      {
        id: 'changes',
        title: 'Changes to this policy',
        body: <p>If we change how we handle your information, we’ll update this page and the date at the top.</p>,
      },
    ],
    contactTitle: 'Contact us',
    contactLead: `Questions, or want to see, correct or delete your details? Contact ${shortName}`,
  },
  es: {
    skip: 'Saltar al contenido principal',
    home: 'Inicio',
    logoAlt: `${logo.alt}: inicio`,
    title: 'Política de privacidad',
    updated: 'Última actualización:',
    intro: `Esta página explica qué información recopila ${shortName} cuando inscribes a un equipo o a un jugador, o te comunicas con nosotros, en este sitio, cómo la usamos y quién nos ayuda a manejarla.`,
    glanceTitle: 'De un vistazo',
    glance: [
      'Solo recopilamos lo necesario para inscribirte, darte seguimiento y organizar la liga.',
      'Los datos de tu tarjeta van directo a Stripe. Nunca vemos el número completo de tu tarjeta.',
      'Este sitio no usa cookies, herramientas de análisis ni rastreadores publicitarios.',
      'No vendemos tu información y solo te enviamos noticias y ofertas si aceptas.',
      'Puedes pedirnos ver, corregir o borrar tus datos en cualquier momento.',
    ],
    sections: [
      {
        id: 'collect',
        title: 'Información que recopilamos',
        body: (
          <>
            <p>Solo pedimos lo necesario para inscribir a jugadores y equipos y organizar la temporada.</p>
            <ul>
              <li>
                <strong>Inscripciones de equipo:</strong> la división, el nombre del equipo, el nombre, correo
                electrónico y teléfono del entrenador o encargado y, si los agregas, el nombre del club o academia y la
                lista de jugadores, como sus nombres.
              </li>
              <li>
                <strong>Inscripciones de jugador:</strong> la división, el nombre y la fecha de nacimiento del jugador,
                el nombre y correo electrónico del padre, madre o tutor, un número de teléfono y, si quieres, el nivel
                de experiencia del jugador y una solicitud de compañero.
              </li>
              <li>
                <strong>Pagos:</strong> pagas en la página de pago seguro de Stripe, y los datos de tu tarjeta van
                directo a Stripe. Nosotros vemos que pagaste, el monto, el nombre y el correo electrónico que escribiste
                al pagar, y algunos datos limitados de la tarjeta, como el tipo y los últimos cuatro dígitos, pero nunca
                el número completo.
              </li>
              <li>
                <strong>Solicitudes de contacto:</strong> si usas el formulario “¿Todavía no estás listo para
                inscribirte?”, tu nombre, correo electrónico, teléfono y lo que te interesa y, si los agregas, la
                división de edad de tu jugador y un mensaje.
              </li>
              <li>
                <strong>Cuando te comunicas con nosotros:</strong> lo que decidas compartir por correo o por teléfono.
              </li>
            </ul>
          </>
        ),
      },
      {
        id: 'use',
        title: 'Cómo la usamos',
        body: (
          <>
            <ul>
              <li>Para confirmar que cada jugador puede jugar en su división.</li>
              <li>
                Para asignar equipo a los jugadores inscritos de forma individual y organizar las divisiones y el
                calendario.
              </li>
              <li>Para procesar las cuotas de inscripción y llevar nuestros registros financieros.</li>
              <li>
                Para enviarte la confirmación de tu inscripción, el calendario, la información de la temporada y otros
                mensajes sobre la liga.
              </li>
              <li>
                Para responder tus preguntas y solicitudes de contacto, y darte seguimiento sobre cómo unirte a la liga.
              </li>
              <li>
                Si aceptas en el formulario de contacto, para enviarte noticias y ofertas por correo electrónico y mensaje
                de texto. Puedes darte de baja en cualquier momento.
              </li>
            </ul>
            <p>No vendemos tu información ni la compartimos con anunciantes.</p>
          </>
        ),
      },
      {
        id: 'share',
        title: 'Con quién la compartimos',
        body: (
          <>
            <p>
              Solo compartimos la información de inscripción con los servicios que nos ayudan con las inscripciones, y
              solo lo que cada uno necesita:
            </p>
            <ul>
              <li>
                <strong>Stripe</strong> procesa los pagos y guarda los datos de inscripción vinculados a cada pago.
              </li>
              <li>
                <strong>Resend</strong> envía nuestros correos y guarda nuestra lista de contactos.
              </li>
              <li>
                <strong>Vercel</strong> aloja este sitio web y el formulario de inscripción.
              </li>
              <li>
                <strong>Neon</strong> guarda las inscripciones y las solicitudes de contacto en una base de datos
                segura para los organizadores de la liga.
              </li>
              <li>
                <strong>Google</strong> ofrece el correo de Gmail de la liga, que recibe una copia de cada inscripción.
              </li>
            </ul>
            <p>
              Cada uno sigue su propia política de privacidad y sus propias prácticas de seguridad. Cuando asignamos un
              jugador a un equipo, podemos compartir el nombre del jugador y los datos de contacto del padre, madre o
              tutor con el entrenador de ese equipo, para que pueda comunicarse contigo sobre los partidos. También
              podemos compartir información cuando la ley lo exija.
            </p>
          </>
        ),
      },
      {
        id: 'children',
        title: 'Información de menores',
        body: (
          <p>
            Nuestros jugadores son niños, así que las inscripciones las hace un padre, madre o tutor, o el entrenador o
            encargado del equipo. Pedimos la fecha de nacimiento del jugador solo para confirmar su división. No
            recopilamos a sabiendas información directamente de niños menores de 13 años. Si crees que un niño nos
            envió información, comunícate con nosotros y la borraremos.
          </p>
        ),
      },
      {
        id: 'cookies',
        title: 'Cookies y rastreo',
        body: (
          <>
            <p>
              Este sitio no usa cookies, herramientas de análisis, rastreadores publicitarios ni píxeles de redes
              sociales.
            </p>
            <p>
              Cuando continúas al pago, tu navegador guarda una copia temporal del formulario de inscripción para
              volver a llenarlo si sales del pago sin pagar. Esa copia se queda en tu dispositivo, se borra cuando se
              confirma tu pago y desaparece al cerrar la pestaña del navegador.
            </p>
            <p>
              Si cambias entre inglés y español, tu navegador recuerda tu elección para que el sitio se abra en ese
              idioma la próxima vez. Ese ajuste se queda en tu dispositivo y no contiene nada más.
            </p>
            <p>
              Nuestro proveedor de hosting, Vercel, registra automáticamente información técnica básica, como
              direcciones IP y tipo de navegador, para mantener el sitio funcionando y seguro. La página de pago de
              Stripe usa sus propias cookies para prevenir fraudes. Los enlaces a otros sitios, como las indicaciones
              en Google Maps, se rigen por las políticas de privacidad de esos sitios.
            </p>
          </>
        ),
      },
      {
        id: 'retention',
        title: 'Cuánto tiempo la guardamos',
        body: (
          <p>
            Guardamos los datos de inscripción mientras los necesitemos para organizar la temporada y mantener registros
            financieros correctos. Stripe también guarda sus propios registros de pago, como lo exigen las regulaciones
            financieras. Guardamos las solicitudes de contacto mientras las necesitemos para darte seguimiento, y te
            mantenemos en nuestra lista de contactos hasta que nos pidas que te quitemos.
          </p>
        ),
      },
      {
        id: 'choices',
        title: 'Tus opciones',
        body: (
          <p>
            Puedes pedirnos ver, corregir o borrar la información que tenemos sobre ti o sobre tu hijo o hija. Es
            posible que debamos conservar algunos registros de pago por motivos contables y fiscales, aun después de
            borrar lo demás. Puedes dejar de recibir noticias y ofertas en cualquier momento con el enlace para darte de
            baja en nuestros correos, o comunicándote con nosotros.
          </p>
        ),
      },
      {
        id: 'security',
        title: 'Cómo la protegemos',
        body: (
          <p>
            Este sitio usa una conexión cifrada (HTTPS), y los pagos con tarjeta los maneja por completo Stripe, un
            proveedor de pagos con certificación PCI. Los registros de inscripción se guardan en la cuenta de Stripe, la base de
            datos y el correo de la liga, a los que solo tienen acceso los organizadores de la liga. Ningún sistema es totalmente
            seguro, pero cuidamos tu información de forma razonable.
          </p>
        ),
      },
      {
        id: 'changes',
        title: 'Cambios a esta política',
        body: (
          <p>Si cambiamos la forma en que manejamos tu información, actualizaremos esta página y la fecha de arriba.</p>
        ),
      },
    ],
    contactTitle: 'Contáctanos',
    contactLead: `¿Preguntas, o quieres ver, corregir o borrar tus datos? Comunícate con ${shortName}`,
  },
})

export function PrivacyPage() {
  return (
    <LocaleProvider page="privacy">
      <Policy />
    </LocaleProvider>
  )
}

function Policy() {
  const locale = useLocale()
  const t = COPY[locale]
  const home = pagePath('home', locale)

  return (
    <div id="top">
      <a className="skip-link" href="#main">
        {t.skip}
      </a>

      <header className="site-header site-header--simple">
        <div className="container site-header__inner">
          <a className="brand" href={home}>
            <img
              className="brand__logo"
              src={logo.src}
              srcSet={logo.srcSet}
              sizes="(min-width: 1024px) 60px, 48px"
              width={256}
              height={256}
              alt={t.logoAlt}
            />
            <span className="brand__text" aria-hidden="true">
              ElevatePro
              <span className="brand__sub">Soccer League</span>
            </span>
          </a>
          <LanguageToggle />
          <a className="btn btn--secondary btn--sm" href={home}>
            {t.home}
          </a>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        <div className="privacy-hero section--pale">
          <div className="container privacy__container">
            <p className="eyebrow">{league.name}</p>
            <h1 className="h2">{t.title}</h1>
            <p className="privacy-hero__updated">
              {t.updated} <time dateTime={LAST_UPDATED}>{formatIsoDate(LAST_UPDATED, locale)}</time>
            </p>
            <p className="lede">{t.intro}</p>
          </div>
        </div>

        <div className="privacy-body">
          <div className="container privacy__container">
            <section className="privacy-summary" aria-labelledby="privacy-summary-title">
              <h2 className="privacy-summary__title" id="privacy-summary-title">
                {t.glanceTitle}
              </h2>
              <ul className="checklist">
                {t.glance.map((point) => (
                  <li key={point}>
                    <Icon name="check" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </section>

            {t.sections.map((section) => (
              <section className="privacy-section" aria-labelledby={section.id} key={section.id}>
                <h2 id={section.id}>{section.title}</h2>
                {section.body}
              </section>
            ))}

            <section className="privacy-section privacy-contact" aria-labelledby="contact">
              <h2 id="contact">{t.contactTitle}</h2>
              <ContactLine lead={t.contactLead} />
            </section>
          </div>
        </div>
      </main>

      <Footer home={home} />
    </div>
  )
}
