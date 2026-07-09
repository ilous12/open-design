import { describe, expect, it } from 'vitest';
import {
  FAST_MODEL_BY_PROTOCOL,
  SUGGESTED_MODELS_BY_PROTOCOL,
} from '../../src/state/apiProtocols';
import { KNOWN_PROVIDERS } from '../../src/state/config';

describe('apiProtocols table consistency', () => {
  it('FAST_MODEL_BY_PROTOCOL.google is one of the live suggested models', () => {
    expect(SUGGESTED_MODELS_BY_PROTOCOL.google).toContain(FAST_MODEL_BY_PROTOCOL.google);
  });

  it('lists current first-party BYOK models first', () => {
    expect(SUGGESTED_MODELS_BY_PROTOCOL.anthropic.slice(0, 4)).toEqual([
      'claude-fable-5',
      'claude-opus-4-8',
      'claude-sonnet-5',
      'claude-haiku-4-5-20251001',
    ]);
    expect(SUGGESTED_MODELS_BY_PROTOCOL.openai.slice(0, 7)).toEqual([
      'gpt-5.5',
      'gpt-5.5-pro',
      'gpt-5.4',
      'gpt-5.4-pro',
      'gpt-5.4-mini',
      'gpt-5.4-nano',
      'gpt-5.3-codex',
    ]);
    expect(SUGGESTED_MODELS_BY_PROTOCOL.google.slice(0, 3)).toEqual([
      'gemini-flash-latest',
      'gemini-pro-latest',
      'gemini-3.5-flash',
    ]);
  });

  it('keeps the Ollama Cloud picker current with recent cloud models', () => {
    const recentCloudModels = [
      'glm-5.2',
      'kimi-k2.7-code',
    ];
    const ollamaCloudProvider = KNOWN_PROVIDERS.find(
      (provider) => provider.protocol === 'ollama' && provider.baseUrl === 'https://ollama.com',
    );

    expect(ollamaCloudProvider?.models).toBeDefined();
    for (const model of recentCloudModels) {
      expect(SUGGESTED_MODELS_BY_PROTOCOL.ollama).toContain(model);
      expect(ollamaCloudProvider?.models).toContain(model);
    }
  });
});
