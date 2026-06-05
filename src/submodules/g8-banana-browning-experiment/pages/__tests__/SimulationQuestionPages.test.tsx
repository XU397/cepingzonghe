import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Page09BananaBrowningSimulationMain from '../Page09BananaBrowningSimulationMain';
import Page10SimulationQuestion1 from '../Page10SimulationQuestion1';
import Page11SimulationQuestion2 from '../Page11SimulationQuestion2';
import Page12SimulationQuestion3 from '../Page12SimulationQuestion3';

type MockAnswerValue = string | number | boolean | null;

interface MockPageContext {
  logOperation: ReturnType<typeof vi.fn>;
  setPageStartTime: ReturnType<typeof vi.fn>;
  collectAnswer: ReturnType<typeof vi.fn>;
  answers: Record<string, MockAnswerValue>;
  getPagePrefix: ReturnType<typeof vi.fn>;
}

interface TraceOperationValue {
  exp_run_id?: string;
  question_id?: string;
  option_id?: string;
  value_before?: unknown;
  value_after?: unknown;
  metadata?: Record<string, unknown>;
}

interface TraceOperation {
  eventType: string;
  targetElement: string;
  value: TraceOperationValue;
}

let mockPageContext: MockPageContext | null = null;

vi.mock('../../context/G8BananaBrowningContext', async () => {
  const actual = await vi.importActual<typeof import('../../context/G8BananaBrowningContext')>(
    '../../context/G8BananaBrowningContext'
  );

  return {
    ...actual,
    useG8BananaBrowningContext: () => mockPageContext ?? actual.useG8BananaBrowningContext(),
  };
});

vi.mock('../../components/SimulationPanel', () => ({
  default: ({
    traceLogger,
  }: {
    traceLogger: {
      executeExp(expRunId: string, metadata?: Record<string, unknown>): unknown;
    } | null;
  }) => (
    <button
      data-testid="simulation-run-result"
      onClick={() =>
        traceLogger?.executeExp('banana_days_3', {
          param_snapshot: { days: 3 },
          result_snapshot: {
            day: 3,
            results: [{ origin: '海南', temperature: '2℃', browning: 0.05 }],
          },
          click_debounce_applied: false,
        })
      }
    >
      记录模拟结果
    </button>
  ),
}));

const LEGACY_EVENT_TYPES = new Set([
  'simulation_operation',
  'simulation_run_result',
  'radio_select',
  'click',
]);

const cases: Array<{
  answerLabel: string;
  optionId: string;
  savedAnswer: string;
  savedAnswerOptionId: string;
  questionKey: string;
  questionId: string;
  questionIndex: number;
  PageComponent: ComponentType;
  targetPrefix: string;
}> = [
  {
    answerLabel: '6天',
    optionId: 'option_b',
    savedAnswer: '3天',
    savedAnswerOptionId: 'option_a',
    questionKey: 'Q5_海南香蕉变黑时间',
    questionId: 'question_1',
    questionIndex: 1,
    PageComponent: Page10SimulationQuestion1,
    targetPrefix: 'P1.10_',
  },
  {
    answerLabel: '海南香蕉',
    optionId: 'option_a',
    savedAnswer: '菲律宾香蕉',
    savedAnswerOptionId: 'option_b',
    questionKey: 'Q6_常温储存品种',
    questionId: 'question_2',
    questionIndex: 2,
    PageComponent: Page11SimulationQuestion2,
    targetPrefix: 'P1.11_',
  },
  {
    answerLabel: '18℃',
    optionId: 'option_c',
    savedAnswer: '2℃',
    savedAnswerOptionId: 'option_a',
    questionKey: 'Q7_平缓温度',
    questionId: 'question_3',
    questionIndex: 3,
    PageComponent: Page12SimulationQuestion3,
    targetPrefix: 'P1.12_',
  },
];

const buildMockPageContext = (
  answerOverrides: Record<string, MockAnswerValue> = {},
  targetPrefix = 'P1.10_'
): MockPageContext => {
  const answers = { ...answerOverrides };

  return {
    logOperation: vi.fn(),
    setPageStartTime: vi.fn(),
    collectAnswer: vi.fn(({ targetElement, value }: { targetElement: string; value: string }) => {
      answers[targetElement] = value;
    }),
    answers,
    getPagePrefix: vi.fn(() => targetPrefix),
  };
};

const readMockOperations = (): TraceOperation[] =>
  (mockPageContext?.logOperation.mock.calls ?? []).map(([operation]) => operation);

const expectNoLegacyEvents = (operations: TraceOperation[]) => {
  operations.forEach(operation => {
    expect(LEGACY_EVENT_TYPES.has(operation.eventType)).toBe(false);
  });
};

describe('Simulation question pages', () => {
  beforeEach(() => {
    mockPageContext = null;
  });

  afterEach(() => {
    mockPageContext = null;
    vi.clearAllMocks();
  });

  it('simulation main page starts with L2 START_PAGE and passes EXECUTE_EXP logger', () => {
    mockPageContext = buildMockPageContext({}, 'P1.9_');

    render(<Page09BananaBrowningSimulationMain />);
    fireEvent.click(screen.getByTestId('simulation-run-result'));

    const operations = readMockOperations();

    expect(operations[0]).toEqual(
      expect.objectContaining({
        targetElement: 'P1.9_page',
        eventType: 'START_PAGE',
        value: expect.objectContaining({
          metadata: expect.objectContaining({
            initial_state: { days: 0 },
          }),
        }),
      })
    );
    expect(operations.some(operation => operation.eventType === 'EXECUTE_EXP')).toBe(true);
    expectNoLegacyEvents(operations);
  });

  it.each(cases)('starts $questionId with L2 START_PAGE metadata', ({ PageComponent, targetPrefix }) => {
    mockPageContext = buildMockPageContext({}, targetPrefix);

    render(<PageComponent />);

    expect(mockPageContext.setPageStartTime).toHaveBeenCalledTimes(1);
    expect(readMockOperations()[0]).toEqual(
      expect.objectContaining({
        targetElement: `${targetPrefix}page`,
        eventType: 'START_PAGE',
        value: expect.objectContaining({
          metadata: expect.objectContaining({
            initial_state: { selected_option: null },
          }),
        }),
      })
    );
    expectNoLegacyEvents(readMockOperations());
  });

  it.each(cases)('simulation panel emits EXECUTE_EXP for $questionId', ({ PageComponent, targetPrefix }) => {
    mockPageContext = buildMockPageContext({}, targetPrefix);

    render(<PageComponent />);
    fireEvent.click(screen.getByTestId('simulation-run-result'));

    const operations = readMockOperations();
    const executeOperations = operations.filter(operation => operation.eventType === 'EXECUTE_EXP');

    expect(executeOperations).toHaveLength(1);
    expect(executeOperations[0]).toEqual(
      expect.objectContaining({
        targetElement: `${targetPrefix}execute_exp`,
        value: expect.objectContaining({
          exp_run_id: 'banana_days_3',
          metadata: expect.objectContaining({
            param_snapshot: { days: 3 },
            result_snapshot: {
              day: 3,
              results: [{ origin: '海南', temperature: '2℃', browning: 0.05 }],
            },
            click_debounce_applied: false,
          }),
        }),
      })
    );
    expectNoLegacyEvents(operations);
  });

  it.each(cases)(
    'SELECT_ANSWER logs option id and metadata for $questionId',
    ({ PageComponent, answerLabel, optionId, questionKey, questionId, questionIndex, targetPrefix }) => {
      mockPageContext = buildMockPageContext({}, targetPrefix);

      render(<PageComponent />);
      fireEvent.click(screen.getByLabelText(answerLabel));

      expect(mockPageContext.collectAnswer).toHaveBeenCalledWith({
        targetElement: questionKey,
        value: answerLabel,
      });

      const operations = readMockOperations();
      const selectionOperations = operations.filter(operation => operation.eventType === 'SELECT_ANSWER');

      expect(selectionOperations).toHaveLength(1);
      expect(selectionOperations[0]).toEqual(
        expect.objectContaining({
          targetElement: `${targetPrefix}${questionId}_${optionId}`,
          value: expect.objectContaining({
            question_id: questionId,
            option_id: optionId,
            value_before: null,
            value_after: optionId,
            metadata: expect.objectContaining({
              option_text: answerLabel,
              question_index: questionIndex,
              total_question_count: 3,
            }),
          }),
        })
      );
      expectNoLegacyEvents(operations);
    }
  );

  it.each(cases)(
    'SELECT_ANSWER uses rehydrated saved answer as value_before for $questionId',
    ({
      PageComponent,
      answerLabel,
      optionId,
      savedAnswer,
      savedAnswerOptionId,
      questionKey,
      questionId,
      targetPrefix,
    }) => {
      mockPageContext = buildMockPageContext({ [questionKey]: savedAnswer }, targetPrefix);

      render(<PageComponent />);
      fireEvent.click(screen.getByLabelText(answerLabel));

      const selectionOperation = readMockOperations().find(
        operation => operation.eventType === 'SELECT_ANSWER'
      );

      expect(selectionOperation).toEqual(
        expect.objectContaining({
          targetElement: `${targetPrefix}${questionId}_${optionId}`,
          value: expect.objectContaining({
            value_before: savedAnswerOptionId,
            value_after: optionId,
          }),
        })
      );
      expectNoLegacyEvents(readMockOperations());
    }
  );

  it.each(cases)(
    'rehydrates selected option from raw saved answer for $questionId',
    ({ PageComponent, answerLabel, questionKey, targetPrefix }) => {
      mockPageContext = buildMockPageContext({}, targetPrefix);
      const { rerender, unmount } = render(<PageComponent />);

      expect(screen.getByLabelText(answerLabel)).not.toBeChecked();

      mockPageContext.answers[questionKey] = answerLabel;
      rerender(<PageComponent />);
      expect(screen.getByLabelText(answerLabel)).toBeChecked();
      expectNoLegacyEvents(readMockOperations());

      unmount();
      mockPageContext = buildMockPageContext({ [questionKey]: answerLabel }, targetPrefix);
      render(<PageComponent />);

      expect(screen.getByLabelText(answerLabel)).toBeChecked();
      expectNoLegacyEvents(readMockOperations());
    }
  );
});
