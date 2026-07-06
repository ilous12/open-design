import type { FigmaImportResult } from '@nn-design/contracts';

import { importFigmaFromBytes } from '../figma/figma-import.js';
import { decodeMultipartFilename } from '../projects.js';

export interface ImportProjectFigmaUploadDeps {
  projectsRoot: string;
  resolveProjectDir: (
    projectsRoot: string,
    projectId: string,
    metadata?: unknown,
  ) => string;
}

export interface ImportProjectFigmaUploadRequest {
  projectId: string;
  projectMetadata?: unknown;
  file: {
    buffer: Buffer;
    originalname?: string;
  };
  notes?: string;
}

export async function importProjectFigmaUpload(
  deps: ImportProjectFigmaUploadDeps,
  request: ImportProjectFigmaUploadRequest,
): Promise<FigmaImportResult> {
  const projectRoot = deps.resolveProjectDir(
    deps.projectsRoot,
    request.projectId,
    request.projectMetadata,
  );
  return importFigmaFromBytes(request.file.buffer, {
    cwd: projectRoot,
    label: decodeMultipartFilename(request.file.originalname || 'figma-import.fig'),
    ...(request.notes === undefined ? {} : { notes: request.notes }),
  });
}
