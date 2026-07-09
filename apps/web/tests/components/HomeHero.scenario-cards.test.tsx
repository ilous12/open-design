// @vitest-environment jsdom
//
// Scenario catalog coverage.
//   - The create rail data keeps the product-approved Web/Mobile prototype
//     choices, even though the visible start-with-template rail is hidden.
//   - The remaining create scenarios route to working scenario plugins.

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const placeholderCarouselMock = vi.hoisted(() => ({
  reportScenario: false,
  reportedScenarioId: null as string | null,
}));

vi.mock('../../src/components/home-hero/PlaceholderCarousel', () => ({
  PlaceholderCarousel: ({
    scenarios,
    active,
    onScenarioChange,
  }: {
    scenarios: Array<{ id: string; chipId?: string | null; text: string }>;
    active: boolean;
    onScenarioChange: (scenario: { id: string; chipId?: string | null; text: string }) => void;
  }) => {
    const scenario = scenarios[0];
    if (
      placeholderCarouselMock.reportScenario &&
      active &&
      scenario &&
      placeholderCarouselMock.reportedScenarioId !== scenario.id
    ) {
      placeholderCarouselMock.reportedScenarioId = scenario.id;
      queueMicrotask(() => onScenarioChange(scenario));
    }
    return null;
  },
}));

import { HomeHero } from '../../src/components/HomeHero';
import { findChip, orderedCreateChips } from '../../src/components/home-hero/chips';

afterEach(() => {
  placeholderCarouselMock.reportScenario = false;
  placeholderCarouselMock.reportedScenarioId = null;
  cleanup();
});

function renderHero(overrides: Partial<React.ComponentProps<typeof HomeHero>> = {}) {
  const props = {
    prompt: '',
    onPromptChange: () => undefined,
    onSubmit: () => undefined,
    activePluginTitle: null,
    activeChipId: null,
    onClearActivePlugin: () => undefined,
    pluginOptions: [],
    pluginsLoading: false,
    pendingPluginId: null,
    pendingChipId: null,
    onPickPlugin: () => undefined,
    onPickChip: () => undefined,
    contextItemCount: 0,
    error: null,
    ...overrides,
  } as React.ComponentProps<typeof HomeHero>;
  render(<HomeHero {...props} />);
}

describe('HomeHero scenario cards', () => {
  it('keeps the create scenario catalog to one prototype template', () => {
    const createChips = orderedCreateChips();
    expect(createChips.map((chip) => chip.id)).toEqual(['prototype']);
    expect(createChips[0]).toMatchObject({
      label: 'Web Prototype',
      description: 'Interactive web mockups',
    });
  });

  it('leads the create rail with the web prototype', () => {
    expect(orderedCreateChips()[0]?.id).toBe('prototype');
  });

  it('adds the remaining scenarios as create cards routed to a scenario plugin', () => {
    for (const id of ['prototype']) {
      expect(findChip(id)?.action.kind).toBe('apply-scenario');
    }
    expect(findChip('prototype')?.action).toMatchObject({
      pluginId: 'example-web-prototype',
      projectKind: 'prototype',
    });
  });

  it('keeps empty carousel scenario submit disabled while plugins are loading', async () => {
    placeholderCarouselMock.reportScenario = true;
    const onSubmit = vi.fn();
    const onSubmitScenario = vi.fn();
    renderHero({
      pluginsLoading: true,
      onSubmit,
      onSubmitScenario,
    });

    await waitFor(() => expect(placeholderCarouselMock.reportedScenarioId).not.toBeNull());
    const submit = screen.getByTestId('home-hero-submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onSubmitScenario).not.toHaveBeenCalled();
  });
});
