import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import {
  HOME_REFERENCE_PLUGINS,
  HOME_WEBSITE_REFERENCES,
  homeReferenceSlugFromPluginId,
  homeReferencePrompt,
  homeReferenceCloneUrl,
  isHomeReferencePlugin,
} from '../../src/components/home-reference-plugins';
import { canDuplicatePluginPreview } from '../../src/components/plugins-home/duplicate';
import {
  extractCategories,
  extractSubcategories,
} from '../../src/components/plugins-home/facets';
import { inferPluginPreview } from '../../src/components/plugins-home/preview';

describe('HOME_REFERENCE_PLUGINS', () => {
  it('exposes the 39 website references as home gallery records', () => {
    expect(HOME_WEBSITE_REFERENCES).toHaveLength(39);
    expect(HOME_REFERENCE_PLUGINS).toHaveLength(39);
    expect(new Set(HOME_REFERENCE_PLUGINS.map((record) => record.id)).size).toBe(39);
    expect(new Set(HOME_REFERENCE_PLUGINS.map((record) => record.manifest.homepage)).size).toBe(39);
  });

  it('marks every record as a web prototype reference with an image preview', () => {
    for (const record of HOME_REFERENCE_PLUGINS) {
      expect(isHomeReferencePlugin(record)).toBe(true);
      expect(extractCategories(record)).toEqual(['prototype']);
      expect(extractSubcategories(record, 'prototype')).toEqual(['landing-marketing']);
      expect(inferPluginPreview(record)).toMatchObject({
        kind: 'media',
        mediaType: 'image',
        imageOnly: true,
      });
      expect(record.manifest.homepage).toBe(homeReferenceCloneUrl(record.id.replace(/^uupm-/, '')));
      expect(record.source).toBe(record.manifest.homepage);
      expect(canDuplicatePluginPreview(record)).toBe(true);
      expect(homeReferenceSlugFromPluginId(record.id)).toBe(record.id.replace(/^uupm-/, ''));
      expect(record.manifest.od?.preview?.poster).toMatch(/^\/reference-remix\/_thumbnails\/.+\.png$/);
      const prompt = homeReferencePrompt(record);
      expect(prompt).toContain('로컬 레퍼런스 파일: apps/web/public/reference-remix/');
      expect(prompt).toContain('앱 내 로컬 HTML 복제본을 기준으로 리믹스해 주세요.');
      expect(prompt).toContain('원본 외부 레퍼런스 URL을 가져오거나, 인용하거나, 의존하지 마세요.');
      expect(prompt).not.toMatch(/\b(Create|Design|Build)\b.*\blanding page\b/i);
      expect(prompt).not.toContain('Reference clone id:');
      expect(prompt).not.toContain('Local reference file:');
      expect(prompt).not.toContain('Do not fetch');
      expect(homeReferencePrompt(record)).not.toContain('https://ui-ux-pro-max-skill.nextlevelbuilder.io/demo/');
    }
  });

  it('ships each remix reference as rendered static HTML, not an empty React shell', () => {
    for (const reference of HOME_WEBSITE_REFERENCES) {
      const htmlPath = path.resolve(
        process.cwd(),
        'public/reference-remix',
        reference.slug,
        'index.html',
      );
      const html = fs.readFileSync(htmlPath, 'utf8');
      const body = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1] ?? '';
      const bodyTextLength = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;

      expect(html).toContain('data-reference-remix-static="true"');
      expect(html).not.toContain('<div id="root"></div>');
      expect(html).not.toMatch(/<script\b/i);
      expect(html).not.toMatch(/<link\b[^>]*\brel=["']stylesheet["']/i);
      expect(html).toContain('data-reference-remix-stylesheet=');
      expect(html).not.toContain('/reference-remix/_uupm-assets/');
      expect(html).toContain('../_uupm-assets/');
      expect(bodyTextLength).toBeGreaterThan(300);
    }
  });
});
