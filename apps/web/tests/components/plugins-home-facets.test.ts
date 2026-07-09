// Facet derivation contract for the plugins-home filter row. The
// reference section is intentionally narrowed to web and mobile prototypes.

import { describe, expect, it } from 'vitest';
import type { InstalledPluginRecord } from '@nn-design/contracts';
import {
  applyFacetSelection,
  buildFacetCatalog,
  extractCategories,
  extractSubcategories,
  isFeaturedPlugin,
  resolveDefaultSelection,
} from '../../src/components/plugins-home/facets';

function fixture(overrides: {
  id: string;
  title?: string;
  tags?: string[];
  od?: Record<string, unknown>;
}): InstalledPluginRecord {
  return {
    id: overrides.id,
    title: overrides.title ?? overrides.id,
    version: '0.1.0',
    sourceKind: 'bundled',
    source: '/tmp',
    trust: 'bundled',
    capabilitiesGranted: ['prompt:inject'],
    manifest: {
      name: overrides.id,
      version: '0.1.0',
      ...(overrides.tags ? { tags: overrides.tags } : {}),
      ...(overrides.od ? { od: overrides.od } : {}),
    },
    fsPath: '/tmp',
    installedAt: 0,
    updatedAt: 0,
  };
}

describe('extractCategories', () => {
  it('keeps only prototype generation mode in the primary tab set', () => {
    expect(extractCategories(fixture({ id: 'prototype', od: { mode: 'prototype' } }))).toEqual(['prototype']);
    expect(extractCategories(fixture({ id: 'deck', od: { mode: 'deck' } }))).toEqual([]);
    expect(extractCategories(fixture({ id: 'image', od: { mode: 'image' } }))).toEqual([]);
    expect(extractCategories(fixture({ id: 'video', od: { mode: 'video' } }))).toEqual([]);
    expect(extractCategories(fixture({ id: 'audio', od: { mode: 'audio' } }))).toEqual([]);
  });

  it('keeps non-prototype workflow and design-system plugins out of primary tabs', () => {
    expect(extractCategories(fixture({ id: 'design-system', od: { mode: 'design-system' } }))).toEqual([]);
    expect(extractCategories(fixture({ id: 'import', od: { taskKind: 'figma-migration', mode: 'scenario' } }))).toEqual([]);
    expect(extractCategories(fixture({ id: 'export', tags: ['export', 'react'], od: { mode: 'export' } }))).toEqual([]);
    expect(extractCategories(fixture({ id: 'utility', od: { mode: 'utility' } }))).toEqual([]);
  });

  it('normalises mode casing / formatting via slugify before matching', () => {
    expect(extractCategories(fixture({ id: 'a', od: { mode: 'Prototype' } }))).toEqual(['prototype']);
    expect(extractCategories(fixture({ id: 'b', od: { mode: 'slide_deck' } }))).toEqual([]);
  });
});

describe('extractSubcategories', () => {
  it('maps prototype templates to web or mobile buckets only', () => {
    expect(extractSubcategories(fixture({ id: 'app', tags: ['mobile-app'], od: { mode: 'prototype' } }))).toEqual(['app-prototypes']);
    expect(extractSubcategories(fixture({ id: 'landing', tags: ['saas-landing'], od: { mode: 'prototype' } }))).toEqual(['landing-marketing']);
  });

  it('does not expose old dashboard, document, brand, deck, image, video, or audio buckets', () => {
    expect(extractSubcategories(fixture({ id: 'dashboard', tags: ['dashboard'], od: { mode: 'prototype' } }))).toEqual([]);
    expect(extractSubcategories(fixture({ id: 'brand', tags: ['wireframe'], od: { mode: 'prototype' } }))).toEqual([]);
    expect(extractSubcategories(fixture({ id: 'deck', tags: ['pitch-deck'], od: { mode: 'deck' } }))).toEqual([]);
    expect(extractSubcategories(fixture({ id: 'image', tags: ['profile-avatar'], od: { mode: 'image' } }))).toEqual([]);
    expect(extractSubcategories(fixture({ id: 'video', tags: ['cinematic'], od: { mode: 'video' } }))).toEqual([]);
    expect(extractSubcategories(fixture({ id: 'audio', od: { mode: 'audio' } }))).toEqual([]);
  });

  it('keeps mobile matching ahead of web when tags overlap', () => {
    expect(
      extractSubcategories(fixture({ id: 'mobile-web', tags: ['mobile-app', 'landing-page'], od: { mode: 'prototype' } })),
    ).toEqual(['app-prototypes']);
  });
});

describe('buildFacetCatalog', () => {
  it('produces the prototype primary tab and web/mobile subcategory order', () => {
    const catalog = buildFacetCatalog([
      fixture({ id: 'prototype-web', tags: ['landing-page'], od: { mode: 'prototype' } }),
      fixture({ id: 'prototype-mobile', tags: ['mobile-app'], od: { mode: 'prototype' } }),
      fixture({ id: 'deck', tags: ['pitch-deck'], od: { mode: 'deck' } }),
      fixture({ id: 'image', tags: ['profile-avatar'], od: { mode: 'image' } }),
    ]);

    expect(catalog.category.map((o) => [o.slug, o.count])).toEqual([['prototype', 2]]);
    expect((catalog.subcategory.prototype ?? []).map((o) => [o.slug, o.count])).toEqual([
      ['landing-marketing', 1],
      ['app-prototypes', 1],
    ]);
  });
});

describe('applyFacetSelection', () => {
  const plugins = [
    fixture({ id: 'prototype-web', tags: ['landing-page'], od: { mode: 'prototype' } }),
    fixture({ id: 'prototype-mobile', tags: ['mobile-app'], od: { mode: 'prototype' } }),
    fixture({ id: 'deck', tags: ['pitch-deck'], od: { mode: 'deck' } }),
    fixture({ id: 'image', tags: ['profile-avatar'], od: { mode: 'image' } }),
  ];

  it('returns everything when no category is selected', () => {
    expect(
      applyFacetSelection(plugins, { category: null, subcategory: null }).map((p) => p.id),
    ).toEqual(['prototype-web', 'prototype-mobile', 'deck', 'image']);
  });

  it('filters by the prototype category and web/mobile subcategory slugs', () => {
    expect(
      applyFacetSelection(plugins, { category: 'prototype', subcategory: null }).map((p) => p.id),
    ).toEqual(['prototype-web', 'prototype-mobile']);
    expect(
      applyFacetSelection(plugins, { category: 'prototype', subcategory: 'landing-marketing' }).map((p) => p.id),
    ).toEqual(['prototype-web']);
    expect(
      applyFacetSelection(plugins, { category: 'prototype', subcategory: 'app-prototypes' }).map((p) => p.id),
    ).toEqual(['prototype-mobile']);
  });
});

describe('isFeaturedPlugin', () => {
  it('returns true for boolean featured picks and numeric curator ranks', () => {
    expect(isFeaturedPlugin(fixture({ id: 'a', od: { featured: true } }))).toBe(true);
    expect(isFeaturedPlugin(fixture({ id: 'ranked', od: { featured: 4 } }))).toBe(true);
    expect(isFeaturedPlugin(fixture({ id: 'b', od: { featured: 'true' } }))).toBe(false);
    expect(isFeaturedPlugin(fixture({ id: 'c' }))).toBe(false);
  });
});

describe('resolveDefaultSelection', () => {
  it('defaults the home catalog to Prototype when that bucket exists', () => {
    const catalog = buildFacetCatalog([
      fixture({ id: 'slides', od: { mode: 'deck' } }),
      fixture({ id: 'prototype', od: { mode: 'prototype' } }),
    ]);

    expect(resolveDefaultSelection(catalog)).toEqual({
      category: 'prototype',
      subcategory: null,
    });
  });
});
