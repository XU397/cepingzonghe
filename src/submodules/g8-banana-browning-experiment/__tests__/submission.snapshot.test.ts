import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { encodeCompositePageNum } from '@shared/utils/pageMapping';
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
      mark?.operationList.filter((operation: any) => operation.eventType === EventTypes.FLOW_CONTEXT)
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
      const prefix = ctx.targetPrefix;
      ctx.setPageStartTime(new Date(BASE_TIME));
      ctx.logOperation({
        targetElement: `${prefix}页面进入`,
        eventType: EventTypes.PAGE_ENTER,
        value: ctx.currentPageId,
        time: isoAt(0),
      });
      ctx.logOperation({
        targetElement: `${prefix}天数增加按钮`,
        eventType: EventTypes.SIMULATION_OPERATION,
        value: { action: 'increment_day', fromDay: 3, toDay: 6 },
        time: isoAt(1),
      });
      ctx.logOperation({
        targetElement: `${prefix}开始实验按钮`,
        eventType: EventTypes.SIMULATION_TIMING_STARTED,
        value: { selectedDay: 6, totalConditions: 6 },
        time: isoAt(2),
      });
      ctx.logOperation({
        targetElement: `${prefix}实验结果`,
        eventType: EventTypes.SIMULATION_RUN_RESULT,
        value: {
          selectedDay: 6,
          results: [
            { origin: '海南', temperature: '2℃', browning: 0.35 },
            { origin: '海南', temperature: '10℃', browning: 0.04 },
            { origin: '海南', temperature: '18℃', browning: 0.06 },
            { origin: '菲律宾', temperature: '2℃', browning: 0.65 },
            { origin: '菲律宾', temperature: '10℃', browning: 0.03 },
            { origin: '菲律宾', temperature: '18℃', browning: 0.05 },
          ],
        },
        time: isoAt(3),
      });
      ctx.collectAnswer({
        targetElement: 'Q5_海南香蕉变黑时间',
        value: '6天',
      });
      ctx.logOperation({
        targetElement: `${prefix}问题1选项`,
        eventType: EventTypes.RADIO_SELECT,
        value: 'B. 6天',
        time: isoAt(4),
      });
    });

    expect(mark.pageNumber).toBe(
      encodeCompositePageNum(FLOW_CONTEXT.stepIndex + 1, getSubPageNumByPageId('simulation_question_1'))
    );
    expect(mark.answerList[0].targetElement).toBe(QUESTION_TEXT_MAP.Q5);
    expect(mark.answerList[0].value).toBe('B. 6天');
    expect(
      mark.operationList.filter((operation: any) => operation.eventType === EventTypes.FLOW_CONTEXT)
    ).toHaveLength(1);

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
            "eventType": "page_enter",
            "targetElement": "P1.10_页面进入",
            "value": "simulation_question_1",
          },
          {
            "code": 2,
            "eventType": "flow_context",
            "targetElement": "flow_context",
            "value": "{\"flowId\":\"flow-banana\",\"submoduleId\":\"g8-banana-browning-experiment\",\"stepIndex\":0,\"moduleName\":\"8年级香蕉变黑科学探究\",\"pageId\":\"simulation_question_1\"}",
          },
          {
            "code": 3,
            "eventType": "simulation_operation",
            "targetElement": "P1.10_天数增加按钮",
            "value": {
              "action": "increment_day",
              "fromDay": 3,
              "toDay": 6,
            },
          },
          {
            "code": 4,
            "eventType": "simulation_timing_started",
            "targetElement": "P1.10_开始实验按钮",
            "value": {
              "selectedDay": 6,
              "totalConditions": 6,
            },
          },
          {
            "code": 5,
            "eventType": "simulation_run_result",
            "targetElement": "P1.10_实验结果",
            "value": {
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
              "selectedDay": 6,
            },
          },
          {
            "code": 6,
            "eventType": "radio_select",
            "targetElement": "P1.10_问题1选项",
            "value": "B. 6天",
          },
        ],
        "pageDesc": "[flow-banana/g8-banana-browning-experiment/0] 模拟实验 + 问题1",
        "pageNumber": "1.10",
      }
    `);
  });

  it('simulation_question_2 should build raw mark with labeled Q6 answer and full question target', async () => {
    const mark = await renderAndBuildMark('simulation_question_2', (ctx) => {
      const prefix = ctx.targetPrefix;
      ctx.setPageStartTime(new Date(BASE_TIME));
      ctx.logOperation({
        targetElement: `${prefix}页面进入`,
        eventType: EventTypes.PAGE_ENTER,
        value: ctx.currentPageId,
        time: isoAt(10),
      });
      ctx.logOperation({
        targetElement: `${prefix}实验结果`,
        eventType: EventTypes.SIMULATION_RUN_RESULT,
        value: {
          selectedDay: 15,
          results: [
            { origin: '海南', temperature: '2℃', browning: 1 },
            { origin: '海南', temperature: '10℃', browning: 0.33 },
            { origin: '海南', temperature: '18℃', browning: 0.46 },
            { origin: '菲律宾', temperature: '2℃', browning: 1 },
            { origin: '菲律宾', temperature: '10℃', browning: 0.25 },
            { origin: '菲律宾', temperature: '18℃', browning: 0.27 },
          ],
        },
        time: isoAt(11),
      });
      ctx.collectAnswer({
        targetElement: 'Q6_常温储存品种',
        value: '海南香蕉',
      });
      ctx.logOperation({
        targetElement: `${prefix}问题2选项`,
        eventType: EventTypes.RADIO_SELECT,
        value: 'A. 海南香蕉',
        time: isoAt(12),
      });
    });

    expect(mark.pageNumber).toBe(
      encodeCompositePageNum(FLOW_CONTEXT.stepIndex + 1, getSubPageNumByPageId('simulation_question_2'))
    );
    expect(mark.answerList[0].targetElement).toBe(QUESTION_TEXT_MAP.Q6);
    expect(mark.answerList[0].value).toBe('A. 海南香蕉');
    expect(
      mark.operationList.filter((operation: any) => operation.eventType === EventTypes.FLOW_CONTEXT)
    ).toHaveLength(1);

    expect(toSnapshot(mark)).toMatchInlineSnapshot(`
      {
        "answers": [
          {
            "code": 13,
            "targetElement": "模拟实验表明，哪个品种的香蕉更适合在常温下储存？",
            "value": "A. 海南香蕉",
          },
        ],
        "operations": [
          {
            "code": 1,
            "eventType": "page_enter",
            "targetElement": "P1.11_页面进入",
            "value": "simulation_question_2",
          },
          {
            "code": 2,
            "eventType": "flow_context",
            "targetElement": "flow_context",
            "value": "{\"flowId\":\"flow-banana\",\"submoduleId\":\"g8-banana-browning-experiment\",\"stepIndex\":0,\"moduleName\":\"8年级香蕉变黑科学探究\",\"pageId\":\"simulation_question_2\"}",
          },
          {
            "code": 3,
            "eventType": "simulation_run_result",
            "targetElement": "P1.11_实验结果",
            "value": {
              "results": [
                {
                  "browning": 1,
                  "origin": "海南",
                  "temperature": "2℃",
                },
                {
                  "browning": 0.33,
                  "origin": "海南",
                  "temperature": "10℃",
                },
                {
                  "browning": 0.46,
                  "origin": "海南",
                  "temperature": "18℃",
                },
                {
                  "browning": 1,
                  "origin": "菲律宾",
                  "temperature": "2℃",
                },
                {
                  "browning": 0.25,
                  "origin": "菲律宾",
                  "temperature": "10℃",
                },
                {
                  "browning": 0.27,
                  "origin": "菲律宾",
                  "temperature": "18℃",
                },
              ],
              "selectedDay": 15,
            },
          },
          {
            "code": 4,
            "eventType": "radio_select",
            "targetElement": "P1.11_问题2选项",
            "value": "A. 海南香蕉",
          },
        ],
        "pageDesc": "[flow-banana/g8-banana-browning-experiment/0] 模拟实验 + 问题2",
        "pageNumber": "1.11",
      }
    `);
  });

  it('simulation_question_3 should build raw mark with labeled Q7 answer and full question target', async () => {
    const mark = await renderAndBuildMark('simulation_question_3', (ctx) => {
      const prefix = ctx.targetPrefix;
      ctx.setPageStartTime(new Date(BASE_TIME));
      ctx.logOperation({
        targetElement: `${prefix}页面进入`,
        eventType: EventTypes.PAGE_ENTER,
        value: ctx.currentPageId,
        time: isoAt(20),
      });
      ctx.logOperation({
        targetElement: `${prefix}实验结果`,
        eventType: EventTypes.SIMULATION_RUN_RESULT,
        value: {
          selectedDay: 15,
          results: [
            { origin: '海南', temperature: '2℃', browning: 1 },
            { origin: '海南', temperature: '10℃', browning: 0.33 },
            { origin: '海南', temperature: '18℃', browning: 0.46 },
            { origin: '菲律宾', temperature: '2℃', browning: 1 },
            { origin: '菲律宾', temperature: '10℃', browning: 0.25 },
            { origin: '菲律宾', temperature: '18℃', browning: 0.27 },
          ],
        },
        time: isoAt(21),
      });
      ctx.collectAnswer({
        targetElement: 'Q7_平缓温度',
        value: '18℃',
      });
      ctx.logOperation({
        targetElement: `${prefix}问题3选项`,
        eventType: EventTypes.RADIO_SELECT,
        value: 'C. 18℃',
        time: isoAt(22),
      });
    });

    expect(mark.pageNumber).toBe(
      encodeCompositePageNum(FLOW_CONTEXT.stepIndex + 1, getSubPageNumByPageId('simulation_question_3'))
    );
    expect(mark.answerList[0].targetElement).toBe(QUESTION_TEXT_MAP.Q7);
    expect(mark.answerList[0].value).toBe('C. 18℃');
    expect(
      mark.operationList.filter((operation: any) => operation.eventType === EventTypes.FLOW_CONTEXT)
    ).toHaveLength(1);

    expect(toSnapshot(mark)).toMatchInlineSnapshot(`
      {
        "answers": [
          {
            "code": 14,
            "targetElement": "在模拟实验中，菲律宾香蕉在不同温度下储存时，黑变速度变化最平缓的是哪种温度条件？",
            "value": "C. 18℃",
          },
        ],
        "operations": [
          {
            "code": 1,
            "eventType": "page_enter",
            "targetElement": "P1.12_页面进入",
            "value": "simulation_question_3",
          },
          {
            "code": 2,
            "eventType": "flow_context",
            "targetElement": "flow_context",
            "value": "{\"flowId\":\"flow-banana\",\"submoduleId\":\"g8-banana-browning-experiment\",\"stepIndex\":0,\"moduleName\":\"8年级香蕉变黑科学探究\",\"pageId\":\"simulation_question_3\"}",
          },
          {
            "code": 3,
            "eventType": "simulation_run_result",
            "targetElement": "P1.12_实验结果",
            "value": {
              "results": [
                {
                  "browning": 1,
                  "origin": "海南",
                  "temperature": "2℃",
                },
                {
                  "browning": 0.33,
                  "origin": "海南",
                  "temperature": "10℃",
                },
                {
                  "browning": 0.46,
                  "origin": "海南",
                  "temperature": "18℃",
                },
                {
                  "browning": 1,
                  "origin": "菲律宾",
                  "temperature": "2℃",
                },
                {
                  "browning": 0.25,
                  "origin": "菲律宾",
                  "temperature": "10℃",
                },
                {
                  "browning": 0.27,
                  "origin": "菲律宾",
                  "temperature": "18℃",
                },
              ],
              "selectedDay": 15,
            },
          },
          {
            "code": 4,
            "eventType": "radio_select",
            "targetElement": "P1.12_问题3选项",
            "value": "C. 18℃",
          },
        ],
        "pageDesc": "[flow-banana/g8-banana-browning-experiment/0] 模拟实验 + 问题3",
        "pageNumber": "1.12",
      }
    `);
  });
});
