/**
 * Build-time rendering. `npm run build` bundles this file for Node (vite build --ssr) and
 * scripts/prerender.mjs writes each page's HTML into dist/, so search engines, link previews and
 * slow connections get the full content without running JavaScript. In the browser,
 * src/mount.tsx then takes over that HTML. The admin dashboard isn't pre-rendered.
 */
import { StrictMode, type ReactNode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App'
import { PlayerLanding } from './landing/PlayerLanding'
import { TeamLanding } from './landing/TeamLanding'
import { PrivacyPage } from './privacy/PrivacyPage'
import { structuredData } from './seo/structuredData'

/** Each built HTML file in dist/, the page it shows, and its search-engine data. */
const PAGES: Record<string, { page: ReactNode; data?: object }> = {
  'index.html': { page: <App locale="en" />, data: structuredData('en') },
  'es.html': { page: <App locale="es" />, data: structuredData('es') },
  'privacy.html': { page: <PrivacyPage locale="en" /> },
  'es/privacy.html': { page: <PrivacyPage locale="es" /> },
  'join-as-a-player.html': { page: <PlayerLanding locale="en" /> },
  'es/join-as-a-player.html': { page: <PlayerLanding locale="es" /> },
  'register-a-team.html': { page: <TeamLanding locale="en" /> },
  'es/register-a-team.html': { page: <TeamLanding locale="es" /> },
}

export const files = Object.keys(PAGES)

export function render(file: string): { html: string; data?: object } {
  const { page, data } = PAGES[file]
  return { html: renderToString(<StrictMode>{page}</StrictMode>), data }
}
