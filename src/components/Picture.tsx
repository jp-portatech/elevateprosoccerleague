import type { ResponsiveImage } from '../content/images'
import { useLocale } from '../i18n/useLocale'

interface PictureProps {
  image: ResponsiveImage
  /** The `sizes` attribute: how wide the image renders at each breakpoint. */
  sizes: string
  className?: string
  /** Above-the-fold images load eagerly with high priority; everything else lazy-loads. */
  priority?: boolean
  /** Override the registry alt text, e.g. "" for a decorative use. */
  alt?: string
}

/** WebP with JPG fallback, responsive srcset and intrinsic dimensions. */
export function Picture({ image, sizes, className, priority = false, alt }: PictureProps) {
  const locale = useLocale()
  return (
    <picture>
      <source type="image/webp" srcSet={image.webp} sizes={sizes} />
      <img
        className={className}
        src={image.src}
        srcSet={image.jpg}
        sizes={sizes}
        width={image.width}
        height={image.height}
        alt={alt ?? image.alt[locale]}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'auto' : 'async'}
        fetchPriority={priority ? 'high' : undefined}
      />
    </picture>
  )
}
