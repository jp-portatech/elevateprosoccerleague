import '@fontsource/anton/400.css'
import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow/700.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import './styles/base.css'
import App from './App'
import { localeFromPath } from './i18n/locale'
import { startLocale } from './i18n/startLocale'
import { mount } from './mount'

const locale = startLocale()
// The pre-rendered page is in the URL's language, with no Stripe confirmation showing.
const stripeReturn = new URLSearchParams(window.location.search).has('registration')
mount(<App locale={locale} />, { matchesPrerender: locale === localeFromPath(window.location.pathname) && !stripeReturn })
