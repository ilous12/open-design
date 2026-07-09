// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { ComposerPlusMenu } from '../../src/components/ComposerPlusMenu';
import { I18nProvider } from '../../src/i18n';
import type { Locale } from '../../src/i18n/types';

afterEach(() => {
  cleanup();
});

const CONNECTOR = { id: 'c1', name: 'Notion', status: 'connected' } as never;
const PLUGIN = { id: 'p1', title: 'Deck Maker', manifest: {} } as never;
const MCP_SERVER = { id: 'm1', label: 'Linear', enabled: true } as never;

function renderMenu(
  overrides: Partial<ComponentProps<typeof ComposerPlusMenu>> = {},
) {
  const props: ComponentProps<typeof ComposerPlusMenu> = {
    connectors: [CONNECTOR],
    onPickConnector: vi.fn(),
    plugins: [PLUGIN],
    onPickPlugin: vi.fn(),
    mcpServers: [MCP_SERVER],
    onPickMcp: vi.fn(),
    onAttachFiles: vi.fn(),
    triggerTestId: 'plus-trigger',
    ...overrides,
  };
  const view = render(
    <I18nProvider initial={'en' as Locale}>
      <ComposerPlusMenu {...props} />
    </I18nProvider>,
  );
  return { props, ...view };
}

function openMenu() {
  fireEvent.click(screen.getByTestId('plus-trigger'));
}

describe('ComposerPlusMenu visible rows', () => {
  it('shows only Attach files and Upload .fig file in the add-context menu', () => {
    renderMenu({
      onReferenceProject: vi.fn(),
      onLinkLocalCode: vi.fn(),
      onSelectFromLibrary: vi.fn(),
      onImportFigma: vi.fn(),
      onShowFigmaHelp: vi.fn(),
      onOpenDesignSystems: vi.fn(),
      onAddConnector: vi.fn(),
      onAddPlugin: vi.fn(),
      onAddMcp: vi.fn(),
      renderToolbox: () => <div>Toolbox contents</div>,
      toolboxLabel: 'Design toolbox',
    });

    openMenu();

    expect(screen.getByRole('menuitem', { name: 'Attach files' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Upload .fig file' })).toBeTruthy();

    expect(screen.queryByRole('menuitem', { name: /Reference another project/i })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: /Link local code/i })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: /Design system/i })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: /Connectors/i })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: /Plugins/i })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: /^MCP/i })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: /Design toolbox/i })).toBeNull();
    expect(screen.queryByTestId('composer-plus-figma-help')).toBeNull();
  });

  it('invokes only the remaining Attach files and Upload .fig file handlers', () => {
    const { props } = renderMenu({
      onReferenceProject: vi.fn(),
      onLinkLocalCode: vi.fn(),
      onImportFigma: vi.fn(),
      onShowFigmaHelp: vi.fn(),
      onOpenDesignSystems: vi.fn(),
    });

    openMenu();
    fireEvent.click(screen.getByTestId('composer-plus-attach'));
    expect(props.onAttachFiles).toHaveBeenCalledTimes(1);

    openMenu();
    fireEvent.click(screen.getByTestId('composer-plus-figma'));
    expect(props.onImportFigma).toHaveBeenCalledTimes(1);

    expect(props.onReferenceProject).not.toHaveBeenCalled();
    expect(props.onLinkLocalCode).not.toHaveBeenCalled();
    expect(props.onShowFigmaHelp).not.toHaveBeenCalled();
    expect(props.onOpenDesignSystems).not.toHaveBeenCalled();
  });

  it('still portals and positions the compact menu', () => {
    const originalInnerWidth = window.innerWidth;
    const originalInnerHeight = window.innerHeight;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 280 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 420 });

    try {
      renderMenu({ onImportFigma: vi.fn() });
      const trigger = screen.getByTestId('plus-trigger') as HTMLButtonElement;
      trigger.getBoundingClientRect = () =>
        ({
          x: 8,
          y: 376,
          top: 376,
          left: 8,
          right: 36,
          bottom: 404,
          width: 28,
          height: 28,
          toJSON: () => ({}),
        }) as DOMRect;

      openMenu();

      const menu = screen.getByRole('menu');
      expect(menu.parentElement).toBe(document.body);
      expect(menu.style.left).toBe('12px');
      expect(menu.style.width).toBe('208px');
      expect(menu.style.maxHeight).toBe('356px');
      expect(menu.style.top).toBe('auto');
      expect(menu.style.bottom).toBe('52px');
    } finally {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalInnerHeight });
    }
  });
});
