export const PRODUCT_NAME = "Design For AIR";
export const DESKTOP_LOG_ECHO_ENV = "OD_DESKTOP_LOG_ECHO";
export const WEB_STANDALONE_HOOK_CONFIG_ENV = "OD_TOOLS_PACK_WEB_STANDALONE_HOOK_CONFIG";
export const WEB_STANDALONE_RESOURCE_NAME = "nn.design-web-standalone";
export const ELECTRON_BUILDER_ASAR = false;
export const ELECTRON_BUILDER_BUILD_DEPENDENCIES_FROM_SOURCE = false;
export const ELECTRON_BUILDER_NODE_GYP_REBUILD = false;
export const ELECTRON_BUILDER_NPM_REBUILD = false;
export const ELECTRON_REBUILD_MODE = "sequential" as const;
export const ELECTRON_REBUILD_NATIVE_MODULES = ["better-sqlite3"] as const;
export const ELECTRON_BUILDER_FILE_PATTERNS = [
  "**/*",
  "!**/node_modules/.bin",
  "!**/node_modules/electron{,/**/*}",
  "!**/*.map",
  "!**/*.tsbuildinfo",
  "!**/.next/cache",
  "!**/.next/cache/**",
  "!**/node_modules/better-sqlite3/build/Release/obj",
  "!**/node_modules/better-sqlite3/build/Release/obj/**",
  "!**/node_modules/better-sqlite3/deps",
  "!**/node_modules/better-sqlite3/deps/**",
] as const;
export const NSIS_INSTALLER_LANGUAGE_BY_WEB_LOCALE = {
  en: "en_US",
  fa: "fa_IR",
  "pt-BR": "pt_BR",
  ru: "ru_RU",
  "zh-CN": "zh_CN",
  "zh-TW": "zh_TW",
} as const;
export const INTERNAL_PACKAGES = [
  { directory: "packages/release", name: "@nn-design/release" },
  { directory: "packages/components", name: "@nn-design/components" },
  { directory: "packages/contracts", name: "@nn-design/contracts" },
  { directory: "packages/registry-protocol", name: "@nn-design/registry-protocol" },
  { directory: "packages/sidecar-proto", name: "@nn-design/sidecar-proto" },
  { directory: "packages/launcher-proto", name: "@nn-design/launcher-proto" },
  { directory: "packages/sidecar", name: "@nn-design/sidecar" },
  { directory: "packages/platform", name: "@nn-design/platform" },
  { directory: "packages/download", name: "@nn-design/download" },
  { directory: "packages/host", name: "@nn-design/host" },
  { directory: "packages/agui-adapter", name: "@nn-design/agui-adapter" },
  { directory: "packages/plugin-runtime", name: "@nn-design/plugin-runtime" },
  { directory: "packages/diagnostics", name: "@nn-design/diagnostics" },
  { directory: "apps/daemon", name: "@nn-design/daemon" },
  { directory: "apps/web", name: "@nn-design/web" },
  { directory: "apps/desktop", name: "@nn-design/desktop" },
  { directory: "apps/packaged", name: "@nn-design/packaged" },
] as const;
