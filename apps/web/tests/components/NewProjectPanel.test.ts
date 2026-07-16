import { describe, expect, it } from 'vitest';

import {
  designSystemMatchesLocalizedSearch,
  designSystemMatchesSearch,
} from '../../src/components/design-system-search';
import { supportedModels } from '../../src/components/NewProjectPanel';
import { AUDIO_MODELS_BY_KIND, IMAGE_MODELS, VIDEO_MODELS } from '../../src/media/models';

describe('NewProjectPanel image provider visibility', () => {
  it('shows Nano Banana in supported image models', () => {
    const models = supportedModels('image', IMAGE_MODELS);
    expect(models.some((model) => model.provider === 'nanobanana')).toBe(true);
    expect(models.some((model) => model.id === 'gemini-3.1-flash-image-preview')).toBe(true);
  });

  it('shows ElevenLabs speech models in supported audio models', () => {
    const models = supportedModels('audio', AUDIO_MODELS_BY_KIND.speech);
    expect(models.some((model) => model.provider === 'elevenlabs')).toBe(true);
    expect(models.some((model) => model.id === 'elevenlabs-v3')).toBe(true);
  });

  it('shows ElevenLabs sound effects models in supported audio models', () => {
    const models = supportedModels('audio', AUDIO_MODELS_BY_KIND.sfx);
    expect(models.some((model) => model.id === 'elevenlabs-sfx')).toBe(true);
  });

  it('shows OpenRouter in supported image models', () => {
    const models = supportedModels('image', IMAGE_MODELS);
    expect(models.some((model) => model.provider === 'openrouter')).toBe(true);
  });

  it('shows OpenRouter in supported video models', () => {
    const models = supportedModels('video', VIDEO_MODELS);
    expect(models.some((model) => model.provider === 'openrouter')).toBe(true);
  });
});

describe('design system search matching', () => {
  it('matches AIR and SKT-T by id, title, and hyphen-insensitive aliases', () => {
    const air = {
      id: 'air',
      title: 'AIR',
      category: 'Telecom & Lifestyle',
      summary: 'AIR design system',
    };
    const sktT = {
      id: 'skt-t',
      title: 'SKT-T',
      category: 'Telecom Service Portal',
      summary: 'Korean telecom portal',
    };

    expect(designSystemMatchesSearch(air, 'air')).toBe(true);
    expect(designSystemMatchesSearch(air, 'AIR')).toBe(true);
    expect(designSystemMatchesSearch(sktT, 'skt-t')).toBe(true);
    expect(designSystemMatchesSearch(sktT, 'skt t')).toBe(true);
    expect(designSystemMatchesSearch(sktT, 'sktt')).toBe(true);
  });

  it('uses the home picker localized search fields for new project design systems', () => {
    const sktT = {
      id: 'skt-t',
      title: 'SKT-T',
      category: 'Telecom & Lifestyle',
      summary: 'Korean telecom portal',
      swatches: [],
      source: 'built-in',
      status: 'published',
    };

    expect(designSystemMatchesLocalizedSearch(sktT, 'skt t', 'ko')).toBe(true);
    expect(designSystemMatchesLocalizedSearch(sktT, '통신', 'ko')).toBe(true);
  });
});
