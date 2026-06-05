import { createElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EventTypes from '@shared/services/submission/eventTypes.js';
import {
  RESERVED_TARGET_ELEMENTS,
  validateMarkObject,
  type Answer,
  type MarkObject,
  type Operation,
} from '@shared/services/submission/schema.ts';
import { validateTraceMark } from '../trace/useBananaTraceLogger';
import G8BananaBrowningExperiment from '../Component';
import type { PageId } from '../mapping';
import type { SubmoduleProps } from '../types';

const defaultSubmitSpy = vi.fn(async () => true);
const submitSpy = vi.fn(async (options?: { markOverride?: MarkObject }) => {
  try {
    validateTraceMark(options?.markOverride);
    return true;
  } catch {
    return false;
  }
});
let lastOnNextResult: boolean | undefined;

vi.mock('@shared/ui/PageFrame', async () => {
  const ReactModule = await import('react');
  const { useG8BananaBrowningContext } = await import('../context/G8BananaBrowningContext');

  const AssessmentPageFrame = ({ children, footerSlot, onNext }: any) => {
    const { currentPageId, operations, validationError } = useG8BananaBrowningContext();

    return ReactModule.createElement(
      'div',
      {},
      ReactModule.createElement(
        'pre',
        { 'data-testid': 'frame-state' },
        JSON.stringify({ currentPageId, operations, validationError })
      ),
      children,
      footerSlot,
      ReactModule.createElement(
        'button',
        {
          'data-testid': 'frame-next-button',
          onClick: async () => {
            lastOnNextResult = await onNext({
              defaultSubmit: defaultSubmitSpy,
              submit: submitSpy,
            });
          },
        },
        '下一步'
      )
    );
  };

  return { AssessmentPageFrame };
});

vi.mock('../pages/Page01Notice', async () => {
  const ReactModule = await import('react');

  return {
    default: () =>
      ReactModule.createElement('div', { 'data-testid': 'page-intro_notice' }, 'intro_notice'),
  };
});

vi.mock('../pages/Page02BananaBrowning', async () => {
  const ReactModule = await import('react');
  const EventTypesModule = await import('@shared/services/submission/eventTypes.js');
  const { useG8BananaBrowningContext } = await import('../context/G8BananaBrowningContext');

  return {
    default: () => {
      const { logOperation } = useG8BananaBrowningContext();

      ReactModule.useEffect(() => {
        logOperation({
          targetElement: 'P1.02_页面进入',
          eventType: EventTypesModule.default.PAGE_ENTER,
          value: 'legacy page enter',
          time: new Date().toISOString(),
          pageId: 'page_02_banana_browning',
        });
      }, [logOperation]);

      return ReactModule.createElement(
        'div',
        { 'data-testid': 'page-page_02_banana_browning' },
        'page_02_banana_browning'
      );
    },
  };
});

vi.mock('../pages/Page10SimulationQuestion1', async () => {
  const ReactModule = await import('react');
  const { useG8BananaBrowningContext } = await import('../context/G8BananaBrowningContext');

  return {
    default: () => {
      const { collectAnswer, logOperation } = useG8BananaBrowningContext();

      return ReactModule.createElement(
        'div',
        { 'data-testid': 'page-simulation_question_1' },
        ReactModule.createElement('span', {}, 'simulation_question_1'),
        ReactModule.createElement(
          'button',
          {
            'data-testid': 'simulation-question-1-run',
            onClick: () =>
              logOperation({
                targetElement: 'P1.10_execute_exp',
                eventType: 'EXECUTE_EXP',
                value: {
                  trace_id: 'trace_runtime_simulation_question_1_execute',
                  page_id: 'page_09_experiment_question_1',
                  page_type: 'D2_SIMULATION_QUESTION',
                  target_id: 'execute_exp',
                  target_type: 'experiment',
                  exp_run_id: 'banana_days_6',
                  metadata: {
                    param_snapshot: { days: 6 },
                    result_snapshot: { day: 6, results: [] },
                    click_debounce_applied: false,
                  },
                },
                time: new Date().toISOString(),
                pageId: 'simulation_question_1',
              }),
          },
          '运行模拟'
        ),
        ReactModule.createElement(
          'button',
          {
            'data-testid': 'simulation-question-1-answer',
            onClick: () =>
              collectAnswer({
                targetElement: 'Q5_海南香蕉变黑时间',
                value: '6天',
                pageId: 'simulation_question_1',
              }),
          },
          '选择答案'
        )
      );
    },
  };
});

vi.mock('../pages/Page13SolutionSelection', async () => {
  const ReactModule = await import('react');
  const { useG8BananaBrowningContext } = await import('../context/G8BananaBrowningContext');

  return {
    default: () => {
      const { collectAnswer } = useG8BananaBrowningContext();

      return ReactModule.createElement(
        'div',
        { 'data-testid': 'page-solution_selection' },
        ReactModule.createElement('span', {}, 'solution_selection'),
        ReactModule.createElement(
          'button',
          {
            'data-testid': 'solution-selection-plan-complete',
            onClick: () => {
              collectAnswer({
                targetElement: 'Q8_方案表格',
                value: '方案B',
                pageId: 'solution_selection',
              });
              collectAnswer({
                targetElement: 'Q8_最优方案',
                value: '方案B',
                pageId: 'solution_selection',
              });
            },
          },
          '完成方案选择'
        )
      );
    },
  };
});

type MarkFixture = MarkObject & {
  pageId: string;
  expectedBlockedMissing?: string[];
  expectedAnswerValues?: string[];
};

type OperationInput = Omit<Operation, 'code'>;
type AnswerInput = Omit<Answer, 'code'>;
type FrameState = {
  currentPageId: string;
  validationError: string;
  operations: Array<{
    eventType: string;
    targetElement: string;
    value: string | Record<string, unknown>;
  }>;
};

const FLOW_ID = 'flow-demo';
const SUBMODULE_ID = 'g8-banana-browning-experiment';
const STEP_INDEX = 0;
const FLOW_PREFIX = `${FLOW_ID}/${SUBMODULE_ID}/${STEP_INDEX}`;
const PAGE_NUMBER_REGEX = /^[1-9]\d*\.\d{2}$/;
const LOCAL_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const RESERVED_TARGETS = new Set<string>(RESERVED_TARGET_ELEMENTS);
const L2_SIMULATION_EVENTS = {
  executeExp: 'EXECUTE_EXP',
  selectAnswer: 'SELECT_ANSWER',
  setExpParam: 'SET_EXP_PARAM',
  submitAttempt: 'SUBMIT_ATTEMPT',
  startPage: 'START_PAGE',
} as const;
const LEGACY_SIMULATION_EVENTS_FORBIDDEN_IN_L2 = new Set([
  'simulation_operation',
  'simulation_run_result',
  'radio_select',
]);
const RUNTIME_FLOW_CONTEXT = {
  flowId: 'flow-1',
  submoduleId: 'g8-banana-browning-experiment',
  stepIndex: 0,
};
const USER_CONTEXT: SubmoduleProps['userContext'] = {
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

const baseTime = Date.parse('2026-04-07T08:00:00Z');
const isoTime = (offsetSeconds: number) => new Date(baseTime + offsetSeconds * 1000).toISOString();

const withCodes = <T extends object>(items: T[]): Array<T & { code: number }> =>
  items.map((item, index) => ({ ...item, code: index + 1 }));

const renderExperiment = (initialPageId: PageId) =>
  render(
    createElement(G8BananaBrowningExperiment, {
      initialPageId,
      userContext: USER_CONTEXT,
      flowContext: RUNTIME_FLOW_CONTEXT,
    })
  );

const readFrameState = (): FrameState =>
  JSON.parse(
    screen.getByTestId('frame-state').textContent ||
      '{"currentPageId":"","validationError":"","operations":[]}'
  ) as FrameState;

const flowContextOp = (pageId: string, timeOffset: number): OperationInput => ({
  targetElement: 'flow_context',
  eventType: EventTypes.FLOW_CONTEXT,
  value: JSON.stringify({
    flowId: FLOW_ID,
    submoduleId: SUBMODULE_ID,
    stepIndex: STEP_INDEX,
    moduleName: '8年级香蕉变黑科学探究',
    pageId,
  }),
  time: isoTime(timeOffset),
});

const submitSuccessOp = (pageNumber: string, timeOffset: number): OperationInput => ({
  targetElement: `P${pageNumber}_submit`,
  eventType: EventTypes.PAGE_SUBMIT_SUCCESS,
  value: { channel: 'usePageSubmission', durationSeconds: timeOffset },
  time: isoTime(timeOffset),
});

const blockedValue = (
  reason: string,
  missing: string[],
  timeOffset: number,
  extras: Record<string, unknown> = {}
) => ({
  reason,
  missing,
  timestamp: isoTime(timeOffset),
  ...extras,
});

type L2SimulationFixtureConfig = {
  pageNumber: string;
  pageId: PageId;
  standardPageId: string;
  pageIndex: number;
  questionId: string;
  questionIndex: number;
};

const L2_SIMULATION_FIXTURES: Record<string, L2SimulationFixtureConfig> = {
  simulation_question_1: {
    pageNumber: '1.10',
    pageId: 'simulation_question_1',
    standardPageId: 'page_09_experiment_question_1',
    pageIndex: 9,
    questionId: 'question_1',
    questionIndex: 1,
  },
  simulation_question_2: {
    pageNumber: '1.11',
    pageId: 'simulation_question_2',
    standardPageId: 'page_10_experiment_question_2',
    pageIndex: 10,
    questionId: 'question_2',
    questionIndex: 2,
  },
  simulation_question_3: {
    pageNumber: '1.12',
    pageId: 'simulation_question_3',
    standardPageId: 'page_11_experiment_question_3',
    pageIndex: 11,
    questionId: 'question_3',
    questionIndex: 3,
  },
};

const traceOperation = (
  config: L2SimulationFixtureConfig,
  eventType: string,
  targetId: string,
  targetType: string,
  timeOffset: number,
  valuePatch: Record<string, unknown> = {},
  metadata: Record<string, unknown> = {}
): OperationInput => ({
  targetElement: `P${config.pageNumber}_${targetId}`,
  eventType,
  value: {
    trace_id: `trace_${config.pageId}_${eventType}_${timeOffset}`,
    page_id: config.standardPageId,
    page_type: 'D2_SIMULATION_QUESTION',
    target_id: targetId,
    target_type: targetType,
    ...valuePatch,
    metadata: {
      schema_version: 'science-inquiry-trace-v2.1',
      field_registry_version: 'science-inquiry-field-registry-v2.1',
      content_registry_version: 'science-inquiry-content-registry-banana-v2.1',
      page_index: config.pageIndex,
      legacy_page_id: config.pageId,
      ...metadata,
    },
  },
  time: isoTime(timeOffset),
  pageId: config.pageId,
});

const startPageOp = (config: L2SimulationFixtureConfig, timeOffset: number): OperationInput =>
  traceOperation(config, L2_SIMULATION_EVENTS.startPage, 'page', 'page', timeOffset, {}, {
    initial_state: { selected_option: null },
  });

const submitAttemptOp = (
  config: L2SimulationFixtureConfig,
  timeOffset: number,
  validationStatus: 'blocked' | 'success',
  missingFields: string[]
): OperationInput =>
  traceOperation(
    config,
    L2_SIMULATION_EVENTS.submitAttempt,
    'next_button',
    'button',
    timeOffset,
    {
      submit_attempt_id: `submit_${config.pageId}_${validationStatus}_${timeOffset}`,
      validation_status: validationStatus,
    },
    { missing_fields: missingFields }
  );

const setExpParamOp = (
  config: L2SimulationFixtureConfig,
  timeOffset: number,
  valueBefore: number,
  valueAfter: number
): OperationInput =>
  traceOperation(
    config,
    L2_SIMULATION_EVENTS.setExpParam,
    'exp_param_days',
    'experiment',
    timeOffset,
    {
      param_id: 'exp_param_days',
      param_name: 'days',
      value_before: valueBefore,
      value_after: valueAfter,
    },
    { param_snapshot: { days: valueAfter } }
  );

const executeExpOp = (
  config: L2SimulationFixtureConfig,
  timeOffset: number,
  day: number,
  results: Array<Record<string, unknown>>
): OperationInput =>
  traceOperation(
    config,
    L2_SIMULATION_EVENTS.executeExp,
    'execute_exp',
    'experiment',
    timeOffset,
    { exp_run_id: `banana_days_${day}` },
    {
      param_snapshot: { days: day },
      result_snapshot: { day, results },
      click_debounce_applied: false,
    }
  );

const selectAnswerOp = (
  config: L2SimulationFixtureConfig,
  timeOffset: number,
  optionId: string,
  optionText: string
): OperationInput =>
  traceOperation(
    config,
    L2_SIMULATION_EVENTS.selectAnswer,
    `${config.questionId}_${optionId}`,
    'radio',
    timeOffset,
    {
      question_id: config.questionId,
      option_id: optionId,
      value_before: null,
      value_after: optionId,
    },
    {
      option_text: optionText,
      question_index: config.questionIndex,
      total_question_count: 3,
    }
  );

const createMark = (config: {
  pageNumber: string;
  pageId: string;
  title: string;
  operations: OperationInput[];
  answers?: AnswerInput[];
  beginOffset: number;
  endOffset: number;
  expectedBlockedMissing?: string[];
  expectedAnswerValues?: string[];
}): MarkFixture => ({
  pageNumber: config.pageNumber,
  pageDesc: `[${FLOW_PREFIX}] ${config.title}`,
  operationList: withCodes(config.operations),
  answerList: withCodes(config.answers || []),
  beginTime: isoTime(config.beginOffset),
  endTime: isoTime(config.endOffset),
  imgList: [],
  pageId: config.pageId,
  expectedBlockedMissing: config.expectedBlockedMissing,
  expectedAnswerValues: config.expectedAnswerValues,
});

const marks: MarkFixture[] = [
  createMark({
    pageNumber: '1.01',
    pageId: 'intro_notice',
    title: '注意事项',
    operations: [
      {
        targetElement: 'P1.01_页面进入',
        eventType: EventTypes.PAGE_ENTER,
        value: 'intro_notice',
        time: isoTime(0),
      },
      {
        targetElement: 'P1.01_任务计时器',
        eventType: EventTypes.TIMER_START,
        value: { duration: 30, unit: 'seconds' },
        time: isoTime(1),
      },
      {
        targetElement: 'P1.01_下一页按钮',
        eventType: EventTypes.CLICK_BLOCKED,
        value: blockedValue('countdown_not_finished', ['timer_completed', 'instructions_read'], 2, {
          message: '请仔细阅读注意事项，倒计时结束后才能继续',
        }),
        time: isoTime(2),
      },
      {
        targetElement: 'P1.01_任务计时器',
        eventType: EventTypes.TIMER_COMPLETE,
        value: { duration: 30, unit: 'seconds', remaining: 0 },
        time: isoTime(31),
      },
      {
        targetElement: 'P1.01_阅读确认复选框',
        eventType: EventTypes.CHECKBOX_CHECK,
        value: '已勾选',
        time: isoTime(32),
      },
      {
        targetElement: 'P1.01_下一页按钮',
        eventType: EventTypes.NEXT_CLICK,
        value: 'to_page_02_banana_browning',
        time: isoTime(33),
      },
      {
        targetElement: 'P1.01_页面退出',
        eventType: EventTypes.PAGE_EXIT,
        value: 'intro_notice',
        time: isoTime(34),
      },
      flowContextOp('intro_notice', 35),
      submitSuccessOp('1.01', 36),
    ],
    beginOffset: 0,
    endOffset: 36,
    expectedBlockedMissing: ['timer_completed', 'instructions_read'],
  }),
  createMark({
    pageNumber: '1.10',
    pageId: 'simulation_question_1',
    title: '模拟实验 + 问题1',
    operations: [
      startPageOp(L2_SIMULATION_FIXTURES.simulation_question_1, 100),
      submitAttemptOp(
        L2_SIMULATION_FIXTURES.simulation_question_1,
        102,
        'blocked',
        ['question_1_answer']
      ),
      setExpParamOp(L2_SIMULATION_FIXTURES.simulation_question_1, 103, 3, 6),
      executeExpOp(
        L2_SIMULATION_FIXTURES.simulation_question_1,
        105,
        6,
        [
          { origin: '海南', temperature: '2℃', browning: 0.35 },
          { origin: '海南', temperature: '10℃', browning: 0.04 },
          { origin: '海南', temperature: '18℃', browning: 0.06 },
          { origin: '菲律宾', temperature: '2℃', browning: 0.65 },
          { origin: '菲律宾', temperature: '10℃', browning: 0.03 },
          { origin: '菲律宾', temperature: '18℃', browning: 0.05 },
        ]
      ),
      selectAnswerOp(L2_SIMULATION_FIXTURES.simulation_question_1, 106, 'option_b', '6天'),
      submitAttemptOp(
        L2_SIMULATION_FIXTURES.simulation_question_1,
        109,
        'success',
        []
      ),
    ],
    answers: [
      {
        targetElement:
          'P1.10_在模拟实验中，2℃条件下储存的海南香蕉，从开始到完全变黑需要多长时间？',
        value: 'B. 6天',
      },
    ],
    beginOffset: 100,
    endOffset: 109,
    expectedBlockedMissing: ['question_1_answer'],
    expectedAnswerValues: ['B. 6天'],
  }),
  createMark({
    pageNumber: '1.11',
    pageId: 'simulation_question_2',
    title: '模拟实验 + 问题2',
    operations: [
      startPageOp(L2_SIMULATION_FIXTURES.simulation_question_2, 120),
      executeExpOp(
        L2_SIMULATION_FIXTURES.simulation_question_2,
        122,
        15,
        [
          { origin: '海南', temperature: '2℃', browning: 1 },
          { origin: '海南', temperature: '10℃', browning: 0.33 },
          { origin: '海南', temperature: '18℃', browning: 0.46 },
          { origin: '菲律宾', temperature: '2℃', browning: 1 },
          { origin: '菲律宾', temperature: '10℃', browning: 0.25 },
          { origin: '菲律宾', temperature: '18℃', browning: 0.27 },
        ]
      ),
      selectAnswerOp(L2_SIMULATION_FIXTURES.simulation_question_2, 123, 'option_a', '海南香蕉'),
      submitAttemptOp(
        L2_SIMULATION_FIXTURES.simulation_question_2,
        126,
        'success',
        []
      ),
    ],
    answers: [
      {
        targetElement: 'P1.11_模拟实验表明，哪个品种的香蕉更适合在常温下储存？',
        value: 'A. 海南香蕉',
      },
    ],
    beginOffset: 120,
    endOffset: 126,
    expectedAnswerValues: ['A. 海南香蕉'],
  }),
  createMark({
    pageNumber: '1.12',
    pageId: 'simulation_question_3',
    title: '模拟实验 + 问题3',
    operations: [
      startPageOp(L2_SIMULATION_FIXTURES.simulation_question_3, 140),
      executeExpOp(
        L2_SIMULATION_FIXTURES.simulation_question_3,
        142,
        15,
        [
          { origin: '海南', temperature: '2℃', browning: 1 },
          { origin: '海南', temperature: '10℃', browning: 0.33 },
          { origin: '海南', temperature: '18℃', browning: 0.46 },
          { origin: '菲律宾', temperature: '2℃', browning: 1 },
          { origin: '菲律宾', temperature: '10℃', browning: 0.25 },
          { origin: '菲律宾', temperature: '18℃', browning: 0.27 },
        ]
      ),
      selectAnswerOp(L2_SIMULATION_FIXTURES.simulation_question_3, 143, 'option_c', '18℃'),
      submitAttemptOp(
        L2_SIMULATION_FIXTURES.simulation_question_3,
        146,
        'success',
        []
      ),
    ],
    answers: [
      {
        targetElement:
          'P1.12_在模拟实验中，菲律宾香蕉在不同温度下储存时，黑变速度变化最平缓的是哪种温度条件？',
        value: 'C. 18℃',
      },
    ],
    beginOffset: 140,
    endOffset: 146,
    expectedAnswerValues: ['C. 18℃'],
  }),
  createMark({
    pageNumber: '1.13',
    pageId: 'solution_selection',
    title: '方案选择',
    operations: [
      {
        targetElement: 'P1.13_页面进入',
        eventType: EventTypes.PAGE_ENTER,
        value: 'solution_selection',
        time: isoTime(160),
      },
      flowContextOp('solution_selection', 161),
      {
        targetElement: 'P1.13_下一页按钮',
        eventType: EventTypes.CLICK_BLOCKED,
        value: blockedValue(
          'required_fields_missing',
          ['Q8_方案表格', 'Q8_最优方案', 'Q8_理由'],
          162,
          { message: '请完成当前页面必填项' }
        ),
        time: isoTime(162),
      },
      {
        targetElement: 'P1.13_方案表格',
        eventType: EventTypes.SELECT_CHANGE,
        value: '方案B',
        time: isoTime(163),
      },
      {
        targetElement: 'P1.13_最优方案',
        eventType: EventTypes.RADIO_SELECT,
        value: '方案B',
        time: isoTime(164),
      },
      {
        targetElement: 'P1.13_理由输入框',
        eventType: EventTypes.INPUT_CHANGE,
        value: { prev: '', next: '方案B在可操作性和保鲜效果之间更平衡' },
        time: isoTime(165),
      },
      {
        targetElement: 'P1.13_下一页按钮',
        eventType: EventTypes.NEXT_CLICK,
        value: 'to_task_completion',
        time: isoTime(166),
      },
      {
        targetElement: 'P1.13_页面退出',
        eventType: EventTypes.PAGE_EXIT,
        value: 'solution_selection',
        time: isoTime(167),
      },
      submitSuccessOp('1.13', 168),
    ],
    answers: [
      {
        targetElement: 'P1.13_方案选择表格',
        value: '方案B',
      },
      {
        targetElement: 'P1.13_最优方案',
        value: '方案B',
      },
      {
        targetElement: 'P1.13_请说明理由',
        value: '方案B在可操作性和保鲜效果之间更平衡',
      },
    ],
    beginOffset: 160,
    endOffset: 168,
    expectedBlockedMissing: ['Q8_方案表格', 'Q8_最优方案', 'Q8_理由'],
  }),
];

const assertPrefixedTargets = (mark: MarkFixture) => {
  for (const operation of mark.operationList) {
    if (!RESERVED_TARGETS.has(operation.targetElement)) {
      expect(operation.targetElement.startsWith(`P${mark.pageNumber}_`)).toBe(true);
    }
  }

  for (const answer of mark.answerList) {
    if (!RESERVED_TARGETS.has(answer.targetElement)) {
      expect(answer.targetElement.startsWith(`P${mark.pageNumber}_`)).toBe(true);
    }
  }
};

const isL2SimulationQuestionFixture = (mark: MarkFixture) =>
  mark.pageId === 'simulation_question_1' ||
  mark.pageId === 'simulation_question_2' ||
  mark.pageId === 'simulation_question_3';

describe('banana submission-format fixtures', () => {
  beforeEach(() => {
    defaultSubmitSpy.mockClear();
    submitSpy.mockClear();
    submitSpy.mockImplementation(async (options?: { markOverride?: MarkObject }) => {
      try {
        validateTraceMark(options?.markOverride);
        return true;
      } catch {
        return false;
      }
    });
    lastOnNextResult = undefined;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shared contract fixtures satisfy schema, page number, prefix, and single flow_context rules', () => {
    for (const mark of marks) {
      expect(mark.pageNumber).toMatch(PAGE_NUMBER_REGEX);
      assertPrefixedTargets(mark);
      if (isL2SimulationQuestionFixture(mark)) {
        expect(mark.operationList.filter(op => op.eventType === EventTypes.FLOW_CONTEXT)).toHaveLength(0);
        expect(() => validateTraceMark(mark)).not.toThrow();
      } else {
        expect(mark.operationList.filter(op => op.eventType === EventTypes.FLOW_CONTEXT)).toHaveLength(1);
        expect(() => validateMarkObject(mark)).not.toThrow();
      }
    }
  });

  it('handleFrameNext click_blocked payload stays machine-readable for intro_notice', async () => {
    const cases: Array<{
      pageId: PageId;
      pageTestId: string;
      pageNumber: string;
      reason: string;
      missing: string[];
      message: string;
    }> = [
      {
        pageId: 'intro_notice',
        pageTestId: 'page-intro_notice',
        pageNumber: '1.01',
        reason: 'countdown_not_finished',
        missing: ['timer_completed', 'instructions_read'],
        message: '请仔细阅读注意事项，倒计时结束后才能继续',
      },
    ];

    for (const testCase of cases) {
      const { unmount } = renderExperiment(testCase.pageId);

      await screen.findByTestId(testCase.pageTestId);
      fireEvent.click(screen.getByTestId('frame-next-button'));

      await waitFor(() => {
        const blockedOperations = readFrameState().operations.filter(
          operation => operation.eventType === EventTypes.CLICK_BLOCKED
        );

        expect(blockedOperations).toHaveLength(1);
        expect(lastOnNextResult).toBe(false);
      });

      const blockedOperation = readFrameState().operations.find(
        operation => operation.eventType === EventTypes.CLICK_BLOCKED
      );
      const blockedValue = blockedOperation?.value as Record<string, unknown>;

      expect(blockedOperation).toMatchObject({
        targetElement: `P${testCase.pageNumber}_下一页按钮`,
        eventType: EventTypes.CLICK_BLOCKED,
        value: {
          reason: testCase.reason,
          missing: testCase.missing,
          message: testCase.message,
        },
      });
      expect(Object.keys(blockedValue).sort()).toEqual(['message', 'missing', 'reason', 'timestamp']);
      expect(blockedValue.timestamp).toMatch(LOCAL_TIMESTAMP_REGEX);
      expect(readFrameState().validationError).toBe(testCase.message);
      expect(
        readFrameState().operations.some(operation => operation.eventType === EventTypes.NEXT_CLICK)
      ).toBe(false);
      expect(defaultSubmitSpy).not.toHaveBeenCalled();

      unmount();
      defaultSubmitSpy.mockClear();
      lastOnNextResult = undefined;
    }
  });

  it('intro_notice fixture locks click_blocked missing array and timer/checkbox events', () => {
    const mark = marks.find(item => item.pageId === 'intro_notice');

    expect(mark).toBeDefined();
    const blockedOperation = mark?.operationList.find(
      operation => operation.eventType === EventTypes.CLICK_BLOCKED
    );

    expect(blockedOperation).toMatchObject({
      targetElement: 'P1.01_下一页按钮',
      eventType: EventTypes.CLICK_BLOCKED,
    });
    expect(blockedOperation?.value).toMatchObject({
      reason: 'countdown_not_finished',
      missing: ['timer_completed', 'instructions_read'],
      message: '请仔细阅读注意事项，倒计时结束后才能继续',
    });
    expect(mark?.operationList.some(operation => operation.eventType === EventTypes.TIMER_START)).toBe(true);
    expect(mark?.operationList.some(operation => operation.eventType === EventTypes.TIMER_COMPLETE)).toBe(true);
    expect(mark?.operationList.some(operation => operation.eventType === EventTypes.CHECKBOX_CHECK)).toBe(true);
  });

  it('handleFrameNext maps L2 blocked missing fields to registry field ids', async () => {
    const { unmount } = renderExperiment('simulation_question_1');

    await screen.findByTestId('page-simulation_question_1');
    fireEvent.click(screen.getByTestId('frame-next-button'));

    await waitFor(() => {
      const submitAttempt = readFrameState().operations.find(
        operation => operation.eventType === 'SUBMIT_ATTEMPT'
      );
      expect(submitAttempt).toBeDefined();
      expect(lastOnNextResult).toBe(false);
    });

    const submitAttempt = readFrameState().operations.find(
      operation => operation.eventType === 'SUBMIT_ATTEMPT'
    );
    const value = submitAttempt?.value as Record<string, any>;

    expect(value.validation_status).toBe('blocked');
    expect(value.metadata?.missing_fields).toEqual(['question_1_answer']);
    expect(value.metadata?.missing_fields).not.toContain(L2_SIMULATION_EVENTS.executeExp);
    expect(value.metadata?.missing_fields).not.toContain('Q5_海南香蕉变黑时间');
    expect(defaultSubmitSpy).not.toHaveBeenCalled();
    expect(submitSpy).not.toHaveBeenCalled();

    unmount();
  });

  it('handleFrameNext reports only reason_text when solution_selection is missing only the reason', async () => {
    const { unmount } = renderExperiment('solution_selection');

    await screen.findByTestId('page-solution_selection');
    fireEvent.click(screen.getByTestId('solution-selection-plan-complete'));
    fireEvent.click(screen.getByTestId('frame-next-button'));

    await waitFor(() => {
      const submitAttempt = readFrameState().operations.find(
        operation => operation.eventType === 'SUBMIT_ATTEMPT'
      );
      expect(submitAttempt).toBeDefined();
      expect(lastOnNextResult).toBe(false);
    });

    const submitAttempt = readFrameState().operations.find(
      operation => operation.eventType === 'SUBMIT_ATTEMPT'
    );
    const value = submitAttempt?.value as Record<string, any>;

    expect(value.validation_status).toBe('blocked');
    expect(value.metadata?.missing_fields).toEqual(['reason_text']);
    expect(value.metadata?.missing_fields).not.toContain('plan_table');
    expect(defaultSubmitSpy).not.toHaveBeenCalled();
    expect(submitSpy).not.toHaveBeenCalled();

    unmount();
  });

  it('handleFrameNext does not report question answer field when only simulation run is missing', async () => {
    const { unmount } = renderExperiment('simulation_question_1');

    await screen.findByTestId('page-simulation_question_1');
    fireEvent.click(screen.getByTestId('simulation-question-1-answer'));
    fireEvent.click(screen.getByTestId('frame-next-button'));

    await waitFor(() => {
      const submitAttempt = readFrameState().operations.find(
        operation => operation.eventType === 'SUBMIT_ATTEMPT'
      );
      expect(submitAttempt).toBeDefined();
      expect(lastOnNextResult).toBe(false);
    });

    const submitAttempt = readFrameState().operations.find(
      operation => operation.eventType === 'SUBMIT_ATTEMPT'
    );
    const value = submitAttempt?.value as Record<string, any>;

    expect(value.validation_status).toBe('blocked');
    expect(value.metadata?.missing_fields).toEqual([]);
    expect(value.metadata?.missing_fields).not.toContain('question_1_answer');
    expect(value.metadata?.missing_fields).not.toContain(L2_SIMULATION_EVENTS.executeExp);
    expect(defaultSubmitSpy).not.toHaveBeenCalled();
    expect(submitSpy).not.toHaveBeenCalled();

    unmount();
  });

  it('handleFrameNext accepts migrated EXECUTE_EXP plus answer for simulation_question_1', async () => {
    const { unmount } = renderExperiment('simulation_question_1');

    await screen.findByTestId('page-simulation_question_1');
    fireEvent.click(screen.getByTestId('simulation-question-1-run'));
    fireEvent.click(screen.getByTestId('simulation-question-1-answer'));
    fireEvent.click(screen.getByTestId('frame-next-button'));

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(1);
      expect(lastOnNextResult).toBe(true);
    });

    const submittedMark = submitSpy.mock.calls[0][0]?.markOverride;
    const eventTypes = submittedMark?.operationList.map(operation => operation.eventType) || [];

    expect(eventTypes).toContain(L2_SIMULATION_EVENTS.executeExp);
    expect(eventTypes).toContain(L2_SIMULATION_EVENTS.submitAttempt);
    expect(eventTypes.some(eventType => LEGACY_SIMULATION_EVENTS_FORBIDDEN_IN_L2.has(eventType))).toBe(
      false
    );
    expect(() => validateTraceMark(submittedMark)).not.toThrow();

    unmount();
  });

  it('handleFrameNext includes a validator-compatible current L2 success mark override', async () => {
    const { unmount } = renderExperiment('page_02_banana_browning');

    await screen.findByTestId('page-page_02_banana_browning');
    await waitFor(() => {
      expect(
        readFrameState().operations.some(operation => operation.eventType === EventTypes.PAGE_ENTER)
      ).toBe(true);
    });

    fireEvent.click(screen.getByTestId('frame-next-button'));

    await waitFor(() => {
      expect(submitSpy).toHaveBeenCalledTimes(1);
      expect(lastOnNextResult).toBe(true);
    });

    expect(defaultSubmitSpy).not.toHaveBeenCalled();

    const submitOptions = submitSpy.mock.calls[0][0] as {
      markOverride?: MarkObject;
    };
    const submittedMark = submitOptions.markOverride;
    const operationList = submittedMark?.operationList || [];
    const eventTypes = operationList.map(operation => operation.eventType);
    const submitAttempts =
      operationList.filter(operation => operation.eventType === 'SUBMIT_ATTEMPT') || [];

    expect(() => validateTraceMark(submittedMark)).not.toThrow();
    expect(eventTypes).toEqual(['START_PAGE', 'SUBMIT_ATTEMPT']);
    expect(eventTypes).not.toContain(EventTypes.PAGE_ENTER);
    operationList.forEach((operation, index) => {
      expect(operation.code).toBe(index + 1);
    });
    expect(operationList[0]).toMatchObject({
      code: 1,
      targetElement: 'P1.02_page',
      eventType: 'START_PAGE',
      pageId: 'page_02_banana_browning',
      value: {
        page_id: 'page_01_intro',
        target_id: 'page',
      },
    });
    expect(submitAttempts).toHaveLength(1);
    expect(submitAttempts[0]).toMatchObject({
      code: 2,
      targetElement: 'P1.02_next_button',
      eventType: 'SUBMIT_ATTEMPT',
      pageId: 'page_02_banana_browning',
      value: {
        page_id: 'page_01_intro',
        target_id: 'next_button',
        validation_status: 'success',
        metadata: {
          missing_fields: [],
        },
      },
    });
    expect(
      readFrameState().operations.some(operation => operation.eventType === 'SUBMIT_ATTEMPT')
    ).toBe(false);

    unmount();
  });

  it('simulation_question_1 fixture locks L2 simulation events, blocked submit metadata, and labeled answer', () => {
    const mark = marks.find(item => item.pageId === 'simulation_question_1');

    expect(mark).toBeDefined();
    const blockedOperation = mark?.operationList.find(
      operation =>
        operation.eventType === L2_SIMULATION_EVENTS.submitAttempt &&
        (operation.value as Record<string, any>).validation_status === 'blocked'
    );

    expect(blockedOperation).toMatchObject({
      targetElement: 'P1.10_next_button',
      eventType: L2_SIMULATION_EVENTS.submitAttempt,
    });
    expect(blockedOperation?.value).toMatchObject({
      validation_status: 'blocked',
      metadata: {
        missing_fields: ['question_1_answer'],
      },
    });

    const eventTypes = mark?.operationList.map(operation => operation.eventType) || [];
    expect(eventTypes).toContain(L2_SIMULATION_EVENTS.setExpParam);
    expect(eventTypes).toContain(L2_SIMULATION_EVENTS.executeExp);
    expect(eventTypes).toContain(L2_SIMULATION_EVENTS.selectAnswer);
    expect(eventTypes.some(eventType => LEGACY_SIMULATION_EVENTS_FORBIDDEN_IN_L2.has(eventType))).toBe(
      false
    );
    expect(eventTypes.filter(eventType => eventType === EventTypes.FLOW_CONTEXT)).toHaveLength(0);
    expect(mark?.answerList.map(answer => answer.value)).toEqual(['B. 6天']);
  });

  it('simulation_question_2 and simulation_question_3 fixtures keep labeled answer values', () => {
    const simulationQuestionMarks = marks.filter(
      mark => mark.pageId === 'simulation_question_2' || mark.pageId === 'simulation_question_3'
    );
    const labeledValues = simulationQuestionMarks.flatMap(mark =>
      mark.answerList.map(answer => answer.value)
    );

    expect(labeledValues).toEqual(['A. 海南香蕉', 'C. 18℃']);
    simulationQuestionMarks.forEach(mark => {
      const eventTypes = mark.operationList.map(operation => operation.eventType);
      expect(eventTypes).toContain(L2_SIMULATION_EVENTS.executeExp);
      expect(eventTypes).toContain(L2_SIMULATION_EVENTS.selectAnswer);
      expect(eventTypes.some(eventType => LEGACY_SIMULATION_EVENTS_FORBIDDEN_IN_L2.has(eventType))).toBe(
        false
      );
    });
  });

  it('solution_selection fixture locks click_blocked missing array and navigation events', () => {
    const mark = marks.find(item => item.pageId === 'solution_selection');

    expect(mark).toBeDefined();
    const blockedOperation = mark?.operationList.find(
      operation => operation.eventType === EventTypes.CLICK_BLOCKED
    );

    expect(blockedOperation).toMatchObject({
      targetElement: 'P1.13_下一页按钮',
      eventType: EventTypes.CLICK_BLOCKED,
    });
    expect(blockedOperation?.value).toMatchObject({
      reason: 'required_fields_missing',
      missing: ['Q8_方案表格', 'Q8_最优方案', 'Q8_理由'],
      message: '请完成当前页面必填项',
    });
    expect(mark?.operationList.some(operation => operation.eventType === EventTypes.NEXT_CLICK)).toBe(true);
    expect(mark?.operationList.some(operation => operation.eventType === EventTypes.PAGE_EXIT)).toBe(true);
  });
});
