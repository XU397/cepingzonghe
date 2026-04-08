import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentType } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EventTypes from '@shared/services/submission/eventTypes.js';
import Page10SimulationQuestion1 from '../Page10SimulationQuestion1';
import Page11SimulationQuestion2 from '../Page11SimulationQuestion2';
import Page12SimulationQuestion3 from '../Page12SimulationQuestion3';
import G8BananaBrowningExperiment from '../../Component';
import type { PageId } from '../../mapping';
import type { SubmoduleProps } from '../../types';

const defaultSubmitSpy = vi.fn(async () => true);
let lastOnNextResult: boolean | undefined;
type MockAnswerValue = string | number | boolean | null;

interface MockPageContext {
  logOperation: ReturnType<typeof vi.fn>;
  setPageStartTime: ReturnType<typeof vi.fn>;
  collectAnswer: ReturnType<typeof vi.fn>;
  answers: Record<string, MockAnswerValue>;
  getPagePrefix: ReturnType<typeof vi.fn>;
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

vi.mock('@shared/ui/PageFrame', async () => {
  const ReactModule = await import('react');
  const { useG8BananaBrowningContext } = await import('../../context/G8BananaBrowningContext');

  const AssessmentPageFrame = ({ children, footerSlot, onNext }: any) => {
    const { currentPageId, operations } = useG8BananaBrowningContext();

    return ReactModule.createElement(
      'div',
      {},
      ReactModule.createElement(
        'pre',
        { 'data-testid': 'frame-state' },
        JSON.stringify({ currentPageId, operations })
      ),
      children,
      footerSlot,
      ReactModule.createElement(
        'button',
        {
          'data-testid': 'frame-next-button',
          onClick: async () => {
            lastOnNextResult = await onNext({ defaultSubmit: defaultSubmitSpy });
          },
        },
        '下一步'
      )
    );
  };

  return { AssessmentPageFrame };
});

vi.mock('../../components/SimulationPanel', () => ({
  default: ({ logOperation, targetPrefix }: { logOperation: Function; targetPrefix: string }) => (
    <button
      data-testid="simulation-run-result"
      onClick={() =>
        logOperation({
          targetElement: `${targetPrefix}模拟结果`,
          eventType: EventTypes.SIMULATION_RUN_RESULT,
          value: { status: 'done' },
          time: new Date().toISOString(),
        })
      }
    >
      记录模拟结果
    </button>
  ),
}));

const cases: Array<{
  pageId: PageId;
  answerLabel: string;
  labeledValue: string;
  questionKey: string;
  PageComponent: ComponentType;
  targetPrefix: string;
}> = [
  {
    pageId: 'simulation_question_1',
    answerLabel: '6天',
    labeledValue: 'B. 6天',
    questionKey: 'Q5_海南香蕉变黑时间',
    PageComponent: Page10SimulationQuestion1,
    targetPrefix: 'P1.10_',
  },
  {
    pageId: 'simulation_question_2',
    answerLabel: '海南香蕉',
    labeledValue: 'A. 海南香蕉',
    questionKey: 'Q6_常温储存品种',
    PageComponent: Page11SimulationQuestion2,
    targetPrefix: 'P1.11_',
  },
  {
    pageId: 'simulation_question_3',
    answerLabel: '18℃',
    labeledValue: 'C. 18℃',
    questionKey: 'Q7_平缓温度',
    PageComponent: Page12SimulationQuestion3,
    targetPrefix: 'P1.12_',
  },
];

const mockUserContext: SubmoduleProps['userContext'] = {
  user: {
    studentName: '测试学生',
    examNo: 'E001',
    batchCode: 'B001',
  },
  session: {
    pageNum: '1',
    moduleUrl: '/flow/test',
    isAuthenticated: true,
  },
  helpers: {
    logOperation: vi.fn(),
    collectAnswer: vi.fn(),
    navigateToPage: vi.fn(),
  },
};

const renderExperiment = (initialPageId: PageId) =>
  render(
    <G8BananaBrowningExperiment
      initialPageId={initialPageId}
      userContext={mockUserContext}
      flowContext={{
        flowId: 'flow-1',
        submoduleId: 'g8-banana-browning-experiment',
        stepIndex: 0,
      }}
    />
  );

const readFrameState = () =>
  JSON.parse(screen.getByTestId('frame-state').textContent || '{"currentPageId":"","operations":[]}') as {
    currentPageId: string;
    operations: Array<{
      eventType: string;
      targetElement: string;
      value: string | { missing?: string[] };
    }>; 
  };

const getMissingFromOperationValue = (value: string | { missing?: string[] }): string[] | undefined =>
  typeof value === 'string' ? undefined : value.missing;

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

const readMockOperations = () =>
  (mockPageContext?.logOperation.mock.calls ?? []).map(([operation]) => operation);

describe('Simulation question pages', () => {
  beforeEach(() => {
    defaultSubmitSpy.mockClear();
    lastOnNextResult = undefined;
    mockPageContext = null;
  });

  afterEach(() => {
    mockPageContext = null;
    vi.clearAllMocks();
  });

  it.each(cases)(
    'requires simulation_run_result before submit for $pageId',
    async ({ pageId, questionKey }) => {
      renderExperiment(pageId);

      await screen.findByTestId('frame-next-button');
      fireEvent.click(screen.getByTestId('frame-next-button'));

      await waitFor(() => {
        const blockedOperations = readFrameState().operations.filter(
          operation => operation.eventType === EventTypes.CLICK_BLOCKED
        );

        expect(blockedOperations).toHaveLength(1);
        expect(getMissingFromOperationValue(blockedOperations[0].value)).toEqual([
          'simulation_run_result',
          questionKey,
        ]);
      });

      expect(defaultSubmitSpy).not.toHaveBeenCalled();
      expect(lastOnNextResult).toBe(false);
    }
  );

  it.each(cases)(
    'passes after result and answer for $pageId',
    async ({ pageId, answerLabel }) => {
      renderExperiment(pageId);

      await screen.findByTestId('simulation-run-result');
      fireEvent.click(screen.getByTestId('simulation-run-result'));
      fireEvent.click(screen.getByLabelText(answerLabel));

      expect(
        readFrameState().operations.some(operation => operation.eventType === EventTypes.CLICK_BLOCKED)
      ).toBe(false);

      fireEvent.click(screen.getByTestId('frame-next-button'));

      await waitFor(() => {
        expect(defaultSubmitSpy).toHaveBeenCalled();
        expect(lastOnNextResult).toBe(true);
      });

      expect(
        readFrameState().operations.some(operation => operation.eventType === EventTypes.CLICK_BLOCKED)
      ).toBe(false);
    }
  );

  it.each(cases)(
    'radio_select logs labeled value and removes legacy click for $pageId',
    ({ PageComponent, answerLabel, labeledValue, questionKey, targetPrefix }) => {
      mockPageContext = buildMockPageContext({}, targetPrefix);

      render(<PageComponent />);
      fireEvent.click(screen.getByLabelText(answerLabel));

      expect(mockPageContext.collectAnswer).toHaveBeenCalledWith({
        targetElement: questionKey,
        value: answerLabel,
      });

      const operations = readMockOperations();
      const selectionOperations = operations.filter(
        operation => operation.targetElement === `${targetPrefix}${questionKey}`
      );

      expect(selectionOperations).toHaveLength(1);
      expect(selectionOperations[0]).toEqual(
        expect.objectContaining({
          targetElement: `${targetPrefix}${questionKey}`,
          eventType: EventTypes.RADIO_SELECT,
          value: labeledValue,
        })
      );
      expect(operations.some(operation => operation.eventType === EventTypes.CLICK)).toBe(false);
    }
  );

  it.each(cases)(
    'rehydrates selected option from raw saved answer for $pageId',
    ({ PageComponent, answerLabel, questionKey, targetPrefix }) => {
      mockPageContext = buildMockPageContext({}, targetPrefix);
      const { rerender, unmount } = render(<PageComponent />);

      const option = screen.getByLabelText(answerLabel);
      expect(option).not.toBeChecked();

      mockPageContext.answers[questionKey] = answerLabel;
      rerender(<PageComponent />);
      expect(screen.getByLabelText(answerLabel)).toBeChecked();
      expect(readMockOperations().some(operation => operation.eventType === EventTypes.CLICK)).toBe(
        false
      );

      unmount();
      mockPageContext = buildMockPageContext({ [questionKey]: answerLabel }, targetPrefix);
      render(<PageComponent />);

      expect(screen.getByLabelText(answerLabel)).toBeChecked();
      expect(readMockOperations().some(operation => operation.eventType === EventTypes.CLICK)).toBe(
        false
      );
    }
  );
});
