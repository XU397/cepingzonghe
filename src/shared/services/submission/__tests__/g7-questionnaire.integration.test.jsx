import { act, render, renderHook, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePageSubmission } from '../usePageSubmission.js';
import { RESERVED_TARGET_ELEMENTS, validateMarkObject } from '../schema.ts';

const PAGE_NUMBER_REGEX = /^[1-9]\d*\.\d{2}$/;

let capturedSubmissionConfig;
let mockAppContextValue;

vi.mock('@shared/ui/PageFrame', () => {
  const React = require('react');
  return {
    AssessmentPageFrame: ({ submission, children }) => {
      capturedSubmissionConfig = submission;
      return React.createElement('div', { 'data-testid': 'assessment-frame' }, children);
    },
  };
});

vi.mock('../../../../components/PageRouter', () => {
  const React = require('react');
  return {
    default: () => React.createElement('div', { 'data-testid': 'page-router' }, 'PageRouter'),
  };
});

vi.mock('../../../../context/AppContext', () => ({
  useAppContext: () => mockAppContextValue,
}));

describe('g7-questionnaire wrapper bridge integration', () => {
  beforeEach(() => {
    capturedSubmissionConfig = undefined;
    mockAppContextValue = {
      currentStepNumber: 1,
      totalUserSteps: 19,
      currentPageId: 'Page_21_Curiosity_Questions',
      batchCode: 'batch-001',
      examNo: 'exam-001',
      taskStartTime: new Date('2025-12-12T08:00:00.000Z'),
      isQuestionnaireStarted: true,
      remainingTime: 1800,
      questionnaireRemainingTime: 580,
      currentPageData: {
        operationList: [],
        answerList: [
          {
            targetElement: 'Q_curiosity_01',
            value: 'agree',
          },
        ],
      },
      pageEnterTime: new Date('2025-12-12T08:05:00.000Z'),
    };
  });

  it('submits schema-valid final MarkObject via usePageSubmission', async () => {
    const { Grade7Wrapper } = await import('../../../../modules/grade-7/wrapper');

    render(
      <Grade7Wrapper
        userContext={{ batchCode: 'batch-001', examNo: 'exam-001' }}
        initialPageId="Page_21_Curiosity_Questions"
        flowContext={{
          flowId: 'flow-g7',
          submoduleId: 'g7-questionnaire',
          stepIndex: 0,
          moduleName: 'grade-7',
        }}
        options={{}}
      />
    );

    await screen.findByTestId('assessment-frame');
    expect(capturedSubmissionConfig).toBeTruthy();

    let submittedMark;
    const submitImpl = vi.fn(async payload => {
      submittedMark = payload.mark;
      return { code: 200, msg: 'ok' };
    });

    const { result } = renderHook(() =>
      usePageSubmission({
        ...capturedSubmissionConfig,
        submitImpl,
      })
    );

    await act(async () => {
      const success = await result.current.submit();
      expect(success).toBe(true);
    });

    expect(submitImpl).toHaveBeenCalledTimes(1);
    const validatedMark = validateMarkObject(submittedMark);

    expect(validatedMark.pageNumber).toMatch(PAGE_NUMBER_REGEX);

    const expectedPrefix = `P${validatedMark.pageNumber}_`;
    const reservedTargetSet = new Set(RESERVED_TARGET_ELEMENTS);
    validatedMark.operationList.forEach(operation => {
      if (reservedTargetSet.has(operation.targetElement)) {
        return;
      }
      expect(operation.targetElement.startsWith(expectedPrefix)).toBe(true);
    });

    const eventTypes = validatedMark.operationList.map(operation => operation.eventType);
    expect(eventTypes).toContain('page_enter');
    expect(eventTypes).toContain('page_exit');
    expect(
      eventTypes.some(eventType => eventType === 'next_click' || eventType === 'auto_submit')
    ).toBe(true);

    validatedMark.answerList.forEach(answer => {
      expect(answer.value.trim().length).toBeGreaterThan(0);
    });
  });
});
