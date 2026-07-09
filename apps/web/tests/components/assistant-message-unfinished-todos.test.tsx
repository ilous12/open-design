// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssistantMessage } from '../../src/components/AssistantMessage';
import type { AgentEvent, ChatMessage, ProjectFile } from '../../src/types';

function messageWithEvents(events: AgentEvent[]): ChatMessage {
  return {
    id: 'assistant-1',
    role: 'assistant',
    content: '',
    events,
    startedAt: 1_000,
    endedAt: 3_000,
  };
}

function workspaceFile(name: string): ProjectFile {
  return {
    name,
    path: name,
    type: 'file',
    size: 100,
    mtime: 1700000000,
    kind: name.endsWith('.json') ? 'code' : 'text',
    mime: name.endsWith('.json') ? 'application/json' : 'text/plain',
  };
}

describe('AssistantMessage unfinished todo state', () => {
  afterEach(() => cleanup());

  it('suppresses direction picker forms when a design system is active', () => {
    const directionForm = [
      'Pick one:',
      '<question-form id="direction" title="Pick a visual direction">',
      JSON.stringify({
        questions: [
          {
            id: 'direction',
            label: 'Direction',
            type: 'direction-cards',
            options: ['Modern minimal'],
            cards: [
              {
                id: 'Modern minimal',
                label: 'Modern minimal',
                mood: 'Clean and restrained.',
                references: ['Linear'],
                palette: ['#ffffff', '#111111'],
                displayFont: 'serif',
                bodyFont: 'sans-serif',
              },
            ],
          },
        ],
      }),
      '</question-form>',
    ].join('\n');

    render(
      <AssistantMessage
        message={messageWithEvents([{ kind: 'text', text: directionForm }])}
        streaming={false}
        projectId="project-1"
        isLast
        suppressDirectionForms
      />,
    );

    expect(
      screen.getByText('Active design system selected. Visual direction is already locked.'),
    ).toBeTruthy();
    expect(screen.queryByText('Pick a visual direction')).toBeNull();
    expect(screen.queryByText('Modern minimal')).toBeNull();
  });

  it('shows a soft no-output state instead of Done for empty API responses', () => {
    render(
      <AssistantMessage
        projectKind="prototype"
        conversationId="conv-1"
        message={messageWithEvents([
          { kind: 'status', label: 'empty_response', detail: 'deepseek-chat' },
          {
            kind: 'text',
            text: 'The provider ended the request without returning text or an artifact. Try another model or provider, check quota, or retry.',
          },
        ])}
        streaming={false}
        projectId="project-1"
        isLast
      />,
    );

    expect(screen.getByText('출력 없음')).toBeTruthy();
    expect(screen.getByText(/provider ended the request/i)).toBeTruthy();
    expect(screen.queryByText('완료됨')).toBeNull();
    expect(screen.queryByText('empty_response')).toBeNull();
  });

  it('keeps Done for a completed latest TodoWrite fixture', () => {
    render(
      <AssistantMessage
        projectKind="prototype"
        conversationId="conv-1"
        message={messageWithEvents([
          {
            kind: 'tool_use',
            id: 'todo-1',
            name: 'TodoWrite',
            input: { todos: [{ content: 'Ship layout', status: 'completed' }] },
          },
        ])}
        streaming={false}
        projectId="project-1"
        isLast
      />,
    );

    expect(screen.getByText('완료됨')).toBeTruthy();
    expect(screen.queryByText('작업을 마치지 못하고 중지됨')).toBeNull();
    expect(screen.queryByRole('button', { name: '남은 작업 계속하기' })).toBeNull();
  });

  it('uses persisted usage duration for completed messages that do not have endedAt', () => {
    render(
      <AssistantMessage
        message={{
          id: 'assistant-duration',
          role: 'assistant',
          content: 'Done',
          startedAt: 1_000,
          runStatus: 'succeeded',
          events: [{ kind: 'usage', outputTokens: 1439, durationMs: 32_000 }],
        }}
        streaming={false}
        projectId="project-1"
        isLast
      />,
    );

    expect(screen.getByText(/32s/)).toBeTruthy();
    expect(screen.getByText(/1,439 토큰/)).toBeTruthy();
    expect(screen.queryByText(/output 1,439/)).toBeNull();
  });

  it('shows only total token usage for each completed message', () => {
    render(
      <AssistantMessage
        message={{
          id: 'assistant-full-usage',
          role: 'assistant',
          content: 'Done',
          startedAt: 1_000,
          runStatus: 'succeeded',
          events: [{ kind: 'usage', inputTokens: 831, outputTokens: 1439, thoughtTokens: 512, durationMs: 32_000 }],
        }}
        streaming={false}
        projectId="project-1"
      />,
    );

    const usage = screen.getByText(/2,782 토큰/);
    expect(usage).toBeTruthy();
    expect(usage.textContent).not.toContain('input 831');
    expect(usage.textContent).not.toContain('output 1,439');
    expect(usage.textContent).not.toContain('reasoning 512');
  });

  it('hides cache token details for each completed message', () => {
    render(
      <AssistantMessage
        message={{
          id: 'assistant-total-cache-usage',
          role: 'assistant',
          content: 'Done',
          startedAt: 1_000,
          runStatus: 'succeeded',
          events: [
            {
              kind: 'usage',
              totalTokens: 80805,
              cachedReadTokens: 75734,
              cachedWriteTokens: 120,
              durationMs: 32_000,
            },
          ],
        }}
        streaming={false}
        projectId="project-1"
      />,
    );

    const usage = screen.getByText(/8.1만 토큰/);
    expect(usage.textContent).not.toContain('cached 75.7K');
    expect(usage.textContent).not.toContain('cache write 120');
  });

  it('hides zero cost because it is not reliable billing data', () => {
    render(
      <AssistantMessage
        message={{
          id: 'assistant-zero-cost',
          role: 'assistant',
          content: 'Done',
          startedAt: 1_000,
          runStatus: 'succeeded',
          events: [{ kind: 'usage', outputTokens: 1439, durationMs: 32_000, costUsd: 0 }],
        }}
        streaming={false}
        projectId="project-1"
        isLast
      />,
    );

    expect(screen.getByText(/1,439 토큰/)).toBeTruthy();
    expect(screen.queryByText(/output 1,439/)).toBeNull();
    expect(screen.queryByText(/\$0\.0000/)).toBeNull();
  });

  it('hides costs that round to zero in the current display precision', () => {
    render(
      <AssistantMessage
        message={{
          id: 'assistant-rounded-zero-cost',
          role: 'assistant',
          content: 'Done',
          startedAt: 1_000,
          runStatus: 'succeeded',
          events: [{ kind: 'usage', outputTokens: 1439, durationMs: 32_000, costUsd: 0.00001 }],
        }}
        streaming={false}
        projectId="project-1"
        isLast
      />,
    );

    expect(screen.getByText(/1,439 토큰/)).toBeTruthy();
    expect(screen.queryByText(/output 1,439/)).toBeNull();
    expect(screen.queryByText(/\$0\.0000/)).toBeNull();
  });

  it('shows positive usage cost when billing data is present', () => {
    render(
      <AssistantMessage
        message={{
          id: 'assistant-positive-cost',
          role: 'assistant',
          content: 'Done',
          startedAt: 1_000,
          runStatus: 'succeeded',
          events: [{ kind: 'usage', outputTokens: 1439, durationMs: 32_000, costUsd: 0.0123 }],
        }}
        streaming={false}
        projectId="project-1"
        isLast
      />,
    );

    expect(screen.getByText(/\$0\.0123/)).toBeTruthy();
  });

  it('does not synthesize a growing elapsed time for completed messages without endedAt', () => {
    render(
      <AssistantMessage
        message={{
          id: 'assistant-duration-missing',
          role: 'assistant',
          content: 'Done',
          startedAt: 1_000,
          runStatus: 'succeeded',
          events: [{ kind: 'usage', outputTokens: 1439 }],
        }}
        streaming={false}
        projectId="project-1"
        isLast
      />,
    );

    expect(screen.getByText(/1,439 토큰/)).toBeTruthy();
    expect(screen.queryByText(/output 1,439/)).toBeNull();
    expect(screen.queryByText(/\d+m \d{2}s/)).toBeNull();
  });

  it('shows unfinished state and passes unfinished todos to the continue callback', () => {
    const onContinue = vi.fn();
    render(
      <AssistantMessage
        projectKind="prototype"
        conversationId="conv-1"
        message={messageWithEvents([
          {
            kind: 'tool_use',
            id: 'todo-1',
            name: 'TodoWrite',
            input: {
              todos: [
                { content: 'Draft layout', status: 'completed' },
                {
                  content: 'Build components',
                  status: 'in_progress',
                  activeForm: 'Building components',
                },
                { content: 'Run QA', status: 'pending' },
              ],
            },
          },
        ])}
        streaming={false}
        projectId="project-1"
        isLast
        onContinueRemainingTasks={onContinue}
      />,
    );

    expect(screen.getByText('작업을 마치지 못하고 중지됨')).toBeTruthy();
    expect(screen.getByText('2개 작업 남음')).toBeTruthy();
    const remainingList = screen.getByText('2개 작업 남음').closest('.unfinished-todos');
    expect(remainingList).not.toBeNull();
    expect(within(remainingList as HTMLElement).getByText('Building components')).toBeTruthy();
    expect(within(remainingList as HTMLElement).getByText('Run QA')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '남은 작업 계속하기' }));

    expect(onContinue).toHaveBeenCalledWith([
      {
        content: 'Build components',
        status: 'in_progress',
        activeForm: 'Building components',
      },
      { content: 'Run QA', status: 'pending', activeForm: undefined },
    ]);
  });

  it('hides the continue button on older assistant turns', () => {
    render(
      <AssistantMessage
        projectKind="prototype"
        conversationId="conv-1"
        message={messageWithEvents([
          {
            kind: 'tool_use',
            id: 'todo-1',
            name: 'TodoWrite',
            input: { todos: [{ content: 'Run QA', status: 'pending' }] },
          },
        ])}
        streaming={false}
        projectId="project-1"
        isLast={false}
        onContinueRemainingTasks={vi.fn()}
      />,
    );

    expect(screen.getByText('작업을 마치지 못하고 중지됨')).toBeTruthy();
    expect(screen.getByText('1개 작업 남음')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '남은 작업 계속하기' })).toBeNull();
  });

  it('surfaces generated plugin next actions in the latest assistant turn', async () => {
    const onOpen = vi.fn();
    const onPluginFolderAgentAction = vi.fn(async () => {});
    render(
      <AssistantMessage
        message={{
          ...messageWithEvents([
            {
              kind: 'tool_use',
              id: 'write-manifest',
              name: 'Write',
              input: { path: 'open-design.json' },
            },
            {
              kind: 'tool_result',
              toolUseId: 'write-manifest',
              content: 'ok',
              isError: false,
            },
          ]),
          content: 'The plugin is ready to publish.',
        }}
        streaming={false}
        projectId="project-1"
        projectFiles={[
          workspaceFile('generated-plugin/open-design.json'),
          workspaceFile('generated-plugin/SKILL.md'),
          workspaceFile('generated-plugin/examples/demo.md'),
        ]}
        onRequestOpenFile={onOpen}
        onRequestPluginFolderAgentAction={onPluginFolderAgentAction}
        isLast
      />,
    );

    expect(screen.getByText('Plugin ready')).toBeTruthy();
    expect(screen.getByTestId('assistant-plugin-install-generated-plugin')).toBeTruthy();
    expect(screen.getByTestId('assistant-plugin-publish-generated-plugin')).toBeTruthy();
    expect(screen.getByTestId('assistant-plugin-contribute-generated-plugin')).toBeTruthy();

    fireEvent.click(screen.getByTestId('assistant-plugin-contribute-generated-plugin'));
    expect(onPluginFolderAgentAction).toHaveBeenCalledWith('generated-plugin', 'contribute');
    expect(
      screen.queryByText('Sent to the agent. The CLI run will continue in chat.'),
    ).toBeNull();

    fireEvent.click(screen.getByTestId('assistant-plugin-open-manifest-generated-plugin'));
    expect(onOpen).toHaveBeenCalledWith('generated-plugin/open-design.json');
  });
});
