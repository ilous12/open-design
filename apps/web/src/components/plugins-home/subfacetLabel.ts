// Localized display labels for the curated prototype SUBCATEGORIES
// (`./facets.ts`). Rendering surfaces resolve visible text through the
// typed i18n dict. Unknown slugs fall back to the table's English label.

import type { useT } from '../../i18n';

export function pluginSubfacetLabel(
  slug: string,
  fallback: string,
  t: ReturnType<typeof useT>,
): string {
  switch (slug) {
    case 'app-prototypes': return t('pluginsHome.subfacet.app-prototypes');
    case 'landing-marketing': return t('pluginsHome.subfacet.landing-marketing');
    default: return fallback;
  }
}
