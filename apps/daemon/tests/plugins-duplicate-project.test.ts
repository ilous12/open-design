import express from 'express';
import type http from 'node:http';
import { access, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InstalledPluginRecord, Project } from '@nn-design/contracts';
import { duplicatePluginExampleIntoProject } from '../src/plugins/duplicate-project.js';
import { registerPluginRoutes } from '../src/routes/plugins/index.js';

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

async function makeTempRoot(prefix: string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), prefix));
  tempRoots.push(dir);
  return dir;
}

async function makePreviewPlugin(root: string, id = 'duplicate-fixture'): Promise<InstalledPluginRecord> {
  const pluginRoot = path.join(root, id);
  await mkdir(path.join(pluginRoot, 'preview'), { recursive: true });
  await writeFile(
    path.join(pluginRoot, 'preview', 'index.html'),
    '<!doctype html><html><body><h1>Duplicable</h1></body></html>',
    'utf8',
  );
  return {
    id,
    title: 'Duplicate Fixture',
    fsPath: pluginRoot,
    manifest: {
      name: id,
      title: 'Duplicate Fixture',
      od: { preview: { entry: 'preview/index.html' } },
    },
  } as InstalledPluginRecord;
}

async function expectMissing(pathname: string): Promise<void> {
  await expect(access(pathname)).rejects.toMatchObject({ code: 'ENOENT' });
}

describe('plugin project duplication', () => {
  it('copies bundled reference remix HTML into a new editable project', async () => {
    const root = await makeTempRoot('od-reference-remix-route-');
    const projectsRoot = path.join(root, 'projects');
    const referenceRoot = path.join(root, 'reference-remix');
    await mkdir(path.join(referenceRoot, 'ai-chatbot-platform'), { recursive: true });
    await writeFile(
      path.join(referenceRoot, 'ai-chatbot-platform', 'index.html'),
      [
        '<!doctype html>',
        '<html data-reference-remix-static="true">',
        '<head>',
        '<link rel="icon" href="../_uupm-assets/logo.svg">',
        '<style data-reference-remix-stylesheet="../_uupm-assets/assets/index.css">body{color:red}</style>',
        '</head>',
        '<body><main><h1>AI Chatbot Platform</h1></main></body>',
        '</html>',
      ].join(''),
      'utf8',
    );

    const projectId = 'reference-project';
    const project = {
      id: projectId,
      name: 'AI Chatbot Platform',
      skillId: null,
      designSystemId: null,
      pendingPrompt: null,
      metadata: { kind: 'prototype' },
      createdAt: 1,
      updatedAt: 1,
      archivedAt: null,
      lastOpenedAt: null,
      order: 0,
      conversationCount: 0,
      hasActiveRun: false,
    } as unknown as Project;
    const insertedProjects: unknown[] = [];
    const db = {
      prepare: () => ({
        all: () => [],
        get: () => null,
        run: () => undefined,
      }),
    };
    const app = express();
    app.use(express.json());
    registerPluginRoutes(app, {
      db,
      paths: {
        PROJECTS_DIR: projectsRoot,
        PLUGIN_REGISTRY_ROOTS: [],
        PLUGIN_LOCKFILE_PATH: path.join(root, 'plugins.lock'),
        REFERENCE_REMIX_DIRS: [referenceRoot],
      },
      ids: {
        randomId: vi.fn()
          .mockReturnValueOnce(projectId)
          .mockReturnValueOnce('reference-conversation'),
      },
      projectStore: {
        insertProject: vi.fn((_db, row) => {
          insertedProjects.push(row);
          return project;
        }),
        getProject: vi.fn(() => project),
        dbDeleteProject: vi.fn(),
        removeProjectDir: async (rootDir: string, id: string) => {
          await rm(path.join(rootDir, id), { recursive: true, force: true });
        },
      },
      conversations: {
        insertConversation: vi.fn(() => undefined),
      },
      plugins: {
        getInstalledPlugin: vi.fn(() => null),
        listInstalledPlugins: vi.fn(() => []),
      },
      helpers: {
        requireLocalDaemonRequest: ((_req, _res, next) => next()) as express.RequestHandler,
        assembleExample: (templateHtml: string) => templateHtml,
        applyBakedPreviews: (records: unknown[]) => records,
      },
    } as unknown as Parameters<typeof registerPluginRoutes>[1]);
    const server = await listen(app);
    try {
      const resp = await fetch(
        `${server.url}/api/reference-remix/ai-chatbot-platform/duplicate-project`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: 'AI Chatbot Platform',
            pendingPrompt: 'Remix this local AI chatbot reference into an editable project.',
          }),
        },
      );
      expect(resp.status).toBe(201);
      const body = (await resp.json()) as { projectId?: string; relPath?: string; sourceEntry?: string };
      expect(body).toMatchObject({
        projectId,
        relPath: 'index.html',
        sourceEntry: 'reference-remix/ai-chatbot-platform/index.html',
      });
      const copied = await readFile(path.join(projectsRoot, projectId, 'index.html'), 'utf8');
      expect(copied).toContain('AI Chatbot Platform');
      expect(copied).toContain('data-reference-remix-project-copy="true"');
      expect(copied).not.toContain('../_uupm-assets/logo.svg');
      expect(insertedProjects[0]).toMatchObject({
        pendingPrompt: 'Remix this local AI chatbot reference into an editable project.',
        metadata: {
          entryFile: 'index.html',
          duplicatedFromReferenceRemixSlug: 'ai-chatbot-platform',
          duplicatedFromReferenceRemixEntry: 'reference-remix/ai-chatbot-platform/index.html',
        },
      });
    } finally {
      await close(server.server);
    }
  });

  it.skipIf(process.platform === 'win32')(
    'rejects duplicates that would skip a required symlinked file',
    async () => {
      const root = await makeTempRoot('od-plugin-duplicate-helper-');
      const projectsRoot = path.join(root, 'projects');
      const plugin = await makePreviewPlugin(root);
      await writeFile(path.join(plugin.fsPath, 'preview', 'target.txt'), 'asset', 'utf8');
      await symlink('target.txt', path.join(plugin.fsPath, 'preview', 'linked.txt'));

      await expect(
        duplicatePluginExampleIntoProject({
          plugin,
          projectsRoot,
          projectId: 'symlink-project',
          metadata: { kind: 'prototype' },
          assembleExample: (templateHtml) => templateHtml,
        }),
      ).rejects.toMatchObject({
        status: 422,
        code: 'DUPLICATE_COPY_INCOMPLETE',
      });
    },
  );

  it('rolls back project rows and files when conversation creation fails after copying files', async () => {
    const root = await makeTempRoot('od-plugin-duplicate-route-');
    const projectsRoot = path.join(root, 'projects');
    const plugin = await makePreviewPlugin(root, 'route-duplicate-fixture');
    const projectId = 'route-duplicate-project';
    const project = {
      id: projectId,
      name: 'Route Duplicate Fixture',
      skillId: null,
      designSystemId: null,
      pendingPrompt: null,
      metadata: { kind: 'prototype' },
      createdAt: 1,
      updatedAt: 1,
      archivedAt: null,
      lastOpenedAt: null,
      order: 0,
      conversationCount: 0,
      hasActiveRun: false,
    } as unknown as Project;
    const db = {
      prepare: () => ({
        all: () => [],
        get: () => null,
        run: () => undefined,
      }),
    };
    const dbDeleteProject = vi.fn();
    const app = express();
    app.use(express.json());
    registerPluginRoutes(app, {
      db,
      paths: {
        PROJECTS_DIR: projectsRoot,
        PLUGIN_REGISTRY_ROOTS: [],
        PLUGIN_LOCKFILE_PATH: path.join(root, 'plugins.lock'),
      },
      ids: {
        randomId: vi.fn()
          .mockReturnValueOnce(projectId)
          .mockReturnValueOnce('route-duplicate-conversation'),
      },
      projectStore: {
        insertProject: vi.fn(() => project),
        getProject: vi.fn(() => project),
        dbDeleteProject,
        removeProjectDir: async (rootDir: string, id: string) => {
          await rm(path.join(rootDir, id), { recursive: true, force: true });
        },
      },
      conversations: {
        insertConversation: vi.fn(() => {
          throw new Error('conversation insert failed');
        }),
      },
      plugins: {
        getInstalledPlugin: vi.fn(() => plugin),
        listInstalledPlugins: vi.fn(() => []),
      },
      helpers: {
        requireLocalDaemonRequest: ((_req, _res, next) => next()) as express.RequestHandler,
        assembleExample: (templateHtml: string) => templateHtml,
        applyBakedPreviews: (records: unknown[]) => records,
      },
    } as unknown as Parameters<typeof registerPluginRoutes>[1]);
    const server = await listen(app);
    try {
      const resp = await fetch(
        `${server.url}/api/plugins/${encodeURIComponent(plugin.id)}/duplicate-project`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: 'Route Duplicate Fixture' }),
        },
      );
      expect(resp.status).toBe(500);
      const body = (await resp.json()) as { error?: { code?: string; message?: string } };
      expect(body.error?.code).toBe('plugin-duplicate-failed');
      expect(body.error?.message).toContain('conversation insert failed');
      expect(dbDeleteProject).toHaveBeenCalledWith(db, projectId);
      await expectMissing(path.join(projectsRoot, projectId));
    } finally {
      await close(server.server);
    }
  });
});

async function listen(app: express.Express): Promise<{ server: http.Server; url: string }> {
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('server did not bind to a TCP port');
  return {
    server,
    url: `http://127.0.0.1:${address.port}`,
  };
}

async function close(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}
