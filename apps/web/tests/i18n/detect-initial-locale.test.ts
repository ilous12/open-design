// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { detectInitialLocale } from '../../src/i18n';

const LS_KEY = 'open-design:locale';
const LS_SOURCE_KEY = 'open-design:locale-source';

function setStoredLocale(locale: string, source: 'manual' | 'untagged' = 'manual'): void {
  window.localStorage.setItem(LS_KEY, locale);
  if (source === 'manual') {
    window.localStorage.setItem(LS_SOURCE_KEY, 'manual');
  } else {
    window.localStorage.removeItem(LS_SOURCE_KEY);
  }
}

function setNavigatorLanguages(languages: readonly string[]): void {
  Object.defineProperty(window.navigator, 'languages', {
    configurable: true,
    get: () => languages,
  });
  Object.defineProperty(window.navigator, 'language', {
    configurable: true,
    get: () => languages[0] ?? 'en',
  });
}

describe('detectInitialLocale priority chain', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setNavigatorLanguages(['en-US']);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('prefers a manually-tagged localStorage pick over the Korean default', () => {
    setStoredLocale('ja', 'manual');
    setNavigatorLanguages(['fr-FR']);

    expect(detectInitialLocale()).toBe('ja');
  });

  it('ignores an untagged localStorage value and falls back to Korean', () => {
    setStoredLocale('ja', 'untagged');

    expect(detectInitialLocale()).toBe('ko');
  });

  it('falls back to Korean when an unsupported locale was stored', () => {
    setStoredLocale('xx-YY', 'manual');
    setNavigatorLanguages(['de-DE']);

    expect(detectInitialLocale()).toBe('ko');
  });

  it('uses Korean even when host or browser preferences are another supported locale', () => {
    setNavigatorLanguages(['en-US']);

    expect(detectInitialLocale()).toBe('ko');
  });

  it('falls back to Korean when nothing else is available', () => {
    setNavigatorLanguages([]);

    expect(detectInitialLocale()).toBe('ko');
  });
});
