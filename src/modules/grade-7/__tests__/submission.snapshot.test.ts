import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { encodeCompositePageNum } from '@shared/utils/pageMapping';

const PAGE_NUMBER_REGEX = /^[1-9]\d*\.\d{2}$/;
const FLOW_CONTEXT = {
  flowId: 'flow-g7',
  submoduleId: 'g7-experiment',
  stepIndex: 0,
};

let latestSubmission: any;
let mockAppContextValue: any;

vi.mock('@shared/ui/PageFrame', () => {
  const React = require('react');
  return {
    AssessmentPageFrame: ({ submission, children }: any) => {
      latestSubmission = submission;
      return React.createElement('div', { 'data-testid': 'assessment-frame' }, children);
    },
  };
});

vi.mock('../../../components/PageRouter', () => {
  const React = require('react');
  return {
    default: () => React.createElement('div', { 'data-testid': 'page-router' }, 'PageRouter'),
  };
});

vi.mock('../../../context/AppContext', () => ({
  useAppContext: () => mockAppContextValue,
}));

vi.mock('../../../utils/pageMappings', () => ({
  pageInfoMapping: {
    Page_02_Introduction: {
      number: '2',
      desc: '第一题',
      stepNumber: 1,
      isInProgress: true,
    },
    Page_03_Dialogue_Question: {
      number: '3',
      desc: '第二题',
      stepNumber: 2,
      isInProgress: true,
    },
    Page_10_Hypothesis_Focus: {
      number: '10',
      desc: '第四题',
      stepNumber: 4,
      isInProgress: true,
    },
  },
  isQuestionnairePage: () => false,
  getQuestionnaireStepNumber: () => null,
  TOTAL_QUESTIONNAIRE_STEPS: 8,
  TOTAL_USER_STEPS: 19,
}));

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

describe('g7-experiment submission snapshots', () => {
  beforeEach(() => {
    localStorage.clear();
    latestSubmission = undefined;
    mockAppContextValue = {
      currentStepNumber: 1,
      totalUserSteps: 19,
      currentPageId: 'Page_02_Introduction',
      batchCode: 'batch-001',
      examNo: 'exam-001',
      taskStartTime: new Date('2025-12-12T08:00:00.000Z'),
      isQuestionnaireStarted: false,
      remainingTime: 2400,
      questionnaireRemainingTime: 0,
      currentPageData: {
        operationList: [],
        answerList: [],
      },
      pageEnterTime: new Date('2025-12-12T08:00:00.000Z'),
    };
  });

  describe('Page_02_Introduction page', () => {
    it('should produce valid mark object structure in standalone mode', async () => {
      const { Grade7Wrapper } = await import('../wrapper');

      render(
        React.createElement(Grade7Wrapper, {
          userContext: { examNo: 'exam-001', batchCode: 'batch-001' },
          initialPageId: 'Page_02_Introduction',
          flowContext: null,
          options: {},
        }),
      );

      await screen.findByTestId('assessment-frame');

      expect(typeof latestSubmission?.buildMark).toBe('function');
      const mark = latestSubmission.buildMark();

      // Standalone mode: stepIndex defaults to 0 (no flowContext.stepIndex, no meta.stepIndex)
      // So pageNumber = encodeCompositePageNum(0+1, 2) = "1.02"
      const expectedPageNumber = encodeCompositePageNum(1, 2);
      expect(mark.pageNumber).toBe(expectedPageNumber);
      expect(mark.pageNumber).toMatch(PAGE_NUMBER_REGEX);

      // No flow context prefix in standalone mode
      expect(mark.pageDesc).not.toContain('[');

      expect(toSnapshot(mark)).toMatchInlineSnapshot(`
        {
          "answers": [],
          "operations": [],
          "pageDesc": "第一题",
          "pageNumber": "1.02",
        }
      `);
    });

    it('should produce valid mark object structure in flow mode', async () => {
      const { Grade7Wrapper } = await import('../wrapper');

      render(
        React.createElement(Grade7Wrapper, {
          userContext: { examNo: 'exam-001', batchCode: 'batch-001' },
          initialPageId: 'Page_02_Introduction',
          flowContext: FLOW_CONTEXT,
          options: {},
        }),
      );

      await screen.findByTestId('assessment-frame');

      expect(typeof latestSubmission?.buildMark).toBe('function');
      const mark = latestSubmission.buildMark();

      // Flow mode: stepIndex from flowContext (0), subPageNum is 2
      const expectedPageNumber = encodeCompositePageNum(
        FLOW_CONTEXT.stepIndex + 1,
        2,
      );
      expect(mark.pageNumber).toBe(expectedPageNumber);
      expect(mark.pageNumber).toMatch(PAGE_NUMBER_REGEX);

      // Flow context prefix present
      const flowPrefix = `[${FLOW_CONTEXT.flowId}/${FLOW_CONTEXT.submoduleId}/${FLOW_CONTEXT.stepIndex}]`;
      expect(mark.pageDesc.startsWith(flowPrefix)).toBe(true);

      // flow_context operation is auto-injected; value is stringified JSON with moduleName
      expect(toSnapshot(mark)).toMatchInlineSnapshot(`
        {
          "answers": [],
          "operations": [
            {
              "code": 1,
              "eventType": "flow_context",
              "targetElement": "flow_context",
              "value": "{\"flowId\":\"flow-g7\",\"submoduleId\":\"g7-experiment\",\"stepIndex\":0,\"moduleName\":\"蒸馒头实验\",\"pageId\":\"Page_02_Introduction\"}",
            },
          ],
          "pageDesc": "[flow-g7/g7-experiment/0] 第一题",
          "pageNumber": "1.02",
        }
      `);
    });
  });

  describe('Page with operations and answers', () => {
    it('should include normalized operations and answers', async () => {
      mockAppContextValue = {
        ...mockAppContextValue,
        currentPageId: 'Page_10_Hypothesis_Focus',
        currentStepNumber: 4,
        currentPageData: {
          operationList: [
            {
              targetElement: 'page',
              eventType: 'page_enter',
              value: 'Page_10_Hypothesis_Focus',
              time: '2025-12-12T08:00:00.000Z',
            },
            {
              targetElement: '假设输入框',
              eventType: 'input_change',
              value: JSON.stringify({ prev: '', next: '酵母浓度影响发酵速度' }),
              time: '2025-12-12T08:00:05.000Z',
            },
          ],
          answerList: [
            {
              targetElement: '假设内容',
              value: '酵母浓度影响发酵速度',
            },
          ],
        },
      };

      const { Grade7Wrapper } = await import('../wrapper');

      render(
        React.createElement(Grade7Wrapper, {
          userContext: { examNo: 'exam-001', batchCode: 'batch-001' },
          initialPageId: 'Page_10_Hypothesis_Focus',
          flowContext: FLOW_CONTEXT,
          options: {},
        }),
      );

      await screen.findByTestId('assessment-frame');

      expect(typeof latestSubmission?.buildMark).toBe('function');
      const mark = latestSubmission.buildMark();

      // Flow mode: stepIndex from flowContext (0), subPageNum is 10
      const expectedPageNumber = encodeCompositePageNum(
        FLOW_CONTEXT.stepIndex + 1,
        10,
      );
      expect(mark.pageNumber).toBe(expectedPageNumber);
      expect(mark.pageNumber).toMatch(PAGE_NUMBER_REGEX);

      // Operations should have prefixed targetElements (except reserved)
      const targetPrefix = `P${mark.pageNumber}_`;
      mark.operationList.forEach((op: any) => {
        if (op.targetElement === 'page' || op.targetElement === 'flow_context') return;
        expect(op.targetElement.startsWith(targetPrefix)).toBe(true);
      });

      // Codes are normalized after flow_context injection; original ops are sequentially numbered
      expect(toSnapshot(mark)).toMatchInlineSnapshot(`
        {
          "answers": [
            {
              "code": 1,
              "targetElement": "P1.10_假设内容",
              "value": "酵母浓度影响发酵速度",
            },
          ],
          "operations": [
            {
              "code": 1,
              "eventType": "page_enter",
              "targetElement": "page",
              "value": "Page_10_Hypothesis_Focus",
            },
            {
              "code": 2,
              "eventType": "flow_context",
              "targetElement": "flow_context",
              "value": "{\"flowId\":\"flow-g7\",\"submoduleId\":\"g7-experiment\",\"stepIndex\":0,\"moduleName\":\"蒸馒头实验\",\"pageId\":\"Page_10_Hypothesis_Focus\"}",
            },
            {
              "code": 3,
              "eventType": "input_change",
              "targetElement": "P1.10_假设输入框",
              "value": "{\"prev\":\"\",\"next\":\"酵母浓度影响发酵速度\"}",
            },
          ],
          "pageDesc": "[flow-g7/g7-experiment/0] 第四题",
          "pageNumber": "1.10",
        }
      `);
    });
  });

  describe('backward compatibility', () => {
    it('should maintain AppContext data format compatibility', async () => {
      const { Grade7Wrapper } = await import('../wrapper');

      render(
        React.createElement(Grade7Wrapper, {
          userContext: { examNo: 'exam-001', batchCode: 'batch-001' },
          initialPageId: 'Page_02_Introduction',
          flowContext: null,
          options: {},
        }),
      );

      await screen.findByTestId('assessment-frame');

      expect(typeof latestSubmission?.getUserContext).toBe('function');
      const userContext = latestSubmission.getUserContext();

      expect(userContext).toEqual({
        batchCode: 'batch-001',
        examNo: 'exam-001',
      });
    });
  });
});
