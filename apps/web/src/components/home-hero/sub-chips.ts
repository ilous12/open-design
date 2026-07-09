// Second-level "sub-type" rail for the Home input card.
//
// After the Prototype create chip is picked, this rail surfaces a compact row
// of web/mobile sub-categories matching the Reference plugin grid.
//
// The list is NOT hand-authored here: it is derived from the same
// `SUBCATEGORIES` facet table the Community section uses
// (`plugins-home/facets.ts`), so the labels and grouping stay in lockstep.
// Picking a sub-type filters the example-prompt cards below the rail to that
// scene; it does NOT bind a plugin or stamp an active badge.

import type { InstalledPluginRecord } from '@nn-design/contracts';
import type { IconName } from '../Icon';
import {
  buildSubcategoryCatalog,
  extractSubcategories,
  type FacetOption,
} from '../plugins-home/facets';

// Parent chips that carry a second-level rail.
export type SubChipParentId = 'prototype';

export interface HomeHeroSubChip {
  // Facet subcategory slug, e.g. 'business-dashboards'.
  slug: string;
  label: string;
  icon: IconName;
}

const PARENT_IDS: readonly SubChipParentId[] = ['prototype'];

// Icon per facet subcategory slug. Falls back to a neutral glyph so a newly
// added facet still renders a pill rather than crashing.
const SUBCATEGORY_ICONS: Record<string, IconName> = {
  'app-prototypes': 'blocks',
  'landing-marketing': 'globe',
};
const DEFAULT_SUBCATEGORY_ICON: IconName = 'blocks';

export function isSubChipParent(chipId: string | null): chipId is SubChipParentId {
  return chipId === 'prototype';
}

// Sub-types for a first-level chip, drawn from the Community facet catalog so
// the labels, set, AND order match the Community section exactly. The display
// order is whatever `SUBCATEGORIES` (in `plugins-home/facets.ts`) declares for
// the parent — there is no Home-only reordering, so the two surfaces stay in
// lockstep. Only sub-categories that actually have installed plugins
// (count > 0) are surfaced. Returns [] for chips without a second-level rail.
export function subChipsForChip(
  chipId: string | null,
  plugins: InstalledPluginRecord[],
): HomeHeroSubChip[] {
  if (!isSubChipParent(chipId)) return [];
  const catalog = buildSubcategoryCatalog(plugins);
  const options: FacetOption[] = catalog[chipId] ?? [];
  return options
    .filter((option) => option.count > 0)
    .map((option) => ({
      slug: option.slug,
      label: option.label,
      icon: SUBCATEGORY_ICONS[option.slug] ?? DEFAULT_SUBCATEGORY_ICON,
    }));
}

// Narrow a list of example-prompt plugins to a chosen sub-category. The
// `parent` chip id scopes which facet subcategory table is consulted.
export function filterPluginsBySubChip(
  plugins: InstalledPluginRecord[],
  parent: SubChipParentId,
  subcategorySlug: string,
): InstalledPluginRecord[] {
  return plugins.filter((plugin) =>
    extractSubcategories(plugin, parent).includes(subcategorySlug),
  );
}

export { PARENT_IDS };
