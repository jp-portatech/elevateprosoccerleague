import type { Localized, Page } from './locale'

/**
 * Page titles and descriptions, applied when a visitor switches language. Keep these in
 * sync with the matching static HTML (index.html, es.html, privacy.html, es/privacy.html),
 * which is what search engines and link previews read.
 */
export const PAGE_META: Record<Page, Localized<{ title: string; description: string }>> = {
  home: {
    en: {
      title: 'Kids Indoor Soccer League in South Jordan, Utah | ElevatePro',
      description:
        'Youth indoor soccer on Sundays for U8–U14 kids and teams in South Jordan, Utah. Register a team, or a single player and we’ll place them. Starts Oct. 25.',
    },
    es: {
      title: 'Fútbol indoor para niños en South Jordan, Utah | ElevatePro',
      description:
        'Liga juvenil de fútbol indoor los domingos para niños y equipos U8–U14 en South Jordan, Utah. Inscribe a tu equipo o a un jugador. Inicia el 25 de octubre.',
    },
  },
  privacy: {
    en: {
      title: 'Privacy Policy | ElevatePro Soccer League',
      description:
        'How ElevatePro Soccer League collects, uses and protects the information families and coaches share when registering.',
    },
    es: {
      title: 'Política de privacidad | ElevatePro Soccer League',
      description:
        'Cómo ElevatePro Soccer League recopila, usa y protege la información que comparten las familias y los entrenadores al inscribirse.',
    },
  },
}
