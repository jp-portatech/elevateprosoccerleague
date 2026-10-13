import { Header } from './components/Header'
import type { Locale } from './i18n/locale'
import { LocaleProvider } from './i18n/LocaleProvider'
import { useLocale } from './i18n/useLocale'
import { RegistrationProvider } from './registration/RegistrationProvider'
import { Awards } from './sections/Awards'
import { Contact } from './sections/Contact'
import { Divisions } from './sections/Divisions'
import { Faq } from './sections/Faq'
import { FinalCta } from './sections/FinalCta'
import { Footer } from './sections/Footer'
import { Hero } from './sections/Hero'
import { PlayerPlacement } from './sections/PlayerPlacement'
import { QuickFacts } from './sections/QuickFacts'
import { Registration } from './sections/Registration'
import { SeasonFormat } from './sections/SeasonFormat'
import { SundayExperience } from './sections/SundayExperience'
import { Venue } from './sections/Venue'
import { WaysToPlay } from './sections/WaysToPlay'
import { WhyElevatePro } from './sections/WhyElevatePro'

export default function App({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider page="home" initial={locale}>
      <RegistrationProvider>
        <Home />
      </RegistrationProvider>
    </LocaleProvider>
  )
}

function Home() {
  const locale = useLocale()
  return (
    <div id="top">
      <a className="skip-link" href="#main">
        {locale === 'es' ? 'Saltar al contenido principal' : 'Skip to main content'}
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        <Hero />
        <QuickFacts />
        <WaysToPlay />
        <WhyElevatePro />
        <Divisions />
        <PlayerPlacement />
        <SeasonFormat />
        <Awards />
        <Venue />
        <SundayExperience />
        <Registration />
        <Faq />
        <Contact />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
