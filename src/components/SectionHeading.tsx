import type { ReactNode } from 'react'

interface SectionHeadingProps {
  id: string
  eyebrow?: string
  children: ReactNode
  className?: string
}

/** Small ruled eyebrow + condensed display heading used by every section. */
export function SectionHeading({ id, eyebrow, children, className }: SectionHeadingProps) {
  return (
    <div className={className}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2 className="h2" id={id}>
        {children}
      </h2>
    </div>
  )
}
