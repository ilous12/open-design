// @vitest-environment jsdom

// Red spec for the example-chip ↔ Community filter decoupling.
//
// The hero chip rail (Prototype / Slide deck / ...) and the Community
// grid expose the same artifact taxonomy, but they are independent
// surfaces: picking a chip drives what the composer will generate,
// while the Community pills only filter the gallery the user is
// browsing. Binding them means any chip interaction (including the
// default active chip on first paint) silently rewrites the user's
// browsing filter — so the gallery must stay on its own selection.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HomeView } from '../../src/components/HomeView';
import { I18nProvider } from '../../src/i18n';
import { homeHeroPromptText } from '../helpers/home-hero-lexical';

describe('HomeView community filter decoupling', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('renders Home references as an unfiltered gallery without category pills', async () => {
    render(
      <I18nProvider initial="en">
        <HomeView
          projects={[]}
          onSubmit={() => undefined}
          onOpenProject={() => undefined}
          onViewAllProjects={() => undefined}
        />
      </I18nProvider>,
    );

    // The Reference grid no longer exposes All/Prototype category pills and
    // must remain a plain gallery.
    await waitFor(() => {
      expect(screen.getByTestId('plugins-home-details-uupm-ai-chatbot-platform')).toBeTruthy();
    });
    expect(screen.queryByTestId('plugins-home-row-category')).toBeNull();
    expect(screen.queryByTestId('plugins-home-pill-category-all')).toBeNull();
    expect(screen.queryByTestId('plugins-home-pill-category-prototype')).toBeNull();

    const remixButton = screen.getByTestId('plugins-home-duplicate-uupm-ai-chatbot-platform');
    const useButton = screen.getByTestId('plugins-home-use-uupm-ai-chatbot-platform');
    expect(
      remixButton.compareDocumentPosition(useButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('seeds the composer from a Home reference card', async () => {
    render(
      <I18nProvider initial="en">
        <HomeView
          projects={[]}
          onSubmit={() => undefined}
          onOpenProject={() => undefined}
          onViewAllProjects={() => undefined}
        />
      </I18nProvider>,
    );

    fireEvent.click(await screen.findByTestId('plugins-home-use-uupm-ai-chatbot-platform'));

    await waitFor(() => {
      expect(homeHeroPromptText()).toContain('AI chatbot platform landing page');
      expect(homeHeroPromptText()).toContain(
        'Local reference file: apps/web/public/reference-remix/ai-chatbot-platform/index.html',
      );
      expect(homeHeroPromptText()).not.toContain('https://ui-ux-pro-max-skill.nextlevelbuilder.io');
    });
  });

  it('remixes a Home reference without seeding a default pending prompt', async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
      const path = String(url);
      if (path === '/api/plugins') {
        return new Response(JSON.stringify({ plugins: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      if (path === '/api/reference-remix/ai-chatbot-platform/duplicate-project') {
        return new Response(JSON.stringify({
          ok: true,
          projectId: 'project-reference',
          conversationId: 'conversation-reference',
          relPath: 'index.html',
          project: { id: 'project-reference' },
          sourcePluginId: 'reference-remix:ai-chatbot-platform',
          sourceEntry: 'reference-remix/ai-chatbot-platform/index.html',
          copiedFiles: 1,
          skippedFiles: 0,
          warnings: [],
        }), {
          status: 201,
          headers: { 'content-type': 'application/json' },
        });
      }
      throw new Error(`unexpected fetch ${path}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    const onOpenProject = vi.fn();

    render(
      <I18nProvider initial="en">
        <HomeView
          projects={[]}
          onSubmit={() => undefined}
          onOpenProject={onOpenProject}
          onViewAllProjects={() => undefined}
        />
      </I18nProvider>,
    );

    fireEvent.click(await screen.findByTestId('plugins-home-duplicate-uupm-ai-chatbot-platform'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/reference-remix/ai-chatbot-platform/duplicate-project',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'AI Chatbot Platform' }),
        }),
      );
    });
    expect(fetchMock).not.toHaveBeenCalledWith(
      '/api/reference-remix/ai-chatbot-platform/duplicate-project',
      expect.objectContaining({
        body: expect.stringContaining('pendingPrompt'),
      }),
    );
    expect(onOpenProject).toHaveBeenCalledWith('project-reference', 'index.html');
  });

  it('opens Home reference details against the bundled local HTML clone', async () => {
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
      const path = String(url);
      if (path === '/api/plugins') {
        return new Response(JSON.stringify({ plugins: [] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      if (path === '/reference-remix/ai-chatbot-platform/index.html') {
        return new Response('<!doctype html><html><head></head><body><main>AI chatbot local clone</main></body></html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        });
      }
      throw new Error(`unexpected fetch ${path}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <I18nProvider initial="en">
        <HomeView
          projects={[]}
          onSubmit={() => undefined}
          onOpenProject={() => undefined}
          onViewAllProjects={() => undefined}
        />
      </I18nProvider>,
    );

    fireEvent.click(await screen.findByTestId('plugins-home-details-uupm-ai-chatbot-platform'));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/reference-remix/ai-chatbot-platform/index.html',
        { cache: 'no-store' },
      );
    });
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByTestId('plugin-details-use-uupm-ai-chatbot-platform').textContent).toBe('Remix');
    fireEvent.click(screen.getByTestId('plugin-details-use-uupm-ai-chatbot-platform-menu'));
    expect(screen.getByTestId('plugin-details-use-option-uupm-ai-chatbot-platform').textContent).toBe('Use');
    expect(screen.queryByText('Share')).toBeNull();
    expect(screen.queryByText('Plugin info')).toBeNull();
  });
});
