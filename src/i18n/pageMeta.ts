import type { Localized, Page } from './locale'

/**
 * Page titles and descriptions, applied when a visitor switches language. Keep these in
 * sync with the matching static HTML (index.html, es.html, privacy.html, es/privacy.html),
 * which is what search engines and link previews read.
 */
export const PAGE_META: Record<Page, Localized<{ title: string; description: string }>> = {
  home: {
    en: {
      title: 'ElevatePro Soccer League | Youth Indoor Soccer in South Jordan, Utah',
      description:
        'Competitive Sunday indoor soccer for U8–U14 players and teams at Axe House Sports in South Jordan, Utah. Season starts October 25, 2026. Register a team, or register a player individually and ElevatePro will place them on a team.',
    },
    es: {
      title: 'ElevatePro Soccer League | Fútbol juvenil bajo techo en South Jordan, Utah',
      description:
        'Fútbol competitivo bajo techo los domingos para jugadores y equipos U8–U14 en Axe House Sports, South Jordan, Utah. La temporada inicia el 25 de octubre de 2026. Inscribe a tu equipo, o inscribe a un jugador de forma individual y ElevatePro le asignará un equipo.',
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
