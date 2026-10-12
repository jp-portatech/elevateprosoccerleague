import { venueLogo } from '../content/images'

/**
 * The venue partner's shield. Decorative here: every placement shows the venue's name
 * next to it in text, so the image itself has empty alt text.
 */
export function PartnerLogo({ className, sizes, lazy = false }: { className: string; sizes: string; lazy?: boolean }) {
  return (
    <img
      className={className}
      src={venueLogo.src}
      srcSet={venueLogo.srcSet}
      sizes={sizes}
      width={venueLogo.width}
      height={venueLogo.height}
      alt=""
      loading={lazy ? 'lazy' : undefined}
    />
  )
}
