// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ComposerPlusMenu } from '../../src/components/ComposerPlusMenu';

afterEach(() => {
  cleanup();
});

describe('ComposerPlusMenu hidden context sources', () => {
  it('does not expose mention-inserting connector, plugin, or MCP rows', () => {
    render(
      <ComposerPlusMenu
        connectors={[{ id: 'github', name: 'GitHub', status: 'connected' } as never]}
        onPickConnector={vi.fn()}
        plugins={[{ id: 'sample-plugin', title: 'Sample Plugin', manifest: {} } as never]}
        onPickPlugin={vi.fn()}
        mcpServers={[{ id: 'slack', label: 'Slack MCP', enabled: true } as never]}
        onPickMcp={vi.fn()}
        onAttachFiles={vi.fn()}
        onImportFigma={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Add context' }));

    expect(screen.getByRole('menuitem', { name: 'Attach files' })).toBeTruthy();
    expect(screen.getByRole('menuitem', { name: 'Upload .fig file' })).toBeTruthy();
    expect(screen.queryByRole('menuitem', { name: /Connectors/i })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: /Plugins/i })).toBeNull();
    expect(screen.queryByRole('menuitem', { name: /^MCP/i })).toBeNull();
  });
});
