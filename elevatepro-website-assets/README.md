# ElevatePro website image asset pack

Matched to the supplied navy, ice-blue and white website reference. Primary navy: #001E48 (sampled from logo); ice-blue: #8FB7DF (reference-inspired); white #FFFFFF; pale blue #E8F3FC. Exact original logo is in brand/elevatepro-logo-original.png. Background-removed logo is derived using image generation; check lettering against the original before launch.

## Folder guide
- brand/: original and transparent logo, lossless WebP size variants.
- hero/: desktop and mobile photos, responsive sizes.
- registration/: team huddle and individual player, also usable for placement and pricing.
- awards/: trophy and medals.
- gallery/: action, coaching, celebration.
- venue/: generic illustrative indoor pitch; replace with an actual Axe House Sports photo.
- backgrounds/: final CTA photo and lightweight angular SVG backgrounds.
- icons/: 12 SVG icons; currentColor inherits your CSS color when embedded inline.
- originals/: full generated PNG images.
- reference/: supplied website visual reference.
- docs/: complete CSV/JSON filename manifest, prompts, integration example, website build prompt.

## Placement and dimensions
Use hero at 1920×1080 desktop; hero-mobile at 768×1024. Team and gallery: 1200×800; individual player: 960×1200; awards: 1600×900; final CTA: 1920×640. Responsive 640px and 960px variants are supplied where appropriate. See docs/manifest.csv for every web image filename, actual dimensions, section and alt text.

Hero copy belongs in HTML over the bright left area. For mobile, put headline and buttons below the photo; inspect the crop at each breakpoint. Use navy/white angular SVGs for quick facts, benefits, divisions, season format, FAQ and footer. Keep all headings, prices, dates, division labels and button text as accessible HTML. No embedded copy is needed in those sections.

## Honest image use
All generated people, matches and awards are illustrative, not documentary photos of ElevatePro. Do not caption them as actual participants or actual awards. The venue image is a generic imagined indoor pitch, not Axe House Sports. Replace it with an authentic facility photo before publishing it as the league venue. The reference screenshot is for design guidance and is not a production image. Contact details, prices, dates, venue information, age eligibility and league rules must come from the league; do not copy tiny screenshot text as verified facts.

## Web integration
Prefer WebP with JPG fallback, width/height attributes and responsive srcset. Load hero eagerly; lazy-load below-fold images. Decorative backgrounds and adjacent explanatory icons have empty alt text; logo alt is ElevatePro Soccer League. Exported JPG/WebP files omit source metadata. Transparent logo uses PNG or lossless WebP.

Generated with the built-in image-generation tool. Prompt set is in docs/generation-prompts.md. No website hosting or registration service is included.

## Filename manifest

| File | Intended section | Dimensions | Alt text |
|---|---|---|---|
| `hero/hero-640.webp` | Hero | 640×360 | Youth players dribbling a soccer ball on an indoor pitch. |
| `hero/hero-640.jpg` | Hero | 640×360 | Youth players dribbling a soccer ball on an indoor pitch. |
| `hero/hero-960.webp` | Hero | 960×540 | Youth players dribbling a soccer ball on an indoor pitch. |
| `hero/hero-960.jpg` | Hero | 960×540 | Youth players dribbling a soccer ball on an indoor pitch. |
| `hero/hero-1920.webp` | Hero | 1920×1080 | Youth players dribbling a soccer ball on an indoor pitch. |
| `hero/hero-1920.jpg` | Hero | 1920×1080 | Youth players dribbling a soccer ball on an indoor pitch. |
| `registration/team-640.webp` | Bring your team | 640×427 | Youth soccer teammates huddling before an indoor match. |
| `registration/team-640.jpg` | Bring your team | 640×427 | Youth soccer teammates huddling before an indoor match. |
| `registration/team-960.webp` | Bring your team | 960×640 | Youth soccer teammates huddling before an indoor match. |
| `registration/team-960.jpg` | Bring your team | 960×640 | Youth soccer teammates huddling before an indoor match. |
| `registration/team-1200.webp` | Bring your team | 1200×800 | Youth soccer teammates huddling before an indoor match. |
| `registration/team-1200.jpg` | Bring your team | 1200×800 | Youth soccer teammates huddling before an indoor match. |
| `registration/player-640.webp` | Join as a player / player placement | 640×800 | Young soccer player smiling with a ball on an indoor pitch. |
| `registration/player-640.jpg` | Join as a player / player placement | 640×800 | Young soccer player smiling with a ball on an indoor pitch. |
| `registration/player-960.webp` | Join as a player / player placement | 960×1200 | Young soccer player smiling with a ball on an indoor pitch. |
| `registration/player-960.jpg` | Join as a player / player placement | 960×1200 | Young soccer player smiling with a ball on an indoor pitch. |
| `awards/awards-640.webp` | Awards | 640×360 | Soccer trophy and silver medals with navy ribbons. |
| `awards/awards-640.jpg` | Awards | 640×360 | Soccer trophy and silver medals with navy ribbons. |
| `awards/awards-960.webp` | Awards | 960×540 | Soccer trophy and silver medals with navy ribbons. |
| `awards/awards-960.jpg` | Awards | 960×540 | Soccer trophy and silver medals with navy ribbons. |
| `awards/awards-1600.webp` | Awards | 1600×900 | Soccer trophy and silver medals with navy ribbons. |
| `awards/awards-1600.jpg` | Awards | 1600×900 | Soccer trophy and silver medals with navy ribbons. |
| `gallery/gallery-action-640.webp` | Sunday experience | 640×427 | Two youth soccer players competing for the ball indoors. |
| `gallery/gallery-action-640.jpg` | Sunday experience | 640×427 | Two youth soccer players competing for the ball indoors. |
| `gallery/gallery-action-960.webp` | Sunday experience | 960×640 | Two youth soccer players competing for the ball indoors. |
| `gallery/gallery-action-960.jpg` | Sunday experience | 960×640 | Two youth soccer players competing for the ball indoors. |
| `gallery/gallery-action-1200.webp` | Sunday experience | 1200×800 | Two youth soccer players competing for the ball indoors. |
| `gallery/gallery-action-1200.jpg` | Sunday experience | 1200×800 | Two youth soccer players competing for the ball indoors. |
| `gallery/gallery-coaching-640.webp` | Sunday experience / development | 640×427 | Coach explaining a soccer drill to youth players. |
| `gallery/gallery-coaching-640.jpg` | Sunday experience / development | 640×427 | Coach explaining a soccer drill to youth players. |
| `gallery/gallery-coaching-960.webp` | Sunday experience / development | 960×640 | Coach explaining a soccer drill to youth players. |
| `gallery/gallery-coaching-960.jpg` | Sunday experience / development | 960×640 | Coach explaining a soccer drill to youth players. |
| `gallery/gallery-coaching-1200.webp` | Sunday experience / development | 1200×800 | Coach explaining a soccer drill to youth players. |
| `gallery/gallery-coaching-1200.jpg` | Sunday experience / development | 1200×800 | Coach explaining a soccer drill to youth players. |
| `gallery/gallery-celebration-640.webp` | Sunday experience | 640×427 | Youth teammates celebrating with high fives indoors. |
| `gallery/gallery-celebration-640.jpg` | Sunday experience | 640×427 | Youth teammates celebrating with high fives indoors. |
| `gallery/gallery-celebration-960.webp` | Sunday experience | 960×640 | Youth teammates celebrating with high fives indoors. |
| `gallery/gallery-celebration-960.jpg` | Sunday experience | 960×640 | Youth teammates celebrating with high fives indoors. |
| `gallery/gallery-celebration-1200.webp` | Sunday experience | 1200×800 | Youth teammates celebrating with high fives indoors. |
| `gallery/gallery-celebration-1200.jpg` | Sunday experience | 1200×800 | Youth teammates celebrating with high fives indoors. |
| `venue/venue-640.webp` | Venue layout — illustrative generic facility | 640×360 | Illustration of a generic indoor soccer field; not Axe House Sports. |
| `venue/venue-640.jpg` | Venue layout — illustrative generic facility | 640×360 | Illustration of a generic indoor soccer field; not Axe House Sports. |
| `venue/venue-960.webp` | Venue layout — illustrative generic facility | 960×540 | Illustration of a generic indoor soccer field; not Axe House Sports. |
| `venue/venue-960.jpg` | Venue layout — illustrative generic facility | 960×540 | Illustration of a generic indoor soccer field; not Axe House Sports. |
| `venue/venue-1600.webp` | Venue layout — illustrative generic facility | 1600×900 | Illustration of a generic indoor soccer field; not Axe House Sports. |
| `venue/venue-1600.jpg` | Venue layout — illustrative generic facility | 1600×900 | Illustration of a generic indoor soccer field; not Axe House Sports. |
| `backgrounds/cta-640.webp` | Final registration CTA | 640×213 | Soccer shoes and ball on indoor turf. |
| `backgrounds/cta-640.jpg` | Final registration CTA | 640×213 | Soccer shoes and ball on indoor turf. |
| `backgrounds/cta-960.webp` | Final registration CTA | 960×320 | Soccer shoes and ball on indoor turf. |
| `backgrounds/cta-960.jpg` | Final registration CTA | 960×320 | Soccer shoes and ball on indoor turf. |
| `backgrounds/cta-1920.webp` | Final registration CTA | 1920×640 | Soccer shoes and ball on indoor turf. |
| `backgrounds/cta-1920.jpg` | Final registration CTA | 1920×640 | Soccer shoes and ball on indoor turf. |
| `hero/hero-mobile-640.webp` | Mobile hero | 640×853 | Youth soccer players on an indoor pitch. |
| `hero/hero-mobile-640.jpg` | Mobile hero | 640×853 | Youth soccer players on an indoor pitch. |
| `hero/hero-mobile-768.webp` | Mobile hero | 768×1024 | Youth soccer players on an indoor pitch. |
| `hero/hero-mobile-768.jpg` | Mobile hero | 768×1024 | Youth soccer players on an indoor pitch. |
| `brand/elevatepro-logo-128.webp` | Header / footer logo | 128×128 | ElevatePro Soccer League |
| `brand/elevatepro-logo-256.webp` | Header / footer logo | 256×256 | ElevatePro Soccer League |
| `brand/elevatepro-logo-512.webp` | Header / footer logo | 512×512 | ElevatePro Soccer League |
| `brand/elevatepro-logo-transparent.png` | Header and footer | 1254×1254 | ElevatePro Soccer League |
| `icons/team.svg` | Quick facts / benefits / format / awards / UI | 32×32 | (decorative; empty alt) |
| `icons/player.svg` | Quick facts / benefits / format / awards / UI | 32×32 | (decorative; empty alt) |
| `icons/calendar.svg` | Quick facts / benefits / format / awards / UI | 32×32 | (decorative; empty alt) |
| `icons/pin.svg` | Quick facts / benefits / format / awards / UI | 32×32 | (decorative; empty alt) |
| `icons/trophy.svg` | Quick facts / benefits / format / awards / UI | 32×32 | (decorative; empty alt) |
| `icons/growth.svg` | Quick facts / benefits / format / awards / UI | 32×32 | (decorative; empty alt) |
| `icons/medal.svg` | Quick facts / benefits / format / awards / UI | 32×32 | (decorative; empty alt) |
| `icons/star.svg` | Quick facts / benefits / format / awards / UI | 32×32 | (decorative; empty alt) |
| `icons/bracket.svg` | Quick facts / benefits / format / awards / UI | 32×32 | (decorative; empty alt) |
| `icons/arrow.svg` | Quick facts / benefits / format / awards / UI | 32×32 | (decorative; empty alt) |
| `icons/field.svg` | Quick facts / benefits / format / awards / UI | 32×32 | (decorative; empty alt) |
| `icons/check.svg` | Quick facts / benefits / format / awards / UI | 32×32 | (decorative; empty alt) |
| `backgrounds/angular-navy.svg` | Section backgrounds / FAQ / pricing / footer | 1600×600 | (decorative; empty alt) |
| `backgrounds/angular-ice.svg` | Section backgrounds / FAQ / pricing / footer | 1600×600 | (decorative; empty alt) |
| `backgrounds/angular-white.svg` | Section backgrounds / FAQ / pricing / footer | 1600×600 | (decorative; empty alt) |
| `icons/division-u8.svg` | Age division cards (optional) | 240×240 | U8 division |
| `icons/division-u10.svg` | Age division cards (optional) | 240×240 | U10 division |
| `icons/division-u12.svg` | Age division cards (optional) | 240×240 | U12 division |
| `icons/division-u14.svg` | Age division cards (optional) | 240×240 | U14 division |
| `brand/apple-touch-icon.png` | Browser / home-screen icon | 180×180 | (decorative; empty alt) |
| `brand/favicon.ico` | Browser favicon | 48×48 | (decorative; empty alt) |

## Additional source files

Original generated PNGs live in originals/ using the same descriptive base names. The supplied logo is brand/elevatepro-logo-original.png. The supplied mockup is reference/website-design-reference.png. These are preserved source/reference files; production assets and recommended placements are listed above.
