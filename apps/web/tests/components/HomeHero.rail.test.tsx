// @vitest-environment jsdom
//
// Home intent/template affordances.
// Covers the visible composer contract after hiding the "Start with a
// template" rail while preserving active template state in the footer picker.

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InstalledPluginRecord } from '@nn-design/contracts';

vi.mock('../../src/components/home-hero/PlaceholderCarousel', () => ({
  PlaceholderCarousel: () => null,
}));

import { HomeHero } from '../../src/components/HomeHero';
import {
  HOME_HERO_CHIPS,
  findChip,
} from '../../src/components/home-hero/chips';

afterEach(() => {
  cleanup();
});

function makePlugin(
  id: string,
  mode: string,
  title = id,
  extraTags: string[] = [],
  options: { query?: string | null } = {},
): InstalledPluginRecord {
  return {
    id,
    title,
    version: '1.0.0',
    sourceKind: 'bundled',
    source: '/tmp',
    trust: 'bundled',
    capabilitiesGranted: ['prompt:inject'],
    manifest: {
      name: id,
      version: '1.0.0',
      title,
      description: 'Plugin preset fixture',
      tags: [mode, ...extraTags],
      od: {
        mode,
        useCase: {
          ...(options.query !== null
            ? { query: options.query ?? `Create with {{topic}} using ${title}` }
            : {}),
        },
        inputs: [
          {
            name: 'topic',
            label: 'Topic',
            type: 'text',
            default: 'a focused brief',
          },
        ],
        preview: { type: 'image', poster: '/preview.png' },
      },
    },
    fsPath: '/tmp',
    installedAt: 0,
    updatedAt: 0,
  };
}

function renderHero(overrides: Partial<React.ComponentProps<typeof HomeHero>> = {}) {
  const onPickChip = vi.fn();
  const onPickPlugin = vi.fn();
  const onPickExamplePlugin = vi.fn();
  const onClearActiveChip = vi.fn();
  render(
    <HomeHero
      prompt=""
      onPromptChange={() => undefined}
      onSubmit={() => undefined}
      activePluginTitle={null}
      activeChipId={null}
      onClearActivePlugin={() => undefined}
      pluginOptions={[]}
      pluginsLoading={false}
      pendingPluginId={null}
      pendingChipId={null}
      onPickPlugin={onPickPlugin}
      onPickExamplePlugin={onPickExamplePlugin}
      onPickChip={onPickChip}
      onClearActiveChip={onClearActiveChip}
      contextItemCount={0}
      error={null}
      {...overrides}
    />,
  );
  return { onPickChip, onPickPlugin, onPickExamplePlugin, onClearActiveChip };
}

describe('HomeHero intent rail', () => {
  it('hides the start-with-template section and shortcut rail', () => {
    renderHero();

    expect(screen.queryByTestId('home-hero-template-section')).toBeNull();
    expect(screen.queryByText('Start with a template…')).toBeNull();
    expect(screen.queryByTestId('home-hero-type-tabs')).toBeNull();
    expect(screen.queryByTestId('home-hero-shortcuts-trigger')).toBeNull();
    for (const chip of HOME_HERO_CHIPS) {
      expect(screen.queryByTestId(`home-hero-rail-${chip.id}`)).toBeNull();
    }
  });

  it('renders execution switcher inside the input footer when provided', () => {
    renderHero({
      executionSwitcher: (
        <button type="button" data-testid="home-execution-switcher">
          Local CLI
        </button>
      ),
    });

    const switcher = screen.getByTestId('home-execution-switcher');
    const footer = switcher.closest('.home-hero__input-foot');
    expect(footer).toBeTruthy();
  });

  it('hides the template picker when a creation chip is active', () => {
    renderHero({ activeChipId: 'prototype' });
    expect(screen.queryByTestId('home-hero-type-tabs')).toBeNull();
    expect(screen.queryByTestId('home-hero-rail-mobile')).toBeNull();
    expect(screen.queryByTestId('home-hero-template-picker')).toBeNull();
    expect(screen.queryByTestId('home-hero-template-trigger')).toBeNull();
  });

  it('does not reserve an empty active-context row for a hidden chip-bound plugin', () => {
    renderHero({
      activeChipId: 'prototype',
      activePluginTitle: 'Web Prototype',
      showActivePluginChip: false,
      contextItemCount: 3,
    });

    expect(document.querySelector('.home-hero__active')).toBeNull();
    expect(screen.queryByTestId('home-hero-template-picker')).toBeNull();
    expect(screen.queryByTestId('home-hero-template-trigger')).toBeNull();
  });

  it('does not expose template clear controls on Home', () => {
    const { onClearActiveChip } = renderHero({ activeChipId: 'prototype' });
    expect(screen.queryByTestId('home-hero-template-trigger')).toBeNull();
    expect(screen.queryByTestId('home-hero-template-clear')).toBeNull();
    expect(onClearActiveChip).not.toHaveBeenCalled();
  });

  it('uses the active creation chip as the only clear control for a chip-bound plugin', () => {
    const activePlugin = makePlugin('example-prototype-a', 'prototype', 'Product prototype');
    renderHero({
      activeChipId: 'prototype',
      activePluginTitle: 'Product prototype',
      activePluginRecord: activePlugin,
      showActivePluginChip: true,
    });

    expect(screen.getByTestId('home-hero-active-plugin')).toBeTruthy();
    expect(screen.queryByTestId('home-hero-template-picker')).toBeNull();
    expect(screen.queryByTestId('home-hero-template-trigger')).toBeNull();
    expect(screen.queryByLabelText('Clear active plugin')).toBeNull();
  });

  it('keeps the active plugin clear control when no creation chip is active', () => {
    const activePlugin = makePlugin('example-prototype-a', 'prototype', 'Product prototype');
    const onClearActivePlugin = vi.fn();
    renderHero({
      activeChipId: null,
      activePluginTitle: 'Product prototype',
      activePluginRecord: activePlugin,
      onClearActivePlugin,
      showActivePluginChip: true,
    });

    const clear = screen.getByLabelText('Clear active plugin');
    fireEvent.click(clear);

    expect(onClearActivePlugin).toHaveBeenCalledTimes(1);
  });

  it('hides prompt examples below the composer for the selected tab', () => {
    const onPromptChange = vi.fn();
    renderHero({ activeChipId: 'prototype', onPromptChange });

    expect(screen.queryByTestId('home-hero-prompt-examples')).toBeNull();
    expect(screen.queryByTestId('home-hero-prompt-example')).toBeNull();
    expect(onPromptChange).not.toHaveBeenCalled();
    expect(screen.queryByTestId('home-hero-active-example')).toBeNull();
  });

  it('hides matching plugin presets in the example prompt area for the selected tab', () => {
    const prototypePlugin = makePlugin('example-prototype-a', 'prototype', 'Product prototype');
    const mobilePlugin = makePlugin('example-mobile-a', 'mobile', 'Mobile app');
    const { onPickExamplePlugin } = renderHero({
      activeChipId: 'prototype',
      pluginOptions: [prototypePlugin, mobilePlugin],
    });

    expect(screen.queryByTestId('home-hero-plugin-presets')).toBeNull();
    expect(screen.queryByTestId('home-hero-plugin-preset')).toBeNull();
    expect(onPickExamplePlugin).not.toHaveBeenCalled();
  });

  it('keeps the generic fallback in the free-form prompt instead of an Other chip', () => {
    renderHero();

    expect(findChip('other')).toBeUndefined();
    expect(screen.queryByTestId('home-hero-rail-other')).toBeNull();
  });

  it('migration chips carry the right action discriminator', () => {
    expect(findChip('create-plugin')).toBeUndefined();
    expect(findChip('figma')?.action).toMatchObject({ kind: 'apply-figma-migration' });
    expect(findChip('folder')).toBeUndefined();
    expect(findChip('template')).toBeUndefined();
  });

  it('leads the create group with the prototype chip', () => {
    const createChips = HOME_HERO_CHIPS.filter((chip) => chip.group === 'create');
    expect(createChips.map((chip) => chip.id)).toEqual(['prototype']);
  });

  it('omits removed creation categories from the home rail', () => {
    renderHero();
    for (const id of ['create-brand-kit', 'deck', 'document', 'hyperframes', 'live-artifact', 'image', 'video', 'audio', 'wireframe']) {
      expect(findChip(id)).toBeUndefined();
      expect(screen.queryByTestId(`home-hero-rail-${id}`)).toBeNull();
    }
  });

  it('prototype chip routes to its specialised bundled scenario plugin', () => {
    // Prototype now binds to web-prototype's seed template instead of
    // the generic od-new-generation router. See
    // packages/contracts/src/plugins/scenario-defaults.ts for the rationale
    // (battle-tested seed + layouts + checklist).
    expect(findChip('prototype')?.action).toMatchObject({ pluginId: 'example-web-prototype', projectKind: 'prototype' });
  });
});
