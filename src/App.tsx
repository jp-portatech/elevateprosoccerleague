import { Header } from './components/Header'
import { RegistrationProvider } from './registration/RegistrationProvider'
import { Awards } from './sections/Awards'
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

export default function App() {
  return (
    <RegistrationProvider>
      <div id="top">
        <a className="skip-link" href="#main">
          Skip to main content
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
          <FinalCta />
        </main>
        <Footer />
      </div>
    </RegistrationProvider>
  )
}
