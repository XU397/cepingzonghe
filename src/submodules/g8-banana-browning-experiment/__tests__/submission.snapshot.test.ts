import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { encodeCompositePageNum } from '@shared/utils/pageMapping';
import { validateTraceMark } from '../trace/useBananaTraceLogger';
import G8BananaBrowningExperiment from '../Component';
import {
  QUESTION_TEXT_MAP,
  getSubPageNumByPageId,
  type PageId,
} from '../mapping';
import type { SubmoduleProps } from '../types';

type PageSetupContext = ReturnType<typeof import('../context/G8BananaBrowningContext')['useG8BananaBrowningContext']> & {
  targetPrefix: string;
};

type PageSetup = (ctx: PageSetupContext) => void;

const BASE_TIME = new Date('2026-04-07T09:00:00.000Z');
const FLOW_CONTEXT = {
  flowId: 'flow-banana',
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
    moduleUrl: '/flow/banana',
    isAuthenticated: true,
  },
  helpers: {
    logOperation: vi.fn(),
    collectAnswer: vi.fn(),
    navigateToPage: vi.fn(),
  },
};

const isoAt = (seconds: number) => new Date(BASE_TIME.getTime() + seconds * 1000).toISOString();
const pageSetups: Partial<Record<PageId, PageSetup>> = {};
const L2_SIMULATION_EVENTS = {
  executeExp: 'EXECUTE_EXP',
  selectAnswer: 'SELECT_ANSWER',
  setExpParam: 'SET_EXP_PARAM',
  startPage: 'START_PAGE',
} as const;
const LEGACY_SIMULATION_EVENT_TYPES = new Set([
  'simulation_operation',
  'simulation_run_result',
  'radio_select',
]);
const L2_SIMULATION_PAGE_CONFIG = {
  simulation_question_1: {
    standardPageId: 'page_09_experiment_question_1',
    pageIndex: 9,
    questionId: 'question_1',
    questionIndex: 1,
  },
  simulation_question_2: {
    standardPageId: 'page_10_experiment_question_2',
    pageIndex: 10,
    questionId: 'question_2',
    questionIndex: 2,
  },
  simulation_question_3: {
    standardPageId: 'page_11_experiment_question_3',
    pageIndex: 11,
    questionId: 'question_3',
    questionIndex: 3,
  },
} as const;

type L2SimulationPageId = keyof typeof L2_SIMULATION_PAGE_CONFIG;
type L2SimulationConfig = (typeof L2_SIMULATION_PAGE_CONFIG)[L2SimulationPageId] & {
  pageId: L2SimulationPageId;
};

let latestSubmission: {
  buildMark?: () => any;
};

vi.mock('@shared/ui/PageFrame', () => {
  return {
    AssessmentPageFrame: ({ submission, children }: any) => {
      latestSubmission = submission;
      return React.createElement('div', { 'data-testid': 'assessment-frame' }, children);
    },
    usePageSubmissionContext: () => ({}),
  };
});

vi.mock('../pages/Page10SimulationQuestion1', async () => {
  const React = await import('react');
  const { useG8BananaBrowningContext } = await import('../context/G8BananaBrowningContext');

  const Page = () => {
    const ctx = useG8BananaBrowningContext();
    const hasSetup = React.useRef(false);

    React.useEffect(() => {
      if (hasSetup.current) {
        return;
      }
      hasSetup.current = true;
      pageSetups.simulation_question_1?.({ ...ctx, targetPrefix: ctx.getPagePrefix() });
    }, [ctx]);

    return React.createElement(
      'div',
      { 'data-testid': 'page-simulation_question_1' },
      'simulation_question_1'
    );
  };

  return { default: Page };
});

vi.mock('../pages/Page11SimulationQuestion2', async () => {
  const React = await import('react');
  const { useG8BananaBrowningContext } = await import('../context/G8BananaBrowningContext');

  const Page = () => {
    const ctx = useG8BananaBrowningContext();
    const hasSetup = React.useRef(false);

    React.useEffect(() => {
      if (hasSetup.current) {
        return;
      }
      hasSetup.current = true;
      pageSetups.simulation_question_2?.({ ...ctx, targetPrefix: ctx.getPagePrefix() });
    }, [ctx]);

    return React.createElement(
      'div',
      { 'data-testid': 'page-simulation_question_2' },
      'simulation_question_2'
    );
  };

  return { default: Page };
});

vi.mock('../pages/Page12SimulationQuestion3', async () => {
  const React = await import('react');
  const { useG8BananaBrowningContext } = await import('../context/G8BananaBrowningContext');

  const Page = () => {
    const ctx = useG8BananaBrowningContext();
    const hasSetup = React.useRef(false);

    React.useEffect(() => {
      if (hasSetup.current) {
        return;
      }
      hasSetup.current = true;
      pageSetups.simulation_question_3?.({ ...ctx, targetPrefix: ctx.getPagePrefix() });
    }, [ctx]);

    return React.createElement(
      'div',
      { 'data-testid': 'page-simulation_question_3' },
      'simulation_question_3'
    );
  };

  return { default: Page };
});

const toSnapshot = (mark: any) => ({
  pageNumber: mark.pageNumber,
  pageDesc: mark.pageDesc,
  operations: mark.operationList.map(({ code, eventType, targetElement, value }: any) => ({
    code,
    eventType,
    targetElement,
    value,
  })),
  answers: mark.answerList.map(({ code, targetElement, value }: any) => ({
    code,
    targetElement,
    value,
  })),
});

const getL2SimulationConfig = (pageId: L2SimulationPageId): L2SimulationConfig => ({
  pageId,
  ...L2_SIMULATION_PAGE_CONFIG[pageId],
});

const logL2Operation = (
  ctx: PageSetupContext,
  config: L2SimulationConfig,
  eventType: string,
  targetId: string,
  targetType: string,
  seconds: number,
  valuePatch: Record<string, unknown> = {},
  metadata: Record<string, unknown> = {}
) => {
  ctx.logOperation({
    targetElement: `${ctx.targetPrefix}${targetId}`,
    eventType,
    value: {
      trace_id: `trace_${config.pageId}_${eventType}_${seconds}`,
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
    time: isoAt(seconds),
  });
};

const logStartPage = (ctx: PageSetupContext, config: L2SimulationConfig, seconds: number) =>
  logL2Operation(ctx, config, L2_SIMULATION_EVENTS.startPage, 'page', 'page', seconds, {}, {
    initial_state: { selected_option: null },
    flow_context: null,
  });

const logSetExpParam = (
  ctx: PageSetupContext,
  config: L2SimulationConfig,
  seconds: number,
  valueBefore: number,
  valueAfter: number
) =>
  logL2Operation(
    ctx,
    config,
    L2_SIMULATION_EVENTS.setExpParam,
    'exp_param_days',
    'experiment',
    seconds,
    {
      param_id: 'exp_param_days',
      param_name: 'days',
      value_before: valueBefore,
      value_after: valueAfter,
    },
    { param_snapshot: { days: valueAfter } }
  );

const logExecuteExp = (
  ctx: PageSetupContext,
  config: L2SimulationConfig,
  seconds: number,
  day: number,
  results: Array<Record<string, unknown>>
) =>
  logL2Operation(
    ctx,
    config,
    L2_SIMULATION_EVENTS.executeExp,
    'execute_exp',
    'experiment',
    seconds,
    { exp_run_id: `banana_days_${day}` },
    {
      param_snapshot: { days: day },
      result_snapshot: { day, results },
      click_debounce_applied: false,
    }
  );

const logSelectAnswer = (
  ctx: PageSetupContext,
  config: L2SimulationConfig,
  seconds: number,
  optionId: string,
  optionText: string
) =>
  logL2Operation(
    ctx,
    config,
    L2_SIMULATION_EVENTS.selectAnswer,
    `${config.questionId}_${optionId}`,
    'radio',
    seconds,
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

const expectNoLegacySimulationEvents = (mark: any) => {
  const eventTypes = mark.operationList.map((operation: any) => operation.eventType);
  expect(eventTypes.some((eventType: string) => LEGACY_SIMULATION_EVENT_TYPES.has(eventType))).toBe(false);
};

const renderAndBuildMark = async (pageId: PageId, setup: PageSetup) => {
  pageSetups[pageId] = setup;

  render(
    React.createElement(G8BananaBrowningExperiment, {
      initialPageId: pageId,
      flowContext: FLOW_CONTEXT,
      userContext: USER_CONTEXT,
    })
  );

  await screen.findByTestId(`page-${pageId}`);
  expect(typeof latestSubmission?.buildMark).toBe('function');

  let mark: any;
  await waitFor(() => {
    mark = latestSubmission.buildMark?.();
    expect(mark?.answerList.length).toBeGreaterThan(0);
    expect(
      mark?.operationList.filter((operation: any) => operation.eventType === L2_SIMULATION_EVENTS.startPage)
        .length
    ).toBe(1);
  });

  return mark;
};

describe('g8-banana-browning submission snapshots', () => {
  beforeEach(() => {
    latestSubmission = {};
    pageSetups.simulation_question_1 = undefined;
    pageSetups.simulation_question_2 = undefined;
    pageSetups.simulation_question_3 = undefined;
  });

  it('simulation_question_1 should build raw mark with labeled Q5 answer and full question target', async () => {
    const mark = await renderAndBuildMark('simulation_question_1', (ctx) => {
      const config = getL2SimulationConfig('simulation_question_1');
      ctx.setPageStartTime(new Date(BASE_TIME));
      logStartPage(ctx, config, 0);
      logSetExpParam(ctx, config, 1, 3, 6);
      logExecuteExp(ctx, config, 3, 6, [
        { origin: '海南', temperature: '2℃', browning: 0.35 },
        { origin: '海南', temperature: '10℃', browning: 0.04 },
        { origin: '海南', temperature: '18℃', browning: 0.06 },
        { origin: '菲律宾', temperature: '2℃', browning: 0.65 },
        { origin: '菲律宾', temperature: '10℃', browning: 0.03 },
        { origin: '菲律宾', temperature: '18℃', browning: 0.05 },
      ]);
      ctx.collectAnswer({
        targetElement: 'Q5_海南香蕉变黑时间',
        value: '6天',
      });
      logSelectAnswer(ctx, config, 4, 'option_b', '6天');
    });

    expect(mark.pageNumber).toBe(
      encodeCompositePageNum(FLOW_CONTEXT.stepIndex + 1, getSubPageNumByPageId('simulation_question_1'))
    );
    expect(mark.answerList[0].targetElement).toBe(QUESTION_TEXT_MAP.Q5);
    expect(mark.answerList[0].value).toBe('B. 6天');
    expect(mark.operationList.filter((operation: any) => operation.eventType === EventTypes.FLOW_CONTEXT)).toHaveLength(0);
    expectNoLegacySimulationEvents(mark);
    expect(() => validateTraceMark(mark)).not.toThrow();

    expect(toSnapshot(mark)).toMatchInlineSnapshot(`
      {
        "answers": [
          {
            "code": 12,
            "targetElement": "在模拟实验中，2℃条件下储存的海南香蕉，从开始到完全变黑需要多长时间？",
            "value": "B. 6天",
          },
        ],
        "operations": [
          {
            "code": 1,
            "eventType": "START_PAGE",
            "targetElement": "P1.10_page",
            "value": {
              "metadata": {
                "content_registry_version": "science-inquiry-content-registry-banana-v2.1",
                "field_registry_version": "science-inquiry-field-registry-v2.1",
                "flow_context": {
                  "flowId": "flow-banana",
                  "moduleName": "8年级香蕉变黑科学探究",
                  "pageId": "simulation_question_1",
                  "stepIndex": 0,
                  "submoduleId": "g8-banana-browning-experiment",
                },
                "initial_state": {
                  "selected_option": null,
                },
                "legacy_page_id": "simulation_question_1",
                "page_index": 9,
                "schema_version": "science-inquiry-trace-v2.1",
              },
              "page_id": "page_09_experiment_question_1",
              "page_type": "D2_SIMULATION_QUESTION",
              "target_id": "page",
              "target_type": "page",
              "trace_id": "trace_simulation_question_1_START_PAGE_0",
            },
          },
          {
            "code": 2,
            "eventType": "SET_EXP_PARAM",
            "targetElement": "P1.10_exp_param_days",
            "value": {
              "metadata": {
                "content_registry_version": "science-inquiry-content-registry-banana-v2.1",
                "field_registry_version": "science-inquiry-field-registry-v2.1",
                "legacy_page_id": "simulation_question_1",
                "page_index": 9,
                "param_snapshot": {
                  "days": 6,
                },
                "schema_version": "science-inquiry-trace-v2.1",
              },
              "page_id": "page_09_experiment_question_1",
              "page_type": "D2_SIMULATION_QUESTION",
              "param_id": "exp_param_days",
              "param_name": "days",
              "target_id": "exp_param_days",
              "target_type": "experiment",
              "trace_id": "trace_simulation_question_1_SET_EXP_PARAM_1",
              "value_after": 6,
              "value_before": 3,
            },
          },
          {
            "code": 3,
            "eventType": "EXECUTE_EXP",
            "targetElement": "P1.10_execute_exp",
            "value": {
              "exp_run_id": "banana_days_6",
              "metadata": {
                "click_debounce_applied": false,
                "content_registry_version": "science-inquiry-content-registry-banana-v2.1",
                "field_registry_version": "science-inquiry-field-registry-v2.1",
                "legacy_page_id": "simulation_question_1",
                "page_index": 9,
                "param_snapshot": {
                  "days": 6,
                },
                "result_snapshot": {
                  "day": 6,
                  "results": [
                    {
                      "browning": 0.35,
                      "origin": "海南",
                      "temperature": "2℃",
                    },
                    {
                      "browning": 0.04,
                      "origin": "海南",
                      "temperature": "10℃",
                    },
                    {
                      "browning": 0.06,
                      "origin": "海南",
                      "temperature": "18℃",
                    },
                    {
                      "browning": 0.65,
                      "origin": "菲律宾",
                      "temperature": "2℃",
                    },
                    {
                      "browning": 0.03,
                      "origin": "菲律宾",
                      "temperature": "10℃",
                    },
                    {
                      "browning": 0.05,
                      "origin": "菲律宾",
                      "temperature": "18℃",
                    },
                  ],
                },
                "schema_version": "science-inquiry-trace-v2.1",
              },
              "page_id": "page_09_experiment_question_1",
              "page_type": "D2_SIMULATION_QUESTION",
              "target_id": "execute_exp",
              "target_type": "experiment",
              "trace_id": "trace_simulation_question_1_EXECUTE_EXP_3",
            },
          },
          {
            "code": 4,
            "eventType": "SELECT_ANSWER",
            "targetElement": "P1.10_question_1_option_b",
            "value": {
              "metadata": {
                "content_registry_version": "science-inquiry-content-registry-banana-v2.1",
                "field_registry_version": "science-inquiry-field-registry-v2.1",
                "legacy_page_id": "simulation_question_1",
                "option_text": "6天",
                "page_index": 9,
                "question_index": 1,
                "schema_version": "science-inquiry-trace-v2.1",
                "total_question_count": 3,
              },
              "option_id": "option_b",
              "page_id": "page_09_experiment_question_1",
              "page_type": "D2_SIMULATION_QUESTION",
              "question_id": "question_1",
              "target_id": "question_1_option_b",
              "target_type": "radio",
              "trace_id": "trace_simulation_question_1_SELECT_ANSWER_4",
              "value_after": "option_b",
              "value_before": null,
            },
          },
        ],
        "pageDesc": "[flow-banana/g8-banana-browning-experiment/0] 模拟实验 + 问题1",
        "pageNumber": "1.10",
      }
    `);
  });

  it('simulation_question_2 should build raw mark with labeled Q6 answer and full question target', async () => {
    const mark = await renderAndBuildMark('simulation_question_2', (ctx) => {
      const config = getL2SimulationConfig('simulation_question_2');
      ctx.setPageStartTime(new Date(BASE_TIME));
      logStartPage(ctx, config, 10);
      logExecuteExp(ctx, config, 11, 15, [
        { origin: '海南', temperature: '2℃', browning: 1 },
        { origin: '海南', temperature: '10℃', browning: 0.33 },
        { origin: '海南', temperature: '18℃', browning: 0.46 },
        { origin: '菲律宾', temperature: '2℃', browning: 1 },
        { origin: '菲律宾', temperature: '10℃', browning: 0.25 },
        { origin: '菲律宾', temperature: '18℃', browning: 0.27 },
      ]);
      ctx.collectAnswer({
        targetElement: 'Q6_常温储存品种',
        value: '海南香蕉',
      });
      logSelectAnswer(ctx, config, 12, 'option_a', '海南香蕉');
    });

    expect(mark.pageNumber).toBe(
      encodeCompositePageNum(FLOW_CONTEXT.stepIndex + 1, getSubPageNumByPageId('simulation_question_2'))
    );
    expect(mark.answerList[0].targetElement).toBe(QUESTION_TEXT_MAP.Q6);
    expect(mark.answerList[0].value).toBe('A. 海南香蕉');
    expect(mark.operationList.filter((operation: any) => operation.eventType === EventTypes.FLOW_CONTEXT)).toHaveLength(0);
    expectNoLegacySimulationEvents(mark);
    expect(() => validateTraceMark(mark)).not.toThrow();

    const snapshot = toSnapshot(mark);
    expect(snapshot).toMatchObject({
      pageNumber: '1.11',
      pageDesc: '[flow-banana/g8-banana-browning-experiment/0] 模拟实验 + 问题2',
      answers: [
        {
          targetElement: QUESTION_TEXT_MAP.Q6,
          value: 'A. 海南香蕉',
        },
      ],
    });
    expect(snapshot.operations.map((operation: any) => operation.eventType)).toEqual([
      'START_PAGE',
      'EXECUTE_EXP',
      'SELECT_ANSWER',
    ]);
    expect(snapshot.operations[0].value.metadata.flow_context).toMatchObject({
      flowId: FLOW_CONTEXT.flowId,
      submoduleId: FLOW_CONTEXT.submoduleId,
      stepIndex: FLOW_CONTEXT.stepIndex,
      pageId: 'simulation_question_2',
    });
    expect(snapshot.operations[1].value.exp_run_id).toBe('banana_days_15');
    expect(snapshot.operations[1].value.metadata.result_snapshot.results).toHaveLength(6);
    expect(snapshot.operations[2].value.option_id).toBe('option_a');

  });

  it('simulation_question_3 should build raw mark with labeled Q7 answer and full question target', async () => {
    const mark = await renderAndBuildMark('simulation_question_3', (ctx) => {
      const config = getL2SimulationConfig('simulation_question_3');
      ctx.setPageStartTime(new Date(BASE_TIME));
      logStartPage(ctx, config, 20);
      logExecuteExp(ctx, config, 21, 15, [
        { origin: '海南', temperature: '2℃', browning: 1 },
        { origin: '海南', temperature: '10℃', browning: 0.33 },
        { origin: '海南', temperature: '18℃', browning: 0.46 },
        { origin: '菲律宾', temperature: '2℃', browning: 1 },
        { origin: '菲律宾', temperature: '10℃', browning: 0.25 },
        { origin: '菲律宾', temperature: '18℃', browning: 0.27 },
      ]);
      ctx.collectAnswer({
        targetElement: 'Q7_平缓温度',
        value: '18℃',
      });
      logSelectAnswer(ctx, config, 22, 'option_c', '18℃');
    });

    expect(mark.pageNumber).toBe(
      encodeCompositePageNum(FLOW_CONTEXT.stepIndex + 1, getSubPageNumByPageId('simulation_question_3'))
    );
    expect(mark.answerList[0].targetElement).toBe(QUESTION_TEXT_MAP.Q7);
    expect(mark.answerList[0].value).toBe('C. 18℃');
    expect(mark.operationList.filter((operation: any) => operation.eventType === EventTypes.FLOW_CONTEXT)).toHaveLength(0);
    expectNoLegacySimulationEvents(mark);
    expect(() => validateTraceMark(mark)).not.toThrow();

    const snapshot = toSnapshot(mark);
    expect(snapshot).toMatchObject({
      pageNumber: '1.12',
      pageDesc: '[flow-banana/g8-banana-browning-experiment/0] 模拟实验 + 问题3',
      answers: [
        {
          targetElement: QUESTION_TEXT_MAP.Q7,
          value: 'C. 18℃',
        },
      ],
    });
    expect(snapshot.operations.map((operation: any) => operation.eventType)).toEqual([
      'START_PAGE',
      'EXECUTE_EXP',
      'SELECT_ANSWER',
    ]);
    expect(snapshot.operations[0].value.metadata.flow_context).toMatchObject({
      flowId: FLOW_CONTEXT.flowId,
      submoduleId: FLOW_CONTEXT.submoduleId,
      stepIndex: FLOW_CONTEXT.stepIndex,
      pageId: 'simulation_question_3',
    });
    expect(snapshot.operations[1].value.exp_run_id).toBe('banana_days_15');
    expect(snapshot.operations[1].value.metadata.result_snapshot.results).toHaveLength(6);
    expect(snapshot.operations[2].value.option_id).toBe('option_c');

  });
});
