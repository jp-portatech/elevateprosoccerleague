/**
 * Image registry for the ElevatePro asset pack (./elevatepro-website-assets).
 *
 * Every photo ships as matching WebP + JPG files at several widths. Dimensions and alt
 * text come from elevatepro-website-assets/docs/manifest.json. All photography in the pack
 * is AI-generated and illustrative — it does not show real ElevatePro players, awards or
 * the Axe House Sports facility.
 */

import type { Localized } from '../i18n/locale'

const ASSET_ROOT = '/elevatepro-website-assets/'

const files = import.meta.glob<string>(
  [
    '/elevatepro-website-assets/{hero,registration,awards,gallery,venue}/*.{webp,jpg}',
    '/elevatepro-website-assets/backgrounds/cta-*.{webp,jpg}',
    '/elevatepro-website-assets/brand/elevatepro-logo-*.webp',
    '/elevatepro-website-assets/brand/axe-house-sports-logo-*.webp',
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
  /** Alt text in each language ("" for decorative images). */
  alt: Localized
}

/** `variants` are [width, height] pairs for files named `${base}-${width}.{webp,jpg}`. */
function responsive(base: string, variants: Array<[number, number]>, alt: Localized): ResponsiveImage {
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
    {
      en: 'Youth players dribbling a soccer ball on an indoor pitch.',
      es: 'Jóvenes futbolistas conduciendo el balón en una cancha indoor.',
    },
  ),
  heroMobile: responsive(
    'hero/hero-mobile',
    [
      [640, 853],
      [768, 1024],
    ],
    { en: 'Youth soccer players on an indoor pitch.', es: 'Jóvenes futbolistas en una cancha indoor.' },
  ),
  team: responsive('registration/team', LANDSCAPE_3_2, {
    en: 'Youth soccer teammates huddling before an indoor match.',
    es: 'Compañeros de equipo juveniles reunidos antes de un partido indoor.',
  }),
  player: responsive(
    'registration/player',
    [
      [640, 800],
      [960, 1200],
    ],
    {
      en: 'Young soccer player smiling with a ball on an indoor pitch.',
      es: 'Joven futbolista sonriendo con un balón en una cancha indoor.',
    },
  ),
  awards: responsive('awards/awards', WIDE_16_9_1600, {
    en: 'Soccer trophy and silver medals with navy ribbons.',
    es: 'Trofeo de fútbol y medallas plateadas con listones azul marino.',
  }),
  galleryAction: responsive(
    'gallery/gallery-action',
    LANDSCAPE_3_2,
    {
      en: 'Two youth soccer players competing for the ball indoors.',
      es: 'Dos jóvenes futbolistas disputando el balón en una cancha indoor.',
    },
  ),
  galleryCoaching: responsive(
    'gallery/gallery-coaching',
    LANDSCAPE_3_2,
    {
      en: 'Coach explaining a soccer drill to youth players.',
      es: 'Entrenador explicando un ejercicio a jóvenes futbolistas.',
    },
  ),
  galleryCelebration: responsive(
    'gallery/gallery-celebration',
    LANDSCAPE_3_2,
    {
      en: 'Youth teammates celebrating with high fives indoors.',
      es: 'Compañeros de equipo juveniles chocando las manos para celebrar en una cancha indoor.',
    },
  ),
  /** Generic, imagined indoor pitch — NOT Axe House Sports. Replace with a real facility photo. */
  venue: responsive(
    'venue/venue',
    WIDE_16_9_1600,
    {
      en: 'Illustration of a generic indoor soccer field; not Axe House Sports.',
      es: 'Ilustración de una cancha de fútbol indoor genérica; no es Axe House Sports.',
    },
  ),
  /** Decorative background for the final call to action. */
  cta: responsive(
    'backgrounds/cta',
    [
      [640, 213],
      [960, 320],
      [1920, 640],
    ],
    { en: '', es: '' },
  ),
} satisfies Record<string, ResponsiveImage>

/** Transparent emblem, lossless WebP. Square, so it can't be distorted by width/height. */
export const logo = {
  src: assetUrl('brand/elevatepro-logo-256.webp'),
  srcSet: [128, 256, 512].map((w) => `${assetUrl(`brand/elevatepro-logo-${w}.webp`)} ${w}w`).join(', '),
  alt: 'ElevatePro Soccer League',
}

/**
 * Axe House Sports shield (official venue partner), supplied by Axe House and used with their
 * permission. Trimmed from brand/axe_house_sports_logo.png, unaltered otherwise. Lossless WebP.
 */
export const venueLogo = {
  src: assetUrl('brand/axe-house-sports-logo-128.webp'),
  srcSet: [128, 256].map((w) => `${assetUrl(`brand/axe-house-sports-logo-${w}.webp`)} ${w}w`).join(', '),
  width: 570,
  height: 708,
  alt: 'Axe House Sports',
}
