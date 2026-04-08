import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { encodeCompositePageNum } from '@shared/utils/pageMapping';
import { isReservedElement } from '@shared/services/submission/submoduleAdapter/constants';
import G8DroneImaging from '../Component';
import {
  HISTORY_CODE_BASE,
  QUESTION_CODE_MAP,
  getSubPageNumByPageId,
  type PageId,
} from '../mapping';
import type { DroneImagingContextValue } from '../context/DroneImagingContext';

type PageSetup = (ctx: DroneImagingContextValue & { targetPrefix: string }) => void;

const BASE_TIME = new Date('2025-12-12T08:00:00.000Z');
const PAGE_NUMBER_REGEX = /^[1-9]\d*\.\d{2}$/;
const FLOW_CONTEXT = {
  flowId: 'flow-drone',
  submoduleId: 'g8-drone-imaging',
  stepIndex: 0,
};
const USER_CONTEXT = { examNo: 'exam-001', batchCode: 'batch-001' };
const isoAt = (seconds: number) => new Date(BASE_TIME.getTime() + seconds * 1000).toISOString();
const pageSetups: Partial<Record<PageId, PageSetup>> = {};

let latestSubmission: any;

vi.mock('@shared/ui/PageFrame', () => {
  const React = require('react');
  return {
    AssessmentPageFrame: ({ submission, children }: any) => {
      latestSubmission = submission;
      return React.createElement('div', { 'data-testid': 'assessment-frame' }, children);
    },
  };
});

vi.mock('../pages/Page03_Hypothesis', async () => {
  const React = await import('react');
  const { useDroneImagingContext } = await import('../context/DroneImagingContext');

  const Page = () => {
    const ctx = useDroneImagingContext();
    React.useEffect(() => {
      const setup = pageSetups.hypothesis;
      setup?.({ ...ctx, targetPrefix: ctx.getPagePrefix(3) });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return React.createElement('div', { 'data-testid': 'page-hypothesis' }, 'hypothesis');
  };

  return { default: Page };
});

vi.mock('../pages/Page04_ExperimentFree', async () => {
  const React = await import('react');
  const { useDroneImagingContext } = await import('../context/DroneImagingContext');

  const Page = () => {
    const ctx = useDroneImagingContext();
    React.useEffect(() => {
      const setup = pageSetups.experiment_free;
      setup?.({ ...ctx, targetPrefix: ctx.getPagePrefix(4) });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return React.createElement('div', { 'data-testid': 'page-experiment_free' }, 'experiment_free');
  };

  return { default: Page };
});

vi.mock('../pages/Page07_Conclusion', async () => {
  const React = await import('react');
  const { useDroneImagingContext } = await import('../context/DroneImagingContext');

  const Page = () => {
    const ctx = useDroneImagingContext();
    React.useEffect(() => {
      const setup = pageSetups.conclusion;
      setup?.({ ...ctx, targetPrefix: ctx.getPagePrefix(7) });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return React.createElement('div', { 'data-testid': 'page-conclusion' }, 'conclusion');
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

const renderAndBuildMark = async (
  pageId: PageId,
  setup: PageSetup,
  flowContextOverride = FLOW_CONTEXT,
) => {
  pageSetups[pageId] = setup;
  render(
    React.createElement(G8DroneImaging, {
      initialPageId: pageId,
      flowContext: flowContextOverride,
      userContext: USER_CONTEXT,
    }),
  );
  await screen.findByTestId(`page-${pageId}`);
  expect(typeof latestSubmission?.buildMark).toBe('function');
  return latestSubmission.buildMark();
};

describe('g8-drone-imaging submission snapshots', () => {
  beforeEach(() => {
    latestSubmission = undefined;
    pageSetups.hypothesis = undefined;
    pageSetups.experiment_free = undefined;
    pageSetups.conclusion = undefined;
    localStorage?.clear();
  });

  afterEach(() => {
    cleanup();
  });

  describe('operation logging compliance', () => {
    it('injects flow_context after page_enter with moduleName fallback and default time', async () => {
      const mark = await renderAndBuildMark(
        'hypothesis',
        (ctx) => {
          // NOTE: page_enter is now logged automatically by DroneImagingFrame's useLayoutEffect
          const targetPrefix = ctx.getPagePrefix(getSubPageNumByPageId('hypothesis'));
          ctx.logOperation({
            targetElement: `${targetPrefix}控制变量理由`,
            eventType: EventTypes.INPUT_CHANGE,
            value: '保持参数一致',
          });
        },
        { ...FLOW_CONTEXT, moduleName: 123 as any },
      );

      const pageEnterIndex = mark.operationList.findIndex(
        (op: any) => op.eventType === EventTypes.PAGE_ENTER,
      );
      const flowContextIndex = mark.operationList.findIndex(
        (op: any) => op.eventType === EventTypes.FLOW_CONTEXT,
      );

      expect(flowContextIndex).toBe(pageEnterIndex + 1);

      const flowContextOp = mark.operationList[flowContextIndex];
      const parsedFlowContext = JSON.parse(flowContextOp.value);
      expect(parsedFlowContext.moduleName).toBe('g8-drone-imaging');
      expect(flowContextOp.time).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(typeof flowContextOp.value).toBe('string');
      expect(mark.operationList.map((op: any) => op.code)).toEqual(
        Array.from({ length: mark.operationList.length }, (_, index) => index + 1),
      );
    });

    it('resets sequence and flow_context after clearing operations', async () => {
      const mark = await renderAndBuildMark('hypothesis', (ctx) => {
        // NOTE: page_enter is now logged automatically by DroneImagingFrame's useLayoutEffect
        // The Frame logs page_enter on mount, and after clearOperations(),
        // the next page_enter would be logged when navigating to a new page.
        // For this test, we simulate additional operations after the initial page_enter.
        const targetPrefix = ctx.getPagePrefix(getSubPageNumByPageId('hypothesis'));
        ctx.logOperation({
          targetElement: `${targetPrefix}控制变量理由`,
          eventType: EventTypes.INPUT_CHANGE,
          value: '第一轮',
        });

        ctx.clearOperations();

        // After clearing, manually log page_enter to simulate page re-entry
        ctx.logOperation({
          targetElement: 'page',
          eventType: EventTypes.PAGE_ENTER,
          value: 'hypothesis',
        });
        ctx.logOperation({
          targetElement: `${targetPrefix}控制变量理由`,
          eventType: EventTypes.INPUT_CHANGE,
          value: '第二轮',
        });
      });

      expect(mark.operationList.map((op: any) => op.code)).toEqual([1, 2, 3]);
      const pageEnterIndex = mark.operationList.findIndex(
        (op: any) => op.eventType === EventTypes.PAGE_ENTER,
      );
      const flowContextIndex = mark.operationList.findIndex(
        (op: any) => op.eventType === EventTypes.FLOW_CONTEXT,
      );
      expect(flowContextIndex).toBe(pageEnterIndex + 1);
    });
  });

  describe('hypothesis page', () => {
    it('should build mark with mapped codes and prefixed targets', async () => {
      const mark = await renderAndBuildMark('hypothesis', (ctx) => {
        // NOTE: page_enter is now logged automatically by DroneImagingFrame's useLayoutEffect
        const targetPrefix = ctx.getPagePrefix(getSubPageNumByPageId('hypothesis'));
        const reason = '保持参数一致，才能比较不同高度的效果';

        ctx.setAnswer(ctx.questionIds.controlVariableReason, reason);
        ctx.logOperation({
          targetElement: `${targetPrefix}控制变量理由`,
          eventType: EventTypes.INPUT_CHANGE,
          value: JSON.stringify({ prev: '', next: reason }),
          time: isoAt(5),
        });
      });

      const expectedPageNumber = encodeCompositePageNum(
        FLOW_CONTEXT.stepIndex + 1,
        getSubPageNumByPageId('hypothesis'),
      );
      expect(mark.pageNumber).toBe(expectedPageNumber);
      expect(mark.pageNumber).toMatch(PAGE_NUMBER_REGEX);

      const targetPrefix = `P${mark.pageNumber}_`;
      mark.operationList.forEach((op: any) => {
        if (isReservedElement(op.targetElement)) return;
        expect(op.targetElement.startsWith(targetPrefix)).toBe(true);
      });

      const answerCodes = mark.answerList.map((answer: any) => answer.code);
      expect(answerCodes).toEqual([QUESTION_CODE_MAP.controlVariableReason]);

      expect(toSnapshot(mark)).toMatchInlineSnapshot(`
        {
          "answers": [
            {
              "code": 2,
              "targetElement": "问题1：为什么在每次航拍时，都需要确保相机分辨率和天气条件等一致？请写出原因。",
              "value": "保持参数一致，才能比较不同高度的效果",
            },
          ],
          "operations": [
            {
              "code": 1,
              "eventType": "page_enter",
              "targetElement": "page",
              "value": "hypothesis",
            },
            {
              "code": 2,
              "eventType": "flow_context",
              "targetElement": "flow_context",
              "value": "{"flowId":"flow-drone","submoduleId":"g8-drone-imaging","stepIndex":0,"moduleName":"g8-drone-imaging","pageId":"hypothesis"}",
            },
            {
              "code": 3,
              "eventType": "input_change",
              "targetElement": "P1.03_控制变量理由",
              "value": "{"prev":"","next":"保持参数一致，才能比较不同高度的效果"}",
            },
          ],
          "pageDesc": "[flow-drone/g8-drone-imaging/0] 假设问题",
          "pageNumber": "1.03",
        }
      `);
    });
  });

  describe('experiment_free page', () => {
    it('should append experiment history with prefixed target and base code', async () => {
      const mark = await renderAndBuildMark('experiment_free', (ctx) => {
        // NOTE: page_enter is now logged automatically by DroneImagingFrame's useLayoutEffect
        const targetPrefix = ctx.getPagePrefix(getSubPageNumByPageId('experiment_free'));
        ctx.experimentState.captureHistory.push({
          height: 200,
          focalLength: 24,
          gsd: 2.13,
          timestamp: '2025-12-12 08:00:02',
        });
        ctx.logOperation({
          targetElement: `${targetPrefix}capture_button`,
          eventType: EventTypes.SIMULATION_OPERATION,
          value: JSON.stringify({ action: 'capture', height: 200, focal: 24, gsd: 2.13 }),
          time: isoAt(2),
        });
      });

      const expectedPageNumber = encodeCompositePageNum(
        FLOW_CONTEXT.stepIndex + 1,
        getSubPageNumByPageId('experiment_free'),
      );
      expect(mark.pageNumber).toBe(expectedPageNumber);
      expect(mark.pageNumber).toMatch(PAGE_NUMBER_REGEX);

      const targetPrefix = `P${mark.pageNumber}_`;
      mark.operationList.forEach((op: any) => {
        if (isReservedElement(op.targetElement)) return;
        expect(op.targetElement.startsWith(targetPrefix)).toBe(true);
      });

      const historyEntry = mark.answerList.find((answer: any) => answer.code === HISTORY_CODE_BASE);
      expect(historyEntry).toBeTruthy();
      expect(historyEntry?.targetElement.startsWith(`P${mark.pageNumber}_`)).toBe(true);
      expect(mark.answerList.map((answer: any) => answer.code)).toEqual([HISTORY_CODE_BASE]);

      expect(toSnapshot(mark)).toMatchInlineSnapshot(`
        {
          "answers": [
            {
              "code": 100,
              "targetElement": "P1.04_experiment_captures",
              "value": "[{"height":200,"focalLength":24,"gsd":2.13,"timestamp":"2025-12-12 08:00:02"}]",
            },
          ],
          "operations": [
            {
              "code": 1,
              "eventType": "page_enter",
              "targetElement": "page",
              "value": "experiment_free",
            },
            {
              "code": 2,
              "eventType": "flow_context",
              "targetElement": "flow_context",
              "value": "{"flowId":"flow-drone","submoduleId":"g8-drone-imaging","stepIndex":0,"moduleName":"g8-drone-imaging","pageId":"experiment_free"}",
            },
            {
              "code": 3,
              "eventType": "simulation_operation",
              "targetElement": "P1.04_capture_button",
              "value": "{"action":"capture","height":200,"focal":24,"gsd":2.13}",
            },
          ],
          "pageDesc": "[flow-drone/g8-drone-imaging/0] 自由实验",
          "pageNumber": "1.04",
        }
      `);
    });
  });

  describe('conclusion page', () => {
    it('should include mapped question codes and prefixed submission data', async () => {
      const mark = await renderAndBuildMark('conclusion', (ctx) => {
        // NOTE: page_enter is now logged automatically by DroneImagingFrame's useLayoutEffect
        const targetPrefix = ctx.getPagePrefix(getSubPageNumByPageId('conclusion'));
        const reason = '降低高度可以直接减小GSD';

        ctx.setAnswer(ctx.questionIds.priorityFactor, 'A. 是');
        ctx.logOperation({
          targetElement: `${targetPrefix}优先调整因素`,
          eventType: EventTypes.RADIO_SELECT,
          value: 'A',
          time: isoAt(4),
        });
        ctx.setAnswer(ctx.questionIds.priorityReason, reason);
        ctx.logOperation({
          targetElement: `${targetPrefix}理由说明`,
          eventType: EventTypes.INPUT_CHANGE,
          value: JSON.stringify({ prev: '', next: reason }),
          time: isoAt(7),
        });
        ctx.logOperation({
          targetElement: 'submit_button',
          eventType: EventTypes.CLICK,
          value: 'experiment_complete',
          time: isoAt(9),
        });
      });

      const expectedPageNumber = encodeCompositePageNum(
        FLOW_CONTEXT.stepIndex + 1,
        getSubPageNumByPageId('conclusion'),
      );
      expect(mark.pageNumber).toBe(expectedPageNumber);
      expect(mark.pageNumber).toMatch(PAGE_NUMBER_REGEX);

      const targetPrefix = `P${mark.pageNumber}_`;
      mark.operationList.forEach((op: any) => {
        if (isReservedElement(op.targetElement)) return;
        expect(op.targetElement.startsWith(targetPrefix)).toBe(true);
      });

      const answerCodes = mark.answerList.map((answer: any) => answer.code);
      expect(answerCodes).toEqual([
        QUESTION_CODE_MAP.priorityFactor,
        QUESTION_CODE_MAP.priorityReason,
      ]);

      expect(toSnapshot(mark)).toMatchInlineSnapshot(`
        {
          "answers": [
            {
              "code": 5,
              "targetElement": "问题4：右图展示了飞行高度、镜头焦距与地面采样距离（GSD）的关系曲线。请问在航拍中，为获取更高精度的影像，应优先考虑降低飞行高度还是调整镜头焦距？",
              "value": "A. 是",
            },
            {
              "code": 6,
              "targetElement": "请说明你的理由：",
              "value": "降低高度可以直接减小GSD",
            },
          ],
          "operations": [
            {
              "code": 1,
              "eventType": "page_enter",
              "targetElement": "page",
              "value": "conclusion",
            },
            {
              "code": 2,
              "eventType": "flow_context",
              "targetElement": "flow_context",
              "value": "{"flowId":"flow-drone","submoduleId":"g8-drone-imaging","stepIndex":0,"moduleName":"g8-drone-imaging","pageId":"conclusion"}",
            },
            {
              "code": 3,
              "eventType": "radio_select",
              "targetElement": "P1.07_优先调整因素",
              "value": "A",
            },
            {
              "code": 4,
              "eventType": "input_change",
              "targetElement": "P1.07_理由说明",
              "value": "{"prev":"","next":"降低高度可以直接减小GSD"}",
            },
            {
              "code": 5,
              "eventType": "click",
              "targetElement": "P1.07_submit_button",
              "value": "experiment_complete",
            },
          ],
          "pageDesc": "[flow-drone/g8-drone-imaging/0] 结论",
          "pageNumber": "1.07",
        }
      `);
    });
  });
});
