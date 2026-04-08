import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EventTypes from '@shared/services/submission/eventTypes.js';
import Page01Notice from '../Page01Notice';

type MockAnswerValue = string | number | boolean | null;

interface MockContext {
  logOperation: ReturnType<typeof vi.fn>;
  setPageStartTime: ReturnType<typeof vi.fn>;
  collectAnswer: ReturnType<typeof vi.fn>;
  answers: Record<string, MockAnswerValue>;
  taskDurationMinutes: number;
  getPagePrefix: ReturnType<typeof vi.fn>;
}

const buildMockContext = (answerOverrides: Record<string, MockAnswerValue> = {}): MockContext => {
  const answers = { ...answerOverrides };

  const context: MockContext = {
    logOperation: vi.fn(),
    setPageStartTime: vi.fn(),
    collectAnswer: vi.fn(({ targetElement, value }: { targetElement: string; value: string }) => {
      answers[targetElement] = value;
    }),
    answers,
    taskDurationMinutes: 40,
    getPagePrefix: vi.fn(() => 'P1.01_'),
  };

  return context;
};

let mockContext = buildMockContext();

vi.mock('../../context/G8BananaBrowningContext', () => ({
  useG8BananaBrowningContext: () => mockContext,
}));

describe('Page01Notice', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockContext = buildMockContext();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('logs countdown_not_finished when checkbox is clicked before countdown completes', () => {
    render(<Page01Notice />);

    const checkbox = screen.getByRole('checkbox', { name: '我已阅读并理解上述注意事项' });
    fireEvent.click(checkbox);

    const blockedCalls = mockContext.logOperation.mock.calls
      .map(([operation]) => operation)
      .filter(operation => operation.eventType === EventTypes.CLICK_BLOCKED);

    expect(blockedCalls).toHaveLength(1);
    expect(blockedCalls[0]).toEqual(
      expect.objectContaining({
        targetElement: 'P1.01_阅读确认复选框',
        eventType: EventTypes.CLICK_BLOCKED,
        value: {
          reason: 'countdown_not_finished',
          missing: ['timer_completed'],
          timestamp: expect.any(String),
          remainingSeconds: 30,
        },
      })
    );
    expect(mockContext.collectAnswer).not.toHaveBeenCalledWith(
      expect.objectContaining({ targetElement: 'instructions_read', value: 'true' })
    );
    expect(mockContext.answers.instructions_read).not.toBe('true');
    expect(checkbox).not.toBeChecked();
  });

  it('allows checking after countdown completes and logs checkbox_check', async () => {
    const { rerender } = render(<Page01Notice />);

    for (let i = 0; i < 31; i += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
    }

    const checkbox = screen.getByRole('checkbox', { name: '我已阅读并理解上述注意事项' });
    expect(checkbox).toHaveAttribute('aria-disabled', 'false');

    fireEvent.click(checkbox);

    expect(mockContext.collectAnswer).toHaveBeenCalledWith({
      targetElement: 'instructions_read',
      value: 'true',
    });
    expect(mockContext.logOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        targetElement: 'P1.01_阅读确认复选框',
        eventType: EventTypes.CHECKBOX_CHECK,
        value: '已勾选',
      })
    );

    rerender(<Page01Notice />);
    expect(screen.getByRole('checkbox', { name: '我已阅读并理解上述注意事项' })).toBeChecked();
  });
});
