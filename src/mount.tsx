import { StrictMode, type ReactNode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'

/**
 * Starts a page in the browser. The build pre-renders each public page's HTML
 * (src/prerender.tsx), so search engines, link previews and slow connections get the content
 * without running JavaScript; React then takes over that HTML. When this visit will look
 * different from the pre-rendered page (another language, or a return from Stripe), or there is
 * no pre-rendered HTML (`npm run dev`), React draws the page fresh instead.
 */
export function mount(page: ReactNode, { matchesPrerender = true } = {}) {
  const container = document.getElementById('root')!
  const app = <StrictMode>{page}</StrictMode>
  if (matchesPrerender && container.hasChildNodes()) hydrateRoot(container, app)
  else createRoot(container).render(app)
}
