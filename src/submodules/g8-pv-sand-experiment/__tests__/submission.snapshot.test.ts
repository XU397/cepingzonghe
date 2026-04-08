import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { encodeCompositePageNum } from '@shared/utils/pageMapping';
import G8PvSandExperiment from '../Component';
import {
  HISTORY_CODE_BASE,
  QUESTION_CODE_MAP,
  getSubPageNumByPageId,
  type PageId,
} from '../mapping';

type PageSetup = (ctx: any) => void;

const BASE_TIME = new Date('2025-12-12T08:00:00.000Z');
const PAGE_NUMBER_REGEX = /^[1-9]\d*\.\d{2}$/;
const FLOW_CONTEXT = {
  flowId: 'flow-pv',
  submoduleId: 'g8-pv-sand-experiment',
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
    usePageSubmissionContext: () => ({}),
  };
});

vi.mock('../pages/Page04ExperimentDesign', async () => {
  const React = await import('react');
  const { usePvSandContext } = await import('../context/PvSandContext');

  const Page = () => {
    const ctx = usePvSandContext();
    React.useEffect(() => {
      const setup = pageSetups.experiment_design;
      setup?.({ ...ctx, targetPrefix: ctx.getPagePrefix() });
    }, []);
    return React.createElement(
      'div',
      { 'data-testid': 'page-experiment_design' },
      'experiment_design',
    );
  };

  return { default: Page };
});

vi.mock('../pages/Page06Experiment1', async () => {
  const React = await import('react');
  const { usePvSandContext } = await import('../context/PvSandContext');

  const Page = () => {
    const ctx = usePvSandContext();
    React.useEffect(() => {
      const setup = pageSetups.experiment_task1;
      setup?.({ ...ctx, targetPrefix: ctx.getPagePrefix() });
    }, []);
    return React.createElement(
      'div',
      { 'data-testid': 'page-experiment_task1' },
      'experiment_task1',
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
    React.createElement(G8PvSandExperiment, {
      initialPageId: pageId,
      flowContext: FLOW_CONTEXT,
      userContext: USER_CONTEXT,
    }),
  );
  await screen.findByTestId(`page-${pageId}`);
  expect(typeof latestSubmission?.buildMark).toBe('function');
  // 等待 useEffect 中的 setup 完成（answerList 不为空）
  let mark: any;
  await waitFor(() => {
    mark = latestSubmission.buildMark();
    expect(mark.answerList.length).toBeGreaterThan(0);
  });
  return mark;
};

describe('g8-pv-sand submission snapshots', () => {
  beforeEach(() => {
    latestSubmission = undefined;
    pageSetups.experiment_design = undefined;
    pageSetups.experiment_task1 = undefined;
  });

  describe('experiment_design page', () => {
    it('should produce valid mark object structure', async () => {
      const mark = await renderAndBuildMark('experiment_design', (ctx) => {
        const prefix = ctx.targetPrefix;
        ctx.setPageStartTime(new Date(BASE_TIME));
        ctx.logOperation({
          targetElement: `${prefix}页面`,
          eventType: EventTypes.PAGE_ENTER,
          value: ctx.currentPageId,
          time: isoAt(0),
        });
        ctx.collectAnswer({
          targetElement: 'designReason',
          value: '为了对照实验，排除其他变量干扰',
        });
        ctx.logOperation({
          targetElement: `${prefix}Q1_实验设计原因`,
          eventType: EventTypes.INPUT_CHANGE,
          value: JSON.stringify({
            prev: '',
            next: '为了对照实验，排除其他变量干扰',
          }),
          time: isoAt(10),
        });
      });

      const expectedPageNumber = encodeCompositePageNum(
        FLOW_CONTEXT.stepIndex + 1,
        getSubPageNumByPageId('experiment_design'),
      );
      expect(mark.pageNumber).toBe(expectedPageNumber);
      expect(mark.pageNumber).toMatch(PAGE_NUMBER_REGEX);

      const targetPrefix = `P${mark.pageNumber}_`;
      mark.operationList.forEach((op: any) => {
        if (op.targetElement === 'flow_context') return;
        expect(op.targetElement.startsWith(targetPrefix)).toBe(true);
      });

      const answerCodes = mark.answerList.map((answer: any) => answer.code);
      expect(answerCodes).toEqual([QUESTION_CODE_MAP.Q1]);

      expect(toSnapshot(mark)).toMatchInlineSnapshot(`
        {
          "answers": [
            {
              "code": 1,
              "targetElement": "问题1：为什么要在无板区和有板区分别放置两套相同的测量仪器？请写出原因。",
              "value": "为了对照实验，排除其他变量干扰",
            },
          ],
          "operations": [
            {
              "code": 1,
              "eventType": "page_enter",
              "targetElement": "P1.03_页面",
              "value": "experiment_design",
            },
            {
              "code": 2,
              "eventType": "flow_context",
              "targetElement": "flow_context",
              "value": "{"flowId":"flow-pv","submoduleId":"g8-pv-sand-experiment","stepIndex":0,"moduleName":"光伏治沙实验","pageId":"experiment_design"}",
            },
            {
              "code": 3,
              "eventType": "input_change",
              "targetElement": "P1.03_Q1_实验设计原因",
              "value": "{"prev":"","next":"为了对照实验，排除其他变量干扰"}",
            },
          ],
          "pageDesc": "[flow-pv/g8-pv-sand-experiment/0] 实验方案设计",
          "pageNumber": "1.03",
        }
      `);
    });
  });

  describe('experiment_task1 page', () => {
    it('should include experiment history with correct code', async () => {
      const mark = await renderAndBuildMark('experiment_task1', (ctx) => {
        const prefix = ctx.targetPrefix;
        ctx.setPageStartTime(new Date(BASE_TIME));
        ctx.logOperation({
          targetElement: `${prefix}页面`,
          eventType: EventTypes.PAGE_ENTER,
          value: ctx.currentPageId,
          time: isoAt(0),
        });
        ctx.logOperation({
          targetElement: `${prefix}高度调节`,
          eventType: EventTypes.SIMULATION_OPERATION,
          value: JSON.stringify({ action: 'adjust_height', toHeight: 50 }),
          time: isoAt(1),
        });
        ctx.updateExperimentState({
          collectedData: {
            heightLevel: 50,
            withPanelSpeed: 2.25,
            noPanelSpeed: 2.62,
            timestamp: isoAt(2),
          },
        });
        ctx.collectAnswer({
          targetElement: 'experiment1Choice',
          value: 'withPanel',
        });
        ctx.logOperation({
          targetElement: `${prefix}Q2_50cm风速区域`,
          eventType: EventTypes.RADIO_SELECT,
          value: 'A. 有板区',
          time: isoAt(3),
        });
        ctx.logOperation({
          targetElement: `${prefix}页面`,
          eventType: EventTypes.PAGE_EXIT,
          value: ctx.currentPageId,
          time: isoAt(4),
        });
      });

      const expectedPageNumber = encodeCompositePageNum(
        FLOW_CONTEXT.stepIndex + 1,
        getSubPageNumByPageId('experiment_task1'),
      );
      expect(mark.pageNumber).toBe(expectedPageNumber);
      expect(mark.pageNumber).toMatch(PAGE_NUMBER_REGEX);

      const targetPrefix = `P${mark.pageNumber}_`;
      mark.operationList.forEach((op: any) => {
        if (op.targetElement === 'flow_context') return;
        expect(op.targetElement.startsWith(targetPrefix)).toBe(true);
      });

      const questionEntry = mark.answerList.find(
        (answer: any) => answer.targetElement.includes('问题2'),
      );
      expect(questionEntry?.code).toBe(QUESTION_CODE_MAP.Q2);

      const historyEntry = mark.answerList.find(
        (answer: any) => answer.code === HISTORY_CODE_BASE,
      );
      expect(historyEntry).toBeTruthy();
      expect(historyEntry?.targetElement.startsWith(targetPrefix)).toBe(true);

      expect(toSnapshot(mark)).toMatchInlineSnapshot(`
        {
          "answers": [
            {
              "code": 2,
              "targetElement": "问题2：根据模拟实验，在50厘米高度，哪个区域的风速更低？",
              "value": "A. 有板区",
            },
            {
              "code": 100,
              "targetElement": "P1.05_实验历史",
              "value": "{"heightLevel":50,"withPanelSpeed":2.25,"noPanelSpeed":2.62,"timestamp":"2025-12-12T08:00:02.000Z"}",
            },
          ],
          "operations": [
            {
              "code": 1,
              "eventType": "page_enter",
              "targetElement": "P1.05_页面",
              "value": "experiment_task1",
            },
            {
              "code": 2,
              "eventType": "flow_context",
              "targetElement": "flow_context",
              "value": "{"flowId":"flow-pv","submoduleId":"g8-pv-sand-experiment","stepIndex":0,"moduleName":"光伏治沙实验","pageId":"experiment_task1"}",
            },
            {
              "code": 3,
              "eventType": "simulation_operation",
              "targetElement": "P1.05_高度调节",
              "value": "{"action":"adjust_height","toHeight":50}",
            },
            {
              "code": 4,
              "eventType": "radio_select",
              "targetElement": "P1.05_Q2_50cm风速区域",
              "value": "A. 有板区",
            },
            {
              "code": 5,
              "eventType": "page_exit",
              "targetElement": "P1.05_页面",
              "value": "experiment_task1",
            },
          ],
          "pageDesc": "[flow-pv/g8-pv-sand-experiment/0] 实验探究-1",
          "pageNumber": "1.05",
        }
      `);
    });
  });
});
