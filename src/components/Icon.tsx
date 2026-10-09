/**
 * Inline SVG icons from elevatepro-website-assets/icons. They're inlined (not <img>) so the
 * strokes inherit `currentColor` from the surrounding text. Always decorative: pair them
 * with visible text.
 */
const sources = import.meta.glob<string>(
  ['/elevatepro-website-assets/icons/*.svg', '!**/division-*.svg'],
  { eager: true, query: '?raw', import: 'default' },
)

export type IconName =
  | 'arrow'
  | 'bracket'
  | 'calendar'
  | 'check'
  | 'field'
  | 'growth'
  | 'medal'
  | 'pin'
  | 'player'
  | 'star'
  | 'team'
  | 'trophy'

const markup = (name: IconName) => {
  const svg = sources[`/elevatepro-website-assets/icons/${name}.svg`]
  if (!svg) throw new Error(`Missing icon asset: elevatepro-website-assets/icons/${name}.svg`)
  return svg
}

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <span
      className={className ? `icon ${className}` : 'icon'}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: markup(name) }}
    />
  )
}
