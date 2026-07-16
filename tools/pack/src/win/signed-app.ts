import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

import type { ToolPackConfig } from "../config.js";
import { buildWinNsisBasePayload, buildWinNsisOverlayPayload, buildCustomWinNsisInstaller } from "./custom-installer.js";
import { PRODUCT_NAME } from "./constants.js";
import { pathExists } from "./fs.js";
import { readPackagedVersion, writeBuiltAppManifest } from "./manifest.js";
import { buildWinLauncherPayloadArchive } from "./payload.js";
import { resolveWinPaths } from "./paths.js";
import { collectWinSizeReport, shouldBuildWinNsisInstaller, shouldBuildWinPortableZip } from "./report.js";
import { copyWinIcon } from "./resources.js";
import type { WinBuiltAppManifest, WinPackResult, WinPackTiming, WinPaths } from "./types.js";
import { buildWinPortableZip } from "./zip.js";

function logWinSignedAppProgress(message: string, fields: Record<string, unknown> = {}): void {
  const suffix = Object.entries(fields)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(" ");
  process.stderr.write(`[tools-pack win] ${message}${suffix.length === 0 ? "" : ` ${suffix}`}\n`);
}

async function writeLocalLatestYml(config: ToolPackConfig, paths: WinPaths): Promise<void> {
  if (!(await pathExists(paths.setupPath))) return;
  const packagedVersion = await readPackagedVersion(config);
  const setupPayload = await readFile(paths.setupPath);
  const setupMetadata = await stat(paths.setupPath);
  const sha512 = createHash("sha512").update(setupPayload).digest("base64");
  const setupName = basename(paths.setupPath);
  await writeFile(
    paths.latestYmlPath,
    [
      `version: ${JSON.stringify(packagedVersion)}`,
      "files:",
      `  - url: ${JSON.stringify(setupName)}`,
      `    sha512: ${JSON.stringify(sha512)}`,
      `    size: ${setupMetadata.size}`,
      `path: ${JSON.stringify(setupName)}`,
      `sha512: ${JSON.stringify(sha512)}`,
      `releaseDate: ${JSON.stringify(new Date().toISOString())}`,
      "",
    ].join("\n"),
    "utf8",
  );
}

async function resolveSignedAppRoot(inputRoot: string): Promise<string> {
  const directExe = join(inputRoot, `${PRODUCT_NAME}.exe`);
  if (await pathExists(directExe)) return inputRoot;

  const entries = await readdir(inputRoot, { withFileTypes: true });
  const childAppRoots = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const candidate = join(inputRoot, entry.name);
    if (await pathExists(join(candidate, `${PRODUCT_NAME}.exe`))) childAppRoots.push(candidate);
  }
  if (childAppRoots.length === 1) return childAppRoots[0];
  if (childAppRoots.length > 1) {
    throw new Error(`signed app directory is ambiguous; multiple ${PRODUCT_NAME}.exe roots found under ${inputRoot}`);
  }
  throw new Error(`signed app directory must contain ${PRODUCT_NAME}.exe: ${inputRoot}`);
}

async function materializeExternallySignedApp(signedAppDir: string, paths: WinPaths): Promise<WinBuiltAppManifest> {
  const signedRoot = await resolveSignedAppRoot(signedAppDir);
  const signedExePath = join(signedRoot, `${PRODUCT_NAME}.exe`);
  const signedConfigPath = join(signedRoot, "resources", "nn.design-config.json");
  if (!(await pathExists(signedConfigPath))) {
    throw new Error(`signed app is missing packaged config: ${signedConfigPath}`);
  }

  await rm(paths.unpackedRoot, { force: true, recursive: true });
  await mkdir(dirname(paths.unpackedRoot), { recursive: true });
  await cp(signedRoot, paths.unpackedRoot, { recursive: true });
  await mkdir(dirname(paths.packagedConfigPath), { recursive: true });
  await cp(join(paths.unpackedRoot, "resources", "nn.design-config.json"), paths.packagedConfigPath);

  const executablePath = join(paths.unpackedRoot, `${PRODUCT_NAME}.exe`);
  if (!(await pathExists(executablePath))) {
    throw new Error(`materialized signed app executable not found: ${executablePath}`);
  }
  await stat(signedExePath);

  const manifest: WinBuiltAppManifest = {
    appBuilderOutputRoot: paths.appBuilderOutputRoot,
    cacheEntryPath: null,
    configPath: paths.packagedConfigPath,
    executablePath,
    source: "namespace",
    unpackedRoot: paths.unpackedRoot,
    version: 1,
    webStandaloneHookAuditPath: null,
  };
  await writeBuiltAppManifest(paths, manifest);
  return manifest;
}

export async function packWinFromSignedApp(config: ToolPackConfig): Promise<WinPackResult> {
  if (process.platform !== "win32") throw new Error("Windows signed-app packaging must run on Windows");
  if (config.signedAppDir == null) throw new Error("win build-from-signed-app requires --signed-app-dir");
  if (config.signed) {
    throw new Error("win build-from-signed-app creates an unsigned setup.exe for external signing; do not pass --signed");
  }

  const paths = resolveWinPaths(config);
  const timings: WinPackTiming[] = [];
  const segments: WinPackTiming[] = [];
  const hasNsisTarget = shouldBuildWinNsisInstaller(config.to);
  const hasZipTarget = shouldBuildWinPortableZip(config.to);
  if (!hasNsisTarget && !hasZipTarget) {
    throw new Error("win build-from-signed-app requires --to nsis, zip, or all");
  }

  const runPhase = async <T>(phase: string, task: () => Promise<T>): Promise<T> => {
    const startedAt = Date.now();
    logWinSignedAppProgress("phase:start", { phase });
    try {
      const result = await task();
      logWinSignedAppProgress("phase:done", { durationMs: Date.now() - startedAt, phase });
      return result;
    } catch (error) {
      logWinSignedAppProgress("phase:failed", {
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
        phase,
      });
      throw error;
    } finally {
      timings.push({ durationMs: Date.now() - startedAt, phase });
    }
  };

  await runPhase("target-artifact-cleanup", async () => {
    await rm(paths.setupPath, { force: true });
    await rm(paths.setupZipPath, { force: true });
    await rm(paths.blockmapPath, { force: true });
    await rm(paths.installerBasePayloadPath, { force: true });
    await rm(paths.installerOverlayPayloadPath, { force: true });
    await rm(paths.launcherPayloadPath, { force: true });
    await rm(paths.latestYmlPath, { force: true });
  });
  await runPhase("win-icon", async () => {
    await copyWinIcon(paths);
  });
  const builtApp = await runPhase("signed-app:materialize", async () =>
    materializeExternallySignedApp(config.signedAppDir as string, paths)
  );

  if (hasZipTarget) {
    await runPhase("portable-zip", async () => {
      segments.push(...await buildWinPortableZip(config, paths, builtApp));
    });
  }
  if (hasNsisTarget) {
    await runPhase("nsis-payload-base", async () => {
      segments.push(...await buildWinNsisBasePayload(paths, builtApp));
    });
    await runPhase("nsis-payload-overlay", async () => {
      segments.push(...await buildWinNsisOverlayPayload(paths, builtApp));
    });
    await runPhase("nsis-installer", async () => {
      segments.push(...await buildCustomWinNsisInstaller(config, paths));
    });
  }
  await runPhase("latest-yml", async () => {
    await writeLocalLatestYml(config, paths);
  });
  await runPhase("payload-artifact", async () => {
    segments.push(...await buildWinLauncherPayloadArchive(config, paths, builtApp, undefined, {
      seedFromInstallerPayload: hasNsisTarget,
    }));
  });
  const sizeReport = await runPhase("size-report", async () => collectWinSizeReport(config, paths, builtApp));

  return {
    blockmapPath: hasNsisTarget && await pathExists(paths.blockmapPath) ? paths.blockmapPath : null,
    cacheReport: { entries: [], root: config.roots.cacheRoot },
    installerPath: hasNsisTarget && await pathExists(paths.setupPath) ? paths.setupPath : null,
    latestYmlPath: hasNsisTarget && await pathExists(paths.latestYmlPath) ? paths.latestYmlPath : null,
    outputRoot: config.roots.output.namespaceRoot,
    payloadPath: (await pathExists(paths.launcherPayloadPath)) ? paths.launcherPayloadPath : null,
    portableZipPath: hasZipTarget && await pathExists(paths.setupZipPath) ? paths.setupZipPath : null,
    resourceRoot: join(builtApp.unpackedRoot, "resources", "nn.design"),
    runtimeNamespaceRoot: config.roots.runtime.namespaceRoot,
    segments,
    sizeReport,
    timings,
    to: config.to,
    unpackedPath: builtApp.unpackedRoot,
    webStandaloneHookAuditPath: null,
  };
}
