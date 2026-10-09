/**
 * Image registry for the ElevatePro asset pack (./elevatepro-website-assets).
 *
 * Every photo ships as matching WebP + JPG files at several widths. Dimensions and alt
 * text come from elevatepro-website-assets/docs/manifest.json. All photography in the pack
 * is AI-generated and illustrative — it does not show real ElevatePro players, awards or
 * the Axe House Sports facility.
 */

const ASSET_ROOT = '/elevatepro-website-assets/'

const files = import.meta.glob<string>(
  [
    '/elevatepro-website-assets/{hero,registration,awards,gallery,venue}/*.{webp,jpg}',
    '/elevatepro-website-assets/backgrounds/cta-*.{webp,jpg}',
    '/elevatepro-website-assets/brand/elevatepro-logo-*.webp',
  ],
  { eager: true, query: '?url', import: 'default' },
)

function assetUrl(path: string): string {
  const url = files[ASSET_ROOT + path]
  if (!url) throw new Error(`Missing image asset: elevatepro-website-assets/${path}`)
  return url
}

export interface ResponsiveImage {
  /** srcset of WebP variants */
  webp: string
  /** srcset of JPG variants */
  jpg: string
  /** Largest JPG, used as the <img src> fallback */
  src: string
  /** Intrinsic size of the largest variant (sets the aspect ratio and prevents layout shift) */
  width: number
  height: number
  alt: string
}

/** `variants` are [width, height] pairs for files named `${base}-${width}.{webp,jpg}`. */
function responsive(base: string, variants: Array<[number, number]>, alt: string): ResponsiveImage {
  const srcset = (ext: string) =>
    variants.map(([w]) => `${assetUrl(`${base}-${w}.${ext}`)} ${w}w`).join(', ')
  const [width, height] = variants[variants.length - 1]
  return {
    webp: srcset('webp'),
    jpg: srcset('jpg'),
    src: assetUrl(`${base}-${width}.jpg`),
    width,
    height,
    alt,
  }
}

const LANDSCAPE_3_2: Array<[number, number]> = [
  [640, 427],
  [960, 640],
  [1200, 800],
]
const WIDE_16_9_1600: Array<[number, number]> = [
  [640, 360],
  [960, 540],
  [1600, 900],
]

export const images = {
  hero: responsive(
    'hero/hero',
    [
      [640, 360],
      [960, 540],
      [1920, 1080],
    ],
    'Youth players dribbling a soccer ball on an indoor pitch.',
  ),
  heroMobile: responsive(
    'hero/hero-mobile',
    [
      [640, 853],
      [768, 1024],
    ],
    'Youth soccer players on an indoor pitch.',
  ),
  team: responsive('registration/team', LANDSCAPE_3_2, 'Youth soccer teammates huddling before an indoor match.'),
  player: responsive(
    'registration/player',
    [
      [640, 800],
      [960, 1200],
    ],
    'Young soccer player smiling with a ball on an indoor pitch.',
  ),
  awards: responsive('awards/awards', WIDE_16_9_1600, 'Soccer trophy and silver medals with navy ribbons.'),
  galleryAction: responsive(
    'gallery/gallery-action',
    LANDSCAPE_3_2,
    'Two youth soccer players competing for the ball indoors.',
  ),
  galleryCoaching: responsive(
    'gallery/gallery-coaching',
    LANDSCAPE_3_2,
    'Coach explaining a soccer drill to youth players.',
  ),
  galleryCelebration: responsive(
    'gallery/gallery-celebration',
    LANDSCAPE_3_2,
    'Youth teammates celebrating with high fives indoors.',
  ),
  /** Generic, imagined indoor pitch — NOT Axe House Sports. Replace with a real facility photo. */
  venue: responsive(
    'venue/venue',
    WIDE_16_9_1600,
    'Illustration of a generic indoor soccer field; not Axe House Sports.',
  ),
  /** Decorative background for the final call to action. */
  cta: responsive(
    'backgrounds/cta',
    [
      [640, 213],
      [960, 320],
      [1920, 640],
    ],
    '',
  ),
} satisfies Record<string, ResponsiveImage>

/** Transparent emblem, lossless WebP. Square, so it can't be distorted by width/height. */
export const logo = {
  src: assetUrl('brand/elevatepro-logo-256.webp'),
  srcSet: [128, 256, 512].map((w) => `${assetUrl(`brand/elevatepro-logo-${w}.webp`)} ${w}w`).join(', '),
  alt: 'ElevatePro Soccer League',
}
