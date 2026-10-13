import '@fontsource/anton/400.css'
import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow/700.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import '../styles/base.css'
import { mount } from '../mount'
import { PlayerLanding } from './PlayerLanding'

// The same page serves English and Spanish; the HTML file sets the language (<html lang="es">).
const locale = document.documentElement.lang === 'es' ? 'es' : 'en'

mount(<PlayerLanding locale={locale} />)
