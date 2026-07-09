// @vitest-environment jsdom

/**
 * Gate coverage for the "next step" affordance under the last assistant
 * message. Artifact-backed turns expose Share/Download/toolbox actions, while
 * terminal no-artifact or interrupted turns still surface recovery prompts so
 * users are never left at a dead end.
 */

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { AssistantMessage } from '../../src/components/AssistantMessage';
import { ko } from '../../src/i18n/locales/ko';
import type { ChatMessage, ProjectFile } from '../../src/types';

beforeAll(() => {
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      clear: () => store.clear(),
      getItem: (key: string) => store.get(key) ?? null,
      removeItem: (key: string) => store.delete(key),
      setItem: (key: string, value: string) => store.set(key, value),
    },
  });
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

function baseMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'msg-1',
    role: 'assistant',
    content: 'Done.',
    runStatus: 'succeeded',
    startedAt: 1700000000,
    endedAt: 1700000005,
    events: [{ kind: 'text', text: 'Done.' } as NonNullable<ChatMessage['events']>[number]],
    producedFiles: [],
    ...overrides,
  } as ChatMessage;
}

function producedFile(name: string, kind: ProjectFile['kind'] = 'html'): ProjectFile {
  return {
    name,
    path: name,
    size: 100,
    mtime: 1700000005,
    kind,
    mime: kind === 'html' ? 'text/html' : 'application/octet-stream',
  } as ProjectFile;
}

const handlers = () => ({
  onArtifactShare: vi.fn(),
  onToolboxAction: vi.fn(),
  onNextStepPromptAction: vi.fn(),
});

const AUTO_MATCH_TITLE = ko['chat.designToolbox.action.auto-match.title'];

describe('AssistantMessage next-step affordance', () => {
  it('does not expose the removed More share cascade', () => {
    const h = handlers();
    render(
      <AssistantMessage
        message={baseMessage({ producedFiles: [producedFile('landing.html')] })}
        streaming={false}
        projectId="proj-1"
        isLast
        {...h}
      />,
    );
    expect(screen.getByTestId('next-step-actions')).toBeTruthy();
    expect(screen.queryByTestId('next-step-toolbox-more')).toBeNull();
    expect(screen.queryByTestId('next-step-more-share')).toBeNull();
    expect(screen.queryByTestId('next-step-share-share')).toBeNull();
    expect(h.onArtifactShare).not.toHaveBeenCalled();
  });

  it('does not render when the message is not the last assistant message', () => {
    render(
      <AssistantMessage
        message={baseMessage({ producedFiles: [producedFile('landing.html')] })}
        streaming={false}
        projectId="proj-1"
        isLast={false}
        {...handlers()}
      />,
    );
    expect(screen.queryByTestId('next-step-actions')).toBeNull();
  });

  it('does not expose Contribute through the removed More cascade', () => {
    const onShareToOpenDesign = vi.fn();
    render(
      <AssistantMessage
        message={baseMessage({ producedFiles: [producedFile('landing.html')] })}
        streaming={false}
        projectId="proj-1"
        isLast
        onFeedback={vi.fn()}
        onShareToOpenDesign={onShareToOpenDesign}
        {...handlers()}
      />,
    );
    expect(screen.queryByTestId('next-step-toolbox-more')).toBeNull();
    expect(screen.queryByTestId('next-step-more-share')).toBeNull();
    expect(screen.queryByTestId('next-step-share-contribute')).toBeNull();
    expect(onShareToOpenDesign).not.toHaveBeenCalled();
  });

  it('renders the card after a simple answer with no previewable artifact', () => {
    render(
      <AssistantMessage
        message={baseMessage({ producedFiles: [] })}
        streaming={false}
        projectId="proj-1"
        isLast
        {...handlers()}
      />,
    );
    expect(screen.getByTestId('next-step-actions')).toBeTruthy();
    expect(screen.getByText(ko['nextStep.projectContinueTitle'])).toBeTruthy();
    expect(screen.queryByText(ko['nextStep.projectGenerateArtifactTitle'])).toBeNull();
  });

  it('renders the card for a simple answer even without a project id', () => {
    render(
      <AssistantMessage
        message={baseMessage({ producedFiles: [] })}
        streaming={false}
        isLast
        {...handlers()}
      />,
    );
    expect(screen.getByTestId('next-step-actions')).toBeTruthy();
  });

  it('renders project recovery actions when the turn produced no previewable artifact', () => {
    const h = handlers();
    render(
      <AssistantMessage
        message={baseMessage({ producedFiles: [producedFile('notes.md', 'text')] })}
        streaming={false}
        projectId="proj-1"
        isLast
        {...h}
      />,
    );
    expect(screen.getByTestId('file-ops-summary')).toBeTruthy();
    expect(screen.getByTestId('file-ops-row-notes.md')).toBeTruthy();
    expect(screen.getByTestId('next-step-actions')).toBeTruthy();
    expect(screen.getByText(ko['nextStep.projectContinueTitle'])).toBeTruthy();
    expect(screen.queryByText(ko['nextStep.projectGenerateArtifactTitle'])).toBeNull();
    fireEvent.click(screen.getByTestId('next-step-project-action-project-continue'));
    expect(h.onNextStepPromptAction).toHaveBeenCalledWith(expect.stringContaining('숨김 지시'));
    expect(h.onNextStepPromptAction).toHaveBeenCalledWith(
      expect.stringContaining('중단되었거나 완료되지 않은 작업을 이어서 진행하세요'),
    );
  });

  it('renders once the project has a previewable HTML artifact from an earlier turn', () => {
    render(
      <AssistantMessage
        message={baseMessage({ producedFiles: [] })}
        streaming={false}
        projectId="proj-1"
        isLast
        projectFiles={[producedFile('landing.html')]}
        {...handlers()}
      />,
    );
    expect(screen.getByTestId('next-step-actions')).toBeTruthy();
    expect(screen.getByText(AUTO_MATCH_TITLE)).toBeTruthy();
  });

  it('renders incomplete brand extraction next steps after cancellation without an artifact', () => {
    const h = handlers();
    const onContinueExtraction = vi.fn();
    const onContinueAiExtraction = vi.fn();
    render(
      <AssistantMessage
        message={baseMessage({
          runStatus: 'canceled',
          content: 'Stopped.',
          producedFiles: [],
        })}
        streaming={false}
        projectId="proj-brand"
        isLast
        nextStepVariant="brand-extraction"
        onNextStepContinueExtraction={onContinueExtraction}
        onNextStepContinueAiExtraction={onContinueAiExtraction}
        {...h}
      />,
    );

    expect(screen.getByTestId('next-step-actions')).toBeTruthy();
    expect(screen.getByText(ko['nextStep.brandContinueExtractionTitle'])).toBeTruthy();
    expect(screen.getByText(ko['nextStep.brandContinueAiExtractionTitle'])).toBeTruthy();
    fireEvent.click(screen.getByTestId('next-step-brand-action-brand-continue-extraction'));
    expect(onContinueExtraction).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByTestId('next-step-brand-action-brand-continue-ai-extraction'));
    expect(onContinueAiExtraction).toHaveBeenCalledTimes(1);
  });

  it('refreshes the incomplete brand continuation busy state on memoized rows', () => {
    const h = handlers();
    const onContinueExtraction = vi.fn();
    const message = baseMessage({
      runStatus: 'canceled',
      content: 'Stopped.',
      producedFiles: [],
    });
    const view = render(
      <AssistantMessage
        message={message}
        streaming={false}
        projectId="proj-brand"
        isLast
        nextStepVariant="brand-extraction"
        onNextStepContinueExtraction={onContinueExtraction}
        nextStepContinueExtractionBusy={false}
        {...h}
      />,
    );

    const firstButton = screen.getByTestId('next-step-brand-action-brand-continue-extraction');
    fireEvent.click(firstButton);
    expect(onContinueExtraction).toHaveBeenCalledTimes(1);

    view.rerender(
      <AssistantMessage
        message={message}
        streaming={false}
        projectId="proj-brand"
        isLast
        nextStepVariant="brand-extraction"
        onNextStepContinueExtraction={onContinueExtraction}
        nextStepContinueExtractionBusy
        {...h}
      />,
    );

    const busyButton = screen.getByTestId('next-step-brand-action-brand-continue-extraction');
    expect((busyButton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(busyButton);
    expect(onContinueExtraction).toHaveBeenCalledTimes(1);
  });

  it('does not render when the handlers are not wired', () => {
    render(
      <AssistantMessage
        message={baseMessage({ producedFiles: [producedFile('landing.html')] })}
        streaming={false}
        projectId="proj-1"
        isLast
      />,
    );
    expect(screen.queryByTestId('next-step-actions')).toBeNull();
  });

  it('renders after a failed turn when a follow-up action is available', () => {
    render(
      <AssistantMessage
        message={baseMessage({ producedFiles: [], runStatus: 'failed' })}
        streaming={false}
        projectId="proj-1"
        isLast
        {...handlers()}
      />,
    );
    expect(screen.getByTestId('next-step-actions')).toBeTruthy();
  });

  it('renders after a canceled turn when a follow-up action is available', () => {
    render(
      <AssistantMessage
        message={baseMessage({ producedFiles: [], runStatus: 'canceled' })}
        streaming={false}
        projectId="proj-1"
        isLast
        {...handlers()}
      />,
    );
    expect(screen.getByTestId('next-step-actions')).toBeTruthy();
  });
});
