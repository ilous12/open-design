import type { Express, Request, Response } from 'express';

import type { RouteDeps } from '../../server-context.js';
import { importProjectFigmaUpload } from '../../services/figma-import.js';

interface MemoryFileUpload {
  single(fieldName: string): (
    req: Request,
    res: Response,
    callback: (err?: unknown) => void,
  ) => void;
}

interface UploadedMemoryFile {
  buffer: Buffer;
  originalname?: string;
}

type FigmaImportRequest = Request & {
  file?: UploadedMemoryFile;
};

export interface RegisterProjectFigmaImportRoutesDeps
  extends RouteDeps<'db' | 'http' | 'paths' | 'projectStore' | 'projectFiles' | 'uploads'> {}

export function registerProjectFigmaImportRoutes(
  app: Express,
  ctx: RegisterProjectFigmaImportRoutesDeps,
): void {
  const { sendApiError, sendMulterError } = ctx.http;
  const { getProject } = ctx.projectStore;
  const { resolveProjectDir } = ctx.projectFiles;
  const { PROJECTS_DIR } = ctx.paths;
  const figmaUpload = ctx.uploads.figmaUpload as MemoryFileUpload;

  app.post('/api/projects/:id/figma/import', (req, res) => {
    figmaUpload.single('file')(req, res, async (err?: unknown) => {
      if (err) return sendMulterError(res, err);
      try {
        const project = getProject(ctx.db, req.params.id);
        if (!project) return sendApiError(res, 404, 'PROJECT_NOT_FOUND', 'project not found');

        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const figmaUrl = typeof body.figmaUrl === 'string' ? body.figmaUrl.trim() : '';
        const file = (req as FigmaImportRequest).file;
        if (!file) {
          if (figmaUrl) {
            return sendApiError(
              res,
              409,
              'FIGMA_URL_NEEDS_MIGRATION',
              'Figma URL imports must run through the Figma migration flow.',
              { details: { figmaUrl } },
            );
          }
          return sendApiError(res, 400, 'BAD_REQUEST', 'file is required');
        }

        const notes = typeof body.notes === 'string' ? body.notes : undefined;
        const result = await importProjectFigmaUpload(
          { projectsRoot: PROJECTS_DIR, resolveProjectDir },
          {
            projectId: req.params.id,
            projectMetadata: project.metadata,
            file,
            notes,
          },
        );
        return res.json(result);
      } catch (caught) {
        return sendApiError(
          res,
          400,
          'FIGMA_IMPORT_FAILED',
          caught instanceof Error ? caught.message : String(caught),
        );
      }
    });
  });
}
