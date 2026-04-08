import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { encodeCompositePageNum } from '@shared/utils/pageMapping';
import MikaniaExperiment from '../Component';
import {
  HISTORY_CODE_BASE,
  PAGE_DESC_MAP,
  QUESTION_CODE_MAP,
  getPageSubNum,
} from '../mapping';

type PageId = 'page_02_step_q1' | 'page_03_sim_exp';

const PAGE_NUMBER_REGEX = /^[1-9]\d*\.\d{2}$/;
const FLOW_CONTEXT = {
  flowId: 'flow-mikania',
  submoduleId: 'g8-mikania-experiment',
  stepIndex: 0,
};
const USER_CONTEXT = { examNo: 'exam-001', batchCode: 'batch-001' };
const STORAGE_KEYS = {
  answers: 'module.g8-mikania-experiment.answers',
  experimentState: 'module.g8-mikania-experiment.experimentState',
};

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

vi.mock('../pages/Page02_Step_Q1', async () => {
  const React = await import('react');
  return {
    default: () =>
      React.createElement('div', { 'data-testid': 'page-page_02_step_q1' }, 'page_02_step_q1'),
  };
});

vi.mock('../pages/Page03_Sim_Exp', async () => {
  const React = await import('react');
  return {
    default: () =>
      React.createElement('div', { 'data-testid': 'page-page_03_sim_exp' }, 'page_03_sim_exp'),
  };
});

vi.mock('../pages/Page00_Notice', () => ({ default: () => null }));
vi.mock('../pages/Page01_Intro', () => ({ default: () => null }));
vi.mock('../pages/Page04_Q2_Data', () => ({ default: () => null }));
vi.mock('../pages/Page05_Q3_Trend', () => ({ default: () => null }));
vi.mock('../pages/Page06_Q4_Conc', () => ({ default: () => null }));

const toSnapshot = (mark: any) => ({
  pageNumber: mark.pageNumber,
  pageDesc: mark.pageDesc,
  operations: (mark.operationList || []).map(
    ({ code, eventType, targetElement, value }: any) => ({
      code,
      eventType,
      targetElement,
      value,
    }),
  ),
  answers: (mark.answerList || []).map(({ code, targetElement, value }: any) => ({
    code,
    targetElement,
    value,
  })),
});

const renderAndBuildMark = async (pageId: PageId, assertReady?: (mark: any) => void) => {
  render(
    React.createElement(MikaniaExperiment, {
      initialPageId: pageId,
      flowContext: FLOW_CONTEXT,
      userContext: USER_CONTEXT,
    }),
  );

  await screen.findByTestId(`page-${pageId}`);

  let mark: any;
  await waitFor(() => {
    expect(typeof latestSubmission?.buildMark).toBe('function');
    const candidate = latestSubmission.buildMark();
    if (assertReady) {
      assertReady(candidate);
    }
    mark = candidate;
  });

  return mark;
};

describe('g8-mikania submission snapshots', () => {
  beforeEach(() => {
    localStorage.clear();
    latestSubmission = undefined;
  });

  describe('page_02_step_q1 page', () => {
    it('should produce valid mark object structure', async () => {
      const answerValue = '保持对照实验，排除其他变量干扰';
      localStorage.setItem(
        STORAGE_KEYS.answers,
        JSON.stringify({ Q1_控制变量原因: answerValue }),
      );

      const mark = await renderAndBuildMark('page_02_step_q1', (candidate) => {
        expect(candidate.answerList?.length).toBeGreaterThan(0);
      });

      const expectedPageNumber = encodeCompositePageNum(
        FLOW_CONTEXT.stepIndex + 1,
        parseInt(getPageSubNum('page_02_step_q1'), 10),
      );
      expect(mark.pageNumber).toBe(expectedPageNumber);
      expect(mark.pageNumber).toMatch(PAGE_NUMBER_REGEX);

      const flowPrefix = `[${FLOW_CONTEXT.flowId}/${FLOW_CONTEXT.submoduleId}/${FLOW_CONTEXT.stepIndex}]`;
      expect(mark.pageDesc.startsWith(flowPrefix)).toBe(true);

      const [q1Answer] = mark.answerList;
      expect(q1Answer.code).toBe(QUESTION_CODE_MAP.Q1);

      expect(toSnapshot(mark)).toMatchInlineSnapshot(`
        {
          "answers": [
            {
              "code": 1,
              "targetElement": "问题1：为什么在每组实验中，都要确保其他条件一致？",
              "value": "保持对照实验，排除其他变量干扰",
            },
          ],
          "operations": [],
          "pageDesc": "[flow-mikania/g8-mikania-experiment/0] 实验步骤",
          "pageNumber": "1.03",
        }
      `);
    });
  });

  describe('page_03_sim_exp page', () => {
    it('should include experiment history with correct code', async () => {
      const historyRuns = [
        {
          concentration: '5mg/ml',
          days: 3,
          germinationRate: 0.74,
          timestamp: '2025-12-12T08:00:00.000Z',
        },
      ];
      localStorage.setItem(
        STORAGE_KEYS.experimentState,
        JSON.stringify({ history: historyRuns }),
      );

      const mark = await renderAndBuildMark('page_03_sim_exp', (candidate) => {
        expect(candidate.answerList?.length).toBeGreaterThan(0);
      });

      const expectedPageNumber = encodeCompositePageNum(
        FLOW_CONTEXT.stepIndex + 1,
        parseInt(getPageSubNum('page_03_sim_exp'), 10),
      );
      expect(mark.pageNumber).toBe(expectedPageNumber);
      expect(mark.pageNumber).toMatch(PAGE_NUMBER_REGEX);

      const historyEntry = mark.answerList.find((answer: any) => answer.code === HISTORY_CODE_BASE);
      expect(historyEntry).toBeTruthy();
      expect(historyEntry?.targetElement).toBe(`P${mark.pageNumber}_实验历史`);

      expect(toSnapshot(mark)).toMatchInlineSnapshot(`
        {
          "answers": [
            {
              "code": 100,
              "targetElement": "P1.04_实验历史",
              "value": "{"runs":[{"concentration":"5mg/ml","days":3,"germinationRate":0.74,"timestamp":"2025-12-12T08:00:00.000Z"}]}",
            },
          ],
          "operations": [],
          "pageDesc": "[flow-mikania/g8-mikania-experiment/0] 模拟实验",
          "pageNumber": "1.04",
        }
      `);
    });

    it('should include flow context prefix in pageDesc when in flow mode', async () => {
      const mark = await renderAndBuildMark('page_03_sim_exp');
      const flowPrefix = `[${FLOW_CONTEXT.flowId}/${FLOW_CONTEXT.submoduleId}/${FLOW_CONTEXT.stepIndex}]`;

      expect(mark.pageDesc).toBe(`${flowPrefix} ${PAGE_DESC_MAP['page_03_sim_exp']}`);
      expect(mark.pageNumber).toMatch(PAGE_NUMBER_REGEX);
    });
  });
});
