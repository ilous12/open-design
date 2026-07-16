import type { Locale } from '../i18n/types';
import {
  localizeDesignSystemCategory,
  localizeDesignSystemSummary,
} from '../i18n/content';
import type { DesignSystemSummary } from '../types';

type SearchableDesignSystem = {
  id: string;
  title: string;
  category?: string | null;
  summary?: string | null;
};

function compactSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

export function designSystemMatchesSearch(
  system: SearchableDesignSystem,
  query: string,
  extraFields: Array<string | null | undefined> = [],
): boolean {
  const rawQuery = query.trim().toLowerCase();
  if (!rawQuery) return true;

  const fields = [
    system.id,
    system.title,
    system.category ?? '',
    system.summary ?? '',
    ...extraFields.map((field) => field ?? ''),
  ];
  const haystack = fields.join(' ').toLowerCase();
  if (haystack.includes(rawQuery)) return true;

  const compactQuery = compactSearchText(query);
  if (!compactQuery) return false;
  return compactSearchText(fields.join(' ')).includes(compactQuery);
}

export function designSystemMatchesLocalizedSearch(
  system: DesignSystemSummary,
  query: string,
  locale: Locale,
): boolean {
  const localizedSummary = localizeDesignSystemSummary(locale, system);
  const localizedCategory = localizeDesignSystemCategory(locale, system.category);
  return designSystemMatchesSearch(system, query, [
    localizedCategory,
    localizedSummary,
  ]);
}
