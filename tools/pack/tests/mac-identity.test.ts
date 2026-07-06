import { join } from "node:path";

import { describe, expect, it } from "vitest";

import type { ToolPackConfig } from "../src/config.js";
import { resolveMacInstallIdentity } from "../src/mac/identity.js";
import { resolveMacPaths } from "../src/mac/paths.js";

function makeConfig(root: string, namespace: string): ToolPackConfig {
  return {
    containerized: false,
    electronBuilderCliPath: "/x/electron-builder/cli.js",
    electronDistPath: "/x/electron/dist",
    electronVersion: "41.3.0",
    macCompression: "normal",
    namespace,
    platform: "mac",
    portable: true,
    removeData: false,
    removeLogs: false,
    removeProductUserData: false,
    removeSidecars: false,
    requireVelaCli: false,
    roots: {
      output: {
        appBuilderRoot: join(root, ".tmp", "tools-pack", "out", "mac", "namespaces", namespace, "builder"),
        namespaceRoot: join(root, ".tmp", "tools-pack", "out", "mac", "namespaces", namespace),
        platformRoot: join(root, ".tmp", "tools-pack", "out", "mac"),
        root: join(root, ".tmp", "tools-pack", "out"),
      },
      runtime: {
        namespaceBaseRoot: join(root, ".tmp", "tools-pack", "runtime", "mac", "namespaces"),
        namespaceRoot: join(root, ".tmp", "tools-pack", "runtime", "mac", "namespaces", namespace),
      },
      cacheRoot: join(root, ".tmp", "tools-pack", "cache"),
      toolPackRoot: join(root, ".tmp", "tools-pack"),
    },
    signed: false,
    silent: true,
    to: "dmg",
    webOutputMode: "standalone",
    workspaceRoot: root,
  };
}

describe("resolveMacInstallIdentity", () => {
  it("keeps stable builds on the canonical mac identity", () => {
    expect(resolveMacInstallIdentity(makeConfig("/work", "release-stable"))).toMatchObject({
      appId: "com.skt.nn.design.desktop",
      installerTitle: "Design For AIR",
      productName: "Design For AIR",
      publicAppBundleName: "Design For AIR.app",
      systemAppBundleName: "Design For AIR.app",
    });
  });

  it("uses first-class beta app identity for beta release namespaces", () => {
    const config = makeConfig("/work", "release-beta");

    expect(resolveMacInstallIdentity(config)).toEqual({
      appId: "com.skt.nn.design.desktop.beta",
      executableName: "Design For AIR Beta",
      installerTitle: "Design For AIR Beta",
      productName: "Design For AIR Beta",
      publicAppBundleName: "Design For AIR Beta.app",
      systemAppBundleName: "Design For AIR Beta.app",
    });
    expect(resolveMacPaths(config).appPath).toMatch(/Design For AIR Beta\.app$/);
  });

  it("uses first-class preview app identity for preview release namespaces", () => {
    const config = makeConfig("/work", "release-preview");

    expect(resolveMacInstallIdentity(config)).toEqual({
      appId: "com.skt.nn.design.desktop.preview",
      executableName: "Design For AIR Preview",
      installerTitle: "Design For AIR Preview",
      productName: "Design For AIR Preview",
      publicAppBundleName: "Design For AIR Preview.app",
      systemAppBundleName: "Design For AIR Preview.app",
    });
    expect(resolveMacPaths(config).appPath).toMatch(/Design For AIR Preview\.app$/);
  });

  it("uses first-class prerelease app identity for prerelease release versions and namespaces", () => {
    const prereleaseVersionConfig = {
      ...makeConfig("/work", "release-stable"),
      appVersion: "0.8.0-prerelease.2",
    };
    const prereleaseNamespaceConfig = makeConfig("/work", "release-prerelease");

    expect(resolveMacInstallIdentity(prereleaseVersionConfig)).toEqual({
      appId: "com.skt.nn.design.desktop.prerelease",
      executableName: "Design For AIR Prerelease",
      installerTitle: "Design For AIR Prerelease",
      productName: "Design For AIR Prerelease",
      publicAppBundleName: "Design For AIR Prerelease.app",
      systemAppBundleName: "Design For AIR Prerelease.app",
    });
    expect(resolveMacPaths(prereleaseVersionConfig).appPath).toMatch(/Design For AIR Prerelease\.app$/);
    expect(resolveMacInstallIdentity(prereleaseNamespaceConfig)).toMatchObject({
      productName: "Design For AIR Prerelease",
      publicAppBundleName: "Design For AIR Prerelease.app",
    });
  });
});
