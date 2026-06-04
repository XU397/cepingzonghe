import { describe, expect, it } from 'vitest';
import { createPageTraceLogger } from '../logger';
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

const cloneValidMark = () => JSON.parse(JSON.stringify(validMark));

const createOperation = (eventType: string, valuePatch: Record<string, unknown>) => ({
  code: 2,
  targetElement: 'P1.10_target',
  eventType,
  time: '2026-06-03T10:10:20.000+08:00',
  pageId: 'simulation_question_1',
  value: {
    trace_id: `trace-${eventType}`,
    page_id: 'page_09_experiment_question_1',
    page_type: 'D2_SIMULATION_QUESTION',
    target_id: 'target',
    target_type: 'button',
    metadata: {},
    ...valuePatch,
  },
});

const markWithOperations = (operations: any[]) => ({
  ...cloneValidMark(),
  operationList: operations.map((operation, index) => ({
    ...operation,
    code: index + 1,
  })),
});

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

  it('rejects marks without START_PAGE', () => {
    const submitAttempt = createOperation('SUBMIT_ATTEMPT', {
      target_id: 'next_button',
      target_type: 'button',
      submit_attempt_id: 'submit-1',
      validation_status: 'success',
      metadata: { missing_fields: [] },
    });

    expect(() => validateTraceMark(markWithOperations([submitAttempt]))).toThrow(/START_PAGE/);
  });

  it('rejects operations missing target_id', () => {
    const mark = cloneValidMark();
    delete mark.operationList[0].value.target_id;

    expect(() => validateTraceMark(mark)).toThrow(/target_id/);
  });

  it('rejects page IDs absent from trace registries', () => {
    const mark = cloneValidMark();
    mark.operationList[0].value.page_id = 'page_missing_from_registries';

    expect(() => validateTraceMark(mark)).toThrow(/page_id.*registry/i);
  });

  it.each([
    [
      'SET_EXP_PARAM',
      createOperation('SET_EXP_PARAM', {
        target_id: 'days_slider',
        target_type: 'experiment',
        param_name: 'days',
      }),
      /param_id/,
    ],
    [
      'SET_EXP_PARAM',
      createOperation('SET_EXP_PARAM', {
        target_id: 'days_slider',
        target_type: 'experiment',
        param_id: 'exp_param_days',
      }),
      /param_name/,
    ],
    [
      'EXECUTE_EXP',
      createOperation('EXECUTE_EXP', {
        target_id: 'execute_exp',
        target_type: 'experiment',
      }),
      /exp_run_id/,
    ],
    [
      'RESET_EXP',
      createOperation('RESET_EXP', {
        target_id: 'reset_exp',
        target_type: 'experiment',
        metadata: {},
      }),
      /reset metadata/,
    ],
    [
      'OPEN_MODAL',
      createOperation('OPEN_MODAL', {
        page_id: 'page_02_question_generation',
        page_type: 'B1_TEXT_SINGLE',
        target_id: 'question_source_modal',
        target_type: 'modal',
      }),
      /content_id/,
    ],
    [
      'CLOSE_MODAL',
      createOperation('CLOSE_MODAL', {
        page_id: 'page_02_question_generation',
        page_type: 'B1_TEXT_SINGLE',
        target_id: 'question_source_modal',
        target_type: 'modal',
        metadata: { dwell_ms: 100 },
      }),
      /content_id/,
    ],
    [
      'CONTENT_ACTIVATE',
      createOperation('CONTENT_ACTIVATE', {
        page_id: 'page_02_question_generation',
        page_type: 'B1_TEXT_SINGLE',
        target_id: 'chat_bubble_02_01',
        target_type: 'content',
      }),
      /content_id/,
    ],
    [
      'ADD_ROW',
      createOperation('ADD_ROW', {
        page_id: 'page_12_solution_selection',
        page_type: 'E1_CHART_PLAN_DECISION',
        target_id: 'add_row_button',
        target_type: 'table',
      }),
      /row_id/,
    ],
    [
      'SET_PLAN_PARAM',
      createOperation('SET_PLAN_PARAM', {
        page_id: 'page_12_solution_selection',
        page_type: 'E1_CHART_PLAN_DECISION',
        target_id: 'row_1_plan_param_1',
        target_type: 'table',
        row_id: 'row_1',
      }),
      /param_id/,
    ],
    [
      'CHART_HOVER',
      createOperation('CHART_HOVER', {
        page_id: 'page_12_solution_selection',
        page_type: 'E1_CHART_PLAN_DECISION',
        target_id: 'banana_browning_chart',
        target_type: 'chart',
      }),
      /chart_id/,
    ],
    [
      'CHART_HOVER',
      createOperation('CHART_HOVER', {
        page_id: 'page_12_solution_selection',
        page_type: 'E1_CHART_PLAN_DECISION',
        target_id: 'banana_browning_chart',
        target_type: 'chart',
        chart_id: 'banana_browning_chart',
      }),
      /point_id/,
    ],
    [
      'SUBMIT_ATTEMPT',
      createOperation('SUBMIT_ATTEMPT', {
        target_id: 'next_button',
        target_type: 'button',
        submit_attempt_id: 'submit-1',
      }),
      /validation_status/,
    ],
    [
      'TEXT_CHANGE',
      createOperation('TEXT_CHANGE', {
        target_id: 'question_1_answer',
        target_type: 'text',
      }),
      /field_id/,
    ],
    [
      'SELECT_ANSWER',
      createOperation('SELECT_ANSWER', {
        target_id: 'question_1_option_b',
        target_type: 'radio',
        question_id: 'question_1',
      }),
      /option_id/,
    ],
  ])('rejects %s when event-specific data is missing', (_eventType, operation, message) => {
    expect(() => validateTraceMark(markWithOperations([validMark.operationList[0], operation]))).toThrow(message);
  });

  it('accepts CHART_HOVER with chart and point IDs', () => {
    const chartHover = createOperation('CHART_HOVER', {
      page_id: 'page_12_solution_selection',
      page_type: 'E1_CHART_PLAN_DECISION',
      target_id: 'banana_browning_chart',
      target_type: 'chart',
      chart_id: 'banana_browning_chart',
      point_id: 'day_6_point',
      metadata: { hover_ms: 250 },
    });

    expect(() => validateTraceMark(markWithOperations([validMark.operationList[0], chartHover]))).not.toThrow();
  });

  it('accepts operations emitted by createPageTraceLogger', () => {
    const operationList: any[] = [];
    const logger = createPageTraceLogger({
      page: {
        legacyPageId: 'simulation_question_1',
        standardPageId: 'page_09_experiment_question_1',
        pageIndex: 9,
        pageType: 'D2_SIMULATION_QUESTION',
        lifecycleMode: 'l2-trace',
        requiredFields: ['question_1_answer'],
      },
      pageNumber: '1.10',
      logOperation: (operation) => {
        operationList.push({ ...operation, code: operationList.length + 1 });
      },
      now: () => new Date('2026-06-03T02:10:00.000Z'),
      idFactory: {
        traceId: () => `trace-${operationList.length + 1}`,
        submitAttemptId: () => 'submit-1',
      },
    });

    logger.startPage();
    logger.textFocus('question_1_answer', '');
    logger.textChange('question_1_answer', '', '香蕉为什么变黑', { flush_reason: 'submit' });
    logger.submitAttempt({ validationStatus: 'success' });

    expect(() =>
      validateTraceMark({
        ...validMark,
        operationList,
      })
    ).not.toThrow();
  });
});
