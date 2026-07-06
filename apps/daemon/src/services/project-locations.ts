import path from 'node:path';

import {
  BUILT_IN_PROJECT_LOCATION_ID,
  allProjectLocations,
  ensureProjectLocation,
  scanProjectLocation,
} from '../project-locations.js';

interface AppConfigLike {
  projectLocations?: Array<{ id: string; name: string; path: string }>;
  defaultProjectLocationId?: string;
}

type ProjectLocationInput = Array<{ id?: string; name?: string; path: string }>;

export interface ProjectLocationServiceDeps {
  db: unknown;
  runtimeDataDir: string;
  runtimeDataDirCanonical: string;
  projectsDir: string;
  readAppConfig: (runtimeDataDir: string) => Promise<AppConfigLike>;
  writeAppConfig: (
    runtimeDataDir: string,
    patch: { projectLocations: ProjectLocationInput },
  ) => Promise<AppConfigLike>;
  validateLinkedDirs: (dirs: string[]) => { error?: string; dirs: string[] };
  listProjects: (db: unknown) => any[];
  getProject: (db: unknown, id: string) => any;
  insertProject: (db: unknown, project: any) => any;
  insertConversation: (db: unknown, conversation: any) => any;
  randomId: () => string;
}

export function createProjectLocationService(deps: ProjectLocationServiceDeps) {
  async function configuredProjectLocations() {
    const config = await deps.readAppConfig(deps.runtimeDataDir);
    const all = allProjectLocations(deps.projectsDir, config.projectLocations);
    const valid = all[0] ? [all[0]] : [];
    for (const location of all.slice(1)) {
      const validated = deps.validateLinkedDirs([location.path]);
      if (validated.error) continue;
      const canonical = validated.dirs[0];
      if (!canonical) continue;
      if (locationOverlapsDaemonData(canonical)) continue;
      valid.push({ ...location, path: canonical });
    }
    return valid;
  }

  function locationOverlapsDaemonData(locationPath: string): boolean {
    const runtimeDir = deps.runtimeDataDirCanonical || deps.runtimeDataDir;
    const projectsDir = path.join(runtimeDir, 'projects');
    const relativeToRuntime = path.relative(runtimeDir, locationPath);
    const runtimeInsideLocation = path.relative(locationPath, runtimeDir);
    const relativeToProjects = path.relative(projectsDir, locationPath);
    const projectsInsideLocation = path.relative(locationPath, projectsDir);
    return isInsideOrSame(relativeToRuntime) || isInsideOrSame(runtimeInsideLocation)
      || isInsideOrSame(relativeToProjects) || isInsideOrSame(projectsInsideLocation);
  }

  function projectBelongsToLocation(project: any, location: { id: string; path: string }): boolean {
    const metadata = project?.metadata;
    if (typeof metadata?.baseDir !== 'string') return metadata?.projectLocationId === location.id;
    const relative = path.relative(location.path, metadata.baseDir);
    return isInsideOrSame(relative) && relative !== '';
  }

  function isProjectLocationProject(project: any): boolean {
    const metadata = project?.metadata;
    return metadata?.importedFrom === 'project-location'
      || typeof metadata?.projectLocationId === 'string';
  }

  function projectVisibleForLocations(
    project: any,
    locations: Array<{ id: string; path: string; builtIn?: boolean }>,
  ): boolean {
    if (!isProjectLocationProject(project)) return true;
    return locations.some((location) => !location.builtIn && projectBelongsToLocation(project, location));
  }

  async function resolveCreateProjectLocationId(explicitProjectLocationId: unknown): Promise<string> {
    if (typeof explicitProjectLocationId === 'string' && explicitProjectLocationId.trim()) {
      return explicitProjectLocationId.trim();
    }
    const config = await deps.readAppConfig(deps.runtimeDataDir);
    const configuredDefault = typeof config.defaultProjectLocationId === 'string'
      ? config.defaultProjectLocationId.trim()
      : '';
    if (!configuredDefault || configuredDefault === BUILT_IN_PROJECT_LOCATION_ID) {
      return BUILT_IN_PROJECT_LOCATION_ID;
    }
    const locations = await configuredProjectLocations();
    return locations.some((location) => !location.builtIn && location.id === configuredDefault)
      ? configuredDefault
      : BUILT_IN_PROJECT_LOCATION_ID;
  }

  function unregisterProjectsForRemovedLocations(
    previousLocations: Array<{ id: string; path: string; builtIn?: boolean }>,
    nextLocations: Array<{ id?: string; path: string }>,
  ): string[] {
    const nextIds = new Set(nextLocations.map((location) => location.id).filter(Boolean));
    const nextPaths = new Set(nextLocations.map((location) => location.path));
    const removed = previousLocations.filter(
      (location) => !location.builtIn && !nextIds.has(location.id) && !nextPaths.has(location.path),
    );
    if (removed.length === 0) return [];
    return deps.listProjects(deps.db)
      .filter((project: any) => removed.some((location) => projectBelongsToLocation(project, location)))
      .map((project: any) => project.id);
  }

  async function updateProjectLocations(requested: unknown[]) {
    const previousLocations = await configuredProjectLocations();
    const prepared: ProjectLocationInput = [];
    for (const loc of requested) {
      if (!loc || typeof loc !== 'object' || typeof (loc as { path?: unknown }).path !== 'string') continue;
      const input = loc as { id?: unknown; name?: unknown; path: string };
      const canonicalPath = await ensureProjectLocation(input.path);
      const validated = deps.validateLinkedDirs([canonicalPath]);
      if (validated.error) throw new Error(validated.error);
      if (locationOverlapsDaemonData(canonicalPath)) {
        throw new Error('project location cannot overlap daemon data');
      }
      prepared.push({
        ...(typeof input.id === 'string' ? { id: input.id } : {}),
        ...(typeof input.name === 'string' ? { name: input.name } : {}),
        path: canonicalPath,
      });
    }
    const config = await deps.writeAppConfig(deps.runtimeDataDir, { projectLocations: prepared });
    const locations = allProjectLocations(deps.projectsDir, config.projectLocations);
    const removedProjectIds = unregisterProjectsForRemovedLocations(previousLocations, config.projectLocations ?? []);
    return { locations, removedProjectIds };
  }

  async function scanConfiguredProjectLocations() {
    const locations = (await configuredProjectLocations()).filter((loc: any) => !loc.builtIn);
    const imported = [];
    const existing: string[] = [];
    const skipped: Array<{ path: string; reason: string }> = [];
    let scanned = 0;
    const now = Date.now();
    for (const location of locations) {
      let found;
      try {
        found = await scanProjectLocation(location);
      } catch (err: any) {
        skipped.push({ path: location.path, reason: String(err?.message ?? err) });
        continue;
      }
      scanned += found.length;
      for (const entry of found) {
        const { manifest } = entry;
        if (deps.getProject(deps.db, manifest.id)) {
          existing.push(manifest.id);
          continue;
        }
        try {
          const project = deps.insertProject(deps.db, {
            id: manifest.id,
            name: manifest.name,
            skillId: manifest.skillId ?? null,
            designSystemId: manifest.designSystemId ?? null,
            pendingPrompt: null,
            metadata: {
              kind: 'prototype',
              baseDir: entry.dir,
              importedFrom: 'project-location',
              projectLocationId: location.id,
            },
            customInstructions: null,
            createdAt: manifest.createdAt,
            updatedAt: manifest.updatedAt,
          });
          deps.insertConversation(deps.db, {
            id: deps.randomId(),
            projectId: manifest.id,
            title: null,
            createdAt: now,
            updatedAt: now,
          });
          if (project) imported.push(project);
        } catch (err: any) {
          skipped.push({ path: entry.dir, reason: String(err?.message ?? err) });
        }
      }
    }
    return { scanned, imported, existing, skipped };
  }

  return {
    configuredProjectLocations,
    locationOverlapsDaemonData,
    projectVisibleForLocations,
    resolveCreateProjectLocationId,
    scanConfiguredProjectLocations,
    updateProjectLocations,
  };
}

function isInsideOrSame(relative: string): boolean {
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export type ProjectLocationService = ReturnType<typeof createProjectLocationService>;
