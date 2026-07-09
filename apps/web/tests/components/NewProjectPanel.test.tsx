// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isOpenDesignHostAvailable, pickHostWorkingDir } from '@nn-design/host';
import {
  buildDesignSystemCreateSelection,
  defaultDesignSystemSelection,
  NewProjectPanel,
} from '../../src/components/NewProjectPanel';
import { openFolderDialog } from '../../src/providers/registry';
import type { DesignSystemSummary, ProjectTemplate, SkillSummary } from '../../src/types';

vi.mock('@nn-design/host', async () => {
  const actual = await vi.importActual<typeof import('@nn-design/host')>('@nn-design/host');
  return {
    ...actual,
    isOpenDesignHostAvailable: vi.fn(),
    pickHostWorkingDir: vi.fn(),
  };
});

vi.mock('../../src/providers/registry', async () => {
  const actual = await vi.importActual<typeof import('../../src/providers/registry')>(
    '../../src/providers/registry',
  );
  return {
    ...actual,
    openFolderDialog: vi.fn(),
  };
});

const mockedIsHostAvailable = vi.mocked(isOpenDesignHostAvailable);
const mockedPickHostWorkingDir = vi.mocked(pickHostWorkingDir);
const mockedOpenFolderDialog = vi.mocked(openFolderDialog);

const skills: SkillSummary[] = [
  {
    id: 'prototype-skill',
    name: 'Prototype',
    description: 'Build prototypes',
    mode: 'prototype',
    surface: 'web',
    previewType: 'html',
    designSystemRequired: true,
    defaultFor: ['prototype'],
    triggers: [],
    upstream: null,
    hasBody: true,
    examplePrompt: 'Build a prototype.',
    aggregatesExamples: false,
  },
];

const designSystems: DesignSystemSummary[] = [
  {
    id: 'clay',
    title: 'Clay',
    summary: 'Friendly tactile product UI.',
    category: 'Product',
    swatches: ['#f4efe7', '#25211d'],
    source: 'built-in',
    status: 'published',
  },
  {
    id: 'noir',
    title: 'Editorial Noir',
    summary: 'High-contrast editorial system.',
    category: 'Editorial',
    swatches: ['#111111', '#f7f0e8'],
    source: 'built-in',
    status: 'published',
  },
  {
    id: 'user:draft-system',
    title: 'Draft Personal DS',
    summary: 'Should not be selectable for project creation.',
    category: 'Personal',
    swatches: ['#663399', '#faf7ff'],
    source: 'user',
    isEditable: true,
    status: 'draft',
  },
];

const templates: ProjectTemplate[] = [
  {
    id: 'tmpl-landing',
    name: 'Landing Page',
    description: 'A saved landing page starter.',
    files: [{ name: 'prototype/App.jsx', path: 'prototype/App.jsx' }],
    createdAt: '2026-05-07T00:00:00.000Z',
  },
];

afterEach(() => {
  cleanup();
  globalThis.ResizeObserver = originalResizeObserver;
  Element.prototype.scrollIntoView = originalScrollIntoView;
  vi.unstubAllGlobals();
});

const originalResizeObserver = globalThis.ResizeObserver;
const originalScrollIntoView = Element.prototype.scrollIntoView;

class ResizeObserverMock {
  observe() {}
  disconnect() {}
  unobserve() {}
}

beforeEach(() => {
  globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
  Element.prototype.scrollIntoView = vi.fn();
  vi.clearAllMocks();
  mockedIsHostAvailable.mockReturnValue(false);
  mockedOpenFolderDialog.mockResolvedValue(null);
});

describe('NewProjectPanel design system defaults', () => {
  it('uses the configured default design system when it exists in the catalog', () => {
    expect(defaultDesignSystemSelection('clay', designSystems)).toEqual(['clay']);
    expect(defaultDesignSystemSelection('missing', designSystems)).toEqual([]);
    expect(defaultDesignSystemSelection(null, designSystems)).toEqual([]);
  });

  it('shows the configured default design system as the active project selection', () => {
    const markup = renderToStaticMarkup(
      <NewProjectPanel
        skills={skills}
        designSystems={designSystems}
        defaultDesignSystemId="clay"
        templates={[]}
        onDeleteTemplate={vi.fn()}
        promptTemplates={[]}
        onCreate={vi.fn()}
      />,
    );

    expect(markup).toContain('Clay');
    expect(markup).toContain('Default');
    expect(markup).not.toContain('Freeform');
  });

  it('filters draft personal design systems out of the new project picker', () => {
    render(
      <NewProjectPanel
        skills={skills}
        designSystems={designSystems}
        defaultDesignSystemId="clay"
        templates={[]}
        onDeleteTemplate={vi.fn()}
        promptTemplates={[]}
        onCreate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId('design-system-trigger'));

    expect(screen.queryByRole('option', { name: /Draft Personal DS/i })).toBeNull();
    expect(screen.getByRole('option', { name: /Clay/i })).toBeTruthy();
    expect(screen.getByRole('option', { name: /Editorial Noir/i })).toBeTruthy();
  });

  it('keeps media project creation from inheriting a hidden design system pick', () => {
    expect(buildDesignSystemCreateSelection(true, ['clay', 'bmw'])).toEqual({
      primary: 'clay',
      inspirations: ['bmw'],
    });
    expect(buildDesignSystemCreateSelection(false, ['clay', 'bmw'])).toEqual({
      primary: null,
      inspirations: [],
    });
  });

  it('offers prototype as the only new project type and locks high fidelity defaults', () => {
    const onCreate = vi.fn();
    render(
      <NewProjectPanel
        skills={skills}
        designSystems={designSystems}
        defaultDesignSystemId="clay"
        templates={[]}
        onDeleteTemplate={vi.fn()}
        promptTemplates={[]}
        onCreate={onCreate}
      />,
    );

    fireEvent.change(screen.getByTestId('new-project-name'), {
      target: { value: 'Prototype payload' },
    });

    expect(screen.getByRole('tab', { name: 'Prototype' })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: 'Slide deck' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'Mobile app' })).toBeNull();
    expect(screen.queryByRole('tab', { name: 'From template' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Wireframe' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'High fidelity' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Responsive web/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /OS widgets/i })).toBeNull();

    fireEvent.click(screen.getByTestId('create-project'));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Prototype payload',
        designSystemId: 'clay',
        metadata: expect.objectContaining({
          kind: 'prototype',
          fidelity: 'high-fidelity',
          platform: 'responsive',
          platformTargets: ['responsive'],
        }),
      }),
    );
    expect(onCreate.mock.calls[0]?.[0].metadata).not.toHaveProperty('includeOsWidgets');
  });

  it('ignores non-prototype initial tabs when opening the panel', () => {
    const onCreate = vi.fn();
    render(
      <NewProjectPanel
        skills={skills}
        designSystems={designSystems}
        defaultDesignSystemId="clay"
        templates={[]}
        initialTab="deck"
        promptTemplates={[]}
        onCreate={onCreate}
      />,
    );

    fireEvent.change(screen.getByTestId('new-project-name'), {
      target: { value: 'Initial tab payload' },
    });
    expect(screen.getByRole('tab', { name: 'Prototype' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.queryByRole('tab', { name: 'Slide deck' })).toBeNull();

    fireEvent.click(screen.getByTestId('create-project'));

    const payload = onCreate.mock.calls[0]?.[0];
    expect(payload.metadata).toEqual(
      expect.objectContaining({
        kind: 'prototype',
        fidelity: 'high-fidelity',
        platform: 'responsive',
        platformTargets: ['responsive'],
      }),
    );
    expect(payload.metadata).not.toHaveProperty('includeOsWidgets');
  });

  it('hides the target platform multi-select', () => {
    render(
      <NewProjectPanel
        skills={skills}
        designSystems={designSystems}
        defaultDesignSystemId="clay"
        templates={[]}
        promptTemplates={[]}
        onCreate={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: /Responsive web/i })).toBeNull();
    expect(screen.queryByRole('listbox', { name: 'Target platforms' })).toBeNull();
  });

  it('clears design system metadata when freeform is selected in multi mode', () => {
    const onCreate = vi.fn();
    render(
      <NewProjectPanel
        skills={skills}
        designSystems={designSystems}
        defaultDesignSystemId="clay"
        templates={[]}
        onDeleteTemplate={vi.fn()}
        promptTemplates={[]}
        onCreate={onCreate}
      />,
    );

    fireEvent.change(screen.getByTestId('new-project-name'), {
      target: { value: 'Freeform prototype' },
    });
    fireEvent.click(screen.getByTestId('design-system-trigger'));
    fireEvent.click(screen.getByRole('tab', { name: 'Multi' }));
    fireEvent.click(screen.getByRole('option', { name: /Editorial Noir/i }));
    expect(screen.getByTestId('design-system-trigger').textContent).toContain('Clay');
    expect(screen.getByTestId('design-system-trigger').textContent).toContain('+1');

    fireEvent.click(screen.getByRole('option', { name: /None — freeform/i }));
    expect(screen.getByTestId('design-system-trigger').textContent).toContain('None — freeform');
    expect(screen.getByTestId('design-system-trigger').textContent ?? '').not.toContain('+');

    fireEvent.click(screen.getByTestId('create-project'));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Freeform prototype',
        designSystemId: null,
        metadata: expect.not.objectContaining({
          inspirationDesignSystemIds: expect.anything(),
        }),
      }),
    );
  });

  it('falls back to the generated default title when the prototype name is blank', () => {
    const onCreate = vi.fn();
    render(
      <NewProjectPanel
        skills={skills}
        designSystems={designSystems}
        defaultDesignSystemId={null}
        templates={[]}
        onDeleteTemplate={vi.fn()}
        promptTemplates={[]}
        onCreate={onCreate}
      />,
    );

    fireEvent.change(screen.getByTestId('new-project-name'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByTestId('create-project'));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.stringMatching(/^Prototype\b/),
        metadata: expect.objectContaining({
          kind: 'prototype',
          fidelity: 'high-fidelity',
        }),
      }),
    );
  });

  it('keeps hidden creation modes unavailable from the tab list', () => {
    render(
      <NewProjectPanel
        skills={skills}
        designSystems={designSystems}
        defaultDesignSystemId="clay"
        templates={templates}
        onDeleteTemplate={vi.fn()}
        promptTemplates={[]}
        onCreate={vi.fn()}
      />,
    );

    [
      'Slide deck',
      'Live artifact',
      'From template',
      'Media',
      'Image',
      'Video',
      'Audio',
      'Mobile app',
    ].forEach((label) => {
      expect(screen.queryByRole('tab', { name: label })).toBeNull();
    });
  });
});

describe('NewProjectPanel working directory picker', () => {
  it('includes a browser-picked working directory in the create payload', async () => {
    const onCreate = vi.fn();
    mockedIsHostAvailable.mockReturnValue(false);
    mockedOpenFolderDialog.mockResolvedValue('/Users/me/product-designs');

    render(
      <NewProjectPanel
        skills={skills}
        designSystems={designSystems}
        defaultDesignSystemId="clay"
        templates={templates}
        onDeleteTemplate={vi.fn()}
        promptTemplates={[]}
        onCreate={onCreate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Local storage' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /product-designs/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId('create-project'));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          userWorkingDir: '/Users/me/product-designs',
        }),
      }),
    );
    expect(mockedPickHostWorkingDir).not.toHaveBeenCalled();
  });

  it('threads the desktop host working-dir token into the create payload', async () => {
    const onCreate = vi.fn();
    mockedIsHostAvailable.mockReturnValue(true);
    mockedPickHostWorkingDir.mockResolvedValue({
      ok: true,
      baseDir: '/Users/me/host-designs',
      token: 'host-token',
    });

    render(
      <NewProjectPanel
        skills={skills}
        designSystems={designSystems}
        defaultDesignSystemId="clay"
        templates={templates}
        onDeleteTemplate={vi.fn()}
        promptTemplates={[]}
        onCreate={onCreate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Local storage' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /host-designs/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId('create-project'));

    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        userWorkingDirToken: 'host-token',
        metadata: expect.objectContaining({
          userWorkingDir: '/Users/me/host-designs',
        }),
      }),
    );
    expect(mockedOpenFolderDialog).not.toHaveBeenCalled();
  });

  it('surfaces host picker failures without falling back to an untokened browser path', async () => {
    mockedIsHostAvailable.mockReturnValue(true);
    mockedPickHostWorkingDir.mockResolvedValue({
      ok: false,
      reason: 'host build does not support pickWorkingDir',
    });

    render(
      <NewProjectPanel
        skills={skills}
        designSystems={designSystems}
        defaultDesignSystemId="clay"
        templates={templates}
        onDeleteTemplate={vi.fn()}
        promptTemplates={[]}
        onCreate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Local storage' }));

    expect(await screen.findByText(/Couldn't open the folder picker/i)).toBeTruthy();
    expect(mockedOpenFolderDialog).not.toHaveBeenCalled();
  });

  it('surfaces browser picker daemon failures with localized copy and native details', async () => {
    mockedIsHostAvailable.mockReturnValue(false);
    mockedOpenFolderDialog.mockRejectedValue(new Error('Could not open folder picker: zenity is not installed'));

    render(
      <NewProjectPanel
        skills={skills}
        designSystems={designSystems}
        defaultDesignSystemId="clay"
        templates={templates}
        onDeleteTemplate={vi.fn()}
        promptTemplates={[]}
        onCreate={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Local storage' }));

    expect(await screen.findByText('Could not open folder picker')).toBeTruthy();
    expect(await screen.findByText('zenity is not installed')).toBeTruthy();
    expect(screen.queryByText('Could not open folder picker: zenity is not installed')).toBeNull();
    expect(mockedOpenFolderDialog).toHaveBeenCalledWith({ throwOnError: true });
  });
});

describe('NewProjectPanel folder import feedback', () => {
  it('shows an error when Claude Design zip import resolves as failed', async () => {
    const onImportClaudeDesign = vi.fn().mockResolvedValue({
      ok: false,
      message: 'unsupported zip contents',
    });

    const { container } = render(
      <NewProjectPanel
        skills={skills}
        designSystems={designSystems}
        defaultDesignSystemId="clay"
        templates={templates}
        onDeleteTemplate={vi.fn()}
        promptTemplates={[]}
        onCreate={vi.fn()}
        onImportClaudeDesign={onImportClaudeDesign}
      />,
    );

    const input = container.querySelector('input[type="file"]') as HTMLInputElement | null;
    const file = new File(['zip'], 'relume.zip', { type: 'application/zip' });
    expect(input).toBeTruthy();
    fireEvent.change(input!, { target: { files: [file] } });

    expect(onImportClaudeDesign).toHaveBeenCalledWith(file);
    expect(await screen.findByText('Import failed: unsupported zip contents')).toBeTruthy();
  });

  it('shows an error when folder picker import rejects with a daemon message', async () => {
    const onImportFolder = vi.fn().mockRejectedValue(new Error('folder not found'));
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async (url) => {
      if (typeof url === 'string' && url === '/api/dialog/open-folder') {
        return new Response(
          JSON.stringify({ path: '/missing/project' }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        );
      }
      throw new Error(`unexpected fetch ${url}`);
    }));

    render(
      <NewProjectPanel
        skills={skills}
        designSystems={designSystems}
        defaultDesignSystemId="clay"
        templates={templates}
        onDeleteTemplate={vi.fn()}
        promptTemplates={[]}
        onCreate={vi.fn()}
        onImportFolder={onImportFolder}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open folder' }));

    await waitFor(() => {
      expect(onImportFolder).toHaveBeenCalledWith('/missing/project');
    });
    expect(await screen.findByText('folder not found')).toBeTruthy();
  });
});

describe('NewProjectPanel hidden template management', () => {
  beforeEach(() => {
    globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
    Element.prototype.scrollIntoView = () => {};
  });

  it('does not expose saved template deletion from the new project flow', () => {
    const onDelete = vi.fn();
    render(
      <NewProjectPanel
        skills={skills}
        designSystems={designSystems}
        defaultDesignSystemId="clay"
        templates={templates}
        onDeleteTemplate={onDelete}
        promptTemplates={[]}
        onCreate={vi.fn()}
      />,
    );

    expect(screen.queryByRole('tab', { name: 'From template' })).toBeNull();
    expect(screen.queryByLabelText(/delete template/i)).toBeNull();
    expect(onDelete).not.toHaveBeenCalled();
  });
});
