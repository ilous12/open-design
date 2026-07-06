import type { Express } from 'express';

import type { ProjectLocationService } from '../../services/project-locations.js';

export interface RegisterProjectLocationRoutesDeps {
  http: {
    sendApiError: (...args: any[]) => any;
  };
  projectLocations: ProjectLocationService;
}

export function registerProjectLocationRoutes(
  app: Express,
  deps: RegisterProjectLocationRoutesDeps,
): void {
  const { sendApiError } = deps.http;
  const service = deps.projectLocations;

  app.get('/api/project-locations', async (_req, res) => {
    try {
      const locations = await service.configuredProjectLocations();
      /** @type {import('@nn-design/contracts').ProjectLocationsResponse} */
      const body = { locations };
      res.json(body);
    } catch (err: any) {
      sendApiError(res, 500, 'INTERNAL_ERROR', String(err));
    }
  });

  app.put('/api/project-locations', async (req, res) => {
    try {
      const requested = Array.isArray(req.body?.locations) ? req.body.locations : null;
      if (!requested) return sendApiError(res, 400, 'BAD_REQUEST', 'locations must be an array');
      /** @type {import('@nn-design/contracts').ProjectLocationsResponse} */
      const body = await service.updateProjectLocations(requested);
      res.json(body);
    } catch (err: any) {
      sendApiError(res, 400, 'BAD_REQUEST', String(err));
    }
  });

  app.post('/api/project-locations/scan', async (_req, res) => {
    try {
      /** @type {import('@nn-design/contracts').ScanProjectLocationsResponse} */
      const body = await service.scanConfiguredProjectLocations();
      res.json(body);
    } catch (err: any) {
      sendApiError(res, 400, 'BAD_REQUEST', String(err));
    }
  });
}
