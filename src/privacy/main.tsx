import '@fontsource/anton/400.css'
import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow/700.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import '../styles/base.css'
import { localeFromPath } from '../i18n/locale'
import { startLocale } from '../i18n/startLocale'
import { mount } from '../mount'
import { PrivacyPage } from './PrivacyPage'

const locale = startLocale()
mount(<PrivacyPage locale={locale} />, { matchesPrerender: locale === localeFromPath(window.location.pathname) })
