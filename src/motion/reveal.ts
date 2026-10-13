/**
 * Scroll reveals: a section's content fades up once as it comes into view.
 *
 * Content is visible by default. An element is hidden for its reveal only after this script has
 * set up the observer (which marks <html data-motion>), only for visitors who haven't asked for
 * reduced motion, and only while it is still below the screen. So the pre-rendered page, a
 * failed script or an old browser always shows everything. Styles and timing: "Motion" in
 * src/styles/base.css.
 *
 * Modes:
 *   up       the element fades up as one block
 *   stagger  its direct children fade up one after another
 *   steps    the season format: icons appear in sequence along a drawn connector
 */
export type RevealMode = 'up' | 'stagger' | 'steps'

let observer: IntersectionObserver | null | undefined
/** Elements still waiting below the screen. */
const pending = new Set<HTMLElement>()
let listening = false

function forget(element: HTMLElement) {
  observer?.unobserve(element)
  pending.delete(element)
  if (pending.size === 0 && listening) {
    window.removeEventListener('scrollend', showPassed)
    listening = false
  }
}

function done(element: HTMLElement, how: 'animate' | 'shown') {
  element.dataset.revealed = how
  forget(element)
}

/**
 * A fast jump (a menu link, the End key) can pass an element without the browser ever drawing it
 * on screen, so it never intersects. Anything already passed is shown as is, so scrolling back up
 * never finds content still waiting to animate. Runs after each reveal and once whenever scrolling
 * comes to rest (`scrollend`, one event per scroll, not per frame).
 */
function showPassed() {
  for (const element of pending) {
    if (element.getBoundingClientRect().bottom < 0) done(element, 'shown')
  }
}

function sharedObserver(): IntersectionObserver | null {
  if (observer !== undefined) return observer
  observer = null
  if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return null
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) done(entry.target as HTMLElement, 'animate')
      }
      showPassed()
    },
    // Reveal once a meaningful part is on screen: 15% of it, above the bottom tenth of the view.
    { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
  )
  observer = io
  document.documentElement.dataset.motion = 'on'
  return io
}

function observe(element: HTMLElement | null) {
  if (!element || element.dataset.revealed) return
  const io = sharedObserver()
  if (!io) return
  // Already on screen or scrolled past when the page starts (a reload part-way down, a #link):
  // shown as is, without animating.
  if (element.getBoundingClientRect().top < window.innerHeight) {
    element.dataset.revealed = 'shown'
    return
  }
  pending.add(element)
  io.observe(element)
  if (!listening) {
    window.addEventListener('scrollend', showPassed, { passive: true })
    listening = true
  }
  return () => forget(element)
}

/** Props that reveal an element once on scroll, e.g. `<ul {...reveal('stagger')}>`. */
export const reveal = (mode: RevealMode = 'up') => ({ ref: observe, 'data-reveal': mode })
