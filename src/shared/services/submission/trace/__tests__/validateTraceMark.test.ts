import { describe, expect, it } from 'vitest';
import { validateTraceMark } from '../validators/validateTraceMark';

const validMark = {
  pageNumber: '1.10',
  pageDesc: '模拟实验 + 问题1',
  beginTime: '2026-06-03T10:10:00.000+08:00',
  endTime: '2026-06-03T10:10:30.000+08:00',
  imgList: [],
  answerList: [{ code: 1, targetElement: 'P1.10_Q5', value: 'B. 6天' }],
  operationList: [
    {
      code: 1,
      targetElement: 'P1.10_page',
      eventType: 'START_PAGE',
      time: '2026-06-03T10:10:00.000+08:00',
      pageId: 'simulation_question_1',
      value: {
        trace_id: 'trace-1',
        page_id: 'page_09_experiment_question_1',
        page_type: 'D2_SIMULATION_QUESTION',
        target_id: 'page',
        target_type: 'page',
        metadata: {
          schema_version: 'science-inquiry-trace-v2.1',
          field_registry_version: 'science-inquiry-field-registry-v2.1',
          content_registry_version: 'science-inquiry-content-registry-banana-v2.1',
        },
      },
    },
    {
      code: 2,
      targetElement: 'P1.10_question_1_option_b',
      eventType: 'SELECT_ANSWER',
      time: '2026-06-03T10:10:20.000+08:00',
      pageId: 'simulation_question_1',
      value: {
        trace_id: 'trace-2',
        page_id: 'page_09_experiment_question_1',
        page_type: 'D2_SIMULATION_QUESTION',
        target_id: 'question_1_option_b',
        target_type: 'radio',
        question_id: 'question_1',
        option_id: 'option_b',
        metadata: {},
      },
    },
    {
      code: 3,
      targetElement: 'P1.10_next_button',
      eventType: 'SUBMIT_ATTEMPT',
      time: '2026-06-03T10:10:30.000+08:00',
      pageId: 'simulation_question_1',
      value: {
        trace_id: 'trace-3',
        page_id: 'page_09_experiment_question_1',
        page_type: 'D2_SIMULATION_QUESTION',
        target_id: 'next_button',
        target_type: 'button',
        submit_attempt_id: 'submit-1',
        validation_status: 'success',
        metadata: { missing_fields: [] },
      },
    },
  ],
};

describe('validateTraceMark', () => {
  it('accepts a valid L2 trace mark', () => {
    expect(() => validateTraceMark(validMark)).not.toThrow();
  });

  it('rejects legacy lifecycle events in L2 mode', () => {
    expect(() =>
      validateTraceMark({
        ...validMark,
        operationList: [
          ...validMark.operationList,
          {
            code: 4,
            targetElement: 'P1.10_page',
            eventType: 'page_enter',
            time: '2026-06-03T10:10:31.000+08:00',
            value: 'legacy',
          },
        ],
      })
    ).toThrow(/L2 trace eventType/);
  });

  it('rejects stringified value objects', () => {
    expect(() =>
      validateTraceMark({
        ...validMark,
        operationList: [
          {
            ...validMark.operationList[0],
            value: JSON.stringify(validMark.operationList[0].value),
          },
        ],
      })
    ).toThrow(/value must be an object/);
  });
});
