import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/anton/400.css'
import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow/700.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import '../styles/base.css'
import { TeamLanding } from './TeamLanding'

// The same page serves English and Spanish; the HTML file sets the language (<html lang="es">).
const locale = document.documentElement.lang === 'es' ? 'es' : 'en'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TeamLanding locale={locale} />
  </StrictMode>,
)
