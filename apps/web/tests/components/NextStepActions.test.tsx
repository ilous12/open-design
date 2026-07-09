// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  NextStepActions,
  PROJECT_CONTINUE_PROMPT,
} from '../../src/components/NextStepActions';
import { I18nProvider } from '../../src/i18n';
import { ko } from '../../src/i18n/locales/ko';
import type { Locale } from '../../src/i18n/types';
import type { SkillSummary } from '../../src/types';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const AUTO_MATCH_TITLE = ko['chat.designToolbox.action.auto-match.title'];
const VISUAL_POLISH_TITLE = ko['chat.designToolbox.action.visual-polish.title'];

function skill(id: string, name: string, category = 'creative-direction'): SkillSummary {
  return {
    id,
    name,
    description: `${name} skill`,
    triggers: [],
    mode: 'prototype',
    surface: 'web',
    category,
    previewType: 'html',
    designSystemRequired: false,
    defaultFor: [],
    upstream: '',
    hasBody: true,
    examplePrompt: '',
    aggregatesExamples: false,
  } as SkillSummary;
}

function renderActions(
  overrides: Partial<Parameters<typeof NextStepActions>[0]> = {},
  locale?: Locale,
) {
  const handlers = {
    onShare: vi.fn(),
    onDownload: vi.fn(),
    onToolboxAction: vi.fn(),
    onPickSkill: vi.fn(),
    onShareToOpenDesign: vi.fn(),
  };
  const ui = (
    <NextStepActions
      fileName="landing.html"
      onShare={handlers.onShare}
      onDownload={handlers.onDownload}
      onToolboxAction={handlers.onToolboxAction}
      onPickSkill={handlers.onPickSkill}
      onShareToOpenDesign={handlers.onShareToOpenDesign}
      skills={[
        skill('creative-director', 'Creative Director'),
        skill('emilkowalski-motion', 'Emil Kowalski Motion', 'animation-motion'),
        skill('imagegen-frontend-web', 'Imagegen Frontend Web', 'image-generation'),
      ]}
      toolboxSkillNames={{ 'auto-match': 'creative-director', 'visual-polish': 'impeccable-design-polish' }}
      {...overrides}
    />
  );
  render(locale ? <I18nProvider initial={locale}>{ui}</I18nProvider> : ui);
  return handlers;
}

describe('NextStepActions', () => {
  it('renders the two featured rows without More', () => {
    renderActions();
    expect(screen.getByText(AUTO_MATCH_TITLE)).toBeTruthy();
    expect(screen.getByText(VISUAL_POLISH_TITLE)).toBeTruthy();
    expect(screen.queryByTestId('next-step-toolbox-more')).toBeNull();
  });

  it('seeds the composer with the action id (no auto-send) when a featured row is clicked', () => {
    const h = renderActions();
    fireEvent.click(screen.getByTestId('next-step-toolbox-action-visual-polish'));
    expect(h.onToolboxAction).toHaveBeenCalledWith('visual-polish');
  });

  it('uses design-system-specific primary rows for design-system projects', () => {
    const onPromptAction = vi.fn();
    renderActions({ variant: 'design-system', onPromptAction });

    expect(screen.queryByText(AUTO_MATCH_TITLE)).toBeNull();
    expect(screen.queryByText(VISUAL_POLISH_TITLE)).toBeNull();
    expect(screen.getByText(ko['nextStep.designSystemAiRefineTitle'])).toBeTruthy();
    expect(screen.getByText(ko['nextStep.designSystemAuditKitTitle'])).toBeTruthy();

    fireEvent.click(screen.getByTestId('next-step-design-system-action-design-system-ai-refine'));
    expect(onPromptAction).toHaveBeenCalledWith(expect.stringContaining('refine this design system in place'));
  });

  it('offers document handoff rows after plan mode produces only a document', () => {
    const onPromptAction = vi.fn();
    renderActions({
      variant: 'plan',
      fileName: 'plan.md',
      planFileName: 'plan.md',
      artifactFileName: null,
      onPromptAction,
    });

    expect(screen.queryByText(AUTO_MATCH_TITLE)).toBeNull();
    expect(screen.getByText(ko['nextStep.planGenerateTitle'])).toBeTruthy();
    expect(screen.getByText(ko['nextStep.planImproveTitle'])).toBeTruthy();
    expect(screen.queryByText(ko['nextStep.planImproveArtifactTitle'])).toBeNull();

    fireEvent.click(screen.getByTestId('next-step-plan-action-plan-generate-from-doc'));
    expect(onPromptAction).toHaveBeenLastCalledWith(
      expect.stringContaining('plan.md'),
      { sessionMode: 'design' },
    );

    fireEvent.click(screen.getByTestId('next-step-plan-action-plan-improve-doc'));
    expect(onPromptAction).toHaveBeenLastCalledWith(
      expect.stringContaining('plan.md'),
      { sessionMode: 'plan' },
    );
  });

  it('offers artifact refinement after plan mode produces only an artifact', () => {
    const onPromptAction = vi.fn();
    renderActions({
      variant: 'plan',
      fileName: 'index.html',
      planFileName: null,
      artifactFileName: 'index.html',
      onPromptAction,
    });

    expect(screen.queryByText(ko['nextStep.planGenerateTitle'])).toBeNull();
    expect(screen.queryByText(ko['nextStep.planImproveTitle'])).toBeNull();
    expect(screen.getByText(ko['nextStep.planImproveArtifactTitle'])).toBeTruthy();

    fireEvent.click(screen.getByTestId('next-step-plan-action-plan-improve-artifact'));
    expect(onPromptAction).toHaveBeenLastCalledWith(
      expect.stringContaining('index.html'),
      { sessionMode: 'design' },
    );
  });

  it('offers a document/artifact merge when plan mode produces both', () => {
    const onPromptAction = vi.fn();
    renderActions({
      variant: 'plan',
      fileName: 'plan.md',
      planFileName: 'plan.md',
      artifactFileName: 'index.html',
      onPromptAction,
    });

    expect(screen.queryByText(ko['nextStep.planGenerateTitle'])).toBeNull();
    expect(screen.queryByText(ko['nextStep.planImproveTitle'])).toBeNull();
    expect(screen.getByText(ko['nextStep.planMergeTitle'])).toBeTruthy();
    expect(screen.getByText(ko['nextStep.planImproveArtifactTitle'])).toBeTruthy();

    fireEvent.click(screen.getByTestId('next-step-plan-action-plan-merge-doc-artifact'));
    expect(onPromptAction).toHaveBeenLastCalledWith(
      expect.stringContaining('plan.md'),
      { sessionMode: 'design' },
    );
    expect(onPromptAction.mock.calls.at(-1)?.[0]).toContain('index.html');
  });

  it('uses brand-extraction primary rows for programmatic brand projects', () => {
    const onAiOptimize = vi.fn();
    const onCreateDesign = vi.fn();
    renderActions({ variant: 'brand-extraction', onAiOptimize, onCreateDesign });

    expect(screen.queryByText(AUTO_MATCH_TITLE)).toBeNull();
    expect(screen.queryByText(VISUAL_POLISH_TITLE)).toBeNull();
    expect(screen.getByText(ko['nextStep.brandAiOptimizeTitle'])).toBeTruthy();
    expect(screen.getByText(ko['nextStep.brandAiOptimizeBody'])).toBeTruthy();
    expect(screen.getByText(ko['nextStep.brandCreateDesignTitle'])).toBeTruthy();
    expect(screen.getByText(ko['nextStep.brandCreateDesignBody'])).toBeTruthy();
    expect(screen.queryByTestId('next-step-toolbox-more')).toBeNull();

    fireEvent.click(screen.getByTestId('next-step-brand-action-brand-ai-optimize'));
    expect(onAiOptimize).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('next-step-brand-action-brand-create-design'));
    expect(onCreateDesign).toHaveBeenCalledTimes(1);
  });

  it('offers continue extraction and agent fallback for incomplete brand extraction', () => {
    const onContinueExtraction = vi.fn();
    const onContinueAiExtraction = vi.fn();
    renderActions({
      variant: 'brand-programmatic-incomplete',
      onContinueExtraction,
      onContinueAiExtraction,
      onCreateDesign: undefined,
    });

    expect(screen.getByText(ko['nextStep.brandContinueExtractionTitle'])).toBeTruthy();
    expect(screen.getByText(ko['nextStep.brandContinueAiExtractionTitle'])).toBeTruthy();
    expect(screen.queryByText(ko['nextStep.brandCreateDesignTitle'])).toBeNull();
    expect(screen.queryByText(ko['nextStep.brandAiOptimizeTitle'])).toBeNull();

    fireEvent.click(screen.getByTestId('next-step-brand-action-brand-continue-extraction'));
    expect(onContinueExtraction).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('next-step-brand-action-brand-continue-ai-extraction'));
    expect(onContinueAiExtraction).toHaveBeenCalledTimes(1);
  });

  it('offers only agent continuation for incomplete AI brand extraction', () => {
    const onContinueAiExtraction = vi.fn();
    renderActions({
      variant: 'brand-ai-incomplete',
      onContinueExtraction: vi.fn(),
      onContinueAiExtraction,
      onAiOptimize: vi.fn(),
      onCreateDesign: vi.fn(),
    });

    expect(screen.getByText(ko['nextStep.brandContinueAiExtractionTitle'])).toBeTruthy();
    expect(screen.queryByText(ko['nextStep.brandContinueExtractionTitle'])).toBeNull();
    expect(screen.queryByText(ko['nextStep.brandAiOptimizeTitle'])).toBeNull();
    expect(screen.queryByText(ko['nextStep.brandCreateDesignTitle'])).toBeNull();

    fireEvent.click(screen.getByTestId('next-step-brand-action-brand-continue-ai-extraction'));
    expect(onContinueAiExtraction).toHaveBeenCalledTimes(1);
  });

  it('offers ordinary project recovery prompts for incomplete turns without artifacts', () => {
    const onPromptAction = vi.fn();
    renderActions({
      variant: 'project-incomplete',
      fileName: null,
      onPromptAction,
    });

    expect(screen.getByText(ko['nextStep.projectContinueTitle'])).toBeTruthy();
    expect(screen.queryByText(ko['nextStep.projectGenerateArtifactTitle'])).toBeNull();
    expect(screen.queryByTestId('next-step-project-action-project-generate-artifact')).toBeNull();
    fireEvent.click(screen.getByTestId('next-step-project-action-project-continue'));
    expect(onPromptAction).toHaveBeenCalledWith(expect.stringContaining('숨김 지시'));
    expect(onPromptAction).toHaveBeenCalledWith(expect.stringContaining(PROJECT_CONTINUE_PROMPT));
  });

  it('localizes incomplete-project recovery prompts in Chinese', () => {
    const onPromptAction = vi.fn();
    renderActions({
      variant: 'project-incomplete',
      fileName: null,
      onPromptAction,
    }, 'zh-CN');

    fireEvent.click(screen.getByTestId('next-step-project-action-project-continue'));
    expect(onPromptAction).toHaveBeenCalledWith(
      expect.stringContaining('중단되었거나 완료되지 않은 작업을 이어서 진행하세요'),
    );
    expect(screen.queryByTestId('next-step-project-action-project-generate-artifact')).toBeNull();
  });

  it('localizes design-system project prompts in Chinese', () => {
    const onPromptAction = vi.fn();
    renderActions({ variant: 'design-system', onPromptAction }, 'zh-CN');

    fireEvent.click(screen.getByTestId('next-step-design-system-action-design-system-ai-refine'));
    expect(onPromptAction).toHaveBeenCalledWith(
      expect.stringContaining('AI 추출을 사용해 이 디자인 시스템을 제자리에서 계속 개선하세요'),
    );
    fireEvent.click(screen.getByTestId('next-step-design-system-action-design-system-audit-kit'));
    expect(onPromptAction).toHaveBeenCalledWith(
      expect.stringContaining('이 디자인 시스템의 사용 준비 상태를 점검하세요'),
    );
    expect(onPromptAction).not.toHaveBeenCalledWith(
      expect.stringContaining('refine this design system in place'),
    );
  });

  it('keeps brand-extraction rows visible and disabled while their actions are starting', () => {
    renderActions({
      variant: 'brand-extraction',
      onAiOptimize: vi.fn(),
      onCreateDesign: vi.fn(),
      aiOptimizeBusy: true,
      createDesignBusy: true,
    });

    const optimize = screen.getByTestId('next-step-brand-action-brand-ai-optimize') as HTMLButtonElement;
    const create = screen.getByTestId('next-step-brand-action-brand-create-design') as HTMLButtonElement;
    expect(screen.getByText(ko['brandEnrichment.busy'])).toBeTruthy();
    expect(screen.getByText(ko['nextStep.createDesignBusy'])).toBeTruthy();
    expect(optimize.disabled).toBe(true);
    expect(create.disabled).toBe(true);
  });

  it('explains brand-extraction actions in hover detail', () => {
    renderActions({
      variant: 'brand-extraction',
      onAiOptimize: vi.fn(),
      onCreateDesign: vi.fn(),
    });

    fireEvent.mouseEnter(screen.getByTestId('next-step-brand-action-brand-ai-optimize'));

    const tooltip = screen.getByRole('tooltip');
    expect(within(tooltip).getByText(ko['nextStep.brandAiOptimizeTitle'])).toBeTruthy();
    expect(within(tooltip).getByText(ko['nextStep.brandAiOptimizeBody'])).toBeTruthy();
  });

  it('reveals the matched @skill in the featured-row hover detail', () => {
    renderActions();
    fireEvent.mouseEnter(screen.getByTestId('next-step-toolbox-action-auto-match'));
    expect(screen.getByText('@creative-director')).toBeTruthy();
  });

  it('does not render the removed More cascade or hidden toolbox/share menus', () => {
    const h = renderActions();
    expect(screen.queryByTestId('next-step-toolbox-more')).toBeNull();
    expect(screen.queryByTestId('next-step-more-menu')).toBeNull();
    expect(screen.queryByTestId('next-step-toolbox-actions')).toBeNull();
    expect(screen.queryByTestId('next-step-share-menu')).toBeNull();
    expect(h.onShare).not.toHaveBeenCalled();
    expect(h.onDownload).not.toHaveBeenCalled();
    expect(h.onPickSkill).not.toHaveBeenCalled();
  });

  it('hides the toolbox rows when no toolbox handler is wired', () => {
    renderActions({ onToolboxAction: undefined });
    expect(screen.queryByTestId('next-step-toolbox-action-auto-match')).toBeNull();
  });
});
