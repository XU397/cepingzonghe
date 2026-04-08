import { useEffect } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { RESERVED_TARGET_ELEMENTS, validateMarkObject } from '../schema.ts';
import {
  TrackingProvider,
  useTrackingContext,
} from '../../../../modules/grade-7-tracking/context/TrackingProvider.jsx';

const PAGE_NUMBER_REGEX = /^[1-9]\d*\.\d{2}$/;
const reservedTargetSet = new Set(RESERVED_TARGET_ELEMENTS);

function ContextHarness({ onContextReady }) {
  const contextValue = useTrackingContext();

  useEffect(() => {
    onContextReady(contextValue);
  }, [contextValue, onContextReady]);

  return null;
}

function createUserContext(stepIndex, submoduleId) {
  return {
    batchCode: 'batch-001',
    examNo: 'exam-001',
    studentName: '测试学生',
    schoolCode: 'school-001',
    getFlowContext: () => ({
      flowId: 'flow-g7-tracking',
      submoduleId,
      stepIndex,
      moduleName: 'grade-7-tracking',
      pageId: 'test-page',
    }),
  };
}

function assertMarkSchemaConventions(mark) {
  expect(mark.pageNumber).toMatch(PAGE_NUMBER_REGEX);

  const expectedPrefix = `P${mark.pageNumber}_`;

  mark.operationList.forEach(operation => {
    if (!reservedTargetSet.has(operation.targetElement)) {
      expect(operation.targetElement.startsWith(expectedPrefix)).toBe(true);
    }
  });

  mark.answerList.forEach(answer => {
    if (!reservedTargetSet.has(answer.targetElement)) {
      expect(answer.targetElement.startsWith(expectedPrefix)).toBe(true);
    }
  });

  const eventTypes = mark.operationList.map(operation => operation.eventType);
  expect(eventTypes).toContain('page_enter');
  expect(eventTypes).toContain('page_exit');
  expect(
    eventTypes.some(eventType => eventType === 'next_click' || eventType === 'auto_submit')
  ).toBe(true);

  expect(() => validateMarkObject(mark)).not.toThrow();
}

describe('TrackingProvider buildMarkObject schema integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('legacy page 1 + stepIndex=0 生成 1.01 且通过 schema 校验', async () => {
    let contextValue;

    render(
      <TrackingProvider
        userContext={createUserContext(0, 'g7-experiment')}
        initialPageId="Page_01_Intro"
      >
        <ContextHarness onContextReady={value => (contextValue = value)} />
      </TrackingProvider>
    );

    await waitFor(() => {
      expect(contextValue).toBeTruthy();
    });

    await act(async () => {
      contextValue.logOperation({ action: 'page_enter', target: 'page', value: '蜂蜜的奥秘' });
      contextValue.logOperation({ action: 'click', target: 'start_button', value: '开始' });
      contextValue.logOperation({ action: 'next_click', target: 'next_button', value: '下一页' });
      contextValue.logOperation({ action: 'page_exit', target: 'page', value: 'leave_page_1' });
      contextValue.collectAnswer({ targetElement: 'hypothesis_input', value: '蜂蜜更浓稠' });
    });

    await waitFor(() => {
      expect(contextValue.operationLog.length).toBeGreaterThanOrEqual(4);
    });

    const mark = contextValue.buildMarkObject('1', '蜂蜜的奥秘');
    expect(mark.pageNumber).toBe('1.01');
    assertMarkSchemaConventions(mark);
  });

  it('legacy page 14 + stepIndex=1 生成 2.01 且通过 schema 校验', async () => {
    let contextValue;

    render(
      <TrackingProvider
        userContext={createUserContext(1, 'g7-questionnaire')}
        initialPageId="Questionnaire_01"
      >
        <ContextHarness onContextReady={value => (contextValue = value)} />
      </TrackingProvider>
    );

    await waitFor(() => {
      expect(contextValue).toBeTruthy();
    });

    await act(async () => {
      contextValue.logOperation({ action: 'page_enter', target: 'page', value: '问卷调查第1页' });
      contextValue.logOperation({ action: 'radio_select', target: 'q1_option', value: 'C' });
      contextValue.logOperation({ action: 'next_click', target: 'next_button', value: '下一页' });
      contextValue.logOperation({ action: 'page_exit', target: 'page', value: 'leave_page_14' });
      contextValue.updateQuestionnaireAnswer(1, 'C');
    });

    await waitFor(() => {
      expect(contextValue.operationLog.length).toBeGreaterThanOrEqual(4);
      expect(Object.keys(contextValue.questionnaireAnswers).length).toBeGreaterThan(0);
    });

    const mark = contextValue.buildMarkObject('14', '问卷调查第1页');
    expect(mark.pageNumber).toBe('2.01');
    assertMarkSchemaConventions(mark);
  });
});
