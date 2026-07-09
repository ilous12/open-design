import { afterEach } from 'vitest';
import assert from 'node:assert/strict';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  AGENT_DEFS,
  applyAgentLaunchEnv,
  buildLiveArtifactsMcpServersForAgent,
  checkPromptArgvBudget,
  checkWindowsCmdShimCommandLineBudget,
  checkWindowsDirectExeCommandLineBudget,
  detectAgents,
  inspectAgentExecutableResolution,
  resolveAgentLaunch,
  resolveAgentExecutable,
  spawnEnvForAgent,
} from '../../../src/agents.js';
import type { RuntimeAgentDef } from '../../../src/runtimes/types.js';

export {
  assert,
  AGENT_DEFS,
  applyAgentLaunchEnv,
  buildLiveArtifactsMcpServersForAgent,
  checkPromptArgvBudget,
  checkWindowsCmdShimCommandLineBudget,
  checkWindowsDirectExeCommandLineBudget,
  chmodSync,
  detectAgents,
  inspectAgentExecutableResolution,
  join,
  mkdirSync,
  mkdtempSync,
  resolveAgentExecutable,
  resolveAgentLaunch,
  rmSync,
  spawnEnvForAgent,
  tmpdir,
  writeFileSync,
};

export type TestAgentDef = RuntimeAgentDef;

function fallbackTestAgent(id: string, bin = id): TestAgentDef {
  return minimalAgentDef({ id, name: id, bin });
}

export function requireAgent(id: string): TestAgentDef {
  const agent = AGENT_DEFS.find((candidate) => candidate.id === id);
  assert.ok(agent, `missing agent definition for ${id}`);
  return agent;
}

function maybeAgent(id: string, bin = id): TestAgentDef {
  return AGENT_DEFS.find((candidate) => candidate.id === id) ?? fallbackTestAgent(id, bin);
}

export function minimalAgentDef(
  partial: Pick<TestAgentDef, 'bin'> & Partial<TestAgentDef>,
): TestAgentDef {
  const { bin, ...rest } = partial;
  return {
    id: partial.id ?? `test-${bin}`,
    name: partial.name ?? bin,
    bin,
    versionArgs: partial.versionArgs ?? ['--version'],
    fallbackModels: partial.fallbackModels ?? [{ id: 'default', label: 'Default' }],
    buildArgs: partial.buildArgs ?? (() => []),
    streamFormat: partial.streamFormat ?? 'plain',
    ...rest,
  };
}

export const amp = maybeAgent('amp');
export const claude = requireAgent('claude');
export const codex = requireAgent('codex');
export const hermes = maybeAgent('hermes');
export const kimi = maybeAgent('kimi');
export const copilot = maybeAgent('copilot');
export const cursorAgent = maybeAgent('cursor-agent');
export const kiro = maybeAgent('kiro');
export const kilo = maybeAgent('kilo');
export const vibe = maybeAgent('vibe');
export const devin = maybeAgent('devin');
export const pi = maybeAgent('pi');
export const deepseek = maybeAgent('deepseek');
export const qoder = maybeAgent('qoder');
export const qwen = maybeAgent('qwen');
export const opencode = maybeAgent('opencode');
export const mimo = maybeAgent('mimo');
export const grokBuild = maybeAgent('grok-build');
export const aider = maybeAgent('aider');
export const antigravity = requireAgent('antigravity');
export const codebuddy = maybeAgent('codebuddy');
export const deepseekMaxPromptArgBytes = deepseek.maxPromptArgBytes ?? 0;
const originalDisablePlugins = process.env.OD_CODEX_DISABLE_PLUGINS;
const originalPath = process.env.PATH;
const originalHome = process.env.HOME;
const originalAgentHome = process.env.OD_AGENT_HOME;
const originalDaemonUrl = process.env.OD_DAEMON_URL;
const originalToolToken = process.env.OD_TOOL_TOKEN;
const originalNpmConfigPrefix = process.env.NPM_CONFIG_PREFIX;
const originalPathExt = process.env.PATHEXT;
const originalVpHome = process.env.VP_HOME;
const originalFetch = globalThis.fetch;
const originalPlatformDescriptor = Object.getOwnPropertyDescriptor(process, 'platform');

afterEach(() => {
  if (originalDisablePlugins == null) {
    delete process.env.OD_CODEX_DISABLE_PLUGINS;
  } else {
    process.env.OD_CODEX_DISABLE_PLUGINS = originalDisablePlugins;
  }
  process.env.PATH = originalPath;
  if (originalHome == null) {
    delete process.env.HOME;
  } else {
    process.env.HOME = originalHome;
  }
  if (originalAgentHome == null) {
    delete process.env.OD_AGENT_HOME;
  } else {
    process.env.OD_AGENT_HOME = originalAgentHome;
  }
  if (originalDaemonUrl == null) {
    delete process.env.OD_DAEMON_URL;
  } else {
    process.env.OD_DAEMON_URL = originalDaemonUrl;
  }
  if (originalToolToken == null) {
    delete process.env.OD_TOOL_TOKEN;
  } else {
    process.env.OD_TOOL_TOKEN = originalToolToken;
  }
  if (originalNpmConfigPrefix == null) {
    delete process.env.NPM_CONFIG_PREFIX;
  } else {
    process.env.NPM_CONFIG_PREFIX = originalNpmConfigPrefix;
  }
  if (originalPathExt == null) {
    delete process.env.PATHEXT;
  } else {
    process.env.PATHEXT = originalPathExt;
  }
  if (originalVpHome == null) {
    delete process.env.VP_HOME;
  } else {
    process.env.VP_HOME = originalVpHome;
  }
  globalThis.fetch = originalFetch;
  if (originalPlatformDescriptor) {
    Object.defineProperty(process, 'platform', originalPlatformDescriptor);
  }
});

export function withPlatform<T>(platform: NodeJS.Platform, run: () => T): T {
  Object.defineProperty(process, 'platform', {
    configurable: true,
    value: platform,
  });
  return run();
}

export function withEnvSnapshot<T>(
  keys: readonly string[],
  run: () => T | Promise<T>,
): T | Promise<T> {
  const snapshot = new Map(keys.map((key) => [key, process.env[key]]));
  const restore = () => {
    for (const key of keys) {
      const value = snapshot.get(key);
      if (value == null) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };

  let result: T | Promise<T>;
  try {
    result = run();
  } catch (error) {
    restore();
    throw error;
  }
  if (result instanceof Promise) {
    return result.finally(restore);
  }
  restore();
  return result;
}
