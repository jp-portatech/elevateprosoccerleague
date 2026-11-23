import '@fontsource/anton/400.css'
import '@fontsource/barlow/400.css'
import '@fontsource/barlow/500.css'
import '@fontsource/barlow/600.css'
import '@fontsource/barlow/700.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'
import '../styles/base.css'
import { mount } from '../mount'
import { WaiverPage } from './WaiverPage'

// Not pre-rendered (it's unlisted), so this always draws the page fresh.
mount(<WaiverPage />)
