import type { ReactNode } from 'react'
import { reveal as revealProps } from '../motion/reveal'

interface SectionHeadingProps {
  id: string
  eyebrow?: string
  children: ReactNode
  className?: string
  /** Fade the heading up as it scrolls into view (src/motion/reveal.ts). */
  reveal?: boolean
}

/** Small ruled eyebrow + condensed display heading used by every section. */
export function SectionHeading({ id, eyebrow, children, className, reveal }: SectionHeadingProps) {
  return (
    <div className={className} {...(reveal && revealProps())}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="h2" id={id}>
        {children}
      </h2>
    </div>
  )
}
